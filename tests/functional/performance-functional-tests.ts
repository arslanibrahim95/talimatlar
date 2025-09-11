import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios, { AxiosInstance } from 'axios';
import { performance } from 'perf_hooks';

/**
 * Performance Functional Tests
 * Tests system performance under various load conditions
 */

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface LoadTestConfig {
  concurrentUsers: number;
  requestsPerUser: number;
  duration: number; // in seconds
}

class PerformanceFunctionalTestSuite {
  private authApi: AxiosInstance;
  private analyticsApi: AxiosInstance;
  private instructionApi: AxiosInstance;
  private aiApi: AxiosInstance;
  private authToken: string = '';
  private performanceMetrics: PerformanceMetrics[] = [];

  constructor() {
    this.authApi = axios.create({
      baseURL: 'http://localhost:8004',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.analyticsApi = axios.create({
      baseURL: 'http://localhost:8003',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.instructionApi = axios.create({
      baseURL: 'http://localhost:8005',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.aiApi = axios.create({
      baseURL: 'http://localhost:8006',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async setup() {
    // Authenticate for API tests
    await this.authenticate();
  }

  async authenticate(): Promise<void> {
    try {
      const response = await this.authApi.post('/auth/login', {
        email: 'admin@test.com',
        password: 'admin123'
      });
      
      this.authToken = response.data.token;
      console.log('✅ Authentication successful for performance tests');
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

  async measureResponseTime(apiCall: () => Promise<any>): Promise<number> {
    const startTime = performance.now();
    await apiCall();
    const endTime = performance.now();
    return endTime - startTime;
  }

  async runLoadTest(config: LoadTestConfig, apiCall: () => Promise<any>): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    const errors: Error[] = [];
    const responseTimes: number[] = [];

    // Create concurrent users
    const userPromises = Array(config.concurrentUsers).fill(null).map(async (_, userIndex) => {
      const userErrors: Error[] = [];
      const userResponseTimes: number[] = [];

      for (let i = 0; i < config.requestsPerUser; i++) {
        try {
          const responseTime = await this.measureResponseTime(apiCall);
          userResponseTimes.push(responseTime);
        } catch (error) {
          userErrors.push(error as Error);
        }
      }

      return { errors: userErrors, responseTimes: userResponseTimes };
    });

    const results = await Promise.all(userPromises);
    
    // Aggregate results
    results.forEach(result => {
      errors.push(...result.errors);
      responseTimes.push(...result.responseTimes);
    });

    const endTime = performance.now();
    const totalDuration = (endTime - startTime) / 1000; // Convert to seconds

    const totalRequests = config.concurrentUsers * config.requestsPerUser;
    const successfulRequests = totalRequests - errors.length;
    const errorRate = (errors.length / totalRequests) * 100;
    const throughput = successfulRequests / totalDuration;
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

    return {
      responseTime: avgResponseTime,
      throughput,
      errorRate,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: process.cpuUsage().user / 1000000 // Convert to seconds
    };
  }

  async runStressTest(apiCall: () => Promise<any>): Promise<PerformanceMetrics> {
    const stressConfig: LoadTestConfig = {
      concurrentUsers: 50,
      requestsPerUser: 10,
      duration: 60
    };

    return await this.runLoadTest(stressConfig, apiCall);
  }

  async runSpikeTest(apiCall: () => Promise<any>): Promise<PerformanceMetrics> {
    // Simulate sudden spike in traffic
    const spikeConfig: LoadTestConfig = {
      concurrentUsers: 100,
      requestsPerUser: 5,
      duration: 30
    };

    return await this.runLoadTest(spikeConfig, apiCall);
  }

  async runVolumeTest(apiCall: () => Promise<any>): Promise<PerformanceMetrics> {
    // Test with high volume of data
    const volumeConfig: LoadTestConfig = {
      concurrentUsers: 20,
      requestsPerUser: 50,
      duration: 120
    };

    return await this.runLoadTest(volumeConfig, apiCall);
  }
}

describe('Performance Functional Tests', () => {
  const testSuite = new PerformanceFunctionalTestSuite();

  beforeAll(async () => {
    await testSuite.setup();
  });

  describe('Response Time Tests', () => {
    it('should respond to authentication requests within 500ms', async () => {
      const responseTime = await testSuite.measureResponseTime(async () => {
        await testSuite.authApi.post('/auth/login', {
          email: 'user@test.com',
          password: 'user123'
        });
      });

      expect(responseTime).toBeLessThan(500);
      console.log(`✅ Auth response time: ${responseTime.toFixed(2)}ms`);
    });

    it('should respond to instruction requests within 1s', async () => {
      const responseTime = await testSuite.measureResponseTime(async () => {
        await testSuite.instructionApi.get('/api/instructions', {
          headers: testSuite.getAuthHeaders()
        });
      });

      expect(responseTime).toBeLessThan(1000);
      console.log(`✅ Instructions response time: ${responseTime.toFixed(2)}ms`);
    });

    it('should respond to analytics requests within 2s', async () => {
      const responseTime = await testSuite.measureResponseTime(async () => {
        await testSuite.analyticsApi.get('/api/analytics/dashboard', {
          headers: testSuite.getAuthHeaders()
        });
      });

      expect(responseTime).toBeLessThan(2000);
      console.log(`✅ Analytics response time: ${responseTime.toFixed(2)}ms`);
    });

    it('should respond to AI requests within 5s', async () => {
      const responseTime = await testSuite.measureResponseTime(async () => {
        await testSuite.aiApi.get('/api/chat/history', {
          headers: testSuite.getAuthHeaders()
        });
      });

      expect(responseTime).toBeLessThan(5000);
      console.log(`✅ AI response time: ${responseTime.toFixed(2)}ms`);
    });
  });

  describe('Load Tests', () => {
    it('should handle normal load (10 concurrent users)', async () => {
      const config: LoadTestConfig = {
        concurrentUsers: 10,
        requestsPerUser: 5,
        duration: 30
      };

      const metrics = await testSuite.runLoadTest(config, async () => {
        await testSuite.instructionApi.get('/api/instructions', {
          headers: testSuite.getAuthHeaders()
        });
      });

      expect(metrics.errorRate).toBeLessThan(5); // Less than 5% error rate
      expect(metrics.responseTime).toBeLessThan(2000); // Less than 2s average response time
      expect(metrics.throughput).toBeGreaterThan(1); // At least 1 request per second

      console.log(`✅ Normal load test - Error rate: ${metrics.errorRate.toFixed(2)}%, Response time: ${metrics.responseTime.toFixed(2)}ms, Throughput: ${metrics.throughput.toFixed(2)} req/s`);
    });

    it('should handle high load (50 concurrent users)', async () => {
      const config: LoadTestConfig = {
        concurrentUsers: 50,
        requestsPerUser: 10,
        duration: 60
      };

      const metrics = await testSuite.runLoadTest(config, async () => {
        await testSuite.instructionApi.get('/api/instructions', {
          headers: testSuite.getAuthHeaders()
        });
      });

      expect(metrics.errorRate).toBeLessThan(10); // Less than 10% error rate
      expect(metrics.responseTime).toBeLessThan(5000); // Less than 5s average response time
      expect(metrics.throughput).toBeGreaterThan(5); // At least 5 requests per second

      console.log(`✅ High load test - Error rate: ${metrics.errorRate.toFixed(2)}%, Response time: ${metrics.responseTime.toFixed(2)}ms, Throughput: ${metrics.throughput.toFixed(2)} req/s`);
    });

    it('should handle stress load (100 concurrent users)', async () => {
      const metrics = await testSuite.runStressTest(async () => {
        await testSuite.instructionApi.get('/api/instructions', {
          headers: testSuite.getAuthHeaders()
        });
      });

      expect(metrics.errorRate).toBeLessThan(20); // Less than 20% error rate under stress
      expect(metrics.responseTime).toBeLessThan(10000); // Less than 10s average response time
      expect(metrics.throughput).toBeGreaterThan(2); // At least 2 requests per second

      console.log(`✅ Stress test - Error rate: ${metrics.errorRate.toFixed(2)}%, Response time: ${metrics.responseTime.toFixed(2)}ms, Throughput: ${metrics.throughput.toFixed(2)} req/s`);
    });
  });

  describe('Spike Tests', () => {
    it('should handle traffic spikes gracefully', async () => {
      const metrics = await testSuite.runSpikeTest(async () => {
        await testSuite.instructionApi.get('/api/instructions', {
          headers: testSuite.getAuthHeaders()
        });
      });

      expect(metrics.errorRate).toBeLessThan(30); // Less than 30% error rate during spikes
      expect(metrics.responseTime).toBeLessThan(15000); // Less than 15s average response time

      console.log(`✅ Spike test - Error rate: ${metrics.errorRate.toFixed(2)}%, Response time: ${metrics.responseTime.toFixed(2)}ms`);
    });

    it('should recover quickly after traffic spike', async () => {
      // Run spike test
      await testSuite.runSpikeTest(async () => {
        await testSuite.instructionApi.get('/api/instructions', {
          headers: testSuite.getAuthHeaders()
        });
      });

      // Wait a moment for system to stabilize
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Test normal performance after spike
      const responseTime = await testSuite.measureResponseTime(async () => {
        await testSuite.instructionApi.get('/api/instructions', {
          headers: testSuite.getAuthHeaders()
        });
      });

      expect(responseTime).toBeLessThan(2000); // Should return to normal performance
      console.log(`✅ Recovery test - Response time after spike: ${responseTime.toFixed(2)}ms`);
    });
  });

  describe('Volume Tests', () => {
    it('should handle high volume of data requests', async () => {
      const metrics = await testSuite.runVolumeTest(async () => {
        await testSuite.instructionApi.get('/api/instructions', {
          headers: testSuite.getAuthHeaders()
        });
      });

      expect(metrics.errorRate).toBeLessThan(15); // Less than 15% error rate
      expect(metrics.throughput).toBeGreaterThan(3); // At least 3 requests per second

      console.log(`✅ Volume test - Error rate: ${metrics.errorRate.toFixed(2)}%, Throughput: ${metrics.throughput.toFixed(2)} req/s`);
    });

    it('should handle large data sets efficiently', async () => {
      // Create multiple instructions to test with larger dataset
      const instructionPromises = Array(20).fill(null).map(async (_, index) => {
        return testSuite.instructionApi.post('/api/instructions', {
          title: `Volume Test Instruction ${index}`,
          content: `This is test instruction ${index} for volume testing`,
          category: 'Safety'
        }, {
          headers: testSuite.getAuthHeaders()
        });
      });

      const createStartTime = performance.now();
      await Promise.all(instructionPromises);
      const createEndTime = performance.now();

      const createTime = createEndTime - createStartTime;
      expect(createTime).toBeLessThan(10000); // Should create 20 instructions in less than 10s

      // Test retrieval performance with larger dataset
      const retrieveStartTime = performance.now();
      await testSuite.instructionApi.get('/api/instructions', {
        headers: testSuite.getAuthHeaders()
      });
      const retrieveEndTime = performance.now();

      const retrieveTime = retrieveEndTime - retrieveStartTime;
      expect(retrieveTime).toBeLessThan(2000); // Should retrieve all instructions in less than 2s

      console.log(`✅ Large dataset test - Create time: ${createTime.toFixed(2)}ms, Retrieve time: ${retrieveTime.toFixed(2)}ms`);

      // Clean up test data
      const instructions = await testSuite.instructionApi.get('/api/instructions', {
        headers: testSuite.getAuthHeaders()
      });

      const deletePromises = instructions.data
        .filter((instruction: any) => instruction.title.includes('Volume Test Instruction'))
        .map((instruction: any) => 
          testSuite.instructionApi.delete(`/api/instructions/${instruction.id}`, {
            headers: testSuite.getAuthHeaders()
          })
        );

      await Promise.all(deletePromises);
    });
  });

  describe('Memory and Resource Tests', () => {
    it('should not have memory leaks during extended operation', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Run multiple operations
      for (let i = 0; i < 100; i++) {
        await testSuite.instructionApi.get('/api/instructions', {
          headers: testSuite.getAuthHeaders()
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      expect(memoryIncrease).toBeLessThan(100); // Should not increase by more than 100MB
      console.log(`✅ Memory test - Memory increase: ${memoryIncrease.toFixed(2)}MB`);
    });

    it('should handle concurrent database connections efficiently', async () => {
      const connectionPromises = Array(20).fill(null).map(async () => {
        return testSuite.instructionApi.get('/api/instructions', {
          headers: testSuite.getAuthHeaders()
        });
      });

      const startTime = performance.now();
      await Promise.all(connectionPromises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // Should handle 20 concurrent connections in less than 5s

      console.log(`✅ Database connection test - 20 concurrent connections in ${totalTime.toFixed(2)}ms`);
    });
  });

  describe('API Endpoint Performance', () => {
    it('should perform well on authentication endpoints', async () => {
      const metrics = await testSuite.runLoadTest({
        concurrentUsers: 20,
        requestsPerUser: 5,
        duration: 30
      }, async () => {
        await testSuite.authApi.post('/auth/login', {
          email: 'user@test.com',
          password: 'user123'
        });
      });

      expect(metrics.errorRate).toBeLessThan(5);
      expect(metrics.responseTime).toBeLessThan(1000);
      console.log(`✅ Auth endpoint performance - Error rate: ${metrics.errorRate.toFixed(2)}%, Response time: ${metrics.responseTime.toFixed(2)}ms`);
    });

    it('should perform well on analytics endpoints', async () => {
      const metrics = await testSuite.runLoadTest({
        concurrentUsers: 15,
        requestsPerUser: 3,
        duration: 30
      }, async () => {
        await testSuite.analyticsApi.get('/api/analytics/dashboard', {
          headers: testSuite.getAuthHeaders()
        });
      });

      expect(metrics.errorRate).toBeLessThan(10);
      expect(metrics.responseTime).toBeLessThan(3000);
      console.log(`✅ Analytics endpoint performance - Error rate: ${metrics.errorRate.toFixed(2)}%, Response time: ${metrics.responseTime.toFixed(2)}ms`);
    });

    it('should perform well on AI endpoints', async () => {
      const metrics = await testSuite.runLoadTest({
        concurrentUsers: 10,
        requestsPerUser: 2,
        duration: 30
      }, async () => {
        await testSuite.aiApi.get('/api/chat/history', {
          headers: testSuite.getAuthHeaders()
        });
      });

      expect(metrics.errorRate).toBeLessThan(15);
      expect(metrics.responseTime).toBeLessThan(5000);
      console.log(`✅ AI endpoint performance - Error rate: ${metrics.errorRate.toFixed(2)}%, Response time: ${metrics.responseTime.toFixed(2)}ms`);
    });
  });

  describe('System Resource Monitoring', () => {
    it('should monitor CPU usage during load', async () => {
      const initialCpu = process.cpuUsage();
      
      await testSuite.runLoadTest({
        concurrentUsers: 30,
        requestsPerUser: 10,
        duration: 30
      }, async () => {
        await testSuite.instructionApi.get('/api/instructions', {
          headers: testSuite.getAuthHeaders()
        });
      });

      const finalCpu = process.cpuUsage(initialCpu);
      const cpuUsage = finalCpu.user / 1000000; // Convert to seconds

      expect(cpuUsage).toBeLessThan(60); // Should not use more than 60 seconds of CPU time
      console.log(`✅ CPU usage test - CPU time used: ${cpuUsage.toFixed(2)}s`);
    });

    it('should monitor memory usage during load', async () => {
      const initialMemory = process.memoryUsage();
      
      await testSuite.runLoadTest({
        concurrentUsers: 25,
        requestsPerUser: 8,
        duration: 45
      }, async () => {
        await testSuite.instructionApi.get('/api/instructions', {
          headers: testSuite.getAuthHeaders()
        });
      });

      const finalMemory = process.memoryUsage();
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024; // MB

      expect(memoryIncrease).toBeLessThan(200); // Should not increase by more than 200MB
      console.log(`✅ Memory usage test - Memory increase: ${memoryIncrease.toFixed(2)}MB`);
    });
  });
});
