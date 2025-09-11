#!/usr/bin/env node

/**
 * Claude Talimat Mock API Server
 * Test ve geliştirme için mock API endpoint'leri sağlar
 * Gelişmiş hata yönetimi ve pürüzsüz etkileşimler ile
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { mockData, apiResponses } from './test-data-generator.js';

const app = express();
const PORT = process.env.MOCK_API_PORT || 3001;

// =============================================================================
// ENHANCED MIDDLEWARE CONFIGURATION
// =============================================================================

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // Her IP için maksimum 100 istek
  message: {
    error: 'Too Many Requests',
    message: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration with error handling
const corsOptions = {
  origin: function (origin, callback) {
    // Development için tüm origin'lere izin ver
    if (!origin || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Production için belirli origin'lere izin ver
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://yourdomain.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation: Origin not allowed'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware setup
app.use(limiter);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`[${timestamp}] ${method} ${path} - IP: ${ip} - UA: ${userAgent}`);
  
  // Request ID for tracking
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
});

// =============================================================================
// INPUT VALIDATION HELPERS
// =============================================================================

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRequired = (obj, requiredFields) => {
  const missing = [];
  requiredFields.forEach(field => {
    if (!obj[field] || (typeof obj[field] === 'string' && obj[field].trim() === '')) {
      missing.push(field);
    }
  });
  return missing;
};

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

// =============================================================================
// ENHANCED ERROR HANDLING MIDDLEWARE
// =============================================================================

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Custom error class
class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

// Error response formatter
const formatErrorResponse = (error, req) => {
  const response = {
    error: true,
    message: error.message || 'Beklenmeyen bir hata oluştu',
    code: error.code || 'UNKNOWN_ERROR',
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  };

  // Development ortamında stack trace ekle
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.details = error;
  }

  return response;
};

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.requestId}:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  const statusCode = err.statusCode || 500;
  const response = formatErrorResponse(err, req);

  res.status(statusCode).json(response);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `Endpoint bulunamadı: ${req.method} ${req.path}`,
    code: 'ENDPOINT_NOT_FOUND',
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/me',
      'GET /api/documents',
      'POST /api/documents/upload'
    ]
  });
});

// =============================================================================
// AUTH ENDPOINTS
// =============================================================================

// Login
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    const missingFields = validateRequired(req.body, ['email', 'password']);
    if (missingFields.length > 0) {
      throw new APIError(
        `Eksik alanlar: ${missingFields.join(', ')}`,
        400,
        'MISSING_FIELDS'
      );
    }
    
    // Email validation
    if (!validateEmail(email)) {
      throw new APIError(
        'Geçerli bir e-posta adresi giriniz',
        400,
        'INVALID_EMAIL'
      );
    }
    
    // Password validation
    if (!validatePassword(password)) {
      throw new APIError(
        'Şifre en az 6 karakter olmalıdır',
        400,
        'INVALID_PASSWORD'
      );
    }
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedPassword = sanitizeInput(password);
    
    // Mock validation
    const user = mockData.users.find(u => 
      u.email.toLowerCase() === sanitizedEmail && u.password === sanitizedPassword
    );
    
    if (!user) {
      throw new APIError(
        'E-posta veya şifre hatalı',
        401,
        'INVALID_CREDENTIALS'
      );
    }
    
    if (!user.isActive) {
      throw new APIError(
        'Hesabınız deaktif durumda. Lütfen yöneticinizle iletişime geçin.',
        403,
        'ACCOUNT_DEACTIVATED'
      );
    }
    
    // Generate tokens
    const accessToken = 'mock-jwt-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const refreshToken = 'mock-refresh-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
          isVerified: user.isVerified
        },
        expires_in: 3600
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Giriş işlemi sırasında bir hata oluştu',
      500,
      'LOGIN_ERROR'
    );
  }
}));

// Register
app.post('/api/auth/register', asyncHandler(async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    // Input validation
    const missingFields = validateRequired(req.body, ['email', 'password', 'firstName', 'lastName']);
    if (missingFields.length > 0) {
      throw new APIError(
        `Eksik alanlar: ${missingFields.join(', ')}`,
        400,
        'MISSING_FIELDS'
      );
    }
    
    // Email validation
    if (!validateEmail(email)) {
      throw new APIError(
        'Geçerli bir e-posta adresi giriniz',
        400,
        'INVALID_EMAIL'
      );
    }
    
    // Password validation
    if (!validatePassword(password)) {
      throw new APIError(
        'Şifre en az 6 karakter olmalıdır',
        400,
        'INVALID_PASSWORD'
      );
    }
    
    // Name validation
    if (firstName.length < 2 || lastName.length < 2) {
      throw new APIError(
        'Ad ve soyad en az 2 karakter olmalıdır',
        400,
        'INVALID_NAME'
      );
    }
    
    // Phone validation (optional)
    if (phone && phone.length < 10) {
      throw new APIError(
        'Telefon numarası en az 10 karakter olmalıdır',
        400,
        'INVALID_PHONE'
      );
    }
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedPassword = sanitizeInput(password);
    const sanitizedFirstName = sanitizeInput(firstName);
    const sanitizedLastName = sanitizeInput(lastName);
    const sanitizedPhone = phone ? sanitizeInput(phone) : '';
    
    // Check if user already exists
    const existingUser = mockData.users.find(u => u.email.toLowerCase() === sanitizedEmail);
    if (existingUser) {
      throw new APIError(
        'Bu e-posta adresi zaten kullanılıyor',
        409,
        'EMAIL_EXISTS'
      );
    }
    
    // Create new user
    const newUser = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      email: sanitizedEmail,
      password: sanitizedPassword,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      phone: sanitizedPhone,
      role: 'user',
      companyId: 'test-company-1',
      isVerified: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to mock data
    mockData.users.push(newUser);
    
    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phone: newUser.phone,
          role: newUser.role,
          companyId: newUser.companyId,
          isVerified: newUser.isVerified,
          isActive: newUser.isActive
        }
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Kayıt işlemi sırasında bir hata oluştu',
      500,
      'REGISTRATION_ERROR'
    );
  }
}));

// Get current user
app.get('/api/auth/me', asyncHandler(async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new APIError(
        'Yetkilendirme token\'ı bulunamadı',
        401,
        'MISSING_TOKEN'
      );
    }
    
    const token = authHeader.substring(7);
    
    // Mock token validation
    if (!token.startsWith('mock-jwt-token-')) {
      throw new APIError(
        'Geçersiz token',
        401,
        'INVALID_TOKEN'
      );
    }
    
    // Mock user data
    const user = mockData.users[0];
    if (!user) {
      throw new APIError(
        'Kullanıcı bulunamadı',
        404,
        'USER_NOT_FOUND'
      );
    }
    
    res.json({
      success: true,
      message: 'Kullanıcı bilgileri başarıyla alındı',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
          isVerified: user.isVerified,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Kullanıcı bilgileri alınırken bir hata oluştu',
      500,
      'USER_INFO_ERROR'
    );
  }
}));

// =============================================================================
// DOCUMENTS ENDPOINTS
// =============================================================================

// Get documents list
app.get('/api/documents', asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1) {
      throw new APIError(
        'Sayfa numarası 1\'den küçük olamaz',
        400,
        'INVALID_PAGE'
      );
    }
    
    if (limitNum < 1 || limitNum > 100) {
      throw new APIError(
        'Limit 1-100 arasında olmalıdır',
        400,
        'INVALID_LIMIT'
      );
    }
    
    // Validate sort parameters
    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'fileSize'];
    const allowedSortOrders = ['asc', 'desc'];
    
    if (!allowedSortFields.includes(sortBy)) {
      throw new APIError(
        `Geçersiz sıralama alanı. İzin verilen alanlar: ${allowedSortFields.join(', ')}`,
        400,
        'INVALID_SORT_FIELD'
      );
    }
    
    if (!allowedSortOrders.includes(sortOrder)) {
      throw new APIError(
        'Geçersiz sıralama yönü. İzin verilen değerler: asc, desc',
        400,
        'INVALID_SORT_ORDER'
      );
    }
    
    let documents = [...mockData.documents];
    
    // Filter by category
    if (category) {
      const categoryExists = mockData.categories.find(cat => cat.id === category);
      if (!categoryExists) {
        throw new APIError(
          'Geçersiz kategori ID',
          400,
          'INVALID_CATEGORY'
        );
      }
      documents = documents.filter(doc => doc.categoryId === category);
    }
    
    // Filter by status
    if (status) {
      const allowedStatuses = ['active', 'draft', 'archived'];
      if (!allowedStatuses.includes(status)) {
        throw new APIError(
          `Geçersiz durum. İzin verilen durumlar: ${allowedStatuses.join(', ')}`,
          400,
          'INVALID_STATUS'
        );
      }
      documents = documents.filter(doc => doc.status === status);
    }
    
    // Search
    if (search) {
      const searchTerm = sanitizeInput(search).toLowerCase();
      if (searchTerm.length < 2) {
        throw new APIError(
          'Arama terimi en az 2 karakter olmalıdır',
          400,
          'INVALID_SEARCH_TERM'
        );
      }
      documents = documents.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm) ||
        doc.description.toLowerCase().includes(searchTerm) ||
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }
    
    // Sort documents
    documents.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedDocuments = documents.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      message: 'Dokümanlar başarıyla alındı',
      data: {
        documents: paginatedDocuments,
        pagination: {
          total: documents.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(documents.length / limitNum),
          hasNext: endIndex < documents.length,
          hasPrev: pageNum > 1
        },
        filters: {
          category: category || null,
          search: search || null,
          status: status || null,
          sortBy,
          sortOrder
        }
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Dokümanlar alınırken bir hata oluştu',
      500,
      'DOCUMENTS_FETCH_ERROR'
    );
  }
}));

// Get document by ID
app.get('/api/documents/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || id.trim() === '') {
      throw new APIError(
        'Doküman ID\'si gerekli',
        400,
        'MISSING_DOCUMENT_ID'
      );
    }
    
    const sanitizedId = sanitizeInput(id);
    const document = mockData.documents.find(doc => doc.id === sanitizedId);
    
    if (!document) {
      throw new APIError(
        'Doküman bulunamadı',
        404,
        'DOCUMENT_NOT_FOUND'
      );
    }
    
    // Increment view count
    if (document.metadata) {
      document.metadata.viewCount = (document.metadata.viewCount || 0) + 1;
    }
    
    res.json({
      success: true,
      message: 'Doküman başarıyla alındı',
      data: {
        document: {
          ...document,
          metadata: {
            ...document.metadata,
            lastViewedAt: new Date().toISOString()
          }
        }
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Doküman alınırken bir hata oluştu',
      500,
      'DOCUMENT_FETCH_ERROR'
    );
  }
}));

// Upload document
app.post('/api/documents/upload', asyncHandler(async (req, res) => {
  try {
    const { title, description, categoryId, tags, fileType = 'application/pdf', fileSize } = req.body;
    
    // Input validation
    const missingFields = validateRequired(req.body, ['title', 'description', 'categoryId']);
    if (missingFields.length > 0) {
      throw new APIError(
        `Eksik alanlar: ${missingFields.join(', ')}`,
        400,
        'MISSING_FIELDS'
      );
    }
    
    // Title validation
    if (title.length < 3) {
      throw new APIError(
        'Başlık en az 3 karakter olmalıdır',
        400,
        'INVALID_TITLE'
      );
    }
    
    if (title.length > 200) {
      throw new APIError(
        'Başlık en fazla 200 karakter olabilir',
        400,
        'TITLE_TOO_LONG'
      );
    }
    
    // Description validation
    if (description.length < 10) {
      throw new APIError(
        'Açıklama en az 10 karakter olmalıdır',
        400,
        'INVALID_DESCRIPTION'
      );
    }
    
    if (description.length > 1000) {
      throw new APIError(
        'Açıklama en fazla 1000 karakter olabilir',
        400,
        'DESCRIPTION_TOO_LONG'
      );
    }
    
    // Category validation
    const categoryExists = mockData.categories.find(cat => cat.id === categoryId);
    if (!categoryExists) {
      throw new APIError(
        'Geçersiz kategori ID',
        400,
        'INVALID_CATEGORY'
      );
    }
    
    // File type validation
    const allowedFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedFileTypes.includes(fileType)) {
      throw new APIError(
        `Desteklenmeyen dosya türü. İzin verilen türler: ${allowedFileTypes.join(', ')}`,
        400,
        'INVALID_FILE_TYPE'
      );
    }
    
    // File size validation
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const actualFileSize = fileSize || Math.floor(Math.random() * 1000000) + 100000;
    if (actualFileSize > maxFileSize) {
      throw new APIError(
        'Dosya boyutu 10MB\'dan büyük olamaz',
        400,
        'FILE_TOO_LARGE'
      );
    }
    
    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedDescription = sanitizeInput(description);
    const sanitizedCategoryId = sanitizeInput(categoryId);
    const sanitizedTags = tags ? tags.split(',').map(tag => sanitizeInput(tag.trim())).filter(tag => tag.length > 0) : [];
    
    // Check for duplicate title
    const existingDocument = mockData.documents.find(doc => 
      doc.title.toLowerCase() === sanitizedTitle.toLowerCase()
    );
    if (existingDocument) {
      throw new APIError(
        'Bu başlıkta bir doküman zaten mevcut',
        409,
        'DUPLICATE_TITLE'
      );
    }
    
    // Create new document
    const newDocument = {
      id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      title: sanitizedTitle,
      description: sanitizedDescription,
      filePath: '/uploads/' + sanitizedTitle.toLowerCase().replace(/\s+/g, '-') + '.pdf',
      fileSize: actualFileSize,
      fileType: fileType,
      categoryId: sanitizedCategoryId,
      companyId: 'test-company-1',
      uploadedBy: 'test-user-1',
      status: 'active',
      tags: sanitizedTags,
      metadata: {
        version: '1.0',
        author: 'Test User',
        reviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        uploadDate: new Date().toISOString(),
        viewCount: 0,
        downloadCount: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to mock data
    mockData.documents.unshift(newDocument);
    
    res.status(201).json({
      success: true,
      message: 'Doküman başarıyla yüklendi',
      data: {
        document: newDocument
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Doküman yüklenirken bir hata oluştu',
      500,
      'DOCUMENT_UPLOAD_ERROR'
    );
  }
}));

// Upload safety document with enhanced metadata
app.post('/api/documents/safety/upload', (req, res) => {
  const { 
    title, 
    description, 
    category, 
    tags, 
    priority, 
    department, 
    effectiveDate, 
    reviewDate, 
    author, 
    version, 
    status,
    metadata 
  } = req.body;
  
  const newSafetyDocument = {
    id: 'safety-doc-' + Date.now(),
    title,
    description,
    filePath: '/uploads/safety/' + title.toLowerCase().replace(/\s+/g, '-') + '.pdf',
    fileSize: metadata?.fileSize || Math.floor(Math.random() * 1000000) + 100000,
    fileType: metadata?.fileType || 'application/pdf',
    category,
    companyId: 'test-company-1',
    uploadedBy: 'test-user-1',
    status: status || 'draft',
    tags: tags || [],
    priority: priority || 'medium',
    department: department || 'Güvenlik',
    effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
    reviewDate: reviewDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    author: author || 'Test User',
    version: version || '1.0',
    metadata: {
      ...metadata,
      version: version || '1.0',
      author: author || 'Test User',
      reviewDate: reviewDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      uploadDate: new Date().toISOString(),
      viewCount: 0,
      downloadCount: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockData.documents.unshift(newSafetyDocument);
  
  res.status(201).json({
    message: 'Safety document uploaded successfully',
    document: newSafetyDocument
  });
});

// Bulk upload safety documents
app.post('/api/documents/safety/bulk-upload', (req, res) => {
  const { documents } = req.body;
  
  if (!Array.isArray(documents)) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Documents must be an array'
    });
  }
  
  const uploadedDocuments = documents.map((doc, index) => ({
    id: 'safety-doc-' + Date.now() + '-' + index,
    title: doc.title,
    description: doc.description,
    filePath: '/uploads/safety/' + doc.title.toLowerCase().replace(/\s+/g, '-') + '.pdf',
    fileSize: doc.metadata?.fileSize || Math.floor(Math.random() * 1000000) + 100000,
    fileType: doc.metadata?.fileType || 'application/pdf',
    category: doc.category,
    companyId: 'test-company-1',
    uploadedBy: 'test-user-1',
    status: doc.status || 'draft',
    tags: doc.tags || [],
    priority: doc.priority || 'medium',
    department: doc.department || 'Güvenlik',
    effectiveDate: doc.effectiveDate || new Date().toISOString().split('T')[0],
    reviewDate: doc.reviewDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    author: doc.author || 'Test User',
    version: doc.version || '1.0',
    metadata: {
      ...doc.metadata,
      version: doc.version || '1.0',
      author: doc.author || 'Test User',
      reviewDate: doc.reviewDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      uploadDate: new Date().toISOString(),
      viewCount: 0,
      downloadCount: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  
  mockData.documents.unshift(...uploadedDocuments);
  
  res.status(201).json({
    message: `${uploadedDocuments.length} safety documents uploaded successfully`,
    documents: uploadedDocuments,
    total: uploadedDocuments.length
  });
});

// Analyze document metadata
app.post('/api/documents/analyze', (req, res) => {
  const { fileType, fileSize, content } = req.body;
  
  // Mock analysis results
  const analysis = {
    fileType,
    fileSize,
    checksum: 'mock-checksum-' + Date.now(),
    extractedMetadata: {
      title: 'Extracted Title',
      author: 'Extracted Author',
      creationDate: new Date().toISOString(),
      modificationDate: new Date().toISOString(),
      wordCount: Math.floor(Math.random() * 1000) + 100
    },
    safetyKeywords: ['güvenlik', 'prosedür', 'talimat'],
    riskLevel: 'medium',
    complianceTags: ['ISO 45001', 'OHSAS 18001'],
    suggestedCategory: 'general-safety',
    suggestedTags: ['güvenlik', 'prosedür', 'talimat', 'iş güvenliği'],
    contentPreview: content ? content.substring(0, 500) : '',
    validation: {
      isValid: true,
      warnings: [],
      suggestions: [
        'Önerilen etiketler: güvenlik, prosedür, talimat',
        'Önerilen kategori: general-safety'
      ]
    }
  };
  
  res.json(analysis);
});

// Update document
app.put('/api/documents/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validate ID
    if (!id || id.trim() === '') {
      throw new APIError(
        'Doküman ID\'si gerekli',
        400,
        'MISSING_DOCUMENT_ID'
      );
    }
    
    const sanitizedId = sanitizeInput(id);
    const documentIndex = mockData.documents.findIndex(doc => doc.id === sanitizedId);
    
    if (documentIndex === -1) {
      throw new APIError(
        'Doküman bulunamadı',
        404,
        'DOCUMENT_NOT_FOUND'
      );
    }
    
    // Validate updates
    if (updates.title && updates.title.length < 3) {
      throw new APIError(
        'Başlık en az 3 karakter olmalıdır',
        400,
        'INVALID_TITLE'
      );
    }
    
    if (updates.description && updates.description.length < 10) {
      throw new APIError(
        'Açıklama en az 10 karakter olmalıdır',
        400,
        'INVALID_DESCRIPTION'
      );
    }
    
    if (updates.categoryId) {
      const categoryExists = mockData.categories.find(cat => cat.id === updates.categoryId);
      if (!categoryExists) {
        throw new APIError(
          'Geçersiz kategori ID',
          400,
          'INVALID_CATEGORY'
        );
      }
    }
    
    // Sanitize updates
    const sanitizedUpdates = {};
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'string') {
        sanitizedUpdates[key] = sanitizeInput(updates[key]);
      } else {
        sanitizedUpdates[key] = updates[key];
      }
    });
    
    // Update document
    mockData.documents[documentIndex] = {
      ...mockData.documents[documentIndex],
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Doküman başarıyla güncellendi',
      data: {
        document: mockData.documents[documentIndex]
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Doküman güncellenirken bir hata oluştu',
      500,
      'DOCUMENT_UPDATE_ERROR'
    );
  }
}));

// Delete document
app.delete('/api/documents/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || id.trim() === '') {
      throw new APIError(
        'Doküman ID\'si gerekli',
        400,
        'MISSING_DOCUMENT_ID'
      );
    }
    
    const sanitizedId = sanitizeInput(id);
    const documentIndex = mockData.documents.findIndex(doc => doc.id === sanitizedId);
    
    if (documentIndex === -1) {
      throw new APIError(
        'Doküman bulunamadı',
        404,
        'DOCUMENT_NOT_FOUND'
      );
    }
    
    // Soft delete - mark as archived instead of removing
    mockData.documents[documentIndex].status = 'archived';
    mockData.documents[documentIndex].deletedAt = new Date().toISOString();
    mockData.documents[documentIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Doküman başarıyla silindi',
      data: {
        documentId: sanitizedId,
        deletedAt: mockData.documents[documentIndex].deletedAt
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Doküman silinirken bir hata oluştu',
      500,
      'DOCUMENT_DELETE_ERROR'
    );
  }
}));

// Get document categories
app.get('/api/documents/categories', asyncHandler(async (req, res) => {
  try {
    if (!mockData.categories || mockData.categories.length === 0) {
      throw new APIError(
        'Kategoriler bulunamadı',
        404,
        'CATEGORIES_NOT_FOUND'
      );
    }
    
    res.json({
      success: true,
      message: 'Kategoriler başarıyla alındı',
      data: {
        categories: mockData.categories
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Kategoriler alınırken bir hata oluştu',
      500,
      'CATEGORIES_FETCH_ERROR'
    );
  }
}));

// =============================================================================
// ANALYTICS ENDPOINTS
// =============================================================================

// Dashboard stats
app.get('/api/analytics/dashboard', asyncHandler(async (req, res) => {
  try {
    const dashboardData = {
      totalUsers: mockData.users.length,
      activeUsers: mockData.users.filter(user => user.isActive).length,
      totalDocuments: mockData.documents.length,
      activeDocuments: mockData.documents.filter(doc => doc.status === 'active').length,
      totalDownloads: 150,
      totalUploads: 25,
      recentActivity: mockData.analytics?.events?.slice(0, 5) || [],
      userActivity: mockData.analytics?.userActivity?.[0] || {},
      companyMetrics: mockData.analytics?.companyMetrics?.[0] || {},
      chartData: {
        dailyUsers: generateChartData(30, 5, 15),
        documentViews: generateChartData(30, 10, 50),
        downloads: generateChartData(30, 5, 25)
      }
    };
    
    res.json({
      success: true,
      message: 'Dashboard verileri başarıyla alındı',
      data: dashboardData,
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Dashboard verileri alınırken bir hata oluştu',
      500,
      'DASHBOARD_FETCH_ERROR'
    );
  }
}));

// Events
app.get('/api/analytics/events', asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, eventType, startDate, endDate } = req.query;
    
    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1) {
      throw new APIError(
        'Sayfa numarası 1\'den küçük olamaz',
        400,
        'INVALID_PAGE'
      );
    }
    
    if (limitNum < 1 || limitNum > 100) {
      throw new APIError(
        'Limit 1-100 arasında olmalıdır',
        400,
        'INVALID_LIMIT'
      );
    }
    
    let events = [...(mockData.analytics?.events || [])];
    
    // Filter by event type
    if (eventType) {
      const allowedEventTypes = ['login', 'logout', 'document_view', 'document_upload', 'document_download'];
      if (!allowedEventTypes.includes(eventType)) {
        throw new APIError(
          `Geçersiz etkinlik türü. İzin verilen türler: ${allowedEventTypes.join(', ')}`,
          400,
          'INVALID_EVENT_TYPE'
        );
      }
      events = events.filter(event => event.eventType === eventType);
    }
    
    // Filter by date range
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new APIError(
          'Geçersiz tarih formatı',
          400,
          'INVALID_DATE_FORMAT'
        );
      }
      
      events = events.filter(event => {
        const eventDate = new Date(event.timestamp);
        return eventDate >= start && eventDate <= end;
      });
    }
    
    // Pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedEvents = events.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      message: 'Etkinlikler başarıyla alındı',
      data: {
        events: paginatedEvents,
        pagination: {
          total: events.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(events.length / limitNum),
          hasNext: endIndex < events.length,
          hasPrev: pageNum > 1
        }
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Etkinlikler alınırken bir hata oluştu',
      500,
      'EVENTS_FETCH_ERROR'
    );
  }
}));

// User activity
app.get('/api/analytics/user-activity', asyncHandler(async (req, res) => {
  try {
    const userActivity = mockData.analytics?.userActivity || [];
    
    if (userActivity.length === 0) {
      throw new APIError(
        'Kullanıcı aktivite verileri bulunamadı',
        404,
        'USER_ACTIVITY_NOT_FOUND'
      );
    }
    
    res.json({
      success: true,
      message: 'Kullanıcı aktivite verileri başarıyla alındı',
      data: {
        userActivity
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Kullanıcı aktivite verileri alınırken bir hata oluştu',
      500,
      'USER_ACTIVITY_FETCH_ERROR'
    );
  }
}));

// Company metrics
app.get('/api/analytics/company-metrics', asyncHandler(async (req, res) => {
  try {
    const companyMetrics = mockData.analytics?.companyMetrics || [];
    
    if (companyMetrics.length === 0) {
      throw new APIError(
        'Şirket metrik verileri bulunamadı',
        404,
        'COMPANY_METRICS_NOT_FOUND'
      );
    }
    
    res.json({
      success: true,
      message: 'Şirket metrik verileri başarıyla alındı',
      data: {
        companyMetrics
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Şirket metrik verileri alınırken bir hata oluştu',
      500,
      'COMPANY_METRICS_FETCH_ERROR'
    );
  }
}));

// =============================================================================
// NOTIFICATIONS ENDPOINTS
// =============================================================================

// Get notifications
app.get('/api/notifications', asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    
    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1) {
      throw new APIError(
        'Sayfa numarası 1\'den küçük olamaz',
        400,
        'INVALID_PAGE'
      );
    }
    
    if (limitNum < 1 || limitNum > 100) {
      throw new APIError(
        'Limit 1-100 arasında olmalıdır',
        400,
        'INVALID_LIMIT'
      );
    }
    
    let notifications = [...(mockData.notifications || [])];
    
    // Filter by status
    if (status) {
      const allowedStatuses = ['unread', 'read', 'archived'];
      if (!allowedStatuses.includes(status)) {
        throw new APIError(
          `Geçersiz durum. İzin verilen durumlar: ${allowedStatuses.join(', ')}`,
          400,
          'INVALID_STATUS'
        );
      }
      notifications = notifications.filter(notif => notif.status === status);
    }
    
    // Filter by type
    if (type) {
      const allowedTypes = ['info', 'warning', 'error', 'success'];
      if (!allowedTypes.includes(type)) {
        throw new APIError(
          `Geçersiz tip. İzin verilen tipler: ${allowedTypes.join(', ')}`,
          400,
          'INVALID_TYPE'
        );
      }
      notifications = notifications.filter(notif => notif.type === type);
    }
    
    // Pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedNotifications = notifications.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      message: 'Bildirimler başarıyla alındı',
      data: {
        notifications: paginatedNotifications,
        pagination: {
          total: notifications.length,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(notifications.length / limitNum),
          hasNext: endIndex < notifications.length,
          hasPrev: pageNum > 1
        }
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Bildirimler alınırken bir hata oluştu',
      500,
      'NOTIFICATIONS_FETCH_ERROR'
    );
  }
}));

// Mark notification as read
app.put('/api/notifications/:id/read', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || id.trim() === '') {
      throw new APIError(
        'Bildirim ID\'si gerekli',
        400,
        'MISSING_NOTIFICATION_ID'
      );
    }
    
    const sanitizedId = sanitizeInput(id);
    const notification = mockData.notifications.find(notif => notif.id === sanitizedId);
    
    if (!notification) {
      throw new APIError(
        'Bildirim bulunamadı',
        404,
        'NOTIFICATION_NOT_FOUND'
      );
    }
    
    // Update notification status
    notification.status = 'read';
    notification.readAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Bildirim okundu olarak işaretlendi',
      data: {
        notification: {
          id: notification.id,
          status: notification.status,
          readAt: notification.readAt
        }
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Bildirim güncellenirken bir hata oluştu',
      500,
      'NOTIFICATION_UPDATE_ERROR'
    );
  }
}));

// =============================================================================
// COMPANIES ENDPOINTS
// =============================================================================

// Get companies
app.get('/api/companies', asyncHandler(async (req, res) => {
  try {
    const companies = mockData.companies || [];
    
    if (companies.length === 0) {
      throw new APIError(
        'Şirket verileri bulunamadı',
        404,
        'COMPANIES_NOT_FOUND'
      );
    }
    
    res.json({
      success: true,
      message: 'Şirketler başarıyla alındı',
      data: {
        companies
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Şirketler alınırken bir hata oluştu',
      500,
      'COMPANIES_FETCH_ERROR'
    );
  }
}));

// Get company by ID
app.get('/api/companies/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || id.trim() === '') {
      throw new APIError(
        'Şirket ID\'si gerekli',
        400,
        'MISSING_COMPANY_ID'
      );
    }
    
    const sanitizedId = sanitizeInput(id);
    const company = mockData.companies.find(comp => comp.id === sanitizedId);
    
    if (!company) {
      throw new APIError(
        'Şirket bulunamadı',
        404,
        'COMPANY_NOT_FOUND'
      );
    }
    
    res.json({
      success: true,
      message: 'Şirket bilgileri başarıyla alındı',
      data: {
        company
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Şirket bilgileri alınırken bir hata oluştu',
      500,
      'COMPANY_FETCH_ERROR'
    );
  }
}));

// =============================================================================
// USERS ENDPOINTS
// =============================================================================

// Get users
app.get('/api/users', asyncHandler(async (req, res) => {
  try {
    const users = mockData.users || [];
    
    if (users.length === 0) {
      throw new APIError(
        'Kullanıcı verileri bulunamadı',
        404,
        'USERS_NOT_FOUND'
      );
    }
    
    // Remove sensitive data
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    res.json({
      success: true,
      message: 'Kullanıcılar başarıyla alındı',
      data: {
        users: safeUsers
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Kullanıcılar alınırken bir hata oluştu',
      500,
      'USERS_FETCH_ERROR'
    );
  }
}));

// Get user by ID
app.get('/api/users/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || id.trim() === '') {
      throw new APIError(
        'Kullanıcı ID\'si gerekli',
        400,
        'MISSING_USER_ID'
      );
    }
    
    const sanitizedId = sanitizeInput(id);
    const user = mockData.users.find(u => u.id === sanitizedId);
    
    if (!user) {
      throw new APIError(
        'Kullanıcı bulunamadı',
        404,
        'USER_NOT_FOUND'
      );
    }
    
    // Remove sensitive data
    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.json({
      success: true,
      message: 'Kullanıcı bilgileri başarıyla alındı',
      data: {
        user: safeUser
      },
      requestId: req.requestId
    });
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'Kullanıcı bilgileri alınırken bir hata oluştu',
      500,
      'USER_FETCH_ERROR'
    );
  }
}));

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/health', asyncHandler(async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      mockData: {
        users: mockData.users?.length || 0,
        companies: mockData.companies?.length || 0,
        documents: mockData.documents?.length || 0,
        categories: mockData.categories?.length || 0,
        notifications: mockData.notifications?.length || 0
      }
    };
    
    res.json({
      success: true,
      message: 'Sistem sağlıklı',
      data: healthData,
      requestId: req.requestId
    });
    
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Sistem sağlık kontrolü başarısız',
      error: error.message,
      requestId: req.requestId
    });
  }
}));

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
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`
🚀 Claude Talimat Mock API Server Started!

📍 Server running on: http://localhost:${PORT}
📊 Health check: http://localhost:${PORT}/health
🔒 Rate limiting: 100 requests per 15 minutes
🌐 CORS: Configured for development and production

🔗 Available endpoints:
   POST /api/auth/login          - Kullanıcı girişi
   POST /api/auth/register       - Kullanıcı kaydı
   GET  /api/auth/me             - Mevcut kullanıcı bilgileri
   GET  /api/documents           - Doküman listesi (filtreleme, arama, sayfalama)
   GET  /api/documents/:id       - Doküman detayı
   POST /api/documents/upload    - Doküman yükleme
   PUT  /api/documents/:id       - Doküman güncelleme
   DELETE /api/documents/:id     - Doküman silme (soft delete)
   GET  /api/documents/categories - Doküman kategorileri
   GET  /api/analytics/dashboard - Dashboard verileri
   GET  /api/analytics/events    - Etkinlik logları
   GET  /api/analytics/user-activity - Kullanıcı aktiviteleri
   GET  /api/analytics/company-metrics - Şirket metrikleri
   GET  /api/notifications       - Bildirimler
   PUT  /api/notifications/:id/read - Bildirimi okundu işaretle
   GET  /api/companies           - Şirket listesi
   GET  /api/companies/:id       - Şirket detayı
   GET  /api/users               - Kullanıcı listesi
   GET  /api/users/:id           - Kullanıcı detayı

🧪 Test credentials:
   Email: test1@example.com
   Password: password123

📝 Mock data loaded:
   - ${mockData.users?.length || 0} users
   - ${mockData.companies?.length || 0} companies
   - ${mockData.documents?.length || 0} documents
   - ${mockData.categories?.length || 0} categories
   - ${mockData.notifications?.length || 0} notifications

✨ Enhanced features:
   - Comprehensive error handling with Turkish messages
   - Input validation and sanitization
   - Rate limiting for security
   - Request tracking with unique IDs
   - Consistent API response format
   - Detailed logging and monitoring
  `);
});

// ES module - no need for module.exports
