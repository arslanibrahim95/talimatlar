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
        error_description: 'Too many requests'
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
        
        if (type === 'oauth2') {
          // OAuth2 specific validation
          if (body.grant_type && !['authorization_code', 'refresh_token', 'client_credentials'].includes(body.grant_type)) {
            ctx.response.status = 400;
            ctx.response.body = {
              error: 'unsupported_grant_type',
              error_description: 'Unsupported grant type'
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
        error_description: 'Invalid request format'
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
      error_description: 'Invalid request data'
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
 * OAuth2 specific validation
 */
export function validateOAuth2Request(ctx: Context, next: Next) {
  const { response_type, client_id, redirect_uri, scope, state } = ctx.request.url.searchParams;
  
  // Validate required parameters
  if (!response_type || !client_id || !redirect_uri) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'invalid_request',
      error_description: 'Missing required parameters'
    };
    return;
  }
  
  // Validate response type
  if (!['code', 'token', 'id_token'].includes(response_type)) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'unsupported_response_type',
      error_description: 'Unsupported response type'
    };
    return;
  }
  
  // Validate client ID format
  if (!/^[a-zA-Z0-9_-]+$/.test(client_id)) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'invalid_request',
      error_description: 'Invalid client ID format'
    };
    return;
  }
  
  // Validate redirect URI format
  try {
    new URL(redirect_uri);
  } catch {
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'invalid_request',
      error_description: 'Invalid redirect URI format'
    };
    return;
  }
  
  // Validate scope format
  if (scope && !/^[a-zA-Z0-9\s]+$/.test(scope)) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'invalid_scope',
      error_description: 'Invalid scope format'
    };
    return;
  }
  
  next();
}
