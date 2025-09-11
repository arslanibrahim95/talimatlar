// Frontend Caching Utilities
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items
  strategy: 'memory' | 'localStorage' | 'sessionStorage';
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager<T> {
  private cache = new Map<string, CacheItem<T>>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.startCleanupInterval();
  }

  set(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.config.ttl;
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, item);

    // Persist to storage if configured
    if (this.config.strategy !== 'memory') {
      this.persistToStorage(key, item);
    }
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      // Try to load from storage
      if (this.config.strategy !== 'memory') {
        return this.loadFromStorage(key);
      }
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.cache.delete(key);
    if (this.config.strategy !== 'memory') {
      this.removeFromStorage(key);
    }
  }

  clear(): void {
    this.cache.clear();
    if (this.config.strategy !== 'memory') {
      this.clearStorage();
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  private persistToStorage(key: string, item: CacheItem<T>): void {
    try {
      const storage = this.config.strategy === 'localStorage' 
        ? localStorage 
        : sessionStorage;
      storage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to persist cache item:', error);
    }
  }

  private loadFromStorage(key: string): T | null {
    try {
      const storage = this.config.strategy === 'localStorage' 
        ? localStorage 
        : sessionStorage;
      const itemStr = storage.getItem(`cache_${key}`);
      
      if (!itemStr) return null;

      const item: CacheItem<T> = JSON.parse(itemStr);
      
      // Check if item has expired
      if (Date.now() - item.timestamp > item.ttl) {
        this.removeFromStorage(key);
        return null;
      }

      // Load into memory cache
      this.cache.set(key, item);
      return item.data;
    } catch (error) {
      console.warn('Failed to load cache item from storage:', error);
      return null;
    }
  }

  private removeFromStorage(key: string): void {
    try {
      const storage = this.config.strategy === 'localStorage' 
        ? localStorage 
        : sessionStorage;
      storage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to remove cache item from storage:', error);
    }
  }

  private clearStorage(): void {
    try {
      const storage = this.config.strategy === 'localStorage' 
        ? localStorage 
        : sessionStorage;
      
      const keys = Object.keys(storage).filter(key => key.startsWith('cache_'));
      keys.forEach(key => storage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear storage cache:', error);
    }
  }
}

// Pre-configured cache instances
export const apiCache = new CacheManager<any>({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  strategy: 'memory'
});

export const userDataCache = new CacheManager<any>({
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 50,
  strategy: 'localStorage'
});

export const sessionCache = new CacheManager<any>({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 20,
  strategy: 'sessionStorage'
});

// Cache decorator for functions
export function cached<T extends (...args: any[]) => any>(
  cache: CacheManager<any>,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
) {
  return function(this: any, ...args: Parameters<T>): ReturnType<T> | null {
    const key = keyGenerator(...args);
    const cached = cache.get(key);
    
    if (cached !== null) {
      return cached;
    }

    const result = (this as any)[keyGenerator.name](...args);
    
    if (result instanceof Promise) {
      return result.then((resolved: any) => {
        cache.set(key, resolved, ttl);
        return resolved;
      });
    } else {
      cache.set(key, result, ttl);
      return result;
    }
  };
}

// HTTP Cache utilities
export class HttpCache {
  private static cache = new Map<string, { response: Response; timestamp: number; ttl: number }>();

  static async get(url: string, options?: RequestInit): Promise<Response | null> {
    const cacheKey = this.getCacheKey(url, options);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.response.clone();
    }

    return null;
  }

  static async set(url: string, response: Response, ttl: number = 300000, options?: RequestInit): Promise<void> {
    const cacheKey = this.getCacheKey(url, options);
    this.cache.set(cacheKey, {
      response: response.clone(),
      timestamp: Date.now(),
      ttl
    });
  }

  private static getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  static clear(): void {
    this.cache.clear();
  }
}

export default CacheManager;
