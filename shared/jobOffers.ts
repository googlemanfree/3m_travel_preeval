/**
 * Offres d'emploi et candidatures : règles partagées (modération, pré-contrôle d'éligibilité, étapes).
 *
 * Principes : une offre n'est visible qu'après modération par l'agence ; aucun frais n'est jamais demandé au candidat ;
 * le pré-contrôle informe sans jamais écarter un candidat ; le candidat ne partage son profil qu'avec son accord.
 */
export const JOB_OFFER_STATUSES = ["draft", "in_moderation", "published", "closed", "rejected", "archived"] as const;
export type JobOfferStatus = (typeof JOB_OFFER_STATUSES)[number];
export const JOB_OFFER_STATUS_LABELS: Record<JobOfferStatus, string> = { draft: "Brouillon", in_moderation: "En modération", published: "Publiée", closed: "Clôturée", rejected: "Refusée", archived: "Archivée" };

export const CONTRACT_TYPES = ["cdi", "cdd", "seasonal", "interim", "internship", "apprenticeship", "freelance"] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = { cdi: "CDI", cdd: "CDD", seasonal: "Saisonnier", interim: "Intérim", internship: "Stage", apprenticeship: "Alternance", freelance: "Indépendant" };

export const VISA_SPONSORSHIPS = ["employer_sponsors", "employer_assists", "candidate_handles"] as const;
export type VisaSponsorship = (typeof VISA_SPONSORSHIPS)[number];
export const VISA_SPONSORSHIP_LABELS: Record<VisaSponsorship, string> = { employer_sponsors: "L'employeur parraine le visa", employer_assists: "L'employeur aide aux démarches", candidate_handles: "Démarches à la charge du candidat" };

export const SALARY_PERIODS = ["hour", "month", "year"] as const;
export const SALARY_PERIOD_LABELS: Record<(typeof SALARY_PERIODS)[number], string> = { hour: "par heure", month: "par mois", year: "par an" };

export const JOB_APPLICATION_STATUSES = ["submitted", "screening", "documents_requested", "shortlisted", "interview", "offer_sent", "accepted", "hired", "rejected", "withdrawn"] as const;
export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];
export const JOB_STATUS_LABELS: Record<JobApplicationStatus, string> = {
  submitted: "Reçue par l'agence",
  screening: "Examen de votre profil",
  documents_requested: "Pièces demandées",
  shortlisted: "Présélectionnée",
  interview: "Entretien",
  offer_sent: "Offre envoyée",
  accepted: "Offre acceptée",
  hired: "Embauche confirmée",
  rejected: "Non retenue",
  withdrawn: "Retirée",
};
export const JOB_STATUS_CLIENT_NEXT: Record<JobApplicationStatus, string> = {
  submitted: "Votre conseiller examine votre candidature.",
  screening: "Votre profil est examiné pour cette offre.",
  documents_requested: "Déposez les pièces demandées dans votre espace.",
  shortlisted: "Votre profil est retenu pour la suite.",
  interview: "Votre conseiller organise l'entretien avec vous.",
  offer_sent: "Une offre vous est faite : votre conseiller vous explique la suite.",
  accepted: "Votre conseiller prépare la procédure de visa liée à ce poste.",
  hired: "Embauche confirmée. La procédure de visa suit son cours.",
  rejected: "Vous pouvez postuler à d'autres offres avec votre conseiller.",
  withdrawn: "Candidature retirée.",
};
export const TERMINAL_JOB_STATUSES: readonly JobApplicationStatus[] = ["rejected", "withdrawn", "hired"];
export const isActiveJobStatus = (status: JobApplicationStatus) => !TERMINAL_JOB_STATUSES.includes(status);
export const MAX_ACTIVE_JOB_APPLICATIONS = 5;

/** Motifs de refus : liste fermée, jamais de texte libre transmis tel quel. */
export const REJECTION_CODES = ["profile_mismatch", "position_filled", "missing_documents", "language_level", "experience", "other"] as const;
export const REJECTION_LABELS: Record<(typeof REJECTION_CODES)[number], string> = {
  profile_mismatch: "Profil différent du poste",
  position_filled: "Poste déjà pourvu",
  missing_documents: "Pièces manquantes",
  language_level: "Niveau de langue",
  experience: "Expérience insuffisante pour ce poste",
  other: "Autre raison",
};

export const REPORT_REASONS = ["fees_requested", "fake_offer", "discrimination", "illegal_content", "wrong_info", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  fees_requested: "On me demande de l'argent",
  fake_offer: "L'offre semble fausse",
  discrimination: "Discrimination",
  illegal_content: "Contenu illégal",
  wrong_info: "Informations erronées",
  other: "Autre",
};
/** Ces signalements retirent l'offre de la liste en attendant l'instruction par l'administration. */
export const reportSuspendsOffer = (reason: ReportReason) => reason === "fees_requested" || reason === "fake_offer" || reason === "illegal_content";

