import { Application, Router } from 'oak';
import { cors } from 'cors';
import { config } from './config.ts';
import { authRouter } from './routes/auth.ts';
import { userRouter } from './routes/user.ts';
import { healthRouter } from './routes/health.ts';
import { errorHandler } from './middleware/error.ts';
import { logger } from './utils/logger.ts';
import { Database } from './database/database.ts';

const app = new Application();
const router = new Router();

// CORS middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Logger middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info(`${ctx.request.method} ${ctx.request.url.pathname} - ${ctx.response.status} - ${ms}ms`);
});

// Error handler
app.use(errorHandler);

// Health check
app.use(healthRouter.routes());
app.use(healthRouter.allowedMethods());

// API routes
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());
app.use(userRouter.routes());
app.use(userRouter.allowedMethods());

// Root route
router.get('/', (ctx) => {
  ctx.response.body = {
    service: 'Claude Auth Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

// Initialize database
const db = new Database();
await db.initialize();

logger.info(`🚀 Auth Service starting on port ${config.port}`);
logger.info(`📊 Environment: ${config.nodeEnv}`);
logger.info(`🔗 Database: ${config.databaseUrl ? 'Connected' : 'Not configured'}`);

await app.listen({ port: config.port });
