/**
 * Catalogue études : écoles, programmes, rentrées, scolarités et candidatures déposées par l'agence.
 *
 * Règles de contenu : une scolarité s'affiche toujours avec son année académique, sa devise et la mention « indicatif ».
 * Un montant relu il y a plus d'un an passe en « à reconfirmer ». Rien n'est visible du candidat avant publication.
 * Le candidat ne dépose pas lui-même auprès de l'école : l'agence contrôle les pièces avant l'envoi.
 */
export const CATALOG_STATUSES = ["draft", "needs_review", "published", "retired"] as const;
export type StudyCatalogStatus = (typeof CATALOG_STATUSES)[number];

export const INSTITUTION_TYPES = ["university", "college", "business_school", "language_school", "vocational", "other"] as const;
export type InstitutionType = (typeof INSTITUTION_TYPES)[number];
export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  university: "Université",
  college: "Collège / institut",
  business_school: "École de commerce",
  language_school: "École de langues",
  vocational: "Formation professionnelle",
  other: "Autre établissement",
};

export const STUDY_LEVELS = ["language", "certificate", "diploma", "bachelor", "master", "phd", "vocational"] as const;
export type StudyLevel = (typeof STUDY_LEVELS)[number];
export const STUDY_LEVEL_LABELS: Record<StudyLevel, string> = {
  language: "Cours de langue",
  certificate: "Certificat",
  diploma: "Diplôme",
  bachelor: "Licence / bachelor",
  master: "Master",
  phd: "Doctorat",
  vocational: "Formation professionnelle",
};

export const STUDY_MODES = ["on_site", "hybrid"] as const;
export const STUDY_MODE_LABELS: Record<(typeof STUDY_MODES)[number], string> = { on_site: "Sur place", hybrid: "Hybride" };

export const INTAKE_AVAILABILITIES = ["open", "closing_soon", "closed", "waitlist"] as const;
export type IntakeAvailability = (typeof INTAKE_AVAILABILITIES)[number];
export const INTAKE_AVAILABILITY_LABELS: Record<IntakeAvailability, string> = { open: "Ouverte", closing_soon: "Bientôt close", closed: "Close", waitlist: "Liste d'attente" };

export const TUITION_PERIODS = ["year", "semester", "total"] as const;
export const TUITION_PERIOD_LABELS: Record<(typeof TUITION_PERIODS)[number], string> = { year: "par an", semester: "par semestre", total: "pour tout le programme" };
export const STUDENT_CATEGORIES = ["international", "local"] as const;

export const STUDY_APPLICATION_STATUSES = [
  "submitted_to_agency",
  "agency_review",
  "documents_requested",
  "submitted_to_institution",
  "offer_conditional",
  "offer_unconditional",
  "deposit_paid",
  "admission_letter_received",
  "visa_phase",
  "rejected",
  "withdrawn",
] as const;
export type StudyApplicationStatus = (typeof STUDY_APPLICATION_STATUSES)[number];

export const STUDY_STATUS_LABELS: Record<StudyApplicationStatus, string> = {
  submitted_to_agency: "Reçue par l'agence",
  agency_review: "Pièces en vérification",
  documents_requested: "Pièces demandées",
  submitted_to_institution: "Déposée auprès de l'établissement",
  offer_conditional: "Admission sous conditions",
  offer_unconditional: "Admission confirmée",
  deposit_paid: "Acompte réglé",
  admission_letter_received: "Lettre d'admission reçue",
  visa_phase: "Étape visa études",
  rejected: "Non retenue",
  withdrawn: "Retirée",
};

/** Ce que le candidat doit faire à chaque étape, en une phrase. */
export const STUDY_STATUS_CLIENT_NEXT: Record<StudyApplicationStatus, string> = {
  submitted_to_agency: "Votre conseiller examine votre demande.",
  agency_review: "Votre conseiller vérifie vos pièces.",
  documents_requested: "Déposez les pièces demandées dans votre espace.",
  submitted_to_institution: "Réponse de l'établissement en attente.",
  offer_conditional: "Remplissez les conditions indiquées par votre conseiller.",
  offer_unconditional: "Votre conseiller vous explique la suite (acompte, logement, visa).",
  deposit_paid: "Votre conseiller attend la lettre d'admission officielle.",
  admission_letter_received: "Votre dossier de visa études peut être préparé.",
  visa_phase: "Suivez l'avancement de votre visa études.",
  rejected: "Vous pouvez choisir un autre vœu avec votre conseiller.",
  withdrawn: "Candidature retirée.",
};

export const TERMINAL_STUDY_STATUSES: readonly StudyApplicationStatus[] = ["rejected", "withdrawn"];
export const isActiveStudyStatus = (status: StudyApplicationStatus) => !TERMINAL_STUDY_STATUSES.includes(status);

/** Trois vœux actifs au plus : évite les envois en masse et garde un dossier traitable. */
export const MAX_ACTIVE_STUDY_APPLICATIONS = 3;

export const STUDY_CONSENT_VERSION = "2026-10";
export const STUDY_CONSENT_TEXT =
  "J'autorise 3M TRAVEL AGENCY à utiliser les informations et pièces de mon dossier pour préparer cette candidature et la déposer auprès de l'établissement choisi. Aucune admission n'est garantie : la décision appartient à l'établissement.";

/** Un administrateur peut faire avancer ou corriger une candidature, mais ne rouvre pas une candidature retirée ou non retenue sans la recréer. */
export function isStudyStatusChangeAllowed(from: StudyApplicationStatus, to: StudyApplicationStatus): boolean {
  if (from === to) return false;
  if (TERMINAL_STUDY_STATUSES.includes(from)) return false;
  return true;
}

