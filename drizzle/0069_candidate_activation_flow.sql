ALTER TABLE applications
  ADD COLUMN evaluationClientConfirmedAt DATETIME NULL,
  ADD COLUMN activationRequestedAt DATETIME NULL,
  ADD COLUMN paymentOpeningRequestedAt DATETIME NULL;
