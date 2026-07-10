CREATE TABLE `salary_components` (
	`id` int AUTO_INCREMENT NOT NULL,
	`salaryRecordId` int NOT NULL,
	`type` enum('earning','deduction') NOT NULL DEFAULT 'earning',
	`label` varchar(128) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `salary_components_id` PRIMARY KEY(`id`)
);
