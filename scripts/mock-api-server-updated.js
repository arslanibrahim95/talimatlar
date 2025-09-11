#!/usr/bin/env node

/**
 * Claude Talimat Mock API Server - Updated with Safety Management Endpoints
 * Test ve geliştirme için mock API endpoint'leri sağlar
 */

const express = require('express');
const cors = require('cors');

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

// Mock data
const mockData = {
  users: [
    {
      id: 'user-1',
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      companyId: 'company-1'
    }
  ],
  instructions: [
    {
      id: 'inst-1',
      title: 'İş Güvenliği Genel Kuralları',
      content: 'Tüm çalışanların uyması gereken temel iş güvenliği kuralları...',
      status: 'published',
      priority: 'high',
      isMandatory: true,
      effectiveDate: '2024-01-01',
      expiryDate: '2025-01-01',
      version: '2.0',
      tags: ['güvenlik', 'genel', 'kurallar'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ],
  employees: [
    {
      id: 'emp-1',
      employeeNumber: 'EMP001',
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      position: 'Güvenlik Müdürü',
      department: 'Güvenlik Müdürlüğü',
      hireDate: '2023-01-15',
      employmentType: 'full_time',
      isActive: true,
      skills: ['İş Güvenliği', 'Risk Değerlendirmesi'],
      createdAt: '2023-01-15T00:00:00Z'
    }
  ],
  departments: [
    {
      id: 'dept-1',
      name: 'Güvenlik Müdürlüğü',
      code: 'GM',
      description: 'İş güvenliği ve çevre yönetimi',
      isActive: true,
      employeeCount: 8
    }
  ],
  trainingPrograms: [
    {
      id: 'prog-1',
      title: 'Temel İş Güvenliği Eğitimi',
      description: 'Yeni çalışanlar için temel iş güvenliği eğitimi',
      category: 'Güvenlik',
      durationHours: 8,
      isMandatory: true,
      validityPeriodMonths: 12,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ],
  incidents: [
    {
      id: 'inc-1',
      incidentNumber: 'INC-20240115-001',
      title: 'Üretim Hattında Küçük Yaralanma',
      description: 'Operatör elini makineye sıkıştırdı, hafif yaralanma',
      type: 'injury',
      severity: 'medium',
      status: 'investigating',
      incidentDate: '2024-01-15T14:30:00Z',
      location: 'Üretim Hattı A',
      reportedBy: 'user-1',
      createdAt: '2024-01-15T15:00:00Z'
    }
  ]
};

// =============================================================================
// AUTH ENDPOINTS
// =============================================================================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
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
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// =============================================================================
// DOCUMENTS ENDPOINTS
// =============================================================================

app.get('/api/documents', (req, res) => {
  const { page = 1, limit = 20, category, status } = req.query;
  
  const documents = [
    {
      id: 'doc-1',
      title: 'Güvenlik Protokolü',
      description: 'Genel güvenlik protokolü',
      category: 'safety',
      status: 'active',
      fileSize: 2048576,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ];
  
  let filtered = documents;
  if (category) filtered = filtered.filter(d => d.category === category);
  if (status) filtered = filtered.filter(d => d.status === status);
  
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  
  res.json({
    documents: filtered.slice(start, end),
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

// =============================================================================
// ANALYTICS ENDPOINTS
// =============================================================================

app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    metrics: [
      { name: 'Total Users', value: 150, change: 5.2 },
      { name: 'Active Documents', value: 45, change: -2.1 },
      { name: 'Total Downloads', value: 1250, change: 12.5 }
    ],
    charts: [
      {
        title: 'User Activity',
        type: 'line',
        data: [
          { date: '2024-01-01', users: 120 },
          { date: '2024-01-02', users: 135 },
          { date: '2024-01-03', users: 150 }
        ]
      }
    ],
    recentActivity: [
      { action: 'Document uploaded', user: 'Ahmet Yılmaz', timestamp: '2024-01-15T10:30:00Z' },
      { action: 'User registered', user: 'Mehmet Demir', timestamp: '2024-01-15T09:15:00Z' }
    ]
  });
});

// =============================================================================
// NOTIFICATIONS ENDPOINTS
// =============================================================================

app.get('/api/notifications', (req, res) => {
  const notifications = [
    {
      id: 'notif-1',
      title: 'Yeni Doküman Yüklendi',
      message: 'Güvenlik Protokolü dokümanı güncellendi',
      type: 'info',
      status: 'unread',
      createdAt: '2024-01-15T10:30:00Z'
    }
  ];
  
  res.json(notifications);
});

// =============================================================================
// SAFETY MANAGEMENT ENDPOINTS
// =============================================================================

// Instructions endpoints
app.get('/api/instructions', (req, res) => {
  const { page = 1, limit = 20, status, priority } = req.query;
  const instructions = mockData.instructions || [];
  
  let filtered = instructions;
  if (status) filtered = filtered.filter(i => i.status === status);
  if (priority) filtered = filtered.filter(i => i.priority === priority);
  
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  
  res.json({
    instructions: filtered.slice(start, end),
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

app.post('/api/instructions', (req, res) => {
  const instruction = {
    id: 'inst-' + Date.now(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.status(201).json(instruction);
});

app.get('/api/instructions/:id', (req, res) => {
  const instruction = mockData.instructions?.find(i => i.id === req.params.id);
  if (!instruction) {
    return res.status(404).json({ error: 'Instruction not found' });
  }
  res.json(instruction);
});

// Personnel endpoints
app.get('/api/personnel/employees', (req, res) => {
  const { page = 1, limit = 20, department, position } = req.query;
  const employees = mockData.employees || [];
  
  let filtered = employees;
  if (department) filtered = filtered.filter(e => e.department === department);
  if (position) filtered = filtered.filter(e => e.position === position);
  
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  
  res.json({
    employees: filtered.slice(start, end),
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

app.get('/api/personnel/departments', (req, res) => {
  const departments = mockData.departments || [];
  res.json(departments);
});

// Training endpoints
app.get('/api/training/programs', (req, res) => {
  const { page = 1, limit = 20, category, isMandatory } = req.query;
  const programs = mockData.trainingPrograms || [];
  
  let filtered = programs;
  if (category) filtered = filtered.filter(p => p.category === category);
  if (isMandatory !== undefined) filtered = filtered.filter(p => p.isMandatory === (isMandatory === 'true'));
  
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  
  res.json({
    trainingPrograms: filtered.slice(start, end),
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

// Incidents endpoints
app.get('/api/incidents', (req, res) => {
  const { page = 1, limit = 20, type, severity, status } = req.query;
  const incidents = mockData.incidents || [];
  
  let filtered = incidents;
  if (type) filtered = filtered.filter(i => i.type === type);
  if (severity) filtered = filtered.filter(i => i.severity === severity);
  if (status) filtered = filtered.filter(i => i.status === status);
  
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  
  res.json({
    incidents: filtered.slice(start, end),
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

app.post('/api/incidents', (req, res) => {
  const incident = {
    id: 'inc-' + Date.now(),
    incidentNumber: 'INC-' + Date.now(),
    ...req.body,
    status: 'reported',
    reportedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.status(201).json(incident);
});

// Statistics endpoints for all services
app.get('/api/instructions/statistics', (req, res) => {
  res.json({
    totalInstructions: 25,
    byStatus: { published: 20, draft: 3, archived: 2 },
    byPriority: { high: 8, normal: 15, low: 2 },
    mandatoryCount: 12,
    expiredCount: 1,
    recentCreated: 5
  });
});

app.get('/api/personnel/statistics', (req, res) => {
  res.json({
    totalEmployees: 45,
    activeEmployees: 42,
    byDepartment: { 'Güvenlik Müdürlüğü': 8, 'İnsan Kaynakları': 5, 'Kalite Kontrol': 12 },
    byEmploymentType: { fullTime: 38, partTime: 5, contract: 2 },
    recentHires: 3,
    certificationsExpiring: 2
  });
});

app.get('/api/training/statistics', (req, res) => {
  res.json({
    totalPrograms: 15,
    activePrograms: 12,
    mandatoryPrograms: 8,
    byCategory: { 'Güvenlik': 6, 'Kalite': 4, 'Teknik': 3 },
    totalAssignments: 120,
    completedAssignments: 95,
    expiredAssignments: 5,
    upcomingSessions: 8
  });
});

app.get('/api/incidents/statistics', (req, res) => {
  res.json({
    totalIncidents: 15,
    byType: { injury: 8, nearMiss: 4, propertyDamage: 2, environmental: 1 },
    bySeverity: { low: 5, medium: 7, high: 2, critical: 1 },
    byStatus: { reported: 3, investigating: 5, resolved: 6, closed: 1 },
    recentIncidents: 3,
    trend: 'decreasing'
  });
});

// =============================================================================
// HEALTH AND DOCS ENDPOINTS
// =============================================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      auth: 'healthy',
      documents: 'healthy',
      analytics: 'healthy',
      notifications: 'healthy',
      instructions: 'healthy',
      personnel: 'healthy',
      training: 'healthy',
      incidents: 'healthy'
    }
  });
});

app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Claude Talimat Mock API',
    version: '1.0.0',
    description: 'Mock API for testing and development',
    endpoints: [
      { method: 'POST', path: '/api/auth/login', description: 'User login' },
      { method: 'GET', path: '/api/documents', description: 'Get documents' },
      { method: 'GET', path: '/api/analytics/dashboard', description: 'Get dashboard data' },
      { method: 'GET', path: '/api/notifications', description: 'Get notifications' },
      { method: 'GET', path: '/api/instructions', description: 'Get instructions' },
      { method: 'GET', path: '/api/personnel/employees', description: 'Get employees' },
      { method: 'GET', path: '/api/training/programs', description: 'Get training programs' },
      { method: 'GET', path: '/api/incidents', description: 'Get incidents' }
    ]
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Mock API Server running on port ${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   - Auth: POST /api/auth/login`);
  console.log(`   - Documents: GET /api/documents`);
  console.log(`   - Analytics: GET /api/analytics/dashboard`);
  console.log(`   - Notifications: GET /api/notifications`);
  console.log(`   - Instructions: GET /api/instructions, POST /api/instructions`);
  console.log(`   - Personnel: GET /api/personnel/employees, GET /api/personnel/departments`);
  console.log(`   - Training: GET /api/training/programs`);
  console.log(`   - Incidents: GET /api/incidents, POST /api/incidents`);
  console.log(`   - Statistics: GET /api/*/statistics`);
  console.log(`   - Health: GET /api/health`);
  console.log(`   - Docs: GET /api/docs`);
});

