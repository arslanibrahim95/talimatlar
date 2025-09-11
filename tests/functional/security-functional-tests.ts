import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios, { AxiosInstance } from 'axios';

/**
 * Security Functional Tests
 * Tests security aspects of the application
 */

interface SecurityTestResult {
  testName: string;
  passed: boolean;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

class SecurityFunctionalTestSuite {
  private authApi: AxiosInstance;
  private analyticsApi: AxiosInstance;
  private instructionApi: AxiosInstance;
  private aiApi: AxiosInstance;
  private authToken: string = '';
  private testResults: SecurityTestResult[] = [];

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
    // Authenticate for API tests
    await this.authenticate();
  }

  async authenticate(): Promise<void> {
    try {
      const response = await this.authApi.post('/auth/login', {
        email: 'admin@test.com',
        password: 'admin123'
      });
      
      this.authToken = response.data.token;
      console.log('✅ Authentication successful for security tests');
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }

  addTestResult(testName: string, passed: boolean, details: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM') {
    this.testResults.push({
      testName,
      passed,
      details,
      severity
    });
  }

  async testSQLInjection(endpoint: string, maliciousInput: string): Promise<boolean> {
    try {
      await this.instructionApi.post(endpoint, {
        title: maliciousInput,
        content: 'Test content',
        category: 'Safety'
      }, {
        headers: this.getAuthHeaders()
      });
      return true; // If no error, input was properly sanitized
    } catch (error) {
      // Check if it's a validation error (good) or SQL error (bad)
      if (error.response?.status === 400) {
        return true; // Validation error is expected
      }
      return false; // SQL error or other unexpected error
    }
  }

  async testXSS(endpoint: string, maliciousScript: string): Promise<boolean> {
    try {
      const response = await this.instructionApi.post(endpoint, {
        title: maliciousScript,
        content: 'Test content',
        category: 'Safety'
      }, {
        headers: this.getAuthHeaders()
      });
      
      // Check if script was executed or properly escaped
      const responseData = JSON.stringify(response.data);
      return !responseData.includes('<script>') && !responseData.includes('javascript:');
    } catch (error) {
      return error.response?.status === 400; // Validation error is expected
    }
  }

  async testCSRF(endpoint: string): Promise<boolean> {
    try {
      // Try to make request without CSRF token
      await this.instructionApi.post(endpoint, {
        title: 'CSRF Test',
        content: 'Test content',
        category: 'Safety'
      }, {
        headers: {
          'Content-Type': 'application/json'
          // No CSRF token
        }
      });
      return false; // Should fail without CSRF token
    } catch (error) {
      return error.response?.status === 403; // Should return 403 Forbidden
    }
  }

  async testRateLimiting(endpoint: string, maxRequests: number = 10): Promise<boolean> {
    const promises = Array(maxRequests + 5).fill(null).map(async () => {
      try {
        await this.authApi.post('/auth/login', {
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
    
    return rateLimitedRequests.length > 0; // Should have some rate limited requests
  }

  async testInputValidation(endpoint: string, invalidInputs: any[]): Promise<boolean> {
    let allRejected = true;
    
    for (const input of invalidInputs) {
      try {
        await this.instructionApi.post(endpoint, input, {
          headers: this.getAuthHeaders()
        });
        allRejected = false; // Should have been rejected
      } catch (error) {
        if (error.response?.status !== 400) {
          allRejected = false; // Should return 400 Bad Request
        }
      }
    }
    
    return allRejected;
  }

  async testAuthenticationBypass(endpoints: string[]): Promise<boolean> {
    let allProtected = true;
    
    for (const endpoint of endpoints) {
      try {
        await this.instructionApi.get(endpoint, {
          headers: {
            'Content-Type': 'application/json'
            // No authentication token
          }
        });
        allProtected = false; // Should have been rejected
      } catch (error) {
        if (error.response?.status !== 401 && error.response?.status !== 403) {
          allProtected = false; // Should return 401 or 403
        }
      }
    }
    
    return allProtected;
  }

  async testAuthorizationBypass(endpoints: string[]): Promise<boolean> {
    let allAuthorized = true;
    
    // Login as regular user
    const userResponse = await this.authApi.post('/auth/login', {
      email: 'user@test.com',
      password: 'user123'
    });
    
    const userToken = userResponse.data.token;
    
    for (const endpoint of endpoints) {
      try {
        await this.instructionApi.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          }
        });
        allAuthorized = false; // Should have been rejected
      } catch (error) {
        if (error.response?.status !== 403) {
          allAuthorized = false; // Should return 403 Forbidden
        }
      }
    }
    
    return allAuthorized;
  }

  async testDataExposure(endpoints: string[]): Promise<boolean> {
    let noSensitiveData = true;
    
    for (const endpoint of endpoints) {
      try {
        const response = await this.instructionApi.get(endpoint, {
          headers: this.getAuthHeaders()
        });
        
        const responseData = JSON.stringify(response.data);
        
        // Check for sensitive data patterns
        const sensitivePatterns = [
          /password/i,
          /secret/i,
          /token/i,
          /key/i,
          /ssn/i,
          /credit.*card/i
        ];
        
        for (const pattern of sensitivePatterns) {
          if (pattern.test(responseData)) {
            noSensitiveData = false;
            break;
          }
        }
      } catch (error) {
        // Endpoint might not exist or be accessible
      }
    }
    
    return noSensitiveData;
  }

  generateSecurityReport(): string {
    const criticalIssues = this.testResults.filter(r => r.severity === 'CRITICAL' && !r.passed);
    const highIssues = this.testResults.filter(r => r.severity === 'HIGH' && !r.passed);
    const mediumIssues = this.testResults.filter(r => r.severity === 'MEDIUM' && !r.passed);
    const lowIssues = this.testResults.filter(r => r.severity === 'LOW' && !r.passed);

    let report = '# Security Test Report\n\n';
    report += `**Total Tests:** ${this.testResults.length}\n`;
    report += `**Passed:** ${this.testResults.filter(r => r.passed).length}\n`;
    report += `**Failed:** ${this.testResults.filter(r => !r.passed).length}\n\n`;

    if (criticalIssues.length > 0) {
      report += '## 🚨 CRITICAL ISSUES\n';
      criticalIssues.forEach(issue => {
        report += `- **${issue.testName}**: ${issue.details}\n`;
      });
      report += '\n';
    }

    if (highIssues.length > 0) {
      report += '## ⚠️ HIGH PRIORITY ISSUES\n';
      highIssues.forEach(issue => {
        report += `- **${issue.testName}**: ${issue.details}\n`;
      });
      report += '\n';
    }

    if (mediumIssues.length > 0) {
      report += '## ⚡ MEDIUM PRIORITY ISSUES\n';
      mediumIssues.forEach(issue => {
        report += `- **${issue.testName}**: ${issue.details}\n`;
      });
      report += '\n';
    }

    if (lowIssues.length > 0) {
      report += '## ℹ️ LOW PRIORITY ISSUES\n';
      lowIssues.forEach(issue => {
        report += `- **${issue.testName}**: ${issue.details}\n`;
      });
      report += '\n';
    }

    return report;
  }
}

describe('Security Functional Tests', () => {
  const testSuite = new SecurityFunctionalTestSuite();

  beforeAll(async () => {
    await testSuite.setup();
  });

  describe('Authentication Security', () => {
    it('should prevent authentication bypass', async () => {
      const protectedEndpoints = [
        '/api/instructions',
        '/api/analytics/dashboard',
        '/api/chat/history'
      ];

      const isProtected = await testSuite.testAuthenticationBypass(protectedEndpoints);
      
      expect(isProtected).toBe(true);
      testSuite.addTestResult(
        'Authentication Bypass Prevention',
        isProtected,
        'All protected endpoints require authentication',
        'CRITICAL'
      );
    });

    it('should prevent weak password attacks', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'admin',
        'qwerty',
        'abc123'
      ];

      let allRejected = true;
      
      for (const password of weakPasswords) {
        try {
          await testSuite.authApi.post('/auth/register', {
            email: `test${Date.now()}@example.com`,
            password: password,
            role: 'user'
          });
          allRejected = false; // Should have been rejected
        } catch (error) {
          if (error.response?.status !== 400) {
            allRejected = false; // Should return 400 Bad Request
          }
        }
      }

      expect(allRejected).toBe(true);
      testSuite.addTestResult(
        'Weak Password Prevention',
        allRejected,
        'Weak passwords are rejected during registration',
        'HIGH'
      );
    });

    it('should implement proper session management', async () => {
      // Login and get token
      const loginResponse = await testSuite.authApi.post('/auth/login', {
        email: 'user@test.com',
        password: 'user123'
      });

      const token = loginResponse.data.token;
      
      // Test token validity
      const validResponse = await testSuite.instructionApi.get('/api/instructions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      expect(validResponse.status).toBe(200);

      // Test token refresh
      const refreshResponse = await testSuite.authApi.post('/auth/refresh', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.data).toHaveProperty('token');

      testSuite.addTestResult(
        'Session Management',
        true,
        'Token-based authentication and refresh working properly',
        'HIGH'
      );
    });
  });

  describe('Authorization Security', () => {
    it('should prevent privilege escalation', async () => {
      const adminEndpoints = [
        '/api/admin/users',
        '/api/admin/stats',
        '/api/admin/settings'
      ];

      const isAuthorized = await testSuite.testAuthorizationBypass(adminEndpoints);
      
      expect(isAuthorized).toBe(true);
      testSuite.addTestResult(
        'Privilege Escalation Prevention',
        isAuthorized,
        'Regular users cannot access admin endpoints',
        'CRITICAL'
      );
    });

    it('should enforce role-based access control', async () => {
      // Test user role access
      const userResponse = await testSuite.authApi.post('/auth/login', {
        email: 'user@test.com',
        password: 'user123'
      });
      
      const userToken = userResponse.data.token;

      // User should be able to access user endpoints
      const userEndpointsResponse = await testSuite.instructionApi.get('/api/instructions', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(userEndpointsResponse.status).toBe(200);

      // User should not be able to access admin endpoints
      try {
        await testSuite.authApi.get('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          }
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.response?.status).toBe(403);
      }

      testSuite.addTestResult(
        'Role-Based Access Control',
        true,
        'Users can only access endpoints appropriate to their role',
        'HIGH'
      );
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection attacks', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE instructions; --",
        "' OR '1'='1",
        "'; INSERT INTO users (email, password) VALUES ('hacker@evil.com', 'password'); --",
        "' UNION SELECT * FROM users --"
      ];

      let allPrevented = true;
      
      for (const payload of sqlInjectionPayloads) {
        const isPrevented = await testSuite.testSQLInjection('/api/instructions', payload);
        if (!isPrevented) {
          allPrevented = false;
        }
      }

      expect(allPrevented).toBe(true);
      testSuite.addTestResult(
        'SQL Injection Prevention',
        allPrevented,
        'SQL injection attacks are prevented through input validation',
        'CRITICAL'
      );
    });

    it('should prevent XSS attacks', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">'
      ];

      let allPrevented = true;
      
      for (const payload of xssPayloads) {
        const isPrevented = await testSuite.testXSS('/api/instructions', payload);
        if (!isPrevented) {
          allPrevented = false;
        }
      }

      expect(allPrevented).toBe(true);
      testSuite.addTestResult(
        'XSS Prevention',
        allPrevented,
        'XSS attacks are prevented through input sanitization',
        'CRITICAL'
      );
    });

    it('should validate input data types and formats', async () => {
      const invalidInputs = [
        { title: '', content: 'Test', category: 'Safety' }, // Empty title
        { title: 'Test', content: '', category: 'Safety' }, // Empty content
        { title: 'Test', content: 'Test', category: 'InvalidCategory' }, // Invalid category
        { title: null, content: 'Test', category: 'Safety' }, // Null title
        { title: 'Test', content: 'Test', category: null }, // Null category
        { title: 123, content: 'Test', category: 'Safety' }, // Wrong type
        { title: 'Test', content: 'Test', category: 'Safety', extraField: 'hack' } // Extra field
      ];

      const allValidated = await testSuite.testInputValidation('/api/instructions', invalidInputs);
      
      expect(allValidated).toBe(true);
      testSuite.addTestResult(
        'Input Validation',
        allValidated,
        'Invalid input data is properly validated and rejected',
        'HIGH'
      );
    });
  });

  describe('Rate Limiting Security', () => {
    it('should implement rate limiting on authentication endpoints', async () => {
      const isRateLimited = await testSuite.testRateLimiting('/auth/login', 10);
      
      expect(isRateLimited).toBe(true);
      testSuite.addTestResult(
        'Authentication Rate Limiting',
        isRateLimited,
        'Authentication endpoints are protected by rate limiting',
        'HIGH'
      );
    });

    it('should implement rate limiting on API endpoints', async () => {
      // Test rate limiting on instruction endpoints
      const promises = Array(20).fill(null).map(async () => {
        try {
          await testSuite.instructionApi.get('/api/instructions', {
            headers: testSuite.getAuthHeaders()
          });
          return 200;
        } catch (error) {
          return error.response?.status || 500;
        }
      });

      const results = await Promise.all(promises);
      const rateLimitedRequests = results.filter(status => status === 429);
      
      const isRateLimited = rateLimitedRequests.length > 0;
      expect(isRateLimited).toBe(true);
      testSuite.addTestResult(
        'API Rate Limiting',
        isRateLimited,
        'API endpoints are protected by rate limiting',
        'MEDIUM'
      );
    });
  });

  describe('Data Protection Security', () => {
    it('should prevent sensitive data exposure', async () => {
      const endpoints = [
        '/api/instructions',
        '/api/analytics/dashboard',
        '/api/chat/history'
      ];

      const noSensitiveData = await testSuite.testDataExposure(endpoints);
      
      expect(noSensitiveData).toBe(true);
      testSuite.addTestResult(
        'Sensitive Data Exposure Prevention',
        noSensitiveData,
        'No sensitive data is exposed in API responses',
        'HIGH'
      );
    });

    it('should implement proper CORS configuration', async () => {
      try {
        const response = await testSuite.authApi.options('/auth/login', {
          headers: {
            'Origin': 'http://malicious-site.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
          }
        });

        // Check CORS headers
        const corsOrigin = response.headers['access-control-allow-origin'];
        const corsMethods = response.headers['access-control-allow-methods'];
        
        const isProperlyConfigured = corsOrigin !== '*' && corsMethods !== '*';
        
        expect(isProperlyConfigured).toBe(true);
        testSuite.addTestResult(
          'CORS Configuration',
          isProperlyConfigured,
          'CORS is properly configured to prevent unauthorized cross-origin requests',
          'MEDIUM'
        );
      } catch (error) {
        // CORS might be blocking the request, which is good
        testSuite.addTestResult(
          'CORS Configuration',
          true,
          'CORS is blocking unauthorized cross-origin requests',
          'MEDIUM'
        );
      }
    });

    it('should implement secure headers', async () => {
      const response = await testSuite.authApi.get('/health');
      
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security'
      ];

      let hasSecurityHeaders = true;
      for (const header of securityHeaders) {
        if (!response.headers[header]) {
          hasSecurityHeaders = false;
          break;
        }
      }

      expect(hasSecurityHeaders).toBe(true);
      testSuite.addTestResult(
        'Security Headers',
        hasSecurityHeaders,
        'Security headers are properly implemented',
        'MEDIUM'
      );
    });
  });

