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
 * Data Encryption Service
 * Provides encryption and decryption capabilities for sensitive data at rest
 */

// Encryption Configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12, // 96 bits for GCM
  tagLength: 16, // 128 bits for GCM
  keyDerivationIterations: 100000
};

// Encryption key storage (in production, use secure key management)
const encryptionKeys = new Map<string, CryptoKey>();

/**
 * Generate encryption key
 */
const generateEncryptionKey = async (): Promise<CryptoKey> => {
  return await crypto.subtle.generateKey(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      length: ENCRYPTION_CONFIG.keyLength
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
};

/**
 * Derive key from password using PBKDF2
 */
const deriveKeyFromPassword = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ENCRYPTION_CONFIG.keyDerivationIterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: ENCRYPTION_CONFIG.algorithm,
      length: ENCRYPTION_CONFIG.keyLength
    },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Generate random salt
 */
const generateSalt = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(16));
};

/**
 * Generate random IV
 */
const generateIV = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));
};

/**
 * Encrypt data
 */
const encryptData = async (data: string, key: CryptoKey): Promise<{
  encryptedData: string;
  iv: string;
  salt?: string;
}> => {
  const iv = generateIV();
  const encodedData = new TextEncoder().encode(data);
  
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      iv: iv
    },
    key,
    encodedData
  );
  
  return {
    encryptedData: Array.from(new Uint8Array(encryptedData), b => b.toString(16).padStart(2, '0')).join(''),
    iv: Array.from(iv, b => b.toString(16).padStart(2, '0')).join('')
  };
};

/**
 * Decrypt data
 */
const decryptData = async (encryptedData: string, iv: string, key: CryptoKey): Promise<string> => {
  const encryptedArray = new Uint8Array(
    encryptedData.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  const ivArray = new Uint8Array(
    iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: ENCRYPTION_CONFIG.algorithm,
      iv: ivArray
    },
    key,
    encryptedArray
  );
  
  return new TextDecoder().decode(decryptedData);
};

/**
 * Hash data for integrity checking
 */
const hashData = async (data: string): Promise<string> => {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
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
app.use(validateInputMiddleware('encryption'));
app.use(sanitizeInputMiddleware);

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    logger.error('Encryption service error:', error);
    ctx.response.status = 500;
    ctx.response.body = { 
      error: 'internal_server_error',
      message: 'Internal server error'
    };
  }
});

/**
 * Encrypt Data
 * POST /encrypt
 */
router.post('/encrypt', async (ctx) => {
  try {
    const body = ctx.state.sanitizedData;
    const { data, keyId, password } = body;
    
    if (!data) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'missing_data',
        message: 'Data to encrypt is required'
      };
      return;
    }
    
    let key: CryptoKey;
    
    if (keyId) {
      // Use existing key
      key = encryptionKeys.get(keyId);
      if (!key) {
        ctx.response.status = 404;
        ctx.response.body = {
          error: 'key_not_found',
          message: 'Encryption key not found'
        };
        return;
      }
    } else if (password) {
      // Derive key from password
      const salt = generateSalt();
      key = await deriveKeyFromPassword(password, salt);
    } else {
      // Generate new key
      key = await generateEncryptionKey();
      const keyId = crypto.randomUUID();
      encryptionKeys.set(keyId, key);
    }
    
    // Encrypt data
    const result = await encryptData(data, key);
    
    // Generate hash for integrity
    const hash = await hashData(data);
    
    logger.info('Data encrypted', { 
      keyId: keyId || 'password-derived',
      dataLength: data.length,
      hash: hash.substring(0, 8) + '...'
    });
    
    ctx.response.body = {
      encryptedData: result.encryptedData,
      iv: result.iv,
      salt: result.salt,
      hash: hash,
      keyId: keyId || null,
      algorithm: ENCRYPTION_CONFIG.algorithm
    };
    
  } catch (error) {
    logger.error('Encrypt data error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'encryption_failed',
      message: 'Failed to encrypt data'
    };
  }
});

/**
 * Decrypt Data
 * POST /decrypt
 */
router.post('/decrypt', async (ctx) => {
  try {
    const body = ctx.state.sanitizedData;
    const { encryptedData, iv, keyId, password, salt, expectedHash } = body;
    
    if (!encryptedData || !iv) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'missing_required_fields',
        message: 'encryptedData and iv are required'
      };
      return;
    }
    
    let key: CryptoKey;
    
    if (keyId) {
      // Use existing key
      key = encryptionKeys.get(keyId);
      if (!key) {
        ctx.response.status = 404;
        ctx.response.body = {
          error: 'key_not_found',
          message: 'Encryption key not found'
        };
        return;
      }
    } else if (password && salt) {
      // Derive key from password
      const saltArray = new Uint8Array(
        salt.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
      );
      key = await deriveKeyFromPassword(password, saltArray);
    } else {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'missing_key_info',
        message: 'keyId or password+salt is required'
      };
      return;
    }
    
    // Decrypt data
    const decryptedData = await decryptData(encryptedData, iv, key);
    
    // Verify integrity if hash provided
    if (expectedHash) {
      const actualHash = await hashData(decryptedData);
      if (actualHash !== expectedHash) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: 'integrity_check_failed',
          message: 'Data integrity check failed'
        };
        return;
      }
    }
    
    logger.info('Data decrypted', { 
      keyId: keyId || 'password-derived',
      dataLength: decryptedData.length
    });
    
    ctx.response.body = {
      data: decryptedData,
      algorithm: ENCRYPTION_CONFIG.algorithm
    };
    
  } catch (error) {
    logger.error('Decrypt data error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'decryption_failed',
      message: 'Failed to decrypt data'
    };
  }
});

