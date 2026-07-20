/**
 * Données génériques pour les types de visa, destinations et procédures
 * Utilisées par les pages Types de Visa, Destinations et Guide
 */

export interface VisaType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  eligibility: string[];
  documents: string[];
  processingTime: string;
  cost: string;
  advantages: string[];
}

export interface Destination {
  id: string;
  name: string;
  continent: string;
  flag: string;
  description: string;
  visaTypes: string[]; // IDs des types de visa disponibles
  specialRequirements?: string[];
  bestFor: string;
  climate: string;
  language: string;
  currency: string;
  costOfLiving: string;
}

export interface ProcedureStep {
  step: number;
  title: string;
  description: string;
  duration: string;
  documents: string[];
  tips: string[];
}

// ─── TYPES DE VISA ───────────────────────────────────────────────────────────

export const VISA_TYPES: Record<string, VisaType> = {
  study: {
    id: "study",
    name: "Visa Étude",
    description: "Pour poursuivre vos études dans une institution reconnue à l'étranger",
    icon: "📚",
    color: "#3B82F6",
    eligibility: [
      "Admission confirmée d'une institution d'enseignement",
      "Preuve de ressources financières suffisantes",
      "Maîtrise de la langue du pays (si requis)",
      "Antécédents judiciaires vierges",
      "Examen médical satisfaisant",
    ],
    documents: [
      "Lettre d'admission de l'établissement",
      "Preuve de financement (relevés bancaires, lettres de parrainage)",
      "Passeport valide",
      "Certificat de langue (IELTS, TOEFL, etc.)",
      "Diplômes académiques antérieurs",
      "Certificat médical",
      "Assurance maladie",
    ],
    processingTime: "4-12 semaines",
    cost: "$150-500 USD",
    advantages: [
      "Accès à l'éducation de qualité",
      "Possibilité de travail à temps partiel",
      "Voie vers la résidence permanente",
      "Expérience internationale",
    ],
  },
  work: {
    id: "work",
    name: "Visa Travail",
    description: "Pour exercer un emploi rémunéré chez un employeur étranger",
    icon: "💼",
    color: "#10B981",
    eligibility: [
      "Offre d'emploi confirmée",
      "Qualification professionnelle requise",
      "Expérience pertinente (généralement 2+ ans)",
      "Maîtrise de la langue (si requis)",
      "Antécédents judiciaires vierges",
    ],
    documents: [
      "Offre d'emploi signée",
      "Contrat de travail",
      "Passeport valide",
      "CV et lettres de recommandation",
      "Diplômes et certificats professionnels",
      "Certificat médical",
      "Preuve de ressources",
    ],
    processingTime: "2-8 semaines",
    cost: "$100-400 USD",
    advantages: [
      "Stabilité financière",
      "Expérience professionnelle internationale",
      "Possibilité de regroupement familial",
      "Voie vers la résidence permanente",
    ],
  },
  tourism: {
    id: "tourism",
    name: "Visa Tourisme",
    description: "Pour voyager, visiter des proches ou explorer une destination",
    icon: "✈️",
    color: "#F59E0B",
    eligibility: [
      "Passeport valide",
      "Preuve de ressources financières",
      "Billet de retour",
      "Antécédents judiciaires vierges",
      "Raison de voyage claire",
    ],
    documents: [
      "Passeport valide (6+ mois)",
      "Formulaire de demande",
      "Photo d'identité",
      "Preuve de ressources financières",
      "Itinéraire de voyage",
      "Réservation d'hôtel",
      "Billet d'avion aller-retour",
    ],
    processingTime: "5-15 jours",
    cost: "$50-200 USD",
    advantages: [
      "Processus rapide et simple",
      "Coût abordable",
      "Flexibilité de dates",
      "Pas de conditions d'emploi",
    ],
  },
  permanent_residence: {
    id: "permanent_residence",
    name: "Résidence Permanente",
    description: "Pour s'installer définitivement dans un pays avec droits de résident",
    icon: "🏠",
    color: "#EF4444",
    eligibility: [
      "Points de sélection suffisants (éducation, expérience, langue)",
      "Offre d'emploi ou parrainage (selon le programme)",
      "Antécédents judiciaires vierges",
      "Examen médical satisfaisant",
      "Ressources financières suffisantes",
    ],
    documents: [
      "Passeport valide",
      "Diplômes et transcriptions",
      "Certificats professionnels",
      "Certificat de langue",
      "Certificat médical complet",
      "Certificat de police",
      "Preuve de ressources financières",
      "Lettres de recommandation",
    ],
    processingTime: "6-18 mois",
    cost: "$500-2000 USD",
    advantages: [
      "Droits de résident permanent",
      "Accès aux services sociaux",
      "Possibilité de travailler librement",
      "Chemin vers la citoyenneté",
    ],
  },
  family_reunification: {
    id: "family_reunification",
    name: "Regroupement Familial",
    description: "Pour rejoindre des membres de votre famille résidant à l'étranger",
    icon: "👨‍👩‍👧‍👦",
    color: "#8B5CF6",
    eligibility: [
      "Lien de parenté avec le parrain (conjoint, enfants, parents)",
      "Parrain résident ou citoyen",
      "Ressources financières du parrain suffisantes",
      "Logement adéquat",
      "Antécédents judiciaires vierges",
    ],
    documents: [
      "Certificat de mariage/naissance/adoption",
      "Passeport valide",
      "Preuve de relation (photos, correspondances)",
      "Certificat médical",
      "Preuve de ressources du parrain",
      "Preuve de logement",
      "Consentement du parrain",
    ],
    processingTime: "3-12 mois",
    cost: "$200-800 USD",
    advantages: [
      "Réunion avec la famille",
      "Stabilité émotionnelle",
      "Support familial",
      "Possibilité de résidence permanente",
    ],
  },
  business: {
    id: "business",
    name: "Visa Affaires",
    description: "Pour créer une entreprise, investir ou conduire des affaires commerciales",
    icon: "🤝",
    color: "#06B6D4",
    eligibility: [
      "Plan d'affaires solide",
      "Capital d'investissement suffisant",
      "Expérience entrepreneuriale",
      "Ressources financières vérifiées",
      "Antécédents judiciaires vierges",
    ],
    documents: [
      "Plan d'affaires détaillé",
      "Preuve de capital d'investissement",
      "Passeport valide",
      "Certificats professionnels",
      "États financiers personnels",
      "Certificat médical",
      "Références commerciales",
      "Preuve de domicile",
    ],
    processingTime: "4-16 semaines",
    cost: "$300-1500 USD",
    advantages: [
      "Opportunités entrepreneuriales",
      "Croissance économique",
      "Possibilité d'emploi pour d'autres",
      "Voie vers la résidence permanente",
    ],
  },
};