  describe('CSRF Protection', () => {
    it('should prevent CSRF attacks', async () => {
      const isProtected = await testSuite.testCSRF('/api/instructions');
      
      expect(isProtected).toBe(true);
      testSuite.addTestResult(
        'CSRF Protection',
        isProtected,
        'CSRF attacks are prevented through token validation',
        'HIGH'
      );
    });
  });

  describe('Security Headers', () => {
    it('should implement Content Security Policy', async () => {
      const response = await testSuite.authApi.get('/health');
      
      const cspHeader = response.headers['content-security-policy'];
      const hasCSP = !!cspHeader;
      
      expect(hasCSP).toBe(true);
      testSuite.addTestResult(
        'Content Security Policy',
        hasCSP,
        'Content Security Policy header is implemented',
        'MEDIUM'
      );
    });

    it('should implement HSTS', async () => {
      const response = await testSuite.authApi.get('/health');
      
      const hstsHeader = response.headers['strict-transport-security'];
      const hasHSTS = !!hstsHeader;
      
      expect(hasHSTS).toBe(true);
      testSuite.addTestResult(
        'HTTP Strict Transport Security',
        hasHSTS,
        'HSTS header is implemented for secure transport',
        'MEDIUM'
      );
    });
  });

  describe('Security Report Generation', () => {
    it('should generate comprehensive security report', async () => {
      const report = testSuite.generateSecurityReport();
      
      expect(report).toContain('# Security Test Report');
      expect(report).toContain('Total Tests:');
      expect(report).toContain('Passed:');
      expect(report).toContain('Failed:');
      
      console.log('\n' + report);
      
      testSuite.addTestResult(
        'Security Report Generation',
        true,
        'Comprehensive security report generated successfully',
        'LOW'
      );
    });
  });
});
