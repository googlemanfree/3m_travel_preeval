/**
 * Moteur de scoring pour visas d'études
 * Évalue l'éligibilité basée sur : dossier académique, financier, linguistique, expérience
 * Intègre les vraies procédures institutionnelles : Campus France, uni-assist, NAWA, IRCC
 */

export interface StudyVisaEvaluationInput {
  // Informations académiques
  highestDegree: "bac" | "licence" | "master" | "doctorat";
  gpa?: number; // 0-4 ou 0-20
  testScores?: {
    toefl?: number; // 0-120
    ielts?: number; // 0-9
    delf?: string; // A2, B1, B2, C1, C2
    toeic?: number; // 0-990
    dalf?: string; // C1, C2
    testdaf?: number; // 0-300
    dsh?: number; // 0-100
  };
  yearsOfExperience: number;
  fieldOfStudy: string;
  targetCountry: "france" | "canada" | "belgique" | "suisse" | "allemagne" | "pays-bas" | "royaume-uni";
  targetProgram: string;

  // Informations financières
  annualIncome?: number; // en USD
  savingsAmount?: number; // en USD
  sponsorshipAvailable: boolean;
  familySupport: boolean;

  // Informations personnelles
  age: number;
  workExperience?: string;
  previousStudyAbroad?: boolean;
  languageProficiency: "debutant" | "intermediaire" | "avance" | "bilingue";
}

export interface StudyVisaScore {
  totalScore: number; // 0-100
  verdict: "tres_eligible" | "eligible" | "moderement_eligible" | "peu_eligible";
  breakdown: {
    academic: number;
    financial: number;
    linguistic: number;
    experience: number;
  };
  recommendations: string[];
  alternatives: string[];
  requiredDocuments: string[];
  institutionalProcedure: InstitutionalProcedure;
  estimatedTimeline: string;
  estimatedCost: number; // en USD
}

export interface InstitutionalProcedure {
  country: string;
  institution: string;
  steps: ProcedureStep[];
  timeline: string;
  website: string;
}

export interface ProcedureStep {
  order: number;
  name: string;
  description: string;
  duration: string;
  documents: string[];
}

