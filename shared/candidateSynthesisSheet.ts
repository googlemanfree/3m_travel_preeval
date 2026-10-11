import { z } from "zod";

/**
 * Fiche de synthèse candidat (1 page A4) pour employeurs et agences de placement.
 * Aucune invention : contenu issu du CV / des pièces. Identité externe = prénom + initiale.
 */

export const SYNTHESIS_STATUSES = ["draft", "validated", "rejected", "needs_revalidation"] as const;
export type SynthesisStatus = (typeof SYNTHESIS_STATUSES)[number];

export const SYNTHESIS_STATUS_LABELS: Record<SynthesisStatus, string> = {
  draft: "Brouillon",
  validated: "Validée",
  rejected: "Refusée",
  needs_revalidation: "À revalider",
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  cv: "CV",
  curriculum_vitae: "CV",
  resume: "CV",
  passeport: "Passeport",
  passport: "Passeport",
  diplome: "Diplôme",
  diploma: "Diplôme",
  releve_notes: "Relevé de notes",
  photo: "Photo d’identité",
  photo_identite: "Photo d’identité",
  justificatif_domicile: "Justificatif de domicile",
  proof_of_residence: "Justificatif de domicile",
  extrait_naissance: "Extrait de naissance",
  birth_certificate: "Extrait de naissance",
  casier_judiciaire: "Casier judiciaire",
  justificatif_paiement: "Justificatif de paiement",
  payment_proof: "Justificatif de paiement",
  document_remis_main_propre: "Document remis en main propre",
  decharge_remise_main_propre: "Décharge remise en main propre",
  employment_contract: "Contrat de travail",
  bank_statement: "Relevé bancaire",
  insurance: "Assurance",
  protocole_accord: "Protocole d’accord",
  other: "Autre pièce",
  autre: "Autre pièce",
};

const text = (max: number) => z.string().trim().min(1).max(max);
const nullableText = (max: number) => z.string().trim().max(max).nullable();

export const SynthesisDocumentRefSchema = z.object({
  type: text(80),
  label: text(120),
  status: z.enum(["uploaded", "verified", "rejected", "pending"]),
  source: z.enum(["candidate", "agency", "admin"]),
  uploadedAt: z.string().max(40).nullable(),
});
export type SynthesisDocumentRef = z.infer<typeof SynthesisDocumentRefSchema>;

export const SynthesisContentSchema = z.object({
  displayFirstName: text(80),
  displayLastInitial: text(4),
  profileTitle: nullableText(160),
  residenceCountry: nullableText(120),
  residenceCity: nullableText(120),
  targetDestination: nullableText(120),
  targetProcedure: nullableText(160),
  summary: nullableText(700),
  experiences: z
    .array(
      z.object({
        role: text(160),
        employer: text(160),
        period: nullableText(80),
      }),
    )
    .max(3),
  education: z
    .object({
      degree: text(200),
      institution: nullableText(200),
      year: nullableText(40),
    })
    .nullable(),
  skills: z.array(text(80)).max(12),
  languages: z.array(z.object({ language: text(60), level: nullableText(60) })).max(8),
  documents: z.array(SynthesisDocumentRefSchema).max(40),
  missing: z.array(text(200)).max(16),
  dossierReference: text(80),
  generatedAtLabel: text(40),
});
export type SynthesisContent = z.infer<typeof SynthesisContentSchema>;

/** Schéma JSON strict pour le modèle (contenu biographique uniquement — pas les pièces). */
export const SYNTHESIS_BIO_OUTPUT_SCHEMA = {
  name: "candidate_synthesis_bio",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      profileTitle: { type: ["string", "null"], maxLength: 160 },
      summary: { type: ["string", "null"], maxLength: 700 },
      experiences: {
        type: "array",
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            role: { type: "string", maxLength: 160 },
            employer: { type: "string", maxLength: 160 },
            period: { type: ["string", "null"], maxLength: 80 },
          },
          required: ["role", "employer", "period"],
        },
      },
      education: {
        type: ["object", "null"],
        additionalProperties: false,
        properties: {
          degree: { type: "string", maxLength: 200 },
          institution: { type: ["string", "null"], maxLength: 200 },
          year: { type: ["string", "null"], maxLength: 40 },
        },
        required: ["degree", "institution", "year"],
      },
      skills: { type: "array", maxItems: 12, items: { type: "string", maxLength: 80 } },
      languages: {
        type: "array",
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            language: { type: "string", maxLength: 60 },
            level: { type: ["string", "null"], maxLength: 60 },
          },
          required: ["language", "level"],
        },
      },
      missing: { type: "array", maxItems: 16, items: { type: "string", maxLength: 200 } },
    },
    required: ["profileTitle", "summary", "experiences", "education", "skills", "languages", "missing"],
  },
} as const;

