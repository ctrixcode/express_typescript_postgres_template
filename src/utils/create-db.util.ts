import postgres from 'postgres';
import { appConfig } from '@/config';

async function createDatabase() {
  const username = appConfig.DB.USER;
  const password = appConfig.DB.PASSWORD;
  const host = appConfig.DB.HOST;
  const port = appConfig.DB.PORT;
  const dbName = appConfig.DB.NAME;

  // Connect to the default 'postgres' system database
  const defaultUrl = `postgres://${username}:${password}@${host}:${port}/postgres`;

  const sql = postgres(defaultUrl);

  try {
    const databases = await sql<{ datname: string }[]>`
      SELECT datname FROM pg_database WHERE datname = ${dbName}
    `;

    if (databases.length === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      // CREATE DATABASE cannot be executed as a parameterized query
      await sql.unsafe(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error('Error checking/creating database:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createDatabase();
