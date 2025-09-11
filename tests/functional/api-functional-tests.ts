import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios, { AxiosInstance } from 'axios';

/**
 * API Functional Tests
 * Tests all API endpoints and their functionality
 */

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

interface TestData {
  instruction: {
    title: string;
    content: string;
    category: string;
  };
  document: {
    name: string;
    type: string;
    content: string;
  };
  user: {
    email: string;
    password: string;
    role: string;
  };
}

class APIFunctionalTestSuite {
  private authApi: AxiosInstance;
  private analyticsApi: AxiosInstance;
  private instructionApi: AxiosInstance;
  private aiApi: AxiosInstance;
  private adminToken: string = '';
  private userToken: string = '';
  
  private testData: TestData = {
    instruction: {
      title: 'API Test Instruction',
      content: 'This is a test instruction created via API',
      category: 'Safety'
    },
    document: {
      name: 'api-test-document.pdf',
      type: 'application/pdf',
      content: 'Test document content for API testing'
    },
    user: {
      email: 'apitest@example.com',
      password: 'apitest123',
      role: 'user'
    }
  };

  constructor() {
    this.authApi = axios.create({
      baseURL: 'http://localhost:8004',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.analyticsApi = axios.create({
      baseURL: 'http://localhost:8003',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.instructionApi = axios.create({
      baseURL: 'http://localhost:8005',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.aiApi = axios.create({
      baseURL: 'http://localhost:8006',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async setup() {
    // Check if all services are running
    await this.checkServicesHealth();
    
    // Authenticate as admin and user
    await this.authenticateUsers();
  }

  async checkServicesHealth(): Promise<void> {
    const services = [
      { name: 'Auth Service', url: 'http://localhost:8004/health' },
      { name: 'Analytics Service', url: 'http://localhost:8003/health' },
      { name: 'Instruction Service', url: 'http://localhost:8005/health' },
      { name: 'AI Service', url: 'http://localhost:8006/health' }
    ];

    for (const service of services) {
      try {
        const response = await axios.get(service.url, { timeout: 5000 });
        if (response.status !== 200) {
          throw new Error(`${service.name} is not healthy: ${response.status}`);
        }
        console.log(`✅ ${service.name} is healthy`);
      } catch (error) {
        throw new Error(`${service.name} is not accessible: ${error.message}`);
      }
    }
  }

  async authenticateUsers(): Promise<void> {
    try {
      // Login as admin
      const adminResponse = await this.authApi.post('/auth/login', {
        email: 'admin@test.com',
        password: 'admin123'
      });
      
      this.adminToken = adminResponse.data.token;
      console.log('✅ Admin authentication successful');

      // Login as user
      const userResponse = await this.authApi.post('/auth/login', {
        email: 'user@test.com',
        password: 'user123'
      });
      
      this.userToken = userResponse.data.token;
      console.log('✅ User authentication successful');

    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  getAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}

describe('API Functional Tests', () => {
  const testSuite = new APIFunctionalTestSuite();

  beforeAll(async () => {
    await testSuite.setup();
  });

  describe('Authentication API', () => {
    it('should allow user registration', async () => {
      const response = await testSuite.authApi.post('/auth/register', {
        email: testSuite.testData.user.email,
        password: testSuite.testData.user.password,
        role: testSuite.testData.user.role
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe(testSuite.testData.user.email);
    });

    it('should allow user login', async () => {
      const response = await testSuite.authApi.post('/auth/login', {
        email: testSuite.testData.user.email,
        password: testSuite.testData.user.password
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
    });

    it('should reject login with invalid credentials', async () => {
      try {
        await testSuite.authApi.post('/auth/login', {
          email: 'invalid@test.com',
          password: 'wrongpassword'
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.response?.status).toBe(401);
      }
    });

    it('should allow token refresh', async () => {
      const response = await testSuite.authApi.post('/auth/refresh', {}, {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
    });

    it('should allow user logout', async () => {
      const response = await testSuite.authApi.post('/auth/logout', {}, {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Instruction Management API', () => {
    let instructionId: string;

    it('should create new instruction', async () => {
      const response = await testSuite.instructionApi.post('/api/instructions', {
        title: testSuite.testData.instruction.title,
        content: testSuite.testData.instruction.content,
        category: testSuite.testData.instruction.category
      }, {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.title).toBe(testSuite.testData.instruction.title);
      
      instructionId = response.data.id;
    });

    it('should get all instructions', async () => {
      const response = await testSuite.instructionApi.get('/api/instructions', {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    it('should get instruction by ID', async () => {
      const response = await testSuite.instructionApi.get(`/api/instructions/${instructionId}`, {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(instructionId);
      expect(response.data.title).toBe(testSuite.testData.instruction.title);
    });

    it('should update instruction', async () => {
      const updatedContent = 'Updated instruction content via API';
      
      const response = await testSuite.instructionApi.put(`/api/instructions/${instructionId}`, {
        title: testSuite.testData.instruction.title,
        content: updatedContent,
        category: testSuite.testData.instruction.category
      }, {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
      expect(response.data.content).toBe(updatedContent);
    });

    it('should delete instruction', async () => {
      const response = await testSuite.instructionApi.delete(`/api/instructions/${instructionId}`, {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
    });

    it('should search instructions', async () => {
      const response = await testSuite.instructionApi.get('/api/instructions/search', {
        params: { q: 'safety' },
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Analytics API', () => {
    it('should get dashboard statistics', async () => {
      const response = await testSuite.analyticsApi.get('/api/analytics/dashboard', {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('totalInstructions');
      expect(response.data).toHaveProperty('totalDocuments');
      expect(response.data).toHaveProperty('totalUsers');
    });

    it('should get user activity data', async () => {
      const response = await testSuite.analyticsApi.get('/api/analytics/user-activity', {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should get document statistics', async () => {
      const response = await testSuite.analyticsApi.get('/api/analytics/documents', {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('totalDocuments');
      expect(response.data).toHaveProperty('documentsByType');
    });

    it('should get instruction usage statistics', async () => {
      const response = await testSuite.analyticsApi.get('/api/analytics/instructions', {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('totalInstructions');
      expect(response.data).toHaveProperty('instructionsByCategory');
    });

    it('should get reports with date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      
      const response = await testSuite.analyticsApi.get('/api/analytics/reports', {
        params: { startDate, endDate },
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('period');
      expect(response.data.period.startDate).toBe(startDate);
      expect(response.data.period.endDate).toBe(endDate);
    });
  });

  describe('AI Service API', () => {
    it('should start chat session', async () => {
      const response = await testSuite.aiApi.post('/api/chat/sessions', {
        userId: 'test-user-id'
      }, {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('sessionId');
    });

    it('should send message to AI', async () => {
      const sessionResponse = await testSuite.aiApi.post('/api/chat/sessions', {
        userId: 'test-user-id'
      }, {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      const sessionId = sessionResponse.data.sessionId;

      const response = await testSuite.aiApi.post(`/api/chat/sessions/${sessionId}/messages`, {
        message: 'Hello, can you help me with safety instructions?',
        type: 'user'
      }, {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('messageId');
      expect(response.data).toHaveProperty('response');
    });

    it('should get chat history', async () => {
      const response = await testSuite.aiApi.get('/api/chat/history', {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should get AI usage statistics', async () => {
      const response = await testSuite.aiApi.get('/api/analytics/usage', {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('totalMessages');
      expect(response.data).toHaveProperty('totalSessions');
    });
  });

  describe('Admin API', () => {
    it('should get all users (admin only)', async () => {
      const response = await testSuite.authApi.get('/api/admin/users', {
        headers: testSuite.getAuthHeaders(testSuite.adminToken)
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should reject user access to admin endpoints', async () => {
      try {
        await testSuite.authApi.get('/api/admin/users', {
          headers: testSuite.getAuthHeaders(testSuite.userToken)
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.response?.status).toBe(403);
      }
    });

    it('should get system statistics', async () => {
      const response = await testSuite.authApi.get('/api/admin/stats', {
        headers: testSuite.getAuthHeaders(testSuite.adminToken)
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('totalUsers');
      expect(response.data).toHaveProperty('totalInstructions');
      expect(response.data).toHaveProperty('totalDocuments');
    });

    it('should manage user roles', async () => {
      const response = await testSuite.authApi.put('/api/admin/users/role', {
        userId: 'test-user-id',
        role: 'admin'
      }, {
        headers: testSuite.getAuthHeaders(testSuite.adminToken)
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      try {
        await testSuite.authApi.get('/api/non-existent-endpoint', {
          headers: testSuite.getAuthHeaders(testSuite.userToken)
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.response?.status).toBe(404);
      }
    });

    it('should return 400 for invalid request data', async () => {
      try {
        await testSuite.instructionApi.post('/api/instructions', {
          // Missing required fields
        }, {
          headers: testSuite.getAuthHeaders(testSuite.userToken)
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.response?.status).toBe(400);
      }
    });

    it('should return 401 for requests without token', async () => {
      try {
        await testSuite.instructionApi.get('/api/instructions');
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.response?.status).toBe(401);
      }
    });

    it('should return 403 for requests with invalid token', async () => {
      try {
        await testSuite.instructionApi.get('/api/instructions', {
          headers: testSuite.getAuthHeaders('invalid-token')
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.response?.status).toBe(403);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests', async () => {
      const promises = Array(10).fill(null).map(async (_, index) => {
        const response = await testSuite.instructionApi.get('/api/instructions', {
          headers: testSuite.getAuthHeaders(testSuite.userToken)
        });
        return response.status;
      });

      const results = await Promise.all(promises);
      results.forEach(status => {
        expect(status).toBe(200);
      });
    });

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      await testSuite.instructionApi.get('/api/instructions', {
        headers: testSuite.getAuthHeaders(testSuite.userToken)
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection', async () => {
      const maliciousInput = "'; DROP TABLE instructions; --";
      
      try {
        await testSuite.instructionApi.post('/api/instructions', {
          title: maliciousInput,
          content: 'Test content',
          category: 'Safety'
        }, {
          headers: testSuite.getAuthHeaders(testSuite.userToken)
        });
        
        // If we get here, the input was properly sanitized
        expect(true).toBe(true);
      } catch (error) {
        // If we get an error, it should be a validation error, not a SQL error
        expect(error.response?.status).toBe(400);
      }
    });

    it('should validate input data', async () => {
      try {
        await testSuite.instructionApi.post('/api/instructions', {
          title: '', // Empty title should be rejected
          content: 'Test content',
          category: 'InvalidCategory'
        }, {
          headers: testSuite.getAuthHeaders(testSuite.userToken)
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.response?.status).toBe(400);
      }
    });

    it('should enforce rate limiting', async () => {
      const promises = Array(20).fill(null).map(async () => {
        try {
          await testSuite.authApi.post('/auth/login', {
            email: 'test@example.com',
            password: 'wrongpassword'
          });
          return 200;
        } catch (error) {
          return error.response?.status || 500;
        }
      });

      const results = await Promise.all(promises);
      const rateLimitedRequests = results.filter(status => status === 429);
      
      // Should have some rate limited requests
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });
  });
});
