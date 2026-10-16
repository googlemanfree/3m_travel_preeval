/**
 * Exigences distinctes du formulaire d’évaluation public selon le type de visa.
 * Travail → CV + profil pro · Études → parcours scolaire + cycle · Visiteurs → statut simple.
 */

export type EvaluationFormProjectType = "travail" | "etudes" | "tourisme";

export type StudyCycle =
  | "bac"
  | "bts_dut"
  | "licence"
  | "master"
  | "doctorat"
  | "formation_pro"
  | "autre";

export type VisitorStatus = "chef_entreprise" | "employe" | "particulier";

export type EvaluationRequirementPhase = "criteria" | "documents" | "all";

export const STUDY_CYCLE_OPTIONS: Array<{ value: StudyCycle; label: string }> = [
  { value: "bac", label: "Baccalauréat / équivalent" },
  { value: "bts_dut", label: "BTS / DUT / technicien" },
  { value: "licence", label: "Licence / Bachelor" },
  { value: "master", label: "Master / ingénieur" },
  { value: "doctorat", label: "Doctorat / PhD" },
  { value: "formation_pro", label: "Formation professionnelle / courte" },
  { value: "autre", label: "Autre cycle" },
];

export const VISITOR_STATUS_OPTIONS: Array<{ value: VisitorStatus; label: string; hint: string }> = [
  { value: "chef_entreprise", label: "Chef d’entreprise / indépendant", hint: "Vous dirigez une activité ou êtes à votre compte." },
  { value: "employe", label: "Employé / salarié", hint: "Vous avez un emploi salarié dans votre pays de résidence." },
  { value: "particulier", label: "Particulier", hint: "Sans activité professionnelle déclarée (retraité, sans emploi, autre)." },
];

export const STUDY_CYCLE_LABELS: Record<StudyCycle, string> = Object.fromEntries(
  STUDY_CYCLE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<StudyCycle, string>;

export const VISITOR_STATUS_LABELS: Record<VisitorStatus, string> = Object.fromEntries(
  VISITOR_STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<VisitorStatus, string>;

export type MultiProjectRequirementInput = {
  projectType: EvaluationFormProjectType;
  sector?: string | null;
  yearsOfExperience?: number | null;
  languages?: string | null;
  educationLevel?: string | null;
  studyCycle?: string | null;
  diplomaLevel?: string | null;
  financialGuarantee?: string | null;
  visitReason?: string | null;
  visitorStatus?: string | null;
  cvAvailable?: boolean | null;
  cvLink?: string | null;
  hasCvDocument?: boolean | null;
  hasDiplomaDocument?: boolean | null;
  hasTranscriptDocument?: boolean | null;
  transcriptAvailable?: boolean | null;
};

function criteriaGap(input: MultiProjectRequirementInput): string | null {
  if (input.projectType === "travail") {
    if (!String(input.sector ?? "").trim()) {
      return "Visa travail : indiquez le secteur ou le métier visé.";
    }
    if (input.yearsOfExperience === undefined || input.yearsOfExperience === null || Number.isNaN(Number(input.yearsOfExperience))) {
      return "Visa travail : indiquez vos années d’expérience (0 si débutant).";
    }
    if (!String(input.languages ?? "").trim()) {
      return "Visa travail : indiquez vos langues (niveaux ou tests).";
    }
    return null;
  }

  if (input.projectType === "etudes") {
    if (!String(input.educationLevel ?? "").trim()) {
      return "Visa études : indiquez votre dernier niveau scolaire / diplôme obtenu.";
    }
    if (!String(input.studyCycle ?? "").trim()) {
      return "Visa études : précisez le cycle que vous souhaitez suivre (licence, master…).";
    }
    if (!String(input.sector ?? "").trim()) {
      return "Visa études : indiquez la filière ou le programme envisagé.";
    }
    return null;
  }

  if (input.projectType === "tourisme") {
    if (!String(input.visitorStatus ?? "").trim()) {
      return "Visa visiteurs : indiquez votre statut (chef d’entreprise, employé ou particulier).";
    }
    if (!["chef_entreprise", "employe", "particulier"].includes(String(input.visitorStatus))) {
      return "Visa visiteurs : statut invalide.";
    }
    if (!String(input.visitReason ?? "").trim()) {
      return "Visa visiteurs : indiquez le motif du séjour.";
    }
    return null;
  }

  return null;
}

function documentsGap(input: MultiProjectRequirementInput): string | null {
  if (input.projectType === "travail") {
    const hasCv = Boolean(input.cvAvailable) || Boolean(input.hasCvDocument) || Boolean(String(input.cvLink ?? "").trim());
    if (!hasCv) {
      return "Visa travail : un CV actualisé est obligatoire (fichier ou lien sécurisé).";
    }
    return null;
  }

  if (input.projectType === "etudes") {
    if (!Boolean(input.hasDiplomaDocument)) {
      return "Visa études : joignez au moins un fichier diplôme pour l’évaluation préalable.";
    }
    const hasTranscript = Boolean(input.hasTranscriptDocument) || Boolean(input.transcriptAvailable);
    if (!hasTranscript) {
      return "Visa études : joignez vos relevés de notes (ou confirmez qu’ils sont prêts à être déposés).";
    }
    return null;
  }

  // Visiteurs : formulaire simple — aucune pièce obligatoire à cette étape.
  return null;
}

/** Retourne le message d’erreur FR, ou null si conforme. */
export function multiProjectEvaluationGap(
  input: MultiProjectRequirementInput,
  phase: EvaluationRequirementPhase = "all",
): string | null {
  if (phase === "criteria" || phase === "all") {
    const gap = criteriaGap(input);
    if (gap) return gap;
  }
  if (phase === "documents" || phase === "all") {
    const gap = documentsGap(input);
    if (gap) return gap;
  }
  return null;
}
