import swaggerJSDoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express TS PostgreSQL Enterprise API',
    version,
    description:
      'Enterprise-grade REST API built with Express, TypeScript, and PostgreSQL (Drizzle ORM).',
    license: {
      name: 'ISC',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API base path',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT access token in the format: Bearer <token>',
      },
    },
  },
};

const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: [
    './src/routes/index.ts',
    './src/modules/**/*.routes.ts',
    './src/modules/**/*.schema.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
