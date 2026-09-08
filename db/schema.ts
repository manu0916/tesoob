import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const conversations = sqliteTable(
  'chat_conversations',
  {
    id: text('id').primaryKey(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: integer('expires_at').notNull(),
    customerName: text('customer_name').notNull(),
    contact: text('contact').notNull().default(''),
    reference: text('reference').notNull().default(''),
    status: text('status', { enum: ['new', 'active', 'closed'] })
      .notNull()
      .default('new'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    customerReadId: integer('customer_read_id').notNull().default(0),
    adminReadId: integer('admin_read_id').notNull().default(0),
  },
  (table) => [index('idx_chat_conversations_updated').on(table.updatedAt)],
);

export const messages = sqliteTable(
  'chat_messages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    sender: text('sender', { enum: ['customer', 'admin'] }).notNull(),
    body: text('body').notNull(),
    clientId: text('client_id').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    index('idx_chat_messages_conversation_id').on(
      table.conversationId,
      table.id,
    ),
    uniqueIndex('idx_chat_messages_idempotency').on(
      table.conversationId,
      table.sender,
      table.clientId,
    ),
  ],
);

export const rateLimits = sqliteTable(
  'chat_rate_limits',
  {
    key: text('key').primaryKey(),
    hits: integer('hits').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (table) => [index('idx_chat_rate_expiry').on(table.expiresAt)],
);

export const adminAccounts = sqliteTable('chat_admin_accounts', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const adminSessions = sqliteTable(
  'chat_admin_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    adminId: text('admin_id')
      .notNull()
      .references(() => adminAccounts.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at').notNull(),
  },
  (table) => [index('idx_chat_admin_session_expiry').on(table.expiresAt)],
);
