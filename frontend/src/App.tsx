import { useEffect } from 'react';
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
  const { data, loading, error, runQuery } = useAnalyticsQuery();

  useEffect(() => {
    runQuery(defaultQuery);
  }, [runQuery]);

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">Reporting With Cube</p>
        <h1>Analytics workspace</h1>
        <p className="hero__subtitle">
          Send structured analytics queries to your backend API and inspect the response in real time. Update the
          example payload to filter, sort, and paginate events without touching the component logic.
        </p>
      </header>

      <QueryEditor initialQuery={defaultQuery} loading={loading} onSubmit={runQuery} error={error} />
      <QueryResult data={data} loading={loading} error={error} />
    </main>
  );
}

export default App;
