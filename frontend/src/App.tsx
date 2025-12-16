import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { QueryEditor } from './components/QueryEditor';
import { QueryResult } from './components/QueryResult';
import { useAnalyticsQuery } from './hooks/useAnalyticsQuery';
import type { AnalyticsQuery, AnalyticsResponse, ColumnMetadata } from './types/analytics';

const defaultQuery: AnalyticsQuery = {
  datasetId: 'events',
  kpis: [
    'invited_suppliers_count',
    'viewed_suppliers_count',
    'offered_suppliers_count',
    'rejected_suppliers_count',
    'quotation_total_avg',
    'best_quotation_total',
    'offer_period_days',
    'cycle_time_days',
    'quotation_rate',
    'reject_rate',
  ],
  groupBy: [
    'event_id',
    'event_number',
    'event_name',
    'created_by',
    'created_at',
    'started_at',
    'deadline',
    'awarded_at',
    'state_name',
    'technical_contact',
    'commercial_contact',
    'purchase_organisation',
    'company_code',
    'purchase_group',
    'event_type',
  ],
  filters: [
    {
      field: 'event_type',
      operator: 'equals',
      value: 'RFQ',
    },
    {
      field: 'state_name',
      operator: 'equals',
      value: 'Closed',
    },
  ],
  sort: {
    by: 'created_at',
    direction: 'desc',
  },
  page: {
    limit: 100,
    offset: 0,
  },
};

function App() {
  const [activeTab, setActiveTab] = useState<'table' | 'chart' | 'details'>('table');
  const { data, loading, error, runQuery } = useAnalyticsQuery();

  const tableData = useMemo(() => deriveTableData(data), [data]);
  const chartSeries = useMemo(() => deriveChartSeries(tableData), [tableData]);

  useEffect(() => {
    runQuery(defaultQuery);
  }, [runQuery]);

  return (
    <main className="app">
      <header className="app__bar">
        <div>
          <p className="eyebrow">Active report</p>
          <h1>Cycle Time by Supplier</h1>
          <p className="muted">RFQ / RFP, last 90 days</p>
        </div>
        <div className="header-actions">
          <button className="button button--ghost" type="button">
            Share
          </button>
          <button className="button" type="button">
            Save
          </button>
        </div>
      </header>

      <section className="layout">
        <aside className="layout__sidebar">
          <QueryEditor initialQuery={defaultQuery} loading={loading} onSubmit={runQuery} error={error} />
        </aside>

        <section className="layout__content">
          <div className="panel panel--flush">
            <div className="panel__header">
              <div>
                <p className="eyebrow">Report preview</p>
                <h2 className="panel__title">Cycle Time by Supplier</h2>
                <p className="panel__subtitle">Grouped by supplier with awarded status in the last 90 days.</p>
              </div>
              <div className="breadcrumbs">
                <span>Dataset: events</span>
                <span>Filters: RFQ • Closed</span>
                <span>Grouped by supplier</span>
              </div>
            </div>

            <div className="tabs">
              {['table', 'chart', 'details'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`tab ${activeTab === tab ? 'tab--active' : ''}`}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                >
                  {tab === 'table' && 'Table'}
                  {tab === 'chart' && 'Chart'}
                  {tab === 'details' && 'Details'}
                </button>
              ))}
            </div>

            {activeTab === 'table' && <ResultTable table={tableData} loading={loading} error={error} />}

            {activeTab === 'chart' && (
              <ResultChart series={chartSeries} loading={loading} error={error} isSample={tableData.source === 'sample'} />
            )}

            {activeTab === 'details' && <QueryResult data={data} loading={loading} error={error} compact />}
          </div>
        </section>
      </section>
    </main>
  );
}

interface TableData {
  headers: TableHeader[];
  rows: Array<Record<string, unknown>>;
  source: 'api' | 'sample';
}

interface TableHeader {
  key: string;
  label: string;
}

interface ChartPoint {
  label: string;
  value: number;
}

