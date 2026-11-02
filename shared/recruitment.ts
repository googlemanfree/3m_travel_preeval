/**
 * Besoins de recrutement, présentations de candidats et entretiens : règles communes au serveur et à l'interface.
 *
 * Principes : les candidats ne postulent pas eux-mêmes ; l'administration vérifie l'offre, confirme l'intérêt du candidat et
 * coordonne. Une réponse positive à « candidatures de l'étranger acceptées » ne génère JAMAIS « visa garanti », « admissible »
 * ou « emploi garanti » : ce sont des déclarations de l'employeur, à confirmer, sans lien avec une décision d'autorité.
 */

export const TRI_STATE_VALUES = ["yes", "no", "tbc"] as const;
export type TriState = (typeof TRI_STATE_VALUES)[number];
export const TRI_STATE_LABELS: Record<TriState, { fr: string; en: string }> = {
  yes: { fr: "Oui", en: "Yes" },
  no: { fr: "Non", en: "No" },
  tbc: { fr: "À confirmer", en: "To be confirmed" },
};

export const SUPPORT_VALUES = ["yes", "no", "to_specify"] as const;
export type SupportState = (typeof SUPPORT_VALUES)[number];
export const SUPPORT_LABELS: Record<SupportState, { fr: string; en: string }> = {
  yes: { fr: "Oui", en: "Yes" },
  no: { fr: "Non", en: "No" },
  to_specify: { fr: "À préciser", en: "To be specified" },
};

/** Rappel affiché partout où ces champs apparaissent. */
export const INTERNATIONAL_FIELDS_NOTICE = "Ces réponses sont des déclarations de l’employeur, à confirmer par 3M. Elles ne constituent ni une garantie de visa ou d’autorisation de travail, ni une confirmation d’admissibilité d’un candidat : la décision appartient toujours à l’autorité du pays.";

export const SALARY_PERIODS = ["hour", "month", "year"] as const;
export const SALARY_PERIOD_LABELS: Record<(typeof SALARY_PERIODS)[number], string> = { hour: "par heure", month: "par mois", year: "par an" };

export const NEED_STATUSES = ["received", "under_review", "verified", "needs_info", "closed", "rejected"] as const;
export type NeedStatus = (typeof NEED_STATUSES)[number];
export const NEED_STATUS_LABELS: Record<NeedStatus, string> = {
  received: "Reçu par 3M",
  under_review: "En cours d’examen",
  verified: "Offre et employeur examinés par 3M",
  needs_info: "Informations complémentaires demandées",
  closed: "Clos",
  rejected: "Non retenu par 3M",
};

export const NEED_CANDIDATE_STATUSES = ["proposed", "admin_review", "candidate_contacted", "candidate_interested", "candidate_declined", "presented", "interview_requested", "interview_scheduled", "interview_done", "employer_selected", "employer_not_selected", "closed"] as const;
export type NeedCandidateStatus = (typeof NEED_CANDIDATE_STATUSES)[number];

const NEED_CANDIDATE_TRANSITIONS: Record<NeedCandidateStatus, NeedCandidateStatus[]> = {
  proposed: ["admin_review", "closed"],
  admin_review: ["candidate_contacted", "closed"],
  candidate_contacted: ["candidate_interested", "candidate_declined", "closed"],
  candidate_interested: ["presented", "closed"],
  candidate_declined: ["closed"],
  presented: ["interview_requested", "employer_selected", "employer_not_selected", "closed"],
  interview_requested: ["interview_scheduled", "presented", "closed"],
  interview_scheduled: ["interview_done", "closed"],
  interview_done: ["employer_selected", "employer_not_selected", "closed"],
  employer_selected: ["closed"],
  employer_not_selected: ["closed"],
  closed: [],
};

export function canAdvanceNeedCandidate(from: NeedCandidateStatus, to: NeedCandidateStatus): boolean {
  return from === to || NEED_CANDIDATE_TRANSITIONS[from].includes(to);
}

/** Statuts qu'un administrateur peut poser. Les réponses du candidat et la décision de l'employeur passent par leurs propres actions. */
export const ADMIN_SETTABLE_NEED_CANDIDATE: NeedCandidateStatus[] = ["admin_review", "candidate_contacted", "presented", "interview_requested", "interview_scheduled", "interview_done", "closed"];

