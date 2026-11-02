/**
 * Moteur de scoring d'admissibilité par destination.
 *
 * Le score est calculé par une grille fixe et vérifiable. L'IA peut ensuite
 * rédiger un rapport explicatif autour du score, mais n'invente pas le score.
 * La grille et les pièces s'adaptent au type de projet (travail / études / visiteurs).
 */

import {
  resolveEvaluationProjectKind,
  type EvaluationProjectKind,
} from "../shared/evaluationVisaCv";

export interface ScoringInput {
  destinationCategory: "schengen" | "canada" | "autre";
  destinationCountry?: string | null;
  educationLevel?: string | null;
  yearsOfExperience?: string | null;
  frenchLevel?: string | null;
  englishLevel?: string | null;
  currentJobTitle?: string | null;
  industrySector?: string | null;
  priorVisaRefusal?: boolean | null;
  criminalRecord?: boolean | null;
  familyAbroad?: boolean | null;
  /** Type de projet / visa (études, tourisme, travail, codes canada_etude…). */
  projectType?: string | null;
  visaType?: string | null;
  /** Cycle d’études déclaré (licence, master…). */
  studyCycle?: string | null;
  /** Statut visiteurs (chef_entreprise, employe, particulier). */
  visitorStatus?: string | null;
  /** Motif de visite / ressources indicatives. */
  visitReason?: string | null;
  fundingDeclared?: boolean | null;
}

export interface DestinationScoringResult {
  scoreTotal: number;
  strategyType: "direct" | "passerelle_europeenne" | "etudes" | "visite";
  statusLabel: string;
  legalContext: string;
  recommendedPath: string;
  documentChecklist: string[];
  breakdown: { label: string; points: number; max: number }[];
  projectKind: EvaluationProjectKind;
}

const LUXEMBOURG_LIKE = ["luxembourg", "suisse", "switzerland", "belgique", "belgium"];

function scoreEducation(level?: string | null): number {
  switch (level) {
    case "doctorat": return 20;
    case "master": return 18;
    case "licence": return 14;
    case "bac2": return 9;
    case "bac": return 5;
    default: return 0;
  }
}

function scoreExperience(years?: string | null): number {
  switch (years) {
    case "10+": return 20;
    case "5-10": return 16;
    case "3-5": return 11;
    case "1-3": return 6;
    case "0-1": return 2;
    default: return 0;
  }
}

function scoreLanguage(level?: string | null): number {
  switch (level) {
    case "natif": return 15;
    case "c1_c2": return 15;
    case "b2": return 10;
    case "b1": return 5;
    case "debutant": return 1;
    default: return 0;
  }
}

function scoreStudyCycle(cycle?: string | null): number {
  const value = String(cycle || "").toLowerCase();
  if (!value) return 0;
  if (/doctorat|phd|master|mba/.test(value)) return 18;
  if (/licence|bachelor|undergrad/.test(value)) return 14;
  if (/bts|dut|bac\+?2|formation.?pro|certificate/.test(value)) return 10;
  return 6;
}

function scoreVisitorStatus(status?: string | null): number {
  const value = String(status || "").toLowerCase();
  if (!value) return 4;
  if (/chef|entreprise|business|independant/.test(value)) return 16;
  if (/employe|salarie|employee/.test(value)) return 12;
  if (/particulier|retire|retraite|family/.test(value)) return 8;
  return 6;
}

function identifySector(jobTitle?: string | null, sector?: string | null): string {
  const text = `${jobTitle || ""} ${sector || ""}`.toLowerCase();
  if (/infirmi|santé|médec|aide.soignant/.test(text)) return "Santé & soins";
  if (/informatique|développeur|ingénieur logiciel|it\b|data/.test(text)) return "IT & Ingénierie logicielle";
  if (/bâtiment|btp|construction|maçon|électricien|plombier/.test(text)) return "BTP & Construction";
  if (/hôtel|restaurant|cuisine|serveur/.test(text)) return "Hôtellerie & Restauration";
  if (/transport|logistique|chauffeur/.test(text)) return "Logistique & Transport";
  if (/comptab|finance|audit/.test(text)) return "Comptabilité & Finance";
  return "Secteur à préciser lors de l'entretien de suivi";
}

function workChecklist(): string[] {
  return [
    "Passeport valide (au moins 6 mois)",
    "Diplômes et relevés de notes légalisés au MINREX",
    "Casier judiciaire Bulletin n°3 (moins de 3 mois), légalisé au MINREX",
    "Certificats de travail légalisés au MINREX",
    "CV à jour en français et/ou anglais",
  ];
}

function studiesChecklist(): string[] {
  return [
    "Passeport valide (au moins 6 mois)",
    "Diplômes et relevés de notes (légalisés si requis)",
    "Preuve du cycle / filière visés",
    "Plan de financement / preuves de ressources",
    "Lettre de motivation ou pré-admission si disponible",
    "Casier judiciaire Bulletin n°3 (moins de 3 mois) si exigé",
  ];
}

