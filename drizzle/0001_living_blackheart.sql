CREATE TABLE `evaluation_forms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formType` enum('self_regular','self_manager','peer','manager_eval','contractor') NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluation_forms_id` PRIMARY KEY(`id`),
	CONSTRAINT `evaluation_forms_formType_unique` UNIQUE(`formType`)
);
--> statement-breakpoint
CREATE TABLE `evaluation_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`formId` int NOT NULL,
	`evaluatorId` int NOT NULL,
	`evaluateeId` int NOT NULL,
	`overallComment` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluation_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`weight` int NOT NULL DEFAULT 0,
	`purpose` text,
	`definition` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `form_kpis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`kpiName` varchar(256) NOT NULL,
	`question` text NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `form_kpis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kpi_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`responseId` int NOT NULL,
	`kpiId` int NOT NULL,
	`score` int NOT NULL,
	`comment` text,
	CONSTRAINT `kpi_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `evaluation_tasks` MODIFY COLUMN `type` enum('self','peer','manager','contractor') NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` ADD `employeeRole` enum('regular','contractor') DEFAULT 'regular' NOT NULL;