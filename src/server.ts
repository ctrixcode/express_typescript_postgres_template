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

let isShuttingDown = false;

// Function to handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Force close if server hasn't exited within 10 seconds
  const forceExitTimer = setTimeout(() => {
    logger.error('Forcing shutdown after 10s timeout.');
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close(err => {
          if (err) return reject(err);
          logger.info('HTTP server closed.');
          resolve();
        });
      });
    }

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