function visitorChecklist(): string[] {
  return [
    "Passeport valide (au moins 6 mois)",
    "Justificatif de statut (activité, emploi ou situation personnelle)",
    "Motif et programme / itinéraire du séjour",
    "Preuves d’hébergement",
    "Preuves de fonds pour la durée du séjour",
    "Preuves d’attaches / intention de retour",
  ];
}

function computeStudiesScore(input: ScoringInput, country: string): DestinationScoringResult {
  const eduPts = scoreEducation(input.educationLevel);
  const cyclePts = scoreStudyCycle(input.studyCycle);
  const langPts = Math.max(scoreLanguage(input.frenchLevel), scoreLanguage(input.englishLevel) * 0.8);
  const fundingPts = input.fundingDeclared === true ? 15 : input.fundingDeclared === false ? 4 : 8;
  const negRefusal = input.priorVisaRefusal ? -10 : 0;
  const negCriminal = input.criminalRecord ? -20 : 0;
  const rawScore = Math.round(eduPts + cyclePts + langPts + fundingPts) + negRefusal + negCriminal;
  const scoreTotal = Math.max(0, Math.min(100, rawScore));

  let statusLabel: string;
  if (scoreTotal >= 80) statusLabel = "✅✅✅ Projet d’études très favorable";
  else if (scoreTotal >= 60) statusLabel = "✅✅ Projet d’études favorable";
  else if (scoreTotal >= 40) statusLabel = "🟡 Projet d’études à renforcer";
  else statusLabel = "🔴 Projet d’études fragile en l’état";

  return {
    scoreTotal,
    strategyType: "etudes",
    statusLabel,
    legalContext: `Pour ${input.destinationCountry || "cette destination"}, l’évaluation études porte sur le parcours académique, le cycle visé, la langue d’enseignement et le financement. L’admission et l’octroi du visa restent la compétence de l’établissement et des autorités.`,
    recommendedPath: `Priorité : consolider diplômes, relevés, cycle${input.studyCycle ? ` (${input.studyCycle})` : ""} et preuves de financement pour ${country || "la destination ciblée"}. Pas de critère d’emploi ni de CV professionnel pour ce type de projet.`,
    documentChecklist: studiesChecklist(),
    breakdown: [
      { label: "Formation académique", points: eduPts, max: 20 },
      { label: "Cycle / projet d’études", points: cyclePts, max: 18 },
      { label: "Langue d’études", points: Math.round(langPts), max: 15 },
      { label: "Financement indicatif", points: fundingPts, max: 15 },
      { label: "Antécédents", points: negRefusal + negCriminal, max: 0 },
    ],
    projectKind: "etudes",
  };
}

function computeVisitorScore(input: ScoringInput, country: string): DestinationScoringResult {
  const statusPts = scoreVisitorStatus(input.visitorStatus);
  const reasonPts = String(input.visitReason || "").trim().length >= 12 ? 14 : String(input.visitReason || "").trim() ? 8 : 3;
  const langPts = Math.max(scoreLanguage(input.frenchLevel), scoreLanguage(input.englishLevel) * 0.8);
  const tiesPts = input.familyAbroad ? 6 : 10; // attaches : famille à l’étranger n’est pas un atout visiteurs ; on favorise l’intention de retour
  const fundingPts = input.fundingDeclared === true ? 16 : input.fundingDeclared === false ? 4 : 9;
  const negRefusal = input.priorVisaRefusal ? -12 : 0;
  const negCriminal = input.criminalRecord ? -25 : 0;
  const rawScore = Math.round(statusPts + reasonPts + langPts * 0.6 + tiesPts + fundingPts) + negRefusal + negCriminal;
  const scoreTotal = Math.max(0, Math.min(100, rawScore));

  let statusLabel: string;
  if (scoreTotal >= 80) statusLabel = "✅✅✅ Projet de visite très cohérent";
  else if (scoreTotal >= 60) statusLabel = "✅✅ Projet de visite cohérent";
  else if (scoreTotal >= 40) statusLabel = "🟡 Projet de visite à renforcer";
  else statusLabel = "🔴 Projet de visite fragile en l’état";

  return {
    scoreTotal,
    strategyType: "visite",
    statusLabel,
    legalContext: `Pour ${input.destinationCountry || "cette destination"}, l’évaluation visiteurs porte sur le statut déclaré, le motif du séjour, les ressources et les attaches au pays de résidence. L’octroi du visa reste la compétence souveraine des autorités.`,
    recommendedPath: `Priorité : documenter le statut, le motif${input.visitReason ? ` (« ${String(input.visitReason).slice(0, 80)} »)` : ""}, l’itinéraire et les preuves d’attaches / de fonds pour ${country || "la destination ciblée"}. Aucun CV professionnel n’est exigé pour ce type de projet.`,
    documentChecklist: visitorChecklist(),
    breakdown: [
      { label: "Statut déclaré", points: statusPts, max: 16 },
      { label: "Motif / cohérence du séjour", points: reasonPts, max: 14 },
      { label: "Autonomie linguistique", points: Math.round(langPts * 0.6), max: 9 },
      { label: "Attaches / intention de retour", points: tiesPts, max: 10 },
      { label: "Ressources de voyage", points: fundingPts, max: 16 },
      { label: "Antécédents", points: negRefusal + negCriminal, max: 0 },
    ],
    projectKind: "tourisme",
  };
}

