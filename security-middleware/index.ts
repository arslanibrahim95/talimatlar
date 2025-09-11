/**
 * Centralized Security Middleware
 * Provides comprehensive security middleware for all services
 */

import { Context, Next } from 'https://deno.land/x/oak@v11.1.0/mod.ts';
import { logger } from './utils/logger.ts';

// Security Configuration
const SECURITY_CONFIG = {
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  maxHeadersSize: 8 * 1024, // 8KB
  maxUrlLength: 2048,
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedContentTypes: [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain'
  ],
  blockedUserAgents: [
    'sqlmap',
    'nikto',
    'nmap',
    'masscan',
    'zap',
    'burp'
  ],
  blockedIps: new Set<string>(), // Add blocked IPs here
  rateLimitConfig: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false
  }
};

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Security Headers Middleware
 * Adds comprehensive security headers to all responses
 */
export async function securityHeadersMiddleware(ctx: Context, next: Next) {
  // Content Security Policy
  ctx.response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https:; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );
  
  // Prevent MIME type sniffing
  ctx.response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  ctx.response.headers.set('X-Frame-Options', 'DENY');
  
  // XSS Protection
  ctx.response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  ctx.response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS
  ctx.response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Permissions Policy
  ctx.response.headers.set('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  
  // Remove server header
  ctx.response.headers.delete('Server');
  
  await next();
}

/**
 * Request Size Limiting Middleware
 * Limits the size of incoming requests
 */
export async function requestSizeLimitMiddleware(ctx: Context, next: Next) {
  const contentLength = ctx.request.headers.get('content-length');
  
  if (contentLength && parseInt(contentLength) > SECURITY_CONFIG.maxRequestSize) {
    logger.warn('Request size exceeded', { 
      contentLength: parseInt(contentLength),
      maxSize: SECURITY_CONFIG.maxRequestSize,
      ip: ctx.request.ip
    });
    
    ctx.response.status = 413;
    ctx.response.body = {
      error: 'request_too_large',
      message: 'Request size exceeds maximum allowed size'
    };
    return;
  }
  
  await next();
}

/**
 * URL Length Limiting Middleware
 * Limits the length of URLs
 */
export async function urlLengthLimitMiddleware(ctx: Context, next: Next) {
  const url = ctx.request.url.toString();
  
  if (url.length > SECURITY_CONFIG.maxUrlLength) {
    logger.warn('URL length exceeded', { 
      urlLength: url.length,
      maxLength: SECURITY_CONFIG.maxUrlLength,
      ip: ctx.request.ip
    });
    
    ctx.response.status = 414;
    ctx.response.body = {
      error: 'url_too_long',
      message: 'URL length exceeds maximum allowed length'
    };
    return;
  }
  
  await next();
}

/**
 * Method Validation Middleware
 * Validates HTTP methods
 */
export async function methodValidationMiddleware(ctx: Context, next: Next) {
  const method = ctx.request.method;
  
  if (!SECURITY_CONFIG.allowedMethods.includes(method)) {
    logger.warn('Invalid HTTP method', { 
      method,
      ip: ctx.request.ip,
      url: ctx.request.url.toString()
    });
    
    ctx.response.status = 405;
    ctx.response.body = {
      error: 'method_not_allowed',
      message: 'HTTP method not allowed'
    };
    return;
  }
  
  await next();
}

/**
 * Content Type Validation Middleware
 * Validates content types
 */
export async function contentTypeValidationMiddleware(ctx: Context, next: Next) {
  const contentType = ctx.request.headers.get('content-type');
  
  if (contentType && !SECURITY_CONFIG.allowedContentTypes.some(type => 
    contentType.toLowerCase().includes(type.toLowerCase())
  )) {
    logger.warn('Invalid content type', { 
      contentType,
      ip: ctx.request.ip,
      url: ctx.request.url.toString()
    });
    
    ctx.response.status = 415;
    ctx.response.body = {
      error: 'unsupported_media_type',
      message: 'Content type not supported'
    };
    return;
  }
  
  await next();
}

