export type PassportCorrectionSnapshot = Record<string, unknown>;

export function buildPassportCorrectionAudit(
  previousData: PassportCorrectionSnapshot,
  nextData: PassportCorrectionSnapshot,
) {
  const changedFields = Object.keys(nextData).filter(
    key => String(previousData[key] ?? '') !== String(nextData[key] ?? ''),
  );

  return {
    changedFields,
    previousData,
    nextData,
  };
}
