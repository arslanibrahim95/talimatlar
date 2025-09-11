import { Context, Next } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { logger } from '../logger.ts';

interface SecurityConfig {
  maxRequestSize: number;
  allowedMethods: string[];
  blockedUserAgents: RegExp[];
  blockedIPs: string[];
  allowedOrigins: string[];
  enableCORS: boolean;
  enableCSRF: boolean;
  enableXSSProtection: boolean;
  enableClickjackingProtection: boolean;
}

export class SecurityMiddleware {
  private config: SecurityConfig;
  private suspiciousIPs = new Map<string, { count: number; lastSeen: number }>();

  constructor() {
    this.config = {
      maxRequestSize: 50 * 1024 * 1024, // 50MB
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      blockedUserAgents: [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i
      ],
      blockedIPs: [],
      allowedOrigins: ['http://localhost:3000', 'https://yourdomain.com'],
      enableCORS: true,
      enableCSRF: true,
      enableXSSProtection: true,
      enableClickjackingProtection: true
    };

    // Cleanup suspicious IPs every hour
    setInterval(() => this.cleanupSuspiciousIPs(), 3600000);
  }

  middleware() {
    return async (ctx: Context, next: Next) => {
      try {
        // Check request size
        await this.checkRequestSize(ctx);

        // Check allowed methods
        this.checkAllowedMethods(ctx);

        // Check blocked user agents
        this.checkUserAgent(ctx);

        // Check blocked IPs
        this.checkBlockedIPs(ctx);

        // Check for suspicious activity
        this.checkSuspiciousActivity(ctx);

        // Add security headers
        this.addSecurityHeaders(ctx);

        // Handle CORS
        if (this.config.enableCORS) {
          this.handleCORS(ctx);
        }

        // Handle preflight requests
        if (ctx.request.method === 'OPTIONS') {
          ctx.response.status = 200;
          return;
        }

        await next();

      } catch (error) {
        if (error instanceof SecurityError) {
          ctx.response.status = error.status;
          ctx.response.body = { error: error.message };
          return;
        }
        throw error;
      }
    };
  }

  private async checkRequestSize(ctx: Context): Promise<void> {
    const contentLength = ctx.request.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength) > this.config.maxRequestSize) {
      throw new SecurityError('Request too large', 413);
    }
  }

  private checkAllowedMethods(ctx: Context): void {
    if (!this.config.allowedMethods.includes(ctx.request.method)) {
      throw new SecurityError('Method not allowed', 405);
    }
  }

  private checkUserAgent(ctx: Context): void {
    const userAgent = ctx.request.headers.get('User-Agent');
    if (userAgent) {
      for (const blockedPattern of this.config.blockedUserAgents) {
        if (blockedPattern.test(userAgent)) {
          throw new SecurityError('Blocked user agent', 403);
        }
      }
    }
  }

  private checkBlockedIPs(ctx: Context): void {
    const clientIP = ctx.request.ip;
    if (this.config.blockedIPs.includes(clientIP)) {
      throw new SecurityError('IP address blocked', 403);
    }
  }

  private checkSuspiciousActivity(ctx: Context): void {
    const clientIP = ctx.request.ip;
    const now = Date.now();
    
    // Check for rapid requests
    const suspicious = this.suspiciousIPs.get(clientIP);
    if (suspicious) {
      const timeDiff = now - suspicious.lastSeen;
      if (timeDiff < 1000) { // Less than 1 second between requests
        suspicious.count++;
        suspicious.lastSeen = now;
        
        if (suspicious.count > 10) {
          logger.warn('Suspicious activity detected', { ip: clientIP, count: suspicious.count });
          throw new SecurityError('Too many requests', 429);
        }
      } else {
        // Reset counter if enough time has passed
        suspicious.count = 1;
        suspicious.lastSeen = now;
      }
    } else {
      this.suspiciousIPs.set(clientIP, { count: 1, lastSeen: now });
    }

    // Check for suspicious patterns in URL
    const url = ctx.request.url.toString();
    if (this.containsSuspiciousPatterns(url)) {
      logger.warn('Suspicious URL pattern detected', { ip: clientIP, url });
      throw new SecurityError('Suspicious request pattern', 400);
    }
  }

  private containsSuspiciousPatterns(url: string): boolean {
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /<script/i, // XSS attempts
      /javascript:/i, // JavaScript injection
      /on\w+\s*=/i, // Event handlers
      /union\s+select/i, // SQL injection
      /drop\s+table/i, // SQL injection
      /exec\s*\(/i, // Command injection
      /eval\s*\(/i, // Code injection
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  private addSecurityHeaders(ctx: Context): void {
    const headers = ctx.response.headers;

    // XSS Protection
    if (this.config.enableXSSProtection) {
      headers.set('X-XSS-Protection', '1; mode=block');
    }

    // Clickjacking Protection
    if (this.config.enableClickjackingProtection) {
      headers.set('X-Frame-Options', 'DENY');
    }

    // Content Type Options
    headers.set('X-Content-Type-Options', 'nosniff');

    // Referrer Policy
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Content Security Policy
    headers.set('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https:; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
    );

    // Strict Transport Security (only for HTTPS)
    if (ctx.request.url.protocol === 'https:') {
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
  }

  private handleCORS(ctx: Context): void {
    const origin = ctx.request.headers.get('Origin');
    const headers = ctx.response.headers;

    if (origin && this.config.allowedOrigins.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
    } else if (this.config.allowedOrigins.includes('*')) {
      headers.set('Access-Control-Allow-Origin', '*');
    }

    headers.set('Access-Control-Allow-Methods', this.config.allowedMethods.join(', '));
    headers.set('Access-Control-Allow-Headers', 
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-User-ID, X-User-Role, X-Tenant-ID'
    );
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Max-Age', '86400');
  }

  private cleanupSuspiciousIPs(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [ip, data] of this.suspiciousIPs) {
      if (now - data.lastSeen > maxAge) {
        this.suspiciousIPs.delete(ip);
      }
    }
  }

  // Admin methods
  blockIP(ip: string): void {
    if (!this.config.blockedIPs.includes(ip)) {
      this.config.blockedIPs.push(ip);
      logger.info('IP blocked', { ip });
    }
  }

  unblockIP(ip: string): void {
    const index = this.config.blockedIPs.indexOf(ip);
    if (index > -1) {
      this.config.blockedIPs.splice(index, 1);
      logger.info('IP unblocked', { ip });
    }
  }

  addAllowedOrigin(origin: string): void {
    if (!this.config.allowedOrigins.includes(origin)) {
      this.config.allowedOrigins.push(origin);
      logger.info('Origin added to allowed list', { origin });
    }
  }

  removeAllowedOrigin(origin: string): void {
    const index = this.config.allowedOrigins.indexOf(origin);
    if (index > -1) {
      this.config.allowedOrigins.splice(index, 1);
      logger.info('Origin removed from allowed list', { origin });
    }
  }

  getSecurityStats(): any {
    return {
      blockedIPs: this.config.blockedIPs,
      suspiciousIPs: Object.fromEntries(this.suspiciousIPs),
      allowedOrigins: this.config.allowedOrigins,
      config: this.config
    };
  }

  updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Security config updated', { config });
  }
}

class SecurityError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'SecurityError';
  }
}
