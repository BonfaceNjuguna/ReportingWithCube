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

  const previewQuery = useMemo(() => {
    try {
      return JSON.parse(queryText) as AnalyticsQuery;
    } catch {
      return initialQuery;
    }
  }, [initialQuery, queryText]);

  const summary = useMemo(() => getSummary(previewQuery), [previewQuery]);

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
      <div className="editor__meta">
        <div>
          <p className="eyebrow">Analytics API</p>
          <h2 className="editor__title">Query builder</h2>
          <p className="panel__subtitle">Tune dataset, filters, and metrics for your analytics request.</p>
        </div>
        <span className="pill">{loading ? 'Running query…' : 'Ready'}</span>
      </div>

      <div className="query-summary">
        <div className="summary-tile">
          <p className="eyebrow">Dataset</p>
          <p className="panel__title">{summary.dataset}</p>
        </div>
        <div className="summary-tile">
          <p className="eyebrow">KPIs</p>
          <p className="panel__title">{summary.kpiCount}</p>
        </div>
        <div className="summary-tile">
          <p className="eyebrow">Group by</p>
          <p className="panel__title">{summary.groupByCount}</p>
        </div>
        <div className="summary-tile">
          <p className="eyebrow">Filters</p>
          <p className="panel__title">{previewQuery.filters?.length ?? 0}</p>
        </div>
      </div>

      <div className="panel__inline">
        <h4>Groupings</h4>
        <div className="chip-group">
          {previewQuery.groupBy?.map((field) => (
            <span className="chip" key={field}>
              {field}
            </span>
          )) || <span className="muted">No grouping</span>}
        </div>
        <h4>KPIs</h4>
        <div className="chip-group">
          {previewQuery.kpis?.map((field) => (
            <span className="chip" key={field}>
              {field}
            </span>
          ))}
        </div>
        <h4>Filters</h4>
        <div className="chip-group">
          {(previewQuery.filters ?? []).map((filter, index) => (
            <span className="chip" key={`${filter.field}-${index}`}>
              {filter.field} {filter.operator} {String(filter.value)}
            </span>
          ))}
        </div>
      </div>

      <label className="field">
        <span className="field__label">Request body (JSON)</span>
        <textarea
          className="field__input field__input--code"
          spellCheck={false}
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
          rows={18}
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
