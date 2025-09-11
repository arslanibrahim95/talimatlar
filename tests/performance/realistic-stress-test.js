import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');
const authSuccessRate = new Rate('auth_success');
const apiSuccessRate = new Rate('api_success');

// Realistic stress test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },    // Warm up
    { duration: '1m', target: 10 },    // Ramp up to 10 users
    { duration: '2m', target: 10 },    // Stay at 10 users
    { duration: '1m', target: 20 },    // Ramp up to 20 users
    { duration: '2m', target: 20 },    // Stay at 20 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '3m', target: 50 },    // Stay at 50 users
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1s
    http_req_failed: ['rate<0.1'],     // Error rate should be below 10%
    errors: ['rate<0.1'],              // Custom error rate should be below 10%
    response_time: ['p(99)<2000'],     // 99% of requests should be below 2s
    auth_success: ['rate>0.8'],        // Auth success rate should be >80%
    api_success: ['rate>0.9'],         // API success rate should be >90%
  },
};

// Base URLs
const AUTH_URL = 'http://localhost:8004';
const ANALYTICS_URL = 'http://localhost:8003';
const INSTRUCTION_URL = 'http://localhost:8005';
const AI_URL = 'http://localhost:8006';

// Test users - gerçek kullanıcılar
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
  console.log('🚀 Realistic stress test başlatılıyor...');
  
  // Test service health
  const healthChecks = [
    { name: 'Auth Service', url: `${AUTH_URL}/health` },
    { name: 'Analytics Service', url: `${ANALYTICS_URL}/health` },
    { name: 'Instruction Service', url: `${INSTRUCTION_URL}/health` },
    { name: 'AI Service', url: `${AI_URL}/health` },
  ];

  let healthyServices = 0;
  healthChecks.forEach(check => {
    const response = http.get(check.url, { timeout: '10s' });
    if (response.status === 200) {
      console.log(`✅ ${check.name} is healthy`);
      healthyServices++;
    } else {
      console.log(`❌ ${check.name} is unhealthy (${response.status})`);
    }
  });

  if (healthyServices < 3) {
    console.log('⚠️ Yeterli servis sağlıklı değil, test devam ediyor...');
  }

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
        authTokens[user.email] = loginData.token || loginData.access_token || loginData.jwt;
        successCount++;
        console.log(`✅ ${user.email} authenticated successfully`);
      } else {
        console.log(`⚠️ Failed to authenticate ${user.email}: ${loginResponse.status} - ${loginResponse.body}`);
      }
    } catch (error) {
      console.log(`❌ Error authenticating ${user.email}: ${error.message}`);
    }
  });
  
  console.log(`🔐 ${successCount}/${testUsers.length} users authenticated`);
  
  // Test data
  testData = {
    searchQueries: [
      'safety', 'protocol', 'equipment', 'training', 'compliance',
      'risk', 'emergency', 'procedure', 'guideline', 'standard',
      'workplace', 'hazard', 'protection', 'inspection', 'maintenance'
    ],
    categories: ['safety', 'health', 'environment', 'security', 'quality'],
    priorities: ['low', 'medium', 'high', 'critical']
  };

  return { authTokens, testData };
}

