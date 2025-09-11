import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');
export let responseTime = new Trend('response_time');
export let requestCount = new Counter('requests');
export let spikeRate = new Rate('spike_errors');

// Stress test configuration
export let options = {
  stages: [
    // Normal load
    { duration: '2m', target: 20 },
    { duration: '3m', target: 20 },
    
    // Spike test - sudden increase
    { duration: '30s', target: 100 },  // Sudden spike to 100 users
    { duration: '1m', target: 100 },   // Hold spike for 1 minute
    { duration: '30s', target: 20 },   // Quick drop back to normal
    
    // Gradual increase
    { duration: '2m', target: 50 },
    { duration: '2m', target: 80 },
    { duration: '2m', target: 100 },
    { duration: '3m', target: 100 },
    
    // Recovery
    { duration: '2m', target: 20 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    http_req_failed: ['rate<0.2'],     // Error rate must be below 20% (higher for stress test)
    errors: ['rate<0.2'],              // Custom error rate must be below 20%
    spike_errors: ['rate<0.5'],        // Spike error rate must be below 50%
  },
};

// Base URLs
const BASE_URL = 'http://[::1]:3000';  // IPv6 localhost
const API_BASE_URL = 'http://localhost:8004';
const ANALYTICS_URL = 'http://localhost:8003';
const INSTRUCTION_URL = 'http://localhost:8005';

// Test data
const testUsers = [
  { username: 'stressuser1', password: 'password123', email: 'stress1@example.com' },
  { username: 'stressuser2', password: 'password123', email: 'stress2@example.com' },
  { username: 'stressuser3', password: 'password123', email: 'stress3@example.com' },
  { username: 'stressuser4', password: 'password123', email: 'stress4@example.com' },
  { username: 'stressuser5', password: 'password123', email: 'stress5@example.com' },
];

// Helper function to get random user
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

// Helper function to simulate heavy operations
function simulateHeavyOperation() {
  const operations = [
    'complex_query',
    'file_upload',
    'data_processing',
    'report_generation',
    'analytics_calculation',
  ];
  
  return operations[Math.floor(Math.random() * operations.length)];
}

export default function() {
  const user = getRandomUser();
  const operation = simulateHeavyOperation();
  
  // Scenario 1: Heavy Frontend Load
  testHeavyFrontendLoad();
  
  // Scenario 2: Concurrent Authentication
  testConcurrentAuth(user);
  
  // Scenario 3: Database Stress
  testDatabaseStress();
  
  // Scenario 4: API Stress
  testAPIStress();
  
  // Scenario 5: File Operations (if applicable)
  testFileOperations();
  
  // Random sleep to simulate real user behavior
  sleep(Math.random() * 2);
}

// Heavy frontend load testing
function testHeavyFrontendLoad() {
  const heavyPages = [
    { url: '/dashboard', name: 'Dashboard (Heavy)' },
    { url: '/analytics', name: 'Analytics (Heavy)' },
    { url: '/instructions', name: 'Instructions (Heavy)' },
    { url: '/reports', name: 'Reports (Heavy)' },
  ];
  
  const test = heavyPages[Math.floor(Math.random() * heavyPages.length)];
  const response = http.get(`${BASE_URL}${test.url}`);
  
  const success = check(response, {
    [`${test.name} - Status 200`]: (r) => r.status === 200,
    [`${test.name} - Response time < 5s`]: (r) => r.timings.duration < 5000,
    [`${test.name} - Content length > 0`]: (r) => r.body.length > 0,
  });
  
  errorRate.add(!success);
  spikeRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

// Concurrent authentication testing
function testConcurrentAuth(user) {
  // Simulate multiple concurrent login attempts
  const loginPayload = {
    username: user.username,
    password: user.password,
  };
  
  const response = http.post(`${API_BASE_URL}/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const success = check(response, {
    'Concurrent Login - Status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'Concurrent Login - Response time < 3s': (r) => r.timings.duration < 3000,
  });
  
  errorRate.add(!success);
  spikeRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

// Database stress testing
function testDatabaseStress() {
  // Test database under stress
  const dbTests = [
    { url: '/health', name: 'DB Health' },
    { url: '/auth/users', name: 'User List' },
    { url: '/analytics/metrics', name: 'Analytics Metrics' },
  ];
  
  const test = dbTests[Math.floor(Math.random() * dbTests.length)];
  const response = http.get(`${API_BASE_URL}${test.url}`);
  
  const success = check(response, {
    [`${test.name} - Status 200 or 404`]: (r) => r.status === 200 || r.status === 404,
    [`${test.name} - Response time < 2s`]: (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!success);
  spikeRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

// API stress testing
function testAPIStress() {
  // Test multiple API endpoints simultaneously
  const apiTests = [
    { url: `${ANALYTICS_URL}/analytics/dashboard`, name: 'Analytics API' },
    { url: `${INSTRUCTION_URL}/instructions`, name: 'Instruction API' },
    { url: `${API_BASE_URL}/auth/profile`, name: 'Auth API' },
  ];
  
  const test = apiTests[Math.floor(Math.random() * apiTests.length)];
  const response = http.get(test.url);
  
  const success = check(response, {
    [`${test.name} - Status 200 or 404`]: (r) => r.status === 200 || r.status === 404,
    [`${test.name} - Response time < 3s`]: (r) => r.timings.duration < 3000,
  });
  
  errorRate.add(!success);
  spikeRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

// File operations testing
function testFileOperations() {
  // Simulate file upload/download operations
  const fileTests = [
    { url: '/api/upload', name: 'File Upload' },
    { url: '/api/download', name: 'File Download' },
    { url: '/api/files', name: 'File List' },
  ];
  
  const test = fileTests[Math.floor(Math.random() * fileTests.length)];
  const response = http.get(`${BASE_URL}${test.url}`);
  
  const success = check(response, {
    [`${test.name} - Status 200 or 404`]: (r) => r.status === 200 || r.status === 404,
    [`${test.name} - Response time < 5s`]: (r) => r.timings.duration < 5000,
  });
  
  errorRate.add(!success);
  spikeRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

// Setup function
export function setup() {
  console.log('🔥 Starting Stress Test for Claude Talimat System');
  console.log('📊 Stress Test Configuration:');
  console.log(`   - Frontend URL: ${BASE_URL}`);
  console.log(`   - API Base URL: ${API_BASE_URL}`);
  console.log('⏱️  Test Duration: ~20 minutes');
  console.log('👥 Max Users: 100 (with spikes)');
  console.log('🎯 Target: 95% requests < 1s, < 20% error rate');
  console.log('⚡ Includes spike testing and recovery testing');
  console.log('');
}

// Teardown function
export function teardown(data) {
  console.log('✅ Stress Test Completed');
  console.log('📈 Check the results above for stress test metrics');
  console.log('🔍 Pay attention to spike error rates and recovery times');
}
