#!/usr/bin/env node

/**
 * Simple Mock API Server
 * Test ve geliştirme için basit mock API endpoint'leri
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.MOCK_API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Simple Mock API Server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Simple Mock API Server is running!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/me',
      'GET /api/documents',
      'POST /api/documents/upload'
    ]
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: true,
      message: 'Email and password are required',
      code: 'MISSING_FIELDS',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }
  
  // Mock successful login
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: 'mock-user-1',
        email: email,
        name: 'Mock User',
        role: 'employee'
      },
      token: 'mock-jwt-token-' + Date.now()
    },
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({
      error: true,
      message: 'Email, password, and name are required',
      code: 'MISSING_FIELDS',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }
  
  // Mock successful registration
  res.json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: 'mock-user-' + Date.now(),
        email: email,
        name: name,
        role: 'employee'
      },
      token: 'mock-jwt-token-' + Date.now()
    },
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: true,
      message: 'Authorization header required',
      code: 'UNAUTHORIZED',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }
  
  // Mock user data
  res.json({
    success: true,
    data: {
      user: {
        id: 'mock-user-1',
        email: 'test@example.com',
        name: 'Mock User',
        role: 'employee'
      }
    },
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
});

// Document endpoints
app.get('/api/documents', (req, res) => {
  // Mock documents
  const documents = [
    {
      id: 'doc-1',
      title: 'İş Güvenliği Talimatı 1',
      type: 'instruction',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'doc-2',
      title: 'Acil Durum Prosedürü',
      type: 'procedure',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    data: {
      documents: documents,
      total: documents.length
    },
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/documents/upload', (req, res) => {
  const { title, type } = req.body;
  
  if (!title || !type) {
    return res.status(400).json({
      error: true,
      message: 'Title and type are required',
      code: 'MISSING_FIELDS',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }
  
  // Mock successful upload
  res.json({
    success: true,
    message: 'Document uploaded successfully',
    data: {
      document: {
        id: 'doc-' + Date.now(),
        title: title,
        type: type,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    },
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    code: 'ENDPOINT_NOT_FOUND',
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/me',
      'GET /api/documents',
      'POST /api/documents/upload'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: true,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Mock API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/register`);
  console.log(`   GET  /api/auth/me`);
  console.log(`   GET  /api/documents`);
  console.log(`   POST /api/documents/upload`);
});
