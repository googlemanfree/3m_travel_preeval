import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Footer from '@/components/Footer';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { SummaryModal } from '@/components/SummaryModal';
import { CountryCard } from '@/components/CountryCard';

interface Resource {
  country: string;
  flag: string;
  file: string;
  type: string;
}

interface SummaryData {
  type: string;
  summary: string;
  requirements: string[];
  duration: string;
  processingTime: string;
  cost: string;
}

// Données des attractions touristiques
const ATTRACTIONS: Record<string, { name: string; icon: string; description: string }[]> = {
  'Allemagne': [
    { name: 'Porte de Brandebourg', icon: '🏛️', description: 'Monument emblématique de Berlin' },
    { name: 'Château de Neuschwanstein', icon: '🏰', description: 'Château de conte de fées en Bavière' },
    { name: 'Île des Musées', icon: '🎨', description: 'Complexe de 5 musées de classe mondiale' },
    { name: 'Forêt Noire', icon: '🌲', description: 'Région montagneuse pittoresque' },
  ],
  'Australie': [
    { name: 'Opéra de Sydney', icon: '🎭', description: 'Chef-d\'œuvre architectural' },
    { name: 'Grande Barrière de Corail', icon: '🪸', description: 'Plus grand récif corallien du monde' },
    { name: 'Uluru', icon: '🏜️', description: 'Monolithe sacré du désert rouge' },
    { name: 'Douze Apôtres', icon: '🪨', description: 'Formations rocheuses côtières spectaculaires' },
  ],
  'Canada': [
    { name: 'Chutes du Niagara', icon: '💧', description: 'Cascades majestueuses entre deux pays' },
    { name: 'Parc Banff', icon: '🏔️', description: 'Paysages montagneux époustouflants' },
    { name: 'Lac Louise', icon: '🏞️', description: 'Lac turquoise entouré de montagnes' },
    { name: 'CN Tower', icon: '🗼', description: 'Tour emblématique de Toronto' },
  ],
  'France': [
    { name: 'Tour Eiffel', icon: '🗼', description: 'Monument le plus iconique de Paris' },
    { name: 'Musée du Louvre', icon: '🎨', description: 'Plus grand musée d\'art du monde' },
    { name: 'Château de Versailles', icon: '👑', description: 'Palais royal somptueux' },
    { name: 'Mont-Saint-Michel', icon: '⛪', description: 'Abbaye sur îlot rocheux en Normandie' },
  ],
  'États-Unis': [
    { name: 'Statue de la Liberté', icon: '🗽', description: 'Symbole de liberté à New York' },
    { name: 'Grand Canyon', icon: '🏜️', description: 'Gorge spectaculaire en Arizona' },
    { name: 'Yellowstone', icon: '🌋', description: 'Premier parc national du monde' },
    { name: 'Hollywood', icon: '🎬', description: 'Cœur de l\'industrie cinématographique' },
  ],
  'Royaume-Uni': [
    { name: 'Big Ben', icon: '🕐', description: 'Tour de l\'horloge emblématique' },
    { name: 'Stonehenge', icon: '🪨', description: 'Monument préhistorique mystérieux' },
    { name: 'Palais de Buckingham', icon: '👑', description: 'Résidence officielle du monarque' },
    { name: 'Tower Bridge', icon: '🌉', description: 'Pont gothique iconique de Londres' },
  ],
  'Suisse': [
    { name: 'Cervin', icon: '⛰️', description: 'Montagne emblématique des Alpes' },
    { name: 'Lac Léman', icon: '🏞️', description: 'Lac alpin cristallin' },
    { name: 'Jungfrau', icon: '🏔️', description: 'Sommet des Alpes bernoises' },
    { name: 'Interlaken', icon: '🎿', description: 'Destination alpine de renommée mondiale' },
  ],
  'Nouvelle-Zélande': [
    { name: 'Milford Sound', icon: '🏞️', description: 'Fjord spectaculaire de Fiordland' },
    { name: 'Hobbiton', icon: '🎬', description: 'Décor du Seigneur des Anneaux' },
    { name: 'Geyser de Rotorua', icon: '🌋', description: 'Geysers géothermiques actifs' },
    { name: 'Baie des Îles', icon: '🌊', description: 'Archipel pittoresque du nord' },
  ],
  'Irlande': [
    { name: 'Falaises de Moher', icon: '🪨', description: 'Falaises côtières spectaculaires' },
    { name: 'Château de Blarney', icon: '🏰', description: 'Château historique avec la Pierre de Blarney' },
    { name: 'Anneau de Kerry', icon: '🚗', description: 'Route panoramique circulaire' },
    { name: 'Tombe de Newgrange', icon: '⛪', description: 'Monument mégalithique ancien' },
  ],
  'Italie': [
    { name: 'Colosseum', icon: '🏛️', description: 'Amphithéâtre romain antique' },
    { name: 'Basilique Saint-Pierre', icon: '⛪', description: 'Plus grande église du monde' },
    { name: 'Gondoles de Venise', icon: '🚤', description: 'Canaux romantiques et pittoresques' },
    { name: 'Tour de Pise', icon: '🗼', description: 'Tour penchée emblématique' },
  ],
  'Pologne': [
    { name: 'Château de Wawel', icon: '🏰', description: 'Résidence royale à Cracovie' },
    { name: 'Vieille Ville de Gdańsk', icon: '🏘️', description: 'Architecture hanséatique colorée' },
    { name: 'Auschwitz', icon: '🕯️', description: 'Site historique de mémoire' },
    { name: 'Parc Tatra', icon: '⛰️', description: 'Montagnes spectaculaires du sud' },
  ],
  'Portugal': [
    { name: 'Palais de Pena', icon: '👑', description: 'Palais romantique coloré' },
    { name: 'Monastère des Hiéronymites', icon: '⛪', description: 'Chef-d\'œuvre de l\'architecture manuéline' },
    { name: 'Falaises de l\'Algarve', icon: '🏖️', description: 'Plages dorées et falaises ocre' },
    { name: 'Librairie Lello', icon: '📚', description: 'Une des plus belles librairies du monde' },
  ],
  'Qatar': [
    { name: 'Musée d\'Art Islamique', icon: '🎨', description: 'Collection d\'art islamique exceptionnelle' },
    { name: 'Souq Waqif', icon: '🏪', description: 'Marché traditionnel animé' },
    { name: 'Corniche de Doha', icon: '🌊', description: 'Promenade côtière moderne' },
    { name: 'Désert du Qatar', icon: '🏜️', description: 'Safaris et dunes dorées' },
  ],
  'Malaisie': [
    { name: 'Petronas Twin Towers', icon: '🏢', description: 'Gratte-ciel emblématiques de Kuala Lumpur' },
    { name: 'Grottes de Batu', icon: '⛩️', description: 'Grottes sacrées hindoues' },
    { name: 'Îles Perhentian', icon: '🏝️', description: 'Paradis tropical avec plages immaculées' },
    { name: 'Forêt tropicale de Taman Negara', icon: '🌴', description: 'Jungle ancienne et biodiversité' },
  ],
  'Kenya': [
    { name: 'Safari du Serengeti', icon: '🦁', description: 'Migration annuelle des gnous' },
    { name: 'Mont Kenya', icon: '⛰️', description: 'Deuxième plus haute montagne d\'Afrique' },
    { name: 'Lac Nakuru', icon: '🦩', description: 'Lac alcalin avec flamants roses' },
    { name: 'Île de Lamu', icon: '🏝️', description: 'Île côtière avec architecture swahilie' },
  ],
  'Schengen': [
    { name: 'Alpes Européennes', icon: '⛰️', description: 'Chaîne montagneuse majeure' },
    { name: 'Côte Méditerranéenne', icon: '🏖️', description: 'Plages et villages côtiers pittoresques' },
    { name: 'Villes Historiques', icon: '🏰', description: 'Patrimoine architectural européen' },
    { name: 'Parcs Naturels', icon: '🌲', description: 'Réserves naturelles protégées' },
  ],
};

