/**
 * CVthèque contrôlée : règles communes au serveur et à l'interface.
 *
 * Principes : seules des informations professionnelles DÉCLARÉES ou examinées figurent dans la CVthèque ; jamais de
 * nationalité, de coordonnées, de pièce d'identité ni de document administratif. Rien ne dit « admissible au visa » ou
 * « emploi garanti » : la faisabilité administrative est un contrôle séparé, jamais présumé.
 */

export const CVTHEQUE_CONSENT_KIND = "cvtheque_publication";
/** Version du texte de consentement : à incrémenter à chaque modification validée par le conseil juridique. */
export const CVTHEQUE_CONSENT_VERSION = "2026-10-20-provisoire";
export const CVTHEQUE_REVIEW_MONTHS = 12;

export const CVTHEQUE_STATES = ["draft", "pending_review", "published", "withdrawn", "rejected"] as const;
export type CvthequeState = (typeof CVTHEQUE_STATES)[number];

export const CVTHEQUE_STATE_LABELS: Record<CvthequeState, { fr: string; en: string }> = {
  draft: { fr: "Brouillon (non visible)", en: "Draft (not visible)" },
  pending_review: { fr: "En attente d’examen par 3M", en: "Awaiting 3M review" },
  published: { fr: "Visible des employeurs vérifiés", en: "Visible to verified employers" },
  withdrawn: { fr: "Retiré de la CVthèque", en: "Withdrawn from the CV library" },
  rejected: { fr: "Non publié après examen", en: "Not published after review" },
};

const ALLOWED_TRANSITIONS: Record<CvthequeState, CvthequeState[]> = {
  draft: ["pending_review"],
  pending_review: ["published", "rejected", "withdrawn", "draft"],
  published: ["withdrawn", "pending_review"],
  withdrawn: ["pending_review", "draft"],
  rejected: ["pending_review", "draft"],
};

export function canTransitionCvtheque(from: CvthequeState, to: CvthequeState): boolean {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to);
}

/** Visible par les employeurs : publié, ET consentement de partage accordé, ET résumé approuvé. Un seul critère manquant suffit à masquer. */
export function isCvthequeVisible(input: { visibilityState: string; placementConsentGranted: boolean; summaryApproved: boolean; archived: boolean }): boolean {
  return input.visibilityState === "published" && input.placementConsentGranted && input.summaryApproved && !input.archived;
}

export const WORK_AUTHORIZATION_VALUES = ["none", "other_country", "application_in_progress", "not_specified"] as const;
export type WorkAuthorization = (typeof WORK_AUTHORIZATION_VALUES)[number];

/** Libellés explicites : c'est une déclaration du candidat, jamais une confirmation d'admissibilité. */
export const WORK_AUTHORIZATION_LABELS: Record<WorkAuthorization, { fr: string; en: string }> = {
  none: { fr: "Aucune autorisation de travail déclarée dans un pays de destination", en: "No work authorisation declared for a destination country" },
  other_country: { fr: "Autorisation de travail déclarée dans un autre pays", en: "Work authorisation declared in another country" },
  application_in_progress: { fr: "Demande d’autorisation déclarée en cours", en: "Authorisation application declared in progress" },
  not_specified: { fr: "Non précisée", en: "Not specified" },
};

export const AVAILABILITY_VALUES = ["immediate", "one_month", "three_months", "later"] as const;
export type Availability = (typeof AVAILABILITY_VALUES)[number];
export const AVAILABILITY_LABELS: Record<Availability, { fr: string; en: string }> = {
  immediate: { fr: "Immédiate", en: "Immediate" },
  one_month: { fr: "Sous un mois", en: "Within a month" },
  three_months: { fr: "Sous trois mois", en: "Within three months" },
  later: { fr: "Plus tard", en: "Later" },
};

export const EDUCATION_LEVELS = ["none_required", "secondary", "vocational", "bachelor", "master", "doctorate"] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];
export const EDUCATION_LABELS: Record<EducationLevel, { fr: string; en: string }> = {
  none_required: { fr: "Sans diplôme spécifique (expérience)", en: "No specific diploma (experience)" },
  secondary: { fr: "Niveau secondaire", en: "Secondary education" },
  vocational: { fr: "Formation professionnelle", en: "Vocational training" },
  bachelor: { fr: "Licence / bachelor", en: "Bachelor’s degree" },
  master: { fr: "Master", en: "Master’s degree" },
  doctorate: { fr: "Doctorat", en: "Doctorate" },
};

