ALTER TABLE `applications`
  ADD COLUMN `paymentExpectedAmount` int NOT NULL DEFAULT 65000,
  ADD COLUMN `paymentConfirmedAmount` int NULL;
