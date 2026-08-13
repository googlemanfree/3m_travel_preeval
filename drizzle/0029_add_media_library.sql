CREATE TABLE IF NOT EXISTS `media_library` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `title` varchar(255) NOT NULL,
  `category` enum('hero','procedure','service','flag','testimonial','other') NOT NULL DEFAULT 'procedure',
  `url` text NOT NULL,
  `storageKey` varchar(512) NOT NULL,
  `fileSize` int,
  `mimeType` varchar(100) NOT NULL DEFAULT 'image/webp',
  `uploadedByAdminEmail` varchar(320),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
