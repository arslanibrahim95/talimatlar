import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// Service URLs
const API_GATEWAY_URL = 'http://localhost:8080';
const AUTH_SERVICE_URL = 'http://localhost:8004';
const FRONTEND_URL = 'http://localhost:3000';

// Test data
const testUser = {
  email: 'e2e_test@example.com',
  password: 'password123',
  firstName: 'E2E',
  lastName: 'Test'
};

const testAdmin = {
  email: 'e2e_admin@example.com',
  password: 'admin123',
  firstName: 'E2E',
  lastName: 'Admin'
};

describe('End-to-End Workflow Integration Tests', () => {
  let userToken: string;
  let adminToken: string;
  let createdInstructionId: string;
  let createdReportId: string;

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

    userToken = userResult.token;
    adminToken = adminResult.token;
  });

  describe('Complete User Registration and Onboarding Flow', () => {
    it('should complete full user registration flow', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      // Step 1: Register user
      const registerResponse = await fetch(`${API_GATEWAY_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      expect(registerResponse.status).toBe(201);
      const registerResult = await registerResponse.json();
      expect(registerResult.success).toBe(true);

      // Step 2: Login with new user
      const loginResponse = await fetch(`${API_GATEWAY_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password
        })
      });

      expect(loginResponse.status).toBe(200);
      const loginResult = await loginResponse.json();
      expect(loginResult.success).toBe(true);
      expect(loginResult.token).toBeDefined();

      // Step 3: Get user profile
      const profileResponse = await fetch(`${API_GATEWAY_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${loginResult.token}`
        }
      });

      expect(profileResponse.status).toBe(200);
      const profileResult = await profileResponse.json();
      expect(profileResult.success).toBe(true);
      expect(profileResult.user.email).toBe(newUser.email);
    });
  });

  describe('Complete Instruction Management Workflow', () => {
    it('should complete full instruction lifecycle', async () => {
      // Step 1: Create instruction
      const instructionData = {
        title: 'E2E Test Safety Instruction',
        content: 'This is a comprehensive safety instruction for E2E testing',
        category: 'safety',
        priority: 'high',
        tags: ['e2e', 'test', 'safety'],
        department: 'Testing'
      };

      const createResponse = await fetch(`${API_GATEWAY_URL}/instructions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(instructionData)
      });

      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json();
      expect(createResult.success).toBe(true);
      createdInstructionId = createResult.data.id;

      // Step 2: Submit for approval
      const submitResponse = await fetch(`${API_GATEWAY_URL}/instructions/${createdInstructionId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      expect(submitResponse.status).toBe(200);
      const submitResult = await submitResponse.json();
      expect(submitResult.success).toBe(true);
      expect(submitResult.data.status).toBe('pending_approval');

      // Step 3: Admin approves instruction
      const approveResponse = await fetch(`${API_GATEWAY_URL}/instructions/${createdInstructionId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      expect(approveResponse.status).toBe(200);
      const approveResult = await approveResponse.json();
      expect(approveResult.success).toBe(true);
      expect(approveResult.data.status).toBe('approved');

      // Step 4: Search for instruction
      const searchResponse = await fetch(`${API_GATEWAY_URL}/instructions/search?q=E2E`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      expect(searchResponse.status).toBe(200);
      const searchResult = await searchResponse.json();
      expect(searchResult.success).toBe(true);
      expect(searchResult.data.length).toBeGreaterThan(0);

      // Step 5: Update instruction
      const updateData = {
        title: 'Updated E2E Test Safety Instruction',
        content: 'Updated content for E2E testing',
        priority: 'critical'
      };

      const updateResponse = await fetch(`${API_GATEWAY_URL}/instructions/${createdInstructionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(updateResponse.status).toBe(200);
      const updateResult = await updateResponse.json();
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.title).toBe(updateData.title);
    });
  });

  describe('Complete Analytics and Reporting Workflow', () => {
    it('should complete full analytics workflow', async () => {
      // Step 1: Track user activity
      const activityData = {
        event: 'page_view',
        page: '/dashboard',
        metadata: {
          userAgent: 'E2E Test Agent',
          timestamp: new Date().toISOString()
        }
      };

      const trackResponse = await fetch(`${API_GATEWAY_URL}/analytics/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      });

      expect(trackResponse.status).toBe(200);

      // Step 2: Get dashboard analytics
      const dashboardResponse = await fetch(`${API_GATEWAY_URL}/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      expect(dashboardResponse.status).toBe(200);
      const dashboardResult = await dashboardResponse.json();
      expect(dashboardResult.success).toBe(true);
      expect(dashboardResult.data).toHaveProperty('totalUsers');

      // Step 3: Generate custom report
      const reportData = {
        title: 'E2E Test Report',
        type: 'custom',
        parameters: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          includeMetrics: true
        }
      };

      const reportResponse = await fetch(`${API_GATEWAY_URL}/analytics/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });

      expect(reportResponse.status).toBe(201);
      const reportResult = await reportResponse.json();
      expect(reportResult.success).toBe(true);
      createdReportId = reportResult.data.id;

      // Step 4: Retrieve generated report
      const getReportResponse = await fetch(`${API_GATEWAY_URL}/analytics/reports/${createdReportId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      expect(getReportResponse.status).toBe(200);
      const getReportResult = await getReportResponse.json();
      expect(getReportResult.success).toBe(true);
      expect(getReportResult.data.title).toBe(reportData.title);
    });
  });

  describe('Complete AI Integration Workflow', () => {
    it('should complete full AI-powered instruction generation workflow', async () => {
      // Step 1: Generate instruction using AI
      const aiRequest = {
        prompt: 'Generate a safety instruction for working with electrical equipment',
        context: 'construction',
        type: 'instruction',
        parameters: {
          length: 'medium',
          tone: 'professional',
          language: 'tr'
        }
      };

      const generateResponse = await fetch(`${API_GATEWAY_URL}/ai/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(aiRequest)
      });

      expect(generateResponse.status).toBe(200);
      const generateResult = await generateResponse.json();
      expect(generateResult.success).toBe(true);
      expect(generateResult.data).toHaveProperty('text');

      // Step 2: Analyze generated content
      const analysisData = {
        content: generateResult.data.text,
        type: 'safety_instruction',
        language: 'tr'
      };

      const analyzeResponse = await fetch(`${API_GATEWAY_URL}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(analysisData)
      });

      expect(analyzeResponse.status).toBe(200);
      const analyzeResult = await analyzeResponse.json();
      expect(analyzeResult.success).toBe(true);
      expect(analyzeResult.data).toHaveProperty('complianceScore');

      // Step 3: Create instruction from AI-generated content
      const instructionData = {
        title: 'AI-Generated Electrical Safety Instruction',
        content: generateResult.data.text,
        category: 'electrical',
        priority: 'high',
        tags: ['ai-generated', 'electrical', 'safety'],
        department: 'Maintenance',
        aiGenerated: true,
        aiAnalysis: analyzeResult.data
      };

      const createResponse = await fetch(`${API_GATEWAY_URL}/instructions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(instructionData)
      });

      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json();
      expect(createResult.success).toBe(true);
      expect(createResult.data.aiGenerated).toBe(true);
    });
  });

  describe('Complete Document Management Workflow', () => {
    it('should complete full document lifecycle', async () => {
      // Step 1: Upload document
      const formData = new FormData();
      const testContent = 'This is a test safety document for E2E testing.';
      const blob = new Blob([testContent], { type: 'text/plain' });
      formData.append('file', blob, 'test-safety-document.txt');
      formData.append('title', 'E2E Test Safety Document');
      formData.append('category', 'safety');
      formData.append('description', 'Test document for E2E workflow');

      const uploadResponse = await fetch(`${API_GATEWAY_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`
        },
        body: formData
      });

      expect(uploadResponse.status).toBe(201);
      const uploadResult = await uploadResponse.json();
      expect(uploadResult.success).toBe(true);
      const documentId = uploadResult.data.id;

      // Step 2: Process document with AI
      const processData = {
        documentId: documentId,
        operations: ['extract_keywords', 'summarize', 'classify']
      };

      const processResponse = await fetch(`${API_GATEWAY_URL}/documents/${documentId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processData)
      });

      expect(processResponse.status).toBe(200);
      const processResult = await processResponse.json();
      expect(processResult.success).toBe(true);

      // Step 3: Search documents
      const searchResponse = await fetch(`${API_GATEWAY_URL}/documents/search?q=safety`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      expect(searchResponse.status).toBe(200);
      const searchResult = await searchResponse.json();
      expect(searchResult.success).toBe(true);
      expect(searchResult.data.length).toBeGreaterThan(0);

      // Step 4: Download document
      const downloadResponse = await fetch(`${API_GATEWAY_URL}/documents/${documentId}/download`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      expect(downloadResponse.status).toBe(200);
      expect(downloadResponse.headers.get('content-type')).toContain('text/plain');
    });
  });

  describe('Complete Notification Workflow', () => {
    it('should complete full notification workflow', async () => {
      // Step 1: Create notification preference
      const preferenceData = {
        email: true,
        push: true,
        sms: false,
        categories: ['safety', 'updates', 'reports']
      };

      const preferenceResponse = await fetch(`${API_GATEWAY_URL}/notifications/preferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferenceData)
      });

      expect(preferenceResponse.status).toBe(200);

      // Step 2: Send notification
      const notificationData = {
        userId: 'test_user_id',
        type: 'safety_alert',
        title: 'E2E Test Safety Alert',
        message: 'This is a test safety alert for E2E testing',
        priority: 'high',
        channels: ['email', 'push']
      };

      const sendResponse = await fetch(`${API_GATEWAY_URL}/notifications/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });

      expect(sendResponse.status).toBe(200);
      const sendResult = await sendResponse.json();
      expect(sendResult.success).toBe(true);

      // Step 3: Get notification history
      const historyResponse = await fetch(`${API_GATEWAY_URL}/notifications/history`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      expect(historyResponse.status).toBe(200);
      const historyResult = await historyResponse.json();
      expect(historyResult.success).toBe(true);
      expect(Array.isArray(historyResult.data)).toBe(true);
    });
  });

  describe('Complete Audit and Compliance Workflow', () => {
    it('should complete full audit workflow', async () => {
      // Step 1: Create audit record
      const auditData = {
        type: 'safety_inspection',
        title: 'E2E Test Safety Inspection',
        description: 'Comprehensive safety inspection for E2E testing',
        department: 'Testing',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        inspector: 'E2E Test Inspector'
      };

      const createResponse = await fetch(`${API_GATEWAY_URL}/audits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(auditData)
      });

      expect(createResponse.status).toBe(201);
      const createResult = await createResponse.json();
      expect(createResult.success).toBe(true);
      const auditId = createResult.data.id;

      // Step 2: Complete audit
      const completionData = {
        status: 'completed',
        findings: [
          {
            category: 'safety',
            description: 'All safety procedures followed correctly',
            severity: 'low',
            actionRequired: false
          }
        ],
        score: 95,
        notes: 'E2E test audit completed successfully'
      };

      const completeResponse = await fetch(`${API_GATEWAY_URL}/audits/${auditId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(completionData)
      });

      expect(completeResponse.status).toBe(200);
      const completeResult = await completeResponse.json();
      expect(completeResult.success).toBe(true);

      // Step 3: Generate compliance report
      const reportData = {
        type: 'compliance_summary',
        period: 'monthly',
        departments: ['Testing'],
        includeAudits: true
      };

      const reportResponse = await fetch(`${API_GATEWAY_URL}/reports/compliance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });

      expect(reportResponse.status).toBe(200);
      const reportResult = await reportResponse.json();
      expect(reportResult.success).toBe(true);
      expect(reportResult.data).toHaveProperty('complianceScore');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle service failures gracefully', async () => {
      // Test with invalid service endpoint
      const response = await fetch(`${API_GATEWAY_URL}/invalid-service/endpoint`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result.error).toBeDefined();
    });

    it('should handle authentication failures', async () => {
      const response = await fetch(`${API_GATEWAY_URL}/instructions`, {
        headers: {
          'Authorization': 'Bearer invalid_token'
        }
      });

      expect(response.status).toBe(401);
    });

    it('should handle rate limiting', async () => {
      const requests = Array(20).fill(null).map(() =>
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

  describe('Performance and Load Testing', () => {
    it('should handle concurrent user operations', async () => {
      const concurrentRequests = Array(10).fill(null).map(() =>
        fetch(`${API_GATEWAY_URL}/instructions`, {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        })
      );

      const responses = await Promise.all(concurrentRequests);
      const successfulResponses = responses.filter(r => r.status === 200);
      
      expect(successfulResponses.length).toBe(10);
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      
      const requests = Array(50).fill(null).map(() =>
        fetch(`${API_GATEWAY_URL}/gateway/health`)
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBe(50);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across services', async () => {
      // Create instruction
      const instructionData = {
        title: 'Consistency Test Instruction',
        content: 'Test instruction for data consistency',
        category: 'safety',
        priority: 'medium'
      };

      const createResponse = await fetch(`${API_GATEWAY_URL}/instructions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(instructionData)
      });

      const createResult = await createResponse.json();
      const instructionId = createResult.data.id;

      // Verify instruction exists in search
      const searchResponse = await fetch(`${API_GATEWAY_URL}/instructions/search?q=Consistency`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      const searchResult = await searchResponse.json();
      expect(searchResult.data.some((item: any) => item.id === instructionId)).toBe(true);

      // Verify instruction appears in analytics
      const analyticsResponse = await fetch(`${API_GATEWAY_URL}/analytics/instructions`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const analyticsResult = await analyticsResponse.json();
      expect(analyticsResult.success).toBe(true);
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (createdInstructionId) {
      await fetch(`${API_GATEWAY_URL}/instructions/${createdInstructionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
    }

    if (createdReportId) {
      await fetch(`${API_GATEWAY_URL}/analytics/reports/${createdReportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
    }
  });
});
