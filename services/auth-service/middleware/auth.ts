import { Context, Next } from 'oak';
import { create, verify } from 'jwt';
import { config } from '../config.ts';
import { logger } from '../utils/logger.ts';
import { AuthenticationError, AuthorizationError } from './error.ts';
import { Database } from '../database/database.ts';

export interface AuthenticatedContext extends Context {
  user?: {
    id: string;
    phone: string;
    email?: string;
    role: string;
    tenantId?: string;
  };
}

export async function authenticate(ctx: AuthenticatedContext, next: Next): Promise<void> {
  try {
    const authHeader = ctx.request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Bearer token required');
    }
    
    const token = authHeader.substring(7);
    
    // Verify JWT token
    const payload = await verify(token, config.jwt.secret, config.jwt.algorithm);
    
    if (!payload || typeof payload === 'string') {
      throw new AuthenticationError('Invalid token');
    }
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new AuthenticationError('Token expired');
    }
    
    // Verify token in database
    const db = new Database();
    const pool = db.getPool();
    
    if (pool) {
      const client = await pool.connect();
      try {
        const result = await client.queryObject(
          'SELECT user_id, is_active FROM user_sessions WHERE token_hash = $1 AND expires_at > NOW() AND is_active = true',
          [token] // In production, you should hash the token
        );
        
        if (result.rows.length === 0) {
          throw new AuthenticationError('Invalid session');
        }
        
        // Get user details
        const userResult = await client.queryObject(
          'SELECT id, phone, email, role, tenant_id FROM users WHERE id = $1 AND is_active = true',
          [payload.sub]
        );
        
        if (userResult.rows.length === 0) {
          throw new AuthenticationError('User not found');
        }
        
        const user = userResult.rows[0];
        ctx.user = {
          id: user.id,
          phone: user.phone,
          email: user.email,
          role: user.role,
          tenantId: user.tenant_id,
        };
        
        logger.auth('token_verified', user.id, true);
        
      } finally {
        client.release();
      }
    } else {
      // Fallback to JWT payload if database is not available
      ctx.user = {
        id: payload.sub as string,
        phone: payload.phone as string,
        email: payload.email as string,
        role: payload.role as string,
        tenantId: payload.tenantId as string,
      };
    }
    
    await next();
    
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    logger.error('Authentication error', error);
    throw new AuthenticationError('Authentication failed');
  }
}

export function requireRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return async (ctx: AuthenticatedContext, next: Next): Promise<void> => {
    if (!ctx.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    if (!allowedRoles.includes(ctx.user.role)) {
      logger.auth('insufficient_permissions', ctx.user.id, false);
      throw new AuthorizationError(`Required roles: ${allowedRoles.join(', ')}`);
    }
    
    await next();
  };
}

export function requireTenant() {
  return async (ctx: AuthenticatedContext, next: Next): Promise<void> => {
    if (!ctx.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    if (!ctx.user.tenantId) {
      throw new AuthorizationError('Tenant access required');
    }
    
    await next();
  };
}

export function optionalAuth(ctx: AuthenticatedContext, next: Next): Promise<void> {
  const authHeader = ctx.request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  return authenticate(ctx, next);
}
