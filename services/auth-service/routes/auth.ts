import { Router } from 'oak';
import { z } from 'zod';
import { create } from 'jwt';
import { hash, compare } from 'bcrypt';
import { config } from '../config.ts';
import { logger } from '../utils/logger.ts';
import { Database } from '../database/database.ts';
import { ValidationError, AuthenticationError, ConflictError } from '../middleware/error.ts';
import { authenticate, AuthenticatedContext } from '../middleware/auth.ts';

const router = new Router();

// Validation schemas
const registerSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  email: z.string().email().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  tenantId: z.string().uuid().optional(),
});

const loginSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  password: z.string().min(1, 'Password is required'),
});

const otpRequestSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
});

const otpVerifySchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
});

// Register new user
router.post('/register', async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const validatedData = registerSchema.parse(body);
    
    const db = new Database();
    const pool = db.getPool();
    
    if (!pool) {
      throw new Error('Database not available');
    }
    
    const client = await pool.connect();
    
    try {
      // Check if user already exists
      const existingUser = await client.queryObject(
        'SELECT id FROM users WHERE phone = $1',
        [validatedData.phone]
      );
      
      if (existingUser.rows.length > 0) {
        throw new ConflictError('User with this phone number already exists');
      }
      
      // Hash password
      const passwordHash = await hash(validatedData.password, 12);
      
      // Create user
      const result = await client.queryObject(
        `INSERT INTO users (phone, email, password_hash, tenant_id, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, phone, email, role, tenant_id, created_at`,
        [
          validatedData.phone,
          validatedData.email,
          passwordHash,
          validatedData.tenantId,
          'employee', // Default role
        ]
      );
      
      const user = result.rows[0];
      
      // Generate JWT token
      const token = await create(
        {
          alg: config.jwt.algorithm,
          typ: 'JWT',
        },
        {
          sub: user.id,
          phone: user.phone,
          email: user.email,
          role: user.role,
          tenantId: user.tenant_id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        },
        config.jwt.secret
      );
      
      // Store session
      await client.queryObject(
        `INSERT INTO user_sessions (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
        [user.id, token] // In production, hash the token
      );
      
      logger.auth('user_registered', user.id, true);
      
      ctx.response.status = 201;
      ctx.response.body = {
        message: 'User registered successfully',
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          role: user.role,
        },
        token,
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    if (error instanceof ValidationError || 
        error instanceof ConflictError || 
        error instanceof AuthenticationError) {
      throw error;
    }
    
    logger.error('Registration error', error);
    throw new Error('Registration failed');
  }
});

// Login user
router.post('/login', async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const validatedData = loginSchema.parse(body);
    
    const db = new Database();
    const pool = db.getPool();
    
    if (!pool) {
      throw new Error('Database not available');
    }
    
    const client = await pool.connect();
    
    try {
      // Find user
      const result = await client.queryObject(
        'SELECT id, phone, email, password_hash, role, tenant_id, is_active FROM users WHERE phone = $1',
        [validatedData.phone]
      );
      
      if (result.rows.length === 0) {
        throw new AuthenticationError('Invalid credentials');
      }
      
      const user = result.rows[0];
      
      if (!user.is_active) {
        throw new AuthenticationError('Account is deactivated');
      }
      
      // Verify password
      const isValidPassword = await compare(validatedData.password, user.password_hash);
      
      if (!isValidPassword) {
        logger.auth('login_failed', user.id, false);
        throw new AuthenticationError('Invalid credentials');
      }
      
      // Generate JWT token
      const token = await create(
        {
          alg: config.jwt.algorithm,
          typ: 'JWT',
        },
        {
          sub: user.id,
          phone: user.phone,
          email: user.email,
          role: user.role,
          tenantId: user.tenant_id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        },
        config.jwt.secret
      );
      
      // Store session
      await client.queryObject(
        `INSERT INTO user_sessions (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
        [user.id, token] // In production, hash the token
      );
      
      logger.auth('user_logged_in', user.id, true);
      
      ctx.response.body = {
        message: 'Login successful',
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          role: user.role,
        },
        token,
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthenticationError) {
      throw error;
    }
    
    logger.error('Login error', error);
    throw new Error('Login failed');
  }
});

