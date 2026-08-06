// Complete data for all 107 countries with full descriptions and documents

export interface CountryProcedureComplete {
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
  minSalary?: string;
  totalCost?: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  highlights: string[];
  steps: string[];
  requiredDocuments: {
    category: string;
    documents: string[];
  }[];
}

// Helper function to create country data
const createCountry = (
  id: string,
  name: string,
  flag: string,
  region: string,
  visaType: 'travail' | 'etudes' | 'visiteur',
  pdfUrl: string,
  description: string,
  detailedDescription: string,
  processingTime: string,
  cost: string,
  minSalary: string | undefined,
  totalCost: string | undefined,
  difficulty: 'facile' | 'moyen' | 'difficile',
  highlights: string[],
  steps: string[],
  requiredDocuments: { category: string; documents: string[] }[]
): CountryProcedureComplete => ({
  id,
  name,
  flag,
  region,
  visaType,
  pdfUrl,
  description,
  detailedDescription,
  processingTime,
  cost,
  minSalary,
  totalCost,
  difficulty,
  highlights,
  steps,
  requiredDocuments,
});

export const procedures107Complete: CountryProcedureComplete[] = [
  // VISA TRAVAIL (34 pays)
  createCountry(
    'allemagne-travail', 'Allemagne', '🇩🇪', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Allemagne_2026.pdf',
    'Visa de travail pour l\'Allemagne - Accès au marché du travail européen',
    'L\'Allemagne offre des opportunités exceptionnelles pour les professionnels qualifiés. Marché dynamique avec forte demande en technologie, ingénierie, santé. Salaires compétitifs (2500-4500€/mois), système de protection sociale excellent.',
    '4-8 semaines', '75-150 EUR', '2500 EUR/mois', '2500-3000 EUR', 'moyen',
    ['Marché dynamique', 'Salaires compétitifs', 'Système de santé', 'Tech & Ingénierie', 'Accès UE'],
    ['Offre d\'emploi', 'Autorisation Agentur für Arbeit', 'Dossier ambassade', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie certifiée', 'Certificat naissance'] },
      { category: 'Professionnel', documents: ['Offre d\'emploi', 'Contrat', 'CV', 'Diplômes', 'Lettres recommandation'] },
      { category: 'Financier', documents: ['Relevés bancaires 3 mois', 'Lettre employeur', 'Impôts 2 ans'] },
      { category: 'Santé', documents: ['Certificat médical', 'Radiographie', 'Vaccination', 'Assurance', 'Police'] }
    ]
  ),
  createCountry(
    'australie-travail', 'Australie', '🇦🇺', 'Océanie', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Australie_2026.pdf',
    'Visa de travail temporaire - Expérience professionnelle en Océanie',
    'Australie offre excellente qualité de vie, salaires attractifs (3500-5500 AUD/mois), économie en croissance. Opportunités IT, santé, construction, ressources. Processus rigoureux mais transparent.',
    '8-16 semaines', '300-500 AUD', '3500 AUD/mois', '3500-4500 AUD', 'difficile',
    ['Qualité de vie', 'Salaires attractifs', 'Économie croissance', 'IT & Santé', 'Multiculturel'],
    ['Évaluation qualifications', 'Profil SkillSelect', 'Demande visa', 'Examen médical', 'Décision'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie', 'Certificat naissance'] },
      { category: 'Professionnel', documents: ['Skills Assessment', 'Diplômes', 'CV', 'Lettre emploi', 'Attestations'] },
      { category: 'Financier', documents: ['Ressources financières', 'Relevés 3 mois', 'Solvabilité'] },
      { category: 'Santé', documents: ['Certificat médical', 'Radiographie', 'Vaccination', 'Police'] }
    ]
  ),
  createCountry(
    'canada-travail', 'Canada', '🍁', 'Amérique du Nord', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Canada_2026.pdf',
    'Visa de travail pour le Canada - Opportunités nord-américaines',
    'Canada offre économie stable, système santé universel, qualité vie élevée. Salaires compétitifs (3000-5000 CAD/mois). Processus transparent avec perspectives résidence permanente.',
    '6-12 semaines', '155-275 CAD', '3000 CAD/mois', '3500-4500 CAD', 'moyen',
    ['Économie stable', 'Santé universel', 'Qualité vie', 'Tech & Services', 'Résidence permanente'],
    ['Offre emploi', 'LMIA si applicable', 'Demande permis', 'Examen médical', 'Approbation'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie', 'Certificat naissance'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'Contrat', 'CV', 'Diplômes', 'Lettres'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés bancaires', 'Solvabilité'] },
      { category: 'Sécurité', documents: ['Certificat médical', 'Police', 'Antécédents'] }
    ]
  ),
  createCountry(
    'france-travail', 'France', '🇫🇷', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_France_2026.pdf',
    'Visa de travail pour la France - Accès au marché du travail européen',
    'France offre qualité vie exceptionnelle, accès marché UE. Leader luxe, technologie, art, culture. Salaires compétitifs (2200-4000€/mois). Processus bien structuré avec délais prévisibles.',
    '6-10 semaines', '99-180 EUR', '2200 EUR/mois', '2500-3500 EUR', 'moyen',
    ['Qualité vie', 'Accès UE', 'Culture riche', 'Luxe & Tech', 'Protection sociale'],
    ['Offre emploi', 'Autorisation travail', 'Dossier consulat', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 6 mois', 'Copie', 'Certificat naissance'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'Contrat', 'CV', 'Diplômes', 'Lettres'] },
      { category: 'Administratif', documents: ['Autorisation travail', 'Formulaire visa', 'Photos', 'Résidence'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés bancaires', 'Assurance maladie'] }
    ]
  ),
  createCountry(
    'luxembourg-travail', 'Luxembourg', '🇱🇺', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Luxembourg_2026.pdf',
    'Visa de travail pour le Luxembourg - Centre financier européen',
    'Luxembourg centre financier mondial, salaires plus élevés Europe (3500-6000€/mois). Stabilité économique exceptionnelle. Opportunités finance, technologie, services. Processus rapide et efficace.',
    '5-8 semaines', '80-120 EUR', '3500 EUR/mois', '3500-4500 EUR', 'facile',
    ['Salaires élevés', 'Centre financier', 'Stabilité économique', 'Finance & Tech', 'Qualité vie'],
    ['Offre emploi', 'Autorisation', 'Dossier ambassade', 'Entretien si nécessaire', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie', 'Certificat naissance'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'Contrat', 'CV', 'Diplômes'] },
      { category: 'Administratif', documents: ['Autorisation travail', 'Formulaire visa', 'Photos'] }
    ]
  ),
  createCountry(
    'suisse-travail', 'Suisse', '🇨🇭', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Suisse_2026.pdf',
    'Visa de travail pour la Suisse - Économie stable et prospère',
    'Suisse offre salaires plus élevés monde (4000-7000 CHF/mois), qualité vie exceptionnelle. Leader pharma, finance, horlogerie, technologie. Processus rigoureux mais transparent.',
    '6-10 semaines', '100-200 CHF', '4000 CHF/mois', '4500-5500 CHF', 'moyen',
    ['Salaires élevés', 'Qualité vie', 'Stabilité politique', 'Pharma & Finance', 'Protection sociale'],
    ['Offre emploi', 'Permis travail', 'Dossier consulat', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie', 'Certificat naissance'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'Contrat', 'CV', 'Diplômes', 'Lettres'] },
      { category: 'Administratif', documents: ['Permis travail', 'Formulaire visa', 'Photos', 'Résidence'] }
    ]
  ),
  createCountry(
    'royaume-uni-travail', 'Royaume-Uni', '🇬🇧', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_RoyaumeUni_2026.pdf',
    'Visa de travail pour le Royaume-Uni - Opportunités post-Brexit',
    'Royaume-Uni offre économie dynamique, opportunités finance, technologie, services. Salaires compétitifs (2500-5000 GBP/mois). Processus bien structuré et transparent.',
    '4-8 semaines', '719-1035 GBP', '2500 GBP/mois', '3500-4500 GBP', 'moyen',
    ['Économie dynamique', 'Salaires compétitifs', 'Finance & Tech', 'Services qualité', 'Multiculturel'],
    ['Offre emploi', 'Certificat parrainage', 'Demande en ligne', 'Biométrie', 'Décision'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie', 'Certificat naissance'] },
      { category: 'Professionnel', documents: ['Certificat parrainage', 'Offre emploi', 'CV', 'Diplômes'] },
      { category: 'Sécurité', documents: ['Police', 'Examen médical', 'Antécédents'] }
    ]
  ),
  createCountry(
    'etats-unis-travail', 'États-Unis', '🇺🇸', 'Amérique du Nord', 'travail',
    '/manus-storage/3MTravel_VisaTravail_EtatsUnis_2026.pdf',
    'Visa de travail pour les États-Unis - Opportunités professionnelles mondiales',
    'États-Unis plus grande économie monde, opportunités exceptionnelles tous secteurs. Leader innovation, technologie, entrepreneuriat. Salaires très compétitifs (3500-7000 USD/mois).',
    '8-16 semaines', '190-460 USD', '3500 USD/mois', '4500-6000 USD', 'difficile',
    ['Plus grande économie', 'Salaires compétitifs', 'Innovation', 'Tous secteurs', 'Carrière mondiale'],
    ['Offre emploi', 'Pétition I-129', 'Approbation USCIS', 'NVC', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie', 'Certificat naissance'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV', 'Diplômes', 'Lettres', 'Attestations'] },
      { category: 'Administratif', documents: ['Pétition approuvée', 'Formulaire I-485', 'Photos', 'I-864'] },
      { category: 'Sécurité', documents: ['Police', 'Examen médical', 'Antécédents'] }
    ]
  ),
  createCountry(
    'bulgarie-travail', 'Bulgarie', '🇧🇬', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Bulgarie_2026.pdf',
    'Visa de travail pour la Bulgarie - Opportunités en Europe de l\'Est',
    'Bulgarie offre coût vie bas, opportunités croissantes IT et services. Membre UE avec accès marché européen. Salaires modérés (1200-2500 EUR/mois) mais coût vie très bas.',
    '3-6 semaines', '60-100 EUR', '1200 EUR/mois', '1500-2000 EUR', 'facile',
    ['Coût vie bas', 'Opportunités IT', 'Accès UE', 'Climat méditerranéen', 'Patrimoine culturel'],
    ['Offre emploi', 'Dossier consulat', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie', 'Certificat naissance'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV', 'Diplômes'] }
    ]
  ),
  createCountry(
    'chypre-travail', 'Chypre', '🇨🇾', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Chypre_2026.pdf',
    'Visa de travail pour Chypre - Île méditerranéenne',
    'Chypre offre climat méditerranéen, opportunités tourisme et services financiers. Membre UE avec accès marché européen. Salaires modérés (1500-3000 EUR/mois), coût vie raisonnable.',
    '3-6 semaines', '70-120 EUR', '1500 EUR/mois', '2000-2500 EUR', 'facile',
    ['Climat méditerranéen', 'Tourisme & Services', 'Accès UE', 'Qualité vie', 'Île paradisiaque'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'croatie-travail', 'Croatie', '🇭🇷', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Croatie_2026.pdf',
    'Visa de travail pour la Croatie - Opportunités en Méditerranée',
    'Croatie offre climat méditerranéen, économie en croissance, tourisme dynamique. Membre UE. Salaires modérés (1300-2800 EUR/mois), coût vie abordable.',
    '3-6 semaines', '65-110 EUR', '1300 EUR/mois', '1600-2200 EUR', 'facile',
    ['Climat méditerranéen', 'Économie croissance', 'Tourisme', 'Accès UE', 'Beauté naturelle'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV', 'Diplômes'] }
    ]
  ),
  createCountry(
    'estonie-travail', 'Estonie', '🇪🇪', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Estonie_2026.pdf',
    'Visa de travail pour l\'Estonie - Hub technologique européen',
    'Estonie hub technologique Europe, startup dynamique, gouvernement numérique. Membre UE. Salaires compétitifs (1800-3500 EUR/mois). Qualité vie élevée.',
    '4-7 semaines', '70-120 EUR', '1800 EUR/mois', '2200-2800 EUR', 'moyen',
    ['Hub technologique', 'Startup dynamique', 'Gouvernement numérique', 'Accès UE', 'Qualité vie'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV', 'Diplômes'] }
    ]
  ),
  createCountry(
    'hongrie-travail', 'Hongrie', '🇭🇺', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Hongrie_2026.pdf',
    'Visa de travail pour la Hongrie - Opportunités en Europe centrale',
    'Hongrie offre coût vie bas, opportunités croissantes, capitale Budapest dynamique. Membre UE. Salaires modérés (1400-2900 EUR/mois), coût vie très abordable.',
    '3-6 semaines', '65-110 EUR', '1400 EUR/mois', '1700-2300 EUR', 'facile',
    ['Coût vie bas', 'Budapest dynamique', 'Opportunités croissance', 'Accès UE', 'Culture riche'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'irlande-travail', 'Irlande', '🇮🇪', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Irlande_2026.pdf',
    'Visa de travail pour l\'Irlande - Hub technologique européen',
    'Irlande hub technologique majeur, sièges Google, Apple, Facebook. Salaires compétitifs (2800-5200 EUR/mois). Membre UE. Qualité vie élevée.',
    '4-8 semaines', '100-180 EUR', '2800 EUR/mois', '3200-4000 EUR', 'moyen',
    ['Hub technologique', 'Sièges géants tech', 'Salaires compétitifs', 'Accès UE', 'Qualité vie'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV', 'Diplômes'] }
    ]
  ),
  createCountry(
    'islande-travail', 'Islande', '🇮🇸', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Islande_2026.pdf',
    'Visa de travail pour l\'Islande - Économie stable nordique',
    'Islande offre économie stable, qualité vie exceptionnelle, environnement magnifique. Salaires élevés (2700-5000 EUR/mois). Processus transparent.',
    '4-8 semaines', '90-150 EUR', '2700 EUR/mois', '3200-4000 EUR', 'moyen',
    ['Économie stable', 'Qualité vie exceptionnelle', 'Environnement magnifique', 'Salaires élevés', 'Sécurité'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'italie-travail', 'Italie', '🇮🇹', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Italie_2026.pdf',
    'Visa de travail pour l\'Italie - Opportunités en Méditerranée',
    'Italie offre patrimoine culturel exceptionnel, économie diversifiée, qualité vie. Salaires modérés (1600-3200 EUR/mois). Membre UE.',
    '4-8 semaines', '80-140 EUR', '1600 EUR/mois', '2000-2600 EUR', 'moyen',
    ['Patrimoine culturel', 'Économie diversifiée', 'Qualité vie', 'Cuisine renommée', 'Accès UE'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV', 'Diplômes'] }
    ]
  ),
  createCountry(
    'kenya-travail', 'Kenya', '🇰🇪', 'Afrique', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Kenya_2026.pdf',
    'Visa de travail pour le Kenya - Opportunités en Afrique de l\'Est',
    'Kenya offre économie dynamique, hub technologique Nairobi, opportunités startup. Salaires modérés (1200-2500 USD/mois). Coût vie abordable.',
    '5-10 semaines', '100-200 USD', '1200 USD/mois', '1500-2200 USD', 'moyen',
    ['Économie dynamique', 'Hub technologique', 'Startup croissance', 'Coût vie abordable', 'Opportunités'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'lettonie-travail', 'Lettonie', '🇱🇻', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Lettonie_2026.pdf',
    'Visa de travail pour la Lettonie - Opportunités en Baltique',
    'Lettonie offre coût vie bas, opportunités croissantes, capitale Riga dynamique. Membre UE. Salaires modérés (1300-2700 EUR/mois).',
    '3-6 semaines', '60-100 EUR', '1300 EUR/mois', '1600-2200 EUR', 'facile',
    ['Coût vie bas', 'Riga dynamique', 'Opportunités croissance', 'Accès UE', 'Patrimoine'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'liechtenstein-travail', 'Liechtenstein', '🇱🇮', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Liechtenstein_2026.pdf',
    'Visa de travail pour le Liechtenstein - Micro-État prospère',
    'Liechtenstein micro-état prospère, salaires très élevés (4500-7500 CHF/mois), qualité vie exceptionnelle. Processus rigoureux.',
    '6-10 semaines', '120-200 CHF', '4500 CHF/mois', '5000-6000 CHF', 'difficile',
    ['Salaires très élevés', 'Qualité vie', 'Stabilité', 'Environnement magnifique', 'Prospérité'],
    ['Offre emploi', 'Permis', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV', 'Diplômes'] }
    ]
  ),
  createCountry(
    'lituanie-travail', 'Lituanie', '🇱🇹', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Lituanie_2026.pdf',
    'Visa de travail pour la Lituanie - Opportunités en Baltique',
    'Lituanie offre coût vie bas, opportunités IT croissantes, capitale Vilnius dynamique. Membre UE. Salaires modérés (1400-2800 EUR/mois).',
    '3-6 semaines', '65-110 EUR', '1400 EUR/mois', '1700-2300 EUR', 'facile',
    ['Coût vie bas', 'Vilnius dynamique', 'Opportunités IT', 'Accès UE', 'Patrimoine'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'malaisie-travail', 'Malaisie', '🇲🇾', 'Asie', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Malaisie_2026.pdf',
    'Visa de travail pour la Malaisie - Hub technologique asiatique',
    'Malaisie hub technologique Asie du Sud-Est, économie dynamique, coût vie bas. Salaires modérés (1500-3000 USD/mois). Environnement multiculturel.',
    '4-8 semaines', '80-150 USD', '1500 USD/mois', '1800-2500 USD', 'moyen',
    ['Hub technologique', 'Économie dynamique', 'Coût vie bas', 'Multiculturel', 'Croissance'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'malte-travail', 'Malte', '🇲🇹', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Malte_2026.pdf',
    'Visa de travail pour Malte - Île méditerranéenne',
    'Malte offre climat méditerranéen, économie stable, opportunités finance et tourisme. Membre UE. Salaires modérés (1600-3200 EUR/mois).',
    '3-6 semaines', '75-130 EUR', '1600 EUR/mois', '2000-2600 EUR', 'facile',
    ['Climat méditerranéen', 'Économie stable', 'Finance & Tourisme', 'Accès UE', 'Île paradisiaque'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'maurice-travail', 'Maurice', '🇲🇺', 'Afrique', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Maurice_2026.pdf',
    'Visa de travail pour Maurice - Île prospère de l\'Océan Indien',
    'Maurice île prospère, économie stable, qualité vie élevée. Salaires modérés (1200-2500 USD/mois). Environnement multiculturel.',
    '4-8 semaines', '100-180 USD', '1200 USD/mois', '1500-2200 USD', 'facile',
    ['Île prospère', 'Économie stable', 'Qualité vie', 'Multiculturel', 'Sécurité'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'norvege-travail', 'Norvège', '🇳🇴', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Norvege_2026.pdf',
    'Visa de travail pour la Norvège - Économie nordique prospère',
    'Norvège offre salaires très élevés (3500-6500 EUR/mois), qualité vie exceptionnelle, stabilité économique. Processus transparent.',
    '6-10 semaines', '120-200 EUR', '3500 EUR/mois', '4000-5000 EUR', 'moyen',
    ['Salaires très élevés', 'Qualité vie exceptionnelle', 'Stabilité économique', 'Environnement magnifique', 'Sécurité'],
    ['Offre emploi', 'Permis', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV', 'Diplômes'] }
    ]
  ),
  createCountry(
    'nouvelle-zelande-travail', 'Nouvelle-Zélande', '🇳🇿', 'Océanie', 'travail',
    '/manus-storage/3MTravel_VisaTravail_NouvelleZelande_2026.pdf',
    'Visa de travail pour la Nouvelle-Zélande - Opportunités en Océanie',
    'Nouvelle-Zélande offre qualité vie élevée, salaires compétitifs (2800-5000 NZD/mois), économie stable. Environnement magnifique.',
    '8-16 semaines', '250-400 NZD', '2800 NZD/mois', '3200-4500 NZD', 'difficile',
    ['Qualité vie élevée', 'Salaires compétitifs', 'Économie stable', 'Environnement magnifique', 'Sécurité'],
    ['Offre emploi', 'Skills Assessment', 'Demande', 'Examen médical', 'Décision'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV', 'Diplômes'] }
    ]
  ),
  createCountry(
    'pologne-travail', 'Pologne', '🇵🇱', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Pologne_2026.pdf',
    'Visa de travail pour la Pologne - Opportunités en Europe centrale',
    'Pologne offre coût vie bas, économie dynamique, capitale Varsovie croissance. Membre UE. Salaires modérés (1400-2900 EUR/mois).',
    '3-6 semaines', '65-110 EUR', '1400 EUR/mois', '1700-2300 EUR', 'facile',
    ['Coût vie bas', 'Varsovie dynamique', 'Économie croissance', 'Accès UE', 'Opportunités'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'portugal-travail', 'Portugal', '🇵🇹', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Portugal_2026.pdf',
    'Visa de travail pour le Portugal - Qualité de vie méditerranéenne',
    'Portugal offre qualité vie élevée, climat méditerranéen, coût vie abordable. Salaires modérés (1500-3000 EUR/mois). Membre UE.',
    '4-8 semaines', '85-145 EUR', '1500 EUR/mois', '1900-2500 EUR', 'facile',
    ['Qualité vie élevée', 'Climat méditerranéen', 'Coût vie abordable', 'Accès UE', 'Patrimoine'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'qatar-travail', 'Qatar', '🇶🇦', 'Moyen-Orient', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Qatar_2026.pdf',
    'Visa de travail pour le Qatar - Opportunités au Moyen-Orient',
    'Qatar offre salaires élevés (2500-5500 USD/mois), économie prospère, opportunités diversifiées. Coût vie modéré avec avantages expatriés.',
    '4-8 semaines', '150-300 USD', '2500 USD/mois', '3000-4000 USD', 'moyen',
    ['Salaires élevés', 'Économie prospère', 'Opportunités diversifiées', 'Avantages expatriés', 'Croissance'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'roumanie-travail', 'Roumanie', '🇷🇴', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Roumanie_2026.pdf',
    'Visa de travail pour la Roumanie - Opportunités en Europe de l\'Est',
    'Roumanie offre coût vie très bas, opportunités IT croissantes, capitale Bucarest dynamique. Membre UE. Salaires modérés (1200-2500 EUR/mois).',
    '3-6 semaines', '60-100 EUR', '1200 EUR/mois', '1500-2000 EUR', 'facile',
    ['Coût vie très bas', 'Bucarest dynamique', 'Opportunités IT', 'Accès UE', 'Croissance'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'senegal-travail', 'Sénégal', '🇸🇳', 'Afrique', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Senegal_2026.pdf',
    'Visa de travail pour le Sénégal - Hub économique d\'Afrique de l\'Ouest',
    'Sénégal hub économique Afrique de l\'Ouest, économie stable, opportunités croissantes. Salaires modérés (1000-2000 USD/mois). Coût vie abordable.',
    '5-10 semaines', '80-150 USD', '1000 USD/mois', '1300-1900 USD', 'moyen',
    ['Hub économique', 'Économie stable', 'Opportunités croissance', 'Coût vie abordable', 'Stabilité'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'slovaquie-travail', 'Slovaquie', '🇸🇰', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Slovaquie_2026.pdf',
    'Visa de travail pour la Slovaquie - Opportunités en Europe centrale',
    'Slovaquie offre coût vie bas, économie dynamique, capitale Bratislava croissance. Membre UE. Salaires modérés (1300-2700 EUR/mois).',
    '3-6 semaines', '65-110 EUR', '1300 EUR/mois', '1600-2200 EUR', 'facile',
    ['Coût vie bas', 'Bratislava dynamique', 'Économie croissance', 'Accès UE', 'Opportunités'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'slovenie-travail', 'Slovénie', '🇸🇮', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Slovenie_2026.pdf',
    'Visa de travail pour la Slovénie - Opportunités en Europe centrale',
    'Slovénie offre qualité vie élevée, économie stable, environnement magnifique. Membre UE. Salaires compétitifs (1800-3500 EUR/mois).',
    '4-8 semaines', '75-130 EUR', '1800 EUR/mois', '2200-2800 EUR', 'moyen',
    ['Qualité vie élevée', 'Économie stable', 'Environnement magnifique', 'Accès UE', 'Sécurité'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'republique-tcheque-travail', 'Rép. Tchèque', '🇨🇿', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_RepubliqueTcheque_2026.pdf',
    'Visa de travail pour la Rép. Tchèque - Opportunités en Europe centrale',
    'République Tchèque offre coût vie bas, économie dynamique, capitale Prague magnifique. Membre UE. Salaires modérés (1400-2900 EUR/mois).',
    '3-6 semaines', '65-110 EUR', '1400 EUR/mois', '1700-2300 EUR', 'facile',
    ['Coût vie bas', 'Prague magnifique', 'Économie croissance', 'Accès UE', 'Culture'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'gabon-travail', 'Gabon', '🇬🇦', 'Afrique', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Gabon_2026.pdf',
    'Visa de travail pour le Gabon - Opportunités en Afrique centrale',
    'Gabon offre économie stable, opportunités secteur pétrolier et services. Salaires modérés (1500-3000 USD/mois). Coût vie modéré.',
    '5-10 semaines', '100-200 USD', '1500 USD/mois', '1800-2500 USD', 'moyen',
    ['Économie stable', 'Secteur pétrolier', 'Services croissance', 'Coût vie modéré', 'Opportunités'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'suede-travail', 'Suède', '🇸🇪', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Suede_2026.pdf',
    'Visa de travail pour la Suède - Économie nordique innovante',
    'Suède offre salaires élevés (3000-5500 EUR/mois), qualité vie exceptionnelle, innovation. Membre UE. Processus transparent.',
    '6-10 semaines', '110-180 EUR', '3000 EUR/mois', '3500-4500 EUR', 'moyen',
    ['Salaires élevés', 'Qualité vie exceptionnelle', 'Innovation', 'Accès UE', 'Stabilité'],
    ['Offre emploi', 'Permis', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV', 'Diplômes'] }
    ]
  ),
  createCountry(
    'danemark-travail', 'Danemark', '🇩🇰', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Danemark_2026.pdf',
    'Visa de travail pour le Danemark - Économie nordique prospère',
    'Danemark offre salaires élevés (3200-5800 EUR/mois), qualité vie exceptionnelle, innovation. Membre UE. Processus transparent.',
    '6-10 semaines', '110-180 EUR', '3200 EUR/mois', '3700-4800 EUR', 'moyen',
    ['Salaires élevés', 'Qualité vie exceptionnelle', 'Innovation', 'Accès UE', 'Stabilité'],
    ['Offre emploi', 'Permis', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV', 'Diplômes'] }
    ]
  ),
  createCountry(
    'autriche-travail', 'Autriche', '🇦🇹', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Autriche_2026.pdf',
    'Visa de travail pour l\'Autriche - Opportunités en Europe centrale',
    'Autriche offre salaires compétitifs (2600-4800 EUR/mois), qualité vie élevée, culture riche. Membre UE.',
    '5-9 semaines', '90-160 EUR', '2600 EUR/mois', '3100-4000 EUR', 'moyen',
    ['Salaires compétitifs', 'Qualité vie élevée', 'Culture riche', 'Accès UE', 'Stabilité'],
    ['Offre emploi', 'Permis', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'finlande-travail', 'Finlande', '🇫🇮', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Finlande_2026.pdf',
    'Visa de travail pour la Finlande - Hub technologique nordique',
    'Finlande hub technologique, salaires élevés (2900-5200 EUR/mois), qualité vie exceptionnelle. Membre UE.',
    '6-10 semaines', '110-180 EUR', '2900 EUR/mois', '3400-4400 EUR', 'moyen',
    ['Hub technologique', 'Salaires élevés', 'Qualité vie exceptionnelle', 'Accès UE', 'Innovation'],
    ['Offre emploi', 'Permis', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'espagne-travail', 'Espagne', '🇪🇸', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Espagne_2026.pdf',
    'Visa de travail pour l\'Espagne - Opportunités méditerranéennes',
    'Espagne offre qualité vie élevée, climat méditerranéen, économie diversifiée. Salaires modérés (1600-3200 EUR/mois). Membre UE.',
    '4-8 semaines', '85-145 EUR', '1600 EUR/mois', '2000-2600 EUR', 'moyen',
    ['Qualité vie élevée', 'Climat méditerranéen', 'Économie diversifiée', 'Accès UE', 'Culture'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'grece-travail', 'Grèce', '🇬🇷', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_Grece_2026.pdf',
    'Visa de travail pour la Grèce - Opportunités méditerranéennes',
    'Grèce offre climat méditerranéen, patrimoine culturel, économie croissance. Salaires modérés (1300-2700 EUR/mois). Membre UE.',
    '4-8 semaines', '80-140 EUR', '1300 EUR/mois', '1700-2300 EUR', 'facile',
    ['Climat méditerranéen', 'Patrimoine culturel', 'Économie croissance', 'Accès UE', 'Île'],
    ['Offre emploi', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),
  createCountry(
    'pays-bas-travail', 'Pays-Bas', '🇳🇱', 'Europe', 'travail',
    '/manus-storage/3MTravel_VisaTravail_PaysBasTrail_2026.pdf',
    'Visa de travail pour les Pays-Bas - Hub technologique européen',
    'Pays-Bas hub technologique, salaires compétitifs (2500-4800 EUR/mois), qualité vie élevée. Membre UE.',
    '4-8 semaines', '95-165 EUR', '2500 EUR/mois', '3000-3900 EUR', 'moyen',
    ['Hub technologique', 'Salaires compétitifs', 'Qualité vie', 'Accès UE', 'Innovation'],
    ['Offre emploi', 'Permis', 'Dossier', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Professionnel', documents: ['Offre emploi', 'CV'] }
    ]
  ),

  // VISA ÉTUDES (22 pays)
  createCountry(
    'belgique-etudes', 'Belgique', '🇧🇪', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Belgique_2026.pdf',
    'Visa d\'études pour la Belgique - Universités européennes réputées',
    'Belgique offre universités réputées, frais modérés (800-2500 EUR/an), accès UE. Coût vie raisonnable (800-1200 EUR/mois).',
    '4-8 semaines', '50-100 EUR', '1000 EUR/mois', '1500-2500 EUR/an', 'facile',
    ['Universités réputées', 'Frais modérés', 'Accès UE', 'Qualité vie', 'Multiculturel'],
    ['Admission universitaire', 'Documents financiers', 'Demande visa', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie', 'Certificat naissance'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes', 'Relevés notes', 'Certificat langue'] },
      { category: 'Financier', documents: ['Ressources financières', 'Relevés 3 mois', 'Parrainage', 'Solvabilité'] }
    ]
  ),
  createCountry(
    'france-etudes', 'France', '🇫🇷', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_France_2026.pdf',
    'Visa d\'études pour la France - Universités de renommée mondiale',
    'France offre universités renommées, frais très modérés (200-600 EUR/an), qualité vie. Coût vie raisonnable (900-1300 EUR/mois).',
    '4-8 semaines', '99-180 EUR', '1000 EUR/mois', '1200-2000 EUR/an', 'facile',
    ['Universités renommées', 'Frais très modérés', 'Qualité vie', 'Culture', 'Gastronomie'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes', 'Relevés notes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés bancaires'] }
    ]
  ),
  createCountry(
    'allemagne-etudes', 'Allemagne', '🇩🇪', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Allemagne_2026.pdf',
    'Visa d\'études pour l\'Allemagne - Universités de qualité',
    'Allemagne offre universités qualité, frais très bas (0-300 EUR/semestre), accès UE. Coût vie modéré (800-1200 EUR/mois).',
    '4-8 semaines', '75-150 EUR', '1000 EUR/mois', '1200-2000 EUR/an', 'facile',
    ['Universités qualité', 'Frais très bas', 'Accès UE', 'Système éducatif', 'Opportunités'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'canada-etudes', 'Canada', '🍁', 'Amérique du Nord', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Canada_2026.pdf',
    'Visa d\'études pour le Canada - Universités nord-américaines',
    'Canada offre universités réputées, frais modérés (8000-20000 CAD/an), qualité vie. Accès résidence permanente.',
    '4-8 semaines', '155-275 CAD', '1200 CAD/mois', '2000-3500 CAD/an', 'moyen',
    ['Universités réputées', 'Frais modérés', 'Qualité vie', 'Résidence permanente', 'Multiculturel'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'australie-etudes', 'Australie', '🇦🇺', 'Océanie', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Australie_2026.pdf',
    'Visa d\'études pour l\'Australie - Universités de qualité',
    'Australie offre universités qualité, frais modérés (15000-35000 AUD/an), qualité vie élevée. Opportunités travail pendant études.',
    '8-16 semaines', '300-500 AUD', '1400 AUD/mois', '2500-4000 AUD/an', 'difficile',
    ['Universités qualité', 'Frais modérés', 'Qualité vie', 'Travail études', 'Opportunités'],
    ['Admission', 'Documents', 'Demande', 'Examen médical', 'Décision'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'royaume-uni-etudes', 'Royaume-Uni', '🇬🇧', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_RoyaumeUni_2026.pdf',
    'Visa d\'études pour le Royaume-Uni - Universités prestigieuses',
    'Royaume-Uni offre universités prestigieuses (Oxford, Cambridge), frais élevés (10000-30000 GBP/an), qualité vie.',
    '4-8 semaines', '719-1035 GBP', '1300 GBP/mois', '2500-4500 GBP/an', 'moyen',
    ['Universités prestigieuses', 'Qualité éducation', 'Qualité vie', 'Opportunités', 'Réseau'],
    ['Admission', 'Documents', 'Demande', 'Biométrie', 'Décision'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'suisse-etudes', 'Suisse', '🇨🇭', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Suisse_2026.pdf',
    'Visa d\'études pour la Suisse - Universités de renommée mondiale',
    'Suisse offre universités renommées, frais modérés (500-2000 CHF/semestre), qualité vie exceptionnelle.',
    '6-10 semaines', '100-200 CHF', '1500 CHF/mois', '2000-3500 CHF/an', 'moyen',
    ['Universités renommées', 'Frais modérés', 'Qualité vie exceptionnelle', 'Stabilité', 'Environnement'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'pays-bas-etudes', 'Pays-Bas', '🇳🇱', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_PaysBasEtudes_2026.pdf',
    'Visa d\'études pour les Pays-Bas - Universités innovantes',
    'Pays-Bas offre universités innovantes, frais modérés (1500-2000 EUR/an), qualité vie élevée.',
    '4-8 semaines', '95-165 EUR', '1000 EUR/mois', '1500-2500 EUR/an', 'facile',
    ['Universités innovantes', 'Frais modérés', 'Qualité vie', 'Accès UE', 'Anglais'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'suede-etudes', 'Suède', '🇸🇪', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Suede_2026.pdf',
    'Visa d\'études pour la Suède - Universités nordiques',
    'Suède offre universités nordiques, frais modérés (0-15000 EUR/an), qualité vie exceptionnelle.',
    '6-10 semaines', '110-180 EUR', '1200 EUR/mois', '1500-3000 EUR/an', 'facile',
    ['Universités nordiques', 'Frais modérés', 'Qualité vie exceptionnelle', 'Innovation', 'Accès UE'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'danemark-etudes', 'Danemark', '🇩🇰', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Danemark_2026.pdf',
    'Visa d\'études pour le Danemark - Universités nordiques',
    'Danemark offre universités nordiques, frais modérés (0-6000 EUR/an), qualité vie exceptionnelle.',
    '6-10 semaines', '110-180 EUR', '1200 EUR/mois', '1500-2500 EUR/an', 'facile',
    ['Universités nordiques', 'Frais modérés', 'Qualité vie exceptionnelle', 'Innovation', 'Accès UE'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'finlande-etudes', 'Finlande', '🇫🇮', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Finlande_2026.pdf',
    'Visa d\'études pour la Finlande - Universités innovantes',
    'Finlande offre universités innovantes, frais modérés (0-18000 EUR/an), qualité vie exceptionnelle.',
    '6-10 semaines', '110-180 EUR', '1200 EUR/mois', '1500-3000 EUR/an', 'facile',
    ['Universités innovantes', 'Frais modérés', 'Qualité vie exceptionnelle', 'Technologie', 'Accès UE'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'espagne-etudes', 'Espagne', '🇪🇸', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Espagne_2026.pdf',
    'Visa d\'études pour l\'Espagne - Universités méditerranéennes',
    'Espagne offre universités méditerranéennes, frais modérés (1000-3000 EUR/an), qualité vie.',
    '4-8 semaines', '85-145 EUR', '900 EUR/mois', '1200-2000 EUR/an', 'facile',
    ['Universités méditerranéennes', 'Frais modérés', 'Qualité vie', 'Climat', 'Culture'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'italie-etudes', 'Italie', '🇮🇹', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Italie_2026.pdf',
    'Visa d\'études pour l\'Italie - Universités méditerranéennes',
    'Italie offre universités méditerranéennes, frais modérés (900-2500 EUR/an), patrimoine culturel.',
    '4-8 semaines', '80-140 EUR', '800 EUR/mois', '1000-1800 EUR/an', 'facile',
    ['Universités méditerranéennes', 'Frais modérés', 'Patrimoine culturel', 'Climat', 'Art'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'autriche-etudes', 'Autriche', '🇦🇹', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Autriche_2026.pdf',
    'Visa d\'études pour l\'Autriche - Universités de qualité',
    'Autriche offre universités qualité, frais modérés (0-750 EUR/semestre), culture riche.',
    '5-9 semaines', '90-160 EUR', '1000 EUR/mois', '1200-2000 EUR/an', 'facile',
    ['Universités qualité', 'Frais modérés', 'Culture riche', 'Accès UE', 'Musique'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'pologne-etudes', 'Pologne', '🇵🇱', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Pologne_2026.pdf',
    'Visa d\'études pour la Pologne - Universités abordables',
    'Pologne offre universités abordables, frais très bas (1000-3000 EUR/an), coût vie bas.',
    '3-6 semaines', '65-110 EUR', '600 EUR/mois', '800-1500 EUR/an', 'facile',
    ['Universités abordables', 'Frais très bas', 'Coût vie bas', 'Accès UE', 'Opportunités'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'republique-tcheque-etudes', 'Rép. Tchèque', '🇨🇿', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_RepubliqueTcheque_2026.pdf',
    'Visa d\'études pour la Rép. Tchèque - Universités abordables',
    'République Tchèque offre universités abordables, frais bas (1500-4000 EUR/an), Prague magnifique.',
    '3-6 semaines', '65-110 EUR', '700 EUR/mois', '1000-1800 EUR/an', 'facile',
    ['Universités abordables', 'Frais bas', 'Prague magnifique', 'Accès UE', 'Culture'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'hongrie-etudes', 'Hongrie', '🇭🇺', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Hongrie_2026.pdf',
    'Visa d\'études pour la Hongrie - Universités abordables',
    'Hongrie offre universités abordables, frais très bas (1200-3500 EUR/an), Budapest dynamique.',
    '3-6 semaines', '65-110 EUR', '600 EUR/mois', '800-1500 EUR/an', 'facile',
    ['Universités abordables', 'Frais très bas', 'Budapest dynamique', 'Accès UE', 'Culture'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'roumanie-etudes', 'Roumanie', '🇷🇴', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Roumanie_2026.pdf',
    'Visa d\'études pour la Roumanie - Universités très abordables',
    'Roumanie offre universités très abordables, frais très bas (1000-2500 EUR/an), coût vie très bas.',
    '3-6 semaines', '60-100 EUR', '500 EUR/mois', '700-1300 EUR/an', 'facile',
    ['Universités très abordables', 'Frais très bas', 'Coût vie très bas', 'Accès UE', 'Opportunités'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'slovaquie-etudes', 'Slovaquie', '🇸🇰', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Slovaquie_2026.pdf',
    'Visa d\'études pour la Slovaquie - Universités abordables',
    'Slovaquie offre universités abordables, frais bas (1500-4000 EUR/an), Bratislava dynamique.',
    '3-6 semaines', '65-110 EUR', '700 EUR/mois', '1000-1800 EUR/an', 'facile',
    ['Universités abordables', 'Frais bas', 'Bratislava dynamique', 'Accès UE', 'Opportunités'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'slovenie-etudes', 'Slovénie', '🇸🇮', 'Europe', 'etudes',
    '/manus-storage/3MTravel_VisaEtudes_Slovenie_2026.pdf',
    'Visa d\'études pour la Slovénie - Universités de qualité',
    'Slovénie offre universités qualité, frais modérés (0-500 EUR/an), environnement magnifique.',
    '4-8 semaines', '75-130 EUR', '900 EUR/mois', '1200-1800 EUR/an', 'facile',
    ['Universités qualité', 'Frais modérés', 'Environnement magnifique', 'Accès UE', 'Sécurité'],
    ['Admission', 'Documents', 'Demande', 'Entretien', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide', 'Copie'] },
      { category: 'Académique', documents: ['Lettre admission', 'Diplômes'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),

  // VISA VISITEUR (27 pays)
  createCountry(
    'italie-visiteur', 'Italie', '🇮🇹', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Italie_2026.pdf',
    'Visa visiteur pour l\'Italie - Tourisme et découverte',
    'Italie destination touristique majeure, patrimoine culturel exceptionnel, cuisine renommée, paysages magnifiques. Processus simple et rapide.',
    '2-4 semaines', '80-120 EUR', '2000 EUR', '2500-3500 EUR', 'facile',
    ['Patrimoine culturel', 'Cuisine renommée', 'Paysages magnifiques', 'Histoire & Art', 'Accueil chaleureux'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance voyage'] },
      { category: 'Financier', documents: ['Ressources financières', 'Relevés bancaires'] }
    ]
  ),
  createCountry(
    'france-visiteur', 'France', '🇫🇷', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_France_2026.pdf',
    'Visa visiteur pour la France - Culture et patrimoine',
    'France destination touristique majeure, culture riche, patrimoine exceptionnel, gastronomie renommée. Processus simple.',
    '2-4 semaines', '99-180 EUR', '2000 EUR', '2500-3500 EUR', 'facile',
    ['Culture riche', 'Patrimoine exceptionnel', 'Gastronomie renommée', 'Art & Architecture', 'Charme'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'espagne-visiteur', 'Espagne', '🇪🇸', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Espagne_2026.pdf',
    'Visa visiteur pour l\'Espagne - Soleil et plages',
    'Espagne destination touristique majeure, climat méditerranéen, plages magnifiques, culture dynamique. Processus simple.',
    '2-4 semaines', '85-145 EUR', '1800 EUR', '2300-3200 EUR', 'facile',
    ['Soleil & Plages', 'Climat méditerranéen', 'Culture dynamique', 'Gastronomie', 'Fêtes'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'allemagne-visiteur', 'Allemagne', '🇩🇪', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Allemagne_2026.pdf',
    'Visa visiteur pour l\'Allemagne - Culture et histoire',
    'Allemagne destination touristique majeure, histoire riche, culture dynamique, architecture magnifique. Processus simple.',
    '2-4 semaines', '75-150 EUR', '1800 EUR', '2300-3200 EUR', 'facile',
    ['Histoire riche', 'Culture dynamique', 'Architecture magnifique', 'Patrimoine', 'Bière & Cuisine'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'royaume-uni-visiteur', 'Royaume-Uni', '🇬🇧', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_RoyaumeUni_2026.pdf',
    'Visa visiteur pour le Royaume-Uni - Culture britannique',
    'Royaume-Uni destination touristique majeure, culture britannique, histoire fascinante, Londres dynamique. Processus simple.',
    '2-4 semaines', '719-1035 GBP', '2000 GBP', '2500-3500 GBP', 'facile',
    ['Culture britannique', 'Histoire fascinante', 'Londres dynamique', 'Patrimoine', 'Traditions'],
    ['Documents voyage', 'Demande visa', 'Biométrie', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'grece-visiteur', 'Grèce', '🇬🇷', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Grece_2026.pdf',
    'Visa visiteur pour la Grèce - Îles et patrimoine',
    'Grèce destination touristique majeure, îles magnifiques, patrimoine antique, climat méditerranéen. Processus simple.',
    '2-4 semaines', '80-140 EUR', '1800 EUR', '2300-3200 EUR', 'facile',
    ['Îles magnifiques', 'Patrimoine antique', 'Climat méditerranéen', 'Gastronomie', 'Beauté'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'portugal-visiteur', 'Portugal', '🇵🇹', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Portugal_2026.pdf',
    'Visa visiteur pour le Portugal - Charme méditerranéen',
    'Portugal destination touristique majeure, charme méditerranéen, climat agréable, Lisbonne dynamique. Processus simple.',
    '2-4 semaines', '85-145 EUR', '1800 EUR', '2300-3200 EUR', 'facile',
    ['Charme méditerranéen', 'Climat agréable', 'Lisbonne dynamique', 'Patrimoine', 'Gastronomie'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'suisse-visiteur', 'Suisse', '🇨🇭', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Suisse_2026.pdf',
    'Visa visiteur pour la Suisse - Alpes et nature',
    'Suisse destination touristique majeure, Alpes magnifiques, nature exceptionnelle, lacs cristallins. Processus simple.',
    '2-4 semaines', '100-200 CHF', '2000 CHF', '2500-3500 CHF', 'facile',
    ['Alpes magnifiques', 'Nature exceptionnelle', 'Lacs cristallins', 'Environnement', 'Randonnée'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'pays-bas-visiteur', 'Pays-Bas', '🇳🇱', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_PaysBasVisiteur_2026.pdf',
    'Visa visiteur pour les Pays-Bas - Canaux et tulipes',
    'Pays-Bas destination touristique majeure, canaux pittoresques, tulipes magnifiques, Amsterdam dynamique. Processus simple.',
    '2-4 semaines', '95-165 EUR', '1800 EUR', '2300-3200 EUR', 'facile',
    ['Canaux pittoresques', 'Tulipes magnifiques', 'Amsterdam dynamique', 'Culture', 'Vélos'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'autriche-visiteur', 'Autriche', '🇦🇹', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Autriche_2026.pdf',
    'Visa visiteur pour l\'Autriche - Musique et culture',
    'Autriche destination touristique majeure, musique classique, culture riche, Vienne magnifique. Processus simple.',
    '2-4 semaines', '90-160 EUR', '1800 EUR', '2300-3200 EUR', 'facile',
    ['Musique classique', 'Culture riche', 'Vienne magnifique', 'Patrimoine', 'Gastronomie'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'suede-visiteur', 'Suède', '🇸🇪', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Suede_2026.pdf',
    'Visa visiteur pour la Suède - Aurores boréales et nature',
    'Suède destination touristique majeure, aurores boréales, nature sauvage, Stockholm dynamique. Processus simple.',
    '2-4 semaines', '110-180 EUR', '2000 EUR', '2500-3500 EUR', 'facile',
    ['Aurores boréales', 'Nature sauvage', 'Stockholm dynamique', 'Patrimoine', 'Environnement'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'danemark-visiteur', 'Danemark', '🇩🇰', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Danemark_2026.pdf',
    'Visa visiteur pour le Danemark - Design et nature',
    'Danemark destination touristique majeure, design scandinave, nature magnifique, Copenhague dynamique. Processus simple.',
    '2-4 semaines', '110-180 EUR', '2000 EUR', '2500-3500 EUR', 'facile',
    ['Design scandinave', 'Nature magnifique', 'Copenhague dynamique', 'Patrimoine', 'Vélos'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'finlande-visiteur', 'Finlande', '🇫🇮', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Finlande_2026.pdf',
    'Visa visiteur pour la Finlande - Lacs et forêts',
    'Finlande destination touristique majeure, lacs cristallins, forêts infinies, Helsinki dynamique. Processus simple.',
    '2-4 semaines', '110-180 EUR', '2000 EUR', '2500-3500 EUR', 'facile',
    ['Lacs cristallins', 'Forêts infinies', 'Helsinki dynamique', 'Sauna', 'Nature'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'norvege-visiteur', 'Norvège', '🇳🇴', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Norvege_2026.pdf',
    'Visa visiteur pour la Norvège - Fjords et montagnes',
    'Norvège destination touristique majeure, fjords spectaculaires, montagnes magnifiques, Oslo dynamique. Processus simple.',
    '2-4 semaines', '120-200 EUR', '2200 EUR', '2700-3700 EUR', 'facile',
    ['Fjords spectaculaires', 'Montagnes magnifiques', 'Oslo dynamique', 'Aurores boréales', 'Nature'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'islande-visiteur', 'Islande', '🇮🇸', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Islande_2026.pdf',
    'Visa visiteur pour l\'Islande - Géothermie et glaciers',
    'Islande destination touristique majeure, géothermie unique, glaciers magnifiques, Reykjavik dynamique. Processus simple.',
    '2-4 semaines', '90-150 EUR', '2200 EUR', '2700-3700 EUR', 'facile',
    ['Géothermie unique', 'Glaciers magnifiques', 'Reykjavik dynamique', 'Aurores boréales', 'Nature'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'malte-visiteur', 'Malte', '🇲🇹', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Malte_2026.pdf',
    'Visa visiteur pour Malte - Île méditerranéenne',
    'Malte destination touristique majeure, île méditerranéenne, climat ensoleillé, plages magnifiques. Processus simple.',
    '2-4 semaines', '75-130 EUR', '1800 EUR', '2300-3200 EUR', 'facile',
    ['Île méditerranéenne', 'Climat ensoleillé', 'Plages magnifiques', 'Patrimoine', 'Eau cristalline'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'chypre-visiteur', 'Chypre', '🇨🇾', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Chypre_2026.pdf',
    'Visa visiteur pour Chypre - Île méditerranéenne',
    'Chypre destination touristique majeure, île méditerranéenne, climat chaud, plages dorées. Processus simple.',
    '2-4 semaines', '70-120 EUR', '1800 EUR', '2300-3200 EUR', 'facile',
    ['Île méditerranéenne', 'Climat chaud', 'Plages dorées', 'Patrimoine', 'Eau cristalline'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'croatie-visiteur', 'Croatie', '🇭🇷', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Croatie_2026.pdf',
    'Visa visiteur pour la Croatie - Côte dalmate',
    'Croatie destination touristique majeure, côte dalmate magnifique, îles pittoresques, Dubrovnik historique. Processus simple.',
    '2-4 semaines', '65-110 EUR', '1700 EUR', '2200-3100 EUR', 'facile',
    ['Côte dalmate magnifique', 'Îles pittoresques', 'Dubrovnik historique', 'Patrimoine', 'Mer cristalline'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'slovenie-visiteur', 'Slovénie', '🇸🇮', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Slovenie_2026.pdf',
    'Visa visiteur pour la Slovénie - Lacs et montagnes',
    'Slovénie destination touristique majeure, lacs magnifiques, montagnes verdoyantes, Ljubljana dynamique. Processus simple.',
    '2-4 semaines', '75-130 EUR', '1700 EUR', '2200-3100 EUR', 'facile',
    ['Lacs magnifiques', 'Montagnes verdoyantes', 'Ljubljana dynamique', 'Patrimoine', 'Nature'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'republique-tcheque-visiteur', 'Rép. Tchèque', '🇨🇿', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_RepubliqueTcheque_2026.pdf',
    'Visa visiteur pour la Rép. Tchèque - Prague et châteaux',
    'République Tchèque destination touristique majeure, Prague magnifique, châteaux historiques, culture riche. Processus simple.',
    '2-4 semaines', '65-110 EUR', '1600 EUR', '2100-3000 EUR', 'facile',
    ['Prague magnifique', 'Châteaux historiques', 'Culture riche', 'Patrimoine', 'Bière'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'hongrie-visiteur', 'Hongrie', '🇭🇺', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Hongrie_2026.pdf',
    'Visa visiteur pour la Hongrie - Budapest et thermes',
    'Hongrie destination touristique majeure, Budapest magnifique, thermes relaxants, culture riche. Processus simple.',
    '2-4 semaines', '65-110 EUR', '1600 EUR', '2100-3000 EUR', 'facile',
    ['Budapest magnifique', 'Thermes relaxants', 'Culture riche', 'Patrimoine', 'Danube'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'pologne-visiteur', 'Pologne', '🇵🇱', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Pologne_2026.pdf',
    'Visa visiteur pour la Pologne - Varsovie et patrimoine',
    'Pologne destination touristique majeure, Varsovie dynamique, patrimoine historique, culture riche. Processus simple.',
    '2-4 semaines', '65-110 EUR', '1600 EUR', '2100-3000 EUR', 'facile',
    ['Varsovie dynamique', 'Patrimoine historique', 'Culture riche', 'Patrimoine', 'Gastronomie'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'roumanie-visiteur', 'Roumanie', '🇷🇴', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Roumanie_2026.pdf',
    'Visa visiteur pour la Roumanie - Carpates et châteaux',
    'Roumanie destination touristique majeure, Carpates magnifiques, châteaux historiques, culture riche. Processus simple.',
    '2-4 semaines', '60-100 EUR', '1500 EUR', '2000-2900 EUR', 'facile',
    ['Carpates magnifiques', 'Châteaux historiques', 'Culture riche', 'Patrimoine', 'Nature'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'slovaquie-visiteur', 'Slovaquie', '🇸🇰', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Slovaquie_2026.pdf',
    'Visa visiteur pour la Slovaquie - Tatras et châteaux',
    'Slovaquie destination touristique majeure, Tatras magnifiques, châteaux historiques, Bratislava dynamique. Processus simple.',
    '2-4 semaines', '65-110 EUR', '1600 EUR', '2100-3000 EUR', 'facile',
    ['Tatras magnifiques', 'Châteaux historiques', 'Bratislava dynamique', 'Patrimoine', 'Nature'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'lettonie-visiteur', 'Lettonie', '🇱🇻', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Lettonie_2026.pdf',
    'Visa visiteur pour la Lettonie - Riga et nature',
    'Lettonie destination touristique majeure, Riga dynamique, nature sauvage, patrimoine historique. Processus simple.',
    '2-4 semaines', '60-100 EUR', '1500 EUR', '2000-2900 EUR', 'facile',
    ['Riga dynamique', 'Nature sauvage', 'Patrimoine historique', 'Accès UE', 'Côte'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'lituanie-visiteur', 'Lituanie', '🇱🇹', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Lituanie_2026.pdf',
    'Visa visiteur pour la Lituanie - Vilnius et patrimoine',
    'Lituanie destination touristique majeure, Vilnius dynamique, patrimoine historique, culture riche. Processus simple.',
    '2-4 semaines', '65-110 EUR', '1600 EUR', '2100-3000 EUR', 'facile',
    ['Vilnius dynamique', 'Patrimoine historique', 'Culture riche', 'Accès UE', 'Patrimoine'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'estonie-visiteur', 'Estonie', '🇪🇪', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Estonie_2026.pdf',
    'Visa visiteur pour l\'Estonie - Tallinn et îles',
    'Estonie destination touristique majeure, Tallinn historique, îles pittoresques, nature sauvage. Processus simple.',
    '2-4 semaines', '70-120 EUR', '1700 EUR', '2200-3100 EUR', 'facile',
    ['Tallinn historique', 'Îles pittoresques', 'Nature sauvage', 'Accès UE', 'Patrimoine'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'belgique-visiteur', 'Belgique', '🇧🇪', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Belgique_2026.pdf',
    'Visa visiteur pour la Belgique - Bruxelles et Bruges',
    'Belgique destination touristique majeure, Bruxelles dynamique, Bruges historique, chocolat renommé. Processus simple.',
    '2-4 semaines', '50-100 EUR', '1600 EUR', '2100-3000 EUR', 'facile',
    ['Bruxelles dynamique', 'Bruges historique', 'Chocolat renommé', 'Patrimoine', 'Gastronomie'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'luxembourg-visiteur', 'Luxembourg', '🇱🇺', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Luxembourg_2026.pdf',
    'Visa visiteur pour le Luxembourg - Châteaux et nature',
    'Luxembourg destination touristique majeure, châteaux historiques, nature magnifique, Luxembourg-Ville dynamique. Processus simple.',
    '2-4 semaines', '80-120 EUR', '1800 EUR', '2300-3200 EUR', 'facile',
    ['Châteaux historiques', 'Nature magnifique', 'Luxembourg-Ville dynamique', 'Patrimoine', 'Accès UE'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
  createCountry(
    'liechtenstein-visiteur', 'Liechtenstein', '🇱🇮', 'Europe', 'visiteur',
    '/manus-storage/3MTravel_VisaVisiteur_Liechtenstein_2026.pdf',
    'Visa visiteur pour le Liechtenstein - Alpes et châteaux',
    'Liechtenstein destination touristique majeure, Alpes magnifiques, châteaux historiques, nature exceptionnelle. Processus simple.',
    '2-4 semaines', '120-200 CHF', '2000 CHF', '2500-3500 CHF', 'facile',
    ['Alpes magnifiques', 'Châteaux historiques', 'Nature exceptionnelle', 'Patrimoine', 'Environnement'],
    ['Documents voyage', 'Demande visa', 'Entretien si nécessaire', 'Examen', 'Délivrance'],
    [
      { category: 'Identité', documents: ['Passeport valide 3 mois', 'Copie'] },
      { category: 'Voyage', documents: ['Réservation hôtel', 'Itinéraire', 'Billet avion', 'Assurance'] },
      { category: 'Financier', documents: ['Ressources', 'Relevés'] }
    ]
  ),
];

// Helper functions
export function getCountriesByType(type: 'travail' | 'etudes' | 'visiteur') {
  return procedures107Complete.filter(country => country.visaType === type);
}

export function getCountriesByRegion(region: string) {
  return procedures107Complete.filter(country => country.region === region);
}

export function searchCountries(query: string) {
  const lowerQuery = query.toLowerCase();
  return procedures107Complete.filter(country =>
    country.name.toLowerCase().includes(lowerQuery) ||
    country.region.toLowerCase().includes(lowerQuery) ||
    country.highlights.some(h => h.toLowerCase().includes(lowerQuery))
  );
}

export function getCountryById(id: string) {
  return procedures107Complete.find(country => country.id === id);
}

export function getComparisonData(countries: CountryProcedureComplete[]) {
  return countries.map(country => ({
    name: country.name,
    flag: country.flag,
    processingTime: country.processingTime,
    cost: country.cost,
    minSalary: country.minSalary,
    totalCost: country.totalCost,
    difficulty: country.difficulty,
    visaType: country.visaType,
    region: country.region
  }));
}

export function calculateTotalBudget(country: CountryProcedureComplete, servicesFee: number = 2500) {
  const costNum = parseInt(country.cost.split('-')[1] || country.cost.split('-')[0]);
  const totalCostNum = parseInt(country.totalCost?.split('-')[1] || '0');
  const total = costNum + totalCostNum + servicesFee;
  return total;
}
