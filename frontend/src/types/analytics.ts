export type SortDirection = 'asc' | 'desc';

export interface AnalyticsFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'greater_than_or_equals' | 'less_than_or_equals' | 'contains';
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

export interface AnalyticsResponse<Data = unknown> {
  data: Data;
  metadata?: Record<string, unknown>;
  requestId?: string;
}
