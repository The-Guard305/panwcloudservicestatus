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
  key?: string; // Cache key for deduplication and caching
  cacheTtl?: number; // Cache TTL in ms
}

// Global cache and inflight requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, { data: any; timestamp: number }>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inflight = new Map<string, Promise<any>>();

async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiState<T> & { refetch: () => Promise<void> } {
  const { refreshInterval, enabled = true, key, cacheTtl = 60000 } = options;
  const [state, setState] = useState<UseApiState<T>>({
    data: key && cache.has(key) ? cache.get(key)!.data : null,
    loading: !key || !cache.has(key),
    error: null,
    lastUpdated: key && cache.has(key) ? new Date(cache.get(key)!.timestamp) : null,
  });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache if not forced
    if (!force && key && cache.has(key)) {
      const entry = cache.get(key)!;
      if (Date.now() - entry.timestamp < cacheTtl) {
        setState(prev => ({
          ...prev,
          data: entry.data,
          loading: false,
          error: null,
          lastUpdated: new Date(entry.timestamp)
        }));
        return;
      }
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      let promise: Promise<T>;

      if (key) {
        if (inflight.has(key)) {
          promise = inflight.get(key)!;
        } else {
          promise = fetcherRef.current();
          inflight.set(key, promise);
          promise.finally(() => inflight.delete(key));
        }
      } else {
        promise = fetcherRef.current();
      }

      const data = await retryWithBackoff(async () => await promise);

      if (key) {
        cache.set(key, { data, timestamp: Date.now() });
      }

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
  }, [enabled, key, cacheTtl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const intervalId = setInterval(() => fetchData(true), refreshInterval);
    return () => clearInterval(intervalId);
  }, [refreshInterval, enabled, fetchData]);

  return {
    ...state,
    refetch: () => fetchData(true),
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
          const data = await retryWithBackoff(() => fetchersRef.current[key]());
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
  }, [enabled]); // Removed keys from dependency

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
