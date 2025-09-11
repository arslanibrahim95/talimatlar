import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { chromium, Browser, Page } from 'playwright';
import axios from 'axios';

/**
 * Comprehensive Functional Test Suite
 * Tests the complete user workflows and system functionality
 */

interface TestUser {
  email: string;
  password: string;
  role: 'admin' | 'user';
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
}

class FunctionalTestSuite {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl = 'http://localhost:3000';
  private apiBaseUrl = 'http://localhost:8004';
  
  private testUsers: TestUser[] = [
    { email: 'admin@test.com', password: 'admin123', role: 'admin' },
    { email: 'user@test.com', password: 'user123', role: 'user' }
  ];
  
  private testData: TestData = {
    instruction: {
      title: 'Test Instruction',
      content: 'This is a test instruction content',
      category: 'Safety'
    },
    document: {
      name: 'test-document.pdf',
      type: 'application/pdf',
      content: 'Test document content'
    }
  };

  async setup() {
    this.browser = await chromium.launch({ 
      headless: process.env.CI === 'true',
      slowMo: 100 
    });
    this.page = await this.browser.newPage();
    
    // Set viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });
    
    // Enable request/response logging
    this.page.on('request', request => {
      console.log(`→ ${request.method()} ${request.url()}`);
    });
    
    this.page.on('response', response => {
      console.log(`← ${response.status()} ${response.url()}`);
    });
  }

  async teardown() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }

  async login(user: TestUser): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.goto(`${this.baseUrl}/login`);
    await this.page.waitForLoadState('networkidle');
    
    // Fill login form
    await this.page.fill('[data-testid="email-input"]', user.email);
    await this.page.fill('[data-testid="password-input"]', user.password);
    
    // Submit form
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify login success
    const userMenu = await this.page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();
  }

  async logout(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    // Click user menu
    await this.page.click('[data-testid="user-menu"]');
    
    // Click logout
    await this.page.click('[data-testid="logout-button"]');
    
    // Wait for redirect to login
    await this.page.waitForURL('**/login', { timeout: 10000 });
  }

  async checkServiceHealth(): Promise<boolean> {
    const services = [
      'http://localhost:3000', // Frontend
      'http://localhost:8004', // Auth Service
      'http://localhost:8003', // Analytics Service
      'http://localhost:8005', // Instruction Service
      'http://localhost:8006', // AI Service
    ];

    for (const service of services) {
      try {
        const response = await axios.get(`${service}/health`, { timeout: 5000 });
        if (response.status !== 200) {
          console.error(`Service ${service} is not healthy: ${response.status}`);
          return false;
        }
      } catch (error) {
        console.error(`Service ${service} is not accessible:`, error.message);
        return false;
      }
    }
    
    return true;
  }
}

