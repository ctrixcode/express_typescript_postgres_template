import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { appConfig } from '@/config';
import { logger } from '@/utils';

const connectionString = appConfig.DB.URL;

let client!: postgres.Sql;

try {
  if (
    (!process.env.DB_USERNAME && appConfig.APP.NODE_ENV !== 'test') ||
    (!process.env.DB_NAME && appConfig.APP.NODE_ENV !== 'test') ||
    (connectionString.includes('undefined') &&
      appConfig.APP.NODE_ENV !== 'test')
  ) {
    throw new Error(
      'Database credentials are not configured in environment variables.'
    );
  }

  // Postgres client with SSL support and managed pool timeouts
  client = postgres(connectionString, {
    prepare: false, // Transaction pool mode compatible
    ssl: appConfig.DB.SSL ? 'require' : false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
} catch (error) {
  logger.error('CRITICAL: Database configuration error:', error);
  if (appConfig.APP.NODE_ENV !== 'test') {
    process.exit(1);
  }
}

import * as schema from './models';

export { client };
export const db = drizzle(client, { schema });

export type Database = typeof db;
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbExecutor = Database | DbTransaction;

export * from './models';