/**
 * User Agent Filtering Middleware
 * Blocks suspicious user agents
 */
export async function userAgentFilterMiddleware(ctx: Context, next: Next) {
  const userAgent = ctx.request.headers.get('user-agent') || '';
  
  const isBlocked = SECURITY_CONFIG.blockedUserAgents.some(blocked => 
    userAgent.toLowerCase().includes(blocked.toLowerCase())
  );
  
  if (isBlocked) {
    logger.warn('Blocked user agent', { 
      userAgent,
      ip: ctx.request.ip,
      url: ctx.request.url.toString()
    });
    
    ctx.response.status = 403;
    ctx.response.body = {
      error: 'forbidden',
      message: 'Access denied'
    };
    return;
  }
  
  await next();
}

/**
 * IP Filtering Middleware
 * Blocks specific IP addresses
 */
export async function ipFilterMiddleware(ctx: Context, next: Next) {
  const ip = ctx.request.ip || 'unknown';
  
  if (SECURITY_CONFIG.blockedIps.has(ip)) {
    logger.warn('Blocked IP address', { 
      ip,
      url: ctx.request.url.toString()
    });
    
    ctx.response.status = 403;
    ctx.response.body = {
      error: 'forbidden',
      message: 'Access denied'
    };
    return;
  }
  
  await next();
}

/**
 * Rate Limiting Middleware
 * Implements rate limiting per IP address
 */
export function rateLimitMiddleware(maxRequests: number = SECURITY_CONFIG.rateLimitConfig.maxRequests) {
  return async (ctx: Context, next: Next) => {
    const ip = ctx.request.ip || 'unknown';
    const now = Date.now();
    const windowMs = SECURITY_CONFIG.rateLimitConfig.windowMs;
    
    const key = `rate_limit:${ip}`;
    const current = rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      await next();
      return;
    }
    
    if (current.count >= maxRequests) {
      logger.warn('Rate limit exceeded', { 
        ip, 
        count: current.count,
        maxRequests,
        url: ctx.request.url.toString()
      });
      
      ctx.response.status = 429;
      ctx.response.headers.set('Retry-After', Math.ceil(windowMs / 1000).toString());
      ctx.response.body = {
        error: 'rate_limit_exceeded',
        message: 'Too many requests',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      };
      return;
    }
    
    current.count++;
    await next();
  };
}

/**
 * Input Sanitization Middleware
 * Sanitizes input data to prevent injection attacks
 */
export async function inputSanitizationMiddleware(ctx: Context, next: Next) {
  try {
    if (ctx.request.method === 'POST' || ctx.request.method === 'PUT' || ctx.request.method === 'PATCH') {
      const body = await ctx.request.body().value;
      
      if (body && typeof body === 'object') {
        const sanitizedBody = sanitizeObject(body);
        ctx.state.sanitizedData = sanitizedBody;
      }
    }
    
    await next();
  } catch (error) {
    logger.error('Input sanitization error', error);
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'invalid_input',
      message: 'Invalid input data'
    };
  }
}

/**
 * SQL Injection Prevention Middleware
 * Checks for SQL injection patterns
 */
