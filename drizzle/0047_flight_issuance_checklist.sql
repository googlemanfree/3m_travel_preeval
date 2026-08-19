ALTER TABLE flight_booking_requests
  ADD COLUMN issuanceChecklist JSON NULL AFTER issuedPdfUrl;