export const TUITION_STALE_DAYS = 365;

export function tuitionFreshness(checkedAt: Date | string | null | undefined, now: Date = new Date()): "fresh" | "stale" | "never" {
  if (!checkedAt) return "never";
  const time = new Date(checkedAt).getTime();
  if (!Number.isFinite(time)) return "never";
  return now.getTime() - time > TUITION_STALE_DAYS * 86_400_000 ? "stale" : "fresh";
}

export const isAcademicYear = (value: string) => {
  const match = /^(\d{4})-(\d{4})$/.exec(value.trim());
  return Boolean(match) && Number(match![2]) === Number(match![1]) + 1;
};
export const isCurrencyCode = (value: string) => /^[A-Z]{3}$/.test(value.trim());

export type TuitionFeeLike = {
  amount: string | number;
  currency: string;
  period: (typeof TUITION_PERIODS)[number];
  academicYear: string;
  applicationFee?: string | number | null;
  checkedAt?: Date | string | null;
};

/** « 12 500 EUR par an · année 2026-2027 · indicatif » (jamais un montant sans année ni devise). */
export function tuitionLabel(fee: TuitionFeeLike, now: Date = new Date()): string {
  const amount = Number(fee.amount);
  const formatted = Number.isFinite(amount) ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(amount) : String(fee.amount);
  const stale = tuitionFreshness(fee.checkedAt, now) !== "fresh";
  return `${formatted} ${fee.currency} ${TUITION_PERIOD_LABELS[fee.period]} · année ${fee.academicYear} · indicatif${stale ? " (à reconfirmer)" : ""}`;
}

const dayStart = (value: Date) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
const parseDay = (value: string | null | undefined) => (value ? new Date(`${value.slice(0, 10)}T00:00:00Z`) : null);

export type IntakeLike = { startDate: string; applicationsOpenAt?: string | null; applicationDeadline?: string | null; availability: IntakeAvailability };

/** Disponibilité réelle d'une rentrée : la date limite dépassée ferme la rentrée, même si l'administrateur a oublié de la fermer. */
export function effectiveAvailability(intake: IntakeLike, now: Date = new Date()): IntakeAvailability {
  const today = dayStart(now).getTime();
  const deadline = parseDay(intake.applicationDeadline ?? null);
  const start = parseDay(intake.startDate);
  const open = parseDay(intake.applicationsOpenAt ?? null);
  if (intake.availability === "closed") return "closed";
  if (deadline && deadline.getTime() < today) return "closed";
  if (!deadline && start && start.getTime() < today) return "closed";
  if (open && open.getTime() > today) return "closed";
  if (intake.availability === "waitlist") return "waitlist";
  if (deadline && deadline.getTime() - today <= 30 * 86_400_000) return "closing_soon";
  return intake.availability;
}

export const canApplyToIntake = (intake: IntakeLike, now: Date = new Date()) => {
  const availability = effectiveAvailability(intake, now);
  return availability === "open" || availability === "closing_soon" || availability === "waitlist";
};

export type PublishCheckResult = string[];

export function institutionPublishBlockers(input: { name: string; countryCode: string; accreditationNote: string | null | undefined; checkedAt: Date | string | null | undefined; now?: Date }): PublishCheckResult {
  const reasons: string[] = [];
  if (!input.name.trim()) reasons.push("Le nom de l'établissement est obligatoire.");
  if (!String(input.accreditationNote ?? "").trim()) reasons.push("Indiquez l'accréditation ou la reconnaissance de l'établissement.");
  if (tuitionFreshness(input.checkedAt, input.now) !== "fresh") reasons.push("Relisez les informations de l'établissement aujourd'hui (case « relu aujourd'hui »).");
  return reasons;
}

export function intakePublishBlockers(input: { startDate: string; applicationDeadline?: string | null; applicationsOpenAt?: string | null }): PublishCheckResult {
  const reasons: string[] = [];
  const start = parseDay(input.startDate);
  const deadline = parseDay(input.applicationDeadline ?? null);
  const open = parseDay(input.applicationsOpenAt ?? null);
  if (!start || Number.isNaN(start.getTime())) reasons.push("La date de début est obligatoire.");
  if (start && deadline && deadline.getTime() > start.getTime()) reasons.push("La date limite de candidature doit précéder le début des cours.");
  if (open && deadline && open.getTime() > deadline.getTime()) reasons.push("L'ouverture des candidatures doit précéder la date limite.");
  return reasons;
}

export function feePublishBlockers(input: { amount: string | number; currency: string; academicYear: string; sourceNote: string | null | undefined; checkedAt: Date | string | null | undefined; now?: Date }): PublishCheckResult {
  const reasons: string[] = [];
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) reasons.push("Le montant doit être supérieur à zéro.");
  if (!isCurrencyCode(input.currency)) reasons.push("La devise doit être un code à trois lettres (EUR, CAD, GBP…).");
  if (!isAcademicYear(input.academicYear)) reasons.push("L'année académique s'écrit 2026-2027.");
  if (!String(input.sourceNote ?? "").trim()) reasons.push("Indiquez la provenance du montant (visible de l'administration seulement).");
  if (tuitionFreshness(input.checkedAt, input.now) !== "fresh") reasons.push("Relisez le montant aujourd'hui (case « relu aujourd'hui »).");
  return reasons;
}
