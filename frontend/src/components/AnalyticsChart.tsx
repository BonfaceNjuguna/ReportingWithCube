import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { AnalyticsQuery } from '../types/analytics';

interface TableData {
  headers: Array<{ key: string; label: string }>;
  rows: Array<Record<string, unknown>>;
}

interface AnalyticsChartProps {
  tableData: TableData;
  query: AnalyticsQuery;
  loading: boolean;
}

interface SummaryCard {
  label: string;
  value: string | number;
  format?: string;
  icon?: string;
}

const COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7'
];

const TOP_N_OPTIONS = [10, 25, 50, 100] as const;

export function AnalyticsChart({ 
  tableData, 
  query, 
  loading
}: AnalyticsChartProps) {
  const [showTopN, setShowTopN] = useState(true);
  const [topNLimit, setTopNLimit] = useState<number>(10);

  const createFieldMatcher = () => {
    const fieldMapping: Record<string, string[]> = {
      'event_number': ['rfqno', 'number', 'eventno'],
      'event_name': ['rfqname', 'name', 'eventname'],
      'event_type': ['eventtype', 'type'],
      'state_name': ['statename', 'status'],
      'cycle_time_days': ['cycletimedays', 'cycletime'],
      'created_at': ['createdat', 'created'],
      'deadline': ['deadline', 'duedate'],
    };

    return (headerKey: string, fieldId: string): boolean => {
      const normalizedKey = headerKey.toLowerCase().replace(/[._]/g, '');
      const normalizedField = fieldId.toLowerCase().replace(/[._]/g, '');
      
      if (normalizedKey.includes(normalizedField)) return true;
      
      const variations = fieldMapping[fieldId] || [];
      return variations.some(v => normalizedKey.includes(v));
    };
  };

  const matchesField = createFieldMatcher();

  const { chartData, aggregatedData } = useMemo(() => {
    if (!tableData.rows.length || !tableData.headers.length) {
      return { chartData: [], aggregatedData: new Map() };
    }

    const dimensionHeader = tableData.headers.find(h => 
      query.groupBy?.some(dim => matchesField(h.key, dim))
    );
    
    const kpiHeaders = tableData.headers.filter(h => 
      query.kpis?.some(kpi => matchesField(h.key, kpi))
    );

    if (!dimensionHeader || !kpiHeaders.length) {
      return { chartData: [], aggregatedData: new Map() };
    }

    // Aggregate data by dimension
    const aggregated = new Map<string, Record<string, number>>();
    tableData.rows.forEach(row => {
      const dimValue = String(row[dimensionHeader.key] || 'Unknown');
      
      if (!aggregated.has(dimValue)) {
        aggregated.set(dimValue, {});
      }
      
      const existing = aggregated.get(dimValue)!;
      
      kpiHeaders.forEach(kpiHeader => {
        const value = row[kpiHeader.key];
        const numValue = typeof value === 'number' 
          ? value 
          : parseFloat(String(value)) || 0;
        
        existing[kpiHeader.label] = (existing[kpiHeader.label] || 0) + numValue;
      });
    });

    let dataArray = Array.from(aggregated.entries()).map(([name, values]) => ({
      name,
      ...values,
      _dimensionField: dimensionHeader.key,
      _dimensionLabel: dimensionHeader.label,
    } as any));

    const firstKpiLabel = kpiHeaders[0]?.label;
    if (firstKpiLabel) {
      dataArray.sort((a, b) => (b[firstKpiLabel] || 0) - (a[firstKpiLabel] || 0));
    }

    let finalData = dataArray;
    if (showTopN && dataArray.length > topNLimit) {
      const topN = dataArray.slice(0, topNLimit);
      const others = dataArray.slice(topNLimit);
      
      const othersAggregated: any = { 
        name: `Others (${others.length} items)`,
        _isOthers: true
      };
      kpiHeaders.forEach(kpiHeader => {
        othersAggregated[kpiHeader.label] = others.reduce(
          (sum, item) => sum + (item[kpiHeader.label] || 0), 
          0
        );
      });
      
      finalData = [...topN, othersAggregated];
    }

    return { chartData: finalData, aggregatedData: aggregated };
  }, [tableData, query, showTopN, topNLimit, matchesField]);

  const kpiKeys = useMemo(() => {
    if (!chartData.length) return [];
    const firstItem = chartData[0];
    return Object.keys(firstItem).filter(key => 
      !key.startsWith('_') && key !== 'name'
    );
  }, [chartData]);

  // Categorize KPIs by type for separate charts
  const categorizedKpis = useMemo(() => {
    const categories: Record<string, { label: string; icon: string; keys: string[] }> = {
      time: { label: 'Time Metrics', icon: '⏱️', keys: [] },
      financial: { label: 'Financial Metrics', icon: '💰', keys: [] },
      suppliers: { label: 'Supplier Engagement', icon: '👥', keys: [] },
      rates: { label: 'Conversion Rates', icon: '📈', keys: [] }
    };

    kpiKeys.forEach(key => {
      const lowerKey = key.toLowerCase();
      
      if (lowerKey.includes('days') || lowerKey.includes('cycle') || lowerKey.includes('period')) {
        categories.time.keys.push(key);
      } else if (lowerKey.includes('quotation') && !lowerKey.includes('rate') && !lowerKey.includes('count')) {
        categories.financial.keys.push(key);
      } else if (lowerKey.includes('suppliers') || lowerKey.includes('invited') || lowerKey.includes('viewed') || 
                 lowerKey.includes('offered') || lowerKey.includes('rejected')) {
        categories.suppliers.keys.push(key);
      } else if (lowerKey.includes('rate') || lowerKey.includes('%')) {
        categories.rates.keys.push(key);
      } else {
        // Default to financial for counts or other metrics
        if (lowerKey.includes('count')) {
          categories.suppliers.keys.push(key);
        } else {
          categories.financial.keys.push(key);
        }
      }
    });

    // Filter out empty categories
    return Object.entries(categories)
      .filter(([_, cat]) => cat.keys.length > 0)
      .map(([id, cat]) => ({ id, ...cat }));
  }, [kpiKeys]);

  // Calculate summary cards for a specific set of KPIs
  const getCategorySummaryCards = (kpiKeys: string[]): SummaryCard[] => {
    if (!aggregatedData.size) return [];
    
    const cards: SummaryCard[] = [];
    const firstEntry = Array.from(aggregatedData.values())[0];
    if (!firstEntry) return [];

    kpiKeys.forEach(key => {
      const allValues = Array.from(aggregatedData.values());
      const total = allValues.reduce((sum, item) => sum + (item[key] || 0), 0);
      const avg = total / allValues.length;

      const isPercentage = key.toLowerCase().includes('rate') || key.toLowerCase().includes('%');
      const isCurrency = key.toLowerCase().includes('quotation') || key.toLowerCase().includes('total');
      const isCount = key.toLowerCase().includes('count');

      cards.push({
        label: key,
        value: isPercentage ? `${total.toFixed(1)}%` : total.toLocaleString(),
        format: isPercentage ? 'percent' : isCurrency ? 'currency' : 'number',
        icon: '📊'
      });

      if (!isCount) {
        cards.push({
          label: `${key} (Avg)`,
          value: isPercentage ? `${avg.toFixed(1)}%` : avg.toLocaleString(),
          format: isPercentage ? 'percent' : isCurrency ? 'currency' : 'number',
          icon: '📈'
        });
      }
    });

    return cards;
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p className="muted">Loading chart...</p>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p className="muted">No data to display. Run a query with KPIs and dimensions to see charts.</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      {/* Chart Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        {/* Top N Controls */}
        {aggregatedData.size > 10 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={showTopN}
                onChange={(e) => setShowTopN(e.target.checked)}
              />
              Limit to top
            </label>
            {showTopN && (
              <select 
                value={topNLimit} 
                onChange={(e) => setTopNLimit(Number(e.target.value))}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem'
                }}
              >
                {TOP_N_OPTIONS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            )}
            <span className="muted">of {aggregatedData.size} total</span>
          </div>
        )}
      </div>

      {/* Multiple Charts by Category */}
      {categorizedKpis.map((category) => {
        const categorySummary = getCategorySummaryCards(category.keys);
        
        return (
        <div key={category.id} style={{ marginBottom: '3rem' }}>
          {/* Category Header */}
          <div style={{ 
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '0.5rem',
            borderLeft: '4px solid #3b82f6'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1.125rem', 
              fontWeight: 600,
              color: '#1e293b'
            }}>
              {category.icon} {category.label}
            </h3>
            <p className="muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
              {category.keys.length} metric{category.keys.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Category Summary Cards */}
          {categorySummary.length > 0 && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {categorySummary.map((card, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{card.icon}</div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{card.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>
                    {card.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chart Display */}
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Legend />
                {category.keys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        );
      })}

      {/* Chart Info */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '1rem', 
        background: '#f8fafc', 
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        display: 'flex',
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        <div>
          <p className="muted" style={{ marginBottom: '0.5rem' }}>
            💡 <strong>Tip:</strong> Use the sidebar to adjust KPIs to customize your chart.
          </p>
          <p className="muted">
            📊 Showing {chartData.length} categories{showTopN && aggregatedData.size > topNLimit ? ` (Top ${topNLimit} + Others)` : ''} • {aggregatedData.size} unique values
          </p>
        </div>
        {aggregatedData.size > chartData.length && (
          <div style={{ 
            padding: '0.5rem 1rem', 
            background: '#fef3c7', 
            borderRadius: '0.375rem',
            fontSize: '0.8125rem'
          }}>
            ⚠️ Aggregated {aggregatedData.size - chartData.length} items into "Others"
          </div>
        )}
      </div>
    </div>
  );
}
