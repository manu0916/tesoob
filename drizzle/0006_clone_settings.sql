CREATE TABLE IF NOT EXISTS `clone_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`whatsapp_number` text NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "clone_settings_singleton" CHECK("clone_settings"."id" = 1),
	CONSTRAINT "clone_settings_whatsapp" CHECK(length("clone_settings"."whatsapp_number") BETWEEN 10 AND 15)
);
