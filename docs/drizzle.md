# Drizzle ORM Guide

This guide provides an overview of how Drizzle ORM is integrated into this codebase, how to use it for database queries, and the purpose of the available database commands configured in `package.json`.

---

## 📖 Introduction

Drizzle ORM is a lightweight, type-safe Object-Relational Mapper (ORM) for TypeScript. In this project, Drizzle is configured to work with **PostgreSQL** using the `postgres.js` driver.

Key details of the database setup:

- **Config File**: `drizzle.config.ts` (located in the project root).
- **Database Client**: Instantiated and exported from `src/database/index.ts`.
- **Schema Files**: Defined individually under `src/database/models/*.model.ts`.
- **Migrations**: Outputted as SQL files inside `src/database/migration`.

---

## ⚙️ Drizzle CLI Commands

Below is a breakdown of the Drizzle and database scripts available in `package.json`:

| Command                  | Under-the-hood Command                                           | Purpose / Description                                                                                                                                                         |
| :----------------------- | :--------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run db:create`      | `ts-node -r tsconfig-paths/register src/utils/create-db.util.ts` | Connects to PostgreSQL using database administrative credentials (`DB.SYSTEM_URL`) and creates the application database if it doesn't already exist.                          |
| `npm run db:generate`    | `drizzle-kit generate`                                           | Compiles schema definitions from `src/database/models/*.model.ts` and generates corresponding SQL migration scripts in `src/database/migration/`.                             |
| `npm run db:migrate`     | `drizzle-kit migrate`                                            | Applies any pending migration scripts from the `src/database/migration/` directory onto the target database (`DB.URL`).                                                       |
| `npm run db:gen:migrate` | `npm run db:generate && npm run db:migrate`                      | A combination script that first compiles schema definitions to generate SQL migration scripts, then applies those pending migrations to the database.                         |
| `npm run db:push`        | `drizzle-kit push`                                               | Directly synchronization of your TypeScript model files to your database schema _without_ generating or running migration files. **Use only during rapid local prototyping.** |
| `npm run db:studio`      | `drizzle-kit studio`                                             | Launches a local database GUI server. You can view, add, delete, and edit database records directly in your browser.                                                          |

---

## 🛠️ Usage Patterns

### 1. Defining a Model (Schema)

Create schemas in `src/database/models/<name>.model.ts`. Here is a model example from `example.model.ts`:

```typescript
import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';

export const examples = pgTable('examples', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  isDeleted: boolean('is_deleted').default(false),
  tags: text('tags').array().default([]),
  price: integer('price').notNull(),
  metadata: jsonb('metadata').$type<{
    category: string;
    priority: 'low' | 'medium' | 'high';
    createdAt: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Infer types for selection and insertion
export type Example = typeof examples.$inferSelect;
export type NewExample = typeof examples.$inferInsert;
```

### 2. Querying Database (CRUD)

Import the database instance (`db`) from `@/database` to run queries:

#### Insert

```typescript
import { db } from '@/database';
import { examples, NewExample } from '@/database/models/example.model';

const newExample: NewExample = {
  name: 'Sample Item',
  description: 'A brief description',
  price: 100,
};

const [savedExample] = await db.insert(examples).values(newExample).returning();
```

#### Select with Filtering and Pagination

```typescript
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/database';
import { examples } from '@/database/models/example.model';

const page = 1;
const limit = 10;
const offset = (page - 1) * limit;

const resultExamples = await db
  .select()
  .from(examples)
  .where(eq(examples.isDeleted, false))
  .limit(limit)
  .offset(offset)
  .orderBy(desc(examples.createdAt));
```

#### Update

```typescript
import { eq } from 'drizzle-orm';
import { db } from '@/database';
import { examples } from '@/database/models/example.model';

const [updatedExample] = await db
  .update(examples)
  .set({ name: 'Updated Name', updatedAt: new Date() })
  .where(eq(examples.id, 1))
  .returning();
```

#### Delete (Soft Delete)

```typescript
import { eq } from 'drizzle-orm';
import { db } from '@/database';
import { examples } from '@/database/models/example.model';

await db.update(examples).set({ isDeleted: true }).where(eq(examples.id, 1));
```
