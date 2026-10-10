/**
 * Checklist documentaire unifiée : pays + procédure (catalogue d’évaluation,
 * procédures 107 et pièces du parcours journey). Utilisée par l’admin 360°
 * et le moteur de création de checklist.
 */

import { getEnrichedCandidateJourney } from "./candidateJourneyCatalog";

export type ChecklistDocumentLine = {
  documentType: string;
  comment: string;
  source: "country" | "procedure" | "journey" | "custom";
};

export type ChecklistDocumentMatch = {
  documentType?: string | null;
  documentName?: string | null;
  verificationStatus?: string | null;
  status?: string | null;
};

export type ChecklistProgressSnapshot = {
  label: string;
  destination: string;
  procedure: string;
  total: number;
  missing: number;
  received: number;
  verified: number;
  replace: number;
  percent: number;
  lines: Array<{
    documentType: string;
    comment: string;
    source: ChecklistDocumentLine["source"];
    state: "missing" | "received" | "verified" | "replace";
  }>;
};

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const COUNTRY_BASE: Record<string, ChecklistDocumentLine[]> = {
  canada: [
    { documentType: "Passeport valide", comment: "Passeport en cours de validité pour toute la durée prévue du séjour.", source: "country" },
    { documentType: "Photo d’identité", comment: "Photo récente conforme aux exigences du portail officiel.", source: "country" },
    { documentType: "Justificatifs de ressources", comment: "Relevés ou preuves de fonds adaptés au projet.", source: "country" },
  ],
  luxembourg: [
    { documentType: "Passeport valide", comment: "Passeport valide pour la durée du séjour et des démarches.", source: "country" },
    { documentType: "Acte de naissance", comment: "Acte d’état civil exploitable, traduit si exigé.", source: "country" },
    { documentType: "Casier judiciaire", comment: "Extrait récent lorsque la procédure le demande.", source: "country" },
  ],
  france: [
    { documentType: "Passeport valide", comment: "Passeport valide couvrant le séjour et les délais consulaires.", source: "country" },
    { documentType: "Photo d’identité", comment: "Photo aux normes France-Visas / consulat compétent.", source: "country" },
    { documentType: "Justificatifs de ressources", comment: "Preuves de moyens adaptés au motif (visite, études ou travail).", source: "country" },
  ],
  italie: [
    { documentType: "Passeport valide", comment: "Passeport valide pour la durée du séjour en Italie.", source: "country" },
    { documentType: "Photo d’identité", comment: "Photo récente conforme aux exigences consulaires italiennes.", source: "country" },
    { documentType: "Assurance voyage", comment: "Couverture médicale Schengen lorsque exigée.", source: "country" },
  ],
  australie: [
    { documentType: "Passeport valide", comment: "Passeport valide pour toute la durée du séjour en Australie.", source: "country" },
    { documentType: "Photo d’identité", comment: "Photo conforme au portail Home Affairs / ImmiAccount.", source: "country" },
    { documentType: "Justificatifs de ressources", comment: "Preuves de fonds et confiance du voyageur selon le stream.", source: "country" },
  ],
  allemagne: [
    { documentType: "Passeport valide", comment: "Passeport valide pour le séjour et les démarches allemandes.", source: "country" },
    { documentType: "Photo d’identité", comment: "Photo biométrique aux normes allemandes.", source: "country" },
    { documentType: "Justificatifs de ressources", comment: "Preuves de financement ou de contrat selon la procédure.", source: "country" },
  ],
  belgique: [
    { documentType: "Passeport valide", comment: "Passeport valide pour le séjour en Belgique.", source: "country" },
    { documentType: "Photo d’identité", comment: "Photo conforme aux exigences de l’Office des étrangers.", source: "country" },
    { documentType: "Justificatifs de ressources", comment: "Preuves de moyens adaptés au motif de séjour.", source: "country" },
  ],
  default: [
    { documentType: "Passeport valide", comment: "Passeport en cours de validité.", source: "country" },
    { documentType: "Photo d’identité", comment: "Photo récente aux normes du pays de destination.", source: "country" },
    { documentType: "Justificatif de domicile", comment: "Adresse actuelle du candidat.", source: "country" },
  ],
};

