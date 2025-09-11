import { beforeAll, afterAll, beforeEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Test configuration
const TEST_CONFIG = {
  services: {
    auth: { port: 8004, healthCheck: '/auth/health' },
    analytics: { port: 8003, healthCheck: '/analytics/health' },
    instructions: { port: 8005, healthCheck: '/instructions/health' },
    notifications: { port: 8007, healthCheck: '/notifications/health' }
  },
  database: {
    postgres: { port: 5433 },
    redis: { port: 6380 }
  },
  timeout: 30000 // 30 seconds
};

// Service health check
async function checkServiceHealth(port: number, healthEndpoint: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}${healthEndpoint}`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Wait for service to be ready
async function waitForService(port: number, healthEndpoint: string, timeout: number = 30000): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await checkServiceHealth(port, healthEndpoint)) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Service on port ${port} did not become ready within ${timeout}ms`);
}

// Start test services
async function startTestServices(): Promise<void> {
  console.log('Starting test services...');
  
  try {
    // Start Docker services
    await execAsync('docker-compose -f docker-compose.test.yml up -d');
    
    // Wait for services to be ready
    const serviceChecks = Object.entries(TEST_CONFIG.services).map(([name, config]) =>
      waitForService(config.port, config.healthCheck).then(() => {
        console.log(`✓ ${name} service is ready`);
      })
    );
    
    await Promise.all(serviceChecks);
    console.log('All test services are ready');
    
  } catch (error) {
    console.error('Failed to start test services:', error);
    throw error;
  }
}

// Stop test services
async function stopTestServices(): Promise<void> {
  console.log('Stopping test services...');
  
  try {
    await execAsync('docker-compose -f docker-compose.test.yml down -v');
    console.log('Test services stopped');
  } catch (error) {
    console.error('Failed to stop test services:', error);
  }
}

// Setup test database
async function setupTestDatabase(): Promise<void> {
  console.log('Setting up test database...');
  
  try {
    // Run database migrations
    await execAsync('npm run db:migrate:test');
    
    // Seed test data
    await execAsync('npm run db:seed:test');
    
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

// Cleanup test database
async function cleanupTestDatabase(): Promise<void> {
  console.log('Cleaning up test database...');
  
  try {
    await execAsync('npm run db:clean:test');
    console.log('Test database cleanup complete');
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
  }
}

// Global setup
beforeAll(async () => {
  console.log('Setting up integration tests...');
  
  try {
    await startTestServices();
    await setupTestDatabase();
    console.log('Integration test setup complete');
  } catch (error) {
    console.error('Integration test setup failed:', error);
    throw error;
  }
}, TEST_CONFIG.timeout);

// Global teardown
afterAll(async () => {
  console.log('Tearing down integration tests...');
  
  try {
    await cleanupTestDatabase();
    await stopTestServices();
    console.log('Integration test teardown complete');
  } catch (error) {
    console.error('Integration test teardown failed:', error);
  }
}, TEST_CONFIG.timeout);

// Test cleanup before each test
beforeEach(async () => {
  // Clean up test data before each test
  try {
    await cleanupTestDatabase();
    await setupTestDatabase();
  } catch (error) {
    console.error('Test cleanup failed:', error);
  }
});

// Export test utilities
export {
  checkServiceHealth,
  waitForService,
  TEST_CONFIG
};
