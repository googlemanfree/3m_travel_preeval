import { z } from "zod";

/**
 * Générateur de CV assisté par IA (back-office) : types, styles par pays et contrôles communs au serveur et à l'écran.
 * Le brouillon part UNIQUEMENT du CV envoyé par le candidat pour son évaluation ; un administrateur le relit et le corrige.
 */

export const CV_STYLE_KEYS = ["europe", "canada", "allemagne", "international"] as const;
export type CvStyleKey = (typeof CV_STYLE_KEYS)[number];

export const CV_LANGUAGES = ["fr", "en"] as const;
export type CvLanguage = (typeof CV_LANGUAGES)[number];

export const CV_STYLES: Record<CvStyleKey, { label: string; guidance: string; defaultLanguage: CvLanguage }> = {
  europe: {
    label: "Format européen (France, Belgique, Luxembourg, Italie, Espagne…)",
    guidance: "CV antéchronologique sur 1 à 2 pages : accroche courte, expériences avec 2 à 4 puces d’actions, formation, compétences, langues.",
    defaultLanguage: "fr",
  },
  canada: {
    label: "Format canadien (Canada)",
    guidance: "CV sans photo, sans âge ni situation familiale, 2 pages maximum : verbes d’action, réalisations seulement si le CV les mentionne.",
    defaultLanguage: "fr",
  },
  allemagne: {
    label: "Format allemand (Allemagne, Autriche, Suisse)",
    guidance: "CV tabulaire, antéchronologique, factuel et complet : dates au mois quand elles existent, toute période sans explication est signalée dans « missing ».",
    defaultLanguage: "fr",
  },
  international: {
    label: "Format international (anglais : Royaume-Uni, Émirats, Australie, Asie…)",
    guidance: "CV concis en anglais international : accroche de deux phrases, réalisations, compétences clés.",
    defaultLanguage: "en",
  },
};

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Style proposé d'après le pays de destination du candidat (modifiable par l'administrateur). */
export function styleForCountry(country?: string | null): CvStyleKey {
  const c = normalize(country ?? "");
  if (!c) return "europe";
  if (/\b(canada|quebec)\b/.test(c)) return "canada";
  if (/\b(allemagne|germany|autriche|austria|suisse|switzerland|liechtenstein)\b/.test(c)) return "allemagne";
  if (/\b(royaume uni|united kingdom|uk|irlande|ireland|etats unis|usa|australie|nouvelle zelande|emirats|dubai|qatar|arabie|japon|japan|coree|singapour|inde)\b/.test(c)) return "international";
  return "europe";
}

const text = (max: number) => z.string().trim().min(1).max(max);
const nullableText = (max: number) => z.string().trim().max(max).nullable();

export const CvDraftSchema = z.object({
  headline: nullableText(160),
  summary: nullableText(900),
  experiences: z
    .array(z.object({ role: text(160), employer: text(160), location: nullableText(120), start: nullableText(40), end: nullableText(40), bullets: z.array(text(300)).max(6) }))
    .max(12),
  education: z.array(z.object({ degree: text(200), institution: nullableText(200), year: nullableText(40), details: nullableText(300) })).max(8),
  skills: z.array(text(80)).max(30),
  languages: z.array(z.object({ language: text(60), level: nullableText(60) })).max(8),
  certifications: z.array(text(160)).max(12),
  missing: z.array(text(200)).max(12),
});
export type CvDraft = z.infer<typeof CvDraftSchema>;

const nullableString = (maxLength: number) => ({ type: ["string", "null"], maxLength });
const str = (maxLength: number) => ({ type: "string", maxLength });
const list = (maxItems: number, maxLength: number) => ({ type: "array", maxItems, items: str(maxLength) });

/** Schéma JSON strict transmis au modèle (miroir de CvDraftSchema). */
export const CV_OUTPUT_SCHEMA = {
  name: "cv_draft",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      headline: nullableString(160),
      summary: nullableString(900),
      experiences: {
        type: "array",
        maxItems: 12,
        items: {
          type: "object",
          additionalProperties: false,
          properties: { role: str(160), employer: str(160), location: nullableString(120), start: nullableString(40), end: nullableString(40), bullets: list(6, 300) },
          required: ["role", "employer", "location", "start", "end", "bullets"],
        },
      },
      education: {
        type: "array",
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          properties: { degree: str(200), institution: nullableString(200), year: nullableString(40), details: nullableString(300) },
          required: ["degree", "institution", "year", "details"],
        },
      },
      skills: list(30, 80),
      languages: {
        type: "array",
        maxItems: 8,
        items: { type: "object", additionalProperties: false, properties: { language: str(60), level: nullableString(60) }, required: ["language", "level"] },
      },
      certifications: list(12, 160),
      missing: list(12, 200),
    },
    required: ["headline", "summary", "experiences", "education", "skills", "languages", "certifications", "missing"],
  },
} as const;

function containsAllTokens(haystack: string, needle: string): boolean {
  const normalizedNeedle = normalize(needle);
  if (!normalizedNeedle) return true;
  if (haystack.includes(normalizedNeedle)) return true;
  const tokens = normalizedNeedle.split(" ").filter((token) => token.length >= 3);
  return tokens.length > 0 && tokens.every((token) => haystack.includes(token));
}

/**
 * Éléments du brouillon que l'on ne retrouve pas dans l'extrait du CV (employeurs, établissements, certifications, années) :
 * garde-fou contre les informations inventées. L'administrateur doit les vérifier ou les supprimer avant d'exporter.
 */
export function unverifiedItems(draft: CvDraft, cvText: string): string[] {
  const haystack = normalize(cvText);
  const found: string[] = [];
  const check = (label: string, value: string | null | undefined) => {
    if (value && !containsAllTokens(haystack, value)) found.push(`${label} « ${value} » non retrouvé dans le CV`);
  };
  const checkYears = (label: string, value: string | null | undefined) => {
    for (const year of value?.match(/\b(?:19|20)\d{2}\b/g) ?? []) {
      if (!haystack.includes(year)) found.push(`${label} : l’année ${year} n’apparaît pas dans le CV`);
    }
  };
  for (const experience of draft.experiences) {
    check("Employeur", experience.employer);
    checkYears(`Expérience « ${experience.role} »`, experience.start);
    checkYears(`Expérience « ${experience.role} »`, experience.end);
  }
  for (const education of draft.education) {
    check("Établissement", education.institution);
    checkYears(`Formation « ${education.degree} »`, education.year);
  }
  for (const certification of draft.certifications) check("Certification", certification);
  return Array.from(new Set(found)).slice(0, 20);
}

export type CvIdentity = { fullName: string; email: string | null; phone: string | null; city: string | null; nationality: string | null };

export const CV_SECTION_LABELS: Record<CvLanguage, Record<"summary" | "experience" | "education" | "skills" | "languages" | "certifications", string>> = {
  fr: { summary: "Profil", experience: "Expérience professionnelle", education: "Formation", skills: "Compétences", languages: "Langues", certifications: "Certifications" },
  en: { summary: "Profile", experience: "Professional experience", education: "Education", skills: "Skills", languages: "Languages", certifications: "Certifications" },
};