const fallbackTable: TableData = {
  source: 'sample',
  headers: [
    { key: 'supplier', label: 'Supplier' },
    { key: 'events', label: '# Events' },
    { key: 'avgDays', label: 'Avg days' },
    { key: 'spend', label: 'Spend (M)' },
  ],
  rows: [
    { supplier: 'Acme', events: 12, avgDays: 5.3, spend: 2.1 },
    { supplier: 'Globex', events: 8, avgDays: 7.1, spend: 1.4 },
  ],
};

function deriveTableData(response: AnalyticsResponse | null): TableData {
  const payload = response?.data;

  if (Array.isArray(payload)) {
    const rows = payload.filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null);
    if (rows.length) {
      const headers = deriveHeaders(rows, response?.columns);
      return { headers, rows, source: 'api' };
    }
  }

  return fallbackTable;
}

function deriveHeaders(rows: Array<Record<string, unknown>>, columns?: ColumnMetadata[]): TableHeader[] {
  if (columns?.length) {
    return columns.map((column) => ({ key: column.name, label: column.label ?? startCase(column.name) }));
  }

  const sampleRow = rows[0];
  if (!sampleRow) return [];

  return Object.keys(sampleRow).map((key) => ({ key, label: startCase(key) }));
}

function deriveChartSeries(table: TableData): ChartPoint[] {
  if (!table.rows.length) return [];

  const dimensionKey = table.headers.find((header) => typeof table.rows[0]?.[header.key] === 'string')?.key ?? table.headers[0]?.key;
  const numericKey = table.headers.find((header) => table.rows.some((row) => typeof row[header.key] === 'number'))?.key;

  if (!dimensionKey || !numericKey) return [];

  return table.rows.map((row, index) => ({
    label: String(row[dimensionKey] ?? `Row ${index + 1}`),
    value: Number(row[numericKey] ?? 0),
  }));
}

function startCase(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function ResultTable({ table, loading, error }: { table: TableData; loading: boolean; error: string | null }) {
  if (loading) {
    return <p className="muted">Fetching data…</p>;
  }

  const hasRows = table.rows.length > 0;

  return (
    <div className="table-card">
      {(error || table.source === 'sample') && (
        <div className="alert alert--error">
          <strong>{table.source === 'sample' ? 'Showing sample data' : 'Request failed'}</strong>
          <p>{error ?? 'Run a query to fetch live results.'}</p>
        </div>
      )}

      <div className="table-card__filters">
        <span className="pill">Dynamic results</span>
        <span className="pill">Groupings & KPIs match your selections</span>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {table.headers.map((header) => (
                <th key={header.key}>{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hasRows ? (
              table.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {table.headers.map((header) => (
                    <td key={header.key}>{renderCell(row[header.key])}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={table.headers.length} className="muted">
                  No results yet. Adjust your query and try again.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-card__actions">
        <button className="button button--ghost" type="button">
          Export CSV
        </button>
        <button className="button button--ghost" type="button">
          Export XLS
        </button>
      </div>
    </div>
  );
}

function renderCell(value: unknown) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function ResultChart({
  series,
  loading,
  error,
  isSample,
}: {
  series: ChartPoint[];
  loading: boolean;
  error: string | null;
  isSample: boolean;
}) {
  if (loading) return <p className="muted">Preparing chart…</p>;

  if (!series.length) {
    return <p className="muted">Add a grouping and KPI to see a chart.</p>;
  }

  const maxValue = Math.max(...series.map((item) => item.value), 0);

  return (
    <>
      {(error || isSample) && (
        <div className="alert alert--error">
          <strong>{isSample ? 'Using sample data' : 'Request failed'}</strong>
          <p>{error ?? 'Run a query to replace the demo chart.'}</p>
        </div>
      )}
      <div className="chart">
        {series.map((item, index) => {
          const height = maxValue ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={`${item.label}-${index}`} className="chart__bar">
              <div className="chart__bar-fill" style={{ height: `${height}%` }}>
                <span className="chart__value">{item.value}</span>
              </div>
              <span className="chart__label">{item.label}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default App;
