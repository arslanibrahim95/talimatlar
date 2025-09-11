#!/usr/bin/env node

/**
 * Claude Talimat Test Data Generator
 * Mock veriler ile test etme imkanı sağlar
 */

import fs from 'fs';
import path from 'path';

// Test verileri
const mockData = {
  users: [
    {
      id: 'test-user-1',
      email: 'test1@example.com',
      username: 'testuser1',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User 1',
      phone: '+90 555 111 11 11',
      role: 'admin',
      companyId: 'test-company-1',
      isVerified: true,
      isActive: true
    },
    {
      id: 'test-user-2',
      email: 'test2@example.com',
      username: 'testuser2',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User 2',
      phone: '+90 555 222 22 22',
      role: 'manager',
      companyId: 'test-company-1',
      isVerified: true,
      isActive: true
    },
    {
      id: 'test-user-3',
      email: 'test3@example.com',
      username: 'testuser3',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User 3',
      phone: '+90 555 333 33 33',
      role: 'user',
      companyId: 'test-company-1',
      isVerified: true,
      isActive: true
    }
  ],
  
  companies: [
    {
      id: 'test-company-1',
      name: 'Test Şirketi A.Ş.',
      taxNumber: '1234567890',
      address: 'Test Adresi, İstanbul',
      phone: '+90 212 123 45 67',
      email: 'info@testcompany.com',
      contactPerson: 'Test Kişi',
      subscriptionPlan: 'premium'
    },
    {
      id: 'test-company-2',
      name: 'Test Şirketi Ltd.',
      taxNumber: '0987654321',
      address: 'Test Adresi 2, Ankara',
      phone: '+90 312 987 65 43',
      email: 'info@testcompany2.com',
      contactPerson: 'Test Kişi 2',
      subscriptionPlan: 'standard'
    }
  ],
  
  documents: [
    {
      id: 'test-doc-1',
      title: 'Test Güvenlik Prosedürü',
      description: 'Test güvenlik prosedürü açıklaması',
      filePath: '/test/documents/guvenlik-proseduru.pdf',
      fileSize: 1024000,
      fileType: 'application/pdf',
      categoryId: 'test-category-1',
      companyId: 'test-company-1',
      uploadedBy: 'test-user-1',
      status: 'active',
      tags: ['güvenlik', 'prosedür', 'test'],
      metadata: {
        version: '1.0',
        author: 'Test Yazar',
        reviewDate: '2025-12-01'
      }
    },
    {
      id: 'test-doc-2',
      title: 'Test Kalite Kontrol',
      description: 'Test kalite kontrol dokümanı',
      filePath: '/test/documents/kalite-kontrol.docx',
      fileSize: 512000,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      categoryId: 'test-category-2',
      companyId: 'test-company-1',
      uploadedBy: 'test-user-2',
      status: 'active',
      tags: ['kalite', 'kontrol', 'test'],
      metadata: {
        version: '2.0',
        author: 'Test Yazar 2',
        reviewDate: '2025-11-15'
      }
    }
  ],
  
  categories: [
    {
      id: 'test-category-1',
      name: 'Güvenlik Prosedürleri',
      description: 'İş güvenliği prosedürleri',
      companyId: 'test-company-1'
    },
    {
      id: 'test-category-2',
      name: 'Kalite Kontrol',
      description: 'Kalite kontrol süreçleri',
      companyId: 'test-company-1'
    }
  ],
  
  notifications: [
    {
      id: 'test-notification-1',
      userId: 'test-user-1',
      companyId: 'test-company-1',
      title: 'Test Bildirimi',
      message: 'Bu bir test bildirimidir',
      type: 'info',
      status: 'unread',
      metadata: {
        testData: true
      }
    }
  ],
  
  analytics: {
    events: [
      {
        id: 'test-event-1',
        eventType: 'login',
        userId: 'test-user-1',
        companyId: 'test-company-1',
        metadata: {
          page: '/dashboard',
          duration: 120,
          device: 'desktop'
        }
      },
      {
        id: 'test-event-2',
        eventType: 'document_view',
        userId: 'test-user-1',
        companyId: 'test-company-1',
        metadata: {
          documentId: 'test-doc-1',
          duration: 300,
          device: 'desktop'
        }
      }
    ],
    
    userActivity: [
      {
        id: 'test-activity-1',
        userId: 'test-user-1',
        companyId: 'test-company-1',
        date: new Date().toISOString().split('T')[0],
        loginCount: 3,
        documentViews: 15,
        documentDownloads: 5,
        searchCount: 8,
        uploadCount: 2
      }
    ],
    
    companyMetrics: [
      {
        id: 'test-metrics-1',
        companyId: 'test-company-1',
        date: new Date().toISOString().split('T')[0],
        totalUsers: 10,
        activeUsers: 8,
        totalDocuments: 25,
        totalDownloads: 150,
        totalUploads: 5
      }
    ]
  }
};

