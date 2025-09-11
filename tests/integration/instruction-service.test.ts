import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

const INSTRUCTION_SERVICE_URL = 'http://localhost:8005';
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

const testInstruction = {
  title: 'Yüksekte Çalışma Güvenlik Talimatı',
  content: 'Yüksekte çalışırken mutlaka güvenlik kemeri takılmalı ve güvenlik önlemleri alınmalıdır.',
  category: 'safety',
  priority: 'high',
  tags: ['yükseklik', 'güvenlik', 'çalışma'],
  department: 'İnşaat',
  effectiveDate: new Date().toISOString(),
  reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
};

describe('Instruction Service Integration Tests', () => {
  let authToken: string;
  let adminToken: string;
  let createdInstructionId: string;

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
    it('should return instruction service health status', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/health`);
      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result.status).toBe('healthy');
      expect(result.service).toBe('instruction-service');
    });
  });

  describe('Instruction CRUD Operations', () => {
    it('should create a new instruction', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testInstruction)
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data.title).toBe(testInstruction.title);
      
      createdInstructionId = result.data.id;
    });

    it('should retrieve all instructions', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should retrieve instruction by ID', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/${createdInstructionId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(createdInstructionId);
      expect(result.data.title).toBe(testInstruction.title);
    });

    it('should update an instruction', async () => {
      const updateData = {
        title: 'Güncellenmiş Yüksekte Çalışma Talimatı',
        content: 'Güncellenmiş içerik: Yüksekte çalışırken mutlaka güvenlik kemeri takılmalıdır.',
        priority: 'critical'
      };

      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/${createdInstructionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.title).toBe(updateData.title);
      expect(result.data.priority).toBe(updateData.priority);
    });

    it('should delete an instruction', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/${createdInstructionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
    });
  });

  describe('Instruction Search and Filtering', () => {
    beforeEach(async () => {
      // Create test instructions for search tests
      const instructions = [
        {
          title: 'Elektrik Güvenlik Talimatı',
          content: 'Elektrik işlerinde güvenlik önlemleri',
          category: 'electrical',
          priority: 'high',
          tags: ['elektrik', 'güvenlik']
        },
        {
          title: 'Yangın Güvenlik Talimatı',
          content: 'Yangın durumunda yapılacaklar',
          category: 'fire_safety',
          priority: 'critical',
          tags: ['yangın', 'acil', 'güvenlik']
        },
        {
          title: 'Kişisel Koruyucu Donanım',
          content: 'KPD kullanım talimatları',
          category: 'ppe',
          priority: 'medium',
          tags: ['kpd', 'koruyucu', 'donanım']
        }
      ];

      for (const instruction of instructions) {
        await fetch(`${INSTRUCTION_SERVICE_URL}/instructions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(instruction)
        });
      }
    });

    it('should search instructions by title', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/search?q=elektrik`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].title).toContain('Elektrik');
    });

    it('should filter instructions by category', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions?category=electrical`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.every((instruction: any) => instruction.category === 'electrical')).toBe(true);
    });

    it('should filter instructions by priority', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions?priority=critical`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.every((instruction: any) => instruction.priority === 'critical')).toBe(true);
    });

    it('should filter instructions by tags', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions?tags=güvenlik`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should combine multiple filters', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions?category=fire_safety&priority=critical`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.every((instruction: any) => 
        instruction.category === 'fire_safety' && instruction.priority === 'critical'
      )).toBe(true);
    });
  });

  describe('Instruction Categories', () => {
    it('should retrieve all categories', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/categories`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should create a new category', async () => {
      const categoryData = {
        name: 'test_category',
        displayName: 'Test Category',
        description: 'Test category for integration testing',
        color: '#FF5733'
      };

      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(categoryData.name);
    });
  });

  describe('Instruction Templates', () => {
    it('should retrieve instruction templates', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/templates`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should create instruction from template', async () => {
      const templateData = {
        templateId: 'safety_template_1',
        customizations: {
          title: 'Özelleştirilmiş Güvenlik Talimatı',
          department: 'Test Departmanı'
        }
      };

      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/from-template`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.title).toBe(templateData.customizations.title);
    });
  });

  describe('Instruction Approval Workflow', () => {
    let instructionId: string;

    beforeEach(async () => {
      // Create instruction for approval tests
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...testInstruction,
          status: 'draft'
        })
      });

      const result = await response.json();
      instructionId = result.data.id;
    });

    it('should submit instruction for approval', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/${instructionId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('pending_approval');
    });

    it('should approve instruction', async () => {
      // First submit for approval
      await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/${instructionId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Then approve
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/${instructionId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('approved');
    });

    it('should reject instruction', async () => {
      // First submit for approval
      await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/${instructionId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Then reject
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/${instructionId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'Content needs improvement'
        })
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('rejected');
    });
  });

  describe('Instruction Versioning', () => {
    let instructionId: string;

    beforeEach(async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testInstruction)
      });

      const result = await response.json();
      instructionId = result.data.id;
    });

    it('should create new version of instruction', async () => {
      const versionData = {
        content: 'Updated content for version 2',
        changeReason: 'Updated safety requirements'
      };

      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/${instructionId}/versions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(versionData)
      });

      expect(response.status).toBe(201);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.version).toBe(2);
    });

    it('should retrieve instruction versions', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/${instructionId}/versions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for instruction operations', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions`);
      expect(response.status).toBe(401);
    });

    it('should allow only admins to manage categories', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'test_category',
          displayName: 'Test Category'
        })
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid instruction data', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: '', // Empty title
          content: 'Test content'
        })
      });

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.success).toBe(false);
    });

    it('should handle non-existent instruction', async () => {
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions/non-existent-id`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Performance', () => {
    it('should handle large number of instructions', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${INSTRUCTION_SERVICE_URL}/instructions?limit=100`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    });
  });
});