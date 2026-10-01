import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { appConfig } from './config';
import { swaggerSpec } from './config/swagger';
import {
  generalLimiter,
  bodyParserMiddleware,
  corsMiddleware,
  requestLogger,
  notFoundHandler,
  errorHandler,
  sanitizeInput,
  xssProtection,
} from './middlewares/index';
import routes from './routes/index';

const app = express();

// Trust reverse proxy (e.g. Nginx, Cloudflare, AWS ALB) for accurate client IP resolution
app.set('trust proxy', 1);

// Core Middlewares
app.use(helmet());
app.use(corsMiddleware);
app.use(generalLimiter);
app.use(bodyParserMiddleware);
app.use(cookieParser());
app.use(requestLogger);

// Security Middlewares
app.use(xssProtection);
app.use(sanitizeInput);

// API Routes
app.use('/api', routes);

// Swagger Docs (gated: disabled by default in production)
if (appConfig.APP.ENABLE_SWAGGER) {
  app.use('/api-docs', ...swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
