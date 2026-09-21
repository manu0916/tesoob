import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/sqlite-core';

export const storeUsers = sqliteTable(
  'store_users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash'),
    googleId: text('google_id').unique(),
    enabled: integer('enabled').notNull().default(1),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    check(
      'store_user_identity',
      sql`${t.passwordHash} IS NOT NULL OR ${t.googleId} IS NOT NULL`,
    ),
    check('store_email_normalized', sql`${t.email} = lower(trim(${t.email}))`),
    check('store_user_enabled', sql`${t.enabled} IN (0,1)`),
  ],
);
export const storeSessions = sqliteTable(
  'store_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => storeUsers.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [index('store_session_expiry').on(t.expiresAt)],
);
export const storeProducts = sqliteTable(
  'store_products',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    priceCents: integer('price_cents').notNull(),
    imageUrl: text('image_url').notNull(),
    description: text('description').notNull(),
    observation: text('observation'),
    active: integer('active').notNull().default(1),
    version: integer('version').notNull().default(0),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    index('store_products_public').on(t.active, t.createdAt, t.id),
    check(
      'store_product_price',
      sql`${t.priceCents}>0 AND ${t.priceCents}<=999999999999`,
    ),
    check('store_product_name', sql`length(trim(${t.name})) BETWEEN 1 AND 140`),
    check('store_product_description', sql`length(trim(${t.description}))>0`),
    check(
      'store_product_observation',
      sql`${t.observation} IS NULL OR length(trim(${t.observation}))>0`,
    ),
    check('store_product_active', sql`${t.active} IN (0,1)`),
  ],
);
export const storeOrders = sqliteTable(
  'store_orders',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => storeUsers.id),
    productId: text('product_id')
      .notNull()
      .references(() => storeProducts.id),
    productName: text('product_name').notNull(),
    quantity: integer('quantity').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
    totalCents: integer('total_cents').notNull(),
    currency: text('currency').notNull().default('BRL'),
    status: text('status').notNull().default('AWAITING_INTEGRATION'),
    checkoutCiphertext: text('checkout_ciphertext').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [
    uniqueIndex('store_orders_idempotency').on(t.userId, t.idempotencyKey),
    index('store_orders_owner').on(t.userId, t.createdAt),
    check('store_order_quantity', sql`${t.quantity} BETWEEN 1 AND 10`),
    check('store_order_price', sql`${t.unitPriceCents}>0`),
    check(
      'store_order_total',
      sql`${t.totalCents}=${t.quantity}*${t.unitPriceCents}`,
    ),
    check('store_order_currency', sql`${t.currency}='BRL'`),
    check(
      'store_order_status',
      sql`${t.status} IN ('AWAITING_INTEGRATION','PENDING_PAYMENT','PAID','CANCELLED')`,
    ),
    check('store_order_encrypted', sql`${t.checkoutCiphertext} LIKE '%.%.%'`),
  ],
);
export const storeOAuthStates = sqliteTable(
  'store_oauth_states',
  {
    stateHash: text('state_hash').primaryKey(),
    verifier: text('verifier').notNull(),
    nonce: text('nonce').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [index('store_oauth_expiry').on(t.expiresAt)],
);
export const storeRateLimits = sqliteTable(
  'store_rate_limits',
  {
    key: text('key').primaryKey(),
    hits: integer('hits').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [index('store_rate_expiry').on(t.expiresAt)],
);
