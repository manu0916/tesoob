-- Record acceptance of the current legal terms for new storefront accounts.
ALTER TABLE `store_users` ADD COLUMN `legal_accepted_at` integer;
--> statement-breakpoint
ALTER TABLE `store_oauth_states` ADD COLUMN `legal_accepted` integer NOT NULL DEFAULT 0;
