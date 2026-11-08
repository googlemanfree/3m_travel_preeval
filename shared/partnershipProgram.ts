/**
 * Programme de partenariat « agence de voyage / particulier » : règles communes au serveur et à l'interface.
 *
 * Distinct du module « Entreprises & partenaires » (employeurs, recruteurs, agences de placement : shared/partnerModule.ts) :
 * ici le partenaire ORIENTE des clients vers 3M et est rémunéré à la commission, dans le cadre d'un protocole d'accord signé.
 *
 * Règles de fond (à ne pas contourner) :
 *  - une candidature ne fait jamais d'une agence ou d'une personne un « partenaire officiel » ;
 *  - aucune commission n'est due avant la signature du protocole par le partenaire ET sa contresignature par 3M ;
 *  - le taux, la durée et les délais sont fixés par l'administration pour chaque partenaire (bornes ci-dessous), jamais imposés par le code.
 */

export const PARTNERSHIP_KINDS = ["travel_agency", "individual"] as const;
export type PartnershipKind = (typeof PARTNERSHIP_KINDS)[number];

export const PARTNERSHIP_KIND_LABELS: Record<PartnershipKind, { fr: string; en: string; hintFr: string; hintEn: string }> = {
  travel_agency: {
    fr: "Agence de voyage",
    en: "Travel agency",
    hintFr: "Une agence ou un cabinet qui oriente ses propres clients vers l’accompagnement visa et mobilité de 3M.",
    hintEn: "An agency or firm that refers its own customers to 3M's visa and mobility support.",
  },
  individual: {
    fr: "Particulier (apporteur d’affaires)",
    en: "Individual (business introducer)",
    hintFr: "Une personne qui recommande 3M à son entourage ou à sa communauté, à titre indépendant.",
    hintEn: "A person who recommends 3M to their circle or community, as an independent.",
  },
};

export const PARTNERSHIP_STATUSES = ["submitted", "in_review", "protocol_issued", "partner_signed", "active", "rejected", "suspended"] as const;
export type PartnershipStatus = (typeof PARTNERSHIP_STATUSES)[number];

export const PARTNERSHIP_STATUS_LABELS: Record<PartnershipStatus, { fr: string; en: string }> = {
  submitted: { fr: "Candidature reçue", en: "Application received" },
  in_review: { fr: "En vérification", en: "Under review" },
  protocol_issued: { fr: "Protocole envoyé", en: "Agreement sent" },
  partner_signed: { fr: "Signé par le partenaire", en: "Signed by the partner" },
  active: { fr: "Partenaire actif", en: "Active partner" },
  rejected: { fr: "Candidature refusée", en: "Application declined" },
  suspended: { fr: "Suspendu", en: "Suspended" },
};

/** Statuts qui attendent une action de l'administration. */
export const PARTNERSHIP_ADMIN_ACTION_STATUSES: readonly PartnershipStatus[] = ["submitted", "in_review", "partner_signed"];

export const PARTNERSHIP_ROUTES = {
  hub: "/partenariat",
  apply: "/partenariat#candidature",
  sign: "/partenariat/signature",
} as const;

/** Canaux par lesquels le partenaire compte faire connaître 3M. */
export const PARTNERSHIP_CHANNELS = ["whatsapp", "social", "community", "network", "office", "other"] as const;
export type PartnershipChannel = (typeof PARTNERSHIP_CHANNELS)[number];
export const PARTNERSHIP_CHANNEL_LABELS: Record<PartnershipChannel, { fr: string; en: string }> = {
  whatsapp: { fr: "Groupes et messages WhatsApp", en: "WhatsApp groups and messages" },
  social: { fr: "Réseaux sociaux", en: "Social media" },
  community: { fr: "Communauté, association, église", en: "Community, association, congregation" },
  network: { fr: "Entourage et réseau professionnel", en: "Personal and professional network" },
  office: { fr: "Bureau ou point d’accueil", en: "Office or walk-in point" },
  other: { fr: "Autre", en: "Other" },
};

export const PARTNERSHIP_VOLUME_BANDS = ["1-5", "6-20", "21-50", "50+"] as const;
export type PartnershipVolumeBand = (typeof PARTNERSHIP_VOLUME_BANDS)[number];

/**
 * Bornes des conditions négociées avec chaque partenaire. Les valeurs « par défaut » ne sont que des propositions
 * pré-remplies dans l'outil d'administration : le taux proposé reprend celui du programme ambassadeur existant.
 */
