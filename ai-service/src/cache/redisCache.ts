// Redis Cache Implementation for AI Service
import { connect } from "https://deno.land/x/redis@v0.29.0/mod.ts";

export interface RedisConfig {
  hostname: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix: string;
  defaultTTL: number;
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class RedisCacheManager<T> {
  private redis: any;
  private config: RedisConfig;
  private connected = false;

  constructor(config: RedisConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.redis = await connect({
        hostname: this.config.hostname,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db || 0,
      });
      this.connected = true;
      console.log('Redis cache connected successfully');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.connected = false;
    }
  }

  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  async set(key: string, data: T, ttl?: number): Promise<boolean> {
    if (!this.connected) {
      console.warn('Redis not connected, skipping cache set');
      return false;
    }

    try {
      const fullKey = this.getKey(key);
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: (ttl || this.config.defaultTTL) * 1000
      };

      const serialized = JSON.stringify(item);
      const expiration = ttl || this.config.defaultTTL;
      
      await this.redis.setex(fullKey, expiration, serialized);
      return true;
    } catch (error) {
      console.error('Failed to set cache item:', error);
      return false;
    }
  }

  async get(key: string): Promise<T | null> {
    if (!this.connected) {
      console.warn('Redis not connected, skipping cache get');
      return null;
    }

    try {
      const fullKey = this.getKey(key);
      const serialized = await this.redis.get(fullKey);
      
      if (!serialized) {
        return null;
      }

      const item: CacheItem<T> = JSON.parse(serialized);
      
      // Check if item has expired
      if (Date.now() - item.timestamp > item.ttl) {
        await this.delete(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Failed to get cache item:', error);
      return null;
    }
  }

  async has(key: string): Promise<boolean> {
    const result = await this.get(key);
    return result !== null;
  }

  async delete(key: string): Promise<boolean> {
    if (!this.connected) {
      return false;
    }

    try {
      const fullKey = this.getKey(key);
      const result = await this.redis.del(fullKey);
      return result > 0;
    } catch (error) {
      console.error('Failed to delete cache item:', error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    if (!this.connected) {
      return false;
    }

    try {
      const pattern = `${this.config.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  async getStats(): Promise<any> {
    if (!this.connected) {
      return { connected: false };
    }

    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        connected: true,
        memory: info,
        keyspace: keyspace,
        keyCount: await this.getKeyCount()
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { connected: false, error: error.message };
    }
  }

  private async getKeyCount(): Promise<number> {
    try {
      const pattern = `${this.config.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      return keys.length;
    } catch (error) {
      return 0;
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.close();
      this.connected = false;
      console.log('Redis cache disconnected');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Create Redis cache instance
export const redisCache = new RedisCacheManager<any>({
  hostname: Deno.env.get('REDIS_HOST') || 'localhost',
  port: parseInt(Deno.env.get('REDIS_PORT') || '6379'),
  password: Deno.env.get('REDIS_PASSWORD'),
  db: parseInt(Deno.env.get('REDIS_DB') || '0'),
  keyPrefix: 'ai-service:',
  defaultTTL: 300 // 5 minutes
});

// Cache decorator for async functions
export function redisCached<T extends (...args: any[]) => Promise<any>>(
  keyGenerator: (...args: Parameters<T>) => string,
  ttl?: number
) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args: Parameters<T>): Promise<ReturnType<T>> {
      const key = keyGenerator(...args);
      
      // Try to get from cache
      const cached = await redisCache.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute the method
      const result = await method.apply(this, args);
      
      // Cache the result
      await redisCache.set(key, result, ttl);
      
      return result;
    };
  };
}

// Cache middleware for API routes
export function redisCacheMiddleware(ttl?: number) {
  return async (ctx: any, next: () => Promise<void>) => {
    const key = `api:${ctx.request.method}:${ctx.request.url.pathname}:${JSON.stringify(ctx.request.url.searchParams)}`;
    
    // Try to get from cache
    const cached = await redisCache.get(key);
    if (cached !== null) {
      ctx.response.body = cached;
      ctx.response.headers.set('X-Cache', 'HIT');
      return;
    }

    // Execute the handler
    await next();

    // Cache the response if it's successful
    if (ctx.response.status === 200 && ctx.response.body) {
      await redisCache.set(key, ctx.response.body, ttl);
      ctx.response.headers.set('X-Cache', 'MISS');
    }
  };
}

export default RedisCacheManager;
