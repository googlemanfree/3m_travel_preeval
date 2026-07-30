import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Globe, Zap, Shield, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

export default function Traduction() {
  const [activeTab, setActiveTab] = useState<'documents' | 'process' | 'benefits'>('documents');

  const documentTypes = [
    { icon: '📄', title: 'Acte de naissance', description: 'Traduction certifiée pour démarches administratives' },
    { icon: '💍', title: 'Acte de mariage', description: 'Traduction officielle pour mariage à l\'étranger' },
    { icon: '⚰️', title: 'Acte de décès', description: 'Traduction pour héritages et successions' },
    { icon: '🎓', title: 'Diplômes', description: 'Traduction pour équivalence universitaire' },
    { icon: '📊', title: 'Relevés de notes', description: 'Traduction pour inscription universitaire' },
    { icon: '⚖️', title: 'Casier judiciaire', description: 'Traduction pour demandes de visa' },
    { icon: '📋', title: 'Jugements', description: 'Traduction pour procédures judiciaires' },
    { icon: '📑', title: 'Contrats & attestations', description: 'Traduction pour démarches commerciales' },
  ];

  const processSteps = [
    {
      number: '1',
      title: 'Envoi du document',
      description: 'Vous nous transmettez votre document par email ou via le formulaire de devis',
      icon: FileText,
    },
    {
      number: '2',
      title: 'Devis personnalisé',
      description: 'Nous vérifions la langue, le volume et le délai souhaité pour un tarif adapté',
      icon: Zap,
    },
    {
      number: '3',
      title: 'Traduction certifiée',
      description: 'Votre document est traduit par un traducteur assermenté puis transmis',
      icon: CheckCircle,
    },
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Traducteurs assermentés',
      description: 'Traductions officielles adaptées aux démarches administratives et consulaires',
    },
    {
      icon: Clock,
      title: 'Service rapide',
      description: 'Possibilité de traitement express selon le document et la langue',
    },
    {
      icon: Globe,
      title: 'Accompagnement complet',
      description: 'Vérification du dossier avant transmission au traducteur assermenté',
    },
    {
      icon: FileText,
      title: 'Envoi sécurisé',
      description: 'Remise par email, courrier, coursier ou retrait selon vos besoins',
    },
  ];

  const languages = [
    { name: 'Anglais', flag: '🇬🇧', available: true },
    { name: 'Français', flag: '🇫🇷', available: true },
    { name: 'Espagnol', flag: '🇪🇸', available: true },
    { name: 'Allemand', flag: '🇩🇪', available: true },
    { name: 'Italien', flag: '🇮🇹', available: true },
    { name: 'Portugais', flag: '🇵🇹', available: true },
    { name: 'Arabe', flag: '🇸🇦', available: true },
    { name: 'Chinois', flag: '🇨🇳', available: true },
    { name: 'Russe', flag: '🇷🇺', available: true },
    { name: 'Japonais', flag: '🇯🇵', available: true },
    { name: 'Coréen', flag: '🇰🇷', available: true },
    { name: 'Vietnamien', flag: '🇻🇳', available: true },
  ];

  const useCases = [
    { title: 'Demandes de visa', icon: '✈️' },
    { title: 'Naturalisation', icon: '🏛️' },
    { title: 'Mariage à l\'étranger', icon: '💍' },
    { title: 'Études universitaires', icon: '🎓' },
    { title: 'Équivalence de diplôme', icon: '📜' },
    { title: 'Procédures judiciaires', icon: '⚖️' },
    { title: 'Démarches auprès des administrations', icon: '📋' },
    { title: 'Contrats commerciaux', icon: '💼' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1e4a] to-[#1a2a5a]">
      <Navbar />

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
                📄 Traductions officielles
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Traduction Assermentée
            </h1>

            <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              Faites traduire vos documents officiels par des traducteurs assermentés pour vos démarches administratives, juridiques, universitaires ou professionnelles en France et à l'étranger.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Demander un devis
            </motion.button>
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
                Traduction assermentée : vos documents traduits officiellement
              </h2>
              <p className="text-white/80 mb-4">
                Une traduction assermentée est une traduction officielle réalisée par un traducteur expert inscrit auprès d'une Cour d'Appel. Elle est généralement demandée par les administrations, consulats, universités, tribunaux, préfectures, mairies ou organismes étrangers.
              </p>
              <p className="text-white/80 mb-6">
                3M Travel & Services vous accompagne dans la traduction certifiée de vos documents afin de faciliter vos démarches en France et à l'international.
              </p>
              <div className="p-4 border-l-4 border-blue-500 bg-blue-500/10 rounded">
                <p className="text-white font-semibold">
                  ✓ Service professionnel et fiable
                </p>
                <p className="text-white/70 text-sm mt-2">
                  Actes d'état civil, diplômes, relevés de notes, documents juridiques, documents administratifs, contrats, attestations, permis, jugements et dossiers consulaires.
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
                { icon: FileText, label: 'Types de documents', value: '8+' },
                { icon: Globe, label: 'Langues disponibles', value: '12+' },
                { icon: Clock, label: 'Délai standard', value: '5-7j' },
                { icon: CheckCircle, label: 'Satisfaction', value: '99%' },
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

      {/* Document Types */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Quels documents peuvent être traduits ?
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {documentTypes.map((doc, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  className="p-6 rounded-lg bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/30 hover:border-blue-400/60 transition-all cursor-pointer"
                >
                  <div className="text-4xl mb-3">{doc.icon}</div>
                  <h3 className="text-white font-bold mb-2">{doc.title}</h3>
                  <p className="text-white/70 text-sm">{doc.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Une traduction valable pour vos démarches officielles
            </h2>

            <p className="text-white/80 text-center mb-12 max-w-3xl mx-auto">
              Les traductions assermentées sont souvent exigées pour les demandes de visa, naturalisation, mariage, études, équivalence de diplôme, inscription universitaire, procédures judiciaires ou démarches auprès des administrations étrangères.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {useCases.map((useCase, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all text-center"
                >
                  <div className="text-3xl mb-2">{useCase.icon}</div>
                  <p className="text-white/80 font-semibold text-sm">{useCase.title}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Notre processus en 3 étapes
            </h2>

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

      {/* Languages Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Langues disponibles
            </h2>

            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              {languages.map((lang, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ scale: 1.1 }}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all text-center cursor-pointer"
                >
                  <div className="text-3xl mb-2">{lang.flag}</div>
                  <p className="text-white/80 font-semibold text-sm">{lang.name}</p>
                  {lang.available && (
                    <p className="text-green-400 text-xs mt-1">✓ Disponible</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Pourquoi choisir 3M Travel & Services ?
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

      {/* Additional Services */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              Traduction, légalisation et apostille
            </h3>
            <p className="text-white/80 mb-8">
              Certains documents traduits peuvent également nécessiter une apostille ou une légalisation pour être acceptés à l'étranger. Notre équipe peut vous conseiller sur la procédure complète selon le pays de destination.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-lg transition-all duration-300"
            >
              En savoir plus sur la légalisation
            </motion.button>
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
              Besoin d'une traduction assermentée ?
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              Envoyez-nous vos documents et recevez rapidement un devis personnalisé adapté à vos besoins.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Demander un devis
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
    </div>
  );
}
