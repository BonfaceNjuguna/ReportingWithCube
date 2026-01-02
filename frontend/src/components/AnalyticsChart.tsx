import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList,
  PieChart,
  Pie,
} from 'recharts';
import type { ChartSummaryData } from '../hooks/useAnalyticsQuery';

interface AnalyticsChartProps {
  summary: ChartSummaryData | null;
  loading: boolean;
}

const COLORS = {
  rfq: '#3b82f6', // Blue
  rfi: '#8b5cf6', // Purple
};

// Status colors - 5 workflow states
const STATUS_COLORS: Record<string, string> = {
  'InPreparation': '#f59e0b', // Amber - being prepared
  'Running': '#22c55e',       // Green - active/open
  'Closed': '#6366f1',        // Indigo - finished
  'Completed': '#10b981',     // Emerald - successfully done
  'Canceled': '#ef4444',      // Red - cancelled
};

const getStatusColor = (status: string): string => {
  // Try exact match first
  if (STATUS_COLORS[status]) return STATUS_COLORS[status];
  
  // Try case-insensitive match
  const lowerStatus = status.toLowerCase();
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    if (key.toLowerCase() === lowerStatus) return color;
  }
  
  // Default gray for unknown statuses
  return '#9ca3af';
};

// Friendly status labels for display
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'InPreparation': 'In Preparation',
    'Running': 'Running',
    'Closed': 'Closed',
    'Completed': 'Completed',
    'Canceled': 'Canceled',
  };
  return labels[status] || status;
};

export function AnalyticsChart({ 
  summary, 
  loading
}: AnalyticsChartProps) {
  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p className="muted">Loading charts...</p>
      </div>
    );
  }

  if (!summary || summary.eventTypeSummary.totalEvents === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p className="muted">No data to display. Run a query to see the event count.</p>
      </div>
    );
  }

  const { eventTypeSummary, statusBreakdown } = summary;

  const eventTypeChartData = [
    { name: 'RFQ', count: eventTypeSummary.rfqCount, color: COLORS.rfq },
    { name: 'RFI', count: eventTypeSummary.rfiCount, color: COLORS.rfi },
  ].filter(item => item.count > 0);

  // Aggregate status breakdown (combine same status across event types)
  const statusAggregated = statusBreakdown.reduce((acc, item) => {
    const existing = acc.find(s => s.status === item.status);
    if (existing) {
      existing.count += item.count;
    } else {
      acc.push({ status: item.status, count: item.count });
    }
    return acc;
  }, [] as { status: string; count: number }[]);

  // Sort by count and prepare for pie chart
  statusAggregated.sort((a, b) => b.count - a.count);
  const statusPieData = statusAggregated.map(item => ({
    name: getStatusLabel(item.status),
    value: item.count,
    color: getStatusColor(item.status),
  }));

  return (
    <div className="chart-container">
      {/* Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* Total Events Card */}
        <div style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '1rem',
          color: 'white',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '0.5rem' }}>
            📊 Total Events
          </div>
          <div style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            lineHeight: 1.2
          }}>
            {eventTypeSummary.totalEvents.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
            in selected period
          </div>
        </div>

        {/* RFQ Card */}
        <div style={{
          padding: '1.5rem',
          background: `linear-gradient(135deg, ${COLORS.rfq} 0%, #1d4ed8 100%)`,
          borderRadius: '1rem',
          color: 'white',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '0.5rem' }}>
            📋 RFQ Events
          </div>
          <div style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            lineHeight: 1.2
          }}>
            {eventTypeSummary.rfqCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
            {eventTypeSummary.totalEvents > 0 ? `${((eventTypeSummary.rfqCount / eventTypeSummary.totalEvents) * 100).toFixed(1)}%` : '0%'} of total
          </div>
        </div>

        {/* RFI Card */}
        <div style={{
          padding: '1.5rem',
          background: `linear-gradient(135deg, ${COLORS.rfi} 0%, #6d28d9 100%)`,
          borderRadius: '1rem',
          color: 'white',
          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '0.5rem' }}>
            📝 RFI Events
          </div>
          <div style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            lineHeight: 1.2
          }}>
            {eventTypeSummary.rfiCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
            {eventTypeSummary.totalEvents > 0 ? `${((eventTypeSummary.rfiCount / eventTypeSummary.totalEvents) * 100).toFixed(1)}%` : '0%'} of total
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Events by Type Bar Chart */}
        {eventTypeChartData.length > 0 && (
          <div style={{ 
            background: '#ffffff',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1rem', 
              fontWeight: 600,
              color: '#374151'
            }}>
              📊 Events by Type
            </h3>
            <div style={{ width: '100%', height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={eventTypeChartData} 
                  layout="vertical"
                  margin={{ top: 20, right: 60, left: 60, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 14, fontWeight: 500, fill: '#374151' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    width={50}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[0, 8, 8, 0]}
                    barSize={40}
                  >
                    {eventTypeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList 
                      dataKey="count" 
                      position="right" 
                      formatter={(value) => typeof value === 'number' ? value.toLocaleString() : String(value)}
                      style={{ fontSize: 14, fontWeight: 600, fill: '#374151' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Status Breakdown Pie Chart */}
        {statusPieData.length > 0 && (
          <div style={{ 
            background: '#ffffff',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1rem', 
              fontWeight: 600,
              color: '#374151'
            }}>
              🔄 Events by Status
            </h3>
            <div style={{ width: '100%', height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Status Breakdown Table */}
      {statusAggregated.length > 0 && (
        <div style={{ 
          background: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1rem', 
            fontWeight: 600,
            color: '#374151'
          }}>
            📋 Status Breakdown Detail
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {statusAggregated.map((item, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#f8fafc',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div 
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(item.status),
                  }}
                />
                <span style={{ fontWeight: 500, color: '#374151' }}>
                  {getStatusLabel(item.status)}
                </span>
                <span style={{ 
                  fontWeight: 700, 
                  color: '#1e293b',
                  marginLeft: '0.25rem'
                }}>
                  {item.count.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  ({((item.count / eventTypeSummary.totalEvents) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
