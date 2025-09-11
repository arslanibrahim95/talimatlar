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

/**
 * Secure password hashing using Web Crypto API
 * Creates SHA-256 hash of password for secure storage
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password string
 */
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Verify password against stored hash
 * Compares input password with stored hash for authentication
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns Promise resolving to boolean indicating match
 */
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

/**
 * Secure JWT-like token generator
 * Creates custom tokens with header, payload, and signature
 * @param userId - User ID to include in token
 * @returns Promise resolving to JWT-like token string
 */
const generateToken = async (userId: string): Promise<string> => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    jti: crypto.randomUUID()
  };
  
  // Simple base64 encoding (in production, use proper JWT library)
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = await crypto.subtle.digest('SHA-256', 
    new TextEncoder().encode(encodedHeader + '.' + encodedPayload + '.secret')
  );
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
};

/**
 * Verify JWT-like token
 * Validates token signature and expiration
 * @param token - Token string to verify
 * @returns Promise resolving to verification result with payload
 */
const verifyToken = async (token: string): Promise<{ valid: boolean; payload?: any }> => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false };
    }
    
    const [header, payload, signature] = parts;
    
    // Verify signature
    const expectedSignature = await crypto.subtle.digest('SHA-256',
      new TextEncoder().encode(header + '.' + payload + '.secret')
    );
    const expectedSignatureB64 = btoa(String.fromCharCode(...new Uint8Array(expectedSignature)));
    
    if (signature !== expectedSignatureB64) {
      return { valid: false };
    }
    
    // Decode payload
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check expiration
    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }
    
    return { valid: true, payload: decodedPayload };
  } catch {
    return { valid: false };
  }
};

/**
 * Graceful shutdown handling
 * Ensures clean application termination
 * @param signal - Signal that triggered shutdown
 */
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  Deno.exit(0);
};

// Handle process signals
Deno.addSignalListener("SIGINT", () => gracefulShutdown("SIGINT"));
Deno.addSignalListener("SIGTERM", () => gracefulShutdown("SIGTERM"));

const app = new Application();
const router = new Router();

/**
 * CORS middleware configuration
 * Enables cross-origin requests with security restrictions
 */
app.use(oakCors({
  origin: (origin) => {
    // Allow specific origins or all in development
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

/**
 * Security headers middleware
 * Adds security-related HTTP headers to all responses
 */
app.use(securityHeadersMiddleware);

/**
 * Request logging middleware
 * Logs all incoming requests for monitoring and debugging
 */
app.use(requestLoggingMiddleware);

/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per IP address
 */
app.use(rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

/**
 * Input validation middleware
 * Validates and sanitizes all incoming request data
 */
app.use(validateInputMiddleware('default'));

/**
 * Input sanitization middleware
 * Removes potentially dangerous content from requests
 */
app.use(sanitizeInputMiddleware);

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    logger.error('Unhandled error:', error);
    ctx.response.status = 500;
    ctx.response.body = { 
      error: 'Internal server error',
      message: 'Something went wrong'
    };
  }
});

// In-memory user storage
const users = new Map();
const sessions = new Map();

// Root route
router.get('/', (ctx) => {
  ctx.response.body = {
    service: 'Claude Auth Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      register: 'POST /auth/register',
      login: 'POST /auth/login',
      users: 'GET /auth/users'
    }
  };
});

// Health check
router.get('/health', (ctx) => {
  ctx.response.body = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    users: users.size,
    sessions: sessions.size
  };
});

// Register endpoint with validation and rate limiting
router.post('/auth/register', 
  rateLimit(5, 15 * 60 * 1000), // 5 registrations per 15 minutes
  sanitizeInputMiddleware,
  validateInputMiddleware('register'),
  async (ctx) => {
  try {
    const { phone, email, password } = ctx.state.sanitizedData;

    logger.debug('Register request received:', { phone, email: email ? '***' : null });

    // Validation
    if (!phone || !password) {
      ctx.response.status = 400;
      ctx.response.body = { error: 'Phone and password are required' };
      return;
    }

    if (password.length < 6) {
      ctx.response.status = 400;
      ctx.response.body = { error: 'Password must be at least 6 characters' };
      return;
    }

    // Check if user exists
    if (users.has(phone)) {
      ctx.response.status = 409;
      ctx.response.body = { error: 'User already exists' };
      return;
    }

    // Hash password securely
    const passwordHash = await hashPassword(password);

    // Create user
    const user = {
      id: crypto.randomUUID(),
      phone,
      email: email || null,
      passwordHash,
      role: 'employee',
      createdAt: new Date().toISOString(),
      isActive: true
    };

    users.set(phone, user);

    // Generate secure token
    const token = await generateToken(user.id);

    // Store session
    sessions.set(token, {
      userId: user.id,
      phone: user.phone,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    ctx.response.body = {
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role
      },
      token
    };

    logger.info(`User registered: ${phone}`);
  } catch (error) {
    logger.error('Registration error:', error);
    ctx.response.status = 500;
    ctx.response.body = { 
      error: 'Internal server error',
      message: 'Registration failed'
    };
  }
});

// Login endpoint with validation and rate limiting
router.post('/auth/login',
  rateLimit(10, 15 * 60 * 1000), // 10 login attempts per 15 minutes
  sanitizeInputMiddleware,
  validateInputMiddleware('login'),
  async (ctx) => {
  try {
    const { phone, password } = ctx.state.sanitizedData;

    logger.debug('Login request received:', { phone });

    // Validation
    if (!phone || !password) {
      ctx.response.status = 400;
      ctx.response.body = { error: 'Phone and password are required' };
      return;
    }

    // Check if user exists
    const user = users.get(phone);
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = { error: 'Invalid credentials' };
      return;
    }

    // Verify password securely
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      ctx.response.status = 401;
      ctx.response.body = { error: 'Invalid credentials' };
      return;
    }

    // Generate secure token
    const token = await generateToken(user.id);

    // Store session
    sessions.set(token, {
      userId: user.id,
      phone: user.phone,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    ctx.response.body = {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role
      },
      token
    };

    logger.info(`User logged in: ${phone}`);
  } catch (error) {
    logger.error('Login error:', error);
    ctx.response.status = 500;
    ctx.response.body = { 
      error: 'Internal server error',
      message: 'Login failed'
    };
  }
});

// Get users
router.get('/auth/users', (ctx) => {
  const userList = Array.from(users.values()).map(user => ({
    id: user.id,
    phone: user.phone,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  }));

  ctx.response.body = {
    success: true,
    users: userList,
    count: userList.length
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

// Start server
const PORT = Deno.env.get('PORT') || 8004;
console.log(`🚀 Auth Service starting on port ${PORT}`);
await app.listen({ port: parseInt(PORT) });
console.log(`✅ Auth Service running on port ${PORT}`);
