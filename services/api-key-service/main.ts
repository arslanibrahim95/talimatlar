import { Application, Router } from 'https://deno.land/x/oak@v11.1.0/mod.ts';
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { logger } from './utils/logger.ts';
import { 
  validateInputMiddleware, 
  sanitizeInputMiddleware, 
  securityHeadersMiddleware,
  requestLoggingMiddleware,
  rateLimit
} from './middleware/validation.ts';
import { Database } from './database/database.ts';
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts';

/**
 * API Key Management Service
 * Provides secure API key generation, validation, and management
 */

// API Key Configuration
const API_KEY_CONFIG = {
  keyLength: 64,
  prefixLength: 8,
  maxKeysPerUser: 10,
  defaultExpiryDays: 365,
  rotationWarningDays: 30
};

// In-memory storage for API keys
const apiKeys = new Map();
const keyUsage = new Map();
const keyRotations = new Map();

/**
 * Generate secure API key
 */
const generateApiKey = (): { key: string; hash: string; prefix: string } => {
  const key = generateRandomString(API_KEY_CONFIG.keyLength);
  const prefix = key.substring(0, API_KEY_CONFIG.prefixLength);
  const hash = crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  
  return {
    key,
    hash: Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join(''),
    prefix
  };
};

/**
 * Generate random string
 */
const generateRandomString = (length: number): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Hash API key for storage
 */
const hashApiKey = async (key: string): Promise<string> => {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate API key format
 */
const validateApiKeyFormat = (key: string): boolean => {
  return /^[a-f0-9]{64}$/.test(key);
};

/**
 * Check if API key is expired
 */
const isApiKeyExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};

/**
 * Check if API key needs rotation warning
 */
const needsRotationWarning = (expiresAt: Date): boolean => {
  const warningDate = new Date(expiresAt.getTime() - (API_KEY_CONFIG.rotationWarningDays * 24 * 60 * 60 * 1000));
  return new Date() >= warningDate;
};

/**
 * Record API key usage
 */
const recordKeyUsage = (keyId: string, endpoint: string, method: string, ip: string) => {
  const usage = keyUsage.get(keyId) || {
    totalRequests: 0,
    lastUsed: null,
    endpoints: new Set(),
    ips: new Set()
  };
  
  usage.totalRequests++;
  usage.lastUsed = new Date().toISOString();
  usage.endpoints.add(`${method} ${endpoint}`);
  usage.ips.add(ip);
  
  keyUsage.set(keyId, usage);
};

const app = new Application();
const router = new Router();

/**
 * CORS middleware configuration
 */
app.use(oakCors({
  origin: (origin) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://yourdomain.com'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      return true;
    }
    
    return false;
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
}));

/**
 * Security middleware
 */
app.use(securityHeadersMiddleware);
app.use(requestLoggingMiddleware);
app.use(rateLimit(100, 15 * 60 * 1000));
app.use(validateInputMiddleware('api-key'));
app.use(sanitizeInputMiddleware);

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    logger.error('API Key service error:', error);
    ctx.response.status = 500;
    ctx.response.body = { 
      error: 'internal_server_error',
      message: 'Internal server error'
    };
  }
});

/**
 * API Key Authentication Middleware
 */
const authenticateApiKey = async (ctx: Context, next: Next) => {
  const apiKey = ctx.request.headers.get('X-API-Key');
  
  if (!apiKey) {
    ctx.response.status = 401;
    ctx.response.body = {
      error: 'missing_api_key',
      message: 'API key required'
    };
    return;
  }
  
  if (!validateApiKeyFormat(apiKey)) {
    ctx.response.status = 401;
    ctx.response.body = {
      error: 'invalid_api_key_format',
      message: 'Invalid API key format'
    };
    return;
  }
  
  const keyHash = await hashApiKey(apiKey);
  const keyData = apiKeys.get(keyHash);
  
  if (!keyData) {
    ctx.response.status = 401;
    ctx.response.body = {
      error: 'invalid_api_key',
      message: 'Invalid API key'
    };
    return;
  }
  
  if (isApiKeyExpired(keyData.expiresAt)) {
    ctx.response.status = 401;
    ctx.response.body = {
      error: 'api_key_expired',
      message: 'API key has expired'
    };
    return;
  }
  
  if (!keyData.isActive) {
    ctx.response.status = 401;
    ctx.response.body = {
      error: 'api_key_inactive',
      message: 'API key is inactive'
    };
    return;
  }
  
  // Record usage
  recordKeyUsage(keyData.id, ctx.request.url.pathname, ctx.request.method, ctx.request.ip || 'unknown');
  
  // Add key info to context
  ctx.state.apiKey = keyData;
  
  await next();
};

