import { Router } from 'oak';
import { Database } from '../database/database.ts';

const router = new Router();

router.get('/health', async (ctx) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    version: '1.0.0',
    checks: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  // Check database connection
  try {
    const db = new Database();
    const pool = db.getPool();
    
    if (pool) {
      const client = await pool.connect();
      await client.queryObject('SELECT 1');
      client.release();
      health.checks.database = 'healthy';
    } else {
      health.checks.database = 'not_configured';
    }
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check Redis connection (if implemented)
  try {
    // TODO: Implement Redis health check
    health.checks.redis = 'not_implemented';
  } catch (error) {
    health.checks.redis = 'unhealthy';
    health.status = 'degraded';
  }

  ctx.response.status = health.status === 'healthy' ? 200 : 503;
  ctx.response.body = health;
});

export { router as healthRouter };
