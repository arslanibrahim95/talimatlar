import { beforeAll, afterAll, beforeEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Test configuration
export const TEST_CONFIG = {
  // Service URLs
  services: {
    apiGateway: 'http://localhost:8080',
    authService: 'http://localhost:8004',
    analyticsService: 'http://localhost:8003',
    instructionService: 'http://localhost:8005',
    aiService: 'http://localhost:8006',
    frontend: 'http://localhost:3000'
  },
  
  // Database configuration
  database: {
    postgres: {
      host: 'localhost',
      port: 5433,
      database: 'safety_production',
      user: 'safety_admin',
      password: process.env.POSTGRES_PASSWORD || 'test_password'
    },
    redis: {
      host: 'localhost',
      port: 6380,
      password: process.env.REDIS_PASSWORD || undefined
    }
  },

  // Test timeouts
  timeouts: {
    serviceStartup: 60000, // 60 seconds
    healthCheck: 30000,    // 30 seconds
    testExecution: 300000  // 5 minutes
  },

  // Test data
  testUsers: {
    regular: {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    },
    admin: {
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    }
  },

  // Test instructions
  testInstructions: {
    basic: {
      title: 'Test Safety Instruction',
      content: 'This is a test safety instruction for integration testing',
      category: 'safety',
      priority: 'high',
      tags: ['test', 'safety'],
      department: 'Testing'
    },
    electrical: {
      title: 'Electrical Safety Instruction',
      content: 'Safety procedures for working with electrical equipment',
      category: 'electrical',
      priority: 'critical',
      tags: ['electrical', 'safety', 'equipment'],
      department: 'Maintenance'
    }
  },

  // Test documents
  testDocuments: {
    safety: {
      title: 'Test Safety Document',
      content: 'This is a test safety document for integration testing',
      category: 'safety',
      type: 'pdf'
    }
  }
};

// Service health check
export async function checkServiceHealth(port: number, healthEndpoint: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}${healthEndpoint}`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Wait for service to be ready
export async function waitForService(
  port: number, 
  healthEndpoint: string, 
  timeout: number = TEST_CONFIG.timeouts.healthCheck
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await checkServiceHealth(port, healthEndpoint)) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Service on port ${port} did not become ready within ${timeout}ms`);
}

// Start all test services
export async function startTestServices(): Promise<void> {
  console.log('🚀 Starting test services...');
  
  try {
    // Start Docker services
    await execAsync('docker-compose -f docker-compose.test.yml up -d');
    
    // Wait for services to be ready
    const serviceChecks = [
      { name: 'PostgreSQL', port: 5433, endpoint: '/health' },
      { name: 'Redis', port: 6380, endpoint: '/ping' },
      { name: 'Auth Service', port: 8004, endpoint: '/auth/health' },
      { name: 'Analytics Service', port: 8003, endpoint: '/analytics/health' },
      { name: 'Instruction Service', port: 8005, endpoint: '/instructions/health' },
      { name: 'AI Service', port: 8006, endpoint: '/health' },
      { name: 'API Gateway', port: 8080, endpoint: '/gateway/health' },
      { name: 'Frontend', port: 3000, endpoint: '/' }
    ];

    const healthChecks = serviceChecks.map(async (service) => {
      try {
        await waitForService(service.port, service.endpoint);
        console.log(`✅ ${service.name} is ready`);
      } catch (error) {
        console.warn(`⚠️  ${service.name} is not ready: ${error.message}`);
      }
    });
    
    await Promise.all(healthChecks);
    console.log('🎉 All test services are ready');
    
  } catch (error) {
    console.error('❌ Failed to start test services:', error);
    throw error;
  }
}

// Stop all test services
export async function stopTestServices(): Promise<void> {
  console.log('🛑 Stopping test services...');
  
  try {
    await execAsync('docker-compose -f docker-compose.test.yml down -v');
    console.log('✅ Test services stopped');
  } catch (error) {
    console.error('❌ Failed to stop test services:', error);
  }
}

// Setup test database
export async function setupTestDatabase(): Promise<void> {
  console.log('🗄️  Setting up test database...');
  
  try {
    // Run database migrations
    await execAsync('npm run db:migrate:test');
    
    // Seed test data
    await execAsync('npm run db:seed:test');
    
    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
}

// Cleanup test database
export async function cleanupTestDatabase(): Promise<void> {
  console.log('🧹 Cleaning up test database...');
  
  try {
    await execAsync('npm run db:clean:test');
    console.log('✅ Test database cleanup complete');
  } catch (error) {
    console.error('❌ Failed to cleanup test database:', error);
  }
}

// Create test user and get token
export async function createTestUser(userData: any): Promise<string> {
  // Register user
  const registerResponse = await fetch(`${TEST_CONFIG.services.authService}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  if (!registerResponse.ok) {
    throw new Error(`Failed to register test user: ${registerResponse.statusText}`);
  }

  // Login to get token
  const loginResponse = await fetch(`${TEST_CONFIG.services.authService}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password
    })
  });

  if (!loginResponse.ok) {
    throw new Error(`Failed to login test user: ${loginResponse.statusText}`);
  }

  const result = await loginResponse.json();
  return result.token;
}

// Cleanup test data
export async function cleanupTestData(): Promise<void> {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // This would clean up all test data from the database
    // Implementation depends on your database structure
    console.log('✅ Test data cleanup complete');
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
  }
}

// Global test setup
beforeAll(async () => {
  console.log('🔧 Setting up integration tests...');
  
  try {
    await startTestServices();
    await setupTestDatabase();
    console.log('✅ Integration test setup complete');
  } catch (error) {
    console.error('❌ Integration test setup failed:', error);
    throw error;
  }
}, TEST_CONFIG.timeouts.serviceStartup);

// Global test teardown
afterAll(async () => {
  console.log('🧹 Tearing down integration tests...');
  
  try {
    await cleanupTestData();
    await cleanupTestDatabase();
    await stopTestServices();
    console.log('✅ Integration test teardown complete');
  } catch (error) {
    console.error('❌ Integration test teardown failed:', error);
  }
}, TEST_CONFIG.timeouts.serviceStartup);

// Test cleanup before each test
beforeEach(async () => {
  // Clean up test data before each test
  try {
    await cleanupTestData();
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
});

// Utility functions for tests
export const TestUtils = {
  // Generate random test data
  generateRandomEmail: () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`,
  
  // Generate random string
  generateRandomString: (length: number = 10) => Math.random().toString(36).substr(2, length),
  
  // Wait for condition
  waitFor: async (condition: () => Promise<boolean>, timeout: number = 5000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  },
  
  // Retry function
  retry: async <T>(
    fn: () => Promise<T>, 
    maxAttempts: number = 3, 
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }
};

// Export test configuration
export default TEST_CONFIG;
