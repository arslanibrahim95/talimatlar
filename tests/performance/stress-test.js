import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');
const concurrentUsers = new Counter('concurrent_users');

// Stress test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 200 },  // Ramp up to 200 users
    { duration: '3m', target: 200 },  // Stay at 200 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1s
    http_req_failed: ['rate<0.2'],     // Error rate should be below 20%
    errors: ['rate<0.2'],              // Custom error rate should be below 20%
    response_time: ['p(99)<2000'],     // 99% of requests should be below 2s
  },
};

// Base URLs
const BASE_URL = 'http://localhost:8080';
const AUTH_URL = `${BASE_URL}/auth`;
const INSTRUCTIONS_URL = `${BASE_URL}/instructions`;
const ANALYTICS_URL = `${BASE_URL}/analytics`;

// Test data
const testUsers = [
  { email: 'stress1@example.com', password: 'password123' },
  { email: 'stress2@example.com', password: 'password123' },
  { email: 'stress3@example.com', password: 'password123' },
  { email: 'stress4@example.com', password: 'password123' },
  { email: 'stress5@example.com', password: 'password123' },
  { email: 'admin@example.com', password: 'password123' },
];

let authTokens = {};

// Setup function
export function setup() {
  console.log('Setting up stress test...');
  
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
  
  console.log(`Authenticated ${Object.keys(authTokens).length} users for stress test`);
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

  // Track concurrent users
  concurrentUsers.add(1);

  // Test different scenarios with different weights
  const testType = Math.random();
  
  if (testType < 0.4) {
    // 40% - Heavy read operations
    testHeavyReadOperations(headers);
  } else if (testType < 0.7) {
    // 30% - Mixed operations
    testMixedOperations(headers);
  } else if (testType < 0.9) {
    // 20% - Write operations (if admin)
    testWriteOperations(headers, userEmail);
  } else {
    // 10% - Search operations
    testSearchOperations(headers);
  }

  requestCount.add(1);
  sleep(Math.random() * 2); // Random sleep between 0-2 seconds
}

// Heavy read operations
function testHeavyReadOperations(headers) {
  const endpoints = [
    `${INSTRUCTIONS_URL}`,
    `${INSTRUCTIONS_URL}?category=safety`,
    `${INSTRUCTIONS_URL}?priority=high`,
    `${INSTRUCTIONS_URL}/templates`,
    `${ANALYTICS_URL}/dashboard`,
    `${ANALYTICS_URL}/metrics`,
    `${ANALYTICS_URL}/trends`,
  ];

  // Make multiple concurrent requests
  const numRequests = Math.floor(Math.random() * 3) + 1; // 1-3 requests
  
  for (let i = 0; i < numRequests; i++) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const response = http.get(endpoint, { headers });
    
    check(response, {
      'heavy read status is acceptable': (r) => r.status < 500,
      'heavy read response time < 2000ms': (r) => r.timings.duration < 2000,
    });

    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
  }
}

// Mixed operations
function testMixedOperations(headers) {
  const operations = [
    () => http.get(`${INSTRUCTIONS_URL}`, { headers }),
    () => http.get(`${INSTRUCTIONS_URL}/search?q=test`, { headers }),
    () => http.get(`${AUTH_URL}/me`, { headers }),
    () => http.get(`${INSTRUCTIONS_URL}/1`, { headers }),
    () => http.get(`${ANALYTICS_URL}/reports`, { headers }),
  ];

  // Execute 2-4 random operations
  const numOperations = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < numOperations; i++) {
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const response = operation();
    
    check(response, {
      'mixed operation status is acceptable': (r) => r.status < 500,
      'mixed operation response time < 1500ms': (r) => r.timings.duration < 1500,
    });

    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    
    sleep(0.2); // Small delay between operations
  }
}

// Write operations (admin only)
function testWriteOperations(headers, userEmail) {
  if (!userEmail.includes('admin')) {
    // Regular users can't perform write operations
    return;
  }

  const writeOperations = [
    () => {
      // Create new instruction
      const instructionData = {
        title: `Stress Test Instruction ${Date.now()}`,
        content: 'This is a stress test instruction',
        category: 'safety',
        priority: 'medium',
        status: 'active'
      };
      
      return http.post(`${INSTRUCTIONS_URL}`, JSON.stringify(instructionData), { headers });
    },
    () => {
      // Create new template
      const templateData = {
        name: `Stress Test Template ${Date.now()}`,
        content: 'Template content',
        category: 'safety',
        isActive: true
      };
      
      return http.post(`${INSTRUCTIONS_URL}/templates`, JSON.stringify(templateData), { headers });
    },
    () => {
      // Track analytics event
      const eventData = {
        event: 'stress_test',
        page: '/stress-test',
        userId: '1',
        metadata: {
          timestamp: new Date().toISOString(),
          testType: 'stress'
        }
      };
      
      return http.post(`${ANALYTICS_URL}/track`, JSON.stringify(eventData), { headers });
    },
  ];

  const operation = writeOperations[Math.floor(Math.random() * writeOperations.length)];
  const response = operation();
  
  check(response, {
    'write operation status is acceptable': (r) => r.status < 500,
    'write operation response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  errorRate.add(response.status >= 400);
  responseTime.add(response.timings.duration);
}

// Search operations
function testSearchOperations(headers) {
  const searchQueries = [
    'safety',
    'protocol',
    'equipment',
    'training',
    'compliance',
    'risk',
    'emergency',
    'procedure'
  ];

  const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
  const response = http.get(`${INSTRUCTIONS_URL}/search?q=${query}`, { headers });
  
  check(response, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 1000ms': (r) => r.timings.duration < 1000,
    'search returns results': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success === true && Array.isArray(data.data);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(response.status >= 400);
  responseTime.add(response.timings.duration);
}

// Test database connection limits
function testDatabaseConnections(headers) {
  // Make many concurrent requests to test connection pooling
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(http.get(`${INSTRUCTIONS_URL}`, { headers }));
  }
  
  const responses = Promise.all(promises);
  
  responses.then(responses => {
    responses.forEach(response => {
      check(response, {
        'db connection test status is acceptable': (r) => r.status < 500,
        'db connection test response time < 3000ms': (r) => r.timings.duration < 3000,
      });

      errorRate.add(response.status >= 400);
      responseTime.add(response.timings.duration);
    });
  });
}

// Test memory leaks
function testMemoryUsage(headers) {
  // Make requests that might cause memory issues
  const largeResponse = http.get(`${INSTRUCTIONS_URL}?limit=1000`, { headers });
  
  check(largeResponse, {
    'memory test status is acceptable': (r) => r.status < 500,
    'memory test response time < 5000ms': (r) => r.timings.duration < 5000,
  });

  errorRate.add(largeResponse.status >= 400);
  responseTime.add(largeResponse.timings.duration);
}

// Teardown function
export function teardown(data) {
  console.log('Stress test completed');
  console.log(`Total requests made: ${requestCount.count}`);
  console.log(`Peak concurrent users: ${concurrentUsers.count}`);
}