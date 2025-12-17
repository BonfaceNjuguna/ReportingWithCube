import { useState } from 'react';
import type { AnalyticsFilter, FilterOperator, LogicalOperator, SchemaFilter } from '../types/analytics';

interface AdvancedFiltersProps {
  filters: AnalyticsFilter[];
  availableFilters: SchemaFilter[];
  onChange: (filters: AnalyticsFilter[]) => void;
}

export function AdvancedFilters({ filters, availableFilters, onChange }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(filters.length > 0);

  const addFilter = () => {
    const newFilter: AnalyticsFilter = {
      field: availableFilters[0]?.id || '',
      operator: 'equals',
      value: '',
      combinator: 'and'
    };
    onChange([...filters, newFilter]);
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onChange(newFilters);
  };

  const updateFilter = (index: number, updates: Partial<AnalyticsFilter>) => {
    const newFilters = filters.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    );
    onChange(newFilters);
  };

  const getOperatorLabel = (operator: FilterOperator): string => {
    const labels: Record<FilterOperator, string> = {
      'equals': '=',
      'notEquals': '≠',
      'in': 'IN',
      'notIn': 'NOT IN',
      'greaterThan': '>',
      'lessThan': '<',
      'greaterThanOrEquals': '≥',
      'lessThanOrEquals': '≤',
      'contains': 'Contains',
      'inDateRange': 'Date Range',
      'afterDate': 'After',
      'beforeDate': 'Before'
    };
    return labels[operator];
  };

  if (!isExpanded) {
    return (
      <div className="editor-section">
        <div className="editor-section__header" onClick={() => setIsExpanded(true)} style={{ cursor: 'pointer' }}>
          <div>
            <p className="eyebrow">⚙️ Advanced Filters (OR/Complex)</p>
            <p className="panel__title">Click to expand</p>
          </div>
          {filters.length > 0 && <span className="badge">{filters.length}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="editor-section">
      <div className="editor-section__header">
        <div>
          <p className="eyebrow">⚙️ Advanced Filters</p>
          <p className="panel__title">Complex filter expressions</p>
        </div>
        <button
          type="button"
          className="btn-collapse"
          onClick={() => setIsExpanded(false)}
          title="Collapse"
        >
          ▲
        </button>
      </div>
      
      <div className="filter-list">
        {filters.length === 0 && (
          <p className="muted">No advanced filters yet. Use OR/AND logic to combine multiple conditions.</p>
        )}
        
        {filters.map((filter, index) => (
          <div key={index} className="advanced-filter-row">
            <div className="advanced-filter-card">
              <div className="advanced-filter-fields">
                {/* Field Selection */}
                <div className="field">
                  <label className="field__label">Field</label>
                  <select
                    className="field__input"
                    value={filter.field}
                    onChange={(e) => updateFilter(index, { field: e.target.value })}
                  >
                    <option value="">Select field...</option>
                    {availableFilters.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label || f.id}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator Selection */}
                <div className="field">
                  <label className="field__label">Operator</label>
                  <select
                    className="field__input"
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, { operator: e.target.value as FilterOperator })}
                  >
                    <option value="equals">=</option>
                    <option value="notEquals">≠</option>
                    <option value="in">IN</option>
                    <option value="notIn">NOT IN</option>
                    <option value="greaterThan">&gt;</option>
                    <option value="lessThan">&lt;</option>
                    <option value="greaterThanOrEquals">≥</option>
                    <option value="lessThanOrEquals">≤</option>
                    <option value="contains">Contains</option>
                  </select>
                </div>

                {/* Value Input */}
                <div className="field">
                  <label className="field__label">Value</label>
                  <input
                    type="text"
                    className="field__input"
                    value={filter.value as string}
                    onChange={(e) => updateFilter(index, { value: e.target.value })}
                    placeholder={filter.operator === 'in' || filter.operator === 'notIn' 
                      ? 'Value1, Value2, ...' 
                      : 'Enter value'}
                  />
                </div>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                className="button button--danger"
                onClick={() => removeFilter(index)}
                title="Remove filter"
                style={{ marginTop: '0.5rem' }}
              >
                ✕ Remove
              </button>
            </div>

            {/* Combinator (AND/OR) - show for all except last filter */}
            {index < filters.length - 1 && (
              <div className="filter-combinator">
                <select
                  className="field__input field__input--combinator"
                  value={filter.combinator || 'and'}
                  onChange={(e) => updateFilter(index, { combinator: e.target.value as LogicalOperator })}
                >
                  <option value="and">AND</option>
                  <option value="or">OR</option>
                </select>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          className="button button--secondary"
          onClick={addFilter}
          disabled={availableFilters.length === 0}
          style={{ marginTop: '1rem' }}
        >
          + Add Advanced Filter
        </button>

        {filters.length > 0 && (
          <div className="filter-preview">
            <strong>Filter Logic:</strong>
            <code className="filter-expression">
              {filters.map((f, i) => {
                const field = availableFilters.find(af => af.id === f.field)?.label || f.field;
                const operator = getOperatorLabel(f.operator);
                const value = Array.isArray(f.value) ? f.value.join(', ') : f.value;
                const combinator = f.combinator?.toUpperCase() || '';
                
                return (
                  <span key={i}>
                    <span className="filter-token">{field}</span>{' '}
                    <span className="operator-token">{operator}</span>{' '}
                    <span className="value-token">{value}</span>
                    {i < filters.length - 1 && (
                      <span className={`combinator-token combinator-${f.combinator}`}>
                        {' '}{combinator}{' '}
                      </span>
                    )}
                  </span>
                );
              })}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
