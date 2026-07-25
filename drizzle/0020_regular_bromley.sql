ALTER TABLE `client_documents` MODIFY COLUMN `documentType` enum('passport','national_id','driver_license','cv','diploma','certificate','cover_letter','employment_contract','birth_certificate','marriage_certificate','bank_statement','employment_letter','language_test','medical_exam','police_clearance','proof_of_residence','visa','travel_document','insurance_document','medical_document','educational_transcript','other') NOT NULL;--> statement-breakpoint
ALTER TABLE `client_documents` ADD `aiClassification` json;--> statement-breakpoint
ALTER TABLE `client_documents` ADD `aiClassificationConfidence` int;--> statement-breakpoint
ALTER TABLE `client_documents` ADD `aiClassifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `client_documents` ADD `suggestedFolder` varchar(255);--> statement-breakpoint
ALTER TABLE `client_documents` ADD `extractedData` json;