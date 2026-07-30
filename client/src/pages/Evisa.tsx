import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Globe, FileText, Clock, Shield, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'wouter';

export default function Evisa() {
  const [activeTab, setActiveTab] = useState<'types' | 'process' | 'benefits'>('types');

  const evisaTypes = [
    {
      emoji: '🇮🇳',
      country: 'Inde',
      duration: '30 jours',
      price: '45 000 FCFA',
      description: 'eVisa touristique pour l\'Inde',
    },
    {
      emoji: '🇹🇷',
      country: 'Turquie',
      duration: '90 jours',
      price: '35 000 FCFA',
      description: 'eVisa électronique Turquie',
    },
    {
      emoji: '🇪🇬',
      country: 'Égypte',
      duration: '30 jours',
      price: '40 000 FCFA',
      description: 'eVisa pour l\'Égypte',
    },
    {
      emoji: '🇧🇩',
      country: 'Bangladesh',
      duration: '30 jours',
      price: '38 000 FCFA',
      description: 'eVisa Bangladesh',
    },
    {
      emoji: '🇱🇦',
      country: 'Laos',
      duration: '30 jours',
      price: '42 000 FCFA',
      description: 'eVisa pour le Laos',
    },
    {
      emoji: '🇻🇳',
      country: 'Vietnam',
      duration: '90 jours',
      price: '48 000 FCFA',
      description: 'eVisa Vietnam',
    },
  ];

  const processSteps = [
    {
      number: '1',
      title: 'Remplir la demande',
      description: 'Vous transmettez vos informations et documents en ligne via notre plateforme sécurisée',
      icon: FileText,
    },
    {
      number: '2',
      title: 'Traitement du dossier',
      description: 'Nous vérifions et soumettons votre demande auprès des autorités compétentes',
      icon: Zap,
    },
    {
      number: '3',
      title: 'Réception du eVisa',
      description: 'Vous recevez votre visa électronique par email, prêt à être imprimé ou présenté',
      icon: CheckCircle,
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: '100% en ligne',
      description: 'Pas besoin de vous déplacer à l\'ambassade ou au consulat',
    },
    {
      icon: Shield,
      title: 'Sécurisé et fiable',
      description: 'Plateforme certifiée et approuvée par les autorités consulaires',
    },
    {
      icon: Globe,
      title: 'Couverture mondiale',
      description: 'Accès à plus de 50 pays proposant le système eVisa',
    },
    {
      icon: Zap,
      title: 'Traitement rapide',
      description: 'Résultats généralement obtenus en 5 à 15 jours ouvrables',
    },
  ];

  const requirements = [
    'Passeport valide (minimum 6 mois de validité)',
    'Adresse email valide',
    'Photo d\'identité numérique (format JPG/PNG)',
    'Informations de voyage (dates, motif)',
    'Moyens de paiement (carte bancaire)',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-6 inline-block">
              <span className="px-4 py-2 rounded-full bg-blue-100 border border-blue-300 text-blue-700 text-sm font-semibold">
                ✈️ Visa électronique
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              eVisa en Ligne
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Obtenez votre visa électronique rapidement, sans déplacement en ambassade, avec un accompagnement complet et sécurisé
            </p>

            <Link href="/evisa-demande">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
              >
                Faire une demande d'eVisa
                <ArrowRight size={20} />
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl -z-10" />
      </section>

      {/* Info Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-8 items-center"
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Le eVisa : une solution rapide et 100% en ligne
              </h2>
              <p className="text-gray-600 mb-4">
                Le visa électronique (eVisa) est une autorisation de voyage délivrée en ligne, sans besoin de se déplacer en ambassade ou consulat. Il permet d'entrer et de séjourner dans certains pays pour une durée déterminée.
              </p>
              <p className="text-gray-600 mb-6">
                Une fois approuvé, votre eVisa est généralement envoyé par email. Il suffit de l'imprimer ou de le présenter à l'arrivée selon les exigences du pays.
              </p>
              <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded">
                <p className="text-gray-900 font-semibold">
                  ✓ Accompagnement complet
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  Vérification du dossier, saisie des informations, suivi et assistance jusqu'à l'obtention de votre eVisa
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl"
            >
              <Globe size={48} className="mb-4" />
              <h3 className="text-2xl font-bold mb-4">Plus de 50 pays</h3>
              <p className="mb-6">
                Accédez à des destinations populaires avec le système eVisa
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span>Inde, Turquie, Égypte</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span>Vietnam, Laos, Bangladesh</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span>Et bien d'autres destinations</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* eVisa Types */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Types d'eVisas disponibles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evisaTypes.map((evisa, index) => (
              <motion.div
                key={evisa.country}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <div className="text-4xl mb-4">{evisa.emoji}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {evisa.country}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{evisa.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">Durée: {evisa.duration}</span>
                    <span className="text-lg font-bold text-blue-600">{evisa.price}</span>
                  </div>
                  <Link href="/evisa-demande">
                    <button className="w-full py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-semibold transition-colors">
                      Demander
                    </button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Une procédure simple en 3 étapes
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="bg-white p-8 rounded-xl shadow-md">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold mb-4">
                      {step.number}
                    </div>
                    <Icon className="text-blue-600 mb-4" size={32} />
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">
                      {step.description}
                    </p>
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-1 bg-blue-300 transform -translate-y-1/2" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Avantages du eVisa
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0">
                    <Icon className="text-blue-600" size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Documents requis
          </h2>
          <Card className="p-8">
            <ul className="space-y-4">
              {requirements.map((req, index) => (
                <motion.li
                  key={req}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                  <span className="text-gray-700">{req}</span>
                </motion.li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Besoin d'un eVisa ?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Faites votre demande en ligne et recevez votre visa rapidement
          </p>
          <Link href="/evisa-demande">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
            >
              Faire une demande d'eVisa
              <ArrowRight size={20} />
            </motion.button>
          </Link>
        </div>
      </section>
    </div>
  );
}