// Données des résumés
const SUMMARIES: Record<string, SummaryData> = {
  'Allemagne': {
    type: 'Visa Travail',
    summary: 'Le visa de travail allemand est destiné aux ressortissants étrangers souhaitant exercer une activité professionnelle en Allemagne. Les conditions principales incluent : une offre d\'emploi valide, une qualification professionnelle reconnue, et un salaire conforme aux normes allemandes. La durée du visa varie de 1 à 4 ans selon le contrat de travail. Les frais de visa sont d\'environ 75€. Le traitement prend généralement 4 à 8 semaines. Les conjoints et enfants peuvent être inclus dans la demande. L\'Allemagne offre un excellent marché du travail avec des opportunités dans les secteurs technologiques, industriels et de services.',
    requirements: ['Offre d\'emploi', 'Diplôme reconnu', 'Preuve financière', 'Assurance maladie', 'Contrat de travail'],
    duration: '1-4 ans',
    processingTime: '4-8 semaines',
    cost: '75€'
  },
  'Australie': {
    type: 'Visa Travail',
    summary: 'Le visa de travail australien (Skilled Migration Program) est destiné aux professionnels qualifiés. Les conditions incluent : une profession figurant sur la liste des compétences demandées, une évaluation professionnelle positive, et une maîtrise suffisante de l\'anglais. Le visa peut être temporaire (1-4 ans) ou permanent. Les frais varient de 3 000 à 4 500 AUD. Le traitement prend 3 à 12 mois selon le type de visa. L\'Australie offre un excellent cadre de vie et des opportunités professionnelles dans de nombreux secteurs.',
    requirements: ['Évaluation professionnelle', 'Test d\'anglais (IELTS)', 'Points suffisants', 'Preuve financière', 'Antécédents judiciaires'],
    duration: '1-4 ans ou permanent',
    processingTime: '3-12 mois',
    cost: '3 000-4 500 AUD'
  },
  'Canada': {
    type: 'Visa Travail',
    summary: 'Le Canada offre plusieurs programmes de travail : le Programme de l\'expérience québécoise, le Programme des travailleurs qualifiés, et les permis de travail temporaires. Les conditions varient selon le programme mais incluent généralement : une offre d\'emploi, une évaluation des compétences, et la maîtrise du français ou de l\'anglais. Les frais varient de 100 à 550 CAD. Le traitement prend 2 à 6 mois. Le Canada est très attractif pour les immigrants avec des perspectives de résidence permanente.',
    requirements: ['Offre d\'emploi', 'Évaluation des compétences', 'Test de langue', 'Preuve financière', 'Examen médical'],
    duration: '1-3 ans ou permanent',
    processingTime: '2-6 mois',
    cost: '100-550 CAD'
  },
  'France': {
    type: 'Visa Travail',
    summary: 'Le visa de travail français est destiné aux ressortissants étrangers ayant une offre d\'emploi en France. Les conditions incluent : une offre d\'emploi d\'une entreprise française, une qualification professionnelle appropriée, et une maîtrise suffisante du français. La durée du visa est généralement de 1 an, renouvelable. Les frais sont d\'environ 99€. Le traitement prend 4 à 6 semaines. La France offre un excellent système social et de nombreuses opportunités professionnelles.',
    requirements: ['Offre d\'emploi', 'Diplôme reconnu', 'Preuve financière', 'Assurance maladie', 'Contrat de travail'],
    duration: '1 an renouvelable',
    processingTime: '4-6 semaines',
    cost: '99€'
  },
  'États-Unis': {
    type: 'Visa Travail',
    summary: 'Le visa de travail américain (H-1B, L-1, O-1) est destiné aux professionnels qualifiés. Les conditions incluent : une offre d\'emploi d\'une entreprise américaine, une qualification professionnelle spécialisée, et un processus de certification du travail. Les frais varient de 190 à 460 USD. Le traitement prend 2 à 6 mois. Les États-Unis offrent des opportunités exceptionnelles dans les secteurs technologiques, financiers et professionnels.',
    requirements: ['Offre d\'emploi', 'Certification du travail', 'Qualification spécialisée', 'Preuve financière', 'Examen médical'],
    duration: '3-6 ans',
    processingTime: '2-6 mois',
    cost: '190-460 USD'
  },
  'Royaume-Uni': {
    type: 'Visa Travail',
    summary: 'Le visa de travail britannique (Skilled Worker Visa) est destiné aux professionnels qualifiés ayant une offre d\'emploi. Les conditions incluent : une offre d\'emploi d\'un employeur agréé, un salaire minimum requis, et une maîtrise suffisante de l\'anglais. La durée du visa est de 2 à 5 ans, renouvelable. Les frais sont d\'environ 719 GBP. Le traitement prend 3 à 8 semaines. Le Royaume-Uni offre un marché du travail dynamique et des perspectives de résidence permanente.',
    requirements: ['Offre d\'emploi', 'Employeur agréé', 'Salaire minimum', 'Test d\'anglais', 'Preuve financière'],
    duration: '2-5 ans renouvelable',
    processingTime: '3-8 semaines',
    cost: '719 GBP'
  },
  'Suisse': {
    type: 'Visa Travail',
    summary: 'Le visa de travail suisse est destiné aux professionnels qualifiés ayant une offre d\'emploi en Suisse. Les conditions incluent : une offre d\'emploi d\'une entreprise suisse, une qualification reconnue, et une maîtrise d\'une langue suisse. La durée du visa varie de 1 à 5 ans selon le contrat. Les frais sont d\'environ 120 CHF. Le traitement prend 2 à 4 semaines. La Suisse offre des salaires élevés et une excellente qualité de vie.',
    requirements: ['Offre d\'emploi', 'Diplôme reconnu', 'Preuve financière', 'Assurance maladie', 'Maîtrise de la langue'],
    duration: '1-5 ans',
    processingTime: '2-4 semaines',
    cost: '120 CHF'
  },
  'Nouvelle-Zélande': {
    type: 'Visa Travail',
    summary: 'Le visa de travail néo-zélandais est destiné aux professionnels qualifiés. Les conditions incluent : une profession demandée, une évaluation professionnelle positive, et une maîtrise suffisante de l\'anglais. Le visa peut être temporaire (1-3 ans) ou permanent. Les frais varient de 2 500 à 3 500 NZD. Le traitement prend 2 à 8 mois. La Nouvelle-Zélande offre un excellent environnement de travail et des perspectives de résidence permanente.',
    requirements: ['Évaluation professionnelle', 'Test d\'anglais', 'Points suffisants', 'Preuve financière', 'Antécédents judiciaires'],
    duration: '1-3 ans ou permanent',
    processingTime: '2-8 mois',
    cost: '2 500-3 500 NZD'
  },
  'Irlande': {
    type: 'Visa Travail',
    summary: 'Le visa de travail irlandais est destiné aux professionnels qualifiés ayant une offre d\'emploi. Les conditions incluent : une offre d\'emploi d\'une entreprise irlandaise, une qualification appropriée, et une maîtrise suffisante de l\'anglais. La durée du visa est de 1 à 2 ans, renouvelable. Les frais sont d\'environ 300€. Le traitement prend 2 à 4 semaines. L\'Irlande offre un marché du travail dynamique, notamment dans les secteurs technologiques et financiers.',
    requirements: ['Offre d\'emploi', 'Diplôme reconnu', 'Preuve financière', 'Assurance maladie', 'Maîtrise de l\'anglais'],
    duration: '1-2 ans renouvelable',
    processingTime: '2-4 semaines',
    cost: '300€'
  },
  'Italie': {
    type: 'Visa Travail',
    summary: 'Le visa de travail italien est destiné aux ressortissants étrangers ayant une offre d\'emploi en Italie. Les conditions incluent : une offre d\'emploi d\'une entreprise italienne, une qualification professionnelle, et une maîtrise suffisante de l\'italien ou de l\'anglais. La durée du visa varie de 1 à 2 ans. Les frais sont d\'environ 50€. Le traitement prend 4 à 8 semaines. L\'Italie offre une riche culture et des opportunités dans le tourisme, la mode et l\'industrie.',
    requirements: ['Offre d\'emploi', 'Diplôme reconnu', 'Preuve financière', 'Assurance maladie', 'Contrat de travail'],
    duration: '1-2 ans',
    processingTime: '4-8 semaines',
    cost: '50€'
  },
  'Pologne': {
    type: 'Visa Travail',
    summary: 'Le visa de travail polonais est destiné aux professionnels qualifiés ayant une offre d\'emploi. Les conditions incluent : une offre d\'emploi d\'une entreprise polonaise, une qualification appropriée, et une maîtrise suffisante du polonais ou de l\'anglais. La durée du visa varie de 1 à 3 ans. Les frais sont d\'environ 40€. Le traitement prend 2 à 4 semaines. La Pologne offre des opportunités croissantes dans les secteurs technologiques et industriels.',
    requirements: ['Offre d\'emploi', 'Diplôme reconnu', 'Preuve financière', 'Assurance maladie', 'Contrat de travail'],
    duration: '1-3 ans',
    processingTime: '2-4 semaines',
    cost: '40€'
  },
  'Portugal': {
    type: 'Visa Travail',
    summary: 'Le visa de travail portugais est destiné aux professionnels qualifiés ayant une offre d\'emploi. Les conditions incluent : une offre d\'emploi d\'une entreprise portugaise, une qualification appropriée, et une maîtrise suffisante du portugais ou de l\'anglais. La durée du visa varie de 1 à 2 ans. Les frais sont d\'environ 75€. Le traitement prend 3 à 6 semaines. Le Portugal offre un coût de vie avantageux et des opportunités dans le tourisme et la technologie.',
    requirements: ['Offre d\'emploi', 'Diplôme reconnu', 'Preuve financière', 'Assurance maladie', 'Contrat de travail'],
    duration: '1-2 ans',
    processingTime: '3-6 semaines',
    cost: '75€'
  },
  'Qatar': {
    type: 'Visa Travail',
    summary: 'Le visa de travail qatari est destiné aux professionnels qualifiés ayant une offre d\'emploi. Les conditions incluent : une offre d\'emploi d\'une entreprise qatarie, une qualification appropriée, et une maîtrise suffisante de l\'anglais. La durée du visa varie de 2 à 5 ans. Les frais sont d\'environ 100 QAR. Le traitement prend 2 à 4 semaines. Le Qatar offre des salaires élevés et des opportunités dans l\'énergie, la construction et les services.',
    requirements: ['Offre d\'emploi', 'Examen médical', 'Preuve financière', 'Assurance maladie', 'Contrat de travail'],
    duration: '2-5 ans',
    processingTime: '2-4 semaines',
    cost: '100 QAR'
  },
  'Malaisie': {
    type: 'Visa Travail',
    summary: 'Le visa de travail malais est destiné aux professionnels qualifiés ayant une offre d\'emploi. Les conditions incluent : une offre d\'emploi d\'une entreprise malaise, une qualification appropriée, et une maîtrise suffisante de l\'anglais. La durée du visa varie de 1 à 2 ans. Les frais sont d\'environ 200 MYR. Le traitement prend 2 à 4 semaines. La Malaisie offre un coût de vie avantageux et des opportunités dans la technologie et les services.',
    requirements: ['Offre d\'emploi', 'Diplôme reconnu', 'Preuve financière', 'Assurance maladie', 'Contrat de travail'],
    duration: '1-2 ans',
    processingTime: '2-4 semaines',
    cost: '200 MYR'
  },
  'Kenya': {
    type: 'Visa Travail',
    summary: 'Le visa de travail kényan est destiné aux professionnels qualifiés ayant une offre d\'emploi. Les conditions incluent : une offre d\'emploi d\'une entreprise kényan, une qualification appropriée, et une maîtrise suffisante de l\'anglais. La durée du visa varie de 1 à 2 ans. Les frais sont d\'environ 50 000 KES. Le traitement prend 2 à 4 semaines. Le Kenya offre des opportunités dans le tourisme, l\'agriculture et les services.',
    requirements: ['Offre d\'emploi', 'Diplôme reconnu', 'Preuve financière', 'Assurance maladie', 'Contrat de travail'],
    duration: '1-2 ans',
    processingTime: '2-4 semaines',
    cost: '50 000 KES'
  },
  'Schengen': {
    type: 'Visa Visiteur',
    summary: 'Le visa Schengen est destiné aux visiteurs souhaitant voyager dans l\'espace Schengen (26 pays européens). Les conditions incluent : un passeport valide, une preuve de moyens financiers, une assurance voyage, et l\'absence d\'antécédents judiciaires. La durée du visa est généralement de 90 jours sur 180 jours. Les frais sont d\'environ 80€. Le traitement prend 2 à 4 semaines. L\'espace Schengen offre une mobilité exceptionnelle en Europe.',
    requirements: ['Passeport valide', 'Preuve financière', 'Assurance voyage', 'Billet de retour', 'Justificatif d\'hébergement'],
    duration: '90 jours sur 180 jours',
    processingTime: '2-4 semaines',
    cost: '80€'
  },
  'Canada_Visiteur': {
    type: 'Visa Visiteur',
    summary: 'Le visa de visiteur canadien est destiné aux touristes et visiteurs souhaitant visiter le Canada. Les conditions incluent : un passeport valide, une preuve de moyens financiers, une assurance voyage, et l\'absence d\'antécédents judiciaires. La durée du visa est généralement de 6 mois. Les frais sont d\'environ 100 CAD. Le traitement prend 2 à 4 semaines. Le Canada offre des paysages magnifiques et une riche culture.',
    requirements: ['Passeport valide', 'Preuve financière', 'Assurance voyage', 'Billet de retour', 'Justificatif d\'hébergement'],
    duration: '6 mois',
    processingTime: '2-4 semaines',
    cost: '100 CAD'
  },
  'Australie_Visiteur': {
    type: 'Visa Visiteur',
    summary: 'Le visa de visiteur australien est destiné aux touristes et visiteurs souhaitant visiter l\'Australie. Les conditions incluent : un passeport valide, une preuve de moyens financiers, une assurance voyage, et l\'absence d\'antécédents judiciaires. La durée du visa est généralement de 3 à 12 mois. Les frais sont d\'environ 20 AUD. Le traitement prend 1 à 3 jours. L\'Australie offre des paysages spectaculaires et une riche faune.',
    requirements: ['Passeport valide', 'Preuve financière', 'Assurance voyage', 'Billet de retour', 'Justificatif d\'hébergement'],
    duration: '3-12 mois',
    processingTime: '1-3 jours',
    cost: '20 AUD'
  }
};

