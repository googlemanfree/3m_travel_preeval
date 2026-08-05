/**
 * Moteur de scoring — Évaluation d'éligibilité Visa Études
 * Grille de points fixe basée sur les critères réels examinés par les
 * services consulaires pour une demande de visa étudiant (niveau
 * académique, langue, capacité financière, statut d'admission, projet de
 * retour).
 */

export type AcademicLevel = "master_mention" | "licence" | "bac2" | "bac";
export type GradeLevel = "tres_bien" | "bien" | "assez_bien" | "passable";
export type LanguageLevel = "c1_c2" | "b2" | "b1" | "moins_b1";
export type AdmissionStatus = "admis" | "en_cours" | "pas_commence";
export type FinancialCapacity = "complete" | "partielle" | "incertaine";
export type ReturnTies = "solide" | "modere" | "faible";

export interface StudyVisaScoringInput {
  academicLevel: AcademicLevel;
  gradeLevel: GradeLevel;
  languageLevel: LanguageLevel;
  admissionStatus: AdmissionStatus;
  financialCapacity: FinancialCapacity;
  returnTies: ReturnTies;
}

export interface StudyVisaScoringResult {
  scoreAcademic: number;
  scoreGrades: number;
  scoreLanguage: number;
  scoreAdmission: number;
  scoreFinancial: number;
  scoreReturnTies: number;
  scoreTotal: number;
  eligibilityStatus: "tres_favorable" | "favorable" | "a_renforcer" | "risque_eleve";
  statusLabel: string;
  recommendationText: string;
}

function scoreAcademic(level: AcademicLevel): number {
  switch (level) {
    case "master_mention": return 20;
    case "licence": return 15;
    case "bac2": return 10;
    case "bac": return 5;
  }
}

function scoreGrades(level: GradeLevel): number {
  switch (level) {
    case "tres_bien": return 15;
    case "bien": return 11;
    case "assez_bien": return 7;
    case "passable": return 3;
  }
}

function scoreLanguage(level: LanguageLevel): number {
  switch (level) {
    case "c1_c2": return 20;
    case "b2": return 15;
    case "b1": return 8;
    case "moins_b1": return 3;
  }
}

function scoreAdmission(status: AdmissionStatus): number {
  switch (status) {
    case "admis": return 15;
    case "en_cours": return 8;
    case "pas_commence": return 3;
  }
}

function scoreFinancial(capacity: FinancialCapacity): number {
  switch (capacity) {
    case "complete": return 20;
    case "partielle": return 10;
    case "incertaine": return 3;
  }
}

function scoreReturnTies(ties: ReturnTies): number {
  switch (ties) {
    case "solide": return 10;
    case "modere": return 5;
    case "faible": return 2;
  }
}

export function computeStudyVisaScore(input: StudyVisaScoringInput): StudyVisaScoringResult {
  const academic = scoreAcademic(input.academicLevel);
  const grades = scoreGrades(input.gradeLevel);
  const language = scoreLanguage(input.languageLevel);
  const admission = scoreAdmission(input.admissionStatus);
  const financial = scoreFinancial(input.financialCapacity);
  const returnTies = scoreReturnTies(input.returnTies);

  const total = academic + grades + language + admission + financial + returnTies;

  let eligibilityStatus: StudyVisaScoringResult["eligibilityStatus"];
  let statusLabel: string;
  let recommendationText: string;

  if (total >= 80) {
    eligibilityStatus = "tres_favorable";
    statusLabel = "✅✅✅ Profil très favorable";
    recommendationText = "Votre profil réunit les éléments généralement recherchés pour une demande de visa étudiant solide. Nous pouvons démarrer la constitution de votre dossier rapidement.";
  } else if (total >= 65) {
    eligibilityStatus = "favorable";
    statusLabel = "✅✅ Profil favorable";
    recommendationText = "Votre profil est globalement solide. Quelques points peuvent encore être renforcés (langue, preuve de financement) pour maximiser vos chances.";
  } else if (total >= 45) {
    eligibilityStatus = "a_renforcer";
    statusLabel = "🟡 Profil à renforcer";
    recommendationText = "Certains critères clés méritent d'être consolidés avant le dépôt — notamment le niveau de langue ou la preuve de ressources financières. Nous pouvons vous accompagner pour les renforcer.";
  } else {
    eligibilityStatus = "risque_eleve";
    statusLabel = "🔴 Risque de refus élevé en l'état";
    recommendationText = "En l'état, plusieurs critères déterminants sont faibles. Un accompagnement rapproché est recommandé avant tout dépôt pour identifier une stratégie réaliste (autre destination, préparation supplémentaire).";
  }

  return {
    scoreAcademic: academic,
    scoreGrades: grades,
    scoreLanguage: language,
    scoreAdmission: admission,
    scoreFinancial: financial,
    scoreReturnTies: returnTies,
    scoreTotal: total,
    eligibilityStatus,
    statusLabel,
    recommendationText,
  };
}
