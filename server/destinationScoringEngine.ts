/**
 * Moteur de scoring d'admissibilité par destination.
 *
 * Le score est calculé par une grille fixe et vérifiable. L'IA peut ensuite
 * rédiger un rapport explicatif autour du score, mais n'invente pas le score.
 */

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
}

export interface DestinationScoringResult {
  scoreTotal: number;
  strategyType: "direct" | "passerelle_europeenne";
  statusLabel: string;
  legalContext: string;
  recommendedPath: string;
  documentChecklist: string[];
  breakdown: { label: string; points: number; max: number }[];
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

export function computeDestinationScore(input: ScoringInput): DestinationScoringResult {
  const country = (input.destinationCountry || "").toLowerCase();
  const isLuxembourgLike = LUXEMBOURG_LIKE.some((c) => country.includes(c));

  const eduPts = scoreEducation(input.educationLevel);
  const expPts = scoreExperience(input.yearsOfExperience);
  const langPts = Math.max(scoreLanguage(input.frenchLevel), scoreLanguage(input.englishLevel) * 0.8);
  const negRefusal = input.priorVisaRefusal ? -10 : 0;
  const negCriminal = input.criminalRecord ? -25 : 0;
  const posFamily = input.familyAbroad ? 5 : 0;
  const sector = identifySector(input.currentJobTitle, input.industrySector);

  const documentChecklist = [
    "Passeport valide (au moins 6 mois)",
    "Diplômes et relevés de notes légalisés au MINREX",
    "Casier judiciaire Bulletin n°3 (moins de 3 mois), légalisé au MINREX",
    "Certificats de travail légalisés au MINREX",
    "CV à jour en français et/ou anglais",
  ];

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
    };
  }

  const rawScore = Math.round(eduPts + expPts + langPts) + negRefusal + negCriminal + posFamily;
  const scoreTotal = Math.max(0, Math.min(100, rawScore + 30));

  let statusLabel: string;
  if (scoreTotal >= 80) statusLabel = "✅✅✅ Profil très favorable";
  else if (scoreTotal >= 60) statusLabel = "✅✅ Profil favorable";
  else if (scoreTotal >= 40) statusLabel = "🟡 Profil à renforcer";
  else statusLabel = "🔴 Profil fragile en l'état";

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
  };
}
