import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

const AI_SERVICE_URL = 'http://localhost:8006';
const AUTH_SERVICE_URL = 'http://localhost:8004';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

const testAdmin = {
  email: 'admin@example.com',
  password: 'admin123'
};

describe('AI Service Integration Tests', () => {
  let authToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Get authentication tokens
    const userLoginResponse = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const adminLoginResponse = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testAdmin)
    });

    const userResult = await userLoginResponse.json();
    const adminResult = await adminLoginResponse.json();

    authToken = userResult.token;
    adminToken = adminResult.token;
  });

  describe('Health Check', () => {
    it('should return AI service health status', async () => {
      const response = await fetch(`${AI_SERVICE_URL}/health`);
      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result.status).toBe('healthy');
      expect(result.service).toBe('ai-service');
    });
  });

  describe('Text Generation', () => {
    it('should generate safety instruction text', async () => {
      const requestData = {
        prompt: 'Generate a safety instruction for working at heights',
        context: 'construction',
        type: 'instruction',
        parameters: {
          length: 'medium',
          tone: 'professional',
          language: 'tr'
        }
      };

      const response = await fetch(`${AI_SERVICE_URL}/ai/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('text');
      expect(result.data.text).toContain('yükseklik');
    });

    it('should generate document summary', async () => {
      const requestData = {
        prompt: 'Summarize this safety document',
        context: 'document_analysis',
        type: 'summary',
        content: 'Bu güvenlik talimatı yüksekte çalışma prosedürlerini açıklamaktadır...'
      };

      const response = await fetch(`${AI_SERVICE_URL}/ai/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('summary');
    });

    it('should generate risk assessment', async () => {
      const requestData = {
        prompt: 'Assess the risk level for this activity',
        context: 'risk_assessment',
        type: 'assessment',
        activity: 'Yüksekte çalışma',
        environment: 'İnşaat sahası',
        equipment: 'İskele, güvenlik kemeri'
      };

      const response = await fetch(`${AI_SERVICE_URL}/ai/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('riskLevel');
      expect(result.data).toHaveProperty('recommendations');
    });
  });

  describe('Document Analysis', () => {
    it('should analyze safety document content', async () => {
      const documentData = {
        content: 'Güvenlik talimatı: Yüksekte çalışırken mutlaka güvenlik kemeri takılmalıdır.',
        type: 'safety_instruction',
        language: 'tr'
      };

      const response = await fetch(`${AI_SERVICE_URL}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(documentData)
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('analysis');
      expect(result.data).toHaveProperty('keywords');
      expect(result.data).toHaveProperty('complianceScore');
    });

    it('should extract key information from documents', async () => {
      const documentData = {
        content: 'İş güvenliği talimatı: 1. Kişisel koruyucu donanım kullanın 2. Güvenlik prosedürlerini takip edin',
        type: 'extraction',
        fields: ['steps', 'requirements', 'warnings']
      };

      const response = await fetch(`${AI_SERVICE_URL}/ai/extract`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(documentData)
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('extractedData');
    });
  });

  describe('Translation Services', () => {
    it('should translate safety content between languages', async () => {
      const translationData = {
        text: 'Always wear safety equipment when working at heights',
        sourceLanguage: 'en',
        targetLanguage: 'tr',
        context: 'safety'
      };

      const response = await fetch(`${AI_SERVICE_URL}/ai/translate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(translationData)
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('translatedText');
      expect(result.data.translatedText).toContain('güvenlik');
    });
  });

  describe('Question Answering', () => {
    it('should answer safety-related questions', async () => {
      const questionData = {
        question: 'Yüksekte çalışırken hangi güvenlik önlemleri alınmalıdır?',
        context: 'safety_procedures',
        language: 'tr'
      };

      const response = await fetch(`${AI_SERVICE_URL}/ai/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('answer');
      expect(result.data).toHaveProperty('confidence');
    });
  });

  describe('Content Classification', () => {
    it('should classify safety content by category', async () => {
      const classificationData = {
        content: 'Bu talimat yüksekte çalışma güvenliği hakkındadır',
        categories: ['safety', 'equipment', 'procedures', 'emergency']
      };

      const response = await fetch(`${AI_SERVICE_URL}/ai/classify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(classificationData)
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('category');
      expect(result.data).toHaveProperty('confidence');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for AI requests', async () => {
      const response = await fetch(`${AI_SERVICE_URL}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Test prompt',
          type: 'instruction'
        })
      });

      expect(response.status).toBe(401);
    });

    it('should validate user permissions for AI features', async () => {
      const response = await fetch(`${AI_SERVICE_URL}/ai/admin/usage-stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(403);
    });

    it('should allow admin access to usage statistics', async () => {
      const response = await fetch(`${AI_SERVICE_URL}/ai/admin/usage-stats`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('totalRequests');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on AI requests', async () => {
      const requests = Array(20).fill(null).map(() =>
        fetch(`${AI_SERVICE_URL}/ai/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: 'Test prompt',
            type: 'instruction'
          })
        })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid prompt format', async () => {
      const response = await fetch(`${AI_SERVICE_URL}/ai/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: '', // Empty prompt
          type: 'instruction'
        })
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('prompt');
    });

    it('should handle unsupported content types', async () => {
      const response = await fetch(`${AI_SERVICE_URL}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: 'Test content',
          type: 'unsupported_type'
        })
      });

      expect(response.status).toBe(400);
    });

    it('should handle AI service errors gracefully', async () => {
      const response = await fetch(`${AI_SERVICE_URL}/ai/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'Test prompt',
          type: 'instruction',
          parameters: {
            maxTokens: -1 // Invalid parameter
          }
        })
      });

      expect(response.status).toBe(500);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${AI_SERVICE_URL}/ai/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'Generate a short safety instruction',
          type: 'instruction'
        })
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(10000); // 10 seconds max
    });
  });

  describe('Caching', () => {
    it('should cache similar requests', async () => {
      const requestData = {
        prompt: 'Generate safety instruction for working at heights',
        type: 'instruction'
      };

      // First request
      const response1 = await fetch(`${AI_SERVICE_URL}/ai/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      expect(response1.status).toBe(200);

      // Second identical request should be faster (cached)
      const startTime = Date.now();
      const response2 = await fetch(`${AI_SERVICE_URL}/ai/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      const endTime = Date.now();

      expect(response2.status).toBe(200);
      // Cached response should be faster
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
