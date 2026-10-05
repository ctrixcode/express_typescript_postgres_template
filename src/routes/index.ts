import { Router } from 'express';
import { logger } from '@/utils';
import { appConfig } from '@/config';
import { HTTP_STATUS } from '@/constants';
import { client } from '@/database';
import { exampleRoutes } from '@/modules/example';
import { authRoutes } from '@/modules/auth';

const router = Router();

/**
 * @swagger
 * /healthz:
 *   get:
 *     summary: Liveness health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: The service process is running
 */
router.get('/healthz', (_, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: appConfig.APP.NODE_ENV,
  });
});

/**
 * @swagger
 * /readyz:
 *   get:
 *     summary: Readiness health check (verifies database connectivity)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: The service and database are ready to serve traffic
 *       503:
 *         description: Database connection is unavailable
 */
router.get('/readyz', async (_, res) => {
  try {
    if (client) {
      await client`SELECT 1`;
    }
    res.status(HTTP_STATUS.OK).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness probe failed - database unreachable:', error);
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      status: 'unready',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// Authentication routes
router.use('/auth', authRoutes);

// Example routes
router.use('/examples', exampleRoutes);

export default router;
