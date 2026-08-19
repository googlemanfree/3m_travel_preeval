ALTER TABLE managed_consular_portals
  ADD COLUMN revalidateDueAt TIMESTAMP NULL,
  ADD COLUMN lastRevalidationAlertAt TIMESTAMP NULL;