export const PARTNERSHIP_TERMS_LIMITS = {
  commissionBps: { min: 100, max: 3000, proposed: 1500 },
  termMonths: { min: 6, max: 36, proposed: 12 },
  attributionMonths: { min: 3, max: 24, proposed: 12 },
  paymentDelayDays: { min: 7, max: 90, proposed: 30 },
} as const;

export const PARTNERSHIP_SIGNING_VALIDITY_DAYS = 14;

export type PartnershipTerms = {
  commissionRateBps: number;
  termMonths: number;
  attributionMonths: number;
  paymentDelayDays: number;
  territory: string;
};

export function isIntegerWithin(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

/** Retourne le premier problème des conditions saisies, ou null si elles sont acceptables. */
export function partnershipTermsProblem(terms: Partial<PartnershipTerms>): string | null {
  const limits = PARTNERSHIP_TERMS_LIMITS;
  if (!isIntegerWithin(terms.commissionRateBps, limits.commissionBps.min, limits.commissionBps.max)) {
    return `Le taux de commission doit être compris entre ${formatCommissionRate(limits.commissionBps.min)} et ${formatCommissionRate(limits.commissionBps.max)}.`;
  }
  if (!isIntegerWithin(terms.termMonths, limits.termMonths.min, limits.termMonths.max)) {
    return `La durée doit être comprise entre ${limits.termMonths.min} et ${limits.termMonths.max} mois.`;
  }
  if (!isIntegerWithin(terms.attributionMonths, limits.attributionMonths.min, limits.attributionMonths.max)) {
    return `La durée d’attribution d’un client doit être comprise entre ${limits.attributionMonths.min} et ${limits.attributionMonths.max} mois.`;
  }
  if (!isIntegerWithin(terms.paymentDelayDays, limits.paymentDelayDays.min, limits.paymentDelayDays.max)) {
    return `Le délai de versement doit être compris entre ${limits.paymentDelayDays.min} et ${limits.paymentDelayDays.max} jours.`;
  }
  const territory = (terms.territory ?? "").trim();
  if (territory.length < 2 || territory.length > 200) return "Le territoire ou la zone d’intervention est obligatoire (200 caractères au plus).";
  return null;
}

/** 1500 → « 15 % » ; 1250 → « 12,5 % ». */
export function formatCommissionRate(bps: number): string {
  const percent = bps / 100;
  return `${Number.isInteger(percent) ? percent : percent.toFixed(2).replace(/0+$/, "").replace(".", ",")} %`;
}

/** Référence lisible d'un dossier de partenariat : PAR-2026-0007. */
export function partnershipReference(id: number, createdAt: Date | string | null | undefined): string {
  const year = createdAt ? new Date(createdAt).getUTCFullYear() : new Date().getUTCFullYear();
  return `PAR-${Number.isFinite(year) ? year : new Date().getUTCFullYear()}-${String(Math.max(0, Math.trunc(id))).padStart(4, "0")}`;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export type PartnershipSigningState = "ready" | "expired" | "signed" | "unavailable";

/** État d'un lien de signature : un protocole n'est signable que s'il a été émis, n'est pas expiré et n'a pas déjà été signé. */
export function partnershipSigningState(
  record: { status: string; signTokenExpiresAt?: Date | null; partnerSignedAt?: Date | null },
  now: Date = new Date(),
): PartnershipSigningState {
  if (record.partnerSignedAt) return "signed";
  if (record.status !== "protocol_issued") return "unavailable";
  if (!record.signTokenExpiresAt || record.signTokenExpiresAt.getTime() <= now.getTime()) return "expired";
  return "ready";
}

/** Une commission n'est jamais due avant la contresignature de 3M. */
export function isPartnershipCommissionActive(status: string): boolean {
  return status === "active";
}

export const PARTNERSHIP_FIELD_LIMITS = {
  name: 255,
  email: 320,
  phone: 50,
  country: 100,
  city: 120,
  company: 255,
  registration: 120,
  taxId: 80,
  licence: 120,
  website: 255,
  role: 160,
  message: 1500,
  note: 1000,
} as const;

/** Adresse de site normalisée (http/https uniquement) ; chaîne vide si absente ou invalide. */
export function normalizeWebsite(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) return "";
    return url.toString().replace(/\/$/, "").slice(0, PARTNERSHIP_FIELD_LIMITS.website);
  } catch {
    return "";
  }
}
