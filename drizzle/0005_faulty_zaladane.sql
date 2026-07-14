ALTER TABLE `applications` ADD `passportUrl` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `cvUrl` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `diplomaUrl` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `scoringTotal` int;--> statement-breakpoint
ALTER TABLE `applications` ADD `scoringDetails` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `scoringBadge` enum('eligible','admissible','faible');