const PROCEDURE_EXTRA: Record<string, { label: string; documents: ChecklistDocumentLine[] }> = {
  work_permit: {
    label: "Travail / permis de travail",
    documents: [
      { documentType: "CV actualisé", comment: "CV lisible, daté et cohérent avec le projet.", source: "procedure" },
      { documentType: "Diplômes et attestations", comment: "Diplômes et preuves d’expérience utiles au métier visé.", source: "procedure" },
      { documentType: "Offre ou projet d’emploi", comment: "Offre, lettre d’intention ou projet professionnel documenté.", source: "procedure" },
    ],
  },
  study_permit: {
    label: "Études / permis d’études",
    documents: [
      { documentType: "Lettre d’admission", comment: "Admission ou pré-admission de l’établissement.", source: "procedure" },
      { documentType: "Relevés de notes", comment: "Parcours scolaire ou universitaire à jour.", source: "procedure" },
      { documentType: "Plan de financement études", comment: "Preuves de ressources pour scolarité et séjour.", source: "procedure" },
    ],
  },
  visitor_visa: {
    label: "Visite / tourisme",
    documents: [
      { documentType: "Itinéraire de voyage", comment: "Dates, hébergement et programme cohérents.", source: "procedure" },
      { documentType: "Preuves d’attaches", comment: "Emploi, famille ou biens démontrant le retour prévu.", source: "procedure" },
    ],
  },
  permanent_residence: {
    label: "Résidence / installation",
    documents: [
      { documentType: "État civil complet", comment: "Actes d’état civil exigés par la procédure.", source: "procedure" },
      { documentType: "Preuves de compétences linguistiques", comment: "Tests ou attestations lorsque requis.", source: "procedure" },
    ],
  },
  family_reunification: {
    label: "Regroupement familial",
    documents: [
      { documentType: "Preuve du lien familial", comment: "Acte de mariage, naissance ou preuve du lien.", source: "procedure" },
      { documentType: "Statut du répondant", comment: "Titre de séjour ou statut du proche à l’étranger.", source: "procedure" },
    ],
  },
  evisa: {
    label: "e‑Visa / autorisation électronique",
    documents: [
      { documentType: "Réservation de voyage", comment: "Vol ou hébergement selon le portail.", source: "procedure" },
      { documentType: "Assurance voyage", comment: "Couverture médicale conforme à la destination.", source: "procedure" },
    ],
  },
};

export function resolveProcedureChecklistKey(procedureType?: string | null): keyof typeof PROCEDURE_EXTRA | undefined {
  const normalized = fold(String(procedureType || ""));
  if (!normalized) return undefined;
  if (normalized.includes("travail") || normalized.includes("work") || normalized.includes("emploi") || normalized.includes("worker")) return "work_permit";
  if (normalized.includes("etude") || normalized.includes("study") || normalized.includes("academ") || normalized.includes("formation") || normalized.includes("ausbildung")) return "study_permit";
  if (normalized.includes("visiteur") || normalized.includes("visitor") || normalized.includes("touris")) return "visitor_visa";
  if (normalized.includes("permanent") || normalized.includes("residence") || normalized.includes("installation")) return "permanent_residence";
  if (normalized.includes("famille") || normalized.includes("family") || normalized.includes("regroupement")) return "family_reunification";
  if (normalized.includes("evisa") || normalized.includes("electronique") || normalized.includes("electronic")) return "evisa";
  if (procedureType && procedureType in PROCEDURE_EXTRA) return procedureType as keyof typeof PROCEDURE_EXTRA;
  return undefined;
}