/**
 * Create API Key
 * POST /api-keys
 */
router.post('/api-keys', async (ctx) => {
  try {
    const body = ctx.state.sanitizedData;
    const { name, description, expiresInDays, scopes, userId } = body;
    
    // Validate required fields
    if (!name || !userId) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'missing_required_fields',
        message: 'Name and userId are required'
      };
      return;
    }
    
    // Check user's existing API keys
    const userKeys = Array.from(apiKeys.values()).filter(key => key.userId === userId);
    if (userKeys.length >= API_KEY_CONFIG.maxKeysPerUser) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'key_limit_exceeded',
        message: `Maximum ${API_KEY_CONFIG.maxKeysPerUser} API keys allowed per user`
      };
      return;
    }
    
    // Generate API key
    const { key, hash, prefix } = generateApiKey();
    
    // Calculate expiry date
    const expiresIn = expiresInDays || API_KEY_CONFIG.defaultExpiryDays;
    const expiresAt = new Date(Date.now() + (expiresIn * 24 * 60 * 60 * 1000));
    
    // Create key data
    const keyData = {
      id: crypto.randomUUID(),
      name,
      description: description || '',
      keyHash: hash,
      prefix,
      userId,
      scopes: scopes || ['read'],
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastUsed: null,
      totalRequests: 0
    };
    
    // Store key (hash as key for security)
    apiKeys.set(hash, keyData);
    
    logger.info('API key created', { 
      keyId: keyData.id, 
      userId, 
      name,
      scopes: keyData.scopes 
    });
    
    ctx.response.status = 201;
    ctx.response.body = {
      id: keyData.id,
      name: keyData.name,
      description: keyData.description,
      key, // Only returned once
      prefix: keyData.prefix,
      scopes: keyData.scopes,
      expiresAt: keyData.expiresAt,
      createdAt: keyData.createdAt
    };
    
  } catch (error) {
    logger.error('Create API key error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'creation_failed',
      message: 'Failed to create API key'
    };
  }
});

/**
 * List API Keys
 * GET /api-keys
 */
router.get('/api-keys', async (ctx) => {
  try {
    const userId = ctx.request.url.searchParams.get('userId');
    
    if (!userId) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'missing_user_id',
        message: 'userId parameter is required'
      };
      return;
    }
    
    const userKeys = Array.from(apiKeys.values())
      .filter(key => key.userId === userId)
      .map(key => ({
        id: key.id,
        name: key.name,
        description: key.description,
        prefix: key.prefix,
        scopes: key.scopes,
        isActive: key.isActive,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
        lastUsed: key.lastUsed,
        totalRequests: key.totalRequests,
        needsRotation: needsRotationWarning(new Date(key.expiresAt))
      }));
    
    ctx.response.body = {
      keys: userKeys,
      count: userKeys.length
    };
    
  } catch (error) {
    logger.error('List API keys error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'list_failed',
      message: 'Failed to list API keys'
    };
  }
});

/**
 * Get API Key Details
 * GET /api-keys/:id
 */