const ProceduresResources = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<{ country: string; flag: string; data: SummaryData } | null>(null);

  // Données des ressources
  const resourceTypes = [
    { id: 'all', label: 'Tous les documents', count: 107 },
    { id: 'visa_travail', label: 'Visa Travail', count: 34, color: 'bg-blue-50 border-blue-200' },
    { id: 'visa_etudes', label: 'Visa Études', count: 22, color: 'bg-green-50 border-green-200' },
    { id: 'visa_visiteur', label: 'Visa Visiteur', count: 27, color: 'bg-purple-50 border-purple-200' },
    { id: 'guides', label: 'Guides Spécialisés', count: 23, color: 'bg-orange-50 border-orange-200' },
  ];

  const resources: Resource[] = [
    // Visa Travail
    { country: 'Allemagne', flag: '🇩🇪', file: '3MTravel_VisaTravail_Allemagne_2026_64549fc5.docx', type: 'visa_travail' },
    { country: 'Australie', flag: '🇦🇺', file: '3MTravel_VisaTravail_Australie_2026_916008e9.pdf', type: 'visa_travail' },
    { country: 'Canada', flag: '🍁', file: '3MTravel_VisaTravail_Canada_Complet_2026_6ddf7e2c.pdf', type: 'visa_travail' },
    { country: 'France', flag: '🇫🇷', file: '3MTravel_VisaTravail_France_2026_65fca802.pdf', type: 'visa_travail' },
    { country: 'États-Unis', flag: '🇺🇸', file: '3MTravel_VisaTravail_EtatsUnis_2026_bc1ac42d.pdf', type: 'visa_travail' },
    { country: 'Royaume-Uni', flag: '🇬🇧', file: '3MTravel_VisaTravail_RoyaumeUni_2026_d17acd9e.pdf', type: 'visa_travail' },
    { country: 'Suisse', flag: '🇨🇭', file: '3MTravel_VisaTravail_Suisse_2026_5f00cf79.docx', type: 'visa_travail' },
    { country: 'Nouvelle-Zélande', flag: '🇳🇿', file: '3MTravel_VisaTravail_NouvelleZelande_2026_6faad320.pdf', type: 'visa_travail' },
    { country: 'Irlande', flag: '🇮🇪', file: '3MTravel_VisaTravail_Irlande_2026_1612755f.docx', type: 'visa_travail' },
    { country: 'Italie', flag: '🇮🇹', file: '3MTravel_VisaTravail_Italie_Complet_3M_FCFA_2026_4afb5c71.docx', type: 'visa_travail' },
    { country: 'Pologne', flag: '🇵🇱', file: '3MTravel_VisaTravail_Pologne_2026_d7fe44ee.pdf', type: 'visa_travail' },
    { country: 'Portugal', flag: '🇵🇹', file: '3MTravel_VisaTravail_Portugal_2026_8608abfa.pdf', type: 'visa_travail' },
    { country: 'Qatar', flag: '🇶🇦', file: '3MTravel_VisaTravail_Qatar_2026_5de645a8.pdf', type: 'visa_travail' },
    { country: 'Malaisie', flag: '🇲🇾', file: '3MTravel_VisaTravail_Malaisie_2026_d55d0436.docx', type: 'visa_travail' },
    { country: 'Kenya', flag: '🇰🇪', file: '3MTravel_VisaTravail_Kenya_2026_36500e5d.docx', type: 'visa_travail' },
    // Visa Études
    { country: 'France', flag: '🇫🇷', file: '3MTravel_VisaEtudes_France_2026.pdf', type: 'visa_etudes' },
    { country: 'Canada', flag: '🍁', file: '3MTravel_VisaEtudes_Canada_2026.pdf', type: 'visa_etudes' },
    { country: 'Australie', flag: '🇦🇺', file: '3MTravel_VisaEtudes_Australie_2026.pdf', type: 'visa_etudes' },
    { country: 'Royaume-Uni', flag: '🇬🇧', file: '3MTravel_VisaEtudes_RoyaumeUni_2026.pdf', type: 'visa_etudes' },
    { country: 'États-Unis', flag: '🇺🇸', file: '3MTravel_VisaEtudes_EtatsUnis_2026.pdf', type: 'visa_etudes' },
    // Visa Visiteur
    { country: 'Schengen', flag: '🇪🇺', file: '3MTravel_VisaVisiteur_Schengen_2026.pdf', type: 'visa_visiteur' },
    { country: 'Canada', flag: '🍁', file: '3MTravel_VisaVisiteur_Canada_2026.pdf', type: 'visa_visiteur' },
    { country: 'Australie', flag: '🇦🇺', file: '3MTravel_VisaVisiteur_Australie_2026.pdf', type: 'visa_visiteur' },
  ];

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch = resource.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || resource.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [searchTerm, selectedType]);

  const getTypeColor = (type: string) => {
    const typeObj = resourceTypes.find(t => t.id === type);
    return typeObj?.color || 'bg-gray-50 border-gray-200';
  };

  const getTypeLabel = (type: string) => {
    const typeObj = resourceTypes.find(t => t.id === type);
    return typeObj?.label || type;
  };

  const handlePreview = (fileName: string) => {
    setPreviewFileName(fileName);
    setPreviewPdfUrl(`/manus-storage/${fileName}`);
    setIsPreviewOpen(true);
  };

  const handleViewSummary = (country: string, flag: string) => {
    const summaryData = SUMMARIES[country];
    if (summaryData) {
      setSelectedSummary({ country, flag, data: summaryData });
      setSummaryOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a2540] via-white to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0a2540] to-[#1a3a5c] text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">📚 Procédures & Guides Visa</h1>
          <p className="text-lg text-blue-100 mb-8">
            Accédez à notre bibliothèque complète de <strong>107 guides officiels</strong> pour vos demandes de visa vers le monde entier.
          </p>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher un pays (ex: Canada, France, Australie)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-3 rounded-lg text-gray-900 w-full"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Filter Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#0a2540]">Filtrer par type</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
          </div>

          {/* Filter Buttons */}
          <div className={`grid grid-cols-2 md:grid-cols-5 gap-3 ${showFilters ? 'block' : 'hidden md:grid'}`}>
            {resourceTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  selectedType === type.id
                    ? 'bg-[#0a2540] text-white border-[#0a2540]'
                    : 'bg-white text-[#0a2540] border-gray-200 hover:border-[#0a2540]'
                }`}
              >
                <div className="font-bold">{type.label}</div>
                <div className="text-xs opacity-75">{type.count} docs</div>
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-[#0a2540] font-medium">
            {filteredResources.length} document{filteredResources.length !== 1 ? 's' : ''} trouvé{filteredResources.length !== 1 ? 's' : ''}
            {selectedType !== 'all' && ` • Type: ${getTypeLabel(selectedType)}`}
            {searchTerm && ` • Recherche: "${searchTerm}"`}
          </p>
        </div>

        {/* Resources Grid */}
        {filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource, index) => (
              <CountryCard
                key={index}
                country={resource.country}
                flagEmoji={resource.flag}
                capital="Capitale"
                type={getTypeLabel(resource.type)}
                typeColor={getTypeColor(resource.type)}
                onViewSummary={() => handleViewSummary(resource.country, resource.flag)}
                onPreview={() => handlePreview(resource.file)}
                onDownload={() => {
                  const link = document.createElement('a');
                  link.href = `/manus-storage/${resource.file}`;
                  link.download = resource.file;
                  link.click();
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">Aucun document trouvé</p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
              }}
              variant="outline"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
            viewport={{ once: true }}
            className="p-6 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">📖</div>
            <h3 className="font-bold text-[#0a2540] mb-2">107 Destinations</h3>
            <p className="text-sm text-gray-600">Guides pour tous les pays et régions du monde</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="p-6 bg-green-50 rounded-lg border border-green-200 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">✅</div>
            <h3 className="font-bold text-[#0a2540] mb-2">À Jour 2026</h3>
            <p className="text-sm text-gray-600">Tous les documents sont mis à jour régulièrement</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="p-6 bg-purple-50 rounded-lg border border-purple-200 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-bold text-[#0a2540] mb-2">Gratuit</h3>
            <p className="text-sm text-gray-600">Téléchargez tous les guides gratuitement</p>
          </motion.div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 p-8 bg-gradient-to-r from-[#0a2540] to-[#1a3a5c] text-white rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-4">Besoin d'aide pour votre demande ?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Nos experts sont disponibles pour vous accompagner dans votre démarche de visa. Contactez-nous pour une consultation gratuite.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/237698104832"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-[#0a2540] rounded-lg font-bold hover:bg-blue-50 transition-colors"
            >
              💬 Contacter sur WhatsApp
            </a>
            <a
              href="/evaluation"
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors"
            >
              ⭐ Évaluation Gratuite
            </a>
          </div>
        </div>
      </div>

      <PDFPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfUrl={previewPdfUrl || ''}
        fileName={previewFileName}
        downloadUrl={`/manus-storage/${previewFileName}`}
      />
      {selectedSummary && (
        <SummaryModal
          isOpen={summaryOpen}
          onClose={() => setSummaryOpen(false)}
          country={selectedSummary.country}
          flag={selectedSummary.flag}
          summary={selectedSummary.data}
          attractions={ATTRACTIONS[selectedSummary.country] || []}
        />
      )}
      <Footer />
    </div>
  );
};

export default ProceduresResources;
