/**
 * Double opportunité : un même compte peut suivre plusieurs procédures
 * (ex. visa travail + visa études) pour maximiser ses chances.
 */

export type SecondaryProjectType = "travail" | "etudes";

export const SECONDARY_PROJECT_OPTIONS: Array<{
  value: SecondaryProjectType;
  label: string;
  description: string;
}> = [
  {
    value: "travail",
    label: "Visa travail",
    description: "Emploi, permis de travail ou mobilité professionnelle.",
  },
  {
    value: "etudes",
    label: "Visa études",
    description: "Admission, permis d’études ou formation.",
  },
];

/** Libellé court d’une procédure pour le sélecteur client et le back-office. */
export function procedureLabelForDossier(input: {
  visaType?: string | null;
  projectType?: string | null;
  destination?: string | null;
  dossierNumber?: string | null;
}): string {
  const raw = `${input.visaType || ""} ${input.projectType || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/etud|study|student|academ/.test(raw)) return "Visa études";
  if (/travail|work|emploi|job|recrut/.test(raw)) return "Visa travail";
  if (/touris|visit|schengen/.test(raw)) return "Visa tourisme / visite";
  if (input.visaType?.trim()) return input.visaType.trim();
  if (input.projectType?.trim()) return input.projectType.trim();
  if (input.destination?.trim()) return input.destination.trim();
  return input.dossierNumber?.trim() || "Procédure";
}

/** URL d’évaluation préremplie pour ouvrir un dossier secondaire depuis l’espace client. */
export function secondaryDossierEvaluationPath(input: {
  project: SecondaryProjectType;
  destination?: string | null;
}): string {
  const params = new URLSearchParams({
    project: input.project,
    source: "client-space-secondary",
  });
  if (input.destination?.trim()) {
    params.set("destination", input.destination.trim());
  }
  return `/evaluation?${params.toString()}`;
}

export type SiblingProcedureSummary = {
  folderCode: string;
  projectType: string;
  destinationCountry: string;
  paymentStatus: string;
  source: string;
  id: string;
};

/** Regroupe les dossiers d’un même e-mail (hors comptes seuls non encore ouverts). */
export function attachSiblingProcedures<T extends {
  id: string;
  email: string;
  folderCode: string;
  projectType: string;
  destinationCountry: string;
  paymentStatus?: string | null;
  source: string;
}>(rows: T[]): Array<T & { siblingCount: number; siblingProcedures: SiblingProcedureSummary[] }> {
  const byEmail = new Map<string, T[]>();
  for (const row of rows) {
    if (row.source === "ACCOUNT_ONLY") continue;
    const email = row.email.trim().toLowerCase();
    if (!email) continue;
    const list = byEmail.get(email) ?? [];
    list.push(row);
    byEmail.set(email, list);
  }

  return rows.map((row) => {
    if (row.source === "ACCOUNT_ONLY") {
      return { ...row, siblingCount: 0, siblingProcedures: [] as SiblingProcedureSummary[] };
    }
    const email = row.email.trim().toLowerCase();
    const siblings = (byEmail.get(email) ?? []).filter((item) => item.id !== row.id);
    return {
      ...row,
      siblingCount: siblings.length + 1,
      siblingProcedures: siblings.map((item) => ({
        folderCode: item.folderCode,
        projectType: item.projectType,
        destinationCountry: item.destinationCountry,
        paymentStatus: item.paymentStatus ?? "NOT_PAID",
        source: item.source,
        id: item.id,
      })),
    };
  });
}
