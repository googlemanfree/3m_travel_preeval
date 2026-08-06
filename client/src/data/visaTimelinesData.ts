export interface TimelineStep {
  id: number;
  title: string;
  description: string;
  duration: string;
  status: 'completed' | 'current' | 'pending';
  details?: string[];
}

export interface CountryTimeline {
  country: string;
  countryCode: string;
  totalDays: number;
  steps: TimelineStep[];
}

export const visaTimelinesData: CountryTimeline[] = [
  // Luxembourg
  {
    country: 'Luxembourg',
    countryCode: 'LU',
    totalDays: 30,
    steps: [
      {
        id: 1,
        title: 'Préparation du dossier',
        description: 'Collecte et préparation de tous les documents requis',
        duration: '5-7 jours',
        status: 'completed',
        details: [
          'Vérifier les documents requis',
          'Préparer les copies certifiées',
          'Remplir les formulaires',
          'Obtenir les attestations',
        ],
      },
      {
        id: 2,
        title: 'Soumission de la demande',
        description: 'Envoi du dossier complet aux autorités',
        duration: '1-2 jours',
        status: 'completed',
        details: [
          'Soumettre le dossier en ligne',
          'Payer les frais de traitement',
          'Recevoir la confirmation de réception',
        ],
      },
      {
        id: 3,
        title: 'Examen administratif',
        description: 'Vérification et validation de la demande',
        duration: '10-15 jours',
        status: 'current',
        details: [
          'Vérification des documents',
          'Demandes de clarifications si nécessaire',
          'Validation préliminaire',
        ],
      },
      {
        id: 4,
        title: 'Entretien (si requis)',
        description: 'Entretien avec les autorités de l\'immigration',
        duration: '5-10 jours',
        status: 'pending',
        details: [
          'Planification de l\'entretien',
          'Préparation des réponses',
          'Entretien en personne ou virtuel',
        ],
      },
      {
        id: 5,
        title: 'Décision finale',
        description: 'Notification de la décision d\'approbation ou de rejet',
        duration: '3-5 jours',
        status: 'pending',
        details: [
          'Notification de la décision',
          'Émission du visa (si approuvé)',
          'Remise du passeport',
        ],
      },
    ],
  },
  // Canada
  {
    country: 'Canada',
    countryCode: 'CA',
    totalDays: 180,
    steps: [
      {
        id: 1,
        title: 'Évaluation de l\'admissibilité',
        description: 'Vérification de votre admissibilité au programme',
        duration: '3-5 jours',
        status: 'completed',
        details: [
          'Vérifier les critères d\'admissibilité',
          'Préparer le profil Express Entry',
          'Obtenir l\'évaluation des diplômes (ECA)',
        ],
      },
      {
        id: 2,
        title: 'Création du profil',
        description: 'Création du profil dans le système Express Entry',
        duration: '1 jour',
        status: 'completed',
        details: [
          'Créer le compte IRCC',
          'Remplir le formulaire de profil',
          'Soumettre le profil',
        ],
      },
      {
        id: 3,
        title: 'Invitation à présenter une demande',
        description: 'Attendre une ITA (Invitation à présenter une demande)',
        duration: '30-60 jours',
        status: 'current',
        details: [
          'Attendre le tirage au sort',
          'Recevoir l\'ITA',
          'Vérifier les conditions',
        ],
      },
      {
        id: 4,
        title: 'Soumission de la demande complète',
        description: 'Soumettre la demande complète dans les 60 jours',
        duration: '2-3 jours',
        status: 'pending',
        details: [
          'Préparer tous les documents',
          'Payer les frais',
          'Soumettre la demande',
        ],
      },
      {
        id: 5,
        title: 'Traitement de la demande',
        description: 'Traitement et vérification de la demande',
        duration: '60-90 jours',
        status: 'pending',
        details: [
          'Vérification des antécédents',
          'Vérification médicale',
          'Vérification de sécurité',
        ],
      },
      {
        id: 6,
        title: 'Décision et remise du permis',
        description: 'Notification de la décision et remise du permis',
        duration: '5-10 jours',
        status: 'pending',
        details: [
          'Notification de la décision',
          'Remise du permis de travail/étudiant',
          'Préparation du voyage',
        ],
      },
    ],
  },
  // Belgique
  {
    country: 'Belgique',
    countryCode: 'BE',
    totalDays: 45,
    steps: [
      {
        id: 1,
        title: 'Préparation du dossier',
        description: 'Collecte des documents requis',
        duration: '7 jours',
        status: 'completed',
        details: [
          'Passeport valide',
          'Formulaire de demande',
          'Preuve de ressources financières',
          'Assurance maladie',
        ],
      },
      {
        id: 2,
        title: 'Soumission auprès du consulat',
        description: 'Envoi du dossier au consulat belge',
        duration: '2 jours',
        status: 'completed',
        details: [
          'Soumettre le dossier',
          'Payer les frais de visa',
          'Prendre rendez-vous',
        ],
      },
      {
        id: 3,
        title: 'Entretien consulaire',
        description: 'Entretien avec le consulat',
        duration: '10-15 jours',
        status: 'current',
        details: [
          'Entretien en personne',
          'Vérification des documents',
          'Questions sur le séjour',
        ],
      },
      {
        id: 4,
        title: 'Traitement administratif',
        description: 'Traitement du dossier par les autorités',
        duration: '15-20 jours',
        status: 'pending',
        details: [
          'Vérification des antécédents',
          'Validation administrative',
          'Approbation préliminaire',
        ],
      },
      {
        id: 5,
        title: 'Remise du visa',
        description: 'Remise du visa et du passeport',
        duration: '3-5 jours',
        status: 'pending',
        details: [
          'Notification d\'approbation',
          'Remise du passeport avec visa',
          'Instructions de voyage',
        ],
      },
    ],
  },
  // France
  {
    country: 'France',
    countryCode: 'FR',
    totalDays: 50,
    steps: [
      {
        id: 1,
        title: 'Inscription Campus France',
        description: 'Inscription sur la plateforme Campus France',
        duration: '3 jours',
        status: 'completed',
        details: [
          'Créer un compte Campus France',
          'Remplir le dossier en ligne',
          'Télécharger les documents',
        ],
      },
      {
        id: 2,
        title: 'Examen du dossier',
        description: 'Examen du dossier par Campus France',
        duration: '10-15 jours',
        status: 'completed',
        details: [
          'Vérification des documents',
          'Demandes de clarifications',
          'Validation du dossier',
        ],
      },
      {
        id: 3,
        title: 'Entretien Campus France',
        description: 'Entretien avec Campus France',
        duration: '5-10 jours',
        status: 'current',
        details: [
          'Entretien en personne',
          'Questions sur le projet d\'études',
          'Vérification du français',
        ],
      },
      {
        id: 4,
        title: 'Demande de visa',
        description: 'Soumission de la demande de visa',
        duration: '5-7 jours',
        status: 'pending',
        details: [
          'Soumettre le dossier au consulat',
          'Payer les frais de visa',
          'Prendre rendez-vous',
        ],
      },
      {
        id: 5,
        title: 'Traitement du visa',
        description: 'Traitement de la demande de visa',
        duration: '15-20 jours',
        status: 'pending',
        details: [
          'Vérification des antécédents',
          'Validation administrative',
          'Remise du visa',
        ],
      },
    ],
  },
  // Allemagne
  {
    country: 'Allemagne',
    countryCode: 'DE',
    totalDays: 60,
    steps: [
      {
        id: 1,
        title: 'Préparation du dossier',
        description: 'Collecte des documents requis',
        duration: '7-10 jours',
        status: 'completed',
        details: [
          'Lettre d\'acceptation de l\'université',
          'Preuve de ressources financières',
          'Assurance maladie',
          'Certificat de langue',
        ],
      },
      {
        id: 2,
        title: 'Soumission auprès du consulat',
        description: 'Envoi du dossier au consulat allemand',
        duration: '2-3 jours',
        status: 'completed',
        details: [
          'Soumettre le dossier',
          'Payer les frais de visa',
          'Prendre rendez-vous',
        ],
      },
      {
        id: 3,
        title: 'Entretien consulaire',
        description: 'Entretien avec le consulat',
        duration: '10-15 jours',
        status: 'current',
        details: [
          'Entretien en personne',
          'Vérification des documents',
          'Questions sur les études',
        ],
      },
      {
        id: 4,
        title: 'Traitement administratif',
        description: 'Traitement du dossier par les autorités',
        duration: '20-25 jours',
        status: 'pending',
        details: [
          'Vérification des antécédents',
          'Validation administrative',
          'Approbation du visa',
        ],
      },
      {
        id: 5,
        title: 'Remise du visa',
        description: 'Remise du visa et du passeport',
        duration: '3-5 jours',
        status: 'pending',
        details: [
          'Notification d\'approbation',
          'Remise du passeport avec visa',
          'Instructions de voyage',
        ],
      },
    ],
  },
  // Suisse
  {
    country: 'Suisse',
    countryCode: 'CH',
    totalDays: 40,
    steps: [
      {
        id: 1,
        title: 'Préparation du dossier',
        description: 'Collecte des documents requis',
        duration: '5-7 jours',
        status: 'completed',
        details: [
          'Lettre d\'acceptation de l\'université',
          'Preuve de ressources financières',
          'Assurance maladie',
          'Certificat de langue',
        ],
      },
      {
        id: 2,
        title: 'Soumission auprès du consulat',
        description: 'Envoi du dossier au consulat suisse',
        duration: '2 jours',
        status: 'completed',
        details: [
          'Soumettre le dossier',
          'Payer les frais de visa',
          'Prendre rendez-vous',
        ],
      },
      {
        id: 3,
        title: 'Entretien consulaire',
        description: 'Entretien avec le consulat',
        duration: '8-12 jours',
        status: 'current',
        details: [
          'Entretien en personne',
          'Vérification des documents',
          'Questions sur les études',
        ],
      },
      {
        id: 4,
        title: 'Traitement administratif',
        description: 'Traitement du dossier par les autorités',
        duration: '15-20 jours',
        status: 'pending',
        details: [
          'Vérification des antécédents',
          'Validation administrative',
          'Approbation du visa',
        ],
      },
      {
        id: 5,
        title: 'Remise du visa',
        description: 'Remise du visa et du passeport',
        duration: '2-3 jours',
        status: 'pending',
        details: [
          'Notification d\'approbation',
          'Remise du passeport avec visa',
          'Instructions de voyage',
        ],
      },
    ],
  },
  // Pays-Bas
  {
    country: 'Pays-Bas',
    countryCode: 'NL',
    totalDays: 45,
    steps: [
      {
        id: 1,
        title: 'Préparation du dossier',
        description: 'Collecte des documents requis',
        duration: '5-7 jours',
        status: 'completed',
        details: [
          'Lettre d\'acceptation de l\'université',
          'Preuve de ressources financières',
          'Assurance maladie',
          'Certificat de langue',
        ],
      },
      {
        id: 2,
        title: 'Soumission auprès du consulat',
        description: 'Envoi du dossier au consulat néerlandais',
        duration: '2-3 jours',
        status: 'completed',
        details: [
          'Soumettre le dossier',
          'Payer les frais de visa',
          'Prendre rendez-vous',
        ],
      },
      {
        id: 3,
        title: 'Entretien consulaire',
        description: 'Entretien avec le consulat',
        duration: '10-15 jours',
        status: 'current',
        details: [
          'Entretien en personne',
          'Vérification des documents',
          'Questions sur les études',
        ],
      },
      {
        id: 4,
        title: 'Traitement administratif',
        description: 'Traitement du dossier par les autorités',
        duration: '15-20 jours',
        status: 'pending',
        details: [
          'Vérification des antécédents',
          'Validation administrative',
          'Approbation du visa',
        ],
      },
      {
        id: 5,
        title: 'Remise du visa',
        description: 'Remise du visa et du passeport',
        duration: '3-5 jours',
        status: 'pending',
        details: [
          'Notification d\'approbation',
          'Remise du passeport avec visa',
          'Instructions de voyage',
        ],
      },
    ],
  },
  // Royaume-Uni
  {
    country: 'Royaume-Uni',
    countryCode: 'GB',
    totalDays: 60,
    steps: [
      {
        id: 1,
        title: 'Préparation du dossier',
        description: 'Collecte des documents requis',
        duration: '7-10 jours',
        status: 'completed',
        details: [
          'Lettre d\'acceptation de l\'université',
          'Preuve de ressources financières',
          'Assurance maladie',
          'Certificat de langue',
        ],
      },
      {
        id: 2,
        title: 'Demande en ligne',
        description: 'Soumission de la demande en ligne',
        duration: '3-5 jours',
        status: 'completed',
        details: [
          'Créer un compte UK Visas',
          'Remplir le formulaire en ligne',
          'Télécharger les documents',
        ],
      },
      {
        id: 3,
        title: 'Biométrie',
        description: 'Collecte des données biométriques',
        duration: '10-15 jours',
        status: 'current',
        details: [
          'Prendre rendez-vous au centre',
          'Collecte des empreintes digitales',
          'Prise de photo',
        ],
      },
      {
        id: 4,
        title: 'Traitement de la demande',
        description: 'Traitement de la demande par les autorités',
        duration: '20-30 jours',
        status: 'pending',
        details: [
          'Vérification des antécédents',
          'Validation administrative',
          'Approbation du visa',
        ],
      },
      {
        id: 5,
        title: 'Remise du visa',
        description: 'Remise du visa et du passeport',
        duration: '5-10 jours',
        status: 'pending',
        details: [
          'Notification d\'approbation',
          'Remise du passeport avec visa',
          'Instructions de voyage',
        ],
      },
    ],
  },
];
