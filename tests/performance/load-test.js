import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be below 10%
    errors: ['rate<0.1'],             // Custom error rate should be below 10%
  },
};

// Base URLs
const BASE_URL = 'http://localhost:8080';
const AUTH_URL = `${BASE_URL}/auth`;
const ANALYTICS_URL = `${BASE_URL}/analytics`;
const INSTRUCTIONS_URL = `${BASE_URL}/instructions`;

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'password123' },
  { email: 'test2@example.com', password: 'password123' },
  { email: 'test3@example.com', password: 'password123' },
  { email: 'admin@example.com', password: 'password123' },
];

let authTokens = {};

// Setup function - runs once before the test
export function setup() {
  console.log('Setting up load test...');
  
  // Pre-authenticate users
  testUsers.forEach(user => {
    const loginResponse = http.post(`${AUTH_URL}/login`, JSON.stringify({
      email: user.email,
      password: user.password
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (loginResponse.status === 200) {
      const loginData = JSON.parse(loginResponse.body);
      authTokens[user.email] = loginData.token;
    }
  });
  
  console.log(`Authenticated ${Object.keys(authTokens).length} users`);
  return { authTokens };
}

// Main test function
export default function(data) {
  const userEmail = testUsers[Math.floor(Math.random() * testUsers.length)].email;
  const token = authTokens[userEmail];
  
  if (!token) {
    console.log(`No token for user ${userEmail}`);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test different endpoints with different weights
  const testType = Math.random();
  
  if (testType < 0.3) {
    // 30% - Test authentication endpoints
    testAuthEndpoints();
  } else if (testType < 0.6) {
    // 30% - Test instructions endpoints
    testInstructionsEndpoints(headers);
  } else if (testType < 0.8) {
    // 20% - Test analytics endpoints
    testAnalyticsEndpoints(headers);
  } else {
    // 20% - Test mixed operations
    testMixedOperations(headers);
  }

  sleep(1); // Wait 1 second between requests
}

// Authentication endpoint tests
function testAuthEndpoints() {
  const endpoints = [
    { method: 'GET', url: `${AUTH_URL}/me` },
    { method: 'POST', url: `${AUTH_URL}/refresh` },
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const headers = {
    'Authorization': `Bearer ${authTokens[testUsers[0].email]}`,
    'Content-Type': 'application/json',
  };

  const response = http.request(endpoint.method, endpoint.url, null, { headers });
  
  check(response, {
    'auth endpoint status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'auth response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(response.status >= 400);
  responseTime.add(response.timings.duration);
}

// Instructions endpoint tests
function testInstructionsEndpoints(headers) {
  const endpoints = [
    { method: 'GET', url: `${INSTRUCTIONS_URL}` },
    { method: 'GET', url: `${INSTRUCTIONS_URL}?category=safety` },
    { method: 'GET', url: `${INSTRUCTIONS_URL}?priority=high` },
    { method: 'GET', url: `${INSTRUCTIONS_URL}/templates` },
    { method: 'GET', url: `${INSTRUCTIONS_URL}/1` },
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.request(endpoint.method, endpoint.url, null, { headers });
  
  check(response, {
    'instructions endpoint status is 200': (r) => r.status === 200,
    'instructions response time < 500ms': (r) => r.timings.duration < 500,
    'instructions response has data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success === true;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(response.status >= 400);
  responseTime.add(response.timings.duration);
}

// Analytics endpoint tests
function testAnalyticsEndpoints(headers) {
  const endpoints = [
    { method: 'GET', url: `${ANALYTICS_URL}/dashboard` },
    { method: 'GET', url: `${ANALYTICS_URL}/metrics` },
    { method: 'GET', url: `${ANALYTICS_URL}/trends` },
    { method: 'GET', url: `${ANALYTICS_URL}/reports` },
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.request(endpoint.method, endpoint.url, null, { headers });
  
  check(response, {
    'analytics endpoint status is 200 or 403': (r) => r.status === 200 || r.status === 403,
    'analytics response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  errorRate.add(response.status >= 400);
  responseTime.add(response.timings.duration);
}

// Mixed operations test
function testMixedOperations(headers) {
  // Simulate a user workflow
  const operations = [
    () => {
      // View instructions
      const response = http.get(`${INSTRUCTIONS_URL}`, { headers });
      return response;
    },
    () => {
      // Search instructions
      const response = http.get(`${INSTRUCTIONS_URL}/search?q=safety`, { headers });
      return response;
    },
    () => {
      // View analytics (if admin)
      const response = http.get(`${ANALYTICS_URL}/dashboard`, { headers });
      return response;
    },
    () => {
      // Get user profile
      const response = http.get(`${AUTH_URL}/me`, { headers });
      return response;
    },
  ];

  // Execute 2-3 random operations
  const numOperations = Math.floor(Math.random() * 2) + 2;
  for (let i = 0; i < numOperations; i++) {
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const response = operation();
    
    check(response, {
      'mixed operation status is acceptable': (r) => r.status < 500,
      'mixed operation response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    
    sleep(0.5); // Small delay between operations
  }
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Tested with ${Object.keys(data.authTokens).length} authenticated users`);
}