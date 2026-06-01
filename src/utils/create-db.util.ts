import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function createDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not defined in environment variables.');
    process.exit(1);
  }

  // Parse connection details
  const matches = connectionString.match(
    /postgres:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)/
  );
  if (!matches) {
    console.error('Invalid DATABASE_URL format.');
    process.exit(1);
  }

  const [, username, password, host, port, dbName] = matches;

  // Connect to the default 'postgres' system database
  const defaultUrl = password
    ? `postgres://${username}:${password}@${host}:${port}/postgres`
    : `postgres://${username}@${host}:${port}/postgres`;

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
