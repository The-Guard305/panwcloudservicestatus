import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

interface UseApiOptions {
  refreshInterval?: number; // in milliseconds
  enabled?: boolean;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiState<T> & { refetch: () => Promise<void> } {
  const { refreshInterval, enabled = true } = options;
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetcherRef.current();
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const intervalId = setInterval(fetchData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval, enabled, fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}

export function useCombinedApi<T extends Record<string, unknown>>(
  fetchers: { [K in keyof T]: () => Promise<T[K]> },
  options: UseApiOptions = {}
): {
  data: { [K in keyof T]: T[K] | null };
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
} {
  const { refreshInterval, enabled = true } = options;
  const keys = Object.keys(fetchers) as (keyof T)[];
  
  const [state, setState] = useState<{
    data: { [K in keyof T]: T[K] | null };
    loading: boolean;
    error: Error | null;
    lastUpdated: Date | null;
  }>({
    data: Object.fromEntries(keys.map((k) => [k, null])) as { [K in keyof T]: T[K] | null },
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchersRef = useRef(fetchers);
  fetchersRef.current = fetchers;

  const fetchAll = useCallback(async () => {
    if (!enabled) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const results = await Promise.all(
        keys.map(async (key) => {
          const data = await fetchersRef.current[key]();
          return [key, data] as const;
        })
      );

      setState({
        data: Object.fromEntries(results) as { [K in keyof T]: T[K] | null },
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }, [enabled, keys]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const intervalId = setInterval(fetchAll, refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval, enabled, fetchAll]);

  return {
    ...state,
    refetch: fetchAll,
  };
}
