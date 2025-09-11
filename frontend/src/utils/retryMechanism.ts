// Retry Mechanism with Exponential Backoff
// Provides robust retry logic for failed operations

import { errorHandler, AppError, ErrorType, ErrorSeverity } from './errorHandling';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean; // Add randomness to prevent thundering herd
  retryCondition?: (error: AppError) => boolean;
}

export interface RetryContext {
  attempt: number;
  totalAttempts: number;
  lastError?: AppError;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

export class RetryMechanism {
  private static defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    jitter: true,
  };

  /**
   * Executes a function with retry logic
   */
  static async execute<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: { userId?: string; sessionId?: string; operation?: string }
  ): Promise<T> {
    const retryConfig = { ...this.defaultConfig, ...config };
    const retryContext: RetryContext = {
      attempt: 0,
      totalAttempts: retryConfig.maxRetries + 1,
      startTime: new Date(),
    };

    let lastError: AppError | undefined;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      retryContext.attempt = attempt + 1;

      try {
        const result = await fn();
        retryContext.endTime = new Date();
        retryContext.duration = retryContext.endTime.getTime() - retryContext.startTime.getTime();
        
        // Log successful retry if it wasn't the first attempt
        if (attempt > 0) {
          console.log(`Operation succeeded after ${attempt + 1} attempts`, {
            context: retryContext,
            operation: context?.operation,
          });
        }

        return result;
      } catch (error) {
        lastError = errorHandler.handleError(error as Error, {
          userId: context?.userId,
          sessionId: context?.sessionId,
          action: context?.operation,
          metadata: { attempt: attempt + 1, maxRetries: retryConfig.maxRetries },
        });

        retryContext.lastError = lastError;

        // Check if we should retry
        if (attempt === retryConfig.maxRetries || !this.shouldRetry(lastError, retryConfig)) {
          retryContext.endTime = new Date();
          retryContext.duration = retryContext.endTime.getTime() - retryContext.startTime.getTime();
          
          // Log final failure
          console.error(`Operation failed after ${attempt + 1} attempts`, {
            context: retryContext,
            operation: context?.operation,
            finalError: lastError,
          });

          throw lastError;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, retryConfig);
        
        console.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retryConfig.maxRetries + 1})`, {
          error: lastError.message,
          errorType: lastError.type,
          operation: context?.operation,
        });

        // Wait before retry
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError || new Error('Retry mechanism failed unexpectedly');
  }

  /**
   * Determines if an error should trigger a retry
   */
  private static shouldRetry(error: AppError, config: RetryConfig): boolean {
    // Use custom retry condition if provided
    if (config.retryCondition) {
      return config.retryCondition(error);
    }

    // Default retry logic based on error type
    const retryableTypes = [
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.SERVER_ERROR,
      ErrorType.SERVICE_UNAVAILABLE,
      ErrorType.RATE_LIMIT_ERROR,
    ];

    return retryableTypes.includes(error.type) && error.isRetryable;
  }

  /**
   * Calculates delay for next retry attempt
   */
  private static calculateDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff: baseDelay * (backoffMultiplier ^ attempt)
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    
    // Cap at maxDelay
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      // Add random jitter between 0.5 and 1.5 of the calculated delay
      const jitterFactor = 0.5 + Math.random();
      delay = delay * jitterFactor;
    }
    
    return Math.floor(delay);
  }

  /**
   * Sleep utility function
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Creates a retry wrapper for a function
   */
  static withRetry<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    config: Partial<RetryConfig> = {},
    context?: { userId?: string; sessionId?: string; operation?: string }
  ) {
    return async (...args: T): Promise<R> => {
      return this.execute(() => fn(...args), config, context);
    };
  }

  /**
   * Creates retry configuration for specific error types
   */
  static createConfigForErrorType(errorType: ErrorType): Partial<RetryConfig> {
    switch (errorType) {
      case ErrorType.RATE_LIMIT_ERROR:
        return {
          maxRetries: 5,
          baseDelay: 2000, // 2 seconds
          maxDelay: 60000, // 1 minute
          backoffMultiplier: 2,
          jitter: true,
        };
      
      case ErrorType.NETWORK_ERROR:
        return {
          maxRetries: 3,
          baseDelay: 1000, // 1 second
          maxDelay: 10000, // 10 seconds
          backoffMultiplier: 2,
          jitter: true,
        };
      
      case ErrorType.TIMEOUT_ERROR:
        return {
          maxRetries: 2,
          baseDelay: 500, // 500ms
          maxDelay: 5000, // 5 seconds
          backoffMultiplier: 2,
          jitter: true,
        };
      
      case ErrorType.SERVICE_UNAVAILABLE:
        return {
          maxRetries: 4,
          baseDelay: 2000, // 2 seconds
          maxDelay: 30000, // 30 seconds
          backoffMultiplier: 2,
          jitter: true,
        };
      
      default:
        return this.defaultConfig;
    }
  }
}

// Utility functions for common retry scenarios
export const retryApiCall = <T>(
  apiCall: () => Promise<T>,
  config?: Partial<RetryConfig>,
  context?: { userId?: string; sessionId?: string; operation?: string }
): Promise<T> => {
  return RetryMechanism.execute(apiCall, config, context);
};

export const retryWithExponentialBackoff = <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  return RetryMechanism.execute(fn, {
    maxRetries,
    baseDelay,
    maxDelay: baseDelay * Math.pow(2, maxRetries),
    backoffMultiplier: 2,
    jitter: true,
  });
};

export const retryForNetworkErrors = <T>(
  fn: () => Promise<T>,
  context?: { userId?: string; sessionId?: string; operation?: string }
): Promise<T> => {
  return RetryMechanism.execute(fn, {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error) => error.type === ErrorType.NETWORK_ERROR,
  }, context);
};

export const retryForRateLimit = <T>(
  fn: () => Promise<T>,
  context?: { userId?: string; sessionId?: string; operation?: string }
): Promise<T> => {
  return RetryMechanism.execute(fn, {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: (error) => error.type === ErrorType.RATE_LIMIT_ERROR,
  }, context);
};

export default RetryMechanism;
