import { useMemo, useState } from 'react';
import './App.css';
import { QueryEditor } from './components/QueryEditor';
import { QueryResult } from './components/QueryResult';
import { AnalyticsChart } from './components/AnalyticsChart';
import { useAnalyticsQuery } from './hooks/useAnalyticsQuery';
import type { AnalyticsQuery, AnalyticsResponse, ColumnMetadata } from './types/analytics';

const defaultQuery: AnalyticsQuery = {
  datasetId: 'events',
  kpis: ['event_count', 'cycle_time_days'],
  groupBy: ['event_number', 'event_name', 'event_type', 'state_name'],
  filters: [],
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
  const [currentQuery, setCurrentQuery] = useState<AnalyticsQuery>(defaultQuery);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const { data, loading, error, runQuery } = useAnalyticsQuery();
  const [drillDownPath, setDrillDownPath] = useState<Array<{ field: string; value: string }>>([]);
  const [showPresets, setShowPresets] = useState(false);

  type InsightPreset = {
    id: string;
    title: string;
    description: string;
    datasetId?: string;
    kpis: string[];
    groupBy: string[];
    filters?: AnalyticsQuery['filters'];
    sort?: AnalyticsQuery['sort'];
  };

  const insightPresets: InsightPreset[] = useMemo(() => [
    {
      id: 'volume-mix',
      title: 'RFQ vs RFI volume over time',
      description: 'Event count by type, trended by created date. Good for seasonality and mix.',
      datasetId: 'events',
      kpis: ['event_count'],
      groupBy: ['created_at', 'event_type'],
      sort: { by: 'created_at', direction: 'desc' }
    },
    {
      id: 'status-funnel',
      title: 'Status distribution',
      description: 'Where events sit in the process. Stack by status and type.',
      datasetId: 'events',
      kpis: ['event_count'],
      groupBy: ['state_name', 'event_type']
    },
    {
      id: 'cycle-time',
      title: 'Cycle & offer period trend',
      description: 'Average cycle time and offer period over time, split by RFQ/RFI.',
      datasetId: 'events',
      kpis: ['avg_cycle_time_days', 'avg_offer_period_days'],
      groupBy: ['created_at', 'event_type'],
      sort: { by: 'created_at', direction: 'desc' }
    },
    {
      id: 'supplier-engagement',
      title: 'Supplier engagement',
      description: 'Invited vs viewed vs offered vs rejected suppliers by event type.',
      datasetId: 'events',
      kpis: ['invited_suppliers_count', 'viewed_suppliers_count', 'offered_suppliers_count', 'rejected_suppliers_count'],
      groupBy: ['event_type']
    },
    {
      id: 'conversion-rates',
      title: 'Conversion & response',
      description: 'Quotation, response, and reject rates side-by-side per type.',
      datasetId: 'events',
      kpis: ['quotation_rate', 'response_rate', 'reject_rate'],
      groupBy: ['event_type', 'created_at'],
      sort: { by: 'created_at', direction: 'desc' }
    },
    {
      id: 'rfq-value',
      title: 'RFQ commercial impact',
      description: 'Best and average quotation totals, rounds, and opened quotations (RFQ only).',
      datasetId: 'events',
      kpis: ['best_quotation_total', 'quotation_total_avg', 'opened_quotations_count', 'last_round_number'],
      groupBy: ['created_at'],
      filters: [{ field: 'event_type', operator: 'equals', value: 'RFQ' }],
      sort: { by: 'created_at', direction: 'desc' }
    }
  ], []);

  const tableData = useMemo(() => {
    const result = deriveTableData(data);
    return result;
  }, [data, currentQuery]);

  const handleQueryChange = (query: AnalyticsQuery) => {
    setCurrentQuery(query);
    setCurrentPage(0); // Reset to first page on query change
    const queryWithPagination = {
      ...query,
      page: {
        limit: pageSize,
        offset: 0
      }
    };
    runQuery(queryWithPagination);
  };

  const applyPreset = (preset: InsightPreset) => {
    const nextQuery: AnalyticsQuery = {
      ...currentQuery,
      datasetId: preset.datasetId ?? currentQuery.datasetId,
      kpis: preset.kpis,
      groupBy: preset.groupBy,
      filters: preset.filters ?? [],
      advancedFilters: [],
      sort: preset.sort ?? currentQuery.sort,
      page: { limit: pageSize, offset: 0 }
    };

    setActiveTab('chart');
    handleQueryChange(nextQuery);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const queryWithPagination = {
      ...currentQuery,
      page: {
        limit: pageSize,
        offset: newPage * pageSize
      }
    };
    runQuery(queryWithPagination);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
    const queryWithPagination = {
      ...currentQuery,
      page: {
        limit: newSize,
        offset: 0
      }
    };
    runQuery(queryWithPagination);
  };

  const handleDrillDown = (field: string, value: string) => {
    const newFilter = {
      field,
      operator: 'equals' as const,
      value
    };
    
    const updatedQuery = {
      ...currentQuery,
      filters: [...(currentQuery.filters || []), newFilter],
      page: {
        limit: pageSize,
        offset: 0
      }
    };
    
    setDrillDownPath([...drillDownPath, { field, value }]);
    setCurrentQuery(updatedQuery);
    setCurrentPage(0);
    runQuery(updatedQuery);
  };

  const handleDrillUp = () => {
    if (drillDownPath.length === 0) return;
    
    const newPath = drillDownPath.slice(0, -1);
    const updatedQuery = {
      ...currentQuery,
      filters: currentQuery.filters?.slice(0, -1) || [],
      page: {
        limit: pageSize,
        offset: 0
      }
    };
    
    setDrillDownPath(newPath);
    setCurrentQuery(updatedQuery);
    setCurrentPage(0);
    runQuery(updatedQuery);
  };

  // Don't run query on mount - let user build their query first
  // useEffect(() => {
  //   runQuery(defaultQuery);
  // }, [runQuery]);

  return (
    <main className="app">
      <header className="app__bar">
        <div className="app__bar-content">
          <div>
            <h1>📊 Event Analytics & Reporting</h1>
            <p className="muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
              Build custom reports for RFQ, RFI, and supplier data
            </p>
          </div>
          <div className="header-actions">
            {activeTab === 'chart' && tableData.rows.length === 0 && (
              <button 
                className="button button--primary" 
                type="button"
                onClick={() => setShowPresets(!showPresets)}
              >
                ✨ Quick Start
              </button>
            )}
            {tableData.rows.length > 0 && (
              <>
                <button 
                  className="button button--ghost" 
                  type="button"
                  onClick={() => alert('Export functionality coming soon!')}
                  title="Export current results to CSV"
                >
                  📤 Export
                </button>
                <button 
                  className="button button--ghost" 
                  type="button"
                  onClick={() => alert('Save report functionality coming soon!')}
                  title="Save this report configuration"
                >
                  💾 Save
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <section className="layout">
        <aside className="layout__sidebar">
          <QueryEditor initialQuery={defaultQuery} loading={loading} onSubmit={handleQueryChange} error={error} />
        </aside>

        <section className="layout__content">
          <div className="panel panel--flush">
            <div className="panel__header" style={{ padding: '1rem 0', marginBottom: '1rem' }}>
              <div>
                <h2 className="panel__title" style={{ fontSize: '1.125rem', margin: '0 0 0.375rem 0', fontWeight: 600 }}>
                  {tableData.rows.length > 0 ? `Results (${tableData.rows.length.toLocaleString()} rows)` : 'Build Your Report'}
                </h2>
                {(currentQuery.kpis.length > 0 || currentQuery.groupBy?.length || currentQuery.filters?.length) ? (
                  <div className="breadcrumbs" style={{ fontSize: '0.8125rem', gap: '0.75rem' }}>
                    {currentQuery.kpis.length > 0 && (
                      <span style={{ color: '#6366f1' }}>📊 {currentQuery.kpis.length} KPI{currentQuery.kpis.length > 1 ? 's' : ''}</span>
                    )}
                    {currentQuery.groupBy && currentQuery.groupBy.length > 0 && (
                      <span style={{ color: '#8b5cf6' }}>📋 {currentQuery.groupBy.length} dimension{currentQuery.groupBy.length > 1 ? 's' : ''}</span>
                    )}
                    {currentQuery.filters && currentQuery.filters.length > 0 && (
                      <span style={{ color: '#ec4899' }}>🔍 {currentQuery.filters.length} active filter{currentQuery.filters.length > 1 ? 's' : ''}</span>
                    )}
                  </div>
                ) : (
                  <p className="muted" style={{ margin: 0 }}>Choose KPIs and dimensions from the sidebar to begin</p>
                )}
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
              <ResultTable 
                table={tableData} 
                loading={loading} 
                error={error}
                currentPage={currentPage}
                pageSize={pageSize}
                totalRows={data?.query?.rowCount ?? 0}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}

            {activeTab === 'chart' && (
              <>
                {tableData.rows.length === 0 && (
                  <div className="empty-state" style={{ padding: '2rem', margin: '1rem 0' }}>
                    <div className="empty-state__icon">📊</div>
                    <h3 className="empty-state__title">No data to visualize</h3>
                    <p className="empty-state__message" style={{ marginBottom: '1.5rem' }}>
                      Select KPIs and dimensions from the sidebar, then click "Run Query" to see your chart.
                    </p>
                    <button 
                      type="button" 
                      className="button button--secondary"
                      onClick={() => setShowPresets(!showPresets)}
                    >
                      {showPresets ? '✕ Hide' : '✨ Show'} Quick Start Templates
                    </button>
                  </div>
                )}

                {showPresets && (
                  <div className="panel" style={{ margin: '1rem 0', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div>
                        <p className="eyebrow">Quick start</p>
                        <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', fontWeight: 600 }}>Pre-configured Views</h3>
                      </div>
                      <button 
                        type="button" 
                        className="button button--ghost button--small"
                        onClick={() => setShowPresets(false)}
                      >
                        ✕ Close
                      </button>
                    </div>
                    <div className="option-grid">
                      {insightPresets.map((preset) => (
                        <div 
                          key={preset.id}
                          className="option-card" 
                          style={{ cursor: 'pointer', flexDirection: 'column' }}
                          onClick={() => {
                            applyPreset(preset);
                            setShowPresets(false);
                          }}
                        >
                          <div className="option-card__title">{preset.title}</div>
                          <p className="muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', flex: 1 }}>
                            {preset.description}
                          </p>
                          <button
                            type="button"
                            className="button button--secondary button--small"
                            style={{ marginTop: '0.75rem', width: '100%' }}
                            disabled={loading}
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <AnalyticsChart
                  tableData={tableData}
                  query={currentQuery}
                  loading={loading}
                  onDrillDown={handleDrillDown}
                  onDrillUp={handleDrillUp}
                  drillDownPath={drillDownPath}
                />
              </>
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

const emptyTable: TableData = {
  source: 'sample',
  headers: [],
  rows: [],
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

  return emptyTable;
}

function deriveHeaders(rows: Array<Record<string, unknown>>, columns?: ColumnMetadata[]): TableHeader[] {
  if (columns?.length) {
    return columns.map((column) => ({ key: column.name, label: column.label ?? startCase(column.name) }));
  }

  const sampleRow = rows[0];
  if (!sampleRow) return [];

  return Object.keys(sampleRow).map((key) => ({ key, label: startCase(key) }));
}

function startCase(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

interface ResultTableProps {
  table: TableData;
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function ResultTable({ table, loading, error, currentPage, pageSize, totalRows, onPageChange, onPageSizeChange }: ResultTableProps) {
  if (loading) {
    return <p className="muted">Fetching data…</p>;
  }

  const hasRows = table.rows.length > 0;
  const hasHeaders = table.headers.length > 0;
  const totalPages = Math.ceil(totalRows / pageSize);
  const startRow = currentPage * pageSize + 1;
  const endRow = Math.min((currentPage + 1) * pageSize, totalRows);

  // Show empty state if no headers (no columns selected)
  if (!hasHeaders) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📊</div>
        <h3 className="empty-state__title">No columns selected</h3>
        <p className="empty-state__message">
          Choose KPIs and dimensions from the sidebar, then click "Run Query"
        </p>
      </div>
    );
  }

  return (
    <div className="table-card">
      {error && (
        <div className="alert alert--error">
          <strong>Request failed</strong>
          <p>{error}</p>
        </div>
      )}

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
                    <td key={header.key}>{renderCell(row[header.key], header.key)}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={table.headers.length} className="muted" style={{ textAlign: 'center', padding: '2rem' }}>
                  No results found. Try adjusting your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasRows && totalRows > 0 && (
        <div className="pagination">
          <div className="pagination__info">
            <span>Showing {startRow}-{endRow} of {totalRows} rows</span>
            <select 
              className="pagination__size-select"
              value={pageSize} 
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={250}>250 per page</option>
              <option value={500}>500 per page</option>
            </select>
          </div>
          <div className="pagination__controls">
            <button 
              className="pagination__button"
              onClick={() => onPageChange(0)}
              disabled={currentPage === 0}
              title="First page"
            >
              «
            </button>
            <button 
              className="pagination__button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              title="Previous page"
            >
              ‹
            </button>
            <span className="pagination__page-info">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button 
              className="pagination__button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              title="Next page"
            >
              ›
            </button>
            <button 
              className="pagination__button"
              onClick={() => onPageChange(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              title="Last page"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function renderCell(value: unknown, key?: string) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    if (key && (key.includes('cycle_time') || key.includes('offer_period') || key.toLowerCase().includes('_days'))) {
      return Math.round(value).toLocaleString() + ' days';
    }
    if (key && (key.includes('rate') || key.includes('percent'))) {
      return value.toFixed(1) + '%';
    }
    if (key && (key.includes('total') || key.includes('price') || key.includes('volume'))) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(value);
    }
    if (key && key.includes('count')) {
      return Math.round(value).toLocaleString();
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const date = new Date(value);
      return date.toLocaleDateString();
    } catch {
      return value;
    }
  }
  return String(value);
}

export default App;
