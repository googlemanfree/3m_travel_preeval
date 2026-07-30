import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Heart, Globe, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function Assurance() {
  const [activeTab, setActiveTab] = useState<'types' | 'process' | 'benefits'>('types');

  const travelTypes = [
    { icon: '✈️', title: 'Voyage touristique', description: 'Couverture pour vos vacances et loisirs' },
    { icon: '💼', title: 'Voyage d\'affaires', description: 'Protection pour vos déplacements professionnels' },
    { icon: '📚', title: 'Études à l\'étranger', description: 'Assurance pour les étudiants et stagiaires' },
    { icon: '👨‍👩‍👧‍👦', title: 'Séjour familial', description: 'Couverture pour toute la famille' },
    { icon: '🏠', title: 'Demande de résidence', description: 'Assurance pour les futurs résidents' },
    { icon: '🕌', title: 'Pèlerinage', description: 'Protection pour Omra, Hajj et autres pèlerinages' },
    { icon: '🚁', title: 'Transit ou escale', description: 'Couverture courte durée' },
    { icon: '🌍', title: 'Visa visiteur', description: 'Assurance pour les visas de court séjour' },
  ];

  const processSteps = [
    {
      number: '1',
      title: 'Choix de la destination',
      description: 'Indiquez le pays de voyage, les dates de séjour et le nombre de voyageurs',
      icon: Globe,
    },
    {
      number: '2',
      title: 'Souscription rapide',
      description: 'Nous vous orientons vers la formule adaptée à votre voyage et vos démarches',
      icon: Zap,
    },
    {
      number: '3',
      title: 'Attestation reçue',
      description: 'Vous recevez votre attestation d\'assurance pour compléter votre dossier',
      icon: CheckCircle,
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Service rapide',
      description: 'Souscription simple et attestation disponible rapidement pour vos démarches',
    },
    {
      icon: Shield,
      title: 'Adaptée aux visas',
      description: 'Assurance conforme aux exigences consulaires de toutes destinations',
    },
    {
      icon: Heart,
      title: 'Accompagnement complet',
      description: 'Conseils personnalisés selon votre destination et type de séjour',
    },
    {
      icon: Globe,
      title: 'Démarches simplifiées',
      description: 'Solution pratique pour préparer votre voyage sans complications',
    },
  ];

  const coverageDetails = [
    { title: 'Assistance médicale', included: true },
    { title: 'Rapatriement sanitaire', included: true },
    { title: 'Hospitalisation', included: true },
    { title: 'Frais d\'urgence', included: true },
    { title: 'Responsabilité civile', included: true },
    { title: 'Bagages et effets personnels', included: true },
    { title: 'Annulation de voyage', included: false },
    { title: 'Assistance juridique', included: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1e4a] to-[#1a2a5a]">

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
              <span className="px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/50 text-blue-300 text-sm font-semibold">
                🛡️ Protection complète
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Assurance Voyage
            </h1>

            <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              Souscrivez une assurance voyage rapidement pour vos déplacements à l'étranger : visa, tourisme, affaires, études ou séjour familial.
            </p>

            <Link href="/assurance-inscription">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Souscrire une assurance
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10" />
      </section>

      {/* Info Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-8 items-center"
          >
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Assurance voyage : partez couvert et serein
              </h2>
              <p className="text-white/80 mb-4">
                Pour de nombreuses destinations, une assurance voyage peut être exigée lors d'une demande de visa ou fortement recommandée avant le départ. Elle permet de bénéficier d'une protection en cas d'imprévu pendant votre séjour à l'étranger.
              </p>
              <p className="text-white/80 mb-6">
                3M Travel & Services vous accompagne dans la souscription d'une assurance adaptée à votre voyage, selon la destination, la durée du séjour et le motif du déplacement.
              </p>
              <div className="p-4 border-l-4 border-blue-500 bg-blue-500/10 rounded">
                <p className="text-white font-semibold">
                  ✓ Service rapide et fiable
                </p>
                <p className="text-white/70 text-sm mt-2">
                  Attestation d'assurance voyage utile pour vos démarches de visa, voyages touristiques, professionnels, familiaux, étudiants ou religieux.
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: Shield, label: 'Couverture complète', value: '100%' },
                { icon: Clock, label: 'Traitement rapide', value: '24h' },
                { icon: Globe, label: 'Destinations', value: '195+' },
                { icon: Heart, label: 'Satisfaction', value: '98%' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all">
                  <item.icon className="w-6 h-6 text-blue-400 mb-2" />
                  <p className="text-white/80 text-sm font-semibold">{item.label}</p>
                  <p className="text-white text-2xl font-bold">{item.value}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Travel Types */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Pour quels types de voyages ?
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {travelTypes.map((type, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  className="p-6 rounded-lg bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/30 hover:border-blue-400/60 transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-3">{type.icon}</div>
                  <h3 className="text-white font-bold mb-2">{type.title}</h3>
                  <p className="text-white/70 text-sm">{type.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Une attestation utile pour vos démarches de visa
            </h2>

            <p className="text-white/80 text-center mb-12 max-w-3xl mx-auto">
              Certaines ambassades et autorités consulaires demandent une attestation d'assurance couvrant la durée du séjour. Ce document peut être nécessaire pour constituer un dossier de visa complet.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {processSteps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative"
                >
                  {/* Connector line */}
                  {idx < processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-1/2 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent" />
                  )}

                  <div className="relative z-10 p-6 rounded-lg bg-gradient-to-br from-blue-600/30 to-blue-500/10 border border-blue-500/30">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                        {step.number}
                      </div>
                      <step.icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-white font-bold mb-2">{step.title}</h3>
                    <p className="text-white/70 text-sm">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Coverage Details */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Couverture d'assurance
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {coverageDetails.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center gap-3"
                >
                  {item.included ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  )}
                  <span className="text-white/80">{item.title}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Pourquoi passer par 3M Travel & Services ?
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 rounded-lg bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/30 hover:border-blue-400/60 transition-all"
                >
                  <benefit.icon className="w-8 h-8 text-blue-400 mb-4" />
                  <h3 className="text-white font-bold mb-2">{benefit.title}</h3>
                  <p className="text-white/70 text-sm">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Besoin d'une assurance voyage ?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Souscrivez votre assurance voyage en ligne et recevez votre attestation rapidement pour compléter votre dossier de visa.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Souscrire maintenant
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-blue-500 text-blue-400 hover:bg-blue-500/10 font-bold rounded-full transition-all duration-300"
              >
                Nous contacter
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              Assurance, visa et formalités de voyage
            </h3>
            <p className="text-white/80 mb-8 max-w-3xl mx-auto">
              Notre équipe peut également vous accompagner pour vos demandes de visa, traductions assermentées, légalisations et autres formalités administratives liées à votre départ.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-lg transition-all duration-300"
            >
              Découvrir nos services complets
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
