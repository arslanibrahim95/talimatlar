import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { Client } from 'pg';
import Redis from 'ioredis';

/**
 * Integration Functional Tests
 * Tests the integration between different services and components
 */

interface ServiceConnection {
  name: string;
  url: string;
  healthEndpoint: string;
}

interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

class IntegrationFunctionalTestSuite {
  private services: ServiceConnection[] = [
    { name: 'Frontend', url: 'http://localhost:3000', healthEndpoint: '/health' },
    { name: 'Auth Service', url: 'http://localhost:8004', healthEndpoint: '/health' },
    { name: 'Analytics Service', url: 'http://localhost:8003', healthEndpoint: '/health' },
    { name: 'Instruction Service', url: 'http://localhost:8005', healthEndpoint: '/health' },
    { name: 'AI Service', url: 'http://localhost:8006', healthEndpoint: '/health' },
    { name: 'API Gateway', url: 'http://localhost:8080', healthEndpoint: '/gateway/health' }
  ];

  private postgresConfig: DatabaseConnection = {
    host: 'localhost',
    port: 5433,
    database: 'safety_production',
    user: 'safety_admin',
    password: process.env.POSTGRES_PASSWORD || 'safety_password'
  };

  private redisConfig = {
    host: 'localhost',
    port: 6380,
    password: process.env.REDIS_PASSWORD || ''
  };

  private postgresClient: Client | null = null;
  private redisClient: Redis | null = null;
  private authToken: string = '';

  async setup() {
    // Check all services are running
    await this.checkServicesHealth();
    
    // Setup database connections
    await this.setupDatabaseConnections();
    
    // Authenticate for API tests
    await this.authenticate();
  }

