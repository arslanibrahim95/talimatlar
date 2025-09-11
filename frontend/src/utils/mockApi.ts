/**
 * Mock API utilities for frontend testing
 * Backend olmadan frontend test etmek için mock API responses
 */

// Mock API base URL
export const MOCK_API_BASE_URL = 'http://localhost:3001';

// Mock data types
export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'user';
  companyId: string;
  isVerified: boolean;
  isActive: boolean;
}

export interface MockDocument {
  id: string;
  title: string;
  description: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  categoryId: string;
  companyId: string;
  uploadedBy: string;
  status: 'active' | 'inactive' | 'draft';
  tags: string[];
  metadata: {
    version: string;
    author: string;
    reviewDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MockCompany {
  id: string;
  name: string;
  taxNumber: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  subscriptionPlan: 'basic' | 'standard' | 'premium';
}

export interface MockNotification {
  id: string;
  userId: string;
  companyId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  status: 'read' | 'unread';
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

// Mock data
export const mockData = {
  users: [
    {
      id: 'test-user-1',
      email: 'test1@example.com',
      firstName: 'Test',
      lastName: 'User 1',
      role: 'admin' as const,
      companyId: 'test-company-1',
      isVerified: true,
      isActive: true
    },
    {
      id: 'test-user-2',
      email: 'test2@example.com',
      firstName: 'Test',
      lastName: 'User 2',
      role: 'manager' as const,
      companyId: 'test-company-1',
      isVerified: true,
      isActive: true
    },
    {
      id: 'test-user-3',
      email: 'test3@example.com',
      firstName: 'Test',
      lastName: 'User 3',
      role: 'user' as const,
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
      subscriptionPlan: 'premium' as const
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
      status: 'active' as const,
      tags: ['güvenlik', 'prosedür', 'test'],
      metadata: {
        version: '1.0',
        author: 'Test Yazar',
        reviewDate: '2025-12-01'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      status: 'active' as const,
      tags: ['kalite', 'kontrol', 'test'],
      metadata: {
        version: '2.0',
        author: 'Test Yazar 2',
        reviewDate: '2025-11-15'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  
  notifications: [
    {
      id: 'test-notification-1',
      userId: 'test-user-1',
      companyId: 'test-company-1',
      title: 'Test Bildirimi',
      message: 'Bu bir test bildirimidir',
      type: 'info' as const,
      status: 'unread' as const,
      metadata: { testData: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

// Mock API functions
export class MockAPI {
  private static baseUrl = MOCK_API_BASE_URL;
  
  // Auth endpoints
  static async login(email: string, password: string) {
    const user = mockData.users.find(u => u.email === email);
    
    if (user && password === 'password123') {
      return {
        access_token: 'mock-jwt-token-' + Date.now(),
        refresh_token: 'mock-refresh-token-' + Date.now(),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId
        },
        expires_in: 3600
      };
    } else {
      throw new Error('Invalid credentials');
    }
  }
  
  static async register(userData: any) {
    const existingUser = mockData.users.find(u => u.email === userData.email);
    
    if (existingUser) {
      throw new Error('Email already exists');
    }
    
    const newUser = {
      id: 'user-' + Date.now(),
      ...userData,
      role: 'user' as const,
      companyId: 'test-company-1',
      isVerified: false,
      isActive: true
    };
    
    mockData.users.push(newUser);
    
    return {
      message: 'User registered successfully',
      user: newUser
    };
  }
  
  static async getCurrentUser() {
    return mockData.users[0];
  }
  
  // Document endpoints
  static async getDocuments(params: any = {}) {
    let documents = [...mockData.documents];
    
    if (params.category) {
      documents = documents.filter(doc => doc.categoryId === params.category);
    }
    
    if (params.search) {
      documents = documents.filter(doc => 
        doc.title.toLowerCase().includes(params.search.toLowerCase()) ||
        doc.description.toLowerCase().includes(params.search.toLowerCase())
      );
    }
    
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      documents: documents.slice(startIndex, endIndex),
      total: documents.length,
      page,
      limit,
      totalPages: Math.ceil(documents.length / limit)
    };
  }
  
  static async getDocument(id: string) {
    const document = mockData.documents.find(doc => doc.id === id);
    if (!document) {
      throw new Error('Document not found');
    }
    return document;
  }
  
  static async uploadDocument(documentData: any) {
    const newDocument = {
      id: 'doc-' + Date.now(),
      ...documentData,
      filePath: '/uploads/' + documentData.title.toLowerCase().replace(/\s+/g, '-') + '.pdf',
      fileSize: Math.floor(Math.random() * 1000000) + 100000,
      fileType: 'application/pdf',
      companyId: 'test-company-1',
      uploadedBy: 'test-user-1',
      status: 'active' as const,
      tags: documentData.tags ? documentData.tags.split(',') : [],
      metadata: {
        version: '1.0',
        author: 'Test User',
        reviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockData.documents.unshift(newDocument);
    
    return {
      message: 'Document uploaded successfully',
      document: newDocument
    };
  }
  
  static async updateDocument(id: string, updates: any) {
    const documentIndex = mockData.documents.findIndex(doc => doc.id === id);
    
    if (documentIndex === -1) {
      throw new Error('Document not found');
    }
    
    mockData.documents[documentIndex] = {
      ...mockData.documents[documentIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return {
      message: 'Document updated successfully',
      document: mockData.documents[documentIndex]
    };
  }
  
  static async deleteDocument(id: string) {
    const documentIndex = mockData.documents.findIndex(doc => doc.id === id);
    
    if (documentIndex === -1) {
      throw new Error('Document not found');
    }
    
    mockData.documents.splice(documentIndex, 1);
    
    return { message: 'Document deleted successfully' };
  }
  
  // Analytics endpoints
  static async getDashboardStats() {
    return {
      totalUsers: mockData.users.length,
      activeUsers: mockData.users.filter(u => u.isActive).length,
      totalDocuments: mockData.documents.length,
      totalDownloads: 150,
      totalUploads: 25,
      recentActivity: [
        {
          id: 'event-1',
          eventType: 'login',
          userId: 'test-user-1',
          companyId: 'test-company-1',
          metadata: {
            page: '/dashboard',
            duration: 120,
            device: 'desktop'
          },
          createdAt: new Date().toISOString()
        }
      ],
      userActivity: {
        id: 'activity-1',
        userId: 'test-user-1',
        companyId: 'test-company-1',
        date: new Date().toISOString().split('T')[0],
        loginCount: 3,
        documentViews: 15,
        documentDownloads: 5,
        searchCount: 8,
        uploadCount: 2
      },
      companyMetrics: {
        id: 'metrics-1',
        companyId: 'test-company-1',
        date: new Date().toISOString().split('T')[0],
        totalUsers: mockData.users.length,
        activeUsers: mockData.users.filter(u => u.isActive).length,
        totalDocuments: mockData.documents.length,
        totalDownloads: 150,
        totalUploads: 5
      },
      chartData: {
        dailyUsers: this.generateChartData(30, 5, 15),
        documentViews: this.generateChartData(30, 10, 50),
        downloads: this.generateChartData(30, 5, 25)
      }
    };
  }
  
  // Notification endpoints
  static async getNotifications(params: any = {}) {
    let notifications = [...mockData.notifications];
    
    if (params.status) {
      notifications = notifications.filter(notif => notif.status === params.status);
    }
    
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      notifications: notifications.slice(startIndex, endIndex),
      total: notifications.length,
      page,
      limit
    };
  }
  
  static async markNotificationAsRead(id: string) {
    const notification = mockData.notifications.find(notif => notif.id === id);
    
    if (notification) {
      notification.status = 'read';
      return { message: 'Notification marked as read' };
    } else {
      throw new Error('Notification not found');
    }
  }
  
  // Utility functions
  private static generateChartData(days: number, min: number, max: number) {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * (max - min + 1)) + min
      });
    }
    return data;
  }
  
  // Health check
  static async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mockData: {
        users: mockData.users.length,
        companies: mockData.companies.length,
        documents: mockData.documents.length,
        notifications: mockData.notifications.length
      }
    };
  }
}

// Mock API interceptor for development
export const mockApiInterceptor = {
  isEnabled: () => {
    return process.env.NODE_ENV === 'development' || 
           localStorage.getItem('use_mock_api') === 'true';
  },
  
  intercept: async (url: string, options: RequestInit = {}) => {
    if (!mockApiInterceptor.isEnabled()) {
      return fetch(url, options);
    }
    
    const mockUrl = url.replace(/^.*\/api\//, '/api/');
    const mockFullUrl = MOCK_API_BASE_URL + mockUrl;
    
    console.log(`🔄 Mock API: ${options.method || 'GET'} ${mockUrl}`);
    
    try {
      const response = await fetch(mockFullUrl, options);
      return response;
    } catch (error) {
      console.error('Mock API error:', error);
      throw error;
    }
  }
};

// Test utilities
export const testUtils = {
  // Create test user
  createTestUser: (overrides: Partial<MockUser> = {}) => {
    const testUser: MockUser = {
      id: 'test-user-' + Date.now(),
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      companyId: 'test-company-1',
      isVerified: true,
      isActive: true,
      ...overrides
    };
    
    mockData.users.push(testUser);
    return testUser;
  },
  
  // Create test document
  createTestDocument: (overrides: Partial<MockDocument> = {}) => {
    const testDocument: MockDocument = {
      id: 'test-doc-' + Date.now(),
      title: 'Test Document',
      description: 'Test document description',
      filePath: '/test/documents/test-document.pdf',
      fileSize: 1024000,
      fileType: 'application/pdf',
      categoryId: 'test-category-1',
      companyId: 'test-company-1',
      uploadedBy: 'test-user-1',
      status: 'active',
      tags: ['test'],
      metadata: {
        version: '1.0',
        author: 'Test Author',
        reviewDate: '2025-12-01'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
    
    mockData.documents.push(testDocument);
    return testDocument;
  },
  
  // Clear all mock data
  clearMockData: () => {
    mockData.users.length = 0;
    mockData.documents.length = 0;
    mockData.notifications.length = 0;
  },
  
  // Reset to default mock data
  resetMockData: () => {
    testUtils.clearMockData();
    // Re-add default data
    mockData.users.push(...[
      {
        id: 'test-user-1',
        email: 'test1@example.com',
        firstName: 'Test',
        lastName: 'User 1',
        role: 'admin' as const,
        companyId: 'test-company-1',
        isVerified: true,
        isActive: true
      }
    ]);
  }
};

export default MockAPI;
