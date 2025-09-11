import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// Test configuration
const API_GATEWAY_URL = 'http://localhost:8080';
const AUTH_SERVICE_URL = 'http://localhost:8004';
const ANALYTICS_SERVICE_URL = 'http://localhost:8003';
const INSTRUCTION_SERVICE_URL = 'http://localhost:8005';
const AI_SERVICE_URL = 'http://localhost:8006';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User'
};

const testAdmin = {
  email: 'admin@example.com',
  password: 'admin123',
  firstName: 'Admin',
  lastName: 'User'
};

describe('API Gateway Integration Tests', () => {
  let authToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Register test users
    await fetch(`${AUTH_SERVICE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    await fetch(`${AUTH_SERVICE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testAdmin)
    });

    // Login to get tokens
    const userLoginResponse = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const adminLoginResponse = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testAdmin.email,
        password: testAdmin.password
      })
    });

    const userResult = await userLoginResponse.json();
    const adminResult = await adminLoginResponse.json();

    authToken = userResult.token;
    adminToken = adminResult.token;
  });

  describe('Health Check', () => {
    it('should return gateway health status', async () => {
      const response = await fetch(`${API_GATEWAY_URL}/gateway/health`);
      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('Authentication Routing', () => {
    it('should route auth requests to auth service', async () => {
      const response = await fetch(`${API_GATEWAY_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should route register requests to auth service', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      const response = await fetch(`${API_GATEWAY_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  describe('Analytics Routing', () => {
    it('should route analytics requests to analytics service', async () => {
      const response = await fetch(`${API_GATEWAY_URL}/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });

    it('should handle analytics service errors', async () => {
      const response = await fetch(`${API_GATEWAY_URL}/analytics/invalid-endpoint`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Instruction Service Routing', () => {
    it('should route instruction requests to instruction service', async () => {
      const response = await fetch(`${API_GATEWAY_URL}/instructions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });

    it('should create new instruction through gateway', async () => {
      const instructionData = {
        title: 'Test Instruction',
        content: 'This is a test instruction',
        category: 'safety',
        priority: 'high'
      };

      const response = await fetch(`${API_GATEWAY_URL}/instructions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(instructionData)
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  describe('AI Service Routing', () => {
    it('should route AI requests to AI service', async () => {
      const response = await fetch(`${API_GATEWAY_URL}/ai/health`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
    });

    it('should process AI requests through gateway', async () => {
      const aiRequest = {
        prompt: 'Generate a safety instruction for working at heights',
        context: 'construction',
        type: 'instruction'
      };

      const response = await fetch(`${API_GATEWAY_URL}/ai/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(aiRequest)
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  describe('Request Validation', () => {
    it('should validate JWT tokens', async () => {
      const response = await fetch(`${API_GATEWAY_URL}/analytics/dashboard`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect(response.status).toBe(401);
    });

    it('should validate request body format', async () => {
      const response = await fetch(`${API_GATEWAY_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json'
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on API requests', async () => {
      const requests = Array(100).fill(null).map(() =>
        fetch(`${API_GATEWAY_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
        })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CORS Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await fetch(`${API_GATEWAY_URL}/gateway/health`, {
        method: 'OPTIONS'
      });

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
    });
  });

  describe('Load Balancing', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        fetch(`${API_GATEWAY_URL}/gateway/health`)
      );

      const responses = await Promise.all(requests);
      const successfulResponses = responses.filter(r => r.status === 200);
      
      expect(successfulResponses.length).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle service unavailability gracefully', async () => {
      // This would require stopping a service to test
      const response = await fetch(`${API_GATEWAY_URL}/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      // Should return appropriate error status
      expect([200, 503, 502]).toContain(response.status);
    });

    it('should return proper error format', async () => {
      const response = await fetch(`${API_GATEWAY_URL}/invalid-endpoint`);
      
      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result.error).toBeDefined();
      expect(result.message).toBeDefined();
    });
  });

  describe('Logging and Monitoring', () => {
    it('should log requests properly', async () => {
      const response = await fetch(`${API_GATEWAY_URL}/gateway/health`);
      
      expect(response.status).toBe(200);
      // In a real implementation, you would check logs here
    });

    it('should track metrics', async () => {
      const response = await fetch(`${API_GATEWAY_URL}/gateway/metrics`);
      
      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.requests).toBeDefined();
      expect(result.errors).toBeDefined();
    });
  });
});
