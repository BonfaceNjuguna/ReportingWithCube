import { useEffect, useMemo, useState } from 'react';
import { useDatasetSchema } from '../hooks/useDatasetSchema';
import type { AnalyticsFilter, AnalyticsQuery, DatasetSchema, FilterOperator } from '../types/analytics';

interface QueryEditorProps {
  initialQuery: AnalyticsQuery;
  loading: boolean;
  onSubmit: (query: AnalyticsQuery) => void;
  error?: string | null;
}

export function QueryEditor({ initialQuery, loading, onSubmit, error }: QueryEditorProps) {
  const [query, setQuery] = useState<AnalyticsQuery>(initialQuery);
  const { datasets, schema, loading: schemaLoading, error: schemaError, refreshSchema } = useDatasetSchema(initialQuery.datasetId);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (query.datasetId && query.datasetId !== schema?.id) {
      refreshSchema(query.datasetId);
    }
  }, [query.datasetId, refreshSchema, schema?.id]);

  const summary = useMemo(() => getSummary(query, schema), [query, schema]);
  const previewPayload = useMemo(() => JSON.stringify(buildPayload(query, schema), null, 2), [query, schema]);

  const availableFilters = schema?.filters ?? [];
  const availableDimensions = schema?.dimensions ?? [];
  const availableMeasures = schema?.measures ?? [];

  const toggleSelection = (value: string, key: 'kpis' | 'groupBy') => {
    setQuery((prev) => {
      const current = prev[key] ?? [];
      const exists = current.includes(value);
      const next = exists ? current.filter((item) => item !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const updateDataset = (datasetId: string) => {
    setQuery((prev) => ({ ...prev, datasetId, kpis: [], groupBy: [], filters: [] }));
  };

  const addFilter = () => {
    const defaultField = availableFilters[0]?.id ?? '';
    const defaultOperator = availableFilters[0]?.operators[0] ?? 'equals';
    setQuery((prev) => ({
      ...prev,
      filters: [...(prev.filters ?? []), { field: defaultField, operator: defaultOperator, value: '' }],
    }));
  };

  const updateFilter = (index: number, updated: Partial<AnalyticsFilter>) => {
    setQuery((prev) => {
      const filters = [...(prev.filters ?? [])];
      const existing = filters[index] ?? { field: '', operator: 'equals', value: '' };
      filters[index] = { ...existing, ...updated } as AnalyticsFilter;
      return { ...prev, filters };
    });
  };

  const removeFilter = (index: number) => {
    setQuery((prev) => {
      const next = [...(prev.filters ?? [])];
      next.splice(index, 1);
      return { ...prev, filters: next };
    });
  };

  const handleSubmit = () => {
    const payload = buildPayload(query, schema);
    onSubmit(payload);
  };

  const resetToDefault = () => {
    setQuery(initialQuery);
  };

  return (
    <div className="panel">
      <div className="editor__meta">
        <div>
          <p className="eyebrow">Analytics API</p>
          <h2 className="editor__title">Query builder</h2>
          <p className="panel__subtitle">Pick your dataset, KPIs, and filters. We will send the exact payload to the backend.</p>
        </div>
        <span className="pill">{loading ? 'Running query…' : 'Ready'}</span>
      </div>

      <div className="query-summary">
        <div className="summary-tile">
          <p className="eyebrow">Dataset</p>
          <p className="panel__title">{summary.dataset}</p>
          <p className="muted">{summary.datasetLabel}</p>
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
          <p className="panel__title">{summary.filterCount}</p>
        </div>
      </div>

      <div className="field">
        <span className="field__label">Dataset</span>
        <select
          className="field__input"
          value={query.datasetId}
          onChange={(event) => updateDataset(event.target.value)}
          disabled={schemaLoading || loading}
        >
          {!datasets.length && query.datasetId && <option value={query.datasetId}>{query.datasetId}</option>}
          {datasets.map((dataset) => (
            <option value={dataset.id} key={dataset.id}>
              {dataset.label}
            </option>
          ))}
        </select>
      </div>

      <div className="panel__inline">
        <div className="editor-section">
          <div className="editor-section__header">
            <div>
              <p className="eyebrow">Groupings</p>
              <p className="panel__title">Choose dimensions to group by</p>
            </div>
            <span className="muted">{availableDimensions.length} fields</span>
          </div>
          <div className="option-grid">
            {availableDimensions.map((dimension) => (
              <label key={dimension.id} className="option-card">
                <input
                  type="checkbox"
                  checked={query.groupBy?.includes(dimension.id) ?? false}
                  onChange={() => toggleSelection(dimension.id, 'groupBy')}
                />
                <div>
                  <p className="option-card__title">{dimension.label}</p>
                  <p className="muted">{dimension.id}</p>
                </div>
              </label>
            ))}
            {!availableDimensions.length && <p className="muted">No dimensions available.</p>}
          </div>
        </div>

        <div className="editor-section">
          <div className="editor-section__header">
            <div>
              <p className="eyebrow">KPIs</p>
              <p className="panel__title">Select measures to fetch</p>
            </div>
            <span className="muted">{availableMeasures.length} measures</span>
          </div>
          <div className="option-grid">
            {availableMeasures.map((measure) => (
              <label key={measure.id} className="option-card">
                <input
                  type="checkbox"
                  checked={query.kpis.includes(measure.id)}
                  onChange={() => toggleSelection(measure.id, 'kpis')}
                />
                <div>
                  <p className="option-card__title">{measure.label}</p>
                  <p className="muted">{measure.format}</p>
                </div>
              </label>
            ))}
            {!availableMeasures.length && <p className="muted">No measures found.</p>}
          </div>
        </div>
      </div>

      <div className="editor-section">
        <div className="editor-section__header">
          <div>
            <p className="eyebrow">Filters</p>
            <p className="panel__title">Refine the dataset</p>
          </div>
          <button
            type="button"
            className="button button--ghost"
            onClick={addFilter}
            disabled={loading || !availableFilters.length}
          >
            Add filter
          </button>
        </div>

        <div className="filter-list">
          {(query.filters ?? []).map((filter, index) => {
            const operators = availableFilters.find((f) => f.id === filter.field)?.operators ?? ['equals'];
            return (
              <div className="filter-row" key={`${filter.field}-${index}`}>
                <select
                  className="field__input"
                  value={filter.field}
                  onChange={(event) => updateFilter(index, { field: event.target.value })}
                  disabled={loading}
                >
                  {availableFilters.map((available) => (
                    <option value={available.id} key={available.id}>
                      {available.id}
                    </option>
                  ))}
                </select>
                <select
                  className="field__input"
                  value={filter.operator}
                  onChange={(event) => updateFilter(index, { operator: event.target.value as FilterOperator })}
                  disabled={loading}
                >
                  {operators.map((operator) => (
                    <option value={operator} key={operator}>
                      {operator}
                    </option>
                  ))}
                </select>
                <input
                  className="field__input"
                  type="text"
                  placeholder="Value"
                  value={String(filter.value ?? '')}
                  onChange={(event) => updateFilter(index, { value: event.target.value })}
                  disabled={loading}
                />
                <button className="button button--ghost" type="button" onClick={() => removeFilter(index)} disabled={loading}>
                  Remove
                </button>
              </div>
            );
          })}
          {!query.filters?.length && <p className="muted">No filters yet. Add one to refine the request.</p>}
        </div>
      </div>

      <label className="field">
        <span className="field__label">Request preview</span>
        <textarea className="field__input field__input--code" readOnly spellCheck={false} value={previewPayload} rows={16} />
      </label>

      {(error || schemaError) && (
        <div className="alert alert--error">
          <strong>Something went wrong.</strong>
          <p>{error ?? schemaError}</p>
        </div>
      )}

      <div className="actions">
        <button className="button button--secondary" type="button" onClick={resetToDefault} disabled={loading}>
          Reset to example
        </button>
        <button className="button" type="button" onClick={handleSubmit} disabled={loading || schemaLoading}>
          {loading ? 'Running query…' : 'Run query'}
        </button>
      </div>
    </div>
  );
}

function buildPayload(query: AnalyticsQuery, schema?: DatasetSchema | null): AnalyticsQuery {
  const filters = (query.filters ?? [])
    .filter((filter) => filter.field && filter.operator)
    .map((filter) => {
      const schemaFilter = schema?.filters.find((item) => item.id === filter.field);
      const normalizedValue = normalizeFilterValue(filter.value, filter.operator, schemaFilter?.type);
      return { ...filter, value: normalizedValue } as AnalyticsFilter;
    });

  return { ...query, filters };
}

function normalizeFilterValue(value: AnalyticsFilter['value'], operator: FilterOperator, type?: string) {
  if (Array.isArray(value)) {
    return value.map((item) => coerceValue(item, type));
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (operator === 'in' || operator === 'notIn' || operator === 'inDateRange') {
      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => coerceValue(item, type));
    }
    return coerceValue(trimmed, type);
  }

  return value;
}

function coerceValue(value: string | number | boolean, type?: string): string | number | boolean {
  if (typeof value !== 'string') return value;

  if (type === 'number') {
    const numeric = Number(value);
    return Number.isNaN(numeric) ? value : numeric;
  }

  if (type === 'boolean') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }

  return value;
}

function getSummary(query: Partial<AnalyticsQuery>, schema?: DatasetSchema | null) {
  const datasetLabel = schema?.label ?? '—';
  return {
    dataset: query.datasetId ?? '—',
    datasetLabel,
    kpiCount: query.kpis?.length ?? 0,
    groupByCount: query.groupBy?.length ?? 0,
    filterCount: query.filters?.length ?? 0,
  };
}
