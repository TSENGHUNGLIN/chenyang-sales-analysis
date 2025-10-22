CREATE TABLE `aiAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`keywords` json NOT NULL,
	`sentimentOverall` varchar(20) NOT NULL,
	`sentimentScore` int NOT NULL,
	`successFactors` json NOT NULL,
	`questionQuality` int NOT NULL,
	`responseCompleteness` int NOT NULL,
	`professionalTermUsage` int NOT NULL,
	`controlLevel` int NOT NULL,
	`clientType` enum('budget','design','quality','timeline','hesitant') NOT NULL,
	`clientTypeConfidence` int NOT NULL,
	`improvementSuggestions` json NOT NULL,
	`analyzedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiAnalysis_id` PRIMARY KEY(`id`),
	CONSTRAINT `aiAnalysis_meetingId_unique` UNIQUE(`meetingId`)
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`evaluatorId` int NOT NULL,
	`evaluatorName` varchar(100) NOT NULL,
	`score1` int NOT NULL,
	`score2` int NOT NULL,
	`score3` int NOT NULL,
	`score4` int NOT NULL,
	`score5` int NOT NULL,
	`score6` int NOT NULL,
	`score7` int NOT NULL,
	`score8` int NOT NULL,
	`score9` int NOT NULL,
	`score10` int NOT NULL,
	`score11` int NOT NULL,
	`score12` int NOT NULL,
	`score13` int NOT NULL,
	`score14` int NOT NULL,
	`score15` int NOT NULL,
	`score16` int NOT NULL,
	`score17` int NOT NULL,
	`score18` int NOT NULL,
	`score19` int NOT NULL,
	`score20` int NOT NULL,
	`totalScore` int NOT NULL,
	`performanceLevel` enum('needs_improvement','basic','developing','competent','excellent') NOT NULL,
	`manualNotes` text,
	`evaluatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `failedCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`salespersonId` int NOT NULL,
	`clientName` varchar(100) NOT NULL,
	`failureStage` enum('initial','second','third','design_contract','construction_contract') NOT NULL,
	`failureReasons` json NOT NULL,
	`detailedAnalysis` text NOT NULL,
	`lessonsLearned` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `failedCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`salespersonId` int NOT NULL,
	`salespersonName` varchar(100) NOT NULL,
	`clientName` varchar(100) NOT NULL,
	`clientContact` varchar(100),
	`clientBudget` int,
	`projectType` varchar(100),
	`meetingStage` enum('initial','second','third','design_contract','construction_contract') NOT NULL,
	`meetingDate` timestamp NOT NULL,
	`transcriptSource` enum('recording','upload','manual') NOT NULL,
	`transcriptText` text NOT NULL,
	`audioFileUrl` varchar(500),
	`caseStatus` enum('in_progress','success','failed') NOT NULL DEFAULT 'in_progress',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','evaluator','salesperson','guest') NOT NULL DEFAULT 'salesperson';--> statement-breakpoint
ALTER TABLE `users` ADD `department` varchar(100);