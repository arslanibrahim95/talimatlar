import { Context, Next } from 'oak';
import { logger } from '../utils/logger.ts';

export interface AppError extends Error {
  status?: number;
  code?: string;
}

export class ValidationError extends Error implements AppError {
  status = 400;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error implements AppError {
  status = 401;
  code = 'AUTHENTICATION_ERROR';
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements AppError {
  status = 403;
  code = 'AUTHORIZATION_ERROR';
  
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements AppError {
  status = 404;
  code = 'NOT_FOUND';
  
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error implements AppError {
  status = 409;
  code = 'CONFLICT';
  
  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error implements AppError {
  status = 429;
  code = 'RATE_LIMIT_EXCEEDED';
  
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends Error implements AppError {
  status = 500;
  code = 'INTERNAL_SERVER_ERROR';
  
  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'InternalServerError';
  }
}

export async function errorHandler(ctx: Context, next: Next): Promise<void> {
  try {
    await next();
  } catch (error) {
    logger.error('Unhandled error', error);
    
    const appError = error as AppError;
    const status = appError.status || 500;
    const code = appError.code || 'INTERNAL_SERVER_ERROR';
    const message = appError.message || 'An unexpected error occurred';
    
    ctx.response.status = status;
    ctx.response.body = {
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        path: ctx.request.url.pathname,
      },
    };
    
    // Log error details
    logger.error('Error response', {
      status,
      code,
      message,
      path: ctx.request.url.pathname,
      method: ctx.request.method,
      userAgent: ctx.request.headers.get('user-agent'),
      ip: ctx.request.ip,
    });
  }
}