// ─── DESTINATIONS ───────────────────────────────────────────────────────────

export const DESTINATIONS: Record<string, Destination> = {
  canada: {
    id: "canada",
    name: "Canada",
    continent: "Amérique du Nord",
    flag: "🇨🇦",
    description:
      "Destination privilégiée pour l'immigration avec des opportunités d'études, travail et résidence permanente. Économie stable, qualité de vie élevée et système d'immigration bien structuré.",
    visaTypes: ["study", "work", "tourism", "permanent_residence", "family_reunification", "business"],
    specialRequirements: [
      "Certificat de langue (IELTS/TOEFL pour l'étude, CLB pour l'immigration)",
      "Évaluation d'équivalence des diplômes (ECA)",
      "Examen médical par panel physician approuvé",
    ],
    bestFor: "Étudiants, travailleurs qualifiés, entrepreneurs",
    climate: "Continental (hiver froid, été modéré)",
    language: "Anglais, Français",
    currency: "Dollar canadien (CAD)",
    costOfLiving: "Modéré à élevé ($1500-2500 CAD/mois)",
  },
  poland: {
    id: "poland",
    name: "Pologne",
    continent: "Europe",
    flag: "🇵🇱",
    description:
      "Porte d'entrée vers l'UE avec coûts de vie abordables, économie dynamique et opportunités croissantes. Membre de l'UE depuis 2004 avec libre circulation des travailleurs.",
    visaTypes: ["study", "work", "tourism", "permanent_residence", "family_reunification", "business"],
    specialRequirements: [
      "Certificat de langue polonaise (si requis)",
      "Assurance maladie valide",
      "Preuve de logement en Pologne",
    ],
    bestFor: "Étudiants, travailleurs IT, entrepreneurs",
    climate: "Tempéré (hiver froid, été chaud)",
    language: "Polonais",
    currency: "Zloty polonais (PLN)",
    costOfLiving: "Abordable ($800-1500 PLN/mois)",
  },
  germany: {
    id: "germany",
    name: "Allemagne",
    continent: "Europe",
    flag: "🇩🇪",
    description:
      "Économie la plus forte d'Europe avec forte demande de talents. Système éducatif réputé, opportunités professionnelles excellentes et stabilité politique.",
    visaTypes: ["study", "work", "tourism", "permanent_residence", "family_reunification", "business"],
    specialRequirements: [
      "Certificat de langue allemande (B1 minimum)",
      "Reconnaissance des diplômes étrangers",
      "Assurance maladie obligatoire",
    ],
    bestFor: "Ingénieurs, informaticiens, chercheurs",
    climate: "Tempéré (hiver modéré, été chaud)",
    language: "Allemand",
    currency: "Euro (EUR)",
    costOfLiving: "Modéré ($1200-2000 EUR/mois)",
  },
  luxembourg: {
    id: "luxembourg",
    name: "Luxembourg",
    continent: "Europe",
    flag: "🇱🇺",
    description:
      "Petit pays prospère avec salaires élevés, qualité de vie exceptionnelle et stabilité économique. Centre financier européen avec forte demande de professionnels multilingues.",
    visaTypes: ["study", "work", "tourism", "permanent_residence", "family_reunification", "business"],
    specialRequirements: [
      "Certificat de langue (luxembourgeois, français ou allemand)",
      "Contrat de travail préalable généralement requis",
      "Assurance maladie",
    ],
    bestFor: "Professionnels financiers, multilingues",
    climate: "Tempéré océanique",
    language: "Luxembourgeois, Français, Allemand",
    currency: "Euro (EUR)",
    costOfLiving: "Élevé ($2000-3500 EUR/mois)",
  },
  united_kingdom: {
    id: "united_kingdom",
    name: "Royaume-Uni",
    continent: "Europe",
    flag: "🇬🇧",
    description:
      "Économie majeure avec universités de renommée mondiale et opportunités professionnelles variées. Post-Brexit, nouvelles règles d'immigration mais toujours attractive.",
    visaTypes: ["study", "work", "tourism", "permanent_residence", "family_reunification", "business"],
    specialRequirements: [
      "Certificat de langue anglaise (IELTS/TOEFL)",
      "Points de sélection suffisants (système à points)",
      "Certificat de police",
    ],
    bestFor: "Étudiants, professionnels, entrepreneurs",
    climate: "Tempéré océanique (humide)",
    language: "Anglais",
    currency: "Livre sterling (GBP)",
    costOfLiving: "Élevé ($1800-3000 GBP/mois)",
  },
  united_states: {
    id: "united_states",
    name: "États-Unis",
    continent: "Amérique du Nord",
    flag: "🇺🇸",
    description:
      "Superpuissance économique avec opportunités illimitées, innovation et diversité. Destination rêvée pour entrepreneurs, chercheurs et professionnels.",
    visaTypes: ["study", "work", "tourism", "permanent_residence", "family_reunification", "business"],
    specialRequirements: [
      "Entretien consulaire obligatoire",
      "Certificat de langue anglaise (si requis)",
      "Examen médical approuvé",
    ],
    bestFor: "Entrepreneurs, chercheurs, professionnels qualifiés",
    climate: "Varié selon la région",
    language: "Anglais",
    currency: "Dollar américain (USD)",
    costOfLiving: "Élevé ($2000-4000 USD/mois)",
  },
};

