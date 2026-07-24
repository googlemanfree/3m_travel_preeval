// Données détaillées des pays avec informations et PDFs
export interface CountryData {
  id: string;
  emoji: string;
  name: string;
  frenchName: string;
  description: string;
  capital: string;
  region: string;
  visaTypes: string[];
  processingTime: string;
  requirements: string[];
  pdfGuide: string; // URL du PDF guide
  advantages: string[];
  difficulty: 'facile' | 'moyen' | 'difficile';
}

export const countriesData: CountryData[] = [
  {
    id: 'canada',
    emoji: '🇨🇦',
    name: 'Canada',
    frenchName: 'Canada',
    description: 'Destination privilégiée pour l\'immigration avec de nombreuses opportunités',
    capital: 'Ottawa',
    region: 'Amérique du Nord',
    visaTypes: ['Résidence Permanente', 'Visa Étudiant', 'Permis de Travail'],
    processingTime: '6-12 mois',
    requirements: ['Passeport valide', 'Diplômes reconnus', 'Preuve financière', 'Examen médical'],
    pdfGuide: '/guides/canada-guide.pdf',
    advantages: ['Système d\'immigration transparent', 'Salaires compétitifs', 'Qualité de vie élevée', 'Multiculturalisme'],
    difficulty: 'moyen',
  },
  {
    id: 'france',
    emoji: '🇫🇷',
    name: 'France',
    frenchName: 'France',
    description: 'Cœur de l\'Europe avec culture riche et opportunités professionnelles',
    capital: 'Paris',
    region: 'Europe',
    visaTypes: ['VLS-TS Étudiant', 'Passeport Talent', 'Visa Court Séjour'],
    processingTime: '4-8 semaines',
    requirements: ['Passeport valide', 'Lettre d\'admission', 'Preuve financière', 'Assurance santé'],
    pdfGuide: '/guides/france-guide.pdf',
    advantages: ['Culture et patrimoine', 'Système éducatif réputé', 'Accès à l\'UE', 'Qualité de vie'],
    difficulty: 'moyen',
  },
  {
    id: 'dubai',
    emoji: '🇦🇪',
    name: 'Dubaï',
    frenchName: 'Émirats Arabes Unis',
    description: 'Hub économique dynamique avec opportunités d\'emploi lucratives',
    capital: 'Abu Dhabi',
    region: 'Moyen-Orient',
    visaTypes: ['Visa Résidence', 'Visa Travail', 'Visa Investisseur'],
    processingTime: '2-4 semaines',
    requirements: ['Passeport valide 6 mois', 'Offre d\'emploi', 'Certificat médical', 'Casier judiciaire'],
    pdfGuide: '/guides/dubai-guide.pdf',
    advantages: ['Salaires élevés', 'Pas d\'impôt sur le revenu', 'Infrastructure moderne', 'Sécurité'],
    difficulty: 'facile',
  },
  {
    id: 'germany',
    emoji: '🇩🇪',
    name: 'Allemagne',
    frenchName: 'Allemagne',
    description: 'Leader économique européen avec marché du travail dynamique',
    capital: 'Berlin',
    region: 'Europe',
    visaTypes: ['Chancenkarte', 'Visa Étudiant', 'Visa Travail'],
    processingTime: '8-12 semaines',
    requirements: ['Passeport valide', 'Qualification professionnelle', 'Preuve financière', 'Examen d\'allemand'],
    pdfGuide: '/guides/germany-guide.pdf',
    advantages: ['Économie forte', 'Salaires compétitifs', 'Système social robuste', 'Qualité de vie'],
    difficulty: 'moyen',
  },
  {
    id: 'uk',
    emoji: '🇬🇧',
    name: 'Royaume-Uni',
    frenchName: 'Royaume-Uni',
    description: 'Destination premium avec universités de renommée mondiale',
    capital: 'Londres',
    region: 'Europe',
    visaTypes: ['Visa Étudiant', 'Skilled Worker Visa', 'Visa Visiteur'],
    processingTime: '3-8 semaines',
    requirements: ['Passeport valide', 'Preuve financière', 'Test de langue', 'Offre d\'emploi'],
    pdfGuide: '/guides/uk-guide.pdf',
    advantages: ['Universités prestigieuses', 'Marché du travail dynamique', 'Langue anglaise', 'Culture'],
    difficulty: 'difficile',
  },
  {
    id: 'australia',
    emoji: '🇦🇺',
    name: 'Australie',
    frenchName: 'Australie',
    description: 'Destination attractive pour les travailleurs qualifiés et étudiants',
    capital: 'Canberra',
    region: 'Océanie',
    visaTypes: ['Skilled Migration', 'Visa Étudiant', 'Visa Travail'],
    processingTime: '3-6 mois',
    requirements: ['Passeport valide', 'Qualification reconnue', 'Examen médical', 'Preuve financière'],
    pdfGuide: '/guides/australia-guide.pdf',
    advantages: ['Qualité de vie élevée', 'Salaires compétitifs', 'Stabilité économique', 'Multiculturalisme'],
    difficulty: 'moyen',
  },
  {
    id: 'belgium',
    emoji: '🇧🇪',
    name: 'Belgique',
    frenchName: 'Belgique',
    description: 'Porte d\'entrée vers l\'Europe avec économie stable',
    capital: 'Bruxelles',
    region: 'Europe',
    visaTypes: ['Visa Schengen', 'Visa Étudiant', 'Visa Travail'],
    processingTime: '4-6 semaines',
    requirements: ['Passeport valide', 'Preuve financière', 'Assurance santé', 'Lettre d\'invitation'],
    pdfGuide: '/guides/belgium-guide.pdf',
    advantages: ['Accès à l\'UE', 'Multilinguisme', 'Infrastructure', 'Stabilité'],
    difficulty: 'facile',
  },
  {
    id: 'poland',
    emoji: '🇵🇱',
    name: 'Pologne',
    frenchName: 'Pologne',
    description: 'Économie en croissance avec coût de vie abordable',
    capital: 'Varsovie',
    region: 'Europe',
    visaTypes: ['Visa Schengen', 'Visa Étudiant', 'Visa Travail'],
    processingTime: '2-4 semaines',
    requirements: ['Passeport valide', 'Preuve financière', 'Lettre d\'invitation', 'Assurance santé'],
    pdfGuide: '/guides/poland-guide.pdf',
    advantages: ['Coût de vie bas', 'Économie dynamique', 'Accès à l\'UE', 'Culture riche'],
    difficulty: 'facile',
  },
];

export const getCountryById = (id: string): CountryData | undefined => {
  return countriesData.find(country => country.id === id);
};

export const searchCountries = (query: string): CountryData[] => {
  const lowerQuery = query.toLowerCase();
  return countriesData.filter(country =>
    country.name.toLowerCase().includes(lowerQuery) ||
    country.frenchName.toLowerCase().includes(lowerQuery) ||
    country.description.toLowerCase().includes(lowerQuery)
  );
};
