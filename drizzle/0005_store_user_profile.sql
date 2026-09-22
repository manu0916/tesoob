-- Stores the customer's reusable personal information (name, CPF, delivery address)
-- as an authenticated AES-256-GCM envelope, following the same pattern as store_orders.
CREATE TABLE IF NOT EXISTS `store_user_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`profile_ciphertext` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `store_users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "store_user_profile_encrypted" CHECK("store_user_profiles"."profile_ciphertext" LIKE '%.%.%')
);
