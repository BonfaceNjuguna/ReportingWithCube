import type { AnalyticsQuery, AnalyticsQueryRequest, AnalyticsResponse, DatasetSchema, DatasetSummary, FilterGroup } from '../types/analytics';

const API_ROOT = '/api/analytics/v1';
const ANALYTICS_PATH = `${API_ROOT}/query`;

const API_BASE_URL = resolveApiBaseUrl();

export async function postAnalyticsQuery<Payload = unknown, Result = AnalyticsResponse<Payload>>(
  query: AnalyticsQuery,
): Promise<Result> {
  const requestPayload: AnalyticsQueryRequest = convertToBackendFormat(query);
  
  const response = await fetch(buildUrl(ANALYTICS_PATH), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(message);
  }

  return response.json();
}

function convertToBackendFormat(query: AnalyticsQuery): AnalyticsQueryRequest {
  const filterGroups: FilterGroup[] = [];
  
  if (query.advancedFilters && query.advancedFilters.length > 0) {
    let currentGroup: typeof query.advancedFilters = [];
    let currentLogic: 'and' | 'or' = query.advancedFilters[0].combinator || 'and';
    
    query.advancedFilters.forEach((filter, index) => {
      const filterLogic = index === 0 ? currentLogic : (query.advancedFilters![index - 1].combinator || 'and');
      
      if (currentGroup.length > 0 && filterLogic !== currentLogic) {
        filterGroups.push({
          logic: currentLogic,
          filters: currentGroup.map(f => ({ field: f.field, operator: f.operator, value: f.value }))
        });
        currentGroup = [filter];
        currentLogic = filter.combinator || 'and';
      } else {
        currentGroup.push(filter);
        if (index < query.advancedFilters!.length - 1) {
          currentLogic = filter.combinator || 'and';
        }
      }
    });
    
    if (currentGroup.length > 0) {
      filterGroups.push({
        logic: currentLogic,
        filters: currentGroup.map(f => ({ field: f.field, operator: f.operator, value: f.value }))
      });
    }
  }
  
  return {
    ...query,
    filterGroups: filterGroups.length > 0 ? filterGroups : undefined
  } as AnalyticsQueryRequest;
}

export async function fetchDatasets(): Promise<DatasetSummary[]> {
  const response = await fetch(buildUrl(`${API_ROOT}/datasets`));

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(message);
  }

  return response.json();
}

export async function fetchDatasetSchema(datasetId: string): Promise<DatasetSchema> {
  const response = await fetch(buildUrl(`${API_ROOT}/schema/${datasetId}`));

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(message);
  }

  return response.json();
}

async function extractErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status} (${response.statusText})`;

  try {
    const contentType = response.headers.get('Content-Type') ?? '';
    if (contentType.includes('application/json')) {
      const payload = await response.json();
      if (typeof payload?.message === 'string') return payload.message;
      if (typeof payload?.error === 'string') return payload.error;
    } else {
      const text = await response.text();
      if (text) return text;
    }
  } catch (error) {
    console.error('Unable to parse error payload', error);
  }

  return fallback;
}

function resolveApiBaseUrl(): string {
  if (import.meta.env.VITE_ANALYTICS_API) {
    return stripTrailingSlash(import.meta.env.VITE_ANALYTICS_API);
  }

  // In Vite dev we proxy /api to the backend; keep the base relative.
  if (typeof window !== 'undefined') {
    const { origin } = window.location;
    if (origin.includes('localhost:5173') || origin.includes('127.0.0.1:5173')) {
      return 'http://localhost:5000';
    }
    return origin;
  }

  return '';
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function buildUrl(path: string): string {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
}
