#!/usr/bin/env node

/**
 * Claude Talimat Mock API Server
 * Test ve geliştirme için mock API endpoint'leri sağlar
 */

const express = require('express');
const cors = require('cors');
const { mockData, apiResponses } = require('./test-data-generator');

const app = express();
const PORT = process.env.MOCK_API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// =============================================================================
// AUTH ENDPOINTS
// =============================================================================

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock validation
  const user = mockData.users.find(u => u.email === email && u.password === password);
  
  if (user) {
    res.json({
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
    });
  } else {
    res.status(401).json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect'
    });
  }
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;
  
  // Mock validation
  const existingUser = mockData.users.find(u => u.email === email);
  
  if (existingUser) {
    res.status(400).json({
      error: 'Registration failed',
      message: 'Email already exists'
    });
  } else {
    const newUser = {
      id: 'user-' + Date.now(),
      email,
      firstName,
      lastName,
      phone,
      role: 'user',
      companyId: 'test-company-1',
      isVerified: false,
      isActive: true
    };
    
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser
    });
  }
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Mock user data
  res.json(mockData.users[0]);
});

// =============================================================================
// DOCUMENTS ENDPOINTS
// =============================================================================

// Get documents list
app.get('/api/documents', (req, res) => {
  const { page = 1, limit = 10, category, search } = req.query;
  
  let documents = [...mockData.documents];
  
  // Filter by category
  if (category) {
    documents = documents.filter(doc => doc.categoryId === category);
  }
  
  // Search
  if (search) {
    documents = documents.filter(doc => 
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedDocuments = documents.slice(startIndex, endIndex);
  
  res.json({
    documents: paginatedDocuments,
    total: documents.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(documents.length / limit)
  });
});

// Get document by ID
app.get('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const document = mockData.documents.find(doc => doc.id === id);
  
  if (document) {
    res.json(document);
  } else {
    res.status(404).json({ error: 'Document not found' });
  }
});

// Upload document
app.post('/api/documents/upload', (req, res) => {
  const { title, description, categoryId, tags } = req.body;
  
  const newDocument = {
    id: 'doc-' + Date.now(),
    title,
    description,
    filePath: '/uploads/' + title.toLowerCase().replace(/\s+/g, '-') + '.pdf',
    fileSize: Math.floor(Math.random() * 1000000) + 100000,
    fileType: 'application/pdf',
    categoryId,
    companyId: 'test-company-1',
    uploadedBy: 'test-user-1',
    status: 'active',
    tags: tags ? tags.split(',') : [],
    metadata: {
      version: '1.0',
      author: 'Test User',
      reviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockData.documents.unshift(newDocument);
  
  res.status(201).json({
    message: 'Document uploaded successfully',
    document: newDocument
  });
});

// Update document
app.put('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const documentIndex = mockData.documents.findIndex(doc => doc.id === id);
  
  if (documentIndex === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  mockData.documents[documentIndex] = {
    ...mockData.documents[documentIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    message: 'Document updated successfully',
    document: mockData.documents[documentIndex]
  });
});

// Delete document
app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const documentIndex = mockData.documents.findIndex(doc => doc.id === id);
  
  if (documentIndex === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  mockData.documents.splice(documentIndex, 1);
  
  res.json({ message: 'Document deleted successfully' });
});

// Get document categories
app.get('/api/documents/categories', (req, res) => {
  res.json(mockData.categories);
});

// =============================================================================
// ANALYTICS ENDPOINTS
// =============================================================================

// Dashboard stats
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    totalUsers: 10,
    activeUsers: 8,
    totalDocuments: mockData.documents.length,
    totalDownloads: 150,
    totalUploads: 25,
    recentActivity: mockData.analytics.events.slice(0, 5),
    userActivity: mockData.analytics.userActivity[0],
    companyMetrics: mockData.analytics.companyMetrics[0],
    chartData: {
      dailyUsers: generateChartData(30, 5, 15),
      documentViews: generateChartData(30, 10, 50),
      downloads: generateChartData(30, 5, 25)
    }
  });
});

// Events
app.get('/api/analytics/events', (req, res) => {
  const { page = 1, limit = 20, eventType } = req.query;
  
  let events = [...mockData.analytics.events];
  
  if (eventType) {
    events = events.filter(event => event.eventType === eventType);
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedEvents = events.slice(startIndex, endIndex);
  
  res.json({
    events: paginatedEvents,
    total: events.length,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

// User activity
app.get('/api/analytics/user-activity', (req, res) => {
  res.json(mockData.analytics.userActivity);
});

// Company metrics
app.get('/api/analytics/company-metrics', (req, res) => {
  res.json(mockData.analytics.companyMetrics);
});

// =============================================================================
// NOTIFICATIONS ENDPOINTS
// =============================================================================

// Get notifications
app.get('/api/notifications', (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  let notifications = [...mockData.notifications];
  
  if (status) {
    notifications = notifications.filter(notif => notif.status === status);
  }
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedNotifications = notifications.slice(startIndex, endIndex);
  
  res.json({
    notifications: paginatedNotifications,
    total: notifications.length,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

// Mark notification as read
app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const notification = mockData.notifications.find(notif => notif.id === id);
  
  if (notification) {
    notification.status = 'read';
    res.json({ message: 'Notification marked as read' });
  } else {
    res.status(404).json({ error: 'Notification not found' });
  }
});

// =============================================================================
// COMPANIES ENDPOINTS
// =============================================================================

// Get companies
app.get('/api/companies', (req, res) => {
  res.json(mockData.companies);
});

// Get company by ID
app.get('/api/companies/:id', (req, res) => {
  const { id } = req.params;
  const company = mockData.companies.find(comp => comp.id === id);
  
  if (company) {
    res.json(company);
  } else {
    res.status(404).json({ error: 'Company not found' });
  }
});

// =============================================================================
// USERS ENDPOINTS
// =============================================================================

// Get users
app.get('/api/users', (req, res) => {
  res.json(mockData.users);
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const user = mockData.users.find(u => u.id === id);
  
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    mockData: {
      users: mockData.users.length,
      companies: mockData.companies.length,
      documents: mockData.documents.length,
      categories: mockData.categories.length,
      notifications: mockData.notifications.length
    }
  });
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function generateChartData(days, min, max) {
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

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`
🚀 Claude Talimat Mock API Server Started!

📍 Server running on: http://localhost:${PORT}
📊 Health check: http://localhost:${PORT}/health

🔗 Available endpoints:
   POST /api/auth/login
   POST /api/auth/register
   GET  /api/auth/me
   GET  /api/documents
   GET  /api/documents/:id
   POST /api/documents/upload
   PUT  /api/documents/:id
   DELETE /api/documents/:id
   GET  /api/documents/categories
   GET  /api/analytics/dashboard
   GET  /api/analytics/events
   GET  /api/analytics/user-activity
   GET  /api/analytics/company-metrics
   GET  /api/notifications
   PUT  /api/notifications/:id/read
   GET  /api/companies
   GET  /api/companies/:id
   GET  /api/users
   GET  /api/users/:id

🧪 Test credentials:
   Email: test1@example.com
   Password: password123

📝 Mock data loaded:
   - ${mockData.users.length} users
   - ${mockData.companies.length} companies
   - ${mockData.documents.length} documents
   - ${mockData.categories.length} categories
   - ${mockData.notifications.length} notifications
  `);
});

module.exports = app;