router.get('/api-keys/:id', async (ctx) => {
  try {
    const keyId = ctx.params.id;
    const userId = ctx.request.url.searchParams.get('userId');
    
    if (!userId) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'missing_user_id',
        message: 'userId parameter is required'
      };
      return;
    }
    
    const keyData = Array.from(apiKeys.values()).find(key => key.id === keyId && key.userId === userId);
    
    if (!keyData) {
      ctx.response.status = 404;
      ctx.response.body = {
        error: 'key_not_found',
        message: 'API key not found'
      };
      return;
    }
    
    const usage = keyUsage.get(keyId) || {
      totalRequests: 0,
      lastUsed: null,
      endpoints: [],
      ips: []
    };
    
    ctx.response.body = {
      id: keyData.id,
      name: keyData.name,
      description: keyData.description,
      prefix: keyData.prefix,
      scopes: keyData.scopes,
      isActive: keyData.isActive,
      createdAt: keyData.createdAt,
      expiresAt: keyData.expiresAt,
      lastUsed: keyData.lastUsed,
      totalRequests: keyData.totalRequests,
      needsRotation: needsRotationWarning(new Date(keyData.expiresAt)),
      usage: {
        totalRequests: usage.totalRequests,
        lastUsed: usage.lastUsed,
        endpoints: Array.from(usage.endpoints),
        ips: Array.from(usage.ips)
      }
    };
    
  } catch (error) {
    logger.error('Get API key error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'get_failed',
      message: 'Failed to get API key'
    };
  }
});

/**
 * Update API Key
 * PUT /api-keys/:id
 */
router.put('/api-keys/:id', async (ctx) => {
  try {
    const keyId = ctx.params.id;
    const body = ctx.state.sanitizedData;
    const { name, description, scopes, isActive, userId } = body;
    
    if (!userId) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'missing_user_id',
        message: 'userId is required'
      };
      return;
    }
    
    const keyData = Array.from(apiKeys.values()).find(key => key.id === keyId && key.userId === userId);
    
    if (!keyData) {
      ctx.response.status = 404;
      ctx.response.body = {
        error: 'key_not_found',
        message: 'API key not found'
      };
      return;
    }
    
    // Update fields
    if (name !== undefined) keyData.name = name;
    if (description !== undefined) keyData.description = description;
    if (scopes !== undefined) keyData.scopes = scopes;
    if (isActive !== undefined) keyData.isActive = isActive;
    
    // Update in storage
    apiKeys.set(keyData.keyHash, keyData);
    
    logger.info('API key updated', { keyId, userId, updates: body });
    
    ctx.response.body = {
      id: keyData.id,
      name: keyData.name,
      description: keyData.description,
      prefix: keyData.prefix,
      scopes: keyData.scopes,
      isActive: keyData.isActive,
      createdAt: keyData.createdAt,
      expiresAt: keyData.expiresAt,
      lastUsed: keyData.lastUsed,
      totalRequests: keyData.totalRequests
    };
    
  } catch (error) {
    logger.error('Update API key error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'update_failed',
      message: 'Failed to update API key'
    };
  }
});

/**
 * Rotate API Key
 * POST /api-keys/:id/rotate
 */
router.post('/api-keys/:id/rotate', async (ctx) => {
  try {
    const keyId = ctx.params.id;
    const body = ctx.state.sanitizedData;
    const { userId } = body;
    
    if (!userId) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'missing_user_id',
        message: 'userId is required'
      };
      return;
    }
    
    const keyData = Array.from(apiKeys.values()).find(key => key.id === keyId && key.userId === userId);
    
    if (!keyData) {
      ctx.response.status = 404;
      ctx.response.body = {
        error: 'key_not_found',
        message: 'API key not found'
      };
      return;
    }
    
    // Generate new key
    const { key, hash, prefix } = generateApiKey();
    
    // Store rotation record
    keyRotations.set(keyId, {
      oldKeyHash: keyData.keyHash,
      newKeyHash: hash,
      rotatedAt: new Date().toISOString(),
      rotatedBy: userId
    });
    
    // Update key data
    keyData.keyHash = hash;
    keyData.prefix = prefix;
    keyData.lastRotated = new Date().toISOString();
    
    // Remove old key from storage
    apiKeys.delete(keyData.keyHash);
    // Add new key to storage
    apiKeys.set(hash, keyData);
    
    logger.info('API key rotated', { keyId, userId });
    
    ctx.response.body = {
      id: keyData.id,
      name: keyData.name,
      description: keyData.description,
      key, // New key (only returned once)
      prefix: keyData.prefix,
      scopes: keyData.scopes,
      expiresAt: keyData.expiresAt,
      lastRotated: keyData.lastRotated
    };
    
  } catch (error) {
    logger.error('Rotate API key error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'rotation_failed',
      message: 'Failed to rotate API key'
    };
  }
});

