import { useCallback, useState } from 'react';
import { postAnalyticsQuery } from '../api/analyticsClient';
import type { AnalyticsQuery, AnalyticsResponse } from '../types/analytics';

interface UseAnalyticsQueryResult<Response> {
  data: AnalyticsResponse<Response> | null;
  error: string | null;
  loading: boolean;
  runQuery: (query: AnalyticsQuery) => Promise<void>;
}

export function useAnalyticsQuery<Response = unknown>(): UseAnalyticsQueryResult<Response> {
  const [data, setData] = useState<AnalyticsResponse<Response> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runQuery = useCallback(async (query: AnalyticsQuery) => {
    setLoading(true);
    setError(null);

    try {
      const response = await postAnalyticsQuery<Response>(query);
      setData(response);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while fetching analytics data.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, error, loading, runQuery };
}