export type SynthesisBioDraft = {
  profileTitle: string | null;
  summary: string | null;
  experiences: Array<{ role: string; employer: string; period: string | null }>;
  education: { degree: string; institution: string | null; year: string | null } | null;
  skills: string[];
  languages: Array<{ language: string; level: string | null }>;
  missing: string[];
};

export const SynthesisBioDraftSchema = z.object({
  profileTitle: nullableText(160),
  summary: nullableText(700),
  experiences: z.array(z.object({ role: text(160), employer: text(160), period: nullableText(80) })).max(3),
  education: z.object({ degree: text(200), institution: nullableText(200), year: nullableText(40) }).nullable(),
  skills: z.array(text(80)).max(12),
  languages: z.array(z.object({ language: text(60), level: nullableText(60) })).max(8),
  missing: z.array(text(200)).max(16),
});

/** Prénom + initiale du nom — identité externe employeur / agence. */
export function displayNameParts(fullName: string | null | undefined): { firstName: string; lastInitial: string } {
  const parts = (fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { firstName: "Candidat", lastInitial: "" };
  if (parts.length === 1) return { firstName: parts[0], lastInitial: "" };
  const firstName = parts[0];
  const last = parts[parts.length - 1];
  return { firstName, lastInitial: last.charAt(0).toUpperCase() };
}

export function formatDisplayName(firstName: string, lastInitial: string): string {
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
}

export function normalizeDocumentTypeKey(type: string): string {
  return (type || "autre")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_");
}

export function documentTypeLabel(type: string): string {
  const key = normalizeDocumentTypeKey(type);
  return DOCUMENT_TYPE_LABELS[key] || DOCUMENT_TYPE_LABELS.autre;
}

/** Empreinte des sources (CV + pièces + portrait) pour détecter un changement post-validation. */
export function buildSourceFingerprint(input: {
  cvUrl?: string | null;
  avatarUrl?: string | null;
  documents: Array<{ id: number | string; type: string; status: string; updatedAt?: string | Date | null }>;
}): string {
  const docPart = [...input.documents]
    .map((doc) => `${doc.id}:${doc.type}:${doc.status}:${doc.updatedAt ? new Date(doc.updatedAt).toISOString() : ""}`)
    .sort()
    .join("|");
  return `cv=${input.cvUrl || ""}|avatar=${input.avatarUrl || ""}|docs=${docPart}`;
}

/** Vérifie qu’aucune coordonnée évidente n’est présente dans le contenu diffusé. */
export function findLeakedContactSignals(content: SynthesisContent): string[] {
  const haystack = [
    content.summary,
    content.profileTitle,
    ...content.skills,
    ...content.experiences.flatMap((item) => [item.role, item.employer, item.period]),
    content.education?.degree,
    content.education?.institution,
  ]
    .filter(Boolean)
    .join(" ");
  const leaks: string[] = [];
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(haystack)) leaks.push("adresse e-mail");
  // Évite les faux positifs sur les périodes (2018-2022) : exige indicatif ou 8+ chiffres contigus.
  const phoneHay = haystack.replace(/\s+/g, " ");
  if (/(?:\+|00)\d[\d\s().-]{6,}\d/.test(phoneHay) || /(?:\b0|\b)\d(?:[\s().-]?\d){7,}\b/.test(phoneHay.replace(/20\d{2}\s*[-–/]\s*20\d{2}/g, " "))) {
    leaks.push("numéro de téléphone");
  }
  if (/\b(?:passeport|n°|numero|numéro)\s*[:\s]*[A-Z0-9]{5,}\b/i.test(haystack)) leaks.push("numéro de document");
  return leaks;
}
