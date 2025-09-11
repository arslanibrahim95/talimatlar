import { Context, Next } from 'https://deno.land/x/oak@v11.1.0/mod.ts';
import { logger } from '../utils/logger.ts';

/**
 * Input validation middleware for auth service
 */

interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'phone';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

const validationSchemas: Record<string, ValidationSchema> = {
  register: {
    phone: {
      required: true,
      type: 'phone',
      minLength: 10,
      maxLength: 15,
      pattern: /^(\+90|0)?[0-9]{10}$/
    },
    email: {
      type: 'email',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
      required: true,
      type: 'string',
      minLength: 6,
      maxLength: 128,
      custom: (value: string) => {
        if (value.length < 6) {
          return 'Password must be at least 6 characters long';
        }
        if (value.length > 128) {
          return 'Password must be less than 128 characters';
        }
        return true;
      }
    }
  },
  login: {
    phone: {
      required: true,
      type: 'phone',
      minLength: 10,
      maxLength: 15
    },
    password: {
      required: true,
      type: 'string',
      minLength: 1
    }
  }
};

/**
 * Validate input data against schema
 */
const validateInput = (data: any, schema: ValidationSchema): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip validation if field is not provided and not required
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // Type validation
    if (rules.type) {
      switch (rules.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${field} must be a string`);
            continue;
          }
          break;
        case 'number':
          if (typeof value !== 'number' && isNaN(Number(value))) {
            errors.push(`${field} must be a number`);
            continue;
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${field} must be a boolean`);
            continue;
          }
          break;
        case 'email':
          if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors.push(`${field} must be a valid email address`);
            continue;
          }
          break;
        case 'phone':
          if (typeof value !== 'string' || !/^(\+90|0)?[0-9]{10}$/.test(value.replace(/\s/g, ''))) {
            errors.push(`${field} must be a valid phone number`);
            continue;
          }
          break;
      }
    }

    // Length validation for strings
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters long`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push(`${field} format is invalid`);
    }

    // Custom validation
    if (rules.custom) {
      const result = rules.custom(value);
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : `${field} is invalid`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Rate limiting storage
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export const rateLimit = (maxRequests: number = 10, windowMs: number = 15 * 60 * 1000) => {
  return async (ctx: Context, next: Next) => {
    const clientIP = ctx.request.ip || 'unknown';
    const now = Date.now();
    const key = `${clientIP}:${ctx.request.url.pathname}`;

    const current = rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
    } else {
      if (current.count >= maxRequests) {
        ctx.response.status = 429;
        ctx.response.body = {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds.`
        };
        return;
      }
      current.count++;
    }

    await next();
  };
};

/**
 * Input validation middleware
 */
export const validateInputMiddleware = (schemaName: string) => {
  return async (ctx: Context, next: Next) => {
    const schema = validationSchemas[schemaName];
    
    if (!schema) {
      logger.error(`Validation schema '${schemaName}' not found`);
      ctx.response.status = 500;
      ctx.response.body = { error: 'Internal server error' };
      return;
    }

    try {
      const body = await ctx.request.body().value;
      const validation = validateInput(body, schema);

      if (!validation.isValid) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: 'Validation failed',
          details: validation.errors
        };
        return;
      }

      // Add validated data to context
      ctx.state.validatedData = body;
      await next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      ctx.response.status = 400;
      ctx.response.body = { error: 'Invalid request body' };
    }
  };
};

/**
 * Sanitize input data
 */
export const sanitizeInput = (data: any): any => {
  if (typeof data === 'string') {
    // Remove potentially dangerous characters
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return data;
};

/**
 * Sanitization middleware
 */
export const sanitizeInputMiddleware = async (ctx: Context, next: Next) => {
  try {
    const body = await ctx.request.body().value;
    ctx.state.sanitizedData = sanitizeInput(body);
    await next();
  } catch (error) {
    logger.error('Sanitization middleware error:', error);
    ctx.response.status = 400;
    ctx.response.body = { error: 'Invalid request body' };
  }
};

/**
 * Security headers middleware
 */
export const securityHeadersMiddleware = async (ctx: Context, next: Next) => {
  // Set comprehensive security headers
  ctx.response.headers.set('X-Content-Type-Options', 'nosniff');
  ctx.response.headers.set('X-Frame-Options', 'DENY');
  ctx.response.headers.set('X-XSS-Protection', '1; mode=block');
  ctx.response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  ctx.response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  ctx.response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  ctx.response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  ctx.response.headers.set('X-Download-Options', 'noopen');
  ctx.response.headers.set('X-DNS-Prefetch-Control', 'off');
  
  // Comprehensive CSP policy
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' ws: wss:",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  ctx.response.headers.set('Content-Security-Policy', cspPolicy);
  
  await next();
};

/**
 * Request logging middleware
 */
export const requestLoggingMiddleware = async (ctx: Context, next: Next) => {
  const start = Date.now();
  const method = ctx.request.method;
  const url = ctx.request.url.pathname;
  const userAgent = ctx.request.headers.get('User-Agent') || 'Unknown';
  const ip = ctx.request.ip || 'Unknown';

  logger.info(`Request: ${method} ${url}`, {
    ip,
    userAgent,
    timestamp: new Date().toISOString()
  });

  await next();

  const duration = Date.now() - start;
  const status = ctx.response.status;

  logger.info(`Response: ${method} ${url} - ${status}`, {
    ip,
    duration: `${duration}ms`,
    status
  });
};
