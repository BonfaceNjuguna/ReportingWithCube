import { useCallback, useEffect, useState } from 'react';
import { fetchDatasetSchema, fetchDatasets } from '../api/analyticsClient';
import type { DatasetSchema, DatasetSummary } from '../types/analytics';

interface DatasetSchemaResult {
  datasets: DatasetSummary[];
  schema: DatasetSchema | null;
  loading: boolean;
  error: string | null;
  refreshSchema: (datasetId: string) => Promise<void>;
}

export function useDatasetSchema(initialDatasetId: string): DatasetSchemaResult {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [schema, setSchema] = useState<DatasetSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSchema = useCallback(async (datasetId: string) => {
    setLoading(true);
    setError(null);

    try {
      const schemaResponse = await fetchDatasetSchema(datasetId);
      setSchema(schemaResponse);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to load dataset schema');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      try {
        const datasetsResponse = await fetchDatasets();
        setDatasets(datasetsResponse);
        const initialId = initialDatasetId || datasetsResponse[0]?.id;
        if (initialId) {
          const schemaResponse = await fetchDatasetSchema(initialId);
          setSchema(schemaResponse);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unable to load available datasets');
        }
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [initialDatasetId]);

  return { datasets, schema, loading, error, refreshSchema };
}