// API Mock Responses
const apiResponses = {
  auth: {
    login: {
      success: {
        access_token: 'mock-jwt-token-123',
        refresh_token: 'mock-refresh-token-123',
        user: mockData.users[0],
        expires_in: 3600
      },
      error: {
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      }
    },
    
    register: {
      success: {
        message: 'User registered successfully',
        user: mockData.users[0]
      },
      error: {
        error: 'Registration failed',
        message: 'Email already exists'
      }
    },
    
    me: {
      success: mockData.users[0]
    }
  },
  
  documents: {
    list: {
      success: {
        documents: mockData.documents,
        total: mockData.documents.length,
        page: 1,
        limit: 10
      }
    },
    
    get: {
      success: mockData.documents[0]
    },
    
    upload: {
      success: {
        message: 'Document uploaded successfully',
        document: mockData.documents[0]
      }
    }
  },
  
  analytics: {
    dashboard: {
      success: {
        totalUsers: 10,
        activeUsers: 8,
        totalDocuments: 25,
        totalDownloads: 150,
        recentActivity: mockData.analytics.events,
        userActivity: mockData.analytics.userActivity[0],
        companyMetrics: mockData.analytics.companyMetrics[0]
      }
    }
  },
  
  notifications: {
    list: {
      success: {
        notifications: mockData.notifications,
        total: mockData.notifications.length
      }
    }
  }
};

// Test Scenarios
const testScenarios = {
  userRegistration: {
    name: 'Kullanıcı Kaydı Testi',
    steps: [
      'POST /api/auth/register - Yeni kullanıcı kaydı',
      'POST /api/auth/login - Giriş yapma',
      'GET /api/auth/me - Kullanıcı bilgilerini alma'
    ],
    expectedResults: [
      'Kayıt başarılı',
      'Giriş başarılı',
      'Kullanıcı bilgileri doğru'
    ]
  },
  
  documentManagement: {
    name: 'Doküman Yönetimi Testi',
    steps: [
      'GET /api/documents - Doküman listesi',
      'POST /api/documents/upload - Doküman yükleme',
      'GET /api/documents/:id - Doküman detayı',
      'PUT /api/documents/:id - Doküman güncelleme',
      'DELETE /api/documents/:id - Doküman silme'
    ],
    expectedResults: [
      'Doküman listesi başarılı',
      'Yükleme başarılı',
      'Detay alma başarılı',
      'Güncelleme başarılı',
      'Silme başarılı'
    ]
  },
  
  analytics: {
    name: 'Analytics Testi',
    steps: [
      'GET /api/analytics/dashboard - Dashboard verileri',
      'GET /api/analytics/events - Event listesi',
      'GET /api/analytics/user-activity - Kullanıcı aktivitesi',
      'GET /api/analytics/company-metrics - Şirket metrikleri'
    ],
    expectedResults: [
      'Dashboard verileri başarılı',
      'Event listesi başarılı',
      'Kullanıcı aktivitesi başarılı',
      'Şirket metrikleri başarılı'
    ]
  }
};

// Mock API Server
class MockAPIServer {
  constructor(port = 3001) {
    this.port = port;
    this.responses = apiResponses;
  }
  
  // Mock response generator
  generateResponse(endpoint, method = 'GET', data = null) {
    const path = endpoint.replace(/^\//, '').replace(/\//g, '.');
    const responseKey = `${method.toLowerCase()}.${path}`;
    
    // Find matching response
    let response = this.findResponse(responseKey);
    if (!response) {
      response = this.findResponse(path);
    }
    if (!response) {
      response = { error: 'Endpoint not found', status: 404 };
    }
    
    return {
      ...response,
      timestamp: new Date().toISOString(),
      endpoint,
      method
    };
  }
  
  findResponse(key) {
    const keys = key.split('.');
    let current = this.responses;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }
    
    return current;
  }
  