export const VERIFICATION_FIELDS = ["skills", "experience", "education", "languages"] as const;
export type VerificationField = (typeof VERIFICATION_FIELDS)[number];
export const VERIFICATION_LEVELS = ["declared", "document_examined", "verified"] as const;
export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];

/** Ce qui a réellement été fait : « déclaré » n'est jamais présenté comme « vérifié ». */
export const VERIFICATION_LABELS: Record<VerificationLevel, { fr: string; en: string }> = {
  declared: { fr: "Déclaré par le candidat", en: "Declared by the candidate" },
  document_examined: { fr: "Pièce examinée par 3M", en: "Document examined by 3M" },
  verified: { fr: "Vérifié par 3M", en: "Verified by 3M" },
};

export type VerificationLevels = Record<VerificationField, VerificationLevel>;

export function defaultVerificationLevels(): VerificationLevels {
  return { skills: "declared", experience: "declared", education: "declared", languages: "declared" };
}

export function parseVerificationLevels(stored: string | null | undefined): VerificationLevels {
  const result = defaultVerificationLevels();
  if (!stored) return result;
  try {
    const parsed = JSON.parse(stored) as Record<string, unknown>;
    for (const field of VERIFICATION_FIELDS) {
      const value = parsed[field];
      if (typeof value === "string" && (VERIFICATION_LEVELS as readonly string[]).includes(value)) result[field] = value as VerificationLevel;
    }
  } catch {
    // valeur illisible : tout reste « déclaré », le niveau le plus prudent
  }
  return result;
}

/** Texte libre → liste courte et propre (séparateurs virgule, point-virgule, retour à la ligne). */
export function toCleanList(input: string | string[] | null | undefined, maxItems = 12, maxLength = 60): string[] {
  const raw = Array.isArray(input) ? input : String(input ?? "").split(/[,;\n]/);
  const seen = new Set<string>();
  const items: string[] = [];
  for (const part of raw) {
    const item = part.replace(/\s+/g, " ").trim().slice(0, maxLength);
    const key = item.toLocaleLowerCase("fr");
    if (item.length >= 2 && !seen.has(key)) {
      seen.add(key);
      items.push(item);
    }
    if (items.length >= maxItems) break;
  }
  return items;
}

export const parseList = (stored: string | null | undefined): string[] => {
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const normalizeForSearch = (value: string) => value.toLocaleLowerCase("fr").normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Texte de recherche : métier, secteur, compétences, langues, destinations. Jamais de nom ni de coordonnées. */
export function buildSearchText(parts: { jobTitle?: string | null; sector?: string | null; skills?: string[]; languages?: string[]; destinations?: string[] }): string {
  return normalizeForSearch([parts.jobTitle, parts.sector, ...(parts.skills ?? []), ...(parts.languages ?? []), ...(parts.destinations ?? [])].filter(Boolean).join(" "));
}

export function searchTerms(query: string | null | undefined): string[] {
  return normalizeForSearch(String(query ?? "")).split(/[^a-z0-9+#]+/).filter((term) => term.length >= 2).slice(0, 6);
}

export const SEARCH_PAGE_SIZE = 12;
/** Limites anti-aspiration par utilisateur : recherches par heure, fiches consultées par jour. */
export const SEARCH_LIMIT_PER_HOUR = 60;
export const PROFILE_VIEW_LIMIT_PER_DAY = 150;

/** Libellés interdits dans tous les textes de la CVthèque et des offres : jamais de promesse. */
export const FORBIDDEN_PROMISE_PATTERNS: RegExp[] = [/visa garanti/i, /emploi garanti/i, /admissible/i, /garanti(e)?\b(?! pas)/i, /sûr d['’]obtenir/i];

export function containsForbiddenPromise(text: string): boolean {
  return FORBIDDEN_PROMISE_PATTERNS.some((pattern) => pattern.test(text));
}
