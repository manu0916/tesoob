CREATE TABLE `chat_admin_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chat_admin_accounts_email_unique` ON `chat_admin_accounts` (`email`);--> statement-breakpoint
CREATE TABLE `chat_admin_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`admin_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `chat_admin_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_chat_admin_session_expiry` ON `chat_admin_sessions` (`expires_at`);