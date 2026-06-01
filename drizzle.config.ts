import { defineConfig } from 'drizzle-kit';
import { appConfig } from './src/config';

export default defineConfig({
  schema: './src/database/models/*.model.ts',
  out: './src/database/migration',
  dialect: 'postgresql',
  dbCredentials: {
    url: appConfig.DB.URL,
  },
});
