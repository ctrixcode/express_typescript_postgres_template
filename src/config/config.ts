import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

// Development default fallback keys (strictly prohibited in production)
const DEV_DEFAULT_ENCRYPTION_KEY = 'your-32-byte-encryption-key-here';
const DEV_DEFAULT_ACCESS_SECRET =
  'dev_only_super_secret_access_jwt_key_32chars!';
const DEV_DEFAULT_REFRESH_SECRET =
  'dev_only_super_secret_refresh_jwt_key_32chars!';

const accessTokenSecret =
  process.env.JWT_ACCESS_TOKEN_SECRET ||
  process.env.JWT_SECRET ||
  (isProduction ? '' : DEV_DEFAULT_ACCESS_SECRET);

const refreshTokenSecret =
  process.env.JWT_REFRESH_TOKEN_SECRET ||
  (isProduction ? '' : DEV_DEFAULT_REFRESH_SECRET);

const encryptionKey =
  process.env.ENCRYPTION_KEY ||
  (isProduction ? '' : DEV_DEFAULT_ENCRYPTION_KEY);

const dbUser = process.env.DB_USERNAME || 'postgres';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'express_ts_db';

const config = {
  APP: {
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    ENCRYPTION_KEY: encryptionKey,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000'],
    ENABLE_SWAGGER:
      process.env.ENABLE_SWAGGER !== undefined
        ? process.env.ENABLE_SWAGGER === 'true'
        : !isProduction,
  },
  JWT: {
    ACCESS_TOKEN_SECRET: accessTokenSecret,
    REFRESH_TOKEN_SECRET: refreshTokenSecret,
    ACCESS_TOKEN_TIME: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
    REFRESH_TOKEN_TIME: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  DB: {
    USER: dbUser,
    PASSWORD: dbPassword,
    HOST: dbHost,
    PORT: dbPort,
    NAME: dbName,
    SSL: process.env.DB_SSL === 'true' || isProduction,
    URL: `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`,
    SYSTEM_URL: `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/postgres`,
  },
};

// Security Validations
if (config.APP.ENCRYPTION_KEY.length !== 32) {
  console.error(
    'CRITICAL SECURITY ERROR: ENCRYPTION_KEY must be a 32-character string. Please set it in your .env file.'
  );
  process.exit(1);
}

if (isProduction) {
  if (
    !process.env.JWT_ACCESS_TOKEN_SECRET ||
    config.JWT.ACCESS_TOKEN_SECRET.length < 32 ||
    config.JWT.ACCESS_TOKEN_SECRET === DEV_DEFAULT_ACCESS_SECRET
  ) {
    console.error(
      'CRITICAL SECURITY ERROR: JWT_ACCESS_TOKEN_SECRET must be set in production with at least 32 characters and cannot use default dev secret.'
    );
    process.exit(1);
  }

  if (
    !process.env.JWT_REFRESH_TOKEN_SECRET ||
    config.JWT.REFRESH_TOKEN_SECRET.length < 32 ||
    config.JWT.REFRESH_TOKEN_SECRET === DEV_DEFAULT_REFRESH_SECRET
  ) {
    console.error(
      'CRITICAL SECURITY ERROR: JWT_REFRESH_TOKEN_SECRET must be set in production with at least 32 characters and cannot use default dev secret.'
    );
    process.exit(1);
  }

  if (config.JWT.ACCESS_TOKEN_SECRET === config.JWT.REFRESH_TOKEN_SECRET) {
    console.error(
      'CRITICAL SECURITY ERROR: JWT_ACCESS_TOKEN_SECRET and JWT_REFRESH_TOKEN_SECRET must be different secrets.'
    );
    process.exit(1);
  }

  if (config.APP.ENCRYPTION_KEY === DEV_DEFAULT_ENCRYPTION_KEY) {
    console.error(
      'CRITICAL SECURITY ERROR: ENCRYPTION_KEY cannot use default development key in production.'
    );
    process.exit(1);
  }
} else if (
  config.JWT.ACCESS_TOKEN_SECRET === DEV_DEFAULT_ACCESS_SECRET ||
  config.APP.ENCRYPTION_KEY === DEV_DEFAULT_ENCRYPTION_KEY
) {
  console.warn(
    'SECURITY WARNING: Running in non-production mode with default development secrets. Set custom secrets in .env for security.'
  );
}

export const appConfig = Object.freeze(config);
