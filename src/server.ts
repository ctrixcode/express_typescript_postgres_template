import { Server } from 'http';
import app from './app';
import { logger } from './utils';
import { appConfig } from './config';
import { client } from './database';

const PORT = appConfig.APP.PORT;

let server: Server | undefined;

(async () => {
  try {
    logger.info('Initializing server...');

    // Verify database connectivity on startup
    if (client) {
      try {
        await client`SELECT 1`;
        logger.info('✅ Database connection established.');
      } catch (dbError) {
        logger.warn(
          '⚠️ Database connection could not be established on startup:',
          dbError
        );
      }
    }

    server = app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(
        `📊 Health check available at: http://localhost:${PORT}/api/healthz`
      );
      if (appConfig.APP.ENABLE_SWAGGER) {
        logger.info(
          `📚 API docs available at: http://localhost:${PORT}/api-docs`
        );
      }
      logger.info(`🌍 Environment: ${appConfig.APP.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// Guard flag to ensure shutdown sequence executes exactly once
let isShuttingDown = false;

/**
 * Handles graceful termination of the application upon receiving OS signals
 * or fatal process errors (SIGTERM, SIGINT, uncaughtException).
 *
 * Steps:
 * 1. Stops the HTTP server from accepting new incoming requests (`server.close()`).
 * 2. Allows existing in-flight HTTP requests to finish.
 * 3. Gracefully closes the PostgreSQL connection pool (`client.end()`).
 * 4. Safety net: Sets a 10-second force-kill timer via `setTimeout(..., 10000).unref()`.
 *    `.unref()` ensures this safety timer does NOT keep the event loop alive if everything drains early.
 */
const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Force kill the process if graceful draining hangs longer than 10 seconds
  const forceExitTimer = setTimeout(() => {
    logger.error('Forcing shutdown after 10s timeout.');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  try {
    // Step 1 & 2: Close HTTP server and wait for active requests to finish
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close(err => {
          if (err) return reject(err);
          logger.info('HTTP server closed.');
          resolve();
        });
      });
    }

    // Step 3: Drain PostgreSQL connection pool safely
    if (client) {
      await client.end({ timeout: 5 });
      logger.info('Database connection pool closed.');
    }

    logger.info('Application gracefully shut down.');
    process.exit(0);
  } catch (err) {
    logger.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
};

// Process-level event listeners
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', error => {
  logger.error('UNCAUGHT_EXCEPTION: The process will shut down', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', reason => {
  logger.error('UNHANDLED_REJECTION: An unhandled promise was rejected', {
    reason,
  });
  gracefulShutdown('unhandledRejection');
});
