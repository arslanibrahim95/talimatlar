import { Context, Next } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { logger } from '../logger.ts';

interface RequestLog {
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  userId?: string;
  timestamp: number;
  duration?: number;
  status?: number;
  responseSize?: number;
}

export class LoggingMiddleware {
  private logs = new Map<string, RequestLog>();
  private maxLogs = 10000;

  middleware() {
    return async (ctx: Context, next: Next) => {
      const startTime = Date.now();
      const requestId = this.generateRequestId();
      
      // Store request info
      const requestLog: RequestLog = {
        method: ctx.request.method,
        url: ctx.request.url.toString(),
        userAgent: ctx.request.headers.get('User-Agent') || undefined,
        ip: ctx.request.ip,
        userId: (ctx as any).user?.id,
        timestamp: startTime
      };

      this.logs.set(requestId, requestLog);

      // Add request ID to context
      (ctx as any).requestId = requestId;

      try {
        await next();
      } finally {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Update request log
        requestLog.duration = duration;
        requestLog.status = ctx.response.status;
        requestLog.responseSize = ctx.response.headers.get('Content-Length') 
          ? parseInt(ctx.response.headers.get('Content-Length')!) 
          : undefined;

        // Log the request
        this.logRequest(requestLog);

        // Cleanup old logs
        this.cleanupLogs();
      }
    };
  }

  private logRequest(requestLog: RequestLog): void {
    const logData = {
      method: requestLog.method,
      url: requestLog.url,
      status: requestLog.status,
      duration: requestLog.duration,
      ip: requestLog.ip,
      userAgent: requestLog.userAgent,
      userId: requestLog.userId,
      responseSize: requestLog.responseSize
    };

    if (requestLog.status && requestLog.status >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private cleanupLogs(): void {
    if (this.logs.size > this.maxLogs) {
      const entries = Array.from(this.logs.entries());
      const toRemove = entries.slice(0, entries.length - this.maxLogs);
      
      for (const [requestId] of toRemove) {
        this.logs.delete(requestId);
      }
    }
  }

  getLogs(limit: number = 100): RequestLog[] {
    const entries = Array.from(this.logs.values());
    return entries.slice(-limit);
  }

  getLogsByUser(userId: string, limit: number = 100): RequestLog[] {
    const entries = Array.from(this.logs.values());
    return entries
      .filter(log => log.userId === userId)
      .slice(-limit);
  }

  getLogsByStatus(status: number, limit: number = 100): RequestLog[] {
    const entries = Array.from(this.logs.values());
    return entries
      .filter(log => log.status === status)
      .slice(-limit);
  }

  getStats(): any {
    const entries = Array.from(this.logs.values());
    const total = entries.length;
    
    if (total === 0) {
      return { total: 0 };
    }

    const statusCounts: Record<number, number> = {};
    const methodCounts: Record<string, number> = {};
    let totalDuration = 0;
    let totalResponseSize = 0;

    for (const log of entries) {
      // Status counts
      if (log.status) {
        statusCounts[log.status] = (statusCounts[log.status] || 0) + 1;
      }

      // Method counts
      methodCounts[log.method] = (methodCounts[log.method] || 0) + 1;

      // Duration and response size
      if (log.duration) {
        totalDuration += log.duration;
      }
      if (log.responseSize) {
        totalResponseSize += log.responseSize;
      }
    }

    return {
      total,
      statusCounts,
      methodCounts,
      averageDuration: totalDuration / total,
      totalResponseSize,
      averageResponseSize: totalResponseSize / total
    };
  }

  clearLogs(): void {
    this.logs.clear();
    logger.info('Request logs cleared');
  }
}
