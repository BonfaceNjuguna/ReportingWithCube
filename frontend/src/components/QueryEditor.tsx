import { useEffect, useMemo, useState } from 'react';
import { useDatasetSchema } from '../hooks/useDatasetSchema';
import { MultiSelect } from './MultiSelect';
import { AdvancedFilters } from './AdvancedFilters';
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
  const [selectedDateField, setSelectedDateField] = useState<string>('created_at');

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (query.datasetId && query.datasetId !== schema?.id) {
      refreshSchema(query.datasetId);
    }
  }, [query.datasetId, refreshSchema, schema?.id]);

  // Helper to get selected event types from filters
  const getSelectedEventTypes = (): string[] => {
    const filter = query.filters?.find(f => f.field === 'event_type');
    if (!filter) return [];
    if (typeof filter.value === 'string') {
      return filter.value.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (Array.isArray(filter.value)) {
      return filter.value.map(String);
    }
    return [];
  };

  const getSelectedStatuses = (): string[] => {
    const filter = query.filters?.find(f => f.field === 'state_name');
    if (!filter) return [];
    if (typeof filter.value === 'string') {
      return filter.value.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (Array.isArray(filter.value)) {
      return filter.value.map(String);
    }
    return [];
  };

  const summary = useMemo(() => getSummary(query, schema), [query, schema]);
  const previewPayload = useMemo(() => JSON.stringify(buildPayload(query, schema), null, 2), [query, schema]);

  const selectedEventTypes = useMemo(() => getSelectedEventTypes(), [query.filters]);

  // Filter function to check if a field is applicable based on selected event types
  const isApplicable = (applicableTypes: string[] | null | undefined): boolean => {
    if (!applicableTypes || applicableTypes.length === 0) return true; // null/empty means all types
    if (selectedEventTypes.length === 0) return true; // no filter selected, show all
    // Show if any selected event type matches the applicable types
    return selectedEventTypes.some(selected => applicableTypes.includes(selected));
  };

  const availableFilters = (schema?.filters ?? []).filter(f => isApplicable(f.applicableEventTypes));
  const availableDimensions = (schema?.dimensions ?? []).filter(d => isApplicable(d.applicableEventTypes));
  const availableMeasures = (schema?.measures ?? []).filter(m => isApplicable(m.applicableEventTypes));

  const handleEventTypeChange = (selected: string[]) => {
    setQuery((prev) => {
      const filters = (prev.filters ?? []).filter(f => f.field !== 'event_type');
      if (selected.length > 0) {
        filters.push({
          field: 'event_type',
          operator: 'in',
          value: selected.join(',')
        });
      }
      return { ...prev, filters };
    });
  };

  const handleStatusChange = (selected: string[]) => {
    setQuery((prev) => {
      const filters = (prev.filters ?? []).filter(f => f.field !== 'state_name');
      if (selected.length > 0) {
        filters.push({
          field: 'state_name',
          operator: 'in',
          value: selected.join(',')
        });
      }
      return { ...prev, filters };
    });
  };

  const getDateFilterValue = (type: 'from' | 'to'): string => {
    const filter = query.filters?.find(f => f.field === selectedDateField && f.operator === 'inDateRange');
    if (!filter || typeof filter.value !== 'string') return '';
    
    const dates = filter.value.split(',');
    return type === 'from' ? (dates[0] || '') : (dates[1] || '');
  };

  const handleDateChange = (type: 'from' | 'to', value: string) => {
    setQuery((prev) => {
      const filters = (prev.filters ?? []).filter(f => f.field !== selectedDateField);
      
      // Get existing values
      const existingFilter = (prev.filters ?? []).find(f => f.field === selectedDateField && f.operator === 'inDateRange');
      let fromDate = '';
      let toDate = '';
      
      if (existingFilter && typeof existingFilter.value === 'string') {
        const dates = existingFilter.value.split(',');
        fromDate = dates[0] || '';
        toDate = dates[1] || '';
      }
      
      // Update the changed value
      if (type === 'from') {
        fromDate = value;
      } else {
        toDate = value;
      }
      
      // Only add filter if at least one date is set
      if (fromDate || toDate) {
        filters.push({
          field: selectedDateField,
          operator: 'inDateRange',
          value: `${fromDate},${toDate}`
        });
      }
      
      return { ...prev, filters };
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
          <p className="panel__subtitle">Select KPIs, dimensions, and filters. Changes update the report in real-time.</p>
        </div>
        <span className="pill">{loading ? 'Updating…' : 'Ready'}</span>
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

      {/* Quick Filters Section */}
      <div className="quick-filters-section">
        <div className="editor-section__header">
          <div>
            <p className="eyebrow">🔍 Quick Filters</p>
            <p className="panel__title">Event Type, Status & Dates</p>
          </div>
        </div>
        
        <MultiSelect
          label="Event Type"
          options={['RFQ', 'RFI']}
          value={getSelectedEventTypes()}
          onChange={handleEventTypeChange}
          placeholder="Select event types..."
        />
        
        <MultiSelect
          label="Status"
          options={['InPreparation', 'Published', 'Ongoing', 'Closed', 'Completed', 'Cancelled', 'Awarded']}
          value={getSelectedStatuses()}
          onChange={handleStatusChange}
          placeholder="Select statuses..."
        />

        <div className="date-filter-group">
          <label className="field__label">📅 Date Range</label>
          
          <div className="date-field">
            <label className="field__label field__label--small">Date Field</label>
            <select
              className="field__input"
              value={selectedDateField}
              onChange={(e) => setSelectedDateField(e.target.value)}
            >
              <option value="created_at">Created At</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>

          <div className="date-field">
            <label className="field__label field__label--small">From</label>
            <input
              type="date"
              className="field__input"
              value={getDateFilterValue('from')}
              onChange={(e) => handleDateChange('from', e.target.value)}
            />
          </div>

          <div className="date-field">
            <label className="field__label field__label--small">To</label>
            <input
              type="date"
              className="field__input"
              value={getDateFilterValue('to')}
              onChange={(e) => handleDateChange('to', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Advanced Filters with OR Support */}
      <AdvancedFilters
        filters={query.advancedFilters ?? []}
        availableFilters={availableFilters}
        onChange={(advancedFilters) => {
          setQuery((prev) => ({ ...prev, advancedFilters }));
        }}
      />

      {/* Run Query Button */}
      <div className="query-action">
        <button
          type="button"
          className="button button--primary button--large"
          onClick={() => {
            const payload = buildPayload(query);
            onSubmit(payload);
          }}
          disabled={loading}
        >
          {loading ? '⏳ Loading Data...' : '▶️ Run Query'}
        </button>
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>
          Quick filters require Run Query • Columns update automatically
        </p>
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
              <p className="eyebrow">Groupings (Dimensions)</p>
              <p className="panel__title">Select columns to display</p>
            </div>
            <span className="muted">{availableDimensions.length} available • {query.groupBy?.length || 0} selected</span>
          </div>
          <div className="option-grid">
            {availableDimensions.map((dimension) => (
              <label key={dimension.id} className="option-card">
                <input
                  type="checkbox"
                  checked={query.groupBy?.includes(dimension.id) ?? false}
                  onChange={() => {
                    const updatedGroupBy = query.groupBy?.includes(dimension.id)
                      ? query.groupBy.filter(id => id !== dimension.id)
                      : [...(query.groupBy ?? []), dimension.id];
                    const updatedQuery = { ...query, groupBy: updatedGroupBy };
                    setQuery(updatedQuery);
                    const payload = buildPayload(updatedQuery, schema);
                    onSubmit(payload);
                  }}
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
              <p className="eyebrow">KPIs (Measures)</p>
              <p className="panel__title">Select metrics to calculate</p>
            </div>
            <span className="muted">{availableMeasures.length} available • {query.kpis.length} selected</span>
          </div>
          <div className="option-grid">
            {availableMeasures.map((measure) => (
              <label key={measure.id} className="option-card">
                <input
                  type="checkbox"
                  checked={query.kpis.includes(measure.id)}
                  onChange={() => {
                    const updatedKpis = query.kpis.includes(measure.id)
                      ? query.kpis.filter(id => id !== measure.id)
                      : [...query.kpis, measure.id];
                    const updatedQuery = { ...query, kpis: updatedKpis };
                    setQuery(updatedQuery);
                    const payload = buildPayload(updatedQuery, schema);
                    onSubmit(payload);
                  }}
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
        </div>

        <div className="filter-list">
          {(query.filters ?? []).map((filter, index) => {
            const operators = availableFilters.find((f) => f.id === filter.field)?.operators ?? ['equals'];
            return (
              <div className="filter-card" key={`${filter.field}-${index}`}>
                <div className="filter-card__header">
                  <span className="filter-card__title">Filter {index + 1}</span>
                  <button className="button button--ghost button--small" type="button" onClick={() => removeFilter(index)} disabled={loading}>
                    Remove
                  </button>
                </div>
                <div className="filter-card__fields">
                  <div className="field">
                    <label className="field__label">Field</label>
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
                  </div>
                  <div className="field">
                    <label className="field__label">Operator</label>
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
                  </div>
                  <div className="field">
                    <label className="field__label">Value</label>
                    <input
                      className="field__input"
                      type="text"
                      placeholder="Enter value"
                      value={String(filter.value ?? '')}
                      onChange={(event) => updateFilter(index, { value: event.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {!query.filters?.length && <p className="muted">No filters yet. Add one to refine the request.</p>}
        </div>

        <button
          type="button"
          className="button button--secondary"
          onClick={addFilter}
          disabled={loading || !availableFilters.length}
          style={{ marginTop: '1rem' }}
        >
          + Add filter
        </button>
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
          Reset to default
        </button>
        <button className="button" type="button" onClick={handleSubmit} disabled={loading || schemaLoading}>
          {loading ? 'Running query…' : 'Refresh query'}
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

  const advancedFilters = (query.advancedFilters ?? [])
    .filter((filter) => filter.field && filter.operator && filter.value)
    .map((filter) => {
      const schemaFilter = schema?.filters.find((item) => item.id === filter.field);
      const normalizedValue = normalizeFilterValue(filter.value, filter.operator, schemaFilter?.type);
      return { ...filter, value: normalizedValue } as AnalyticsFilter;
    });

  return { 
    ...query, 
    filters, 
    advancedFilters
  };
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
  const basicFilterCount = query.filters?.length ?? 0;
  const advancedFilterCount = query.advancedFilters?.length ?? 0;
  const totalFilterCount = basicFilterCount + advancedFilterCount;
  
  return {
    dataset: query.datasetId ?? '—',
    datasetLabel,
    kpiCount: query.kpis?.length ?? 0,
    groupByCount: query.groupBy?.length ?? 0,
    filterCount: totalFilterCount,
  };
}
