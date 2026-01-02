import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import type { EventTypeSummary } from '../hooks/useAnalyticsQuery';

interface AnalyticsChartProps {
  summary: EventTypeSummary | null;
  loading: boolean;
}

const COLORS = {
  rfq: '#3b82f6', // Blue
  rfi: '#8b5cf6', // Purple
};

export function AnalyticsChart({ 
  summary, 
  loading
}: AnalyticsChartProps) {
  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p className="muted">Loading chart...</p>
      </div>
    );
  }

  if (!summary || summary.totalEvents === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p className="muted">No data to display. Run a query to see the event count.</p>
      </div>
    );
  }

  const chartData = [
    { name: 'RFQ', count: summary.rfqCount, color: COLORS.rfq },
    { name: 'RFI', count: summary.rfiCount, color: COLORS.rfi },
  ].filter(item => item.count > 0);

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
            {summary.totalEvents.toLocaleString()}
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
            {summary.rfqCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
            {summary.totalEvents > 0 ? `${((summary.rfqCount / summary.totalEvents) * 100).toFixed(1)}%` : '0%'} of total
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
            {summary.rfiCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
            {summary.totalEvents > 0 ? `${((summary.rfiCount / summary.totalEvents) * 100).toFixed(1)}%` : '0%'} of total
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 && (
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
            Events by Type
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
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
                  barSize={50}
                >
                  {chartData.map((entry, index) => (
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

      {/* Info */}
      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem', 
        background: '#f8fafc', 
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        textAlign: 'center'
      }}>
        <p className="muted" style={{ margin: 0 }}>
          💡 These counts reflect all events matching your filters, independent of table pagination.
        </p>
      </div>
    </div>
  );
}
