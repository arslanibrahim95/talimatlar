import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');
const concurrentUsers = new Counter('concurrent_users');
const authErrors = new Counter('auth_errors');
const dbErrors = new Counter('db_errors');

// Enhanced stress test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Warm up
    { duration: '1m', target: 25 },    // Ramp up to 25 users
    { duration: '2m', target: 25 },    // Stay at 25 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 50 },    // Stay at 50 users
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '3m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 150 },   // Ramp up to 150 users
    { duration: '2m', target: 150 },   // Stay at 150 users
    { duration: '1m', target: 200 },   // Ramp up to 200 users
    { duration: '3m', target: 200 },   // Stay at 200 users
    { duration: '1m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.3'],     // Error rate should be below 30%
    errors: ['rate<0.3'],              // Custom error rate should be below 30%
    response_time: ['p(99)<5000'],     // 99% of requests should be below 5s
    auth_errors: ['count<50'],         // Auth errors should be less than 50
    db_errors: ['count<100'],          // DB errors should be less than 100
  },
  ext: {
    loadimpact: {
      projectID: 'claude-talimat-stress-test',
      name: 'Claude Talimat Stress Test',
    },
  },
};

// Base URLs - Direct service access
const AUTH_URL = 'http://localhost:8004';
const ANALYTICS_URL = 'http://localhost:8003';
const INSTRUCTION_URL = 'http://localhost:8005';
const AI_URL = 'http://localhost:8006';

// Test data
const testUsers = [
  { email: 'stress1@example.com', password: 'password123', role: 'user' },
  { email: 'stress2@example.com', password: 'password123', role: 'user' },
  { email: 'stress3@example.com', password: 'password123', role: 'user' },
  { email: 'stress4@example.com', password: 'password123', role: 'user' },
  { email: 'stress5@example.com', password: 'password123', role: 'user' },
  { email: 'admin@example.com', password: 'password123', role: 'admin' },
  { email: 'manager@example.com', password: 'password123', role: 'manager' },
  { email: 'supervisor@example.com', password: 'password123', role: 'supervisor' },
];

let authTokens = {};
let testData = {};

// Setup function
export function setup() {
  console.log('🚀 Setting up enhanced stress test...');
  
  // Test service health
  const healthChecks = [
    { name: 'Auth Service', url: `${AUTH_URL}/health` },
    { name: 'Analytics Service', url: `${ANALYTICS_URL}/health` },
    { name: 'Instruction Service', url: `${INSTRUCTION_URL}/health` },
    { name: 'AI Service', url: `${AI_URL}/health` },
  ];

  healthChecks.forEach(check => {
    const response = http.get(check.url);
    if (response.status === 200) {
      console.log(`✅ ${check.name} is healthy`);
    } else {
      console.log(`❌ ${check.name} is unhealthy (${response.status})`);
    }
  });

  // Pre-authenticate users
  let successCount = 0;
  testUsers.forEach(user => {
    try {
      const loginResponse = http.post(`${AUTH_URL}/login`, JSON.stringify({
        email: user.email,
        password: user.password
      }), {
        headers: { 'Content-Type': 'application/json' },
        timeout: '10s'
      });
      
      if (loginResponse.status === 200) {
        const loginData = JSON.parse(loginResponse.body);
        authTokens[user.email] = loginData.token || loginData.access_token;
        successCount++;
      } else {
        console.log(`⚠️ Failed to authenticate ${user.email}: ${loginResponse.status}`);
        authErrors.add(1);
      }
    } catch (error) {
      console.log(`❌ Error authenticating ${user.email}: ${error.message}`);
      authErrors.add(1);
    }
  });
  
  console.log(`🔐 Authenticated ${successCount}/${testUsers.length} users for stress test`);
  
  // Create test data
  testData = {
    instructions: [],
    analytics: [],
    searchQueries: [
      'safety', 'protocol', 'equipment', 'training', 'compliance',
      'risk', 'emergency', 'procedure', 'guideline', 'standard'
    ]
  };

  return { authTokens, testData };
}

// Main test function
export default function(data) {
  const userEmail = testUsers[Math.floor(Math.random() * testUsers.length)].email;
  const token = authTokens[userEmail];
  
  if (!token) {
    console.log(`⚠️ No token for user ${userEmail}`);
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
  
  if (testType < 0.35) {
    // 35% - Heavy read operations
    testHeavyReadOperations(headers);
  } else if (testType < 0.65) {
    // 30% - Mixed operations
    testMixedOperations(headers);
  } else if (testType < 0.85) {
    // 20% - Write operations (if admin/manager)
    testWriteOperations(headers, userEmail);
  } else {
    // 15% - Search operations
    testSearchOperations(headers);
  }

  requestCount.add(1);
  sleep(Math.random() * 3); // Random sleep between 0-3 seconds
}

// Heavy read operations
function testHeavyReadOperations(headers) {
  const endpoints = [
    { url: `${INSTRUCTION_URL}/instructions`, method: 'GET' },
    { url: `${INSTRUCTION_URL}/instructions?category=safety`, method: 'GET' },
    { url: `${INSTRUCTION_URL}/instructions?priority=high`, method: 'GET' },
    { url: `${INSTRUCTION_URL}/instructions?status=active`, method: 'GET' },
    { url: `${ANALYTICS_URL}/dashboard`, method: 'GET' },
    { url: `${ANALYTICS_URL}/metrics`, method: 'GET' },
    { url: `${ANALYTICS_URL}/trends`, method: 'GET' },
    { url: `${AUTH_URL}/me`, method: 'GET' },
  ];

  // Make multiple concurrent requests
  const numRequests = Math.floor(Math.random() * 4) + 1; // 1-4 requests
  
  for (let i = 0; i < numRequests; i++) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const response = http.request(endpoint.method, endpoint.url, null, { headers });
    
    check(response, {
      'heavy read status is acceptable': (r) => r.status < 500,
      'heavy read response time < 3000ms': (r) => r.timings.duration < 3000,
    });

    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    
    if (response.status >= 500) {
      dbErrors.add(1);
    }
  }
}

