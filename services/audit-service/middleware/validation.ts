import { Context, Next } from 'https://deno.land/x/oak@v11.1.0/mod.ts';
import { logger } from '../utils/logger.ts';

/**
 * Rate limiting storage
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(maxRequests: number, windowMs: number) {
  return async (ctx: Context, next: Next) => {
    const clientId = ctx.request.ip || 'unknown';
    const now = Date.now();
    
    const key = `rate_limit:${clientId}`;
    const current = rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      await next();
      return;
    }
    
    if (current.count >= maxRequests) {
      logger.warn('Rate limit exceeded', { clientId, count: current.count });
      ctx.response.status = 429;
      ctx.response.body = {
        error: 'rate_limit_exceeded',
        message: 'Too many requests'
      };
      return;
    }
    
    current.count++;
    await next();
  };
}

/**
 * Security headers middleware
 */
export async function securityHeadersMiddleware(ctx: Context, next: Next) {
  ctx.response.headers.set('X-Content-Type-Options', 'nosniff');
  ctx.response.headers.set('X-Frame-Options', 'DENY');
  ctx.response.headers.set('X-XSS-Protection', '1; mode=block');
  ctx.response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  ctx.response.headers.set('Content-Security-Policy', "default-src 'self'");
  ctx.response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  await next();
}

/**
 * Request logging middleware
 */
export async function requestLoggingMiddleware(ctx: Context, next: Next) {
  const start = Date.now();
  const method = ctx.request.method;
  const url = ctx.request.url.toString();
  const userAgent = ctx.request.headers.get('User-Agent') || 'Unknown';
  const ip = ctx.request.ip || 'Unknown';
  
  logger.debug('Request started', { method, url, userAgent, ip });
  
  await next();
  
  const duration = Date.now() - start;
  const status = ctx.response.status;
  
  logger.info('Request completed', { 
    method, 
    url, 
    status, 
    duration: `${duration}ms`,
    userAgent,
    ip
  });
}

/**
 * Input validation middleware
 */
export function validateInputMiddleware(type: string) {
  return async (ctx: Context, next: Next) => {
    try {
      if (ctx.request.method === 'POST' || ctx.request.method === 'PUT') {
        const body = await ctx.request.body().value;
        
        if (type === 'audit') {
          // Audit specific validation
          if (body.eventType && typeof body.eventType !== 'string') {
            ctx.response.status = 400;
            ctx.response.body = {
              error: 'invalid_event_type',
              message: 'eventType must be a string'
            };
            return;
          }
          
          if (body.severity && typeof body.severity !== 'string') {
            ctx.response.status = 400;
            ctx.response.body = {
              error: 'invalid_severity',
              message: 'severity must be a string'
            };
            return;
          }
          
          if (body.details && typeof body.details !== 'object') {
            ctx.response.status = 400;
            ctx.response.body = {
              error: 'invalid_details',
              message: 'details must be an object'
            };
            return;
          }
        }
        
        ctx.state.validatedData = body;
      }
      
      await next();
    } catch (error) {
      logger.error('Input validation error', error);
      ctx.response.status = 400;
      ctx.response.body = {
        error: 'invalid_request',
        message: 'Invalid request format'
      };
    }
  };
}

/**
 * Input sanitization middleware
 */
export async function sanitizeInputMiddleware(ctx: Context, next: Next) {
  try {
    if (ctx.request.method === 'POST' || ctx.request.method === 'PUT') {
      const body = ctx.state.validatedData || await ctx.request.body().value;
      
      // Basic sanitization
      const sanitizedData = sanitizeObject(body);
      ctx.state.sanitizedData = sanitizedData;
    }
    
    await next();
  } catch (error) {
    logger.error('Input sanitization error', error);
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'invalid_request',
      message: 'Invalid request data'
    };
  }
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return obj
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Audit logging middleware for other services
 */
export function auditMiddleware(service: string) {
  return async (ctx: Context, next: Next) => {
    const start = Date.now();
    const method = ctx.request.method;
    const url = ctx.request.url.toString();
    const userAgent = ctx.request.headers.get('User-Agent') || 'Unknown';
    const ip = ctx.request.ip || 'Unknown';
    const userId = ctx.state.user?.id || ctx.state.apiKey?.userId;
    
    try {
      await next();
      
      // Log successful request
      const duration = Date.now() - start;
      logger.audit('api_request', userId || 'anonymous', true, {
        service,
        method,
        url,
        duration,
        ip,
        userAgent,
        status: ctx.response.status
      });
      
    } catch (error) {
      // Log failed request
      const duration = Date.now() - start;
      logger.audit('api_request', userId || 'anonymous', false, {
        service,
        method,
        url,
        duration,
        ip,
        userAgent,
        error: error.message
      });
      
      throw error;
    }
  };
}
