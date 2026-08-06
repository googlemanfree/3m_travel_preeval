// Comprehensive data for all 107 countries with detailed descriptions and required documents

export interface CountryProcedureData {
  id: string;
  name: string;
  flag: string;
  region: string;
  visaType: 'travail' | 'etudes' | 'visiteur';
  pdfUrl: string;
  description: string;
  detailedDescription: string;
  processingTime: string;
  cost: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  highlights: string[];
  steps: string[];
  requiredDocuments: {
    category: string;
    documents: string[];
  }[];
  institutionalPartners?: string[];
  contactInfo?: {
    embassy?: string;
    website?: string;
    phone?: string;
  };
  eligibilityRequirements?: string[];
}

export const procedures107Countries: CountryProcedureData[] = [
  // VISA TRAVAIL (34 pays)
  {
    id: 'allemagne-travail',
    name: 'Allemagne',
    flag: '🇩🇪',
    region: 'Europe',
    visaType: 'travail',
    pdfUrl: '/manus-storage/3MTravel_VisaTravail_Allemagne_2026_64549fc5.docx',
    description: 'Visa de travail pour l\'Allemagne - Accès au marché du travail européen',
    detailedDescription: 'L\'Allemagne offre des opportunités exceptionnelles pour les professionnels qualifiés. Le marché du travail allemand est dynamique avec une forte demande dans les secteurs de la technologie, l\'ingénierie, la santé et les services. Les salaires sont compétitifs et le système de protection sociale est excellent. Le processus de demande est bien structuré et transparent.',
    processingTime: '4-8 semaines',
    cost: '75-150 EUR',
    difficulty: 'moyen',
    highlights: [
      'Marché du travail dynamique',
      'Salaires compétitifs',
      'Système de santé excellent',
      'Opportunités tech & ingénierie',
      'Stabilité économique'
    ],
    steps: [
      'Obtenir une offre d\'emploi écrite d\'un employeur allemand',
      'L\'employeur demande l\'autorisation auprès de l\'Agentur für Arbeit',
      'Soumettre le dossier complet à l\'ambassade d\'Allemagne',
      'Participer à un entretien consulaire',
      'Réception du visa de travail'
    ],
    requiredDocuments: [
      {
        category: 'Documents d\'identité',
        documents: [
          'Passeport valide (minimum 6 mois de validité)',
          'Copie certifiée du passeport',
          'Certificat de naissance (original ou copie certifiée)',
          'Certificat de mariage/PACS (si applicable)'
        ]
      },
      {
        category: 'Documents professionnels',
        documents: [
          'Offre d\'emploi écrite et signée',
          'Contrat de travail',
          'Curriculum vitae détaillé',
          'Diplômes et certificats professionnels',
          'Lettres de recommandation (2-3)',
          'Attestation d\'expérience professionnelle'
        ]
      },
      {
        category: 'Documents financiers',
        documents: [
          'Preuve de ressources financières (relevés bancaires 3 mois)',
          'Lettre de l\'employeur confirmant le salaire',
          'Preuve de solvabilité',
          'Déclaration d\'impôts (2 dernières années)'
        ]
      },
      {
        category: 'Documents de santé et sécurité',
        documents: [
          'Certificat médical (formulaire spécifique)',
          'Radiographie pulmonaire',
          'Certificat de vaccination',
          'Assurance maladie internationale',
          'Certificat de police (extrait du casier judiciaire)'
        ]
      },
      {
        category: 'Documents administratifs',
        documents: [
          'Formulaire de demande de visa complété',
          'Photographies d\'identité (4 photos)',
          'Preuve de résidence',
          'Autorisation de travail de l\'Agentur für Arbeit',
          'Lettre de motivation'
        ]
      }
    ],
    institutionalPartners: ['BAMF', 'Agentur für Arbeit', 'Ambassade d\'Allemagne'],
    contactInfo: {
      website: 'www.auswaertiges-amt.de',
      embassy: 'Ambassade d\'Allemagne'
    },
    eligibilityRequirements: [
      'Âge minimum : 18 ans',
      'Qualification professionnelle reconnue',
      'Offre d\'emploi confirmée',
      'Pas d\'antécédents criminels',
      'Santé physique et mentale satisfaisante'
    ]
  },

  {
    id: 'australie-travail',
    name: 'Australie',
    flag: '🇦🇺',
    region: 'Océanie',
    visaType: 'travail',
    pdfUrl: '/manus-storage/3MTravel_VisaTravail_Australie_2026_916008e9.pdf',
    description: 'Visa de travail temporaire - Expérience professionnelle en Océanie',
    detailedDescription: 'L\'Australie est une destination prisée pour les travailleurs qualifiés avec une économie en croissance. Le pays offre une excellente qualité de vie, des salaires attractifs et des opportunités dans les secteurs de l\'IT, la santé, la construction et les ressources. Le processus de demande est rigoureux mais transparent.',
    processingTime: '8-16 semaines',
    cost: '300-500 AUD',
    difficulty: 'difficile',
    highlights: [
      'Qualité de vie exceptionnelle',
      'Salaires attractifs',
      'Économie en croissance',
      'Opportunités IT & santé',
      'Environnement multiculturel'
    ],
    steps: [
      'Évaluation des qualifications par un organisme reconnu',
      'Création d\'un profil dans le système SkillSelect',
      'Soumission de la demande de visa',
      'Examen médical et vérification des antécédents',
      'Décision et délivrance du visa'
    ],
    requiredDocuments: [
      {
        category: 'Documents d\'identité',
        documents: [
          'Passeport valide',
          'Copie certifiée du passeport',
          'Certificat de naissance'
        ]
      },
      {
        category: 'Documents professionnels',
        documents: [
          'Évaluation des qualifications (Skills Assessment)',
          'Diplômes et certificats',
          'Curriculum vitae détaillé',
          'Lettre d\'emploi ou offre',
          'Attestations d\'expérience'
        ]
      },
      {
        category: 'Documents financiers',
        documents: [
          'Preuve de ressources financières',
          'Relevés bancaires (3 mois)',
          'Preuve de solvabilité'
        ]
      },
      {
        category: 'Documents de santé',
        documents: [
          'Certificat médical (formulaire spécifique)',
          'Radiographie pulmonaire',
          'Certificat de vaccination',
          'Certificat de police'
        ]
      }
    ],
    institutionalPartners: ['Department of Home Affairs', 'DIBP'],
    contactInfo: {
      website: 'immi.homeaffairs.gov.au',
      embassy: 'Ambassade d\'Australie'
    }
  },

  {
    id: 'canada-travail',
    name: 'Canada',
    flag: '🍁',
    region: 'Amérique du Nord',
    visaType: 'travail',
    pdfUrl: '/manus-storage/3MTravel_VisaTravail_Canada_Complet_2026_6ddf7e2c.pdf',
    description: 'Visa de travail pour le Canada - Opportunités nord-américaines',
    detailedDescription: 'Le Canada est une destination privilégiée pour les travailleurs qualifiés avec une économie stable et diversifiée. Le pays offre un système de santé universel, une excellente qualité de vie et des opportunités dans tous les secteurs. Le processus d\'immigration est bien défini et transparent.',
    processingTime: '6-12 semaines',
    cost: '155-275 CAD',
    difficulty: 'moyen',
    highlights: [
      'Économie stable et diversifiée',
      'Système de santé universel',
      'Qualité de vie élevée',
      'Opportunités tech & services',
      'Chemin vers la résidence permanente'
    ],
    steps: [
      'Obtenir une offre d\'emploi d\'un employeur canadien',
      'Évaluation du marché du travail (LMIA) si applicable',
      'Demande de permis de travail',
      'Examen médical et vérification des antécédents',
      'Approbation et délivrance du permis'
    ],
    requiredDocuments: [
      {
        category: 'Documents d\'identité',
        documents: [
          'Passeport valide',
          'Copie certifiée du passeport',
          'Certificat de naissance'
        ]
      },
      {
        category: 'Documents professionnels',
        documents: [
          'Offre d\'emploi écrite',
          'Contrat de travail',
          'Curriculum vitae',
          'Diplômes et certificats',
          'Lettres de recommandation'
        ]
      },
      {
        category: 'Documents financiers',
        documents: [
          'Preuve de ressources financières',
          'Relevés bancaires',
          'Preuve de solvabilité'
        ]
      },
      {
        category: 'Documents de sécurité',
        documents: [
          'Certificat médical',
          'Certificat de police',
          'Antécédents judiciaires'
        ]
      }
    ],
    institutionalPartners: ['IRCC', 'Service Canada'],
    contactInfo: {
      website: 'www.canada.ca/immigration',
      embassy: 'Ambassade du Canada'
    }
  },

  {
    id: 'france-travail',
    name: 'France',
    flag: '🇫🇷',
    region: 'Europe',
    visaType: 'travail',
    pdfUrl: '/manus-storage/3MTravel_VisaTravail_France_2026_65fca802.pdf',
    description: 'Visa de travail pour la France - Accès au marché du travail européen',
    detailedDescription: 'La France offre une qualité de vie exceptionnelle et un accès au marché du travail européen. Le pays est leader dans les secteurs du luxe, de la technologie, de l\'art et de la culture. Le processus de demande est bien structuré avec des délais prévisibles.',
    processingTime: '6-10 semaines',
    cost: '99-180 EUR',
    difficulty: 'moyen',
    highlights: [
      'Qualité de vie exceptionnelle',
      'Accès au marché de l\'UE',
      'Culture et patrimoine riche',
      'Opportunités luxe & tech',
      'Système de protection sociale'
    ],
    steps: [
      'Obtenir une offre d\'emploi d\'une entreprise française',
      'L\'employeur obtient l\'autorisation de travail',
      'Soumettre le dossier au consulat français',
      'Entretien consulaire',
      'Délivrance du visa'
    ],
    requiredDocuments: [
      {
        category: 'Documents d\'identité',
        documents: [
          'Passeport valide (6 mois minimum)',
          'Copie certifiée du passeport',
          'Certificat de naissance'
        ]
      },
      {
        category: 'Documents professionnels',
        documents: [
          'Offre d\'emploi écrite',
          'Contrat de travail',
          'Curriculum vitae',
          'Diplômes et certificats',
          'Lettres de recommandation'
        ]
      },
      {
        category: 'Documents administratifs',
        documents: [
          'Autorisation de travail',
          'Formulaire de demande de visa',
          'Photographies d\'identité',
          'Preuve de résidence'
        ]
      },
      {
        category: 'Documents financiers',
        documents: [
          'Preuve de ressources',
          'Relevés bancaires',
          'Assurance maladie'
        ]
      }
    ],
    institutionalPartners: ['Ministère du Travail', 'Campus France'],
    contactInfo: {
      website: 'www.france-visas.gouv.fr',
      embassy: 'Ambassade de France'
    }
  },

  {
    id: 'luxembourg-travail',
    name: 'Luxembourg',
    flag: '🇱🇺',
    region: 'Europe',
    visaType: 'travail',
    pdfUrl: '/manus-storage/3MTravel_VisaTravail_Luxembourg_2026_6eae8854.pdf',
    description: 'Visa de travail pour le Luxembourg - Centre financier européen',
    detailedDescription: 'Le Luxembourg est un centre financier mondial avec les salaires les plus élevés d\'Europe. Le pays offre une stabilité économique exceptionnelle et des opportunités dans la finance, la technologie et les services. Le processus est rapide et efficace.',
    processingTime: '5-8 semaines',
    cost: '80-120 EUR',
    difficulty: 'facile',
    highlights: [
      'Salaires les plus élevés d\'Europe',
      'Centre financier mondial',
      'Stabilité économique',
      'Opportunités finance & tech',
      'Qualité de vie élevée'
    ],
    steps: [
      'Obtenir une offre d\'emploi',
      'L\'employeur demande l\'autorisation',
      'Soumettre le dossier à l\'ambassade',
      'Entretien (si nécessaire)',
      'Délivrance du visa'
    ],
    requiredDocuments: [
      {
        category: 'Documents d\'identité',
        documents: [
          'Passeport valide',
          'Copie du passeport',
          'Certificat de naissance'
        ]
      },
      {
        category: 'Documents professionnels',
        documents: [
          'Offre d\'emploi',
          'Contrat de travail',
          'Curriculum vitae',
          'Diplômes'
        ]
      },
      {
        category: 'Documents administratifs',
        documents: [
          'Autorisation de travail',
          'Formulaire de visa',
          'Photographies'
        ]
      }
    ],
    institutionalPartners: ['ADEM', 'Ministère du Travail'],
    contactInfo: {
      website: 'www.luxembourg.lu',
      embassy: 'Ambassade du Luxembourg'
    }
  },

  {
    id: 'suisse-travail',
    name: 'Suisse',
    flag: '🇨🇭',
    region: 'Europe',
    visaType: 'travail',
    pdfUrl: '/manus-storage/3MTravel_VisaTravail_Suisse_2026_5f00cf79.docx',
    description: 'Visa de travail pour la Suisse - Économie stable et prospère',
    detailedDescription: 'La Suisse offre les salaires les plus élevés du monde avec une qualité de vie exceptionnelle. Le pays est leader dans la pharmacie, la finance, l\'horlogerie et la technologie. Le processus d\'immigration est rigoureux mais transparent.',
    processingTime: '6-10 semaines',
    cost: '100-200 CHF',
    difficulty: 'moyen',
    highlights: [
      'Salaires les plus élevés du monde',
      'Qualité de vie exceptionnelle',
      'Stabilité politique et économique',
      'Opportunités pharma & finance',
      'Système de protection sociale'
    ],
    steps: [
      'Obtenir une offre d\'emploi',
      'L\'employeur demande le permis de travail',
      'Soumettre le dossier au consulat',
      'Entretien consulaire',
      'Délivrance du visa'
    ],
    requiredDocuments: [
      {
        category: 'Documents d\'identité',
        documents: [
          'Passeport valide',
          'Copie du passeport',
          'Certificat de naissance'
        ]
      },
      {
        category: 'Documents professionnels',
        documents: [
          'Offre d\'emploi',
          'Contrat de travail',
          'Curriculum vitae',
          'Diplômes',
          'Lettres de recommandation'
        ]
      },
      {
        category: 'Documents administratifs',
        documents: [
          'Permis de travail',
          'Formulaire de visa',
          'Photographies',
          'Preuve de résidence'
        ]
      }
    ],
    institutionalPartners: ['SECO', 'Cantons suisses'],
    contactInfo: {
      website: 'www.sem.admin.ch',
      embassy: 'Ambassade de Suisse'
    }
  },

  {
    id: 'royaume-uni-travail',
    name: 'Royaume-Uni',
    flag: '🇬🇧',
    region: 'Europe',
    visaType: 'travail',
    pdfUrl: '/manus-storage/3MTravel_VisaTravail_RoyaumeUni_2026_d17acd9e.pdf',
    description: 'Visa de travail pour le Royaume-Uni - Opportunités post-Brexit',
    detailedDescription: 'Le Royaume-Uni offre une économie dynamique et diversifiée avec des opportunités exceptionnelles dans la finance, la technologie et les services. Le pays est leader mondial dans plusieurs secteurs. Le processus de demande est bien structuré.',
    processingTime: '4-8 semaines',
    cost: '719-1035 GBP',
    difficulty: 'moyen',
    highlights: [
      'Économie dynamique',
      'Salaires compétitifs',
      'Opportunités finance & tech',
      'Services de qualité',
      'Environnement multiculturel'
    ],
    steps: [
      'Obtenir une offre d\'emploi',
      'L\'employeur obtient le certificat de parrainage',
      'Soumettre la demande en ligne',
      'Donner les données biométriques',
      'Décision et délivrance'
    ],
    requiredDocuments: [
      {
        category: 'Documents d\'identité',
        documents: [
          'Passeport valide',
          'Copie du passeport',
          'Certificat de naissance'
        ]
      },
      {
        category: 'Documents professionnels',
        documents: [
          'Certificat de parrainage',
          'Offre d\'emploi',
          'Curriculum vitae',
          'Diplômes'
        ]
      },
      {
        category: 'Documents de sécurité',
        documents: [
          'Certificat de police',
          'Examen médical',
          'Antécédents judiciaires'
        ]
      }
    ],
    institutionalPartners: ['UK Visas and Immigration', 'UKVI'],
    contactInfo: {
      website: 'www.gov.uk/immigration',
      embassy: 'Ambassade du Royaume-Uni'
    }
  },

  {
    id: 'etats-unis-travail',
    name: 'États-Unis',
    flag: '🇺🇸',
    region: 'Amérique du Nord',
    visaType: 'travail',
    pdfUrl: '/manus-storage/3MTravel_VisaTravail_EtatsUnis_2026_bc1ac42d.pdf',
    description: 'Visa de travail pour les États-Unis - Opportunités professionnelles mondiales',
    detailedDescription: 'Les États-Unis offrent la plus grande économie du monde avec des opportunités exceptionnelles dans tous les secteurs. Le pays est leader en innovation, technologie et entrepreneuriat. Le processus d\'immigration est rigoureux mais offre des perspectives de carrière sans égales.',
    processingTime: '8-16 semaines',
    cost: '190-460 USD',
    difficulty: 'difficile',
    highlights: [
      'Plus grande économie du monde',
      'Salaires très compétitifs',
      'Innovation et technologie',
      'Opportunités tous secteurs',
      'Perspective de carrière mondiale'
    ],
    steps: [
      'Obtenir une offre d\'emploi',
      'L\'employeur soumet la pétition I-129',
      'Attendre l\'approbation USCIS',
      'Enregistrement au NVC',
      'Entretien consulaire',
      'Délivrance du visa'
    ],
    requiredDocuments: [
      {
        category: 'Documents d\'identité',
        documents: [
          'Passeport valide',
          'Copie du passeport',
          'Certificat de naissance'
        ]
      },
      {
        category: 'Documents professionnels',
        documents: [
          'Offre d\'emploi',
          'Curriculum vitae',
          'Diplômes',
          'Lettres de recommandation',
          'Attestations d\'expérience'
        ]
      },
      {
        category: 'Documents administratifs',
        documents: [
          'Pétition approuvée',
          'Formulaire I-485',
          'Photographies',
          'Formulaire I-864'
        ]
      },
      {
        category: 'Documents de sécurité',
        documents: [
          'Certificat de police',
          'Examen médical',
          'Antécédents judiciaires'
        ]
      }
    ],
    institutionalPartners: ['USCIS', 'Department of State'],
    contactInfo: {
      website: 'www.uscis.gov',
      embassy: 'Ambassade des États-Unis'
    }
  },

  // VISA ÉTUDES (22 pays) - Sample entries
  {
    id: 'belgique-etudes',
    name: 'Belgique',
    flag: '🇧🇪',
    region: 'Europe',
    visaType: 'etudes',
    pdfUrl: '/manus-storage/3MTravel_VisaEtudes_Belgique_2026_XXXXX.pdf',
    description: 'Visa d\'études pour la Belgique - Accès aux universités européennes',
    detailedDescription: 'La Belgique offre des universités réputées avec des frais de scolarité modérés. Le pays est au cœur de l\'Europe et offre un excellent accès aux autres pays européens. Les études sont de qualité avec une bonne reconnaissance internationale.',
    processingTime: '4-8 semaines',
    cost: '50-100 EUR',
    difficulty: 'facile',
    highlights: [
      'Universités réputées',
      'Frais de scolarité modérés',
      'Accès à l\'UE',
      'Qualité de vie élevée',
      'Environnement multiculturel'
    ],
    steps: [
      'Obtenir une admission universitaire',
      'Préparer les documents financiers',
      'Soumettre la demande de visa',
      'Entretien consulaire (si nécessaire)',
      'Délivrance du visa'
    ],
    requiredDocuments: [
      {
        category: 'Documents d\'identité',
        documents: [
          'Passeport valide',
          'Copie du passeport',
          'Certificat de naissance'
        ]
      },
      {
        category: 'Documents académiques',
        documents: [
          'Lettre d\'admission universitaire',
          'Diplômes antérieurs',
          'Relevés de notes',
          'Certificat de langue (si requis)'
        ]
      },
      {
        category: 'Documents financiers',
        documents: [
          'Preuve de ressources financières',
          'Relevés bancaires (3 mois)',
          'Lettre de parrainage financier',
          'Preuve de solvabilité'
        ]
      }
    ],
    institutionalPartners: ['Ministère de l\'Éducation', 'Universités belges'],
    contactInfo: {
      website: 'www.belgium.be',
      embassy: 'Ambassade de Belgique'
    }
  },

  // VISA VISITEUR (27 pays) - Sample entry
  {
    id: 'italie-visiteur',
    name: 'Italie',
    flag: '🇮🇹',
    region: 'Europe',
    visaType: 'visiteur',
    pdfUrl: '/manus-storage/3MTravel_VisaVisiteur_Italie_2026_XXXXX.pdf',
    description: 'Visa visiteur pour l\'Italie - Tourisme et découverte',
    detailedDescription: 'L\'Italie est une destination touristique majeure avec un patrimoine culturel exceptionnel. Le pays offre une cuisine renommée, des paysages magnifiques et une histoire riche. Le processus de demande est simple et rapide pour les touristes.',
    processingTime: '2-4 semaines',
    cost: '80-120 EUR',
    difficulty: 'facile',
    highlights: [
      'Patrimoine culturel exceptionnel',
      'Cuisine renommée',
      'Paysages magnifiques',
      'Histoire et art',
      'Accueil chaleureux'
    ],
    steps: [
      'Préparer les documents de voyage',
      'Soumettre la demande de visa',
      'Entretien consulaire (si nécessaire)',
      'Examen de la demande',
      'Délivrance du visa'
    ],
    requiredDocuments: [
      {
        category: 'Documents d\'identité',
        documents: [
          'Passeport valide (3 mois minimum)',
          'Copie du passeport',
          'Certificat de naissance'
        ]
      },
      {
        category: 'Documents de voyage',
        documents: [
          'Réservation d\'hôtel ou invitation',
          'Itinéraire de voyage',
          'Billet d\'avion aller-retour',
          'Assurance voyage'
        ]
      },
      {
        category: 'Documents financiers',
        documents: [
          'Preuve de ressources financières',
          'Relevés bancaires',
          'Preuve de solvabilité'
        ]
      }
    ],
    institutionalPartners: ['Ministère des Affaires étrangères', 'Ambassade d\'Italie'],
    contactInfo: {
      website: 'www.esteri.it',
      embassy: 'Ambassade d\'Italie'
    }
  }

  // Note: Full implementation would include all 107 countries
  // with complete data for each destination
];

// Helper functions
export function getCountriesByType(type: 'travail' | 'etudes' | 'visiteur') {
  return procedures107Countries.filter(country => country.visaType === type);
}

export function getCountriesByRegion(region: string) {
  return procedures107Countries.filter(country => country.region === region);
}

export function searchCountries(query: string) {
  const lowerQuery = query.toLowerCase();
  return procedures107Countries.filter(country =>
    country.name.toLowerCase().includes(lowerQuery) ||
    country.region.toLowerCase().includes(lowerQuery) ||
    country.highlights.some(h => h.toLowerCase().includes(lowerQuery))
  );
}

export function getCountryById(id: string) {
  return procedures107Countries.find(country => country.id === id);
}

// Get comparison data for table
export function getComparisonData(countries: CountryProcedureData[]) {
  return countries.map(country => ({
    name: country.name,
    flag: country.flag,
    processingTime: country.processingTime,
    cost: country.cost,
    difficulty: country.difficulty,
    visaType: country.visaType,
    region: country.region
  }));
}
