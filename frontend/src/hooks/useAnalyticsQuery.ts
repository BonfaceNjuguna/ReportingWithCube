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

export interface EventTypeSummary {
  totalEvents: number;
  rfqCount: number;
  rfiCount: number;
}

interface UseSummaryQueryResult {
  summary: EventTypeSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  runSummaryQuery: (query: AnalyticsQuery) => Promise<void>;
}

export function useSummaryQuery(): UseSummaryQueryResult {
  const [summary, setSummary] = useState<EventTypeSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const runSummaryQuery = useCallback(async (baseQuery: AnalyticsQuery) => {
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      // Query to count events grouped by event_type - without pagination
      const summaryQuery: AnalyticsQuery = {
        datasetId: baseQuery.datasetId,
        kpis: ['event_count'],
        groupBy: ['event_type'],
        filters: baseQuery.filters,
        advancedFilters: baseQuery.advancedFilters,
        // No pagination - get all event types
      };

      const response = await postAnalyticsQuery<Array<Record<string, unknown>>>(summaryQuery);
      
      const rows = response.data || [];
      let rfqCount = 0;
      let rfiCount = 0;
      let totalEvents = 0;

      rows.forEach((row: Record<string, unknown>) => {
        // Handle various possible column naming conventions from Cube.js
        // Column names may come as: EventsView.eventType, event_type, EventType, etc.
        let eventType = '';
        let count = 0;

        for (const [key, value] of Object.entries(row)) {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('eventtype') || lowerKey.includes('event_type')) {
            eventType = String(value || '').toLowerCase();
          }
          if (lowerKey.includes('count') || lowerKey.includes('event_count')) {
            count = Number(value) || 0;
          }
        }
        
        totalEvents += count;
        
        if (eventType.includes('rfq') || eventType === 'materialrfq') {
          rfqCount += count;
        } else if (eventType.includes('rfi') || eventType === 'requestforinformation') {
          rfiCount += count;
        }
      });

      setSummary({ totalEvents, rfqCount, rfiCount });
    } catch (err) {
      if (err instanceof Error) {
        setSummaryError(err.message);
      } else {
        setSummaryError('Failed to fetch summary data.');
      }
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  return { summary, summaryLoading, summaryError, runSummaryQuery };
}
