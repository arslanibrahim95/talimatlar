import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');
export let responseTime = new Trend('response_time');
export let requestCount = new Counter('requests');
export let spikeErrorRate = new Rate('spike_errors');
export let recoveryTime = new Trend('recovery_time');

// Spike test configuration
export let options = {
  stages: [
    // Baseline
    { duration: '2m', target: 10 },
    { duration: '1m', target: 10 },
    
    // Spike 1: Sudden increase
    { duration: '10s', target: 200 },  // Sudden spike to 200 users
    { duration: '1m', target: 200 },   // Hold spike
    { duration: '10s', target: 10 },   // Sudden drop
    
    // Recovery period
    { duration: '2m', target: 10 },
    
    // Spike 2: Gradual increase then sudden spike
    { duration: '1m', target: 50 },
    { duration: '30s', target: 150 },  // Gradual increase
    { duration: '10s', target: 300 },  // Sudden spike to 300 users
    { duration: '1m', target: 300 },   // Hold spike
    { duration: '10s', target: 10 },   // Sudden drop
    
    // Recovery period
    { duration: '3m', target: 10 },
    
    // Spike 3: Multiple small spikes
    { duration: '30s', target: 100 },
    { duration: '30s', target: 10 },
    { duration: '30s', target: 150 },
    { duration: '30s', target: 10 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 10 },
    
    // Final recovery
    { duration: '2m', target: 10 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.3'],     // Error rate must be below 30% (higher for spike test)
    errors: ['rate<0.3'],              // Custom error rate must be below 30%
    spike_errors: ['rate<0.6'],        // Spike error rate must be below 60%
  },
};

// Base URLs
const BASE_URL = 'http://[::1]:3000';  // IPv6 localhost
const API_BASE_URL = 'http://localhost:8004';
const ANALYTICS_URL = 'http://localhost:8003';
const INSTRUCTION_URL = 'http://localhost:8005';

// Test data
const testUsers = [
  { username: 'spikeuser1', password: 'password123', email: 'spike1@example.com' },
  { username: 'spikeuser2', password: 'password123', email: 'spike2@example.com' },
  { username: 'spikeuser3', password: 'password123', email: 'spike3@example.com' },
  { username: 'spikeuser4', password: 'password123', email: 'spike4@example.com' },
  { username: 'spikeuser5', password: 'password123', email: 'spike5@example.com' },
];

// Helper function to get random user
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

// Helper function to detect if we're in a spike
function isSpikePeriod() {
  // This is a simplified way to detect spikes
  // In a real scenario, you might want to track this more precisely
  return Math.random() < 0.3; // 30% chance of being in a spike period
}

export default function() {
  const user = getRandomUser();
  const inSpike = isSpikePeriod();
  
  // Scenario 1: Frontend Spike Load
  testFrontendSpikeLoad(inSpike);
  
  // Scenario 2: Authentication Spike
  testAuthSpike(user, inSpike);
  
  // Scenario 3: API Spike
  testAPISpike(inSpike);
  
  // Scenario 4: Database Spike
  testDatabaseSpike(inSpike);
  
  // Scenario 5: Recovery Testing
  testRecovery(inSpike);
  
  // Shorter sleep during spikes
  sleep(inSpike ? 0.1 : 1);
}

// Frontend spike load testing
function testFrontendSpikeLoad(inSpike) {
  const pages = [
    { url: '/', name: 'Home' },
    { url: '/login', name: 'Login' },
    { url: '/dashboard', name: 'Dashboard' },
    { url: '/analytics', name: 'Analytics' },
    { url: '/instructions', name: 'Instructions' },
  ];
  
  const test = pages[Math.floor(Math.random() * pages.length)];
  const response = http.get(`${BASE_URL}${test.url}`);
  
  const maxResponseTime = inSpike ? 5000 : 2000; // Allow longer response times during spikes
  
  const success = check(response, {
    [`${test.name} - Status 200`]: (r) => r.status === 200,
    [`${test.name} - Response time < ${maxResponseTime}ms`]: (r) => r.timings.duration < maxResponseTime,
    [`${test.name} - Content length > 0`]: (r) => r.body.length > 0,
  });
  
  errorRate.add(!success);
  if (inSpike) {
    spikeErrorRate.add(!success);
  }
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

// Authentication spike testing
function testAuthSpike(user, inSpike) {
  const authTests = [
    { url: '/auth/login', method: 'POST', payload: { username: user.username, password: user.password } },
    { url: '/auth/register', method: 'POST', payload: { username: user.username, email: user.email, password: user.password } },
    { url: '/auth/profile', method: 'GET' },
  ];
  
  const test = authTests[Math.floor(Math.random() * authTests.length)];
  let response;
  
  if (test.method === 'POST') {
    response = http.post(`${API_BASE_URL}${test.url}`, JSON.stringify(test.payload), {
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    response = http.get(`${API_BASE_URL}${test.url}`);
  }
  
  const maxResponseTime = inSpike ? 3000 : 1000;
  
  const success = check(response, {
    [`Auth ${test.method} - Status 200/201/409`]: (r) => [200, 201, 409].includes(r.status),
    [`Auth ${test.method} - Response time < ${maxResponseTime}ms`]: (r) => r.timings.duration < maxResponseTime,
  });
  
  errorRate.add(!success);
  if (inSpike) {
    spikeErrorRate.add(!success);
  }
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

// API spike testing
function testAPISpike(inSpike) {
  const apiTests = [
    { url: `${ANALYTICS_URL}/analytics/dashboard`, name: 'Analytics' },
    { url: `${INSTRUCTION_URL}/instructions`, name: 'Instructions' },
    { url: `${API_BASE_URL}/health`, name: 'Health' },
  ];
  
  const test = apiTests[Math.floor(Math.random() * apiTests.length)];
  const response = http.get(test.url);
  
  const maxResponseTime = inSpike ? 4000 : 1500;
  
  const success = check(response, {
    [`${test.name} API - Status 200/404`]: (r) => [200, 404].includes(r.status),
    [`${test.name} API - Response time < ${maxResponseTime}ms`]: (r) => r.timings.duration < maxResponseTime,
  });
  
  errorRate.add(!success);
  if (inSpike) {
    spikeErrorRate.add(!success);
  }
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

// Database spike testing
function testDatabaseSpike(inSpike) {
  const dbTests = [
    { url: '/auth/users', name: 'User Query' },
    { url: '/analytics/metrics', name: 'Metrics Query' },
    { url: '/instructions/count', name: 'Count Query' },
  ];
  
  const test = dbTests[Math.floor(Math.random() * dbTests.length)];
  const response = http.get(`${API_BASE_URL}${test.url}`);
  
  const maxResponseTime = inSpike ? 3000 : 1000;
  
  const success = check(response, {
    [`${test.name} - Status 200/404`]: (r) => [200, 404].includes(r.status),
    [`${test.name} - Response time < ${maxResponseTime}ms`]: (r) => r.timings.duration < maxResponseTime,
  });
  
  errorRate.add(!success);
  if (inSpike) {
    spikeErrorRate.add(!success);
  }
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

// Recovery testing
function testRecovery(inSpike) {
  // Test system recovery after spikes
  const recoveryTests = [
    { url: '/health', name: 'Health Check' },
    { url: '/status', name: 'Status Check' },
  ];
  
  const test = recoveryTests[Math.floor(Math.random() * recoveryTests.length)];
  const response = http.get(`${API_BASE_URL}${test.url}`);
  
  const success = check(response, {
    [`${test.name} - Status 200/404`]: (r) => [200, 404].includes(r.status),
    [`${test.name} - Response time < 2s`]: (r) => r.timings.duration < 2000,
  });
  
  if (success && !inSpike) {
    recoveryTime.add(response.timings.duration);
  }
  
  errorRate.add(!success);
  if (inSpike) {
    spikeErrorRate.add(!success);
  }
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

// Setup function
export function setup() {
  console.log('⚡ Starting Spike Test for Claude Talimat System');
  console.log('📊 Spike Test Configuration:');
  console.log(`   - Frontend URL: ${BASE_URL}`);
  console.log(`   - API Base URL: ${API_BASE_URL}`);
  console.log('⏱️  Test Duration: ~15 minutes');
  console.log('👥 Max Users: 300 (with multiple spikes)');
  console.log('🎯 Target: 95% requests < 2s, < 30% error rate');
  console.log('🔥 Includes multiple spike patterns and recovery testing');
  console.log('');
}

// Teardown function
export function teardown(data) {
  console.log('✅ Spike Test Completed');
  console.log('📈 Check the results above for spike test metrics');
  console.log('🔍 Pay attention to:');
  console.log('   - Spike error rates');
  console.log('   - Recovery times');
  console.log('   - System stability during spikes');
}
