import { logger } from './logger.ts';

interface ServiceConfig {
  name: string;
  hosts: string[];
  healthCheck: string;
  timeout: number;
  retries: number;
  circuitBreaker: {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
  };
}

interface ServiceInstance {
  host: string;
  healthy: boolean;
  lastCheck: number;
  responseTime: number;
  failures: number;
  successes: number;
}

export class ServiceRegistry {
  private services = new Map<string, ServiceConfig>();
  private instances = new Map<string, ServiceInstance[]>();

  register(name: string, config: ServiceConfig): void {
    this.services.set(name, config);
    
    // Initialize instances
    const serviceInstances: ServiceInstance[] = config.hosts.map(host => ({
      host,
      healthy: true,
      lastCheck: 0,
      responseTime: 0,
      failures: 0,
      successes: 0
    }));
    
    this.instances.set(name, serviceInstances);
    
    logger.info('Service registered', { name, hosts: config.hosts });
  }

  get(name: string): ServiceConfig | undefined {
    return this.services.get(name);
  }

  getAll(): Record<string, ServiceConfig> {
    return Object.fromEntries(this.services);
  }

  getInstances(name: string): ServiceInstance[] {
    return this.instances.get(name) || [];
  }

  getHealthyInstances(name: string): ServiceInstance[] {
    const instances = this.instances.get(name) || [];
    return instances.filter(instance => instance.healthy);
  }

  updateInstanceHealth(name: string, host: string, healthy: boolean, responseTime: number = 0): void {
    const instances = this.instances.get(name);
    if (!instances) return;

    const instance = instances.find(inst => inst.host === host);
    if (!instance) return;

    instance.healthy = healthy;
    instance.lastCheck = Date.now();
    instance.responseTime = responseTime;

    if (healthy) {
      instance.successes++;
      instance.failures = 0;
    } else {
      instance.failures++;
    }

    logger.debug('Instance health updated', { 
      service: name, 
      host, 
      healthy, 
      responseTime,
      failures: instance.failures,
      successes: instance.successes
    });
  }

  getServiceStats(name: string): any {
    const config = this.services.get(name);
    const instances = this.instances.get(name) || [];
    
    if (!config) return null;

    const healthy = instances.filter(inst => inst.healthy).length;
    const total = instances.length;
    const avgResponseTime = instances.length > 0 
      ? instances.reduce((sum, inst) => sum + inst.responseTime, 0) / instances.length 
      : 0;

    return {
      name,
      config,
      instances: {
        total,
        healthy,
        unhealthy: total - healthy,
        averageResponseTime: avgResponseTime
      },
      instances: instances.map(inst => ({
        host: inst.host,
        healthy: inst.healthy,
        lastCheck: inst.lastCheck,
        responseTime: inst.responseTime,
        failures: inst.failures,
        successes: inst.successes
      }))
    };
  }

  getAllStats(): any {
    const stats: any = {};
    
    for (const [name] of this.services) {
      stats[name] = this.getServiceStats(name);
    }
    
    return stats;
  }

  // Health check methods
  async checkServiceHealth(name: string): Promise<boolean> {
    const config = this.services.get(name);
    if (!config) return false;

    const instances = this.instances.get(name) || [];
    let hasHealthyInstance = false;

    for (const instance of instances) {
      try {
        const startTime = Date.now();
        const response = await fetch(`http://${instance.host}${config.healthCheck}`, {
          timeout: config.timeout
        });
        const responseTime = Date.now() - startTime;
        
        const healthy = response.ok;
        this.updateInstanceHealth(name, instance.host, healthy, responseTime);
        
        if (healthy) {
          hasHealthyInstance = true;
        }
      } catch (error) {
        this.updateInstanceHealth(name, instance.host, false);
        logger.debug('Health check failed', { 
          service: name, 
          host: instance.host, 
          error: error.message 
        });
      }
    }

    return hasHealthyInstance;
  }

  async checkAllServicesHealth(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name] of this.services) {
      results[name] = await this.checkServiceHealth(name);
    }
    
    return results;
  }

  // Service discovery methods
  addInstance(name: string, host: string): void {
    const instances = this.instances.get(name) || [];
    
    // Check if instance already exists
    if (instances.some(inst => inst.host === host)) {
      logger.warn('Instance already exists', { service: name, host });
      return;
    }

    instances.push({
      host,
      healthy: true,
      lastCheck: 0,
      responseTime: 0,
      failures: 0,
      successes: 0
    });

    this.instances.set(name, instances);
    logger.info('Instance added', { service: name, host });
  }

  removeInstance(name: string, host: string): void {
    const instances = this.instances.get(name) || [];
    const filtered = instances.filter(inst => inst.host !== host);
    
    if (filtered.length !== instances.length) {
      this.instances.set(name, filtered);
      logger.info('Instance removed', { service: name, host });
    }
  }

  // Configuration updates
  updateServiceConfig(name: string, config: Partial<ServiceConfig>): void {
    const existing = this.services.get(name);
    if (!existing) {
      logger.warn('Cannot update non-existent service', { name });
      return;
    }

    const updated = { ...existing, ...config };
    this.services.set(name, updated);
    logger.info('Service config updated', { name, config });
  }

  unregister(name: string): void {
    this.services.delete(name);
    this.instances.delete(name);
    logger.info('Service unregistered', { name });
  }

  // Get service by host
  getServiceByHost(host: string): string | undefined {
    for (const [name, instances] of this.instances) {
      if (instances.some(inst => inst.host === host)) {
        return name;
      }
    }
    return undefined;
  }

  // Get all hosts for a service
  getServiceHosts(name: string): string[] {
    const instances = this.instances.get(name) || [];
    return instances.map(inst => inst.host);
  }

  // Get healthy hosts for a service
  getHealthyServiceHosts(name: string): string[] {
    const instances = this.instances.get(name) || [];
    return instances.filter(inst => inst.healthy).map(inst => inst.host);
  }
}
