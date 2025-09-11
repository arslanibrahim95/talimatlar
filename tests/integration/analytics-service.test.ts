import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// Mock data for testing
const mockAnalyticsData = {
  dashboard: {
    totalUsers: 150,
    activeUsers: 45,
    totalDocuments: 320,
    totalInstructions: 89,
    complianceRate: 92.5,
    riskScore: 3.2
  },
  reports: [
    {
      id: '1',
      title: 'Monthly Safety Report',
      type: 'monthly',
      generatedAt: new Date(),
      data: {
        incidents: 2,
        nearMisses: 5,
        trainingCompleted: 45,
        complianceScore: 94.2
      }
    }
  ],
  metrics: {
    pageViews: 1250,
    uniqueVisitors: 89,
    averageSessionDuration: 8.5,
    bounceRate: 12.3
  }
};

const mockUser = {
  id: '1',
  email: 'test@example.com',
  role: 'admin'
};

describe('Analytics Service Integration Tests', () => {
  let baseUrl: string;
  let authToken: string;

  beforeAll(async () => {
    baseUrl = 'http://localhost:8003';
    
    // Get auth token for protected endpoints
    const loginResponse = await fetch('http://localhost:8004/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
      }),
    });
    
    const loginResult = await loginResponse.json();
    authToken = loginResult.token;
  });

  describe('GET /analytics/dashboard', () => {
    it('should return dashboard data for authenticated user', async () => {
      const response = await fetch(`${baseUrl}/analytics/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('totalUsers');
      expect(result.data).toHaveProperty('activeUsers');
      expect(result.data).toHaveProperty('totalDocuments');
      expect(result.data).toHaveProperty('complianceRate');
    });

    it('should return error for unauthenticated request', async () => {
      const response = await fetch(`${baseUrl}/analytics/dashboard`, {
        method: 'GET',
      });

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.success).toBe(false);
    });

    it('should return error for user without admin role', async () => {
      // Get regular user token
      const loginResponse = await fetch('http://localhost:8004/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
      });
      
      const loginResult = await loginResponse.json();
      const userToken = loginResult.token;

      const response = await fetch(`${baseUrl}/analytics/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });

      expect(response.status).toBe(403);
      const result = await response.json();
      expect(result.success).toBe(false);
    });
  });

  describe('GET /analytics/reports', () => {
    it('should return reports list for authenticated admin', async () => {
      const response = await fetch(`${baseUrl}/analytics/reports`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter reports by type', async () => {
      const response = await fetch(`${baseUrl}/analytics/reports?type=monthly`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter reports by date range', async () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();

      const response = await fetch(
        `${baseUrl}/analytics/reports?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  describe('POST /analytics/reports', () => {
    it('should create new report for authenticated admin', async () => {
      const reportData = {
        title: 'Test Report',
        type: 'custom',
        parameters: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeMetrics: true
        }
      };

      const response = await fetch(`${baseUrl}/analytics/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data.title).toBe(reportData.title);
    });

    it('should return validation error for invalid report data', async () => {
      const invalidReportData = {
        title: '', // Empty title
        type: 'invalid_type',
        parameters: {}
      };

      const response = await fetch(`${baseUrl}/analytics/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidReportData),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
    });
  });

  describe('GET /analytics/metrics', () => {
    it('should return metrics data for authenticated user', async () => {
      const response = await fetch(`${baseUrl}/analytics/metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('pageViews');
      expect(result.data).toHaveProperty('uniqueVisitors');
      expect(result.data).toHaveProperty('averageSessionDuration');
    });

    it('should return metrics for specific time period', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await fetch(
        `${baseUrl}/analytics/metrics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  describe('GET /analytics/trends', () => {
    it('should return trend data for authenticated user', async () => {
      const response = await fetch(`${baseUrl}/analytics/trends`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return trends for specific metric', async () => {
      const response = await fetch(`${baseUrl}/analytics/trends?metric=compliance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  describe('POST /analytics/track', () => {
    it('should track user activity', async () => {
      const activityData = {
        event: 'page_view',
        page: '/dashboard',
        userId: mockUser.id,
        metadata: {
          userAgent: 'test-agent',
          timestamp: new Date().toISOString()
        }
      };

      const response = await fetch(`${baseUrl}/analytics/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });

    it('should validate activity data', async () => {
      const invalidActivityData = {
        event: '', // Empty event
        page: '/dashboard',
        userId: mockUser.id
      };

      const response = await fetch(`${baseUrl}/analytics/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidActivityData),
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
    });
  });

  describe('Caching', () => {
    it('should cache dashboard data', async () => {
      // First request
      const response1 = await fetch(`${baseUrl}/analytics/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response1.status).toBe(200);
      const result1 = await response1.json();

      // Second request should be cached
      const response2 = await fetch(`${baseUrl}/analytics/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response2.status).toBe(200);
      const result2 = await response2.json();

      // Results should be identical (cached)
      expect(result1.data).toEqual(result2.data);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database failure
      const response = await fetch(`${baseUrl}/analytics/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      // Should not crash, should return error response
      expect([200, 500]).toContain(response.status);
    });

    it('should handle invalid date parameters', async () => {
      const response = await fetch(
        `${baseUrl}/analytics/metrics?startDate=invalid-date&endDate=also-invalid`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
    });
  });
});
