import { describe, it, expect } from 'vitest'
import { ErrorHandler, AppError, NetworkError, ValidationError } from './errorHandler'

describe('ErrorHandler', () => {
  describe('handleApiError', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400)
      const result = ErrorHandler.handleApiError(error)
      expect(result).toBe('Geçersiz istek. Lütfen bilgilerinizi kontrol edin.')
    })

    it('should handle NetworkError correctly', () => {
      const error = new NetworkError('Network error', 500, 'NETWORK_ERROR')
      const result = ErrorHandler.handleApiError(error)
      expect(result).toBe('İnternet bağlantınızı kontrol edin.')
    })

    it('should handle ValidationError correctly', () => {
      const error = new ValidationError('Validation error', 'email')
      const result = ErrorHandler.handleApiError(error)
      expect(result).toBe('Validation error')
    })

    it('should handle fetch errors', () => {
      const error = new Error('fetch failed')
      error.name = 'TypeError'
      const result = ErrorHandler.handleApiError(error)
      expect(result).toBe('Bağlantı hatası. İnternet bağlantınızı kontrol edin.')
    })

    it('should handle timeout errors', () => {
      const error = new Error('Request timeout')
      error.name = 'AbortError'
      const result = ErrorHandler.handleApiError(error)
      expect(result).toBe('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.')
    })

    it('should return default message for unknown errors', () => {
      const error = new Error('Unknown error')
      const result = ErrorHandler.handleApiError(error)
      expect(result).toBe('Unknown error')
    })
  })

  describe('createError', () => {
    it('should create AppError with correct properties', () => {
      const error = ErrorHandler.createError('Test error', 'TEST_ERROR', 400)
      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.statusCode).toBe(400)
    })
  })

  describe('isRetryableError', () => {
    it('should return true for server errors', () => {
      const error = new AppError('Server error', 'SERVER_ERROR', 500)
      expect(ErrorHandler.isRetryableError(error)).toBe(true)
    })

    it('should return true for rate limiting', () => {
      const error = new AppError('Rate limited', 'RATE_LIMITED', 429)
      expect(ErrorHandler.isRetryableError(error)).toBe(true)
    })

    it('should return false for client errors', () => {
      const error = new AppError('Client error', 'CLIENT_ERROR', 400)
      expect(ErrorHandler.isRetryableError(error)).toBe(false)
    })

    it('should return true for network errors', () => {
      const error = new NetworkError('Network error', 500, 'NETWORK_ERROR')
      expect(ErrorHandler.isRetryableError(error)).toBe(true)
    })
  })
})
