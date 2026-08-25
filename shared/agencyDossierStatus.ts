export const AGENCY_DOSSIER_STATUS_VALUES = [
  "nouveau",
  "en_cours",
  "documents_requis",
  "recherche_employeur",
  "validation_adem",
  "soumis",
  "approuve",
  "refuse",
] as const;

export type AgencyDossierStatus = (typeof AGENCY_DOSSIER_STATUS_VALUES)[number];

export const LUXEMBOURG_EMPLOYMENT_STATUS_VALUES = [
  "recherche_employeur",
  "validation_adem",
] as const;

export function isLuxembourgEmploymentProcedure(destination?: string | null, visaType?: string | null): boolean {
  const normalizedDestination = (destination ?? "").trim().toLocaleLowerCase("fr-FR");
  const normalizedProcedure = (visaType ?? "").trim().toLocaleLowerCase("fr-FR");
  return normalizedDestination.includes("luxembourg") && /(travail|work|emploi|permis)/.test(normalizedProcedure);
}

export function isLuxembourgEmploymentStatus(status: string): status is (typeof LUXEMBOURG_EMPLOYMENT_STATUS_VALUES)[number] {
  return (LUXEMBOURG_EMPLOYMENT_STATUS_VALUES as readonly string[]).includes(status);
}
