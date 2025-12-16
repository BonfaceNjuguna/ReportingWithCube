import { useEffect, useMemo, useState } from 'react';
import type { AnalyticsQuery } from '../types/analytics';

interface QueryEditorProps {
  initialQuery: AnalyticsQuery;
  loading: boolean;
  onSubmit: (query: AnalyticsQuery) => void;
  error?: string | null;
}

export function QueryEditor({ initialQuery, loading, onSubmit, error }: QueryEditorProps) {
  const [queryText, setQueryText] = useState(() => JSON.stringify(initialQuery, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    setQueryText(JSON.stringify(initialQuery, null, 2));
  }, [initialQuery]);

  const summary = useMemo(() => {
    try {
      const parsed = JSON.parse(queryText) as Partial<AnalyticsQuery>;
      return getSummary(parsed);
    } catch (err) {
      return getSummary(initialQuery);
    }
  }, [initialQuery, queryText]);

  const handleSubmit = () => {
    setParseError(null);

    try {
      const parsed = JSON.parse(queryText) as AnalyticsQuery;
      onSubmit(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid JSON payload';
      setParseError(message);
    }
  };

  const resetToDefault = () => {
    setQueryText(JSON.stringify(initialQuery, null, 2));
    setParseError(null);
  };

  return (
    <div className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Analytics API</p>
          <h2 className="panel__title">Configure your query</h2>
          <p className="panel__subtitle">
            Adjust the request payload below to filter, sort, or paginate analytics events. The request is sent to
            <code className="code-inline">/api/analytics/v1/query</code> on your backend.
          </p>
        </div>
        <div className="summary">
          <p className="summary__label">Summary</p>
          <p className="summary__value">Dataset: {summary.dataset}</p>
          <p className="summary__value">KPIs: {summary.kpiCount}</p>
          <p className="summary__value">Grouped by: {summary.groupByCount}</p>
        </div>
      </div>

      <label className="field">
        <span className="field__label">Request body (JSON)</span>
        <textarea
          className="field__input field__input--code"
          spellCheck={false}
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
          rows={22}
        />
      </label>

      {(parseError || error) && (
        <div className="alert alert--error">
          <strong>Unable to send request.</strong>
          <p>{parseError ?? error}</p>
        </div>
      )}

      <div className="actions">
        <button className="button button--secondary" type="button" onClick={resetToDefault} disabled={loading}>
          Reset to example
        </button>
        <button className="button" type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Running query…' : 'Run query'}
        </button>
      </div>
    </div>
  );
}

function getSummary(query: Partial<AnalyticsQuery>) {
  return {
    dataset: query.datasetId ?? '—',
    kpiCount: query.kpis?.length ?? 0,
    groupByCount: query.groupBy?.length ?? 0,
  };
}
