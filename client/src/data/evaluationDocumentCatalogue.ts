export type EvaluationProjectType = "travail" | "etudes" | "tourisme";

export type EvaluationDocumentRequirement = {
  category: "Identité" | "Profil" | "Études" | "Financier" | "Projet" | "Voyage";
  label: string;
  detail: string;
  priority: "à préparer" | "selon le cas";
};

const CORE_REQUIREMENTS: EvaluationDocumentRequirement[] = [
  { category: "Identité", label: "Passeport en cours de validité", detail: "Page d’identité lisible ; la durée minimale dépend du pays.", priority: "à préparer" },
  { category: "Identité", label: "Photo d’identité récente", detail: "Format et dimensions à confirmer lors du dépôt officiel.", priority: "selon le cas" },
  { category: "Projet", label: "Coordonnées et résumé du projet", detail: "Conservez un résumé cohérent de votre destination et de votre objectif.", priority: "à préparer" },
];

const PROJECT_REQUIREMENTS: Record<EvaluationProjectType, EvaluationDocumentRequirement[]> = {
  travail: [
    { category: "Profil", label: "CV à jour", detail: "Inclure expériences, compétences, dates et coordonnées professionnelles.", priority: "à préparer" },
    { category: "Profil", label: "Diplômes et attestations", detail: "Préparer les copies lisibles et, si nécessaire, leurs traductions.", priority: "selon le cas" },
    { category: "Profil", label: "Justificatifs d’expérience", detail: "Attestations d’emploi, certificats de travail ou références.", priority: "selon le cas" },
  ],
  etudes: [
    { category: "Études", label: "Diplômes et relevés de notes", detail: "Préparer les copies complètes du dernier niveau obtenu.", priority: "à préparer" },
    { category: "Études", label: "Lettre d’admission ou preuve de candidature", detail: "Selon l’avancement auprès de l’établissement.", priority: "selon le cas" },
    { category: "Financier", label: "Preuve de financement", detail: "Épargne, garant, bourse ou autre source à documenter.", priority: "à préparer" },
  ],
  tourisme: [
    { category: "Voyage", label: "Itinéraire et motif de séjour", detail: "Préparer un calendrier réaliste et les éléments qui expliquent le voyage.", priority: "à préparer" },
    { category: "Financier", label: "Justificatifs de ressources", detail: "Les montants et formats dépendent de la procédure visée.", priority: "selon le cas" },
    { category: "Voyage", label: "Justificatifs d’attaches", detail: "Emploi, études, famille ou obligations dans le pays de résidence.", priority: "selon le cas" },
  ],
};

const COUNTRY_REQUIREMENTS: Partial<Record<string, Partial<Record<EvaluationProjectType, EvaluationDocumentRequirement[]>>>> = {
  Canada: {
    travail: [
      { category: "Projet", label: "Offre ou perspective professionnelle", detail: "À fournir uniquement si disponible ; aucune offre n’est garantie par 3M Travel.", priority: "selon le cas" },
      { category: "Profil", label: "Résultats linguistiques", detail: "Tests ou niveaux de français/anglais si déjà disponibles.", priority: "selon le cas" },
    ],
    etudes: [
      { category: "Études", label: "Lettre d’acceptation de l’établissement", detail: "Document demandé au moment approprié de la procédure.", priority: "à préparer" },
      { category: "Projet", label: "Projet d’études", detail: "Objectifs académiques cohérents avec le parcours et la destination.", priority: "selon le cas" },
    ],
    tourisme: [
      { category: "Voyage", label: "Historique de voyages et motif détaillé", detail: "Préparer les éléments permettant d’expliquer le séjour envisagé.", priority: "selon le cas" },
    ],
  },
  Luxembourg: {
    travail: [
      { category: "Projet", label: "Éléments liés à l’employeur", detail: "Le besoin d’une offre, d’une autorisation ou d’une validation dépend de la procédure à confirmer.", priority: "selon le cas" },
      { category: "Profil", label: "CV et qualifications ciblées", detail: "Mettre en évidence les compétences correspondant au poste recherché.", priority: "à préparer" },
    ],
    etudes: [
      { category: "Études", label: "Admission et parcours académique", detail: "Préparer la preuve d’admission et les documents académiques pertinents.", priority: "à préparer" },
    ],
  },
  France: {
    travail: [
      { category: "Projet", label: "Éléments liés à l’emploi visé", detail: "Contrat, promesse d’embauche ou éléments de candidature uniquement s’ils sont déjà disponibles.", priority: "selon le cas" },
      { category: "Profil", label: "CV et justificatifs de qualification", detail: "Préparer un CV à jour, diplômes et preuves d’expérience correspondant au métier envisagé.", priority: "à préparer" },
    ],
    etudes: [
      { category: "Études", label: "Admission ou preuve de candidature", detail: "Préparer les éléments académiques et toute admission déjà obtenue.", priority: "selon le cas" },
      { category: "Financier", label: "Plan de financement du séjour", detail: "Documenter l’origine des ressources prévues ; les critères sont confirmés selon la procédure applicable.", priority: "à préparer" },
    ],
    tourisme: [{ category: "Voyage", label: "Projet de séjour et hébergement", detail: "Préparer un itinéraire cohérent et les preuves disponibles d’hébergement ou d’invitation.", priority: "selon le cas" }],
  },
  Belgique: {
    travail: [
      { category: "Projet", label: "Éléments liés à l’employeur et à la région", detail: "La région et le statut de l’employeur peuvent modifier la procédure ; ils seront vérifiés par un conseiller.", priority: "selon le cas" },
      { category: "Profil", label: "Qualifications et expérience", detail: "Préparer CV, diplômes et attestations professionnelles lisibles.", priority: "à préparer" },
    ],
    etudes: [
      { category: "Études", label: "Admission et parcours académique", detail: "Conserver les lettres de l’établissement, diplômes et relevés pertinents.", priority: "à préparer" },
      { category: "Financier", label: "Justificatifs de financement", detail: "Préparer les éléments relatifs à l’épargne, au garant ou à une bourse.", priority: "à préparer" },
    ],
    tourisme: [{ category: "Voyage", label: "Preuves de séjour temporaire", detail: "Préparer un motif, un calendrier et les justificatifs disponibles de retour ou d’attaches.", priority: "selon le cas" }],
  },
  Allemagne: {
    travail: [
      { category: "Profil", label: "Qualifications reconnues ou à vérifier", detail: "Préparer diplômes, expérience et traduction disponible ; la reconnaissance dépend du métier et de la procédure.", priority: "selon le cas" },
      { category: "Projet", label: "Niveau de langue et projet d’emploi", detail: "Indiquer la langue maîtrisée et tout échange professionnel existant, sans présenter une offre comme acquise.", priority: "selon le cas" },
    ],
    etudes: [
      { category: "Études", label: "Admission et justificatifs académiques", detail: "Préparer les relevés, diplômes et éléments de candidature déjà disponibles.", priority: "à préparer" },
      { category: "Financier", label: "Financement du projet", detail: "Documenter la source prévue des ressources conformément aux exigences qui seront confirmées.", priority: "à préparer" },
    ],
    tourisme: [{ category: "Voyage", label: "Itinéraire, ressources et attaches", detail: "Préparer les éléments permettant d’expliquer un séjour temporaire cohérent.", priority: "selon le cas" }],
  },
};

export function getEvaluationDocumentRequirements(country: string, project: EvaluationProjectType): EvaluationDocumentRequirement[] {
  return [...CORE_REQUIREMENTS, ...PROJECT_REQUIREMENTS[project], ...(COUNTRY_REQUIREMENTS[country]?.[project] ?? [])];
}
