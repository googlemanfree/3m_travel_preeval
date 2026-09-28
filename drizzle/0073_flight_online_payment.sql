ALTER TABLE flight_booking_requests
  ADD COLUMN onlinePaymentStatus VARCHAR(20) NULL,
  ADD COLUMN onlinePaymentTransactionId VARCHAR(120) NULL,
  ADD COLUMN onlinePaymentAmount INT NULL,
  ADD COLUMN onlinePaymentCurrency VARCHAR(6) NULL,
  ADD COLUMN onlinePaymentMethod VARCHAR(50) NULL,
  ADD COLUMN onlinePaymentDate DATETIME NULL;
