import { logger } from './logger.ts';
import { ServiceRegistry } from './service-registry.ts';

interface HealthCheckResult {
  service: string;
  healthy: boolean;
  responseTime: number;
  lastCheck: number;
  error?: string;
}

interface OverallHealth {
  overall: boolean;
  services: Record<string, HealthCheckResult>;
  timestamp: number;
}

export class HealthChecker {
  private registry: ServiceRegistry;
  private results = new Map<string, HealthCheckResult>();
  private intervalId?: number;

  constructor(registry: ServiceRegistry) {
    this.registry = registry;
  }

  start(intervalMs: number = 30000): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.checkAllServices();
    }, intervalMs);

    // Initial health check
    this.checkAllServices();

    logger.info('Health checker started', { intervalMs });
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    logger.info('Health checker stopped');
  }

  async checkAllServices(): Promise<OverallHealth> {
    const services = this.registry.getAll();
    const results: Record<string, HealthCheckResult> = {};
    let overallHealthy = true;

    for (const [serviceName] of Object.entries(services)) {
      const result = await this.checkService(serviceName);
      results[serviceName] = result;
      
      if (!result.healthy) {
        overallHealthy = false;
      }
    }

    const overall: OverallHealth = {
      overall: overallHealthy,
      services: results,
      timestamp: Date.now()
    };

    this.results.set('overall', {
      service: 'overall',
      healthy: overallHealthy,
      responseTime: 0,
      lastCheck: Date.now()
    });

    return overall;
  }

  async checkService(serviceName: string): Promise<HealthCheckResult> {
    const service = this.registry.get(serviceName);
    if (!service) {
      const result: HealthCheckResult = {
        service: serviceName,
        healthy: false,
        responseTime: 0,
        lastCheck: Date.now(),
        error: 'Service not found in registry'
      };
      this.results.set(serviceName, result);
      return result;
    }

    const startTime = Date.now();
    let healthy = false;
    let error: string | undefined;

    try {
      // Check if any instance is healthy
      const instances = this.registry.getHealthyInstances(serviceName);
      
      if (instances.length === 0) {
        error = 'No healthy instances available';
      } else {
        // Try to reach the health endpoint
        const healthUrl = `http://${instances[0].host}${service.healthCheck}`;
        const response = await fetch(healthUrl, {
          timeout: service.timeout
        });
        
        healthy = response.ok;
        if (!healthy) {
          error = `Health check failed with status ${response.status}`;
        }
      }
    } catch (err) {
      error = err.message;
      logger.debug('Health check failed', { service: serviceName, error: err.message });
    }

    const responseTime = Date.now() - startTime;
    const result: HealthCheckResult = {
      service: serviceName,
      healthy,
      responseTime,
      lastCheck: Date.now(),
      error
    };

    this.results.set(serviceName, result);
    return result;
  }

  getServiceHealth(serviceName: string): HealthCheckResult | null {
    return this.results.get(serviceName) || null;
  }

  getAllHealthResults(): Record<string, HealthCheckResult> {
    return Object.fromEntries(this.results);
  }

  getOverallHealth(): OverallHealth {
    const services = this.registry.getAll();
    const results: Record<string, HealthCheckResult> = {};
    let overallHealthy = true;

    for (const [serviceName] of Object.entries(services)) {
      const result = this.results.get(serviceName);
      if (result) {
        results[serviceName] = result;
        if (!result.healthy) {
          overallHealthy = false;
        }
      } else {
        // No health check result available
        results[serviceName] = {
          service: serviceName,
          healthy: false,
          responseTime: 0,
          lastCheck: 0,
          error: 'No health check performed'
        };
        overallHealthy = false;
      }
    }

    return {
      overall: overallHealthy,
      services: results,
      timestamp: Date.now()
    };
  }

  // Health check statistics
  getHealthStats(): any {
    const results = Array.from(this.results.values());
    const total = results.length;
    const healthy = results.filter(r => r.healthy).length;
    const unhealthy = total - healthy;
    
    const avgResponseTime = results.length > 0 
      ? results.reduce((sum, r) => sum + r.responseTime, 0) / results.length 
      : 0;

    const servicesByHealth = results.reduce((acc, result) => {
      const status = result.healthy ? 'healthy' : 'unhealthy';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      healthy,
      unhealthy,
      averageResponseTime: avgResponseTime,
      servicesByHealth,
      lastCheck: Math.max(...results.map(r => r.lastCheck), 0)
    };
  }

  // Manual health check trigger
  async triggerHealthCheck(serviceName?: string): Promise<HealthCheckResult | OverallHealth> {
    if (serviceName) {
      return await this.checkService(serviceName);
    } else {
      return await this.checkAllServices();
    }
  }

  // Health check history (simple implementation)
  private history: HealthCheckResult[] = [];
  private maxHistorySize = 1000;

  private addToHistory(result: HealthCheckResult): void {
    this.history.push(result);
    
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  getHealthHistory(serviceName?: string, limit: number = 100): HealthCheckResult[] {
    let filtered = this.history;
    
    if (serviceName) {
      filtered = this.history.filter(r => r.service === serviceName);
    }
    
    return filtered.slice(-limit);
  }

  // Health check alerts
  private alertThresholds = {
    responseTime: 5000, // 5 seconds
    consecutiveFailures: 3
  };

  private failureCounts = new Map<string, number>();

  private checkAlerts(result: HealthCheckResult): void {
    const serviceName = result.service;
    
    // Check response time threshold
    if (result.responseTime > this.alertThresholds.responseTime) {
      logger.warn('Health check response time exceeded threshold', {
        service: serviceName,
        responseTime: result.responseTime,
        threshold: this.alertThresholds.responseTime
      });
    }

    // Check consecutive failures
    if (!result.healthy) {
      const failures = (this.failureCounts.get(serviceName) || 0) + 1;
      this.failureCounts.set(serviceName, failures);
      
      if (failures >= this.alertThresholds.consecutiveFailures) {
        logger.error('Service health check consecutive failures exceeded threshold', {
          service: serviceName,
          failures,
          threshold: this.alertThresholds.consecutiveFailures
        });
      }
    } else {
      // Reset failure count on successful check
      this.failureCounts.delete(serviceName);
    }
  }

  // Configuration
  updateAlertThresholds(thresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
    logger.info('Health check alert thresholds updated', { thresholds });
  }

  getAlertThresholds(): typeof this.alertThresholds {
    return { ...this.alertThresholds };
  }
}
