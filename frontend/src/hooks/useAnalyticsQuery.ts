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

export interface StatusBreakdown {
  status: string;
  count: number;
  eventType?: string;
}

export interface ChartSummaryData {
  eventTypeSummary: EventTypeSummary;
  statusBreakdown: StatusBreakdown[];
}

interface UseSummaryQueryResult {
  summary: ChartSummaryData | null;
  summaryLoading: boolean;
  summaryError: string | null;
  runSummaryQuery: (query: AnalyticsQuery) => Promise<void>;
}

export function useSummaryQuery(): UseSummaryQueryResult {
  const [summary, setSummary] = useState<ChartSummaryData | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const runSummaryQuery = useCallback(async (baseQuery: AnalyticsQuery) => {
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      // Query 1: Count events grouped by event_type
      const eventTypeQuery: AnalyticsQuery = {
        datasetId: baseQuery.datasetId,
        kpis: ['event_count'],
        groupBy: ['event_type'],
        filters: baseQuery.filters,
        advancedFilters: baseQuery.advancedFilters,
      };

      // Query 2: Count events grouped by status and event_type
      const statusQuery: AnalyticsQuery = {
        datasetId: baseQuery.datasetId,
        kpis: ['event_count'],
        groupBy: ['state_name', 'event_type'],
        filters: baseQuery.filters,
        advancedFilters: baseQuery.advancedFilters,
      };

      // Run both queries in parallel
      const [eventTypeResponse, statusResponse] = await Promise.all([
        postAnalyticsQuery<Array<Record<string, unknown>>>(eventTypeQuery),
        postAnalyticsQuery<Array<Record<string, unknown>>>(statusQuery),
      ]);
      
      // Process event type summary
      const eventTypeRows = eventTypeResponse.data || [];
      let rfqCount = 0;
      let rfiCount = 0;
      let totalEvents = 0;

      eventTypeRows.forEach((row: Record<string, unknown>) => {
        let eventType = '';
        let count = 0;

        for (const [key, value] of Object.entries(row)) {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('eventtype') || lowerKey.includes('event_type')) {
            eventType = String(value || '').toLowerCase();
          }
          if (lowerKey.includes('count')) {
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

      // Process status breakdown
      const statusRows = statusResponse.data || [];
      const statusBreakdown: StatusBreakdown[] = [];

      statusRows.forEach((row: Record<string, unknown>) => {
        let status = '';
        let eventType = '';
        let count = 0;

        for (const [key, value] of Object.entries(row)) {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('statename') || lowerKey.includes('state_name')) {
            status = String(value || 'Unknown');
          }
          if (lowerKey.includes('eventtype') || lowerKey.includes('event_type')) {
            eventType = String(value || '');
          }
          if (lowerKey.includes('count')) {
            count = Number(value) || 0;
          }
        }

        if (status && count > 0) {
          statusBreakdown.push({ status, count, eventType });
        }
      });

      // Sort by count descending
      statusBreakdown.sort((a, b) => b.count - a.count);

      setSummary({
        eventTypeSummary: { totalEvents, rfqCount, rfiCount },
        statusBreakdown,
      });
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
