-- Additive D1 migration. Existing chat_* data is not changed.
-- Create parent tables before tables/indexes that reference them.
CREATE TABLE IF NOT EXISTS `store_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`google_id` text,
	`enabled` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "store_user_identity" CHECK("store_users"."password_hash" IS NOT NULL OR "store_users"."google_id" IS NOT NULL),
	CONSTRAINT "store_email_normalized" CHECK("store_users"."email" = lower(trim("store_users"."email"))),
	CONSTRAINT "store_user_enabled" CHECK("store_users"."enabled" IN (0,1))
);

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `store_users_email_unique` ON `store_users` (`email`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `store_users_google_id_unique` ON `store_users` (`google_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `store_products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price_cents` integer NOT NULL,
	`image_url` text NOT NULL,
	`description` text NOT NULL,
	`observation` text,
	`active` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "store_product_price" CHECK("store_products"."price_cents">0 AND "store_products"."price_cents"<=999999999999),
	CONSTRAINT "store_product_name" CHECK(length(trim("store_products"."name")) BETWEEN 1 AND 140),
	CONSTRAINT "store_product_description" CHECK(length(trim("store_products"."description"))>0),
	CONSTRAINT "store_product_observation" CHECK("store_products"."observation" IS NULL OR length(trim("store_products"."observation"))>0),
	CONSTRAINT "store_product_active" CHECK("store_products"."active" IN (0,1))
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `store_products_public` ON `store_products` (`active`,`created_at`,`id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `store_oauth_states` (
	`state_hash` text PRIMARY KEY NOT NULL,
	`verifier` text NOT NULL,
	`nonce` text NOT NULL,
	`expires_at` integer NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `store_oauth_expiry` ON `store_oauth_states` (`expires_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `store_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`total_cents` integer NOT NULL,
	`currency` text DEFAULT 'BRL' NOT NULL,
	`status` text DEFAULT 'AWAITING_INTEGRATION' NOT NULL,
	`checkout_ciphertext` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `store_users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `store_products`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "store_order_quantity" CHECK("store_orders"."quantity" BETWEEN 1 AND 10),
	CONSTRAINT "store_order_price" CHECK("store_orders"."unit_price_cents">0),
	CONSTRAINT "store_order_total" CHECK("store_orders"."total_cents"="store_orders"."quantity"*"store_orders"."unit_price_cents"),
	CONSTRAINT "store_order_currency" CHECK("store_orders"."currency"='BRL'),
	CONSTRAINT "store_order_status" CHECK("store_orders"."status" IN ('AWAITING_INTEGRATION','PENDING_PAYMENT','PAID','CANCELLED')),
	CONSTRAINT "store_order_encrypted" CHECK("store_orders"."checkout_ciphertext" LIKE '%.%.%')
);

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `store_orders_idempotency` ON `store_orders` (`user_id`,`idempotency_key`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `store_orders_owner` ON `store_orders` (`user_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `store_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`hits` integer NOT NULL,
	`expires_at` integer NOT NULL
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `store_rate_expiry` ON `store_rate_limits` (`expires_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `store_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `store_users`(`id`) ON UPDATE no action ON DELETE cascade
);

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `store_session_expiry` ON `store_sessions` (`expires_at`);
