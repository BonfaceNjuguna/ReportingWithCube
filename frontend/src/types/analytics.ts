export type SortDirection = 'asc' | 'desc';

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'in'
  | 'notIn'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEquals'
  | 'lessThanOrEquals'
  | 'contains'
  | 'inDateRange'
  | 'afterDate'
  | 'beforeDate';

export interface AnalyticsFilter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | Array<string | number | boolean>;
}

export interface AnalyticsSort {
  by: string;
  direction: SortDirection;
}

export interface AnalyticsPage {
  limit: number;
  offset: number;
}

export interface AnalyticsQuery {
  datasetId: string;
  kpis: string[];
  groupBy?: string[];
  filters?: AnalyticsFilter[];
  sort?: AnalyticsSort;
  page?: AnalyticsPage;
}

export interface ColumnMetadata {
  name: string;
  label: string;
  type: string;
}

export interface QueryMetadata {
  dataset: string;
  rowCount: number;
  executionTimeMs: number;
  fromCache: boolean;
}

export interface AnalyticsResponse<Data = unknown> {
  data: Data;
  columns?: ColumnMetadata[];
  query?: QueryMetadata;
  metadata?: Record<string, unknown>;
  requestId?: string;
}

export interface DatasetSummary {
  id: string;
  label: string;
}

export interface DatasetSchema {
  id: string;
  label: string;
  measures: Array<SchemaMeasure>;
  dimensions: Array<SchemaDimension>;
  filters: Array<SchemaFilter>;
}

export interface SchemaMeasure {
  id: string;
  label: string;
  type: string;
  format: string;
}

export interface SchemaDimension {
  id: string;
  label: string;
  type: string;
}

export interface SchemaFilter {
  id: string;
  type: string;
  operators: FilterOperator[];
}
