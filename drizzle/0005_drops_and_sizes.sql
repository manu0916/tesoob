CREATE TABLE IF NOT EXISTS `store_drops` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`launches_at` integer NOT NULL,
	`cancelled_at` integer,
	`version` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "store_drop_name" CHECK(length(trim("store_drops"."name")) BETWEEN 1 AND 140)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `store_drops_schedule` ON `store_drops` (`cancelled_at`,`launches_at`);
--> statement-breakpoint
ALTER TABLE `store_products` ADD `sizes_json` text DEFAULT '[]' NOT NULL CHECK(json_valid(`sizes_json`));
--> statement-breakpoint
ALTER TABLE `store_products` ADD `drop_id` text REFERENCES `store_drops`(`id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `store_products_drop` ON `store_products` (`drop_id`,`active`);
--> statement-breakpoint
ALTER TABLE `store_orders` ADD `product_size` text;