export const JOB_CONSENT_VERSION = "2026-10";
export const JOB_CONSENT_TEXT =
  "J'autorise 3M TRAVEL AGENCY à présenter un profil minimal (métier, expérience, niveau d'études, langues, disponibilité) à l'employeur de cette offre. Mon nom, ma photo et mes coordonnées ne sont partagés qu'à une étape avancée, avec mon accord. Aucun employeur ne peut me demander de frais.";

export const isJobStatusChangeAllowed = (from: JobApplicationStatus, to: JobApplicationStatus) => from !== to && !TERMINAL_JOB_STATUSES.includes(from);

// ─── Modération : analyse du texte d'une offre ─────────────────────────────────────────────────────

export type OfferTextFlags = { contact: string[]; money: string[] };

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const URL_LIKE = /\b(?:https?:\/\/|www\.)[^\s]+/gi;
const PHONE = /(?:\+|00)\d[\d\s().-]{7,}\d|\b\d{2}[\s.-]\d{2}[\s.-]\d{2}[\s.-]\d{2}(?:[\s.-]\d{2})?\b/g;
const MESSAGING = /\b(whatsapp|telegram|signal)\b/gi;
const MONEY = /\b(?:frais|payer|paiement|versement|virement|avance|caution|western\s*union|mobile\s*money|orange\s*money|mtn\s*money|wave)\b[^.\n]{0,60}\b(?:candidat|dossier|inscription|visa|recrutement|traitement|billet)\b/gi;

/** Signale ce qu'une offre ne doit pas contenir : coordonnées personnelles et demandes d'argent. L'administrateur décide toujours. */
export function scanOfferText(text: string): OfferTextFlags {
  const found = (pattern: RegExp) => Array.from(new Set(Array.from(text.matchAll(pattern), (match) => match[0].trim()))).slice(0, 5);
  return { contact: [...found(EMAIL), ...found(URL_LIKE), ...found(PHONE), ...found(MESSAGING)], money: found(MONEY) };
}

export type OfferChecks = { noFees: boolean; noDiscrimination: boolean; noContact: boolean; visaCoherent: boolean };

export function jobOfferPublishBlockers(input: {
  title: string;
  description: string;
  requirements?: string | null;
  contractType: string;
  organizationVerified: boolean | null;
  checks: OfferChecks;
}): string[] {
  const reasons: string[] = [];
  if (!input.title.trim()) reasons.push("Le titre est obligatoire.");
  if (input.description.trim().length < 80) reasons.push("La description doit détailler le poste (80 caractères au moins).");
  if (!(CONTRACT_TYPES as readonly string[]).includes(input.contractType)) reasons.push("Le type de contrat est obligatoire.");
  if (input.organizationVerified === false) reasons.push("L'employeur rattaché n'est pas vérifié.");
  const flags = scanOfferText(`${input.title}\n${input.description}\n${input.requirements ?? ""}`);
  if (flags.contact.length > 0) reasons.push(`Le texte contient des coordonnées (${flags.contact.slice(0, 2).join(", ")}) : retirez-les, la mise en relation passe par l'agence.`);
  if (flags.money.length > 0) reasons.push("Le texte semble demander de l'argent au candidat : retirez-le, aucun frais n'est admis.");
  if (!input.checks.noFees) reasons.push("Confirmez qu'aucun frais n'est demandé au candidat.");
  if (!input.checks.noDiscrimination) reasons.push("Confirmez l'absence de discrimination (âge, sexe, origine, religion).");
  if (!input.checks.noContact) reasons.push("Confirmez l'absence de coordonnées personnelles dans le texte.");
  if (!input.checks.visaCoherent) reasons.push("Confirmez que le dispositif de visa est cohérent avec le poste.");
  return reasons;
}

export function isOfferOpen(offer: { status: string; applicationDeadline?: string | null }, now: Date = new Date()): boolean {
  if (offer.status !== "published") return false;
  if (!offer.applicationDeadline) return true;
  const deadline = new Date(`${offer.applicationDeadline.slice(0, 10)}T23:59:59Z`).getTime();
  return Number.isFinite(deadline) && deadline >= now.getTime();
}

// ─── Pré-contrôle d'éligibilité : informe, n'écarte jamais ──────────────────────────────────────────

export type PrecheckState = "met" | "partial" | "unknown";
export type PrecheckCriterion = { key: string; label: string; state: PrecheckState; detail: string };

const CEFR_RANK: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

