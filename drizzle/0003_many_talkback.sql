ALTER TABLE `meetings` MODIFY COLUMN `clientName` varchar(100);--> statement-breakpoint
ALTER TABLE `meetings` ADD `projectName` varchar(200) NOT NULL;--> statement-breakpoint
ALTER TABLE `evaluations` DROP COLUMN `evaluatorName`;