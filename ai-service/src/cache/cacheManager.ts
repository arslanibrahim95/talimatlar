// AI Service Cache Manager
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of items
  keyPrefix: string;
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

class CacheManager<T> {
  private cache = new Map<string, CacheItem<T>>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0
  };

  constructor(config: CacheConfig) {
    this.config = config;
    this.startCleanupInterval();
  }

  set(key: string, data: T, customTtl?: number): void {
    const fullKey = `${this.config.keyPrefix}${key}`;
    const ttl = customTtl || this.config.ttl;
    
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
      hits: 0
    };

    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(fullKey, item);
    this.stats.size = this.cache.size;
  }

  get(key: string): T | null {
    const fullKey = `${this.config.keyPrefix}${key}`;
    const item = this.cache.get(fullKey);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(fullKey);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }

    // Update hit count and statistics
    item.hits++;
    this.stats.hits++;
    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    const fullKey = `${this.config.keyPrefix}${key}`;
    const deleted = this.cache.delete(fullKey);
    this.stats.size = this.cache.size;
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0
    };
  }

  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    let leastHits = Infinity;

    // Find the least recently used and least hit item
    for (const [key, item] of this.cache.entries()) {
      const age = Date.now() - item.timestamp;
      const score = age + (item.hits * 1000); // Weight hits more than age
      
      if (score < (oldestTime + (leastHits * 1000))) {
        oldestKey = key;
        oldestTime = age;
        leastHits = item.hits;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
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
      this.stats.size = this.cache.size;
    }, 60000); // Cleanup every minute
  }
}

// Pre-configured cache instances for different data types
export const chatCache = new CacheManager<any>({
  ttl: 300, // 5 minutes
  maxSize: 1000,
  keyPrefix: 'chat:'
});

export const commandCache = new CacheManager<any>({
  ttl: 600, // 10 minutes
  maxSize: 500,
  keyPrefix: 'command:'
});

export const userCache = new CacheManager<any>({
  ttl: 1800, // 30 minutes
  maxSize: 100,
  keyPrefix: 'user:'
});

export const sessionCache = new CacheManager<any>({
  ttl: 3600, // 1 hour
  maxSize: 200,
  keyPrefix: 'session:'
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

// Cache middleware for API routes
export function cacheMiddleware(cache: CacheManager<any>, ttl?: number) {
  return async (ctx: any, next: () => Promise<void>) => {
    const key = `${ctx.request.method}:${ctx.request.url.pathname}:${JSON.stringify(ctx.request.url.searchParams)}`;
    
    // Try to get from cache
    const cached = cache.get(key);
    if (cached !== null) {
      ctx.response.body = cached;
      ctx.response.headers.set('X-Cache', 'HIT');
      return;
    }

    // Execute the handler
    await next();

    // Cache the response if it's successful
    if (ctx.response.status === 200 && ctx.response.body) {
      cache.set(key, ctx.response.body, ttl);
      ctx.response.headers.set('X-Cache', 'MISS');
    }
  };
}

export default CacheManager;
