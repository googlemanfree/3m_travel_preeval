export type EvaluationProjectType = "travail" | "etudes" | "tourisme" | "evisa" | "immigration";

export type ProjectDetailField = {
  key: string;
  label: string;
  placeholder?: string;
  kind?: "text" | "select" | "date" | "textarea";
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
};

export type ProjectEvaluationConfig = {
  label: string;
  subtitle: string;
  objective: string;
  dossierHint: string;
  recommendedVisaTypes: string[];
  requiredDetails: ProjectDetailField[];
};

const yesNoPending = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
  { value: "en_cours", label: "En cours" },
];

export const PROJECT_EVALUATION_CONFIG: Record<EvaluationProjectType, ProjectEvaluationConfig> = {
  travail: {
    label: "Travail",
    subtitle: "Projet professionnel",
    objective: "Évaluer la cohérence entre votre expérience, votre métier, votre destination et les conditions d’accès au marché du travail.",
    dossierHint: "CV, expériences, compétences, références et éléments relatifs à une offre ou à une recherche d’emploi.",
    recommendedVisaTypes: ["schengen_travail", "autre"],
    requiredDetails: [
      { key: "targetJob", label: "Métier ou poste recherché", placeholder: "Ex. aide-soignant, développeur, soudeur", required: true },
      { key: "relevantExperience", label: "Expérience directement liée", kind: "select", required: true, options: [{ value: "0_1", label: "Moins d’un an" }, { value: "1_3", label: "1 à 3 ans" }, { value: "3_5", label: "3 à 5 ans" }, { value: "5_plus", label: "Plus de 5 ans" }] },
      { key: "employmentLead", label: "Offre ou contact employeur", kind: "select", required: true, options: yesNoPending },
      { key: "availability", label: "Disponibilité pour le départ", placeholder: "Ex. sous 3 mois", required: true },
      { key: "professionalEvidence", label: "Justificatifs professionnels disponibles", kind: "textarea", placeholder: "Contrats, attestations, références, certificats…" },
    ],
  },
  etudes: {
    label: "Études",
    subtitle: "Projet académique",
    objective: "Évaluer l’adéquation entre votre parcours, le programme visé, le financement et les conditions d’admission ou de visa étudiant.",
    dossierHint: "Passeport, diplômes, relevés, admission ou projet académique, ressources et justificatifs demandés.",
    recommendedVisaTypes: ["canada_etude", "schengen_etude", "autre"],
    requiredDetails: [
      { key: "studyLevel", label: "Niveau d’études visé", kind: "select", required: true, options: [{ value: "formation_courte", label: "Formation courte" }, { value: "licence", label: "Licence" }, { value: "master", label: "Master" }, { value: "doctorat", label: "Doctorat" }, { value: "autre", label: "Autre" }] },
      { key: "programName", label: "Programme ou filière recherchée", placeholder: "Ex. Informatique, Santé, Management", required: true },
      { key: "admissionStatus", label: "Statut d’admission", kind: "select", required: true, options: [{ value: "aucune", label: "Aucune demande encore" }, { value: "en_cours", label: "Demande en cours" }, { value: "recue", label: "Admission reçue" }] },
      { key: "fundingPlan", label: "Plan de financement", kind: "select", required: true, options: [{ value: "personnel", label: "Fonds personnels" }, { value: "famille", label: "Soutien familial" }, { value: "bourse", label: "Bourse" }, { value: "mixte", label: "Mixte" }, { value: "a_preciser", label: "À préciser" }] },
      { key: "academicRecords", label: "Documents académiques disponibles", kind: "textarea", placeholder: "Diplômes, relevés, attestations, traduction…" },
    ],
  },
  tourisme: {
    label: "Tourisme",
    subtitle: "Séjour temporaire",
    objective: "Préparer un court séjour en vérifiant le motif, le calendrier, les ressources, l’hébergement et les justificatifs de retour.",
    dossierHint: "Passeport, itinéraire, ressources, hébergement, assurance et justificatifs du motif du séjour.",
    recommendedVisaTypes: ["canada_tourisme", "schengen_tourisme", "autre"],
    requiredDetails: [
      { key: "stayPurpose", label: "Motif précis du séjour", kind: "select", required: true, options: [{ value: "tourisme", label: "Tourisme" }, { value: "visite_famille", label: "Visite familiale" }, { value: "affaires", label: "Affaires" }, { value: "evenement", label: "Évènement" }, { value: "autre", label: "Autre" }] },
      { key: "plannedDeparture", label: "Date de départ envisagée", kind: "date", required: true },
      { key: "stayLength", label: "Durée envisagée", placeholder: "Ex. 14 jours", required: true },
      { key: "accommodationPlan", label: "Hébergement prévu", kind: "select", required: true, options: [{ value: "hotel", label: "Hôtel" }, { value: "invitation", label: "Invitation / hébergement chez un proche" }, { value: "reservation", label: "Réservation en cours" }, { value: "a_preciser", label: "À préciser" }] },
      { key: "returnTies", label: "Éléments de retour dans le pays de résidence", kind: "textarea", placeholder: "Emploi, études, famille, activité professionnelle…" },
    ],
  },
  evisa: {
    label: "e‑Visa",
    subtitle: "Procédure électronique par destination",
    objective: "Vérifier l’éligibilité, la validité du passeport et les documents propres à la destination avant d’ouvrir une demande électronique.",
    dossierHint: "Passeport, photo, date de voyage, hébergement, billet ou itinéraire et pièces propres au portail officiel.",
    recommendedVisaTypes: ["autre"],
    requiredDetails: [
      { key: "passportExpiry", label: "Date d’expiration du passeport", kind: "date", required: true },
      { key: "entryCount", label: "Nombre d’entrées souhaité", kind: "select", required: true, options: [{ value: "simple", label: "Entrée simple" }, { value: "multiple", label: "Entrées multiples" }, { value: "a_confirmer", label: "À confirmer selon le portail" }] },
      { key: "plannedArrival", label: "Date d’arrivée prévue", kind: "date", required: true },
      { key: "evisaDocuments", label: "Documents déjà disponibles", kind: "textarea", required: true, placeholder: "Passeport, photo, réservation, billet, invitation…" },
      { key: "previousDestinationVisa", label: "Ancien visa ou refus pour cette destination", kind: "select", options: yesNoPending },
    ],
  },
  immigration: {
    label: "Installation",
    subtitle: "Résidence permanente ou mobilité durable",
    objective: "Comparer votre profil, vos langues, votre expérience, vos études et vos ressources avec les voies d’installation à confirmer.",
    dossierHint: "CV, diplômes, expériences, tests de langues, ressources, liens familiaux et documents justificatifs.",
    recommendedVisaTypes: ["canada_rp", "autre"],
    requiredDetails: [
      { key: "immigrationGoal", label: "Objectif d’installation", kind: "select", required: true, options: [{ value: "residence_permanente", label: "Résidence permanente" }, { value: "programme_provincial", label: "Programme provincial / régional" }, { value: "mobilite_professionnelle", label: "Mobilité professionnelle" }, { value: "regroupement", label: "Regroupement familial" }] },
      { key: "languageProof", label: "Test de langue disponible", kind: "select", required: true, options: [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }, { value: "prevu", label: "Prévu" }] },
      { key: "educationAssessment", label: "Évaluation des diplômes", kind: "select", required: true, options: [{ value: "oui", label: "Déjà obtenue" }, { value: "non", label: "Non" }, { value: "a_prevoir", label: "À prévoir" }] },
      { key: "settlementFunds", label: "Préparation financière", kind: "select", required: true, options: [{ value: "disponible", label: "Fonds disponibles" }, { value: "partielle", label: "Partiellement disponible" }, { value: "a_preparer", label: "À préparer" }] },
      { key: "familyOrOffer", label: "Offre, famille ou lien local", kind: "textarea", placeholder: "Le cas échéant, précisez les éléments disponibles." },
    ],
  },
};

export const isEvaluationProjectType = (value: string | null | undefined): value is EvaluationProjectType =>
  Boolean(value && value in PROJECT_EVALUATION_CONFIG);
