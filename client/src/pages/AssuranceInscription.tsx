import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ChevronRight, Globe, Shield, Plane } from 'lucide-react';

interface InsurancePricing {
  period: string;
  ageGroup0_65: number;
  ageGroupAbove65: number;
}

const INSURANCE_TARIFFS: InsurancePricing[] = [
  { period: '7 jours', ageGroup0_65: 18000, ageGroupAbove65: 26000 },
  { period: '10 jours', ageGroup0_65: 19000, ageGroupAbove65: 29000 },
  { period: '15 jours', ageGroup0_65: 21000, ageGroupAbove65: 31000 },
  { period: '21 jours', ageGroup0_65: 25000, ageGroupAbove65: 38000 },
  { period: '30 jours', ageGroup0_65: 32000, ageGroupAbove65: 45000 },
  { period: '60 jours', ageGroup0_65: 44000, ageGroupAbove65: 64000 },
  { period: '90 jours', ageGroup0_65: 54000, ageGroupAbove65: 75000 },
  { period: '180 jours', ageGroup0_65: 65000, ageGroupAbove65: 85000 },
  { period: '270 jours', ageGroup0_65: 70000, ageGroupAbove65: 98000 },
  { period: '365 jours', ageGroup0_65: 75000, ageGroupAbove65: 104000 },
];

const COUNTRIES = [
  { name: 'Canada', emoji: '🇨🇦' },
  { name: 'France', emoji: '🇫🇷' },
  { name: 'Allemagne', emoji: '🇩🇪' },
  { name: 'Belgique', emoji: '🇧🇪' },
  { name: 'Dubaï', emoji: '🇦🇪' },
  { name: 'Royaume-Uni', emoji: '🇬🇧' },
  { name: 'Australie', emoji: '🇦🇺' },
  { name: 'Suisse', emoji: '🇨🇭' },
  { name: 'Pays-Bas', emoji: '🇳🇱' },
  { name: 'Espagne', emoji: '🇪🇸' },
  { name: 'Italie', emoji: '🇮🇹' },
  { name: 'Portugal', emoji: '🇵🇹' },
];

export default function AssuranceInscription() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedAge, setSelectedAge] = useState<'0_65' | 'above65'>('0_65');

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Assurance Voyage
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sélectionnez votre destination et découvrez nos tarifs transparents
          </p>
        </motion.div>
      </section>

      {/* Country Selection */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Choisissez votre destination
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {COUNTRIES.map((country, index) => (
              <motion.button
                key={country.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCountrySelect(country.name)}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  selectedCountry === country.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-3xl mb-2">{country.emoji}</div>
                <div className="text-sm font-medium text-gray-900">
                  {country.name}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      {selectedCountry && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="py-12 px-4"
        >
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Tarifs pour {selectedCountry}
              </h2>
              
              {/* Age Group Selection */}
              <div className="flex gap-4 mb-8">
                <button
                  onClick={() => setSelectedAge('0_65')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    selectedAge === '0_65'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  0-65 ans
                </button>
                <button
                  onClick={() => setSelectedAge('above65')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    selectedAge === 'above65'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Plus de 65 ans
                </button>
              </div>
            </div>

            {/* Pricing Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border border-blue-700 px-4 py-3 text-left font-semibold">
                      Durée
                    </th>
                    <th className="border border-blue-700 px-4 py-3 text-center font-semibold">
                      Tarif (FCFA)
                    </th>
                    <th className="border border-blue-700 px-4 py-3 text-center font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {INSURANCE_TARIFFS.map((tariff, index) => {
                    const price =
                      selectedAge === '0_65'
                        ? tariff.ageGroup0_65
                        : tariff.ageGroupAbove65;
                    return (
                      <motion.tr
                        key={tariff.period}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                      >
                        <td className="border border-gray-200 px-4 py-3 font-medium text-gray-900">
                          {tariff.period}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center font-bold text-blue-600">
                          {price.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const message = `Bonjour, je souhaite souscrire une assurance voyage pour ${selectedCountry} - Durée: ${tariff.period} - Groupe d'âge: ${selectedAge === '0_65' ? '0-65 ans' : 'Plus de 65 ans'} - Tarif: ${price.toLocaleString('fr-FR')} FCFA`;
                              const whatsappUrl = `https://wa.me/237698104832?text=${encodeURIComponent(message)}`;
                              window.open(whatsappUrl, '_blank');
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                          >
                            <Plane size={16} />
                            Souscrire
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="p-6 border-l-4 border-l-blue-600">
                <div className="flex items-start gap-4">
                  <Shield className="text-blue-600 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Couverture Complète
                    </h3>
                    <p className="text-sm text-gray-600">
                      Frais médicaux jusqu'à 30 000 € et rapatriement inclus
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-l-4 border-l-green-600">
                <div className="flex items-start gap-4">
                  <Globe className="text-green-600 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Tous les Pays
                    </h3>
                    <p className="text-sm text-gray-600">
                      Assurance valide dans 195 pays du monde
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-l-4 border-l-orange-600">
                <div className="flex items-start gap-4">
                  <Plane className="text-orange-600 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Souscription Rapide
                    </h3>
                    <p className="text-sm text-gray-600">
                      Attestation reçue en moins de 24 heures
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </motion.section>
      )}

      {/* CTA Section */}
      {!selectedCountry && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="py-12 px-4 text-center"
        >
          <p className="text-gray-600 text-lg">
            Sélectionnez une destination pour voir les tarifs
          </p>
        </motion.section>
      )}

      {/* Footer CTA */}
      <section className="py-12 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Besoin d'aide ?
          </h2>
          <p className="text-blue-100 mb-8">
            Nos experts sont disponibles pour répondre à vos questions
          </p>
          <Button
            onClick={() => {
              const message = 'Bonjour, j\'aurais besoin d\'aide pour choisir mon assurance voyage.';
              const whatsappUrl = `https://wa.me/237698104832?text=${encodeURIComponent(message)}`;
              window.open(whatsappUrl, '_blank');
            }}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 rounded-lg inline-flex items-center gap-2"
          >
            Nous Contacter
            <ChevronRight size={20} />
          </Button>
        </div>
      </section>
    </div>
  );
}
