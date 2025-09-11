import { Application, Router, Context, Next } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';
import { RateLimiter } from './src/rate-limiter.ts';
import { CircuitBreaker } from './src/circuit-breaker.ts';
import { AuthMiddleware } from './src/middleware/auth.ts';
import { LoggingMiddleware } from './src/middleware/logging.ts';
import { MetricsMiddleware } from './src/middleware/metrics.ts';
import { ValidationMiddleware } from './src/middleware/validation.ts';
import { SecurityMiddleware } from './src/middleware/security.ts';
import { ServiceRegistry } from './src/service-registry.ts';
import { LoadBalancer } from './src/load-balancer.ts';
import { ApiVersioning } from './src/api-versioning.ts';
import { HealthChecker } from './src/health-checker.ts';
import { logger } from './src/logger.ts';

// Load environment variables
await config({ export: true });

const app = new Application();
const router = new Router();

// Initialize components
const rateLimiter = new RateLimiter();
const circuitBreaker = new CircuitBreaker();
const serviceRegistry = new ServiceRegistry();
const loadBalancer = new LoadBalancer(serviceRegistry);
const apiVersioning = new ApiVersioning();
const healthChecker = new HealthChecker(serviceRegistry);

// Initialize middleware
const authMiddleware = new AuthMiddleware();
const loggingMiddleware = new LoggingMiddleware();
const metricsMiddleware = new MetricsMiddleware();
const validationMiddleware = new ValidationMiddleware();
const securityMiddleware = new SecurityMiddleware();

// Service configurations
const services = {
  auth: {
    name: 'auth-service',
    hosts: ['auth-service:8003'],
    healthCheck: '/health',
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000
    }
  },
  analytics: {
    name: 'analytics-service',
    hosts: ['analytics-service:8003'],
    healthCheck: '/health',
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000
    }
  },
  documents: {
    name: 'document-service',
    hosts: ['document-service:8002'],
    healthCheck: '/health',
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000
    }
  },
  instructions: {
    name: 'instruction-service',
    hosts: ['instruction-service:8005'],
    healthCheck: '/health',
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000
    }
  },
  ai: {
    name: 'ai-service',
    hosts: ['ai-service:8006'],
    healthCheck: '/health',
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000
    }
  },
  notifications: {
    name: 'notification-service',
    hosts: ['notification-service:8004'],
    healthCheck: '/health',
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000
    }
  },
  messagequeue: {
    name: 'message-queue-service',
    hosts: ['message-queue-service:8008'],
    healthCheck: '/health',
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000
    }
  }
};

// Register services
Object.entries(services).forEach(([key, service]) => {
  serviceRegistry.register(service.name, service);
  circuitBreaker.register(service.name, service.circuitBreaker);
});

// Global middleware
app.use(loggingMiddleware.middleware());
app.use(securityMiddleware.middleware());
app.use(metricsMiddleware.middleware());

// API Gateway health check
router.get('/gateway/health', async (ctx: Context) => {
  const health = await healthChecker.checkAll();
  ctx.response.status = health.overall ? 200 : 503;
  ctx.response.body = health;
});

// Service health checks
router.get('/gateway/health/:service', async (ctx: Context) => {
  const serviceName = ctx.params.service;
  const health = await healthChecker.checkService(serviceName);
  ctx.response.status = health.healthy ? 200 : 503;
  ctx.response.body = health;
});

// API routes with versioning
router.all('/api/:version/:service/*', async (ctx: Context, next: Next) => {
  const version = ctx.params.version;
  const service = ctx.params.service;
  const path = ctx.params[0] || '';

  // Validate API version
  if (!apiVersioning.isValidVersion(version)) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'Invalid API version',
      supportedVersions: apiVersioning.getSupportedVersions()
    };
    return;
  }

  // Rate limiting
  const clientId = ctx.request.ip;
  if (!await rateLimiter.isAllowed(clientId, service)) {
    ctx.response.status = 429;
    ctx.response.body = {
      error: 'Rate limit exceeded',
      retryAfter: rateLimiter.getRetryAfter(clientId, service)
    };
    return;
  }

  // Authentication (except for auth service login/register)
  if (service !== 'auth' || !['login', 'register', 'health'].some(endpoint => path.includes(endpoint))) {
    try {
      await authMiddleware.middleware()(ctx, next);
    } catch (error) {
      ctx.response.status = 401;
      ctx.response.body = { error: 'Authentication required' };
      return;
    }
  }

  // Get service configuration
  const serviceConfig = serviceRegistry.get(service);
  if (!serviceConfig) {
    ctx.response.status = 404;
    ctx.response.body = { error: 'Service not found' };
    return;
  }

  // Check circuit breaker
  if (!circuitBreaker.isAvailable(service)) {
    ctx.response.status = 503;
    ctx.response.body = { error: 'Service temporarily unavailable' };
    return;
  }

  // Load balancing
  const targetHost = loadBalancer.getTarget(service);
  if (!targetHost) {
    ctx.response.status = 503;
    ctx.response.body = { error: 'No healthy instances available' };
    return;
  }

  // Request validation
  try {
    await validationMiddleware.validateRequest(ctx, service, path);
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = { error: 'Request validation failed', details: error.message };
    return;
  }

  // Proxy request
  try {
    const targetUrl = `http://${targetHost}${path}`;
    const response = await fetch(targetUrl, {
      method: ctx.request.method,
      headers: {
        ...Object.fromEntries(ctx.request.headers.entries()),
        'X-Gateway-Version': version,
        'X-Gateway-Service': service,
        'X-Forwarded-For': ctx.request.ip,
        'X-Forwarded-Proto': ctx.request.url.protocol
      },
      body: ctx.request.hasBody ? ctx.request.body({ type: 'stream' }) : undefined
    });

    // Update circuit breaker
    circuitBreaker.recordResult(service, response.ok);

    // Copy response
    ctx.response.status = response.status;
    ctx.response.headers = new Headers(response.headers);
    
    if (response.body) {
      ctx.response.body = response.body;
    }

    // Response validation
    await validationMiddleware.validateResponse(ctx, service, path);

  } catch (error) {
    circuitBreaker.recordResult(service, false);
    logger.error('Proxy request failed', { service, error: error.message });
    
    ctx.response.status = 502;
    ctx.response.body = { error: 'Bad gateway' };
  }
});

// Metrics endpoint
router.get('/gateway/metrics', async (ctx: Context) => {
  const metrics = metricsMiddleware.getMetrics();
  ctx.response.body = metrics;
});

// Service discovery endpoint
router.get('/gateway/services', async (ctx: Context) => {
  const services = serviceRegistry.getAll();
  ctx.response.body = services;
});

app.use(router.routes());
app.use(router.allowedMethods());

// Error handling
app.use(async (ctx: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    logger.error('Unhandled error', { error: error.message, stack: error.stack });
    ctx.response.status = 500;
    ctx.response.body = { error: 'Internal server error' };
  }
});

// Start health checking
healthChecker.start();

// Start the server
const port = parseInt(Deno.env.get('PORT') || '8080');
logger.info(`API Gateway starting on port ${port}`);

await app.listen({ port });