  // Generate test data
  generateTestData(type, count = 10) {
    const templates = mockData[type] || [];
    const results = [];
    
    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      const item = { ...template };
      
      // Generate unique IDs
      item.id = `${type}-${Date.now()}-${i}`;
      
      // Add random variations
      if (type === 'users') {
        item.email = `test${i}@example.com`;
        item.username = `testuser${i}`;
      }
      
      results.push(item);
    }
    
    return results;
  }
}

// Test Runner
class TestRunner {
  constructor() {
    this.mockServer = new MockAPIServer();
    this.results = [];
  }
  
  async runTest(scenarioName) {
    const scenario = testScenarios[scenarioName];
    if (!scenario) {
      throw new Error(`Test scenario not found: ${scenarioName}`);
    }
    
    console.log(`🧪 Running test: ${scenario.name}`);
    console.log('='.repeat(50));
    
    const results = [];
    
    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i];
      const expected = scenario.expectedResults[i];
      
      console.log(`\n📋 Step ${i + 1}: ${step}`);
      
      try {
        // Simulate API call
        const response = this.mockServer.generateResponse(step.split(' ')[1]);
        
        const success = response.error ? false : true;
        const result = {
          step,
          expected,
          success,
          response: success ? 'Success' : response.error,
          timestamp: new Date().toISOString()
        };
        
        results.push(result);
        
        console.log(`   ${success ? '✅' : '❌'} ${success ? 'PASS' : 'FAIL'}: ${expected}`);
        if (!success) {
          console.log(`   Error: ${response.error}`);
        }
        
      } catch (error) {
        const result = {
          step,
          expected,
          success: false,
          response: error.message,
          timestamp: new Date().toISOString()
        };
        
        results.push(result);
        console.log(`   ❌ ERROR: ${error.message}`);
      }
    }
    
    const passed = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log(`\n📊 Test Results: ${passed}/${total} passed`);
    
    return {
      scenario: scenario.name,
      results,
      summary: { passed, total, failed: total - passed }
    };
  }
  
  async runAllTests() {
    console.log('🚀 Starting all test scenarios...\n');
    
    const scenarios = Object.keys(testScenarios);
    const allResults = [];
    
    for (const scenario of scenarios) {
      const result = await this.runTest(scenario);
      allResults.push(result);
      console.log('\n' + '='.repeat(50) + '\n');
    }
    
    // Summary
    const totalPassed = allResults.reduce((sum, r) => sum + r.summary.passed, 0);
    const totalTests = allResults.reduce((sum, r) => sum + r.summary.total, 0);
    
    console.log('🎯 FINAL SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalTests - totalPassed}`);
    console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    
    return allResults;
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const mockServer = new MockAPIServer();
  const testRunner = new TestRunner();
  
  switch (command) {
    case 'generate-data':
      const type = args[1] || 'users';
      const count = parseInt(args[2]) || 10;
      const data = mockServer.generateTestData(type, count);
      console.log(`Generated ${count} ${type}:`);
      console.log(JSON.stringify(data, null, 2));
      break;
      
    case 'test':
      const scenario = args[1];
      if (scenario) {
        testRunner.runTest(scenario).catch(console.error);
      } else {
        testRunner.runAllTests().catch(console.error);
      }
      break;
      
    case 'mock-response':
      const endpoint = args[1] || '/api/auth/login';
      const method = args[2] || 'GET';
      const response = mockServer.generateResponse(endpoint, method);
      console.log('Mock Response:');
      console.log(JSON.stringify(response, null, 2));
      break;
      
    case 'help':
    default:
      console.log(`
🧪 Claude Talimat Test Data Generator

Usage:
  node test-data-generator.js <command> [options]

Commands:
  generate-data [type] [count]  Generate test data
                                Types: users, companies, documents, categories
                                Default: users, count: 10
  
  test [scenario]               Run test scenarios
                                Scenarios: userRegistration, documentManagement, analytics
                                Default: all scenarios
  
  mock-response [endpoint] [method]  Generate mock API response
                                   Default: /api/auth/login, GET
  
  help                          Show this help message

Examples:
  node test-data-generator.js generate-data users 5
  node test-data-generator.js test userRegistration
  node test-data-generator.js mock-response /api/documents GET
      `);
      break;
  }
}

// Export for use in other modules
// Removed module.exports - using ES module exports above

// Export for ES modules
export { mockData, apiResponses };

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