// ─── PROCÉDURES ÉTAPE PAR ÉTAPE ───────────────────────────────────────────────

export const PROCEDURES: Record<string, ProcedureStep[]> = {
  general: [
    {
      step: 1,
      title: "Préparation et Évaluation",
      description:
        "Évaluez votre admissibilité, rassemblez les documents requis et consultez un expert en immigration.",
      duration: "1-2 semaines",
      documents: ["Passeport", "Diplômes", "Certificats professionnels"],
      tips: [
        "Vérifiez les critères d'admissibilité spécifiques",
        "Préparez des copies certifiées de tous les documents",
        "Consultez un agent d'immigration agréé",
      ],
    },
    {
      step: 2,
      title: "Collecte des Documents",
      description:
        "Rassemblez tous les documents requis, y compris les traductions certifiées et les certificats.",
      duration: "2-4 semaines",
      documents: [
        "Certificats de langue",
        "Certificat médical",
        "Certificat de police",
        "Preuve de ressources financières",
      ],
      tips: [
        "Obtenez les traductions officielles en anglais/français",
        "Demandez les certificats médicaux à des panel physicians approuvés",
        "Conservez les originaux en lieu sûr",
      ],
    },
    {
      step: 3,
      title: "Remplissage de la Demande",
      description: "Complétez le formulaire de demande en ligne ou papier avec toutes les informations requises.",
      duration: "1-2 semaines",
      documents: ["Formulaire de demande", "Photos d'identité", "Preuve de paiement des frais"],
      tips: [
        "Remplissez le formulaire avec précision",
        "Vérifiez deux fois toutes les informations",
        "Conservez une copie pour vos dossiers",
      ],
    },
    {
      step: 4,
      title: "Soumission de la Demande",
      description: "Soumettez votre demande complète avec tous les documents justificatifs requis.",
      duration: "1 jour",
      documents: ["Demande complète", "Tous les documents justificatifs", "Preuve de paiement"],
      tips: [
        "Utilisez le portail en ligne si disponible",
        "Envoyez par courrier recommandé si papier",
        "Conservez la preuve de soumission",
      ],
    },
    {
      step: 5,
      title: "Traitement de la Demande",
      description: "L'autorité d'immigration traite votre demande et peut demander des informations supplémentaires.",
      duration: "2-12 semaines (selon le type)",
      documents: [],
      tips: [
        "Vérifiez régulièrement le statut de votre demande",
        "Répondez rapidement à toute demande d'information",
        "Maintenez vos coordonnées à jour",
      ],
    },
    {
      step: 6,
      title: "Décision et Notification",
      description: "Recevez la décision concernant votre demande de visa.",
      duration: "1-2 jours après traitement",
      documents: ["Lettre de décision", "Visa (si approuvé)"],
      tips: [
        "Vérifiez tous les détails du visa",
        "Notez les conditions et restrictions",
        "Planifiez votre voyage ou déménagement",
      ],
    },
  ],
};
