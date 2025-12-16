import type { AnalyticsResponse } from '../types/analytics';

interface QueryResultProps {
  data: AnalyticsResponse | null;
  loading: boolean;
  error: string | null;
  compact?: boolean;
}

export function QueryResult({ data, loading, error, compact = false }: QueryResultProps) {
  const hasData = data !== null && data !== undefined;
  const hasMeta = !!data?.query;

  return (
    <div className={`panel ${compact ? 'panel--compact' : ''}`}>
      {!compact && (
        <div className="panel__header">
          <div>
            <p className="eyebrow">Results</p>
            <h2 className="panel__title">Response preview</h2>
            <p className="panel__subtitle">See the raw response from the analytics API.</p>
          </div>
        </div>
      )}

      {loading && <p className="muted">Fetching data…</p>}
      {!loading && error && (
        <div className="alert alert--error">
          <strong>Request failed.</strong>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && hasMeta && <QueryMetadata data={data} />}
      {!loading && !error && hasData && <ResponseBlock data={data} />}
      {!loading && !error && !data && <p className="muted">Run a query to see results here.</p>}
    </div>
  );
}

function QueryMetadata({ data }: { data: AnalyticsResponse | null }) {
  if (!data?.query) return null;

  const { dataset, rowCount, executionTimeMs, fromCache } = data.query;
  const columnCount = data.columns?.length ?? 0;

  return (
    <div className="meta-grid">
      <div className="summary-tile">
        <p className="eyebrow">Dataset</p>
        <p className="panel__title">{dataset}</p>
      </div>
      <div className="summary-tile">
        <p className="eyebrow">Rows</p>
        <p className="panel__title">{rowCount}</p>
      </div>
      <div className="summary-tile">
        <p className="eyebrow">Columns</p>
        <p className="panel__title">{columnCount}</p>
      </div>
      <div className="summary-tile">
        <p className="eyebrow">Execution time</p>
        <p className="panel__title">{executionTimeMs} ms</p>
        <p className="muted">{fromCache ? 'Cached' : 'Live'} response</p>
      </div>
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
