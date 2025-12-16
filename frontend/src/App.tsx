import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { QueryEditor } from './components/QueryEditor';
import { QueryResult } from './components/QueryResult';
import { useAnalyticsQuery } from './hooks/useAnalyticsQuery';
import type { AnalyticsQuery } from './types/analytics';

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

  const tabularData = useMemo(() => deriveTableRows(data), [data]);

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

            {activeTab === 'table' && (
              <ResultTable rows={tabularData} loading={loading} error={error} />
            )}

            {activeTab === 'chart' && (
              <ResultChart rows={tabularData} loading={loading} error={error} />
            )}

            {activeTab === 'details' && <QueryResult data={data} loading={loading} error={error} compact />}
          </div>
        </section>
      </section>
    </main>
  );
}

interface TableRow {
  supplier: string;
  events: number;
  avgDays: number;
  spend: number;
}

const fallbackRows: TableRow[] = [
  { supplier: 'Acme', events: 12, avgDays: 5.3, spend: 2.1 },
  { supplier: 'Globex', events: 8, avgDays: 7.1, spend: 1.4 },
];

function deriveTableRows(data: unknown): TableRow[] {
  const payload = (data as { data?: unknown } | null)?.data;

  if (!payload) return fallbackRows;

  if (Array.isArray(payload)) {
    return normalizeRows(payload);
  }

  if (typeof payload === 'object' && payload !== null && 'rows' in payload) {
    const rows = (payload as { rows?: unknown }).rows;
    if (Array.isArray(rows)) return normalizeRows(rows);
  }

  return fallbackRows;
}

function normalizeRows(rows: unknown[]): TableRow[] {
  return rows
    .filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
    .map((row) => ({
      supplier: String(row.supplier ?? row.name ?? row.label ?? '—'),
      events: Number(row.events ?? row.event_count ?? row.count ?? 0),
      avgDays: Number(row.avg_days ?? row.cycle_time_days ?? row.average ?? 0),
      spend: Number(row.spend ?? row.total ?? row.amount ?? 0),
    }))
    .filter((row) => row.supplier !== '—');
}

function ResultTable({ rows, loading, error }: { rows: TableRow[]; loading: boolean; error: string | null }) {
  if (loading) {
    return <p className="muted">Fetching data…</p>;
  }

  return (
    <div className="table-card">
      {error && (
        <div className="alert alert--error">
          <strong>Using sample data.</strong>
          <p>{error}</p>
        </div>
      )}

      <div className="table-card__filters">
        <span className="pill">Event date: last 90 days</span>
        <span className="pill">Status: Awarded</span>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th># Events</th>
              <th>Avg days</th>
              <th>Spend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.supplier}>
                <td>{row.supplier}</td>
                <td>{row.events}</td>
                <td>{row.avgDays}</td>
                <td>{row.spend.toFixed(1)}M</td>
              </tr>
            ))}
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

function ResultChart({ rows, loading, error }: { rows: TableRow[]; loading: boolean; error: string | null }) {
  if (loading) return <p className="muted">Preparing chart…</p>;

  const maxEvents = Math.max(...rows.map((row) => row.events), 0);

  return (
    <>
      {error && (
        <div className="alert alert--error">
          <strong>Using sample data.</strong>
          <p>{error}</p>
        </div>
      )}
      <div className="chart">
        {rows.map((row) => {
          const height = maxEvents ? (row.events / maxEvents) * 100 : 0;
          return (
            <div key={row.supplier} className="chart__bar">
              <div className="chart__bar-fill" style={{ height: `${height}%` }}>
                <span className="chart__value">{row.events}</span>
              </div>
              <span className="chart__label">{row.supplier}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default App;