// Main test function
export default function(data) {
  const userEmail = testUsers[Math.floor(Math.random() * testUsers.length)].email;
  const token = authTokens[userEmail];
  
  if (!token) {
    // Eğer token yoksa, authentication test et
    testAuthentication(userEmail);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test different scenarios with different weights
  const testType = Math.random();
  
  if (testType < 0.4) {
    // 40% - Read operations
    testReadOperations(headers);
  } else if (testType < 0.7) {
    // 30% - Mixed operations
    testMixedOperations(headers);
  } else if (testType < 0.9) {
    // 20% - Write operations (if admin/manager)
    testWriteOperations(headers, userEmail);
  } else {
    // 10% - Search operations
    testSearchOperations(headers);
  }

  requestCount.add(1);
  sleep(Math.random() * 2 + 0.5); // Random sleep between 0.5-2.5 seconds
}

// Authentication test
function testAuthentication(userEmail) {
  const user = testUsers.find(u => u.email === userEmail);
  if (!user) return;

  const response = http.post(`${AUTH_URL}/login`, JSON.stringify({
    email: user.email,
    password: user.password
  }), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s'
  });

  const success = response.status === 200;
  authSuccessRate.add(success);
  
  check(response, {
    'auth status is 200': (r) => r.status === 200,
    'auth response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  errorRate.add(response.status >= 400);
  responseTime.add(response.timings.duration);
}

// Read operations
function testReadOperations(headers) {
  const endpoints = [
    { url: `${INSTRUCTION_URL}/instructions`, method: 'GET' },
    { url: `${INSTRUCTION_URL}/instructions?category=safety`, method: 'GET' },
    { url: `${INSTRUCTION_URL}/instructions?priority=high`, method: 'GET' },
    { url: `${ANALYTICS_URL}/dashboard`, method: 'GET' },
    { url: `${ANALYTICS_URL}/metrics`, method: 'GET' },
    { url: `${AUTH_URL}/me`, method: 'GET' },
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.request(endpoint.method, endpoint.url, null, { headers });
  
  const success = response.status < 500;
  apiSuccessRate.add(success);
  
  check(response, {
    'read operation status is acceptable': (r) => r.status < 500,
    'read operation response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  errorRate.add(response.status >= 400);
  responseTime.add(response.timings.duration);
}

// Mixed operations
function testMixedOperations(headers) {
  const operations = [
    () => http.get(`${INSTRUCTION_URL}/instructions`, { headers }),
    () => http.get(`${AUTH_URL}/me`, { headers }),
    () => http.get(`${ANALYTICS_URL}/dashboard`, { headers }),
    () => http.get(`${AI_URL}/health`, { headers }),
  ];

  // Execute 2-3 random operations
  const numOperations = Math.floor(Math.random() * 2) + 2;
  for (let i = 0; i < numOperations; i++) {
    const operation = operations[Math.floor(Math.random() * operations.length)];
    const response = operation();
    
    const success = response.status < 500;
    apiSuccessRate.add(success);
    
    check(response, {
      'mixed operation status is acceptable': (r) => r.status < 500,
      'mixed operation response time < 2000ms': (r) => r.timings.duration < 2000,
    });

    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    
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
        category: testData.categories[Math.floor(Math.random() * testData.categories.length)],
        priority: testData.priorities[Math.floor(Math.random() * testData.priorities.length)],
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
  ];

  const operation = writeOperations[Math.floor(Math.random() * writeOperations.length)];
  const response = operation();
  
  const success = response.status < 500;
  apiSuccessRate.add(success);
  
  check(response, {
    'write operation status is acceptable': (r) => r.status < 500,
    'write operation response time < 3000ms': (r) => r.timings.duration < 3000,
  });

  errorRate.add(response.status >= 400);
  responseTime.add(response.timings.duration);
}

// Search operations
function testSearchOperations(headers) {
  const query = testData.searchQueries[Math.floor(Math.random() * testData.searchQueries.length)];
  const response = http.get(`${INSTRUCTION_URL}/instructions/search?q=${query}`, { headers });
  
  const success = response.status < 500;
  apiSuccessRate.add(success);
  
  check(response, {
    'search status is acceptable': (r) => r.status < 500,
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
}

// Teardown function
export function teardown(data) {
  console.log('🏁 Realistic stress test completed');
  console.log(`📊 Total requests made: ${requestCount.count}`);
  console.log(`🔐 Auth success rate: ${(authSuccessRate.count * 100).toFixed(2)}%`);
  console.log(`🌐 API success rate: ${(apiSuccessRate.count * 100).toFixed(2)}%`);
  console.log(`❌ Error rate: ${(errorRate.count * 100).toFixed(2)}%`);
}