export function calculateStudyVisaScore(input: StudyVisaEvaluationInput): StudyVisaScore {
  let academicScore = 0;
  let financialScore = 0;
  let linguisticScore = 0;
  let experienceScore = 0;

  // ===== SCORE ACADÉMIQUE (0-30) =====
  const degreeScores: Record<string, number> = {
    bac: 10,
    licence: 20,
    master: 25,
    doctorat: 30,
  };
  academicScore += degreeScores[input.highestDegree] || 10;

  // GPA/Note
  if (input.gpa) {
    if (input.gpa >= 3.5 || input.gpa >= 16) academicScore += 8;
    else if (input.gpa >= 3.0 || input.gpa >= 14) academicScore += 5;
    else if (input.gpa >= 2.5 || input.gpa >= 12) academicScore += 2;
  }

  // ===== SCORE LINGUISTIQUE (0-25) =====
  let hasEnglish = false;
  let hasFrench = false;
  let hasGerman = false;

  if (input.testScores?.toefl) {
    hasEnglish = true;
    if (input.testScores.toefl >= 100) linguisticScore += 12;
    else if (input.testScores.toefl >= 80) linguisticScore += 8;
    else if (input.testScores.toefl >= 60) linguisticScore += 4;
  }

  if (input.testScores?.ielts) {
    hasEnglish = true;
    if (input.testScores.ielts >= 7) linguisticScore += 12;
    else if (input.testScores.ielts >= 6) linguisticScore += 8;
    else if (input.testScores.ielts >= 5) linguisticScore += 4;
  }

  if (input.testScores?.delf || input.testScores?.dalf) {
    hasFrench = true;
    const level = input.testScores.dalf || input.testScores.delf;
    if (level === "C2" || level === "C1") linguisticScore += 12;
    else if (level === "B2") linguisticScore += 8;
    else if (level === "B1") linguisticScore += 4;
  }

  if (input.testScores?.testdaf || input.testScores?.dsh) {
    hasGerman = true;
    const score = input.testScores.testdaf || input.testScores.dsh || 0;
    if (score >= 250 || score >= 80) linguisticScore += 12;
    else if (score >= 180 || score >= 60) linguisticScore += 8;
    else if (score >= 120 || score >= 40) linguisticScore += 4;
  }

  // Score de proficiency général
  const proficiencyScores: Record<string, number> = {
    debutant: 2,
    intermediaire: 8,
    avance: 15,
    bilingue: 25,
  };
  linguisticScore = Math.max(linguisticScore, proficiencyScores[input.languageProficiency] || 0);

  // ===== SCORE FINANCIER (0-25) =====
  if (input.sponsorshipAvailable) financialScore += 15;
  if (input.familySupport) financialScore += 5;

  if (input.annualIncome) {
    if (input.annualIncome >= 50000) financialScore += 8;
    else if (input.annualIncome >= 30000) financialScore += 5;
    else if (input.annualIncome >= 15000) financialScore += 2;
  }

  if (input.savingsAmount) {
    if (input.savingsAmount >= 50000) financialScore += 7;
    else if (input.savingsAmount >= 25000) financialScore += 4;
    else if (input.savingsAmount >= 10000) financialScore += 2;
  }

  // ===== SCORE EXPÉRIENCE (0-20) =====
  if (input.yearsOfExperience > 0) {
    if (input.yearsOfExperience >= 5) experienceScore += 12;
    else if (input.yearsOfExperience >= 2) experienceScore += 8;
    else if (input.yearsOfExperience >= 1) experienceScore += 4;
  }

  if (input.previousStudyAbroad) experienceScore += 5;
  if (input.age >= 18 && input.age <= 30) experienceScore += 3;

  // ===== CALCUL TOTAL =====
  const totalScore = Math.min(100, academicScore + financialScore + linguisticScore + experienceScore);

  // ===== VERDICT =====
  let verdict: "tres_eligible" | "eligible" | "moderement_eligible" | "peu_eligible";
  if (totalScore >= 80) verdict = "tres_eligible";
  else if (totalScore >= 65) verdict = "eligible";
  else if (totalScore >= 50) verdict = "moderement_eligible";
  else verdict = "peu_eligible";

  // ===== RECOMMANDATIONS =====
  const recommendations: string[] = [];
  const alternatives: string[] = [];

  if (academicScore < 15) {
    recommendations.push("Renforcer votre dossier académique avec des cours supplémentaires ou certifications");
    alternatives.push("Considérer des programmes de fondation ou diplôme préparatoire");
  }

  if (linguisticScore < 10) {
    recommendations.push("Améliorer votre niveau de langue avec des cours intensifs");
    alternatives.push("Chercher des programmes enseignés en anglais ou dans votre langue maternelle");
  }

  if (financialScore < 10) {
    recommendations.push("Explorer les bourses d'études et financements disponibles");
    alternatives.push("Considérer des pays avec coûts de vie plus bas");
  }

  // ===== DOCUMENTS REQUIS PAR PAYS =====
  const requiredDocuments = getRequiredDocuments(input.targetCountry);

  // ===== PROCÉDURE INSTITUTIONNELLE =====
  const institutionalProcedure = getInstitutionalProcedure(input.targetCountry);

  // ===== TIMELINE ET COÛTS =====
  const timelineAndCost = getTimelineAndCost(input.targetCountry);

  return {
    totalScore: Math.round(totalScore),
    verdict,
    breakdown: {
      academic: Math.min(30, academicScore),
      financial: Math.min(25, financialScore),
      linguistic: Math.min(25, linguisticScore),
      experience: Math.min(20, experienceScore),
    },
    recommendations,
    alternatives,
    requiredDocuments,
    institutionalProcedure,
    estimatedTimeline: timelineAndCost.timeline,
    estimatedCost: timelineAndCost.cost,
  };
}

function getRequiredDocuments(country: string): string[] {
  const documents: Record<string, string[]> = {
    france: [
      "Diplôme du baccalauréat (apostillé)",
      "Relevés de notes (apostillés)",
      "Lettre de motivation",
      "Lettre de recommandation académique",
      "Preuve de niveau de français (DELF B2 minimum)",
      "Passeport valide",
      "Preuve financière (relevé bancaire, lettre de bourse)",
      "Certificat de couverture sociale",
      "Dossier Campus France (si applicable)",
    ],
    canada: [
      "Diplômes et relevés de notes (traduits en anglais/français)",
      "Preuve de compétence linguistique (IELTS/TOEFL)",
      "Lettre d'acceptation de l'établissement",
      "Preuve financière (relevé bancaire, lettre de parrainage)",
      "Passeport valide",
      "Certificat médical (si demandé)",
      "Vérification antécédents judiciaires",
      "Lettre d'intention personnelle",
      "Preuve de lien avec le Canada (si applicable)",
    ],
    belgique: [
      "Diplôme du baccalauréat (apostillé)",
      "Relevés de notes (apostillés)",
      "Preuve de niveau de langue",
      "Lettre de motivation",
      "Passeport valide",
      "Preuve financière",
      "Certificat de couverture sociale",
    ],
    suisse: [
      "Diplômes et relevés de notes",
      "Preuve de compétence linguistique",
      "Lettre d'acceptation",
      "Preuve financière",
      "Passeport valide",
      "Assurance maladie suisse",
    ],
    allemagne: [
      "Diplôme du baccalauréat (apostillé)",
      "Relevés de notes (apostillés)",
      "Preuve de niveau d'allemand (TestDaF, DSH)",
      "Lettre de motivation",
      "Passeport valide",
      "Preuve financière",
      "Dossier uni-assist (si applicable)",
    ],
    "pays-bas": [
      "Diplômes et relevés de notes",
      "Preuve de compétence linguistique (anglais/néerlandais)",
      "Lettre de motivation",
      "Passeport valide",
      "Preuve financière",
    ],
    "royaume-uni": [
      "Diplômes et relevés de notes",
      "Preuve IELTS (minimum 6.5)",
      "Lettre de motivation",
      "Lettre de recommandation",
      "Passeport valide",
      "Preuve financière",
      "Certificat de couverture médicale",
    ],
  };

  return documents[country] || [];
}

