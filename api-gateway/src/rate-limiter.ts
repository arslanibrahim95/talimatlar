import { logger } from './logger.ts';

interface RateLimitConfig {
  requests: number;
  windowMs: number;
  burst?: number;
}

interface ClientState {
  requests: number[];
  blocked: boolean;
  blockUntil?: number;
}

export class RateLimiter {
  private clients = new Map<string, ClientState>();
  private configs = new Map<string, RateLimitConfig>();

  constructor() {
    // Default configurations for different services
    this.configs.set('auth', { requests: 10, windowMs: 60000, burst: 5 }); // 10 req/min, 5 burst
    this.configs.set('analytics', { requests: 100, windowMs: 60000, burst: 20 }); // 100 req/min, 20 burst
    this.configs.set('documents', { requests: 50, windowMs: 60000, burst: 10 }); // 50 req/min, 10 burst
    this.configs.set('instructions', { requests: 30, windowMs: 60000, burst: 8 }); // 30 req/min, 8 burst
    this.configs.set('ai', { requests: 20, windowMs: 60000, burst: 5 }); // 20 req/min, 5 burst
    this.configs.set('notifications', { requests: 200, windowMs: 60000, burst: 50 }); // 200 req/min, 50 burst
    this.configs.set('default', { requests: 60, windowMs: 60000, burst: 15 }); // 60 req/min, 15 burst

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async isAllowed(clientId: string, service: string): Promise<boolean> {
    const config = this.configs.get(service) || this.configs.get('default')!;
    const now = Date.now();
    
    let clientState = this.clients.get(clientId);
    if (!clientState) {
      clientState = { requests: [], blocked: false };
      this.clients.set(clientId, clientState);
    }

    // Check if client is blocked
    if (clientState.blocked && clientState.blockUntil && now < clientState.blockUntil) {
      logger.warn('Rate limit exceeded', { clientId, service, blockUntil: clientState.blockUntil });
      return false;
    }

    // Reset block status if time has passed
    if (clientState.blocked && clientState.blockUntil && now >= clientState.blockUntil) {
      clientState.blocked = false;
      clientState.blockUntil = undefined;
    }

    // Clean old requests outside the window
    const windowStart = now - config.windowMs;
    clientState.requests = clientState.requests.filter(timestamp => timestamp > windowStart);

    // Check if within rate limit
    if (clientState.requests.length >= config.requests) {
      // Check burst allowance
      if (config.burst && clientState.requests.length < config.requests + config.burst) {
        // Allow burst request but block for longer
        clientState.blocked = true;
        clientState.blockUntil = now + (config.windowMs * 2); // Block for 2x window
        clientState.requests.push(now);
        
        logger.warn('Burst rate limit exceeded', { 
          clientId, 
          service, 
          requests: clientState.requests.length,
          limit: config.requests,
          burst: config.burst
        });
        
        return true;
      } else {
        // Completely blocked
        clientState.blocked = true;
        clientState.blockUntil = now + config.windowMs;
        
        logger.warn('Rate limit exceeded', { 
          clientId, 
          service, 
          requests: clientState.requests.length,
          limit: config.requests
        });
        
        return false;
      }
    }

    // Allow request
    clientState.requests.push(now);
    return true;
  }

  getRetryAfter(clientId: string, service: string): number {
    const clientState = this.clients.get(clientId);
    if (!clientState || !clientState.blocked || !clientState.blockUntil) {
      return 0;
    }

    return Math.ceil((clientState.blockUntil - Date.now()) / 1000);
  }

  getClientStats(clientId: string): any {
    const clientState = this.clients.get(clientId);
    if (!clientState) {
      return null;
    }

    const now = Date.now();
    const config = this.configs.get('default')!;
    const windowStart = now - config.windowMs;
    const recentRequests = clientState.requests.filter(timestamp => timestamp > windowStart);

    return {
      clientId,
      requests: recentRequests.length,
      limit: config.requests,
      blocked: clientState.blocked,
      blockUntil: clientState.blockUntil,
      retryAfter: this.getRetryAfter(clientId, 'default')
    };
  }

  getAllStats(): any {
    const stats = {
      totalClients: this.clients.size,
      blockedClients: 0,
      configs: Object.fromEntries(this.configs),
      clients: new Map()
    };

    for (const [clientId, clientState] of this.clients) {
      if (clientState.blocked) {
        stats.blockedClients++;
      }
      stats.clients.set(clientId, this.getClientStats(clientId));
    }

    return stats;
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [clientId, clientState] of this.clients) {
      // Remove old request timestamps
      const config = this.configs.get('default')!;
      const windowStart = now - config.windowMs;
      clientState.requests = clientState.requests.filter(timestamp => timestamp > windowStart);

      // Remove clients with no recent activity
      if (clientState.requests.length === 0 && 
          (!clientState.blocked || (clientState.blockUntil && now >= clientState.blockUntil))) {
        this.clients.delete(clientId);
      }
    }

    logger.debug('Rate limiter cleanup completed', { 
      activeClients: this.clients.size 
    });
  }

  // Admin methods
  blockClient(clientId: string, durationMs: number): void {
    const clientState = this.clients.get(clientId) || { requests: [], blocked: false };
    clientState.blocked = true;
    clientState.blockUntil = Date.now() + durationMs;
    this.clients.set(clientId, clientState);
    
    logger.info('Client blocked', { clientId, durationMs });
  }

  unblockClient(clientId: string): void {
    const clientState = this.clients.get(clientId);
    if (clientState) {
      clientState.blocked = false;
      clientState.blockUntil = undefined;
      logger.info('Client unblocked', { clientId });
    }
  }

  updateConfig(service: string, config: RateLimitConfig): void {
    this.configs.set(service, config);
    logger.info('Rate limit config updated', { service, config });
  }
}
