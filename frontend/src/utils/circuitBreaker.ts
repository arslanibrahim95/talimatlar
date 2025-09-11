// Circuit Breaker Pattern Implementation
// Provides fault tolerance and prevents cascading failures

import { errorHandler, AppError, ErrorType, ErrorSeverity } from './errorHandling';

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service is back
}

export interface CircuitBreakerConfig {
  failureThreshold: number;        // Number of failures before opening circuit
  successThreshold: number;        // Number of successes to close circuit (from half-open)
  timeout: number;                 // Timeout for requests (ms)
  resetTimeout: number;            // Time to wait before trying half-open (ms)
  monitoringPeriod: number;        // Time window for failure counting (ms)
  volumeThreshold: number;         // Minimum number of requests in monitoring period
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  requests: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextAttemptTime?: Date;
  totalFailures: number;
  totalSuccesses: number;
  totalRequests: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private requests: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttemptTime?: Date;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private totalRequests: number = 0;
  private monitoringStartTime: Date = new Date();

  private config: CircuitBreakerConfig;

  constructor(
    private name: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 5000, // 5 seconds
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 60000, // 1 minute
      volumeThreshold: 10,
      ...config,
    };
  }

  /**
   * Executes a function through the circuit breaker
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: { userId?: string; sessionId?: string; operation?: string }
  ): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.successes = 0;
        console.log(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
      } else {
        const error = this.createCircuitOpenError();
        errorHandler.handleError(error, {
          userId: context?.userId,
          sessionId: context?.sessionId,
          action: context?.operation,
          metadata: { circuitBreaker: this.name, state: this.state },
        });
        throw error;
      }
    }

    // Execute the function with timeout
    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Executes function with timeout
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Circuit breaker ${this.name}: Operation timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);

      fn()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Handles successful execution
   */
  private onSuccess(): void {
    this.requests++;
    this.successes++;
    this.totalRequests++;
    this.totalSuccesses++;
    this.lastSuccessTime = new Date();

    // Reset monitoring period if needed
    this.resetMonitoringIfNeeded();

    // Check if we should close the circuit (from half-open)
    if (this.state === CircuitState.HALF_OPEN && this.successes >= this.config.successThreshold) {
      this.state = CircuitState.CLOSED;
      this.failures = 0;
      console.log(`Circuit breaker ${this.name} closed - service recovered`);
    }
  }

  /**
   * Handles failed execution
   */
  private onFailure(error: Error): void {
    this.requests++;
    this.failures++;
    this.totalRequests++;
    this.totalFailures++;
    this.lastFailureTime = new Date();

    // Reset monitoring period if needed
    this.resetMonitoringIfNeeded();

    // Check if we should open the circuit
    if (this.shouldOpenCircuit()) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout);
      console.warn(`Circuit breaker ${this.name} opened - too many failures`, {
        failures: this.failures,
        requests: this.requests,
        failureRate: this.getFailureRate(),
      });
    }

    // If in half-open state and we get a failure, go back to open
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout);
      console.warn(`Circuit breaker ${this.name} reopened after failure in half-open state`);
    }
  }

  /**
   * Determines if circuit should be opened
   */
  private shouldOpenCircuit(): boolean {
    // Need minimum volume of requests
    if (this.requests < this.config.volumeThreshold) {
      return false;
    }

    // Check if we're still in the monitoring period
    const now = new Date();
    const timeSinceStart = now.getTime() - this.monitoringStartTime.getTime();
    if (timeSinceStart > this.config.monitoringPeriod) {
      return false;
    }

    // Check failure threshold
    return this.failures >= this.config.failureThreshold;
  }

  /**
   * Determines if we should attempt to reset the circuit
   */
  private shouldAttemptReset(): boolean {
    if (!this.nextAttemptTime) {
      return false;
    }
    return new Date() >= this.nextAttemptTime;
  }

  /**
   * Resets monitoring period if needed
   */
  private resetMonitoringIfNeeded(): void {
    const now = new Date();
    const timeSinceStart = now.getTime() - this.monitoringStartTime.getTime();
    
    if (timeSinceStart >= this.config.monitoringPeriod) {
      this.failures = 0;
      this.successes = 0;
      this.requests = 0;
      this.monitoringStartTime = now;
    }
  }

  /**
   * Creates circuit open error
   */
  private createCircuitOpenError(): AppError {
    return errorHandler.createError(
      `Circuit breaker ${this.name} is OPEN - service unavailable`,
      ErrorType.SERVICE_UNAVAILABLE,
      ErrorSeverity.HIGH,
      {
        metadata: {
          circuitBreaker: this.name,
          state: this.state,
          nextAttemptTime: this.nextAttemptTime,
          failures: this.failures,
          requests: this.requests,
        },
      }
    );
  }

  /**
   * Gets current failure rate
   */
  getFailureRate(): number {
    if (this.requests === 0) return 0;
    return this.failures / this.requests;
  }

  /**
   * Gets circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      requests: this.requests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      totalRequests: this.totalRequests,
    };
  }

  /**
   * Resets the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.requests = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttemptTime = undefined;
    this.monitoringStartTime = new Date();
    console.log(`Circuit breaker ${this.name} reset`);
  }

  /**
   * Manually opens the circuit
   */
  open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout);
    console.log(`Circuit breaker ${this.name} manually opened`);
  }

  /**
   * Manually closes the circuit
   */
  close(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.nextAttemptTime = undefined;
    console.log(`Circuit breaker ${this.name} manually closed`);
  }
}

// Circuit Breaker Manager for multiple services
export class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private breakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
  }

  /**
   * Gets or creates a circuit breaker for a service
   */
  getBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Gets all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }

  /**
   * Resets all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * Removes a circuit breaker
   */
  removeBreaker(name: string): boolean {
    return this.breakers.delete(name);
  }
}

// Export singleton instance
export const circuitBreakerManager = CircuitBreakerManager.getInstance();

// Utility functions
export const withCircuitBreaker = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  serviceName: string,
  config?: Partial<CircuitBreakerConfig>,
  context?: { userId?: string; sessionId?: string; operation?: string }
) => {
  const breaker = circuitBreakerManager.getBreaker(serviceName, config);
  return async (...args: T): Promise<R> => {
    return breaker.execute(() => fn(...args), context);
  };
};

export const createServiceBreaker = (
  serviceName: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker => {
  return circuitBreakerManager.getBreaker(serviceName, config);
};

export default CircuitBreaker;