export function parseYears(value: string | null | undefined): number | null {
  const numbers = Array.from(String(value ?? "").matchAll(/\d+/g), (match) => Number(match[0]));
  if (numbers.length === 0) return null;
  // « 3-5 ans » : on retient la borne basse, jamais plus que ce que le candidat a déclaré.
  return Math.min(...numbers);
}

export function parseCefr(value: string | null | undefined): number | null {
  const match = /\b([ABC][12])\b/i.exec(String(value ?? ""));
  if (match) return CEFR_RANK[match[1].toUpperCase()] ?? null;
  const text = String(value ?? "").toLowerCase();
  if (/(natif|maternelle|bilingue|courant|avanc)/.test(text)) return CEFR_RANK.C1;
  if (/(interm)/.test(text)) return CEFR_RANK.B1;
  if (/(débutant|debutant|élémentaire|elementaire|basique)/.test(text)) return CEFR_RANK.A2;
  return null;
}

const EDUCATION_RANKS: Array<[RegExp, number]> = [
  [/doctorat|phd/i, 8],
  [/master|bac\s*\+\s*5|ingénieur|ingenieur|dess|dea/i, 7],
  [/licence|bachelor|bac\s*\+\s*3|bac\s*\+\s*4|maîtrise|maitrise/i, 6],
  [/bts|dut|bac\s*\+\s*2|diplôme technique|diplome technique|dts/i, 5],
  [/bac(calauréat)?|baccalaureat/i, 4],
  [/bepc|cap|bep|brevet/i, 3],
  [/primaire|cepe|collège|college/i, 2],
];
export function educationRank(value: string | null | undefined): number | null {
  const text = String(value ?? "");
  for (const [pattern, rank] of EDUCATION_RANKS) if (pattern.test(text)) return rank;
  return null;
}

export type OfferRequirements = {
  experienceMinYears: number | null;
  languages: Array<{ lang: string; level: string; required?: boolean }>;
  diplomas: Array<{ level: string; field?: string; required?: boolean }>;
};
export type CandidateProfileInput = { yearsOfExperience?: string | null; educationLevel?: string | null; frenchLevel?: string | null; englishLevel?: string | null };

/** Compare le profil déclaré aux exigences de l'offre. « Partiel » et « inconnu » informent : ils n'interdisent jamais de postuler. */
export function precheckOffer(requirements: OfferRequirements, profile: CandidateProfileInput): PrecheckCriterion[] {
  const out: PrecheckCriterion[] = [];
  if (requirements.experienceMinYears !== null && requirements.experienceMinYears > 0) {
    const years = parseYears(profile.yearsOfExperience);
    out.push(years === null
      ? { key: "experience", label: `Expérience : ${requirements.experienceMinYears} an(s)`, state: "unknown", detail: "Votre expérience n'est pas renseignée." }
      : years >= requirements.experienceMinYears
        ? { key: "experience", label: `Expérience : ${requirements.experienceMinYears} an(s)`, state: "met", detail: `${years} an(s) déclaré(s).` }
        : { key: "experience", label: `Expérience : ${requirements.experienceMinYears} an(s)`, state: "partial", detail: `${years} an(s) déclaré(s) : votre conseiller en discute avec vous.` });
  }
  for (const language of requirements.languages) {
    const wanted = parseCefr(language.level);
    const lang = language.lang.toLowerCase();
    const declared = lang.startsWith("fran") ? profile.frenchLevel : lang.startsWith("angl") || lang === "english" ? profile.englishLevel : null;
    const label = `${language.lang} ${language.level}${language.required === false ? " (souhaité)" : ""}`;
    const level = parseCefr(declared);
    out.push(declared === null || declared === undefined || level === null || wanted === null
      ? { key: `lang-${lang}`, label, state: "unknown", detail: "Niveau non renseigné ou non comparable." }
      : level >= wanted
        ? { key: `lang-${lang}`, label, state: "met", detail: "Niveau déclaré suffisant." }
        : { key: `lang-${lang}`, label, state: "partial", detail: "Niveau déclaré inférieur : des cours ou un test peuvent être envisagés." });
  }
  const wantedDiploma = requirements.diplomas.map((item) => educationRank(item.level)).filter((rank): rank is number => rank !== null);
  if (wantedDiploma.length > 0) {
    const rank = educationRank(profile.educationLevel);
    const need = Math.min(...wantedDiploma);
    const label = `Diplôme : ${requirements.diplomas[0].level}`;
    out.push(rank === null
      ? { key: "diploma", label, state: "unknown", detail: "Votre niveau d'études n'est pas renseigné." }
      : rank >= need
        ? { key: "diploma", label, state: "met", detail: "Niveau d'études déclaré suffisant." }
        : { key: "diploma", label, state: "partial", detail: "Niveau d'études déclaré inférieur à celui demandé." });
  }
  return out;
}
