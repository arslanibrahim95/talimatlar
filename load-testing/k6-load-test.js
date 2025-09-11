import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');
export let responseTime = new Trend('response_time');
export let requestCount = new Counter('requests');

// Test configuration
export let options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 10 },   // 0 to 10 users over 2 minutes
    { duration: '5m', target: 10 },   // Stay at 10 users for 5 minutes
    { duration: '2m', target: 20 },   // Ramp up to 20 users over 2 minutes
    { duration: '5m', target: 20 },   // Stay at 20 users for 5 minutes
    { duration: '2m', target: 50 },   // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate must be below 10%
  },
};

// Base URLs
const BASE_URL = 'http://[::1]:3000';  // IPv6 localhost
const API_BASE_URL = 'http://localhost:8004'; // Auth Service
const ANALYTICS_URL = 'http://localhost:8003'; // Analytics Service
const INSTRUCTION_URL = 'http://localhost:8005'; // Instruction Service

// Test data
const testUsers = [
  { username: 'testuser1', password: 'password123', email: 'test1@example.com' },
  { username: 'testuser2', password: 'password123', email: 'test2@example.com' },
  { username: 'testuser3', password: 'password123', email: 'test3@example.com' },
  { username: 'testuser4', password: 'password123', email: 'test4@example.com' },
  { username: 'testuser5', password: 'password123', email: 'test5@example.com' },
];

// Helper function to get random user
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

// Helper function to make authenticated request
function makeAuthenticatedRequest(url, token, method = 'GET', payload = null) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
  
  let response;
  if (method === 'POST' && payload) {
    response = http.post(url, JSON.stringify(payload), params);
  } else if (method === 'PUT' && payload) {
    response = http.put(url, JSON.stringify(payload), params);
  } else if (method === 'DELETE') {
    response = http.del(url, null, params);
  } else {
    response = http.get(url, params);
  }
  
  return response;
}

// Test scenarios
export default function() {
  const user = getRandomUser();
  let authToken = null;
  
  // Scenario 1: Frontend Load Test
  testFrontendLoad();
  
  // Scenario 2: Authentication Flow
  authToken = testAuthenticationFlow(user);
  
  // Scenario 3: API Endpoints (if services are running)
  if (authToken) {
    testAPIEndpoints(authToken);
  }
  
  // Scenario 4: Database Operations
  testDatabaseOperations(authToken);
  
  // Wait between iterations
  sleep(1);
}

// Frontend load testing
function testFrontendLoad() {
  const frontendTests = [
    { url: '/', name: 'Home Page' },
    { url: '/login', name: 'Login Page' },
    { url: '/register', name: 'Register Page' },
    { url: '/dashboard', name: 'Dashboard Page' },
    { url: '/instructions', name: 'Instructions Page' },
    { url: '/analytics', name: 'Analytics Page' },
  ];
  
  const test = frontendTests[Math.floor(Math.random() * frontendTests.length)];
  const response = http.get(`${BASE_URL}${test.url}`);
  
  const success = check(response, {
    [`${test.name} - Status 200`]: (r) => r.status === 200,
    [`${test.name} - Response time < 2s`]: (r) => r.timings.duration < 2000,
    [`${test.name} - Content length > 0`]: (r) => r.body && r.body.length > 0,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

// Authentication flow testing
function testAuthenticationFlow(user) {
  // Test registration
  const registerPayload = {
    username: user.username,
    email: user.email,
    password: user.password,
  };
  
  const registerResponse = http.post(`${API_BASE_URL}/auth/register`, JSON.stringify(registerPayload), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const registerSuccess = check(registerResponse, {
    'Registration - Status 201 or 409': (r) => r.status === 201 || r.status === 409,
    'Registration - Response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!registerSuccess);
  responseTime.add(registerResponse.timings.duration);
  requestCount.add(1);
  
  // Test login
  const loginPayload = {
    username: user.username,
    password: user.password,
  };
  
  const loginResponse = http.post(`${API_BASE_URL}/auth/login`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const loginSuccess = check(loginResponse, {
    'Login - Status 200': (r) => r.status === 200,
    'Login - Response time < 1s': (r) => r.timings.duration < 1000,
    'Login - Has token': (r) => r.json('token') !== undefined,
  });
  
  errorRate.add(!loginSuccess);
  responseTime.add(loginResponse.timings.duration);
  requestCount.add(1);
  
  if (loginSuccess && loginResponse.json('token')) {
    return loginResponse.json('token');
  }
  
  return null;
}

// API endpoints testing
function testAPIEndpoints(token) {
  if (!token) return;
  
  // Test Analytics Service
  const analyticsResponse = makeAuthenticatedRequest(`${ANALYTICS_URL}/analytics/dashboard`, token);
  const analyticsSuccess = check(analyticsResponse, {
    'Analytics - Status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'Analytics - Response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!analyticsSuccess);
  responseTime.add(analyticsResponse.timings.duration);
  requestCount.add(1);
  
  // Test Instruction Service
  const instructionResponse = makeAuthenticatedRequest(`${INSTRUCTION_URL}/instructions`, token);
  const instructionSuccess = check(instructionResponse, {
    'Instructions - Status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'Instructions - Response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!instructionSuccess);
  responseTime.add(instructionResponse.timings.duration);
  requestCount.add(1);
  
  // Test Auth Service endpoints
  const profileResponse = makeAuthenticatedRequest(`${API_BASE_URL}/auth/profile`, token);
  const profileSuccess = check(profileResponse, {
    'Profile - Status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'Profile - Response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!profileSuccess);
  responseTime.add(profileResponse.timings.duration);
  requestCount.add(1);
}

// Database operations testing
function testDatabaseOperations(token) {
  // Test database connectivity through API endpoints
  const healthResponse = http.get(`${API_BASE_URL}/health`);
  const healthSuccess = check(healthResponse, {
    'Health Check - Status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'Health Check - Response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!healthSuccess);
  responseTime.add(healthResponse.timings.duration);
  requestCount.add(1);
}

// Setup function (runs once before all VUs)
export function setup() {
  console.log('🚀 Starting Load Test for Claude Talimat System');
  console.log('📊 Test Configuration:');
  console.log(`   - Frontend URL: ${BASE_URL}`);
  console.log(`   - API Base URL: ${API_BASE_URL}`);
  console.log(`   - Analytics URL: ${ANALYTICS_URL}`);
  console.log(`   - Instruction URL: ${INSTRUCTION_URL}`);
  console.log('⏱️  Test Duration: ~23 minutes');
  console.log('👥 Max Users: 50');
  console.log('🎯 Target: 95% requests < 500ms, < 10% error rate');
  console.log('');
}

// Teardown function (runs once after all VUs)
export function teardown(data) {
  console.log('✅ Load Test Completed');
  console.log('📈 Check the results above for performance metrics');
}