export async function sqlInjectionPreventionMiddleware(ctx: Context, next: Next) {
  const url = ctx.request.url.toString();
  const userAgent = ctx.request.headers.get('user-agent') || '';
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/i,
    /(\b(OR|AND)\s+['"]\s*LIKE\s*['"])/i,
    /(\b(OR|AND)\s+['"]\s*IN\s*\(/i,
    /(\b(OR|AND)\s+['"]\s*BETWEEN\s+)/i,
    /(\b(OR|AND)\s+['"]\s*EXISTS\s*\(/i,
    /(\b(OR|AND)\s+['"]\s*NOT\s+EXISTS\s*\(/i
  ];
  
  const isSqlInjection = sqlPatterns.some(pattern => 
    pattern.test(url) || pattern.test(userAgent)
  );
  
  if (isSqlInjection) {
    logger.warn('SQL injection attempt detected', { 
      ip: ctx.request.ip,
      url,
      userAgent
    });
    
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'invalid_request',
      message: 'Invalid request format'
    };
    return;
  }
  
  await next();
}

/**
 * XSS Prevention Middleware
 * Checks for XSS patterns
 */
export async function xssPreventionMiddleware(ctx: Context, next: Next) {
  const url = ctx.request.url.toString();
  const userAgent = ctx.request.headers.get('user-agent') || '';
  
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*>.*?<\/link>/gi,
    /<meta[^>]*>.*?<\/meta>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
    /onclick=/gi,
    /onmouseover=/gi
  ];
  
  const isXss = xssPatterns.some(pattern => 
    pattern.test(url) || pattern.test(userAgent)
  );
  
  if (isXss) {
    logger.warn('XSS attempt detected', { 
      ip: ctx.request.ip,
      url,
      userAgent
    });
    
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'invalid_request',
      message: 'Invalid request format'
    };
    return;
  }
  
  await next();
}

/**
 * Request Logging Middleware
 * Logs all requests for security monitoring
 */
export async function securityLoggingMiddleware(ctx: Context, next: Next) {
  const start = Date.now();
  const method = ctx.request.method;
  const url = ctx.request.url.toString();
  const userAgent = ctx.request.headers.get('User-Agent') || 'Unknown';
  const ip = ctx.request.ip || 'Unknown';
  const referer = ctx.request.headers.get('Referer') || 'Unknown';
  
  logger.debug('Security request started', { 
    method, 
    url, 
    userAgent, 
    ip, 
    referer 
  });
  
  await next();
  
  const duration = Date.now() - start;
  const status = ctx.response.status;
  
  logger.info('Security request completed', { 
    method, 
    url, 
    status, 
    duration: `${duration}ms`,
    userAgent,
    ip,
    referer
  });
}

/**
 * Error Handling Middleware
 * Handles security-related errors
 */
export async function securityErrorMiddleware(ctx: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    logger.error('Security error', error);
    
    // Don't expose internal errors
    ctx.response.status = 500;
    ctx.response.body = {
      error: 'internal_server_error',
      message: 'An internal error occurred'
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
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
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
 * Comprehensive Security Middleware
 * Combines all security middleware into one
 */
export function comprehensiveSecurityMiddleware() {
  return [
    securityHeadersMiddleware,
    requestSizeLimitMiddleware,
    urlLengthLimitMiddleware,
    methodValidationMiddleware,
    contentTypeValidationMiddleware,
    userAgentFilterMiddleware,
    ipFilterMiddleware,
    rateLimitMiddleware(),
    inputSanitizationMiddleware,
    sqlInjectionPreventionMiddleware,
    xssPreventionMiddleware,
    securityLoggingMiddleware,
    securityErrorMiddleware
  ];
}

/**
 * Add IP to blocked list
 */
export function blockIp(ip: string): void {
  SECURITY_CONFIG.blockedIps.add(ip);
  logger.warn('IP blocked', { ip });
}

/**
 * Remove IP from blocked list
 */
export function unblockIp(ip: string): void {
  SECURITY_CONFIG.blockedIps.delete(ip);
  logger.info('IP unblocked', { ip });
}

/**
 * Get security statistics
 */
export function getSecurityStats() {
  return {
    blockedIps: SECURITY_CONFIG.blockedIps.size,
    rateLimitEntries: rateLimitStore.size,
    config: {
      maxRequestSize: SECURITY_CONFIG.maxRequestSize,
      maxUrlLength: SECURITY_CONFIG.maxUrlLength,
      allowedMethods: SECURITY_CONFIG.allowedMethods,
      allowedContentTypes: SECURITY_CONFIG.allowedContentTypes,
      blockedUserAgents: SECURITY_CONFIG.blockedUserAgents
    }
  };
}
