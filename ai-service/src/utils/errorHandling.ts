// Backend Error Handling System for AI Service
// Provides comprehensive error management for Deno/Oak services

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  API_ERROR = 'API_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp: Date;
  url?: string;
  method?: string;
  userAgent?: string;
  stack?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  context: ErrorContext;
  isRetryable: boolean;
  retryAfter?: number; // seconds
  originalError?: Error;
  statusCode?: number;
  service?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 1000;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Creates a standardized error object
   */
  createError(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ): AppError {
    const error = new Error(message) as AppError;
    error.type = type;
    error.severity = severity;
    error.context = {
      timestamp: new Date(),
      ...context,
    };
    error.isRetryable = this.isRetryableError(type);
    error.originalError = originalError;
    error.retryAfter = this.getRetryAfter(type);
    error.service = 'ai-service';

    // Add stack trace if not present
    if (!error.stack && originalError?.stack) {
      error.stack = originalError.stack;
    }

    return error;
  }

  /**
   * Handles and processes errors
   */
  handleError(error: AppError | Error, context: Partial<ErrorContext> = {}): AppError {
    let appError: AppError;

    if (this.isAppError(error)) {
      appError = error;
      // Merge additional context
      appError.context = { ...appError.context, ...context };
    } else {
      // Convert regular Error to AppError
      const errorType = this.classifyError(error);
      appError = this.createError(
        error.message || 'An unexpected error occurred',
        errorType,
        this.getSeverityFromType(errorType),
        context,
        error
      );
    }

    // Log the error
    this.logError(appError);

    // Handle based on severity
    this.handleBySeverity(appError);

    return appError;
  }

  /**
   * Classifies error type based on error properties
   */
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name.includes('network') || message.includes('network')) {
      return ErrorType.NETWORK_ERROR;
    }
    if (name.includes('timeout') || message.includes('timeout')) {
      return ErrorType.TIMEOUT_ERROR;
    }
    if (name.includes('unauthorized') || message.includes('unauthorized')) {
      return ErrorType.AUTHENTICATION_ERROR;
    }
    if (name.includes('forbidden') || message.includes('forbidden')) {
      return ErrorType.AUTHORIZATION_ERROR;
    }
    if (name.includes('validation') || message.includes('validation')) {
      return ErrorType.VALIDATION_ERROR;
    }
    if (name.includes('rate limit') || message.includes('rate limit')) {
      return ErrorType.RATE_LIMIT_ERROR;
    }
    if (name.includes('service unavailable') || message.includes('service unavailable')) {
      return ErrorType.SERVICE_UNAVAILABLE;
    }
    if (name.includes('openai') || name.includes('claude') || name.includes('ai')) {
      return ErrorType.AI_PROVIDER_ERROR;
    }

    return ErrorType.UNKNOWN_ERROR;
  }

  /**
   * Determines if an error is retryable
   */
  private isRetryableError(type: ErrorType): boolean {
    const retryableTypes = [
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.SERVER_ERROR,
      ErrorType.SERVICE_UNAVAILABLE,
      ErrorType.RATE_LIMIT_ERROR,
      ErrorType.AI_PROVIDER_ERROR,
    ];
    return retryableTypes.includes(type);
  }

  /**
   * Gets retry delay based on error type
   */
  private getRetryAfter(type: ErrorType): number | undefined {
    switch (type) {
      case ErrorType.RATE_LIMIT_ERROR:
        return 60; // 1 minute
      case ErrorType.SERVICE_UNAVAILABLE:
        return 30; // 30 seconds
      case ErrorType.TIMEOUT_ERROR:
        return 5; // 5 seconds
      case ErrorType.AI_PROVIDER_ERROR:
        return 10; // 10 seconds
      default:
        return undefined;
    }
  }

  /**
   * Gets error severity based on type
   */
  private getSeverityFromType(type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.CRITICAL:
      case ErrorType.DATABASE_ERROR:
        return ErrorSeverity.CRITICAL;
      case ErrorType.AUTHENTICATION_ERROR:
      case ErrorType.AUTHORIZATION_ERROR:
      case ErrorType.SERVER_ERROR:
      case ErrorType.AI_PROVIDER_ERROR:
        return ErrorSeverity.HIGH;
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.API_ERROR:
        return ErrorSeverity.MEDIUM;
      case ErrorType.CACHE_ERROR:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Checks if error is an AppError
   */
  private isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'type' in error && 'severity' in error;
  }

  /**
   * Logs error to internal log
   */
  private logError(error: AppError): void {
    this.errorLog.push(error);
    
    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Console logging based on severity
    const logLevel = this.getLogLevel(error.severity);
    console[logLevel](`[${error.severity}] ${error.type}: ${error.message}`, {
      context: error.context,
      stack: error.stack,
    });
  }

  /**
   * Gets console log level based on severity
   */
  private getLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'log';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'log';
    }
  }

  /**
   * Handles error based on severity
   */
  private handleBySeverity(error: AppError): void {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        // Critical errors might require immediate action
        console.error('CRITICAL ERROR:', error);
        break;
      case ErrorSeverity.HIGH:
        // High severity errors should be logged and monitored
        console.error('HIGH SEVERITY ERROR:', error);
        break;
      case ErrorSeverity.MEDIUM:
        // Medium errors are logged but don't require immediate action
        break;
      case ErrorSeverity.LOW:
        // Low severity errors are just logged
        break;
    }
  }

  /**
   * Gets error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: AppError[];
  } {
    const byType = {} as Record<ErrorType, number>;
    const bySeverity = {} as Record<ErrorSeverity, number>;

    // Initialize counters
    Object.values(ErrorType).forEach(type => byType[type] = 0);
    Object.values(ErrorSeverity).forEach(severity => bySeverity[severity] = 0);

    // Count errors
    this.errorLog.forEach(error => {
      byType[error.type]++;
      bySeverity[error.severity]++;
    });

    return {
      total: this.errorLog.length,
      byType,
      bySeverity,
      recent: this.errorLog.slice(-10), // Last 10 errors
    };
  }

  /**
   * Clears error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const createNetworkError = (message: string, context?: Partial<ErrorContext>): AppError => {
  return errorHandler.createError(
    message,
    ErrorType.NETWORK_ERROR,
    ErrorSeverity.MEDIUM,
    context
  );
};

export const createAuthError = (message: string, context?: Partial<ErrorContext>): AppError => {
  return errorHandler.createError(
    message,
    ErrorType.AUTHENTICATION_ERROR,
    ErrorSeverity.HIGH,
    context
  );
};

export const createValidationError = (message: string, context?: Partial<ErrorContext>): AppError => {
  return errorHandler.createError(
    message,
    ErrorType.VALIDATION_ERROR,
    ErrorSeverity.MEDIUM,
    context
  );
};

export const createServerError = (message: string, context?: Partial<ErrorContext>): AppError => {
  return errorHandler.createError(
    message,
    ErrorType.SERVER_ERROR,
    ErrorSeverity.HIGH,
    context
  );
};

export const createAIProviderError = (message: string, context?: Partial<ErrorContext>): AppError => {
  return errorHandler.createError(
    message,
    ErrorType.AI_PROVIDER_ERROR,
    ErrorSeverity.HIGH,
    context
  );
};

// Error boundary helper
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Partial<ErrorContext>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = errorHandler.handleError(error as Error, context);
      throw appError;
    }
  };
};

export default errorHandler;
