import type { AnalyticsQuery, AnalyticsResponse, DatasetSchema, DatasetSummary } from '../types/analytics';

const API_BASE_URL = import.meta.env.VITE_ANALYTICS_API ?? window.location.origin;
const API_ROOT = '/api/analytics/v1';
const ANALYTICS_PATH = `${API_ROOT}/query`;

export async function postAnalyticsQuery<Payload = unknown, Result = AnalyticsResponse<Payload>>(
  query: AnalyticsQuery,
): Promise<Result> {
  const response = await fetch(`${API_BASE_URL}${ANALYTICS_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(message);
  }

  return response.json();
}

export async function fetchDatasets(): Promise<DatasetSummary[]> {
  const response = await fetch(`${API_BASE_URL}${API_ROOT}/datasets`);

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(message);
  }

  return response.json();
}

export async function fetchDatasetSchema(datasetId: string): Promise<DatasetSchema> {
  const response = await fetch(`${API_BASE_URL}${API_ROOT}/schema/${datasetId}`);

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
