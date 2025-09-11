import { Context, Next } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { logger } from '../logger.ts';

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

interface ServiceMetrics {
  requests: number;
  errors: number;
  totalDuration: number;
  averageDuration: number;
  lastRequest?: number;
}

export class MetricsMiddleware {
  private metrics = new Map<string, Metric[]>();
  private serviceMetrics = new Map<string, ServiceMetrics>();
  private maxMetrics = 50000;

  constructor() {
    // Cleanup old metrics every 5 minutes
    setInterval(() => this.cleanupMetrics(), 300000);
  }

  middleware() {
    return async (ctx: Context, next: Next) => {
      const startTime = Date.now();
      const service = this.extractServiceName(ctx);
      
      try {
        await next();
        
        const duration = Date.now() - startTime;
        this.recordMetric('request_duration', duration, {
          service,
          method: ctx.request.method,
          status: ctx.response.status.toString()
        });
        
        this.recordMetric('requests_total', 1, {
          service,
          method: ctx.request.method,
          status: ctx.response.status.toString()
        });

        this.updateServiceMetrics(service, duration, ctx.response.status >= 400);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        this.recordMetric('request_duration', duration, {
          service,
          method: ctx.request.method,
          status: '500'
        });
        
        this.recordMetric('requests_total', 1, {
          service,
          method: ctx.request.method,
          status: '500'
        });

        this.updateServiceMetrics(service, duration, true);
        throw error;
      }
    };
  }

  private extractServiceName(ctx: Context): string {
    const url = new URL(ctx.request.url);
    const pathParts = url.pathname.split('/');
    
    // Extract service from path like /api/v1/service/...
    if (pathParts.length >= 3 && pathParts[1] === 'api') {
      return pathParts[3] || 'unknown';
    }
    
    return 'unknown';
  }

  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      labels
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);
  }

  private updateServiceMetrics(service: string, duration: number, isError: boolean): void {
    if (!this.serviceMetrics.has(service)) {
      this.serviceMetrics.set(service, {
        requests: 0,
        errors: 0,
        totalDuration: 0,
        averageDuration: 0
      });
    }

    const metrics = this.serviceMetrics.get(service)!;
    metrics.requests++;
    metrics.totalDuration += duration;
    metrics.averageDuration = metrics.totalDuration / metrics.requests;
    metrics.lastRequest = Date.now();

    if (isError) {
      metrics.errors++;
    }
  }

  getMetrics(): any {
    const result: any = {
      services: Object.fromEntries(this.serviceMetrics),
      metrics: {}
    };

    // Aggregate metrics by name
    for (const [name, metrics] of this.metrics) {
      if (metrics.length === 0) continue;

      const latest = metrics[metrics.length - 1];
      const total = metrics.reduce((sum, m) => sum + m.value, 0);
      const average = total / metrics.length;
      const min = Math.min(...metrics.map(m => m.value));
      const max = Math.max(...metrics.map(m => m.value));

      result.metrics[name] = {
        latest: latest.value,
        total,
        average,
        min,
        max,
        count: metrics.length,
        labels: latest.labels
      };
    }

    return result;
  }

  getServiceMetrics(service: string): any {
    return this.serviceMetrics.get(service) || null;
  }

  getMetricHistory(name: string, limit: number = 100): Metric[] {
    const metrics = this.metrics.get(name) || [];
    return metrics.slice(-limit);
  }

  getMetricByLabels(name: string, labels: Record<string, string>): Metric[] {
    const metrics = this.metrics.get(name) || [];
    return metrics.filter(metric => {
      if (!metric.labels) return false;
      
      for (const [key, value] of Object.entries(labels)) {
        if (metric.labels[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  private cleanupMetrics(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    let removed = 0;

    for (const [name, metrics] of this.metrics) {
      const filtered = metrics.filter(metric => metric.timestamp > cutoff);
      removed += metrics.length - filtered.length;
      this.metrics.set(name, filtered);
    }

    if (removed > 0) {
      logger.debug('Cleaned up old metrics', { removed });
    }
  }

  // Custom metric recording
  recordCounter(name: string, increment: number = 1, labels?: Record<string, string>): void {
    this.recordMetric(name, increment, labels);
  }

  recordGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(name, value, labels);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(name, value, labels);
  }

  // Health metrics
  getHealthMetrics(): any {
    const services = Object.fromEntries(this.serviceMetrics);
    const healthyServices = Object.values(services).filter(s => s.errors / s.requests < 0.1).length;
    const totalServices = Object.keys(services).length;

    return {
      totalServices,
      healthyServices,
      unhealthyServices: totalServices - healthyServices,
      overallHealth: totalServices > 0 ? healthyServices / totalServices : 1
    };
  }

  // Clear metrics (admin function)
  clearMetrics(): void {
    this.metrics.clear();
    this.serviceMetrics.clear();
    logger.info('Metrics cleared');
  }

  clearServiceMetrics(service: string): void {
    this.serviceMetrics.delete(service);
    logger.info('Service metrics cleared', { service });
  }
}
