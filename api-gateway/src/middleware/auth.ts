import { Context, Next } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';
import { logger } from '../logger.ts';

interface AuthConfig {
  jwtSecret: string;
  jwtAlgorithm: string;
  authServiceUrl: string;
  cacheTimeout: number;
}

interface User {
  id: string;
  phone: string;
  email?: string;
  role: string;
  tenantId?: string;
  permissions?: string[];
}

interface AuthCache {
  user: User;
  expires: number;
}

export class AuthMiddleware {
  private config: AuthConfig;
  private cache = new Map<string, AuthCache>();

  constructor() {
    this.config = {
      jwtSecret: Deno.env.get('JWT_SECRET') || 'your-secret-key',
      jwtAlgorithm: 'HS256',
      authServiceUrl: Deno.env.get('AUTH_SERVICE_URL') || 'http://auth-service:8003',
      cacheTimeout: 300000 // 5 minutes
    };

    // Cleanup expired cache entries every minute
    setInterval(() => this.cleanupCache(), 60000);
  }

  middleware() {
    return async (ctx: Context, next: Next) => {
      try {
        const authHeader = ctx.request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          ctx.response.status = 401;
          ctx.response.body = { error: 'Bearer token required' };
          return;
        }

        const token = authHeader.substring(7);
        const user = await this.authenticate(token);
        
        if (!user) {
          ctx.response.status = 401;
          ctx.response.body = { error: 'Invalid or expired token' };
          return;
        }

        // Add user to context
        (ctx as any).user = user;
        
        // Add user info to request headers for downstream services
        ctx.request.headers.set('X-User-ID', user.id);
        ctx.request.headers.set('X-User-Role', user.role);
        if (user.tenantId) {
          ctx.request.headers.set('X-Tenant-ID', user.tenantId);
        }

        await next();
      } catch (error) {
        logger.error('Authentication error', { error: error.message });
        ctx.response.status = 401;
        ctx.response.body = { error: 'Authentication failed' };
      }
    };
  }

  private async authenticate(token: string): Promise<User | null> {
    try {
      // Check cache first
      const cached = this.cache.get(token);
      if (cached && cached.expires > Date.now()) {
        return cached.user;
      }

      // Verify JWT token
      const payload = await verify(token, this.config.jwtSecret, this.config.jwtAlgorithm);
      
      if (!payload || typeof payload === 'string') {
        return null;
      }

      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return null;
      }

      // Get user details from auth service
      const user = await this.getUserFromAuthService(token);
      
      if (user) {
        // Cache the result
        this.cache.set(token, {
          user,
          expires: Date.now() + this.config.cacheTimeout
        });
      }

      return user;
    } catch (error) {
      logger.error('Token verification failed', { error: error.message });
      return null;
    }
  }

  private async getUserFromAuthService(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.config.authServiceUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      return {
        id: data.id,
        phone: data.phone,
        email: data.email,
        role: data.role,
        tenantId: data.tenantId,
        permissions: data.permissions || []
      };
    } catch (error) {
      logger.error('Failed to get user from auth service', { error: error.message });
      return null;
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    let removed = 0;

    for (const [token, entry] of this.cache) {
      if (entry.expires <= now) {
        this.cache.delete(token);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug('Cleaned up expired auth cache entries', { removed });
    }
  }

  // Admin methods
  invalidateToken(token: string): void {
    this.cache.delete(token);
    logger.info('Token invalidated', { token: token.substring(0, 10) + '...' });
  }

  invalidateUser(userId: string): void {
    let removed = 0;
    
    for (const [token, entry] of this.cache) {
      if (entry.user.id === userId) {
        this.cache.delete(token);
        removed++;
      }
    }

    if (removed > 0) {
      logger.info('User tokens invalidated', { userId, removed });
    }
  }

  getCacheStats(): any {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (entry.expires > now) {
        valid++;
      } else {
        expired++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired
    };
  }

  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Auth cache cleared', { entries: size });
  }
}
