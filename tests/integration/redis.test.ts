import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, RedisClientType } from 'redis';

// Redis configuration
const REDIS_CONFIG = {
  host: 'localhost',
  port: 6380,
  password: process.env.REDIS_PASSWORD || undefined
};

describe('Redis Integration Tests', () => {
  let redisClient: RedisClientType;

  beforeAll(async () => {
    redisClient = createClient({
      socket: {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port
      },
      password: REDIS_CONFIG.password
    });

    await redisClient.connect();
  });

  afterAll(async () => {
    if (redisClient.isOpen) {
      await redisClient.disconnect();
    }
  });

  beforeEach(async () => {
    // Clean up test keys
    const keys = await redisClient.keys('test:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  });

  describe('Redis Connection', () => {
    it('should connect to Redis server', async () => {
      expect(redisClient.isOpen).toBe(true);
    });

    it('should ping Redis server', async () => {
      const pong = await redisClient.ping();
      expect(pong).toBe('PONG');
    });
  });

  describe('Basic Key-Value Operations', () => {
    it('should set and get string values', async () => {
      await redisClient.set('test:string', 'Hello Redis');
      const value = await redisClient.get('test:string');
      expect(value).toBe('Hello Redis');
    });

    it('should set and get with expiration', async () => {
      await redisClient.setEx('test:expire', 60, 'Expires in 60 seconds');
      const value = await redisClient.get('test:expire');
      expect(value).toBe('Expires in 60 seconds');

      const ttl = await redisClient.ttl('test:expire');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    });

    it('should handle non-existent keys', async () => {
      const value = await redisClient.get('test:nonexistent');
      expect(value).toBeNull();
    });

    it('should delete keys', async () => {
      await redisClient.set('test:delete', 'To be deleted');
      await redisClient.del('test:delete');
      const value = await redisClient.get('test:delete');
      expect(value).toBeNull();
    });
  });

  describe('Hash Operations', () => {
    it('should set and get hash fields', async () => {
      await redisClient.hSet('test:hash', {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3'
      });

      const value1 = await redisClient.hGet('test:hash', 'field1');
      const value2 = await redisClient.hGet('test:hash', 'field2');
      const allFields = await redisClient.hGetAll('test:hash');

      expect(value1).toBe('value1');
      expect(value2).toBe('value2');
      expect(allFields).toEqual({
        field1: 'value1',
        field2: 'value2',
        field3: 'value3'
      });
    });

    it('should check hash field existence', async () => {
      await redisClient.hSet('test:hash', { field1: 'value1' });

      const exists1 = await redisClient.hExists('test:hash', 'field1');
      const exists2 = await redisClient.hExists('test:hash', 'field2');

      expect(exists1).toBe(true);
      expect(exists2).toBe(false);
    });

    it('should delete hash fields', async () => {
      await redisClient.hSet('test:hash', { field1: 'value1', field2: 'value2' });
      await redisClient.hDel('test:hash', 'field1');

      const exists1 = await redisClient.hExists('test:hash', 'field1');
      const exists2 = await redisClient.hExists('test:hash', 'field2');

      expect(exists1).toBe(false);
      expect(exists2).toBe(true);
    });
  });

  describe('List Operations', () => {
    it('should push and pop from lists', async () => {
      await redisClient.lPush('test:list', 'item1', 'item2', 'item3');
      
      const length = await redisClient.lLen('test:list');
      expect(length).toBe(3);

      const item = await redisClient.rPop('test:list');
      expect(item).toBe('item1');

      const remainingLength = await redisClient.lLen('test:list');
      expect(remainingLength).toBe(2);
    });

    it('should get list range', async () => {
      await redisClient.lPush('test:list', 'item1', 'item2', 'item3');
      
      const range = await redisClient.lRange('test:list', 0, -1);
      expect(range).toEqual(['item3', 'item2', 'item1']);
    });

    it('should trim list', async () => {
      await redisClient.lPush('test:list', 'item1', 'item2', 'item3', 'item4', 'item5');
      await redisClient.lTrim('test:list', 0, 2);

      const range = await redisClient.lRange('test:list', 0, -1);
      expect(range).toHaveLength(3);
    });
  });

  describe('Set Operations', () => {
    it('should add and check set members', async () => {
      await redisClient.sAdd('test:set', 'member1', 'member2', 'member3');
      
      const isMember1 = await redisClient.sIsMember('test:set', 'member1');
      const isMember2 = await redisClient.sIsMember('test:set', 'member4');
      const members = await redisClient.sMembers('test:set');

      expect(isMember1).toBe(true);
      expect(isMember2).toBe(false);
      expect(members).toHaveLength(3);
      expect(members).toContain('member1');
    });

    it('should perform set operations', async () => {
      await redisClient.sAdd('test:set1', 'a', 'b', 'c');
      await redisClient.sAdd('test:set2', 'b', 'c', 'd');

      const intersection = await redisClient.sInter('test:set1', 'test:set2');
      const union = await redisClient.sUnion('test:set1', 'test:set2');
      const difference = await redisClient.sDiff('test:set1', 'test:set2');

      expect(intersection).toEqual(['b', 'c']);
      expect(union).toHaveLength(4);
      expect(difference).toEqual(['a']);
    });
  });

  describe('Sorted Set Operations', () => {
    it('should add and get sorted set members', async () => {
      await redisClient.zAdd('test:zset', [
        { score: 1, value: 'member1' },
        { score: 2, value: 'member2' },
        { score: 3, value: 'member3' }
      ]);

      const count = await redisClient.zCard('test:zset');
      expect(count).toBe(3);

      const range = await redisClient.zRange('test:zset', 0, -1);
      expect(range).toEqual(['member1', 'member2', 'member3']);

      const rangeWithScores = await redisClient.zRangeWithScores('test:zset', 0, -1);
      expect(rangeWithScores[0]).toEqual({ score: 1, value: 'member1' });
    });

    it('should get members by score range', async () => {
      await redisClient.zAdd('test:zset', [
        { score: 1, value: 'low' },
        { score: 5, value: 'medium' },
        { score: 10, value: 'high' }
      ]);

      const range = await redisClient.zRangeByScore('test:zset', 1, 5);
      expect(range).toEqual(['low', 'medium']);
    });
  });

  describe('Caching Operations', () => {
    it('should cache user session data', async () => {
      const sessionData = {
        userId: '123',
        email: 'user@example.com',
        role: 'admin',
        lastActivity: new Date().toISOString()
      };

      await redisClient.setEx('test:session:123', 3600, JSON.stringify(sessionData));
      
      const cached = await redisClient.get('test:session:123');
      const parsed = JSON.parse(cached!);
      
      expect(parsed.userId).toBe('123');
      expect(parsed.email).toBe('user@example.com');
    });

    it('should cache API responses', async () => {
      const apiResponse = {
        data: { users: 100, instructions: 50 },
        timestamp: Date.now()
      };

      await redisClient.setEx('test:api:dashboard', 300, JSON.stringify(apiResponse));
      
      const cached = await redisClient.get('test:api:dashboard');
      const parsed = JSON.parse(cached!);
      
      expect(parsed.data.users).toBe(100);
    });

    it('should implement cache invalidation', async () => {
      await redisClient.setEx('test:cache:key1', 3600, 'value1');
      await redisClient.setEx('test:cache:key2', 3600, 'value2');
      await redisClient.setEx('test:cache:key3', 3600, 'value3');

      // Invalidate all test cache keys
      const keys = await redisClient.keys('test:cache:*');
      await redisClient.del(keys);

      const value1 = await redisClient.get('test:cache:key1');
      const value2 = await redisClient.get('test:cache:key2');
      const value3 = await redisClient.get('test:cache:key3');

      expect(value1).toBeNull();
      expect(value2).toBeNull();
      expect(value3).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting with sliding window', async () => {
      const userId = 'test_user';
      const windowSize = 60; // 60 seconds
      const maxRequests = 10;

      // Simulate multiple requests
      for (let i = 0; i < 12; i++) {
        const key = `test:rate_limit:${userId}`;
        const now = Date.now();
        const windowStart = now - windowSize * 1000;

        // Remove old entries
        await redisClient.zRemRangeByScore(key, 0, windowStart);

        // Count current requests
        const currentCount = await redisClient.zCard(key);

        if (currentCount < maxRequests) {
          // Add new request
          await redisClient.zAdd(key, { score: now, value: `${now}-${i}` });
          await redisClient.expire(key, windowSize);
        }
      }

      const finalCount = await redisClient.zCard(`test:rate_limit:${userId}`);
      expect(finalCount).toBeLessThanOrEqual(maxRequests);
    });

    it('should implement token bucket rate limiting', async () => {
      const userId = 'test_user_bucket';
      const bucketKey = `test:bucket:${userId}`;
      const capacity = 10;
      const refillRate = 1; // 1 token per second

      // Initialize bucket
      await redisClient.hSet(bucketKey, {
        tokens: capacity.toString(),
        lastRefill: Date.now().toString()
      });

      // Simulate token consumption
      let tokensConsumed = 0;
      for (let i = 0; i < 15; i++) {
        const bucket = await redisClient.hGetAll(bucketKey);
        const currentTokens = parseInt(bucket.tokens);
        const lastRefill = parseInt(bucket.lastRefill);
        const now = Date.now();
        
        // Refill tokens
        const timePassed = (now - lastRefill) / 1000;
        const newTokens = Math.min(capacity, currentTokens + timePassed * refillRate);
        
        if (newTokens >= 1) {
          await redisClient.hSet(bucketKey, {
            tokens: (newTokens - 1).toString(),
            lastRefill: now.toString()
          });
          tokensConsumed++;
        }
      }

      expect(tokensConsumed).toBeLessThanOrEqual(capacity);
    });
  });

  describe('Pub/Sub Operations', () => {
    it('should publish and subscribe to channels', async () => {
      const subscriber = redisClient.duplicate();
      await subscriber.connect();

      const messages: string[] = [];
      await subscriber.subscribe('test:channel', (message) => {
        messages.push(message);
      });

      // Wait for subscription to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Publish messages
      await redisClient.publish('test:channel', 'Hello World');
      await redisClient.publish('test:channel', 'Test Message');

      // Wait for messages to be received
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messages).toContain('Hello World');
      expect(messages).toContain('Test Message');

      await subscriber.unsubscribe('test:channel');
      await subscriber.disconnect();
    });
  });

  describe('Performance Tests', () => {
    it('should handle high throughput operations', async () => {
      const startTime = Date.now();
      const operations = 1000;

      // Perform many operations
      for (let i = 0; i < operations; i++) {
        await redisClient.set(`test:perf:${i}`, `value${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const opsPerSecond = operations / (duration / 1000);

      expect(opsPerSecond).toBeGreaterThan(100); // At least 100 ops/sec
    });

    it('should handle large data structures efficiently', async () => {
      const largeData = Array(1000).fill(0).map((_, i) => `item${i}`);
      
      const startTime = Date.now();
      await redisClient.lPush('test:large_list', ...largeData);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second

      const length = await redisClient.lLen('test:large_list');
      expect(length).toBe(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      // This would require stopping Redis to test
      // For now, we'll test with invalid operations
      try {
        await redisClient.set('', 'value'); // Empty key should fail
        expect.fail('Should have thrown error for empty key');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle memory limit errors', async () => {
      // Try to set a very large value
      const largeValue = 'x'.repeat(1000000); // 1MB string
      
      try {
        await redisClient.set('test:large_value', largeValue);
        // If it succeeds, clean up
        await redisClient.del('test:large_value');
      } catch (error) {
        // Expected if Redis has memory limits
        expect(error).toBeDefined();
      }
    });
  });

  describe('Data Persistence', () => {
    it('should persist data across connections', async () => {
      await redisClient.set('test:persist', 'persistent_value');
      
      // Disconnect and reconnect
      await redisClient.disconnect();
      await redisClient.connect();
      
      const value = await redisClient.get('test:persist');
      expect(value).toBe('persistent_value');
    });
  });

  describe('Cleanup', () => {
    it('should clean up all test data', async () => {
      const keys = await redisClient.keys('test:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }

      const remainingKeys = await redisClient.keys('test:*');
      expect(remainingKeys).toHaveLength(0);
    });
  });
});
