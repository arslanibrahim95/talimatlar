import { logger } from './logger.ts';
import { ServiceRegistry, ServiceInstance } from './service-registry.ts';

type LoadBalancingStrategy = 'round-robin' | 'least-connections' | 'weighted-round-robin' | 'ip-hash';

interface LoadBalancerConfig {
  strategy: LoadBalancingStrategy;
  healthCheckInterval: number;
  maxRetries: number;
}

export class LoadBalancer {
  private registry: ServiceRegistry;
  private config: LoadBalancerConfig;
  private roundRobinCounters = new Map<string, number>();
  private connectionCounts = new Map<string, Map<string, number>>();

  constructor(registry: ServiceRegistry, config?: Partial<LoadBalancerConfig>) {
    this.registry = registry;
    this.config = {
      strategy: 'round-robin',
      healthCheckInterval: 30000,
      maxRetries: 3,
      ...config
    };

    // Start health checking
    setInterval(() => this.performHealthChecks(), this.config.healthCheckInterval);
  }

  getTarget(serviceName: string): string | null {
    const healthyInstances = this.registry.getHealthyInstances(serviceName);
    
    if (healthyInstances.length === 0) {
      logger.warn('No healthy instances available', { service: serviceName });
      return null;
    }

    switch (this.config.strategy) {
      case 'round-robin':
        return this.roundRobin(serviceName, healthyInstances);
      
      case 'least-connections':
        return this.leastConnections(serviceName, healthyInstances);
      
      case 'weighted-round-robin':
        return this.weightedRoundRobin(serviceName, healthyInstances);
      
      case 'ip-hash':
        return this.ipHash(serviceName, healthyInstances);
      
      default:
        return this.roundRobin(serviceName, healthyInstances);
    }
  }

  private roundRobin(serviceName: string, instances: ServiceInstance[]): string {
    const counter = this.roundRobinCounters.get(serviceName) || 0;
    const selectedIndex = counter % instances.length;
    const selectedInstance = instances[selectedIndex];
    
    this.roundRobinCounters.set(serviceName, counter + 1);
    
    logger.debug('Round robin selection', { 
      service: serviceName, 
      selected: selectedInstance.host,
      index: selectedIndex,
      total: instances.length
    });
    
    return selectedInstance.host;
  }

  private leastConnections(serviceName: string, instances: ServiceInstance[]): string {
    const connectionCounts = this.connectionCounts.get(serviceName) || new Map();
    
    let minConnections = Infinity;
    let selectedHost = instances[0].host;
    
    for (const instance of instances) {
      const connections = connectionCounts.get(instance.host) || 0;
      if (connections < minConnections) {
        minConnections = connections;
        selectedHost = instance.host;
      }
    }
    
    logger.debug('Least connections selection', { 
      service: serviceName, 
      selected: selectedHost,
      connections: minConnections
    });
    
    return selectedHost;
  }

  private weightedRoundRobin(serviceName: string, instances: ServiceInstance[]): string {
    // Calculate weights based on response time and success rate
    const weightedInstances = instances.map(instance => {
      const successRate = instance.successes / (instance.successes + instance.failures + 1);
      const responseTimeWeight = Math.max(0, 1000 - instance.responseTime) / 1000;
      const weight = successRate * responseTimeWeight;
      
      return { ...instance, weight };
    });

    // Sort by weight (highest first)
    weightedInstances.sort((a, b) => b.weight - a.weight);
    
    // Select based on weight
    const totalWeight = weightedInstances.reduce((sum, inst) => sum + inst.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const instance of weightedInstances) {
      currentWeight += instance.weight;
      if (random <= currentWeight) {
        logger.debug('Weighted round robin selection', { 
          service: serviceName, 
          selected: instance.host,
          weight: instance.weight,
          totalWeight
        });
        return instance.host;
      }
    }
    
    // Fallback to first instance
    return weightedInstances[0].host;
  }

  private ipHash(serviceName: string, instances: ServiceInstance[]): string {
    // This would typically use the client IP, but we'll use a simple hash for now
    const hash = this.simpleHash(serviceName + Date.now().toString());
    const selectedIndex = hash % instances.length;
    const selectedInstance = instances[selectedIndex];
    
    logger.debug('IP hash selection', { 
      service: serviceName, 
      selected: selectedInstance.host,
      hash,
      index: selectedIndex
    });
    
    return selectedInstance.host;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Connection tracking
  incrementConnections(serviceName: string, host: string): void {
    const connectionCounts = this.connectionCounts.get(serviceName) || new Map();
    const current = connectionCounts.get(host) || 0;
    connectionCounts.set(host, current + 1);
    this.connectionCounts.set(serviceName, connectionCounts);
  }

  decrementConnections(serviceName: string, host: string): void {
    const connectionCounts = this.connectionCounts.get(serviceName);
    if (!connectionCounts) return;
    
    const current = connectionCounts.get(host) || 0;
    if (current > 0) {
      connectionCounts.set(host, current - 1);
    }
  }

  // Health checking
  private async performHealthChecks(): Promise<void> {
    const services = this.registry.getAll();
    
    for (const [serviceName] of Object.entries(services)) {
      try {
        await this.registry.checkServiceHealth(serviceName);
      } catch (error) {
        logger.error('Health check failed', { 
          service: serviceName, 
          error: error.message 
        });
      }
    }
  }

  // Statistics
  getStats(): any {
    const stats: any = {
      strategy: this.config.strategy,
      services: {}
    };

    for (const [serviceName, connectionCounts] of this.connectionCounts) {
      const totalConnections = Array.from(connectionCounts.values()).reduce((sum, count) => sum + count, 0);
      const instanceStats = Array.from(connectionCounts.entries()).map(([host, count]) => ({
        host,
        connections: count
      }));

      stats.services[serviceName] = {
        totalConnections,
        instances: instanceStats
      };
    }

    return stats;
  }

  // Configuration updates
  updateConfig(config: Partial<LoadBalancerConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Load balancer config updated', { config: this.config });
  }

  // Reset counters (admin function)
  resetCounters(): void {
    this.roundRobinCounters.clear();
    this.connectionCounts.clear();
    logger.info('Load balancer counters reset');
  }

  // Get connection counts for a service
  getConnectionCounts(serviceName: string): Record<string, number> {
    const connectionCounts = this.connectionCounts.get(serviceName) || new Map();
    return Object.fromEntries(connectionCounts);
  }

  // Get total connections for a service
  getTotalConnections(serviceName: string): number {
    const connectionCounts = this.connectionCounts.get(serviceName) || new Map();
    return Array.from(connectionCounts.values()).reduce((sum, count) => sum + count, 0);
  }
}
