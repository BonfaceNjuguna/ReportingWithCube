import type { AnalyticsQuery, AnalyticsResponse } from '../types/analytics';

const API_BASE_URL = import.meta.env.VITE_ANALYTICS_API ?? 'http://localhost:5000';
const ANALYTICS_PATH = '/api/analytics/v1/query';

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

async function extractErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status} (${response.statusText})`;

  try {
    const payload = await response.json();
    if (typeof payload?.message === 'string') return payload.message;
    if (typeof payload?.error === 'string') return payload.error;
    return fallback;
  } catch (error) {
    console.error('Unable to parse error payload', error);
    return fallback;
  }
}
