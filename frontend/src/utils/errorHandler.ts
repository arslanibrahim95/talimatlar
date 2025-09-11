import { ApiError as ApiErrorInterface, NetworkError as NetworkErrorInterface, ValidationError as ValidationErrorInterface } from '../types';

/**
 * Centralized error handling utilities
 * Provides consistent error processing across the application
 */

export class ErrorHandler {
  /**
   * Handle API errors and convert to user-friendly messages
   */
  static handleApiError(error: any): string {
    if (error instanceof AppError) {
      return this.getUserFriendlyMessage(error);
    }

    if (error instanceof NetworkError) {
      return this.getNetworkErrorMessage(error);
    }

    if (error instanceof ValidationError) {
      return error.message;
    }

    // Handle fetch errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
    }

    // Handle timeout errors
    if (error.name === 'AbortError') {
      return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
    }

    // Default error message
    return error.message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
  }

  /**
   * Get user-friendly message from ApiError
   */
  private static getUserFriendlyMessage(error: AppError): string {
    const { statusCode, code } = error;

    // Handle specific error codes
    if (code) {
      switch (code) {
        case 'INVALID_CREDENTIALS':
          return 'E-posta veya şifre hatalı.';
        case 'USER_NOT_FOUND':
          return 'Kullanıcı bulunamadı.';
        case 'USER_ALREADY_EXISTS':
          return 'Bu e-posta adresi zaten kullanılıyor.';
        case 'TOKEN_EXPIRED':
          return 'Oturum süresi doldu. Lütfen tekrar giriş yapın.';
        case 'INSUFFICIENT_PERMISSIONS':
          return 'Bu işlem için yetkiniz bulunmuyor.';
        case 'VALIDATION_ERROR':
          return 'Girilen bilgiler geçersiz.';
        default:
          break;
      }
    }

    // Handle HTTP status codes
    switch (statusCode) {
      case 400:
        return 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.';
      case 401:
        return 'Oturum süresi doldu. Lütfen tekrar giriş yapın.';
      case 403:
        return 'Bu işlem için yetkiniz bulunmuyor.';
      case 404:
        return 'İstenen kaynak bulunamadı.';
      case 409:
        return 'Bu kaynak zaten mevcut.';
      case 422:
        return 'Girilen bilgiler geçersiz. Lütfen kontrol edin.';
      case 429:
        return 'Çok fazla istek gönderildi. Lütfen bekleyin.';
      case 500:
        return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      case 503:
        return 'Servis şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
      default:
        return error.message || 'Beklenmeyen bir hata oluştu.';
    }
  }

  /**
   * Get network error message
   */
  private static getNetworkErrorMessage(error: NetworkError): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'İnternet bağlantınızı kontrol edin.';
      case 'TIMEOUT':
        return 'Bağlantı zaman aşımına uğradı.';
      case 'CONNECTION_REFUSED':
        return 'Sunucuya bağlanılamıyor.';
      default:
        return error.message || 'Ağ hatası oluştu.';
    }
  }

  /**
   * Format validation errors for display
   */
  private static formatValidationErrors(fieldErrors?: Record<string, string[]>): string {
    if (!fieldErrors) {
      return 'Girilen bilgiler geçersiz.';
    }

    const errors = Object.entries(fieldErrors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');

    return `Doğrulama hatası: ${errors}`;
  }

  /**
   * Log error for debugging (only in development)
   */
  static logError(error: any, context?: string): void {
    if (import.meta.env.DEV) {
      console.group(`🚨 Error${context ? ` in ${context}` : ''}`);
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }
  }

  /**
   * Create a standardized error object
   */
  static createError(
    message: string,
    code?: string,
    statusCode?: number,
    fieldErrors?: Record<string, string[]>
  ): AppError {
    return new AppError(
      message,
      code,
      statusCode || 500
    );
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: any): boolean {
    if (error instanceof AppError) {
      // Retry on server errors and rate limiting
      return (error.statusCode || 500) >= 500 || (error.statusCode || 500) === 429;
    }

    // Retry on network errors
    if (error instanceof NetworkError) {
      return ['NETWORK_ERROR', 'TIMEOUT'].includes(error.code || '');
    }

    return false;
  }

  /**
   * Extract error details for reporting
   */
  static extractErrorDetails(error: any): {
    message: string;
    code?: string;
    statusCode?: number;
    timestamp: string;
    context?: string;
  } {
    return {
      message: this.handleApiError(error),
      code: error.code,
      statusCode: error.statusCode || error.status,
      timestamp: new Date().toISOString(),
      context: error.context
    };
  }
}

/**
 * Custom error classes
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public context?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Error boundary hook for React components
 */
export const useErrorHandler = () => {
  const handleError = (error: any, context?: string) => {
    ErrorHandler.logError(error, context);
    return ErrorHandler.handleApiError(error);
  };

  const createError = (
    message: string,
    code?: string,
    statusCode?: number
  ) => {
    return ErrorHandler.createError(message, code, statusCode);
  };

  return {
    handleError,
    createError,
    isRetryable: ErrorHandler.isRetryableError,
    extractDetails: ErrorHandler.extractErrorDetails
  };
};