// Request OTP
router.post('/otp/request', async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const validatedData = otpRequestSchema.parse(body);
    
    // Generate OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    const db = new Database();
    const pool = db.getPool();
    
    if (pool) {
      const client = await pool.connect();
      
      try {
        // Store OTP code
        await client.queryObject(
          `INSERT INTO otp_codes (phone, code, expires_at)
           VALUES ($1, $2, $3)`,
          [validatedData.phone, otpCode, expiresAt]
        );
        
        // TODO: Send SMS with OTP code
        // For now, just log it
        logger.info('OTP code generated', { phone: validatedData.phone, code: otpCode });
        
      } finally {
        client.release();
      }
    }
    
    ctx.response.body = {
      message: 'OTP code sent successfully',
      phone: validatedData.phone,
    };
    
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    logger.error('OTP request error', error);
    throw new Error('OTP request failed');
  }
});

// Verify OTP
router.post('/otp/verify', async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const validatedData = otpVerifySchema.parse(body);
    
    const db = new Database();
    const pool = db.getPool();
    
    if (!pool) {
      throw new Error('Database not available');
    }
    
    const client = await pool.connect();
    
    try {
      // Find and verify OTP
      const result = await client.queryObject(
        `SELECT id FROM otp_codes 
         WHERE phone = $1 AND code = $2 AND expires_at > NOW() AND is_used = false
         ORDER BY created_at DESC LIMIT 1`,
        [validatedData.phone, validatedData.code]
      );
      
      if (result.rows.length === 0) {
        throw new AuthenticationError('Invalid or expired OTP code');
      }
      
      const otpId = result.rows[0].id;
      
      // Mark OTP as used
      await client.queryObject(
        'UPDATE otp_codes SET is_used = true WHERE id = $1',
        [otpId]
      );
      
      // Find or create user
      let userResult = await client.queryObject(
        'SELECT id, phone, email, role, tenant_id FROM users WHERE phone = $1',
        [validatedData.phone]
      );
      
      let user;
      
      if (userResult.rows.length === 0) {
        // Create new user
        const newUserResult = await client.queryObject(
          `INSERT INTO users (phone, role)
           VALUES ($1, $2)
           RETURNING id, phone, email, role, tenant_id`,
          [validatedData.phone, 'employee']
        );
        user = newUserResult.rows[0];
        logger.auth('user_created_via_otp', user.id, true);
      } else {
        user = userResult.rows[0];
      }
      
      // Generate JWT token
      const token = await create(
        {
          alg: config.jwt.algorithm,
          typ: 'JWT',
        },
        {
          sub: user.id,
          phone: user.phone,
          email: user.email,
          role: user.role,
          tenantId: user.tenant_id,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        },
        config.jwt.secret
      );
      
      // Store session
      await client.queryObject(
        `INSERT INTO user_sessions (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
        [user.id, token] // In production, hash the token
      );
      
      logger.auth('otp_verified', user.id, true);
      
      ctx.response.body = {
        message: 'OTP verified successfully',
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          role: user.role,
        },
        token,
      };
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthenticationError) {
      throw error;
    }
    
    logger.error('OTP verification error', error);
    throw new Error('OTP verification failed');
  }
});

// Logout
router.post('/logout', authenticate, async (ctx: AuthenticatedContext) => {
  try {
    const authHeader = ctx.request.headers.get('Authorization');
    const token = authHeader?.substring(7);
    
    if (token && ctx.user) {
      const db = new Database();
      const pool = db.getPool();
      
      if (pool) {
        const client = await pool.connect();
        
        try {
          // Invalidate session
          await client.queryObject(
            'UPDATE user_sessions SET is_active = false WHERE token_hash = $1',
            [token] // In production, hash the token
          );
          
          logger.auth('user_logged_out', ctx.user.id, true);
          
        } finally {
          client.release();
        }
      }
    }
    
    ctx.response.body = {
      message: 'Logout successful',
    };
    
  } catch (error) {
    logger.error('Logout error', error);
    throw new Error('Logout failed');
  }
});

// Get current user
router.get('/me', authenticate, async (ctx: AuthenticatedContext) => {
  ctx.response.body = {
    user: ctx.user,
  };
});

export { router as authRouter };
