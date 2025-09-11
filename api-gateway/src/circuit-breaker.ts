import { logger } from './logger.ts';

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

interface ServiceState {
  failures: number;
  successes: number;
  lastFailure?: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  nextAttempt?: number;
}

export class CircuitBreaker {
  private services = new Map<string, ServiceState>();
  private configs = new Map<string, CircuitBreakerConfig>();

  constructor() {
    // Cleanup monitoring every 30 seconds
    setInterval(() => this.monitor(), 30000);
  }

  register(serviceName: string, config: CircuitBreakerConfig): void {
    this.configs.set(serviceName, config);
    this.services.set(serviceName, {
      failures: 0,
      successes: 0,
      state: 'CLOSED'
    });
    
    logger.info('Circuit breaker registered', { serviceName, config });
  }

  isAvailable(serviceName: string): boolean {
    const state = this.services.get(serviceName);
    const config = this.configs.get(serviceName);
    
    if (!state || !config) {
      return true; // No circuit breaker configured
    }

    const now = Date.now();

    switch (state.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        if (state.nextAttempt && now >= state.nextAttempt) {
          // Transition to HALF_OPEN
          state.state = 'HALF_OPEN';
          state.nextAttempt = undefined;
          logger.info('Circuit breaker transitioning to HALF_OPEN', { serviceName });
          return true;
        }
        return false;

      case 'HALF_OPEN':
        return true;

      default:
        return true;
    }
  }

  recordResult(serviceName: string, success: boolean): void {
    const state = this.services.get(serviceName);
    const config = this.configs.get(serviceName);
    
    if (!state || !config) {
      return;
    }

    const now = Date.now();

    if (success) {
      state.successes++;
      state.failures = 0;
      
      if (state.state === 'HALF_OPEN') {
        // Transition back to CLOSED
        state.state = 'CLOSED';
        logger.info('Circuit breaker closed after successful recovery', { 
          serviceName, 
          successes: state.successes 
        });
      }
    } else {
      state.failures++;
      state.lastFailure = now;
      
      if (state.state === 'HALF_OPEN') {
        // Transition back to OPEN
        state.state = 'OPEN';
        state.nextAttempt = now + config.recoveryTimeout;
        logger.warn('Circuit breaker reopened after failure in HALF_OPEN', { 
          serviceName, 
          failures: state.failures 
        });
      } else if (state.state === 'CLOSED' && state.failures >= config.failureThreshold) {
        // Transition to OPEN
        state.state = 'OPEN';
        state.nextAttempt = now + config.recoveryTimeout;
        logger.warn('Circuit breaker opened due to failure threshold', { 
          serviceName, 
          failures: state.failures,
          threshold: config.failureThreshold
        });
      }
    }
  }

  getState(serviceName: string): any {
    const state = this.services.get(serviceName);
    const config = this.configs.get(serviceName);
    
    if (!state || !config) {
      return null;
    }

    return {
      serviceName,
      state: state.state,
      failures: state.failures,
      successes: state.successes,
      lastFailure: state.lastFailure,
      nextAttempt: state.nextAttempt,
      config
    };
  }

  getAllStates(): any {
    const states: any = {};
    
    for (const [serviceName, state] of this.services) {
      states[serviceName] = this.getState(serviceName);
    }
    
    return states;
  }

  // Force circuit breaker to specific state (admin function)
  setState(serviceName: string, newState: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void {
    const state = this.services.get(serviceName);
    if (!state) {
      logger.warn('Cannot set state for unregistered service', { serviceName });
      return;
    }

    const oldState = state.state;
    state.state = newState;
    
    if (newState === 'OPEN') {
      const config = this.configs.get(serviceName);
      state.nextAttempt = Date.now() + (config?.recoveryTimeout || 30000);
    } else {
      state.nextAttempt = undefined;
    }

    logger.info('Circuit breaker state changed', { 
      serviceName, 
      oldState, 
      newState 
    });
  }

  // Reset circuit breaker (admin function)
  reset(serviceName: string): void {
    const state = this.services.get(serviceName);
    if (state) {
      state.failures = 0;
      state.successes = 0;
      state.state = 'CLOSED';
      state.lastFailure = undefined;
      state.nextAttempt = undefined;
      
      logger.info('Circuit breaker reset', { serviceName });
    }
  }

  private monitor(): void {
    const now = Date.now();
    
    for (const [serviceName, state] of this.services) {
      const config = this.configs.get(serviceName);
      if (!config) continue;

      // Reset counters periodically
      if (state.state === 'CLOSED') {
        const timeSinceLastFailure = state.lastFailure ? now - state.lastFailure : Infinity;
        
        if (timeSinceLastFailure > config.monitoringPeriod) {
          // Reset counters if no recent failures
          state.failures = 0;
          state.successes = 0;
        }
      }
    }
  }

  // Health check for circuit breaker itself
  getHealth(): any {
    const totalServices = this.services.size;
    const openServices = Array.from(this.services.values()).filter(s => s.state === 'OPEN').length;
    const halfOpenServices = Array.from(this.services.values()).filter(s => s.state === 'HALF_OPEN').length;
    
    return {
      totalServices,
      openServices,
      halfOpenServices,
      closedServices: totalServices - openServices - halfOpenServices,
      healthy: openServices === 0
    };
  }
}
