CREATE TABLE `bank_info` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`recipientName` varchar(256),
	`recipientAddress` text,
	`recipientEmail` varchar(320),
	`recipientPhone` varchar(32),
	`bankName` varchar(256),
	`swiftBic` varchar(32),
	`branchName` varchar(256),
	`bankAddress` text,
	`accountNumber` varchar(64),
	`ifsc` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bank_info_id` PRIMARY KEY(`id`),
	CONSTRAINT `bank_info_employeeId_unique` UNIQUE(`employeeId`)
);
