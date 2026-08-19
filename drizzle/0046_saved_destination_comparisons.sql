CREATE TABLE `saved_destination_comparisons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidateId` int NOT NULL,
  `primaryDestinationId` varchar(180) NOT NULL,
  `secondaryDestinationId` varchar(180) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `saved_destination_comparisons_candidate_pair_unique` (`candidateId`, `primaryDestinationId`, `secondaryDestinationId`)
);
