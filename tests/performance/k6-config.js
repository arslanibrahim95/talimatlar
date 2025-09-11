// K6 Performance Testing Configuration

export const options = {
  // Test scenarios
  scenarios: {
    // Load test scenario
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },

    // Stress test scenario
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '3m', target: 200 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },

    // Spike test scenario
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
      ],
      gracefulRampDown: '30s',
    },

    // Soak test scenario
    soak_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30m',
    },
  },

  // Performance thresholds
  thresholds: {
    // Response time thresholds
    http_req_duration: [
      'p(95)<500',   // 95% of requests should be below 500ms
      'p(99)<1000',  // 99% of requests should be below 1s
    ],

    // Error rate thresholds
    http_req_failed: [
      'rate<0.1',    // Error rate should be below 10%
    ],

    // Custom metric thresholds
    response_time: [
      'p(95)<500',
      'p(99)<1000',
    ],

    errors: [
      'rate<0.1',
    ],

    // Throughput thresholds
    http_reqs: [
      'rate>10',     // Should handle at least 10 requests per second
    ],
  },

  // Test tags
  tags: {
    environment: 'test',
    test_type: 'performance',
  },

  // Test summary
  summaryTrendStats: [
    'avg',
    'min',
    'med',
    'max',
    'p(90)',
    'p(95)',
    'p(99)',
  ],

  // Test output
  summaryTimeUnit: 'ms',
};

// Test data
export const testData = {
  baseUrl: 'http://localhost:8080',
  authUrl: 'http://localhost:8080/auth',
  instructionsUrl: 'http://localhost:8080/instructions',
  analyticsUrl: 'http://localhost:8080/analytics',
  
  // Test users
  users: [
    { email: 'test1@example.com', password: 'password123' },
    { email: 'test2@example.com', password: 'password123' },
    { email: 'test3@example.com', password: 'password123' },
    { email: 'admin@example.com', password: 'password123' },
  ],

  // Test payloads
  instructionData: {
    title: 'Performance Test Instruction',
    content: 'This is a performance test instruction',
    category: 'safety',
    priority: 'high',
    status: 'active'
  },

  analyticsData: {
    event: 'performance_test',
    page: '/performance-test',
    userId: '1',
    metadata: {
      timestamp: new Date().toISOString(),
      testType: 'performance'
    }
  },
};

// Utility functions
export function getRandomUser() {
  return testData.users[Math.floor(Math.random() * testData.users.length)];
}

export function getRandomEndpoint() {
  const endpoints = [
    testData.instructionsUrl,
    `${testData.instructionsUrl}?category=safety`,
    `${testData.instructionsUrl}?priority=high`,
    `${testData.analyticsUrl}/dashboard`,
    `${testData.analyticsUrl}/metrics`,
  ];
  return endpoints[Math.floor(Math.random() * endpoints.length)];
}

export function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
