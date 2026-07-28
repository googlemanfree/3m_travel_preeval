/**
 * Page Comparateur de Destinations
 * Permet aux utilisateurs de comparer différentes destinations selon leurs critères
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, TrendingUp, MapPin, DollarSign, Users, Briefcase, GraduationCap, Heart } from 'lucide-react';
import { ScrollAnimationWrapper, ScrollAnimationGrid } from '@/components/ScrollAnimationWrapper';

interface Destination {
  id: string;
  name: string;
  icon: string;
  costOfLiving: number; // 1-5
  jobMarket: number; // 1-5
  education: number; // 1-5
  qualityOfLife: number; // 1-5
  visaDifficulty: number; // 1-5 (5 = difficile)
  population: string;
  currency: string;
  language: string;
  climate: string;
  description: string;
  advantages: string[];
  challenges: string[];
}

const DESTINATIONS: Destination[] = [
  {
    id: 'canada',
    name: 'Canada',
    icon: '🍁',
    costOfLiving: 4,
    jobMarket: 4,
    education: 5,
    qualityOfLife: 5,
    visaDifficulty: 3,
    population: '39M',
    currency: 'CAD',
    language: 'Anglais/Français',
    climate: 'Continental',
    description: 'Destination privilégiée pour l\'immigration avec excellentes opportunités',
    advantages: ['Système d\'immigration clair', 'Excellentes universités', 'Marché du travail dynamique', 'Qualité de vie élevée'],
    challenges: ['Coût de la vie élevé', 'Climat rigoureux', 'Compétition forte', 'Processus long'],
  },
  {
    id: 'australia',
    name: 'Australie',
    icon: '🦘',
    costOfLiving: 4,
    jobMarket: 4,
    education: 5,
    qualityOfLife: 5,
    visaDifficulty: 4,
    population: '26M',
    currency: 'AUD',
    language: 'Anglais',
    climate: 'Tropical/Tempéré',
    description: 'Opportunités exceptionnelles pour les travailleurs qualifiés',
    advantages: ['Salaires élevés', 'Qualité de vie excellente', 'Stabilité économique', 'Système de points'],
    challenges: ['Isolement géographique', 'Visa difficile', 'Coût de la vie très élevé', 'Éloignement'],
  },
  {
    id: 'germany',
    name: 'Allemagne',
    icon: '🍺',
    costOfLiving: 3,
    jobMarket: 4,
    education: 5,
    qualityOfLife: 4,
    visaDifficulty: 2,
    population: '84M',
    currency: 'EUR',
    language: 'Allemand',
    climate: 'Tempéré',
    description: 'Leader européen pour l\'emploi et l\'éducation',
    advantages: ['Économie forte', 'Universités gratuites', 'Marché du travail dynamique', 'Visa facilité'],
    challenges: ['Langue difficile', 'Bureaucratie', 'Hiver long', 'Intégration'],
  },
  {
    id: 'uk',
    name: 'Royaume-Uni',
    icon: '🇬🇧',
    costOfLiving: 4,
    jobMarket: 4,
    education: 5,
    qualityOfLife: 4,
    visaDifficulty: 3,
    population: '68M',
    currency: 'GBP',
    language: 'Anglais',
    climate: 'Tempéré',
    description: 'Centre mondial de l\'éducation et de la finance',
    advantages: ['Universités prestigieuses', 'Marché du travail international', 'Langue anglaise', 'Diversité'],
    challenges: ['Coût de la vie très élevé', 'Visa restrictif', 'Post-Brexit complexité', 'Compétition'],
  },
  {
    id: 'singapore',
    name: 'Singapour',
    icon: '🏙️',
    costOfLiving: 4,
    jobMarket: 5,
    education: 4,
    qualityOfLife: 5,
    visaDifficulty: 4,
    population: '5.9M',
    currency: 'SGD',
    language: 'Anglais/Mandarin',
    climate: 'Tropical',
    description: 'Hub économique asiatique avec opportunités exceptionnelles',
    advantages: ['Salaires très élevés', 'Stabilité politique', 'Multilingue', 'Efficacité'],
    challenges: ['Très compétitif', 'Visa difficile', 'Coût de la vie élevé', 'Espace limité'],
  },
  {
    id: 'france',
    name: 'France',
    icon: '🗼',
    costOfLiving: 3,
    jobMarket: 3,
    education: 4,
    qualityOfLife: 5,
    visaDifficulty: 3,
    population: '68M',
    currency: 'EUR',
    language: 'Français',
    climate: 'Tempéré',
    description: 'Qualité de vie exceptionnelle et culture riche',
    advantages: ['Qualité de vie', 'Système de santé', 'Culture', 'Gastronomie'],
    challenges: ['Langue obligatoire', 'Marché du travail compétitif', 'Bureaucratie', 'Chômage'],
  },
];

const CRITERIA = [
  { key: 'costOfLiving', label: 'Coût de la vie', icon: DollarSign },
  { key: 'jobMarket', label: 'Marché du travail', icon: Briefcase },
  { key: 'education', label: 'Éducation', icon: GraduationCap },
  { key: 'qualityOfLife', label: 'Qualité de vie', icon: Heart },
];

export default function DestinationComparator() {
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(['canada', 'australia']);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>(['costOfLiving', 'jobMarket', 'education']);

  const toggleDestination = (id: string) => {
    setSelectedDestinations((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleCriteria = (key: string) => {
    setSelectedCriteria((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const getDestinationsByIds = (ids: string[]) =>
    DESTINATIONS.filter((d) => ids.includes(d.id));

  const selectedDestinationObjects = getDestinationsByIds(selectedDestinations);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <ScrollAnimationWrapper animation="slideUp" duration={0.7}>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Comparateur de Destinations
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comparez les destinations selon vos critères personnels. Sélectionnez les pays et les critères qui vous intéressent.
            </p>
          </div>
        </ScrollAnimationWrapper>

        {/* Destination Selection */}
        <ScrollAnimationWrapper animation="slideUp" duration={0.7} delay={0.1}>
          <Card className="p-8 mb-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sélectionnez les destinations</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {DESTINATIONS.map((destination) => (
                <motion.button
                  key={destination.id}
                  onClick={() => toggleDestination(destination.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedDestinations.includes(destination.id)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{destination.icon}</div>
                  <div className="text-sm font-semibold text-gray-900">{destination.name}</div>
                </motion.button>
              ))}
            </div>
          </Card>
        </ScrollAnimationWrapper>

        {/* Criteria Selection */}
        <ScrollAnimationWrapper animation="slideUp" duration={0.7} delay={0.15}>
          <Card className="p-8 mb-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sélectionnez les critères</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CRITERIA.map(({ key, label, icon: Icon }) => (
                <motion.button
                  key={key}
                  onClick={() => toggleCriteria(key)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    selectedCriteria.includes(key)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold text-gray-900">{label}</span>
                </motion.button>
              ))}
            </div>
          </Card>
        </ScrollAnimationWrapper>

        {/* Comparison Table */}
        {selectedDestinationObjects.length > 0 && (
          <ScrollAnimationWrapper animation="slideUp" duration={0.7} delay={0.2}>
            <Card className="p-8 shadow-lg overflow-x-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Comparaison</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-bold text-gray-900">Destination</th>
                    {selectedCriteria.map((key) => {
                      const criterion = CRITERIA.find((c) => c.key === key);
                      return (
                        <th key={key} className="text-center py-4 px-4 font-bold text-gray-900">
                          {criterion?.label}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {selectedDestinationObjects.map((destination) => (
                    <motion.tr
                      key={destination.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{destination.icon}</span>
                          <div>
                            <div className="font-bold text-gray-900">{destination.name}</div>
                            <div className="text-xs text-gray-500">{destination.population}</div>
                          </div>
                        </div>
                      </td>
                      {selectedCriteria.map((key) => {
                        const value = destination[key as keyof Destination] as number;
                        return (
                          <td key={key} className="text-center py-4 px-4">
                            <div className="flex items-center justify-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < value ? 'bg-blue-600' : 'bg-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{value}/5</div>
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </ScrollAnimationWrapper>
        )}

        {/* Destination Details */}
        {selectedDestinationObjects.length > 0 && (
          <ScrollAnimationGrid
            animation="slideUp"
            columns={selectedDestinationObjects.length === 1 ? 1 : 2}
            className="mt-12"
            containerDelay={0.25}
          >
            {selectedDestinationObjects.map((destination) => (
              <Card key={destination.id} className="p-6 shadow-lg">
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-5xl">{destination.icon}</span>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{destination.name}</h3>
                    <p className="text-gray-600">{destination.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">Langue</div>
                    <div className="text-sm font-bold text-gray-900">{destination.language}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">Climat</div>
                    <div className="text-sm font-bold text-gray-900">{destination.climate}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">Devise</div>
                    <div className="text-sm font-bold text-gray-900">{destination.currency}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase">Population</div>
                    <div className="text-sm font-bold text-gray-900">{destination.population}</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">Avantages</h4>
                  <ul className="space-y-2">
                    {destination.advantages.map((adv) => (
                      <li key={adv} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3">Défis</h4>
                  <ul className="space-y-2">
                    {destination.challenges.map((challenge) => (
                      <li key={challenge} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-orange-600 mt-1">⚠</span>
                        <span>{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors">
                  En savoir plus
                </Button>
              </Card>
            ))}
          </ScrollAnimationGrid>
        )}

        {/* CTA */}
        <ScrollAnimationWrapper animation="slideUp" duration={0.7} delay={0.3} className="mt-12">
          <Card className="p-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Besoin d'aide pour choisir ?</h2>
            <p className="mb-6 text-blue-100">
              Nos experts peuvent vous aider à trouver la destination idéale selon votre profil et vos objectifs.
            </p>
            <Button className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-3 rounded-lg transition-colors">
              Consulter un expert
            </Button>
          </Card>
        </ScrollAnimationWrapper>
      </div>
    </div>
  );
}
