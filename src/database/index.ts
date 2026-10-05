import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { appConfig } from '@/config';
import { logger } from '@/utils';
import * as schema from './models';

const connectionString = appConfig.DB.URL;

let client: postgres.Sql;

try {
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
  // Safe mock client so module imports do not crash during isolated tests
  client = postgres('postgres://localhost:5432/test_fallback', { max: 1 });
}

export { client };
export const db = drizzle(client, { schema });

export type Database = typeof db;
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DbExecutor = Database | DbTransaction;

export * from './models';
