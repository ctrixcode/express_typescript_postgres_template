import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { appConfig } from '@/config';
import { logger } from '@/utils';

const connectionString = appConfig.DB.URL;

let client!: postgres.Sql;

try {
  if (
    !process.env.DB_USERNAME ||
    !process.env.DB_NAME ||
    connectionString.includes('undefined')
  ) {
    throw new Error('DB Creds are not configured');
  }
  // Disable prefetch as it is not supported for "Transaction" pool mode
  client = postgres(connectionString, { prepare: false });
} catch {
  logger.error('DB Creds are not configured closing');
  process.exit(1);
}

export { client };
export const db = drizzle(client);
