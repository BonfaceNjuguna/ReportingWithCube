import type { AnalyticsResponse } from '../types/analytics';

interface QueryResultProps {
  data: AnalyticsResponse | null;
  loading: boolean;
  error: string | null;
}

export function QueryResult({ data, loading, error }: QueryResultProps) {
  const hasData = data !== null && data !== undefined;

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Results</p>
          <h2 className="panel__title">Response preview</h2>
          <p className="panel__subtitle">See the raw response from the analytics API.</p>
        </div>
      </div>

      {loading && <p className="muted">Fetching data…</p>}
      {!loading && error && (
        <div className="alert alert--error">
          <strong>Request failed.</strong>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && hasData && <ResponseBlock data={data} />}
      {!loading && !error && !data && <p className="muted">Run a query to see results here.</p>}
    </div>
  );
}

function ResponseBlock({ data }: { data: AnalyticsResponse | null }) {
  return (
    <pre className="code-block" aria-live="polite">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