function getInstitutionalProcedure(country: string): InstitutionalProcedure {
  const procedures: Record<string, InstitutionalProcedure> = {
    france: {
      country: "France",
      institution: "Campus France",
      website: "https://www.campusfrance.org",
      timeline: "3-6 mois",
      steps: [
        {
          order: 1,
          name: "Création du dossier Campus France",
          description: "Inscrivez-vous sur la plateforme Campus France et créez votre dossier",
          duration: "1 semaine",
          documents: ["Passeport", "Diplômes"],
        },
        {
          order: 2,
          name: "Candidature aux établissements",
          description: "Postulez directement auprès des universités françaises",
          duration: "2-4 semaines",
          documents: ["Dossier académique complet", "Lettre de motivation"],
        },
        {
          order: 3,
          name: "Entretien Campus France",
          description: "Entretien obligatoire pour évaluer votre projet d'études",
          duration: "1 semaine",
          documents: ["Lettre d'acceptation", "Preuve financière"],
        },
        {
          order: 4,
          name: "Demande de visa",
          description: "Déposez votre demande de visa auprès du consulat français",
          duration: "2-4 semaines",
          documents: ["Tous les documents requis", "Preuve d'entretien réussi"],
        },
      ],
    },
    canada: {
      country: "Canada",
      institution: "IRCC (Immigration, Refugees and Citizenship Canada)",
      website: "https://www.canada.ca/en/immigration-refugees-citizenship.html",
      timeline: "4-8 semaines",
      steps: [
        {
          order: 1,
          name: "Obtenir une lettre d'acceptation",
          description: "Recevez une lettre d'acceptation d'un établissement d'enseignement désigné (DLI)",
          duration: "Variable",
          documents: ["Dossier académique", "Preuve financière"],
        },
        {
          order: 2,
          name: "Demande de permis d'études en ligne",
          description: "Soumettez votre demande via le portail IRCC",
          duration: "1 semaine",
          documents: ["Lettre d'acceptation", "Passeport", "Preuve financière"],
        },
        {
          order: 3,
          name: "Examen médical (si demandé)",
          description: "Effectuez un examen médical auprès d'un médecin désigné",
          duration: "1-2 semaines",
          documents: ["Formulaire médical IRCC"],
        },
        {
          order: 4,
          name: "Décision et permis d'études",
          description: "Recevez votre permis d'études approuvé",
          duration: "2-4 semaines",
          documents: ["Tous les documents soumis"],
        },
      ],
    },
    allemagne: {
      country: "Allemagne",
      institution: "uni-assist",
      website: "https://www.uni-assist.de",
      timeline: "2-4 mois",
      steps: [
        {
          order: 1,
          name: "Enregistrement uni-assist",
          description: "Créez un compte et enregistrez-vous sur la plateforme uni-assist",
          duration: "1 semaine",
          documents: ["Passeport", "Diplômes"],
        },
        {
          order: 2,
          name: "Candidature aux universités",
          description: "Postulez via uni-assist aux universités allemandes",
          duration: "2-4 semaines",
          documents: ["Dossier académique", "Preuve de langue (TestDaF/DSH)"],
        },
        {
          order: 3,
          name: "Évaluation uni-assist",
          description: "uni-assist évalue votre dossier et le transmet aux universités",
          duration: "2-4 semaines",
          documents: ["Tous les documents soumis"],
        },
        {
          order: 4,
          name: "Demande de visa",
          description: "Déposez votre demande de visa auprès de l'ambassade allemande",
          duration: "2-4 semaines",
          documents: ["Lettre d'acceptation", "Preuve financière"],
        },
      ],
    },
    belgique: {
      country: "Belgique",
      institution: "Ministère de l'Enseignement Supérieur",
      website: "https://www.studyinbelgium.be",
      timeline: "2-4 mois",
      steps: [
        {
          order: 1,
          name: "Candidature directe",
          description: "Postulez directement auprès des universités belges",
          duration: "2-4 semaines",
          documents: ["Dossier académique", "Lettre de motivation"],
        },
        {
          order: 2,
          name: "Lettre d'acceptation",
          description: "Recevez votre lettre d'acceptation de l'université",
          duration: "2-4 semaines",
          documents: ["Tous les documents soumis"],
        },
        {
          order: 3,
          name: "Demande de visa",
          description: "Déposez votre demande de visa auprès de l'ambassade belge",
          duration: "2-4 semaines",
          documents: ["Lettre d'acceptation", "Preuve financière"],
        },
      ],
    },
    suisse: {
      country: "Suisse",
      institution: "Secrétariat d'État aux migrations (SEM)",
      website: "https://www.sem.admin.ch",
      timeline: "3-6 mois",
      steps: [
        {
          order: 1,
          name: "Candidature universitaire",
          description: "Postulez auprès des universités suisses",
          duration: "2-4 semaines",
          documents: ["Dossier académique"],
        },
        {
          order: 2,
          name: "Lettre d'acceptation",
          description: "Recevez votre lettre d'acceptation",
          duration: "2-4 semaines",
          documents: ["Tous les documents soumis"],
        },
        {
          order: 3,
          name: "Demande de permis",
          description: "L'université demande le permis auprès du SEM",
          duration: "2-4 semaines",
          documents: ["Lettre d'acceptation", "Preuve financière"],
        },
      ],
    },
    "pays-bas": {
      country: "Pays-Bas",
      institution: "Ministère de l'Éducation",
      website: "https://www.studyinholland.nl",
      timeline: "2-3 mois",
      steps: [
        {
          order: 1,
          name: "Candidature universitaire",
          description: "Postulez auprès des universités néerlandaises",
          duration: "2-4 semaines",
          documents: ["Dossier académique"],
        },
        {
          order: 2,
          name: "Lettre d'acceptation",
          description: "Recevez votre lettre d'acceptation",
          duration: "2-4 semaines",
          documents: ["Tous les documents soumis"],
        },
        {
          order: 3,
          name: "Demande de visa",
          description: "Déposez votre demande de visa auprès de l'ambassade néerlandaise",
          duration: "2-4 semaines",
          documents: ["Lettre d'acceptation", "Preuve financière"],
        },
      ],
    },
    "royaume-uni": {
      country: "Royaume-Uni",
      institution: "UKVI (UK Visas and Immigration)",
      website: "https://www.gov.uk/study-uk",
      timeline: "3-6 mois",
      steps: [
        {
          order: 1,
          name: "Candidature universitaire",
          description: "Postulez via UCAS ou directement auprès des universités",
          duration: "2-4 semaines",
          documents: ["Dossier académique", "Preuve IELTS"],
        },
        {
          order: 2,
          name: "Lettre d'acceptation (CAS)",
          description: "Recevez votre Confirmation of Acceptance for Studies (CAS)",
          duration: "2-4 semaines",
          documents: ["Tous les documents soumis"],
        },
        {
          order: 3,
          name: "Demande de visa étudiant",
          description: "Déposez votre demande de visa étudiant auprès de UKVI",
          duration: "2-4 semaines",
          documents: ["CAS", "Preuve financière", "Passeport"],
        },
      ],
    },
  };

  return procedures[country] || {
    country: "Non spécifié",
    institution: "Consulat local",
    website: "",
    timeline: "Variable",
    steps: [],
  };
}

function getTimelineAndCost(country: string): { timeline: string; cost: number } {
  const data: Record<string, { timeline: string; cost: number }> = {
    france: {
      timeline: "3-6 mois (via Campus France ou procédure directe)",
      cost: 3000,
    },
    canada: {
      timeline: "4-8 semaines (traitement du permis d'études)",
      cost: 5000,
    },
    belgique: {
      timeline: "2-4 mois",
      cost: 2500,
    },
    suisse: {
      timeline: "3-6 mois",
      cost: 4000,
    },
    allemagne: {
      timeline: "2-4 mois (via uni-assist)",
      cost: 2000,
    },
    "pays-bas": {
      timeline: "2-3 mois",
      cost: 3000,
    },
    "royaume-uni": {
      timeline: "3-6 mois",
      cost: 4500,
    },
  };

  return data[country] || { timeline: "Variable", cost: 3000 };
}
