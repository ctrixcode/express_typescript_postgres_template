import postgres from 'postgres';
import { appConfig } from '@/config';

async function createDatabase() {
  const dbName = appConfig.DB.NAME;
  const sql = postgres(appConfig.DB.SYSTEM_URL);

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