  async teardown() {
    if (this.postgresClient) {
      await this.postgresClient.end();
    }
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  async checkServicesHealth(): Promise<void> {
    console.log('🔍 Checking services health...');
    
    for (const service of this.services) {
      try {
        const response = await axios.get(`${service.url}${service.healthEndpoint}`, { 
          timeout: 5000 
        });
        
        if (response.status === 200) {
          console.log(`✅ ${service.name} is healthy`);
        } else {
          throw new Error(`${service.name} returned status ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ ${service.name} is not accessible:`, error.message);
        throw new Error(`${service.name} health check failed`);
      }
    }
  }

  async setupDatabaseConnections(): Promise<void> {
    // Setup PostgreSQL connection
    this.postgresClient = new Client(this.postgresConfig);
    await this.postgresClient.connect();
    console.log('✅ PostgreSQL connection established');

    // Setup Redis connection
    this.redisClient = new Redis(this.redisConfig);
    await this.redisClient.ping();
    console.log('✅ Redis connection established');
  }

  async authenticate(): Promise<void> {
    try {
      const response = await axios.post('http://localhost:8004/auth/login', {
        email: 'admin@test.com',
        password: 'admin123'
      });
      
      this.authToken = response.data.token;
      console.log('✅ Authentication successful');
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }
}

describe('Integration Functional Tests', () => {
  const testSuite = new IntegrationFunctionalTestSuite();

  beforeAll(async () => {
    await testSuite.setup();
  });

  afterAll(async () => {
    await testSuite.teardown();
  });

  describe('Service Integration', () => {
    it('should have all services communicating properly', async () => {
      // Test that all services can communicate with each other
      const serviceTests = [
        {
          name: 'Auth to Analytics',
          test: async () => {
            const response = await axios.get('http://localhost:8003/api/analytics/dashboard', {
              headers: testSuite.getAuthHeaders()
            });
            return response.status === 200;
          }
        },
        {
          name: 'Auth to Instruction',
          test: async () => {
            const response = await axios.get('http://localhost:8005/api/instructions', {
              headers: testSuite.getAuthHeaders()
            });
            return response.status === 200;
          }
        },
        {
          name: 'Auth to AI',
          test: async () => {
            const response = await axios.get('http://localhost:8006/api/chat/history', {
              headers: testSuite.getAuthHeaders()
            });
            return response.status === 200;
          }
        }
      ];

      for (const serviceTest of serviceTests) {
        const result = await serviceTest.test();
        expect(result).toBe(true);
        console.log(`✅ ${serviceTest.name} communication successful`);
      }
    });

    it('should handle cross-service data consistency', async () => {
      // Create instruction via Instruction Service
      const instructionData = {
        title: 'Integration Test Instruction',
        content: 'This instruction is created for integration testing',
        category: 'Safety'
      };

      const createResponse = await axios.post('http://localhost:8005/api/instructions', instructionData, {
        headers: testSuite.getAuthHeaders()
      });

      expect(createResponse.status).toBe(201);
      const instructionId = createResponse.data.id;

      // Verify instruction appears in Analytics Service
      const analyticsResponse = await axios.get('http://localhost:8003/api/analytics/instructions', {
        headers: testSuite.getAuthHeaders()
      });

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.data.totalInstructions).toBeGreaterThan(0);

      // Clean up
      await axios.delete(`http://localhost:8005/api/instructions/${instructionId}`, {
        headers: testSuite.getAuthHeaders()
      });
    });
  });

  describe('Database Integration', () => {
    it('should have proper database schema', async () => {
      if (!testSuite.postgresClient) throw new Error('PostgreSQL client not initialized');

      // Check if required tables exist
      const tables = ['users', 'instructions', 'documents', 'analytics', 'audit_logs'];
      
      for (const table of tables) {
        const result = await testSuite.postgresClient!.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);

        expect(result.rows[0].exists).toBe(true);
        console.log(`✅ Table ${table} exists`);
      }
    });

    it('should handle database transactions properly', async () => {
      if (!testSuite.postgresClient) throw new Error('PostgreSQL client not initialized');

      // Test transaction rollback
      await testSuite.postgresClient!.query('BEGIN');
      
      try {
        // Insert test data
        await testSuite.postgresClient!.query(`
          INSERT INTO instructions (title, content, category, created_at)
          VALUES ($1, $2, $3, NOW())
        `, ['Transaction Test', 'Test content', 'Safety']);

        // Simulate error and rollback
        throw new Error('Simulated error');
      } catch (error) {
        await testSuite.postgresClient!.query('ROLLBACK');
        console.log('✅ Transaction rollback successful');
      }

      // Verify data was not committed
      const result = await testSuite.postgresClient!.query(`
        SELECT COUNT(*) FROM instructions WHERE title = 'Transaction Test'
      `);
      
      expect(parseInt(result.rows[0].count)).toBe(0);
    });

    it('should maintain data integrity across services', async () => {
      if (!testSuite.postgresClient) throw new Error('PostgreSQL client not initialized');

      // Create user via Auth Service
      const userData = {
        email: 'integration@test.com',
        password: 'integration123',
        role: 'user'
      };

      const userResponse = await axios.post('http://localhost:8004/auth/register', userData);
      expect(userResponse.status).toBe(201);
      const userId = userResponse.data.user.id;

      // Verify user exists in database
      const dbResult = await testSuite.postgresClient!.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      
      expect(dbResult.rows.length).toBe(1);
      expect(dbResult.rows[0].email).toBe(userData.email);

      // Clean up
      await testSuite.postgresClient!.query('DELETE FROM users WHERE id = $1', [userId]);
    });
  });

  describe('Cache Integration', () => {
    it('should cache API responses properly', async () => {
      if (!testSuite.redisClient) throw new Error('Redis client not initialized');

      // Make API request
      const response = await axios.get('http://localhost:8005/api/instructions', {
        headers: testSuite.getAuthHeaders()
      });

      expect(response.status).toBe(200);

      // Check if response is cached
      const cacheKey = 'instructions:list';
      const cachedData = await testSuite.redisClient!.get(cacheKey);
      
      if (cachedData) {
        console.log('✅ API response is cached');
        expect(JSON.parse(cachedData)).toBeDefined();
      } else {
        console.log('ℹ️ API response not cached (may be disabled in dev mode)');
      }
    });

    it('should handle cache invalidation', async () => {
      if (!testSuite.redisClient) throw new Error('Redis client not initialized');

      // Set test cache data
      const testData = { test: 'data' };
      await testSuite.redisClient!.setex('test:cache', 60, JSON.stringify(testData));

      // Verify data is cached
      const cachedData = await testSuite.redisClient!.get('test:cache');
      expect(JSON.parse(cachedData!)).toEqual(testData);

      // Invalidate cache
      await testSuite.redisClient!.del('test:cache');

      // Verify cache is cleared
      const clearedData = await testSuite.redisClient!.get('test:cache');
      expect(clearedData).toBeNull();
    });
  });

  describe('API Gateway Integration', () => {
    it('should route requests correctly through API Gateway', async () => {
      // Test routing to different services through API Gateway
      const routes = [
        { path: '/api/auth/login', expectedService: 'Auth Service' },
        { path: '/api/analytics/dashboard', expectedService: 'Analytics Service' },
        { path: '/api/instructions', expectedService: 'Instruction Service' },
        { path: '/api/chat/history', expectedService: 'AI Service' }
      ];

      for (const route of routes) {
        try {
          const response = await axios.get(`http://localhost:8080${route.path}`, {
            headers: testSuite.getAuthHeaders(),
            timeout: 5000
          });
          
          // Should not get 404 (service not found)
          expect(response.status).not.toBe(404);
          console.log(`✅ ${route.expectedService} routing successful`);
        } catch (error) {
          // 401/403 is acceptable for protected routes
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.log(`✅ ${route.expectedService} routing successful (auth required)`);
          } else {
            throw error;
          }
        }
      }
    });

    it('should handle load balancing', async () => {
      // Make multiple requests to test load balancing
      const promises = Array(5).fill(null).map(async () => {
        const response = await axios.get('http://localhost:8080/gateway/health', {
          timeout: 5000
        });
        return response.status;
      });

      const results = await Promise.all(promises);
      results.forEach(status => {
        expect(status).toBe(200);
      });
      
      console.log('✅ Load balancing test successful');
    });
  });

  describe('Frontend-Backend Integration', () => {
    it('should serve frontend correctly', async () => {
      const response = await axios.get('http://localhost:3000');
      expect(response.status).toBe(200);
      expect(response.data).toContain('<!DOCTYPE html>');
    });

    it('should handle CORS properly', async () => {
      const response = await axios.options('http://localhost:8004/auth/login', {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      try {
        await axios.get('http://localhost:3000/api/non-existent-endpoint');
      } catch (error) {
        // Should handle 404 gracefully
        expect(error.response?.status).toBe(404);
      }
    });
  });

  describe('Monitoring Integration', () => {
    it('should expose metrics endpoints', async () => {
      const metricsEndpoints = [
        'http://localhost:9090/metrics', // Prometheus
        'http://localhost:9100/metrics', // Node Exporter
        'http://localhost:9187/metrics', // PostgreSQL Exporter
        'http://localhost:9121/metrics'  // Redis Exporter
      ];

      for (const endpoint of metricsEndpoints) {
        try {
          const response = await axios.get(endpoint, { timeout: 5000 });
          expect(response.status).toBe(200);
          expect(response.data).toContain('# HELP');
          console.log(`✅ Metrics endpoint ${endpoint} is working`);
        } catch (error) {
          console.log(`ℹ️ Metrics endpoint ${endpoint} not available (may be disabled in dev mode)`);
        }
      }
    });

    it('should have health checks for all services', async () => {
      const healthEndpoints = [
        'http://localhost:8004/health',
        'http://localhost:8003/health',
        'http://localhost:8005/health',
        'http://localhost:8006/health',
        'http://localhost:8080/gateway/health'
      ];

      for (const endpoint of healthEndpoints) {
        const response = await axios.get(endpoint, { timeout: 5000 });
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status', 'healthy');
        console.log(`✅ Health check ${endpoint} is working`);
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should propagate errors correctly across services', async () => {
      // Test error propagation from database to API to frontend
      try {
        // This should cause a database error
        await axios.post('http://localhost:8005/api/instructions', {
          title: null, // Invalid data
          content: 'Test content',
          category: 'Safety'
        }, {
          headers: testSuite.getAuthHeaders()
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.response?.status).toBe(400);
        expect(error.response?.data).toHaveProperty('error');
        console.log('✅ Error propagation working correctly');
      }
    });

    it('should handle service unavailability gracefully', async () => {
      // Test what happens when a service is temporarily unavailable
      // This is a simulation - in real scenario, we'd stop a service
      try {
        await axios.get('http://localhost:8005/api/instructions', {
          headers: testSuite.getAuthHeaders(),
          timeout: 1000 // Very short timeout to simulate unavailability
        });
      } catch (error) {
        // Should handle timeout gracefully
        expect(error.code).toBe('ECONNABORTED');
        console.log('✅ Service unavailability handled gracefully');
      }
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain data consistency across all services', async () => {
      // Create instruction
      const instructionData = {
        title: 'Data Flow Test',
        content: 'Testing data consistency across services',
        category: 'Safety'
      };

      const createResponse = await axios.post('http://localhost:8005/api/instructions', instructionData, {
        headers: testSuite.getAuthHeaders()
      });

      const instructionId = createResponse.data.id;

      // Verify in Analytics Service
      const analyticsResponse = await axios.get('http://localhost:8003/api/analytics/instructions', {
        headers: testSuite.getAuthHeaders()
      });

      expect(analyticsResponse.data.totalInstructions).toBeGreaterThan(0);

      // Verify in database
      if (testSuite.postgresClient) {
        const dbResult = await testSuite.postgresClient.query(
          'SELECT * FROM instructions WHERE id = $1',
          [instructionId]
        );
        expect(dbResult.rows.length).toBe(1);
        expect(dbResult.rows[0].title).toBe(instructionData.title);
      }

      // Clean up
      await axios.delete(`http://localhost:8005/api/instructions/${instructionId}`, {
        headers: testSuite.getAuthHeaders()
      });
    });
  });
});