export function computeDestinationScore(input: ScoringInput): DestinationScoringResult {
  const country = (input.destinationCountry || "").toLowerCase();
  const isLuxembourgLike = LUXEMBOURG_LIKE.some((c) => country.includes(c));
  const projectKind = resolveEvaluationProjectKind(input.projectType, input.visaType);

  if (projectKind === "etudes") {
    return computeStudiesScore(input, country);
  }
  if (projectKind === "tourisme") {
    return computeVisitorScore(input, country);
  }

  const eduPts = scoreEducation(input.educationLevel);
  const expPts = scoreExperience(input.yearsOfExperience);
  const langPts = Math.max(scoreLanguage(input.frenchLevel), scoreLanguage(input.englishLevel) * 0.8);
  const negRefusal = input.priorVisaRefusal ? -10 : 0;
  const negCriminal = input.criminalRecord ? -25 : 0;
  const posFamily = input.familyAbroad ? 5 : 0;
  const sector = identifySector(input.currentJobTitle, input.industrySector);
  const documentChecklist = workChecklist();

  // Destinations "luxembourg-like" : passerelle travail (études / visiteurs déjà retournés plus haut).
  if (isLuxembourgLike) {
    const rawScore = Math.round(eduPts + expPts + langPts) + negRefusal + negCriminal + posFamily;
    const cappedScore = Math.min(rawScore, 50);

    return {
      scoreTotal: Math.max(0, cappedScore),
      strategyType: "passerelle_europeenne",
      statusLabel: "🟡 Voie directe limitée — Stratégie alternative recommandée",
      legalContext: `Pour ${input.destinationCountry || "cette destination"}, la loi impose un test de marché du travail (ADEM au Luxembourg et équivalents ailleurs) : l'employeur doit prouver l'absence de candidat disponible dans l'Espace Économique Européen avant tout recrutement hors-UE. Sans employeur déjà identifié acceptant cette démarche, la voie directe reste difficile, quel que soit votre profil.`,
      recommendedPath: `Stratégie Passerelle Européenne : la Pologne délivre plus largement des permis de travail Voïvode à des candidats non-UE, donnant accès à un visa National Type D et à un titre de séjour européen (Karta Pobytu). Ce statut facilite ensuite la mobilité au sein de l'espace Schengen. C'est une voie d'entrée alternative, pas une garantie de résultat.`,
      documentChecklist,
      breakdown: [
        { label: "Formation académique", points: eduPts, max: 20 },
        { label: "Expérience professionnelle", points: expPts, max: 20 },
        { label: "Compétences linguistiques", points: Math.round(langPts), max: 15 },
        { label: "Antécédents / liens familiaux", points: negRefusal + negCriminal + posFamily, max: 5 },
      ],
      projectKind,
    };
  }

  const rawScore = Math.round(eduPts + expPts + langPts) + negRefusal + negCriminal + posFamily;
  const scoreTotal = Math.max(0, Math.min(100, rawScore + 30));

  let statusLabel: string;
  if (scoreTotal >= 80) statusLabel = "✅✅✅ Profil très favorable";
  else if (scoreTotal >= 60) statusLabel = "✅✅ Profil favorable";
  else if (scoreTotal >= 40) statusLabel = "🟡 Profil à renforcer";
  else statusLabel = "🔴 Profil fragile en l’état";

  return {
    scoreTotal,
    strategyType: "direct",
    statusLabel,
    legalContext: `Pour ${input.destinationCountry || "cette destination"}, la procédure suit une évaluation directe de votre profil (formation, expérience, langue) sans verrou structurel équivalent au test de marché du travail européen.`,
    recommendedPath: `Secteur identifié : ${sector}. La suite recommandée est la constitution du dossier avec les pièces légalisées ci-dessous, en parallèle de la recherche d'un employeur ou d'un établissement selon votre projet.`,
    documentChecklist,
    breakdown: [
      { label: "Formation académique", points: eduPts, max: 20 },
      { label: "Expérience professionnelle", points: expPts, max: 20 },
      { label: "Compétences linguistiques", points: Math.round(langPts), max: 15 },
      { label: "Antécédents / liens familiaux", points: negRefusal + negCriminal + posFamily, max: 5 },
    ],
    projectKind,
  };
}