function countryLines(destination?: string | null): ChecklistDocumentLine[] {
  const key = fold(String(destination || ""));
  if (key.includes("canada") || key.includes("quebec")) return COUNTRY_BASE.canada;
  if (key.includes("luxembourg")) return COUNTRY_BASE.luxembourg;
  if (key.includes("france")) return COUNTRY_BASE.france;
  if (key.includes("italie") || key.includes("italy")) return COUNTRY_BASE.italie;
  if (key.includes("australie") || key.includes("australia")) return COUNTRY_BASE.australie;
  if (key.includes("allemagne") || key.includes("germany")) return COUNTRY_BASE.allemagne;
  if (key.includes("belgique") || key.includes("belgium")) return COUNTRY_BASE.belgique;
  return COUNTRY_BASE.default;
}

function journeyLines(destination?: string | null, procedureType?: string | null): ChecklistDocumentLine[] {
  const journey = getEnrichedCandidateJourney(destination, procedureType, procedureType);
  const seen = new Set<string>();
  const lines: ChecklistDocumentLine[] = [];
  for (const step of journey.steps) {
    for (const document of step.documents) {
      if (document.kind !== "to_prepare") continue;
      const key = fold(document.label);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      lines.push({
        documentType: document.label,
        comment: `Pièce du parcours « ${step.label} » (${journey.title}).`,
        source: "journey",
      });
    }
  }
  return lines;
}

/** Fusion pays + procédure + pièces du parcours, sans doublon. */
export function buildCountryProcedureDocumentChecklist(input: {
  destination?: string | null;
  procedureType?: string | null;
  customDocuments?: string[];
}): { label: string; documents: ChecklistDocumentLine[] } {
  const procedureKey = resolveProcedureChecklistKey(input.procedureType);
  const procedure = procedureKey ? PROCEDURE_EXTRA[procedureKey] : undefined;
  const merged = new Map<string, ChecklistDocumentLine>();
  for (const line of [
    ...countryLines(input.destination),
    ...(procedure?.documents ?? []),
    ...journeyLines(input.destination, input.procedureType),
    ...(input.customDocuments ?? []).map((documentType) => ({
      documentType,
      comment: "Pièce ajoutée spécifiquement par l’administration pour cette procédure.",
      source: "custom" as const,
    })),
  ]) {
    const key = fold(line.documentType);
    if (!key || merged.has(key)) continue;
    merged.set(key, line);
  }
  return {
    label: procedure?.label ?? (input.procedureType?.trim() || "Procédure standard"),
    documents: Array.from(merged.values()),
  };
}

function matchState(line: ChecklistDocumentLine, documents: ChecklistDocumentMatch[]): ChecklistProgressSnapshot["lines"][number]["state"] {
  const target = fold(line.documentType);
  const matches = documents.filter((document) => {
    const source = fold(`${document.documentType ?? ""} ${document.documentName ?? ""}`);
    return Boolean(source) && (source.includes(target) || target.split(" ").every((token) => token.length < 3 || source.includes(token)));
  });
  if (!matches.length) return "missing";
  if (matches.some((document) => ["rejected", "refuse"].includes(fold(String(document.verificationStatus || document.status || ""))))) return "replace";
  if (matches.some((document) => ["verified", "approved", "valide"].includes(fold(String(document.verificationStatus || document.status || ""))))) return "verified";
  return "received";
}

export function summarizeCountryProcedureChecklist(input: {
  destination?: string | null;
  procedureType?: string | null;
  customDocuments?: string[];
  documents?: ChecklistDocumentMatch[];
}): ChecklistProgressSnapshot {
  const template = buildCountryProcedureDocumentChecklist(input);
  const lines = template.documents.map((line) => ({
    ...line,
    state: matchState(line, input.documents ?? []),
  }));
  const missing = lines.filter((line) => line.state === "missing").length;
  const replace = lines.filter((line) => line.state === "replace").length;
  const verified = lines.filter((line) => line.state === "verified").length;
  const received = lines.filter((line) => line.state === "received").length;
  const done = verified + received;
  return {
    label: template.label,
    destination: input.destination?.trim() || "Destination à préciser",
    procedure: template.label,
    total: lines.length,
    missing,
    received,
    verified,
    replace,
    percent: lines.length ? Math.round((done / lines.length) * 100) : 0,
    lines,
  };
}
