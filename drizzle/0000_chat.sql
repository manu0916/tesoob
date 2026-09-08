CREATE TABLE `chat_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`customer_name` text NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`customer_read_id` integer DEFAULT 0 NOT NULL,
	`admin_read_id` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chat_conversations_token_hash_unique` ON `chat_conversations` (`token_hash`);--> statement-breakpoint
CREATE INDEX `idx_chat_conversations_updated` ON `chat_conversations` (`updated_at`);--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversation_id` text NOT NULL,
	`sender` text NOT NULL,
	`body` text NOT NULL,
	`client_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_chat_messages_conversation_id` ON `chat_messages` (`conversation_id`,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_chat_messages_idempotency` ON `chat_messages` (`conversation_id`,`sender`,`client_id`);--> statement-breakpoint
CREATE TABLE `chat_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`hits` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_chat_rate_expiry` ON `chat_rate_limits` (`expires_at`);