/**
 * Sélection employeur / partenaire — stockage additif hors tables dossier.
 * Clé agency_settings : n’altère jamais applications / agency_dossiers / candidates.
 */

export const EMPLOYER_SELECTION_KEY_PREFIX = "employer_selection:";

export type EmployerSelectionRecord = {
  employerName: string;
  positionTitle: string;
  selectedAt: string;
  selectedBy: string;
  source: "online" | "agency";
  sourceId: number;
  /** Ne modifie pas le statut Kanban du dossier. */
  note?: string;
};

export function employerSelectionSettingKey(source: "online" | "agency", sourceId: number): string {
  return `${EMPLOYER_SELECTION_KEY_PREFIX}${source}:${sourceId}`;
}

export function parseEmployerSelectionSetting(raw: string | null | undefined): EmployerSelectionRecord | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<EmployerSelectionRecord>;
    if (!parsed.employerName?.trim() || !parsed.positionTitle?.trim()) return null;
    if (parsed.source !== "online" && parsed.source !== "agency") return null;
    if (!Number.isFinite(Number(parsed.sourceId))) return null;
    return {
      employerName: String(parsed.employerName).trim(),
      positionTitle: String(parsed.positionTitle).trim(),
      selectedAt: String(parsed.selectedAt || new Date().toISOString()),
      selectedBy: String(parsed.selectedBy || "admin"),
      source: parsed.source,
      sourceId: Number(parsed.sourceId),
      note: parsed.note?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

export function isEmployerSelected(input: {
  stored?: EmployerSelectionRecord | null;
  secondAgreementReady?: boolean;
  secondAgreementEmployer?: string | null;
  recruitmentPartnerName?: string | null;
}): boolean {
  if (input.stored?.employerName?.trim()) return true;
  if (input.secondAgreementReady) return true;
  if (String(input.secondAgreementEmployer ?? "").trim()) return true;
  if (String(input.recruitmentPartnerName ?? "").trim()) return true;
  return false;
}
