import { useMemo, useState } from 'react';
import './App.css';
import { QueryEditor } from './components/QueryEditor';
import { AnalyticsChart } from './components/AnalyticsChart';
import { useAnalyticsQuery, useSummaryQuery } from './hooks/useAnalyticsQuery';
import type { AnalyticsQuery, AnalyticsResponse, ColumnMetadata } from './types/analytics';

const defaultQuery: AnalyticsQuery = {
  datasetId: 'events',
  kpis: ['cycle_time_days'],
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
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
  const [currentQuery, setCurrentQuery] = useState<AnalyticsQuery>(defaultQuery);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const { data, loading, error, runQuery } = useAnalyticsQuery();
  const { summary, summaryLoading, runSummaryQuery } = useSummaryQuery();

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
    // Run both queries in parallel - table data with pagination, summary without
    runQuery(queryWithPagination);
    runSummaryQuery(query);
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
              {['table', 'chart'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`tab ${activeTab === tab ? 'tab--active' : ''}`}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                >
                  {tab === 'table' && 'Table'}
                  {tab === 'chart' && 'Chart'}
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
                {!summary && !summaryLoading && (
                  <div className="empty-state" style={{ padding: '2rem', margin: '1rem 0' }}>
                    <div className="empty-state__icon">📊</div>
                    <h3 className="empty-state__title">No data to visualize</h3>
                    <p className="empty-state__message">
                      Select KPIs and dimensions from the sidebar, then click "Run Query" to see your chart.
                    </p>
                  </div>
                )}

                <AnalyticsChart
                  summary={summary}
                  loading={summaryLoading}
                />
              </>
            )}
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
  const normalizedKey = (key || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const isDurationKey =
    normalizedKey.includes('cycletime') ||
    normalizedKey.includes('offerperiod') ||
    normalizedKey.includes('duration') ||
    normalizedKey.endsWith('days');
  if (typeof value === 'number') {
    if (isDurationKey) {
      return formatDurationFromDays(value);
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
  if (typeof value === 'string') {
    if (isDurationKey) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return formatDurationFromDays(numeric);
      }
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      try {
        const date = new Date(value);
        return date.toLocaleDateString();
      } catch {
        return value;
      }
    }
  }
  return String(value);
}

function formatDurationFromDays(days: number): string {
  if (!Number.isFinite(days)) return '-';

  const totalSeconds = Math.max(0, Math.round(days * 24 * 60 * 60));
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${pad(d)}:${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default App;
