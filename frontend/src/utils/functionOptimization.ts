/**
 * Function Optimization Utilities
 * 
 * Bu dosya, fonksiyon atamalarını optimize etmek ve performansı artırmak için
 * yardımcı fonksiyonlar içerir.
 */

import { useCallback, useMemo } from 'react';

/**
 * Async fonksiyonları güvenli hale getiren wrapper
 */
export const safeAsync = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: Error, context?: string) => void
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error in ${fn.name}:`, errorMessage);
      
      if (errorHandler) {
        errorHandler(error as Error, fn.name);
      }
      
      throw error;
    }
  }) as T;
};

/**
 * Debounced async fonksiyon oluşturucu
 */
export const createDebouncedAsync = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number = 300
): T => {
  let timeoutId: NodeJS.Timeout;
  
  return (async (...args: Parameters<T>) => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }) as T;
};

/**
 * Retry mekanizması ile async fonksiyon wrapper'ı
 */
export const withRetry = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  maxRetries: number = 3,
  delay: number = 1000
): T => {
  return (async (...args: Parameters<T>) => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        console.warn(`Attempt ${attempt} failed for ${fn.name}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }) as T;
};

/**
 * React hook'ları için optimize edilmiş async fonksiyon oluşturucu
 */
export const useOptimizedAsync = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  deps: React.DependencyList = []
): T => {
  return useCallback(
    safeAsync(fn),
    deps
  );
};

/**
 * Memoized async fonksiyon oluşturucu
 */
export const useMemoizedAsync = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  deps: React.DependencyList = []
): T => {
  return useMemo(
    () => safeAsync(fn),
    deps
  );
};

/**
 * Batch işlemler için async fonksiyon oluşturucu
 */
export const createBatchProcessor = <T, R>(
  processor: (items: T[]) => Promise<R[]>,
  batchSize: number = 10
) => {
  return async (items: T[]): Promise<R[]> => {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }
    
    return results;
  };
};

/**
 * Timeout ile async fonksiyon wrapper'ı
 */
export const withTimeout = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  timeoutMs: number = 5000
): T => {
  return (async (...args: Parameters<T>) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Function ${fn.name} timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    
    return Promise.race([
      fn(...args),
      timeoutPromise
    ]) as ReturnType<T>;
  }) as T;
};

/**
 * Cache mekanizması ile async fonksiyon wrapper'ı
 */
export const withCache = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cacheKeyGenerator?: (...args: Parameters<T>) => string
) => {
  const cache = new Map<string, ReturnType<T>>();
  
  return (async (...args: Parameters<T>) => {
    const key = cacheKeyGenerator ? cacheKeyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = await fn(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
};

/**
 * Fonksiyon performansını ölçen wrapper
 */
export const withPerformanceTracking = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  functionName?: string
): T => {
  return (async (...args: Parameters<T>) => {
    const startTime = performance.now();
    const name = functionName || fn.name;
    
    try {
      const result = await fn(...args);
      const endTime = performance.now();
      
      console.log(`⏱️ ${name} completed in ${(endTime - startTime).toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ ${name} failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
      throw error;
    }
  }) as T;
};

/**
 * Error boundary ile async fonksiyon wrapper'ı
 */
export const withErrorBoundary = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  fallbackValue?: any
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`Error in ${fn.name}:`, error);
      
      if (fallbackValue !== undefined) {
        return fallbackValue;
      }
      
      throw error;
    }
  }) as T;
};

/**
 * Fonksiyon atamalarını optimize etmek için yardımcı tipler
 */
export type OptimizedAsyncFunction<T extends (...args: any[]) => Promise<any>> = T & {
  withRetry: (maxRetries?: number, delay?: number) => OptimizedAsyncFunction<T>;
  withTimeout: (timeoutMs?: number) => OptimizedAsyncFunction<T>;
  withCache: (cacheKeyGenerator?: (...args: Parameters<T>) => string) => OptimizedAsyncFunction<T>;
  withPerformanceTracking: (functionName?: string) => OptimizedAsyncFunction<T>;
  withErrorBoundary: (fallbackValue?: any) => OptimizedAsyncFunction<T>;
};

/**
 * Fonksiyonu optimize edilmiş hale getiren ana fonksiyon
 */
export const optimizeAsyncFunction = <T extends (...args: any[]) => Promise<any>>(
  fn: T
): OptimizedAsyncFunction<T> => {
  const optimized = safeAsync(fn) as OptimizedAsyncFunction<T>;
  
  optimized.withRetry = (maxRetries = 3, delay = 1000) => 
    optimizeAsyncFunction(withRetry(optimized, maxRetries, delay));
  
  optimized.withTimeout = (timeoutMs = 5000) => 
    optimizeAsyncFunction(withTimeout(optimized, timeoutMs));
  
  optimized.withCache = (cacheKeyGenerator) => 
    optimizeAsyncFunction(withCache(optimized, cacheKeyGenerator));
  
  optimized.withPerformanceTracking = (functionName) => 
    optimizeAsyncFunction(withPerformanceTracking(optimized, functionName));
  
  optimized.withErrorBoundary = (fallbackValue) => 
    optimizeAsyncFunction(withErrorBoundary(optimized, fallbackValue));
  
  return optimized;
};
