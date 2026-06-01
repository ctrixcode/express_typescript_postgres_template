import dotenv from 'dotenv';

dotenv.config();

const config = {
  APP: {
    PORT: process.env.PORT || 4000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    ENCRYPTION_KEY:
      process.env.ENCRYPTION_KEY || 'thisisasecretkeyfor32byteslong!',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000'],
  },
  JWT: {
    ACCESS_TOKEN_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey',
    ACCESS_TOKEN_TIME: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '59m',
    REFRESH_TOKEN_TIME: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  DB: {
    USER: process.env.DB_USERNAME || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || '',
    HOST: process.env.DB_HOST || 'localhost',
    PORT: process.env.DB_PORT || '5432',
    NAME: process.env.DB_NAME || 'express_ts_db',
    URL: `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    SYSTEM_URL: `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/postgres`,
  },
};

// Validate encryption key length
if (config.APP.ENCRYPTION_KEY.length !== 32) {
  console.error(
    'ERROR: ENCRYPTION_KEY must be a 32-byte string. Please set it in your .env file.'
  );
  process.exit(1);
}

export const appConfig = Object.freeze(config);