/**
 * Delete API Key
 * DELETE /api-keys/:id
 */
router.delete('/api-keys/:id', async (ctx) => {
  try {
    const keyId = ctx.params.id;
    const userId = ctx.request.url.searchParams.get('userId');
    
    if (!userId) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'missing_user_id',
        message: 'userId parameter is required'
      };
      return;
    }
    
    const keyData = Array.from(apiKeys.values()).find(key => key.id === keyId && key.userId === userId);
    
    if (!keyData) {
      ctx.response.status = 404;
      ctx.response.body = {
        error: 'key_not_found',
        message: 'API key not found'
      };
      return;
    }
    
    // Remove from storage
    apiKeys.delete(keyData.keyHash);
    keyUsage.delete(keyId);
    
    logger.info('API key deleted', { keyId, userId });
    
    ctx.response.status = 204;
    
  } catch (error) {
    logger.error('Delete API key error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'delete_failed',
      message: 'Failed to delete API key'
    };
  }
});

/**
 * Validate API Key (for other services)
 * POST /api-keys/validate
 */
router.post('/api-keys/validate', async (ctx) => {
  try {
    const body = ctx.state.sanitizedData;
    const { key, requiredScopes } = body;
    
    if (!key) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'missing_api_key',
        message: 'API key is required'
      };
      return;
    }
    
    if (!validateApiKeyFormat(key)) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'invalid_api_key_format',
        message: 'Invalid API key format'
      };
      return;
    }
    
    const keyHash = await hashApiKey(key);
    const keyData = apiKeys.get(keyHash);
    
    if (!keyData) {
      ctx.response.status = 401;
      ctx.response.body = {
        valid: false,
        error: 'invalid_api_key'
      };
      return;
    }
    
    if (isApiKeyExpired(keyData.expiresAt)) {
      ctx.response.status = 401;
      ctx.response.body = {
        valid: false,
        error: 'api_key_expired'
      };
      return;
    }
    
    if (!keyData.isActive) {
      ctx.response.status = 401;
      ctx.response.body = {
        valid: false,
        error: 'api_key_inactive'
      };
      return;
    }
    
    // Check required scopes
    if (requiredScopes && !requiredScopes.every(scope => keyData.scopes.includes(scope))) {
      ctx.response.status = 403;
      ctx.response.body = {
        valid: false,
        error: 'insufficient_scope',
        message: 'API key does not have required scopes'
      };
      return;
    }
    
    // Record usage
    recordKeyUsage(keyData.id, ctx.request.url.pathname, ctx.request.method, ctx.request.ip || 'unknown');
    
    ctx.response.body = {
      valid: true,
      keyId: keyData.id,
      userId: keyData.userId,
      scopes: keyData.scopes,
      name: keyData.name
    };
    
  } catch (error) {
    logger.error('Validate API key error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'validation_failed',
      message: 'Failed to validate API key'
    };
  }
});

/**
 * Health check
 */
router.get('/health', (ctx) => {
  ctx.response.body = {
    status: 'healthy',
    service: 'API Key Service',
    timestamp: new Date().toISOString(),
    totalKeys: apiKeys.size,
    totalRotations: keyRotations.size
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

// Start server
const PORT = Deno.env.get('PORT') || 8009;
console.log(`🚀 API Key Service starting on port ${PORT}`);
await app.listen({ port: parseInt(PORT) });
console.log(`✅ API Key Service running on port ${PORT}`);
