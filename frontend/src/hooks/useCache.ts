// React hooks for caching
import { useState, useEffect, useCallback, useRef } from 'react';
import { CacheManager, CacheConfig } from '../utils/cache';

export interface UseCacheOptions<T> extends CacheConfig {
  initialData?: T;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
}

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T> | T,
  options: UseCacheOptions<T> = {} as UseCacheOptions<T>
) {
  const [data, setData] = useState<T | null>(options.initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<CacheManager<T> | null>(null);

  // Initialize cache
  useEffect(() => {
    if (!cacheRef.current) {
      cacheRef.current = new CacheManager<T>({
        ttl: 5 * 60 * 1000, // 5 minutes default
        maxSize: 100,
        strategy: 'memory',
        ...options
      });
    }
  }, [options]);

  // Load data from cache or fetch
  const loadData = useCallback(async () => {
    if (!cacheRef.current) return;

    // Try to get from cache first
    const cachedData = cacheRef.current.get(key);
    if (cachedData !== null) {
      setData(cachedData);
      options.onSuccess?.(cachedData);
      return;
    }

    // Fetch new data
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      
      // Cache the result
      cacheRef.current.set(key, result);
      
      options.onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options]);

  // Refresh data (bypass cache)
  const refresh = useCallback(async () => {
    if (!cacheRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      
      // Update cache
      cacheRef.current.set(key, result);
      
      options.onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    if (cacheRef.current) {
      cacheRef.current.delete(key);
    }
  }, [key]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
    loadData
  };
}

// Hook for API calls with caching
export function useApiCache<T>(
  url: string,
  options: RequestInit = {},
  cacheOptions: Partial<UseCacheOptions<T>> = {}
) {
  const fetcher = useCallback(async (): Promise<T> => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [url, options]);

  return useCache(url, fetcher, {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 50,
    strategy: 'memory',
    ...cacheOptions
  });
}

// Hook for local storage caching
export function useLocalStorageCache<T>(
  key: string,
  initialValue: T,
  ttl: number = 24 * 60 * 60 * 1000 // 24 hours
) {
  const [data, setData] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // Check if item has expired
        if (parsed.timestamp && Date.now() - parsed.timestamp < ttl) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    return initialValue;
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(data) : value;
      setData(valueToStore);
      
      const item = {
        data: valueToStore,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, [key, data]);

  const removeValue = useCallback(() => {
    try {
      setData(initialValue);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }, [key, initialValue]);

  return [data, setValue, removeValue] as const;
}

// Hook for session storage caching
export function useSessionStorageCache<T>(
  key: string,
  initialValue: T,
  ttl: number = 60 * 60 * 1000 // 1 hour
) {
  const [data, setData] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // Check if item has expired
        if (parsed.timestamp && Date.now() - parsed.timestamp < ttl) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.warn('Failed to load from sessionStorage:', error);
    }
    return initialValue;
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(data) : value;
      setData(valueToStore);
      
      const item = {
        data: valueToStore,
        timestamp: Date.now()
      };
      sessionStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to sessionStorage:', error);
    }
  }, [key, data]);

  const removeValue = useCallback(() => {
    try {
      setData(initialValue);
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from sessionStorage:', error);
    }
  }, [key, initialValue]);

  return [data, setValue, removeValue] as const;
}

export default useCache;