// Mixed operations
function testMixedOperations(headers) {
  const operations = [
    () => http.get(`${INSTRUCTION_URL}/instructions`, { headers }),
    () => http.get(`${INSTRUCTION_URL}/instructions/search?q=test`, { headers }),
    () => http.get(`${AUTH_URL}/me`, { headers }),
    () => http.get(`${ANALYTICS_URL}/reports`, { headers }),
    () => http.get(`${AI_URL}/health`, { headers }),
  ];

  // Execute 2-5 random operations
  const numOperations = Math.floor(Math.random() * 4) + 2;
  for (let i = 0; i < numOperations; i++) {
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const response = operation();
    
    check(response, {
      'mixed operation status is acceptable': (r) => r.status < 500,
      'mixed operation response time < 2000ms': (r) => r.timings.duration < 2000,
    });

    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    
    if (response.status >= 500) {
      dbErrors.add(1);
    }
    
    sleep(0.1); // Small delay between operations
  }
}

// Write operations (admin/manager only)
function testWriteOperations(headers, userEmail) {
  if (!userEmail.includes('admin') && !userEmail.includes('manager')) {
    // Regular users can't perform write operations
    return;
  }

  const writeOperations = [
    () => {
      // Create new instruction
      const instructionData = {
        title: `Stress Test Instruction ${Date.now()}`,
        content: 'This is a stress test instruction created during performance testing',
        category: 'safety',
        priority: 'medium',
        status: 'active',
        created_by: userEmail
      };
      
      return http.post(`${INSTRUCTION_URL}/instructions`, JSON.stringify(instructionData), { headers });
    },
    () => {
      // Track analytics event
      const eventData = {
        event: 'stress_test',
        page: '/stress-test',
        userId: userEmail,
        metadata: {
          timestamp: new Date().toISOString(),
          testType: 'stress',
          userRole: userEmail.includes('admin') ? 'admin' : 'manager'
        }
      };
      
      return http.post(`${ANALYTICS_URL}/track`, JSON.stringify(eventData), { headers });
    },
    () => {
      // Update user profile
      const profileData = {
        lastActivity: new Date().toISOString(),
        testSession: true
      };
      
      return http.put(`${AUTH_URL}/me`, JSON.stringify(profileData), { headers });
    },
  ];

  const operation = writeOperations[Math.floor(Math.random() * writeOperations.length)];
  const response = operation();
  
  check(response, {
    'write operation status is acceptable': (r) => r.status < 500,
    'write operation response time < 3000ms': (r) => r.timings.duration < 3000,
  });

  errorRate.add(response.status >= 400);
  responseTime.add(response.timings.duration);
  
  if (response.status >= 500) {
    dbErrors.add(1);
  }
}

// Search operations
function testSearchOperations(headers) {
  const query = testData.searchQueries[Math.floor(Math.random() * testData.searchQueries.length)];
  const response = http.get(`${INSTRUCTION_URL}/instructions/search?q=${query}`, { headers });
  
  check(response, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 2000ms': (r) => r.timings.duration < 2000,
    'search returns results': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.success === true || Array.isArray(data);
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(response.status >= 400);
  responseTime.add(response.timings.duration);
  
  if (response.status >= 500) {
    dbErrors.add(1);
  }
}

// Test database connection limits
function testDatabaseConnections(headers) {
  // Make many concurrent requests to test connection pooling
  const promises = [];
  for (let i = 0; i < 15; i++) {
    promises.push(http.get(`${INSTRUCTION_URL}/instructions`, { headers }));
  }
  
  // Note: K6 doesn't support Promise.all, so we'll make sequential requests
  for (let i = 0; i < 15; i++) {
    const response = http.get(`${INSTRUCTION_URL}/instructions`, { headers });
    check(response, {
      'db connection test status is acceptable': (r) => r.status < 500,
      'db connection test response time < 5000ms': (r) => r.timings.duration < 5000,
    });

    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    
    if (response.status >= 500) {
      dbErrors.add(1);
    }
  }
}

// Test memory leaks
function testMemoryUsage(headers) {
  // Make requests that might cause memory issues
  const largeResponse = http.get(`${INSTRUCTION_URL}/instructions?limit=1000`, { headers });
  
  check(largeResponse, {
    'memory test status is acceptable': (r) => r.status < 500,
    'memory test response time < 10000ms': (r) => r.timings.duration < 10000,
  });

  errorRate.add(largeResponse.status >= 400);
  responseTime.add(largeResponse.timings.duration);
  
  if (largeResponse.status >= 500) {
    dbErrors.add(1);
  }
}

// Teardown function
export function teardown(data) {
  console.log('🏁 Enhanced stress test completed');
  console.log(`📊 Total requests made: ${requestCount.count}`);
  console.log(`👥 Peak concurrent users: ${concurrentUsers.count}`);
  console.log(`❌ Auth errors: ${authErrors.count}`);
  console.log(`💾 DB errors: ${dbErrors.count}`);
  console.log(`📈 Error rate: ${(errorRate.count * 100).toFixed(2)}%`);
}
