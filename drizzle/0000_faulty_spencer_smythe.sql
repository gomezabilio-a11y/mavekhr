CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`category` varchar(64) NOT NULL,
	`content` text,
	`publishDate` date NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`fileUrl` text,
	`fileType` varchar(16) DEFAULT 'PDF',
	`issueDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeCode` varchar(32) NOT NULL,
	`firstName` varchar(64) NOT NULL,
	`lastName` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32),
	`nationality` varchar(64),
	`position` varchar(128) NOT NULL,
	`employmentType` enum('full-time','part-time','contract','intern') NOT NULL DEFAULT 'full-time',
	`workLocation` varchar(128),
	`startDate` date NOT NULL,
	`contractEndDate` date,
	`status` enum('active','inactive','terminated') NOT NULL DEFAULT 'active',
	`orgUnitId` int,
	`managerId` int,
	`isManager` boolean NOT NULL DEFAULT false,
	`userId` int,
	`photoUrl` text,
	`emergencyContact` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_employeeCode_unique` UNIQUE(`employeeCode`),
	CONSTRAINT `employees_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `evaluation_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`period` varchar(32) NOT NULL,
	`status` enum('open','closed','upcoming') NOT NULL DEFAULT 'upcoming',
	`openDate` date,
	`closeDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluation_cycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evaluation_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`evaluatorId` int NOT NULL,
	`evaluateeId` int NOT NULL,
	`type` enum('self','peer','manager') NOT NULL,
	`status` enum('pending','in-progress','completed') NOT NULL DEFAULT 'pending',
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evaluation_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `org_units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('entity','division','department','team') NOT NULL,
	`parentId` int,
	`headCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `org_units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_category_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resultId` int NOT NULL,
	`category` varchar(128) NOT NULL,
	`weight` int NOT NULL,
	`score` decimal(5,2) NOT NULL,
	CONSTRAINT `performance_category_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`period` varchar(32) NOT NULL,
	`overallScore` decimal(5,2),
	`grade` varchar(32),
	`managerScore` decimal(5,2),
	`peerScore` decimal(5,2),
	`selfScore` decimal(5,2),
	`managerComment` text,
	`peerComment` text,
	`selfComment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performance_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `salary_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'SGD',
	`amount` decimal(12,2) NOT NULL,
	`paymentDate` date NOT NULL,
	`periodLabel` varchar(32) NOT NULL,
	`status` enum('paid','pending','cancelled') NOT NULL DEFAULT 'paid',
	`payslipUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `salary_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