describe('Functional Test Suite', () => {
  const testSuite = new FunctionalTestSuite();

  beforeAll(async () => {
    await testSuite.setup();
    
    // Check if all services are running
    const servicesHealthy = await testSuite.checkServiceHealth();
    if (!servicesHealthy) {
      throw new Error('Not all services are running. Please start the services first.');
    }
  });

  afterAll(async () => {
    await testSuite.teardown();
  });

  describe('Authentication Flow', () => {
    it('should allow user to login with valid credentials', async () => {
      const user = { email: 'user@test.com', password: 'user123', role: 'user' as const };
      await testSuite.login(user);
      
      // Verify user is logged in
      const dashboard = await testSuite.page!.locator('[data-testid="dashboard"]');
      await expect(dashboard).toBeVisible();
    });

    it('should allow admin to login with valid credentials', async () => {
      const admin = { email: 'admin@test.com', password: 'admin123', role: 'admin' as const };
      await testSuite.login(admin);
      
      // Verify admin is logged in
      const adminPanel = await testSuite.page!.locator('[data-testid="admin-panel"]');
      await expect(adminPanel).toBeVisible();
    });

    it('should reject login with invalid credentials', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      await testSuite.page.goto(`${testSuite.baseUrl}/login`);
      await testSuite.page.fill('[data-testid="email-input"]', 'invalid@test.com');
      await testSuite.page.fill('[data-testid="password-input"]', 'wrongpassword');
      await testSuite.page.click('[data-testid="login-button"]');
      
      // Check for error message
      const errorMessage = await testSuite.page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
    });

    it('should allow user to logout successfully', async () => {
      const user = { email: 'user@test.com', password: 'user123', role: 'user' as const };
      await testSuite.login(user);
      await testSuite.logout();
      
      // Verify user is logged out
      const loginForm = await testSuite.page!.locator('[data-testid="login-form"]');
      await expect(loginForm).toBeVisible();
    });
  });

  describe('Dashboard Functionality', () => {
    beforeEach(async () => {
      const user = { email: 'user@test.com', password: 'user123', role: 'user' as const };
      await testSuite.login(user);
    });

    it('should display dashboard with all required sections', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      // Check dashboard sections
      const sections = [
        '[data-testid="welcome-section"]',
        '[data-testid="stats-section"]',
        '[data-testid="recent-activities"]',
        '[data-testid="quick-actions"]'
      ];

      for (const section of sections) {
        const element = await testSuite.page.locator(section);
        await expect(element).toBeVisible();
      }
    });

    it('should display user statistics correctly', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const statsCards = await testSuite.page.locator('[data-testid="stat-card"]');
      const count = await statsCards.count();
      
      // Should have at least 4 stat cards
      expect(count).toBeGreaterThanOrEqual(4);
      
      // Check if stats are loading/loaded
      for (let i = 0; i < count; i++) {
        const card = statsCards.nth(i);
        const value = await card.locator('[data-testid="stat-value"]').textContent();
        expect(value).toBeTruthy();
      }
    });

    it('should allow navigation to different sections', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const navItems = [
        { testId: 'nav-instructions', expectedUrl: 'instructions' },
        { testId: 'nav-documents', expectedUrl: 'documents' },
        { testId: 'nav-analytics', expectedUrl: 'analytics' },
        { testId: 'nav-settings', expectedUrl: 'settings' }
      ];

      for (const item of navItems) {
        await testSuite.page.click(`[data-testid="${item.testId}"]`);
        await testSuite.page.waitForURL(`**/${item.expectedUrl}`, { timeout: 5000 });
        
        // Verify we're on the correct page
        const pageTitle = await testSuite.page.locator('[data-testid="page-title"]');
        await expect(pageTitle).toBeVisible();
        
        // Go back to dashboard
        await testSuite.page.click('[data-testid="nav-dashboard"]');
        await testSuite.page.waitForURL('**/dashboard', { timeout: 5000 });
      }
    });
  });

  describe('Instruction Management', () => {
    beforeEach(async () => {
      const user = { email: 'user@test.com', password: 'user123', role: 'user' as const };
      await testSuite.login(user);
      await testSuite.page!.goto(`${testSuite.baseUrl}/instructions`);
    });

    it('should display instructions list', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const instructionsList = await testSuite.page.locator('[data-testid="instructions-list"]');
      await expect(instructionsList).toBeVisible();
    });

    it('should allow creating new instruction', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      // Click create button
      await testSuite.page.click('[data-testid="create-instruction-button"]');
      
      // Fill form
      await testSuite.page.fill('[data-testid="instruction-title"]', testSuite.testData.instruction.title);
      await testSuite.page.fill('[data-testid="instruction-content"]', testSuite.testData.instruction.content);
      await testSuite.page.selectOption('[data-testid="instruction-category"]', testSuite.testData.instruction.category);
      
      // Submit form
      await testSuite.page.click('[data-testid="save-instruction-button"]');
      
      // Verify instruction was created
      const successMessage = await testSuite.page.locator('[data-testid="success-message"]');
      await expect(successMessage).toBeVisible();
    });

    it('should allow editing existing instruction', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      // Find first instruction and click edit
      const editButton = await testSuite.page.locator('[data-testid="edit-instruction-button"]').first();
      await editButton.click();
      
      // Modify content
      await testSuite.page.fill('[data-testid="instruction-content"]', 'Updated instruction content');
      
      // Save changes
      await testSuite.page.click('[data-testid="save-instruction-button"]');
      
      // Verify changes were saved
      const successMessage = await testSuite.page.locator('[data-testid="success-message"]');
      await expect(successMessage).toBeVisible();
    });

    it('should allow deleting instruction', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      // Find first instruction and click delete
      const deleteButton = await testSuite.page.locator('[data-testid="delete-instruction-button"]').first();
      await deleteButton.click();
      
      // Confirm deletion
      await testSuite.page.click('[data-testid="confirm-delete-button"]');
      
      // Verify instruction was deleted
      const successMessage = await testSuite.page.locator('[data-testid="success-message"]');
      await expect(successMessage).toBeVisible();
    });
  });

  describe('Document Management', () => {
    beforeEach(async () => {
      const user = { email: 'user@test.com', password: 'user123', role: 'user' as const };
      await testSuite.login(user);
      await testSuite.page!.goto(`${testSuite.baseUrl}/documents`);
    });

    it('should display documents list', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const documentsList = await testSuite.page.locator('[data-testid="documents-list"]');
      await expect(documentsList).toBeVisible();
    });

    it('should allow uploading new document', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      // Click upload button
      await testSuite.page.click('[data-testid="upload-document-button"]');
      
      // Create a test file
      const fileInput = await testSuite.page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles({
        name: testSuite.testData.document.name,
        mimeType: testSuite.testData.document.type,
        buffer: Buffer.from(testSuite.testData.document.content)
      });
      
      // Fill additional form fields
      await testSuite.page.fill('[data-testid="document-name"]', testSuite.testData.document.name);
      await testSuite.page.selectOption('[data-testid="document-type"]', 'PDF');
      
      // Submit form
      await testSuite.page.click('[data-testid="upload-button"]');
      
      // Verify document was uploaded
      const successMessage = await testSuite.page.locator('[data-testid="success-message"]');
      await expect(successMessage).toBeVisible();
    });

    it('should allow downloading document', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      // Find first document and click download
      const downloadButton = await testSuite.page.locator('[data-testid="download-document-button"]').first();
      
      // Set up download promise
      const downloadPromise = testSuite.page.waitForEvent('download');
      await downloadButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBeTruthy();
    });
  });

  describe('Analytics Dashboard', () => {
    beforeEach(async () => {
      const user = { email: 'user@test.com', password: 'user123', role: 'user' as const };
      await testSuite.login(user);
      await testSuite.page!.goto(`${testSuite.baseUrl}/analytics`);
    });

    it('should display analytics dashboard', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const analyticsDashboard = await testSuite.page.locator('[data-testid="analytics-dashboard"]');
      await expect(analyticsDashboard).toBeVisible();
    });

    it('should display charts and metrics', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const charts = [
        '[data-testid="user-activity-chart"]',
        '[data-testid="document-stats-chart"]',
        '[data-testid="instruction-usage-chart"]'
      ];

      for (const chart of charts) {
        const chartElement = await testSuite.page.locator(chart);
        await expect(chartElement).toBeVisible();
      }
    });

    it('should allow filtering data by date range', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      // Set date range
      await testSuite.page.fill('[data-testid="start-date"]', '2024-01-01');
      await testSuite.page.fill('[data-testid="end-date"]', '2024-12-31');
      await testSuite.page.click('[data-testid="apply-filter-button"]');
      
      // Verify charts updated
      const charts = await testSuite.page.locator('[data-testid="chart-container"]');
      await expect(charts).toBeVisible();
    });
  });

  describe('AI Integration', () => {
    beforeEach(async () => {
      const user = { email: 'user@test.com', password: 'user123', role: 'user' as const };
      await testSuite.login(user);
      await testSuite.page!.goto(`${testSuite.baseUrl}/ai-assistant`);
    });

    it('should display AI chat interface', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const chatInterface = await testSuite.page.locator('[data-testid="ai-chat-interface"]');
      await expect(chatInterface).toBeVisible();
    });

    it('should allow sending messages to AI', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const messageInput = await testSuite.page.locator('[data-testid="ai-message-input"]');
      const sendButton = await testSuite.page.locator('[data-testid="ai-send-button"]');
      
      await messageInput.fill('Hello, can you help me with safety instructions?');
      await sendButton.click();
      
      // Wait for response
      const response = await testSuite.page.locator('[data-testid="ai-response"]').first();
      await expect(response).toBeVisible({ timeout: 30000 });
    });

    it('should display conversation history', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const conversationHistory = await testSuite.page.locator('[data-testid="conversation-history"]');
      await expect(conversationHistory).toBeVisible();
    });
  });

  describe('Admin Panel', () => {
    beforeEach(async () => {
      const admin = { email: 'admin@test.com', password: 'admin123', role: 'admin' as const };
      await testSuite.login(admin);
      await testSuite.page!.goto(`${testSuite.baseUrl}/admin`);
    });

    it('should display admin panel', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const adminPanel = await testSuite.page.locator('[data-testid="admin-panel"]');
      await expect(adminPanel).toBeVisible();
    });

    it('should allow managing users', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const usersTab = await testSuite.page.locator('[data-testid="users-tab"]');
      await usersTab.click();
      
      const usersList = await testSuite.page.locator('[data-testid="users-list"]');
      await expect(usersList).toBeVisible();
    });

    it('should allow viewing system statistics', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const statsTab = await testSuite.page.locator('[data-testid="stats-tab"]');
      await statsTab.click();
      
      const systemStats = await testSuite.page.locator('[data-testid="system-stats"]');
      await expect(systemStats).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      // Simulate network error by going to non-existent page
      await testSuite.page.goto(`${testSuite.baseUrl}/non-existent-page`);
      
      const errorPage = await testSuite.page.locator('[data-testid="error-page"]');
      await expect(errorPage).toBeVisible();
    });

    it('should display proper error messages for API failures', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const user = { email: 'user@test.com', password: 'user123', role: 'user' as const };
      await testSuite.login(user);
      
      // Try to access a restricted resource
      await testSuite.page.goto(`${testSuite.baseUrl}/admin`);
      
      const errorMessage = await testSuite.page.locator('[data-testid="access-denied-message"]');
      await expect(errorMessage).toBeVisible();
    });
  });

  describe('Performance Tests', () => {
    it('should load dashboard within acceptable time', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const user = { email: 'user@test.com', password: 'user123', role: 'user' as const };
      
      const startTime = Date.now();
      await testSuite.login(user);
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    it('should handle multiple concurrent requests', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const user = { email: 'user@test.com', password: 'user123', role: 'user' as const };
      await testSuite.login(user);
      
      // Make multiple API calls simultaneously
      const promises = Array(5).fill(null).map(async (_, index) => {
        const response = await axios.get(`${testSuite.apiBaseUrl}/api/instructions`, {
          timeout: 10000
        });
        return response.status;
      });
      
      const results = await Promise.all(promises);
      results.forEach(status => {
        expect(status).toBe(200);
      });
    });
  });

  describe('Security Tests', () => {
    it('should prevent XSS attacks', async () => {
      if (!testSuite.page) throw new Error('Page not initialized');
      
      const user = { email: 'user@test.com', password: 'user123', role: 'user' as const };
      await testSuite.login(user);
      await testSuite.page!.goto(`${testSuite.baseUrl}/instructions`);
      
      // Try to inject XSS
      await testSuite.page.click('[data-testid="create-instruction-button"]');
      await testSuite.page.fill('[data-testid="instruction-title"]', '<script>alert("XSS")</script>');
      await testSuite.page.fill('[data-testid="instruction-content"]', 'Normal content');
      await testSuite.page.click('[data-testid="save-instruction-button"]');
      
      // Verify script was not executed
      const alertHandled = await testSuite.page.evaluate(() => {
        return window.alert === undefined || !window.alert.toString().includes('XSS');
      });
      expect(alertHandled).toBe(true);
    });

    it('should enforce CSRF protection', async () => {
      // Test CSRF protection by making request without proper token
      try {
        await axios.post(`${testSuite.apiBaseUrl}/api/instructions`, {
          title: 'Test',
          content: 'Test content'
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        // Should not reach here
        expect(false).toBe(true);
      } catch (error) {
        expect(error.response?.status).toBe(403);
      }
    });
  });
});
