import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user.model';

export const authSessionTokens = pgTable('auth_session_tokens', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  jti: text('jti').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isUsed: boolean('is_used').default(false),
  userAgent: text('user_agent').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type AuthSessionToken = typeof authSessionTokens.$inferSelect;
export type NewAuthSessionToken = typeof authSessionTokens.$inferInsert;
