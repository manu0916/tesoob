-- Existing storefront databases receive the name field required for local account registration.
ALTER TABLE `store_users` ADD COLUMN `display_name` text;