/** Ce que voit l'employeur : le détail de l'échange avec le candidat reste réservé à l'administration. */
export const EMPLOYER_STATUS_LABELS: Record<NeedCandidateStatus, string> = {
  proposed: "Transmis à 3M",
  admin_review: "Examiné par 3M",
  candidate_contacted: "3M vérifie l’intérêt du candidat",
  candidate_interested: "3M prépare la présentation",
  candidate_declined: "Candidat non disponible pour ce poste",
  presented: "Candidat présenté",
  interview_requested: "Demande d’entretien transmise à 3M",
  interview_scheduled: "Entretien programmé",
  interview_done: "Entretien réalisé",
  employer_selected: "Sélectionné par votre organisation",
  employer_not_selected: "Non retenu par votre organisation",
  closed: "Clos",
};

export const CANDIDATE_STATUS_LABELS: Record<NeedCandidateStatus, string> = {
  proposed: "En cours d’examen par 3M",
  admin_review: "En cours d’examen par 3M",
  candidate_contacted: "Votre réponse est attendue",
  candidate_interested: "Intérêt enregistré — 3M prépare la suite",
  candidate_declined: "Vous avez décliné",
  presented: "Votre profil a été présenté",
  interview_requested: "Une demande d’entretien est à l’étude",
  interview_scheduled: "Entretien programmé",
  interview_done: "Entretien réalisé",
  employer_selected: "L’employeur a donné suite",
  employer_not_selected: "L’employeur n’a pas donné suite",
  closed: "Clos",
};

export const INTERVIEW_STATUSES = ["received", "accepted", "candidate_confirmed", "scheduled", "done", "declined", "cancelled"] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];
export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  received: "Demande reçue par 3M",
  accepted: "Acceptée par 3M — confirmation du candidat attendue",
  candidate_confirmed: "Candidat disponible",
  scheduled: "Entretien programmé",
  done: "Entretien réalisé",
  declined: "Non donnée suite",
  cancelled: "Annulée",
};
const INTERVIEW_TRANSITIONS: Record<InterviewStatus, InterviewStatus[]> = {
  received: ["accepted", "declined", "cancelled"],
  accepted: ["candidate_confirmed", "declined", "cancelled"],
  candidate_confirmed: ["scheduled", "cancelled"],
  scheduled: ["done", "cancelled"],
  done: [],
  declined: [],
  cancelled: [],
};
export function canAdvanceInterview(from: InterviewStatus, to: InterviewStatus): boolean {
  return from === to || INTERVIEW_TRANSITIONS[from].includes(to);
}
export const INTERVIEW_MODES = ["video", "phone", "onsite", "undecided"] as const;
export const INTERVIEW_MODE_LABELS: Record<(typeof INTERVIEW_MODES)[number], string> = { video: "Visioconférence", phone: "Téléphone", onsite: "Sur place", undecided: "À convenir" };

/** Les messages de notification ne contiennent jamais de nom de candidat ni de pièce : uniquement le fait et un renvoi vers l'espace. */
export const NOTIFICATION_KINDS = ["need_received", "need_reviewed", "candidate_proposed", "candidate_presented", "interview_requested", "interview_update", "candidate_opportunity", "candidate_response", "candidate_interview"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export function cleanOptionalList(input: string | null | undefined, maxLength = 1500): string | null {
  const value = String(input ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
  return value || null;
}

/** Vue d'un besoin présentée au candidat : jamais d'identité d'entreprise confidentielle, jamais de coordonnée. */
export function candidateNeedView(need: { title: string; country: string; workLocation: string | null; contractDuration: string | null; salaryGross: number | null; salaryCurrency: string | null; salaryPeriod: string | null; companyName: string | null; beneficiaryConfidential: boolean | number; foreignApplications: TriState; noLocalWorkAuth: TriState; intlSupport: SupportState }) {
  const showCompany = !need.beneficiaryConfidential && need.companyName;
  return {
    title: need.title,
    country: need.country,
    workLocation: need.workLocation,
    contractDuration: need.contractDuration,
    salary: need.salaryGross && need.salaryCurrency ? `${need.salaryGross.toLocaleString("fr-FR")} ${need.salaryCurrency} brut ${SALARY_PERIOD_LABELS[(need.salaryPeriod as (typeof SALARY_PERIODS)[number]) ?? "month"] ?? ""}`.trim() : null,
    employer: showCompany ? need.companyName : "Entreprise examinée par 3M",
    foreignApplications: need.foreignApplications,
    noLocalWorkAuth: need.noLocalWorkAuth,
    intlSupport: need.intlSupport,
  };
}