/**
 * Generate Encryption Key
 * POST /keys/generate
 */
router.post('/keys/generate', async (ctx) => {
  try {
    const body = ctx.state.sanitizedData;
    const { name, description } = body;
    
    // Generate new key
    const key = await generateEncryptionKey();
    const keyId = crypto.randomUUID();
    
    // Store key
    encryptionKeys.set(keyId, key);
    
    logger.info('Encryption key generated', { keyId, name });
    
    ctx.response.status = 201;
    ctx.response.body = {
      keyId: keyId,
      name: name || 'Generated Key',
      description: description || '',
      algorithm: ENCRYPTION_CONFIG.algorithm,
      keyLength: ENCRYPTION_CONFIG.keyLength,
      createdAt: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error('Generate key error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'key_generation_failed',
      message: 'Failed to generate encryption key'
    };
  }
});

/**
 * List Encryption Keys
 * GET /keys
 */
router.get('/keys', async (ctx) => {
  try {
    const keys = Array.from(encryptionKeys.keys()).map(keyId => ({
      keyId: keyId,
      algorithm: ENCRYPTION_CONFIG.algorithm,
      keyLength: ENCRYPTION_CONFIG.keyLength,
      createdAt: new Date().toISOString() // In production, store actual creation time
    }));
    
    ctx.response.body = {
      keys: keys,
      count: keys.length
    };
    
  } catch (error) {
    logger.error('List keys error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'list_failed',
      message: 'Failed to list encryption keys'
    };
  }
});

/**
 * Delete Encryption Key
 * DELETE /keys/:keyId
 */
router.delete('/keys/:keyId', async (ctx) => {
  try {
    const keyId = ctx.params.keyId;
    
    if (!encryptionKeys.has(keyId)) {
      ctx.response.status = 404;
      ctx.response.body = {
        error: 'key_not_found',
        message: 'Encryption key not found'
      };
      return;
    }
    
    encryptionKeys.delete(keyId);
    
    logger.info('Encryption key deleted', { keyId });
    
    ctx.response.status = 204;
    
  } catch (error) {
    logger.error('Delete key error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'delete_failed',
      message: 'Failed to delete encryption key'
    };
  }
});

/**
 * Hash Data
 * POST /hash
 */
router.post('/hash', async (ctx) => {
  try {
    const body = ctx.state.sanitizedData;
    const { data, algorithm = 'SHA-256' } = body;
    
    if (!data) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'missing_data',
        message: 'Data to hash is required'
      };
      return;
    }
    
    const hash = await hashData(data);
    
    logger.info('Data hashed', { 
      algorithm,
      dataLength: data.length,
      hash: hash.substring(0, 8) + '...'
    });
    
    ctx.response.body = {
      hash: hash,
      algorithm: algorithm,
      dataLength: data.length
    };
    
  } catch (error) {
    logger.error('Hash data error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'hashing_failed',
      message: 'Failed to hash data'
    };
  }
});

/**
 * Verify Hash
 * POST /verify-hash
 */
router.post('/verify-hash', async (ctx) => {
  try {
    const body = ctx.state.sanitizedData;
    const { data, expectedHash } = body;
    
    if (!data || !expectedHash) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'missing_required_fields',
        message: 'Data and expectedHash are required'
      };
      return;
    }
    
    const actualHash = await hashData(data);
    const isValid = actualHash === expectedHash;
    
    logger.info('Hash verified', { 
      isValid,
      dataLength: data.length,
      hash: actualHash.substring(0, 8) + '...'
    });
    
    ctx.response.body = {
      isValid: isValid,
      actualHash: actualHash,
      expectedHash: expectedHash
    };
    
  } catch (error) {
    logger.error('Verify hash error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'verification_failed',
      message: 'Failed to verify hash'
    };
  }
});

/**
 * Health check
 */
router.get('/health', (ctx) => {
  ctx.response.body = {
    status: 'healthy',
    service: 'Encryption Service',
    timestamp: new Date().toISOString(),
    totalKeys: encryptionKeys.size,
    algorithm: ENCRYPTION_CONFIG.algorithm,
    keyLength: ENCRYPTION_CONFIG.keyLength
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

// Start server
const PORT = Deno.env.get('PORT') || 8011;
console.log(`🚀 Encryption Service starting on port ${PORT}`);
await app.listen({ port: parseInt(PORT) });
console.log(`✅ Encryption Service running on port ${PORT}`);
