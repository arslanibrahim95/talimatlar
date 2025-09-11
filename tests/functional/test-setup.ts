import { beforeAll, afterAll } from 'vitest';

/**
 * Global test setup for functional tests
 */

beforeAll(async () => {
  console.log('🚀 Setting up functional test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'true';
  
  // Increase timeout for functional tests
  process.setMaxListeners(0);
  
  console.log('✅ Functional test environment ready');
});

afterAll(async () => {
  console.log('🧹 Cleaning up functional test environment...');
  
  // Cleanup any test data or resources
  // This will be implemented based on specific needs
  
  console.log('✅ Functional test environment cleaned up');
});
