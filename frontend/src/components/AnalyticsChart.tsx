import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
  onDrillDown: (field: string, value: string) => void;
  onDrillUp: () => void;
  drillDownPath: Array<{ field: string; value: string }>;
}

type ChartType = 'bar' | 'line' | 'pie' | 'stackedBar' | 'groupedBar';

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
  loading, 
  onDrillDown, 
  onDrillUp,
  drillDownPath 
}: AnalyticsChartProps) {
  const [chartType, setChartType] = useState<ChartType | null>(null);
  const [showTopN, setShowTopN] = useState(true);
  const [topNLimit, setTopNLimit] = useState<number>(10);

  const recommendedChartType = useMemo((): ChartType => {
    const hasTimeDimension = query.groupBy?.some(dim => 
      dim.includes('created_at') || dim.includes('deadline') || dim.includes('date')
    );
    const hasMultipleKPIs = (query.kpis?.length ?? 0) > 1;
    const dimensionCount = query.groupBy?.length ?? 0;

    if (hasTimeDimension) return 'line';
    if (hasMultipleKPIs && dimensionCount === 1) return 'groupedBar';
    if (dimensionCount === 1 && (query.kpis?.length ?? 0) === 1) return 'pie';
    return 'bar';
  }, [query]);

  const activeChartType = chartType ?? recommendedChartType;

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

  // Calculate summary cards
  const summaryCards = useMemo((): SummaryCard[] => {
    if (!chartData.length) return [];
    
    const cards: SummaryCard[] = [];
    const kpiKeys = Object.keys(chartData[0] || {}).filter(key => 
      !key.startsWith('_') && key !== 'name'
    );

    kpiKeys.forEach(key => {
      const total = chartData.reduce((sum, item: any) => sum + (item[key] || 0), 0);
      const avg = total / chartData.length;

      // Determine format based on key name
      const isPercentage = key.toLowerCase().includes('rate') || key.toLowerCase().includes('%');
      const isCurrency = key.toLowerCase().includes('quotation') || key.toLowerCase().includes('total');
      const isCount = key.toLowerCase().includes('count');

      cards.push({
        label: `Total ${key}`,
        value: isPercentage ? `${total.toFixed(1)}%` : total.toLocaleString(),
        format: isPercentage ? 'percent' : isCurrency ? 'currency' : 'number',
        icon: '📊'
      });

      if (!isCount) {
        cards.push({
          label: `Avg ${key}`,
          value: isPercentage ? `${avg.toFixed(1)}%` : avg.toLocaleString(),
          format: isPercentage ? 'percent' : isCurrency ? 'currency' : 'number',
          icon: '📈'
        });
      }
    });

    // Add category count
    cards.unshift({
      label: 'Categories',
      value: aggregatedData.size,
      icon: '🏷️'
    });

    return cards.slice(0, 6); // Show top 6 cards
  }, [chartData, aggregatedData]);

  const kpiKeys = useMemo(() => {
    if (!chartData.length) return [];
    const firstItem = chartData[0];
    return Object.keys(firstItem).filter(key => 
      !key.startsWith('_') && key !== 'name'
    );
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div style={{
        background: 'white',
        padding: '1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{label}</p>
        {payload.map((entry: any, index: number) => {
          const isPercentage = entry.name.toLowerCase().includes('rate') || entry.name.toLowerCase().includes('%');
          const formattedValue = isPercentage 
            ? `${entry.value.toFixed(1)}%` 
            : entry.value.toLocaleString('en-US', { maximumFractionDigits: 2 });
          
          return (
            <p key={index} style={{ color: entry.color, margin: '0.25rem 0' }}>
              <span style={{ fontWeight: 500 }}>{entry.name}:</span> {formattedValue}
            </p>
          );
        })}
      </div>
    );
  };

  const handleBarClick = (data: any) => {
    if (data && data._dimensionField && !data._isOthers) {
      // Find the original dimension ID from query.groupBy that matches this field
      const fieldMapping: Record<string, string[]> = {
        'event_number': ['rfqno', 'number', 'eventno'],
        'event_name': ['rfqname', 'name', 'eventname'],
        'event_type': ['eventtype', 'type'],
        'state_name': ['statename', 'status'],
      };

      const matchesField = (headerKey: string, fieldId: string): boolean => {
        const normalizedKey = headerKey.toLowerCase().replace(/[._]/g, '');
        const normalizedField = fieldId.toLowerCase().replace(/[._]/g, '');
        
        if (normalizedKey.includes(normalizedField)) return true;
        
        const variations = fieldMapping[fieldId] || [];
        return variations.some(v => normalizedKey.includes(v));
      };

      const dimensionId = query.groupBy?.find(dim => 
        matchesField(data._dimensionField, dim)
      );
      
      if (dimensionId) {
        onDrillDown(dimensionId, data.name);
      }
    }
  };

  const handlePieClick = (data: any) => {
    if (data && data.name && !data._isOthers) {
      const dimensionId = query.groupBy?.[0];
      if (dimensionId) {
        onDrillDown(dimensionId, data.name);
      }
    }
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
      {/* Summary Cards */}
      {summaryCards.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {summaryCards.map((card, index) => (
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

      {/* Chart Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Chart Type:</span>
          <button
            className={`button button--small ${activeChartType === 'bar' ? 'button--primary' : 'button--ghost'}`}
            onClick={() => setChartType('bar')}
          >
            📊 Bar
          </button>
          <button
            className={`button button--small ${activeChartType === 'pie' ? 'button--primary' : 'button--ghost'}`}
            onClick={() => setChartType('pie')}
          >
            🥧 Pie
          </button>
          <button
            className={`button button--small ${activeChartType === 'line' ? 'button--primary' : 'button--ghost'}`}
            onClick={() => setChartType('line')}
          >
            📈 Line
          </button>
          {kpiKeys.length > 1 && (
            <>
              <button
                className={`button button--small ${activeChartType === 'stackedBar' ? 'button--primary' : 'button--ghost'}`}
                onClick={() => setChartType('stackedBar')}
              >
                📚 Stacked
              </button>
              <button
                className={`button button--small ${activeChartType === 'groupedBar' ? 'button--primary' : 'button--ghost'}`}
                onClick={() => setChartType('groupedBar')}
              >
                📊 Grouped
              </button>
            </>
          )}
          {chartType && chartType !== recommendedChartType && (
            <button
              className="button button--small button--ghost"
              onClick={() => setChartType(null)}
              style={{ fontSize: '0.75rem' }}
            >
              ↩️ Auto ({recommendedChartType})
            </button>
          )}
        </div>

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

        {/* Drill-down Breadcrumbs */}
        {drillDownPath.length > 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: '#f8fafc',
            borderRadius: '0.5rem',
            flex: 1
          }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>🔍 Drill-down:</span>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {drillDownPath.map((item, index) => (
                <span key={index} style={{ fontSize: '0.875rem' }}>
                  <span className="muted">{item.field}:</span> <strong>{item.value}</strong>
                  {index < drillDownPath.length - 1 && <span className="muted"> → </span>}
                </span>
              ))}
            </div>
            <button
              className="button button--small button--ghost"
              onClick={onDrillUp}
              style={{ marginLeft: 'auto' }}
            >
              ↩️ Back
            </button>
          </div>
        )}
      </div>

      {/* Chart Display */}
      <div style={{ width: '100%', height: '500px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {activeChartType === 'bar' && (
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {kpiKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={COLORS[index % COLORS.length]}
                  onClick={handleBarClick}
                  cursor="pointer"
                />
              ))}
            </BarChart>
          )}

          {activeChartType === 'line' && (
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {kpiKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4, cursor: 'pointer' }}
                  activeDot={{ r: 6, onClick: handleBarClick }}
                />
              ))}
            </LineChart>
          )}

          {activeChartType === 'pie' && (
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={chartData}
                dataKey={kpiKeys[0]}
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label={(entry) => `${entry.name}: ${entry.value}`}
                onClick={handlePieClick}
                cursor="pointer"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          )}

          {activeChartType === 'stackedBar' && (
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {kpiKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={COLORS[index % COLORS.length]}
                  onClick={handleBarClick}
                  cursor="pointer"
                />
              ))}
            </BarChart>
          )}

          {activeChartType === 'groupedBar' && (
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {kpiKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={COLORS[index % COLORS.length]}
                  onClick={handleBarClick}
                  cursor="pointer"
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

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
            💡 <strong>Tip:</strong> Click on chart elements to drill down and filter by that value.
          </p>
          <p className="muted">
            📊 Showing {chartData.length} categories{showTopN && aggregatedData.size > topNLimit ? ` (Top ${topNLimit} + Others)` : ''} • {aggregatedData.size} unique values • Chart type: {activeChartType === recommendedChartType ? `${activeChartType} (recommended)` : activeChartType}
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
