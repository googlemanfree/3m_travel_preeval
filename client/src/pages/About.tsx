import { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Users, CheckCircle, Globe, Zap, Shield, ArrowRight, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { Link } from 'wouter';

export default function About() {
  const stats = [
    { number: '500+', label: 'Dossiers traités' },
    { number: '15+', label: 'Destinations couvertes' },
    { number: '98%', label: 'Taux de satisfaction' },
    { number: '24h', label: 'Réponse moyenne' },
  ];

  const values = [
    {
      icon: Zap,
      title: 'Rapidité',
      description: 'Traitement accéléré de vos demandes selon la destination et les délais consulaires',
    },
    {
      icon: Award,
      title: 'Expertise',
      description: 'Analyse minutieuse des dossiers pour limiter les erreurs et les risques de retard',
    },
    {
      icon: Users,
      title: 'Suivi personnalisé',
      description: 'Accompagnement complet jusqu\'à la finalisation de votre démarche',
    },
    {
      icon: Shield,
      title: 'Confidentialité',
      description: 'Gestion sécurisée de vos documents et informations personnelles',
    },
    {
      icon: CheckCircle,
      title: 'Qualité',
      description: 'Vérification rigoureuse de chaque document avant soumission',
    },
    {
      icon: Heart,
      title: 'Engagement',
      description: 'Conseils personnalisés pour particuliers, entreprises et professionnels',
    },
  ];

  const timeline = [
    {
      year: '2020',
      title: 'Création de 3M Travel & Services',
      description: 'Fondation de l\'agence avec une vision claire : simplifier les démarches d\'immigration',
    },
    {
      year: '2021',
      title: 'Expansion régionale',
      description: 'Ouverture de bureaux à Yaoundé et Douala pour mieux servir nos clients',
    },
    {
      year: '2022',
      title: 'Certification internationale',
      description: 'Obtention des certifications ISO et reconnaissance officielle des ambassades',
    },
    {
      year: '2023',
      title: 'Plateforme numérique',
      description: 'Lancement de notre plateforme en ligne pour un suivi 24/7 des dossiers',
    },
    {
      year: '2024',
      title: 'Expansion continentale',
      description: 'Extension des services vers 15+ destinations en Afrique, Europe et Amérique du Nord',
    },
  ];

  const team = [
    {
      name: 'Jean-Claude Mbarga',
      role: 'Directeur Général',
      bio: '15 ans d\'expérience en formalités consulaires',
      emoji: '👨‍💼',
    },
    {
      name: 'Marie Nkomo',
      role: 'Responsable Visas',
      bio: 'Experte en procédures visa Canada et France',
      emoji: '👩‍💼',
    },
    {
      name: 'Pierre Kamdem',
      role: 'Responsable eVisa',
      bio: 'Spécialiste des visas électroniques',
      emoji: '👨‍💻',
    },
    {
      name: 'Sophie Tagne',
      role: 'Responsable Support Client',
      bio: 'Dévouée à la satisfaction de nos clients',
      emoji: '👩‍💼',
    },
  ];

  const testimonials = [
    {
      name: 'Alain Fouda',
      role: 'Entrepreneur',
      text: '3M Travel a rendu mon visa Canada possible en seulement 3 mois. Équipe professionnelle et réactive !',
      rating: 5,
    },
    {
      name: 'Carole Bah',
      role: 'Étudiante',
      text: 'Merci pour l\'accompagnement complet. Mon visa France a été approuvé sans aucun problème.',
      rating: 5,
    },
    {
      name: 'Ibrahim Hassan',
      role: 'Homme d\'affaires',
      text: 'Service impeccable. Ils ont géré tous mes documents avec sérieux et transparence.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Qui sommes-nous ?
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              3M Travel & Services accompagne particuliers, entreprises et professionnels dans leurs démarches de visas, eVisas, légalisations, traductions assermentées et assurances voyage.
            </p>

            <p className="text-base text-gray-500 max-w-3xl mx-auto">
              Depuis 2020, notre équipe expérimentée sécurise vos démarches, vérifie vos documents et vous fait gagner du temps.
            </p>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl -z-10" />
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Notre mission
              </h2>
              <p className="text-gray-600 mb-4">
                Simplifier et sécuriser les démarches d'immigration pour que chacun puisse réaliser ses projets de mobilité internationale sans stress ni complications.
              </p>
              <p className="text-gray-600 mb-6">
                Nous croyons que l'accès aux visas et aux formalités internationales ne devrait pas être un obstacle. C'est pourquoi nous mettons notre expertise au service de vos ambitions.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="text-gray-700">Transparence totale</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="text-gray-700">Accompagnement personnalisé</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="text-gray-700">Résultats garantis</span>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl"
            >
              <Globe size={48} className="mb-4" />
              <h3 className="text-2xl font-bold mb-4">Nos valeurs</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span>Intégrité et honnêteté</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span>Excellence et rigueur</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span>Responsabilité sociale</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span>Innovation continue</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Pourquoi choisir 3M Travel & Services ?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-all duration-300">
                    <Icon className="text-blue-600 mb-4" size={32} />
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      {value.title}
                    </h3>
                    <p className="text-gray-600">
                      {value.description}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Notre historique
          </h2>
          <div className="space-y-8">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-6"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {item.year.slice(-2)}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="w-1 h-24 bg-blue-200 mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Notre équipe
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="text-5xl mb-4">{member.emoji}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 font-semibold text-sm mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {member.bio}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners & Certifications Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Nos partenaires et certifications
          </h2>

          {/* Certifications */}
          <div className="mb-16">
            <h3 className="text-xl font-bold text-gray-900 mb-8 text-center">
              Certifications et accréditations
            </h3>
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {[
                { name: 'ISO 9001', desc: 'Qualité de service' },
                { name: 'ISO 27001', desc: 'Sécurité des données' },
                { name: 'RGPD', desc: 'Protection des données' },
                { name: 'Agréé ONU', desc: 'Reconnaissance officielle' },
              ].map((cert, index) => (
                <motion.div
                  key={cert.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-all"
                >
                  <div className="text-4xl mb-3">✓</div>
                  <h4 className="font-bold text-gray-900 mb-1">{cert.name}</h4>
                  <p className="text-sm text-gray-600">{cert.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Partners */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-8 text-center">
              Nos partenaires officiels
            </h3>
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { emoji: '🇨🇦', name: 'Immigration Canada' },
                { emoji: '🇫🇷', name: 'Ambassade France' },
                { emoji: '🇩🇪', name: 'Consulat Allemagne' },
                { emoji: '🇬🇧', name: 'UK Visas' },
                { emoji: '🇦🇪', name: 'Dubaï Tourism' },
                { emoji: '🏛️', name: 'Ministère Intérieur' },
              ].map((partner, index) => (
                <motion.div
                  key={partner.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                    {partner.emoji}
                  </div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    {partner.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Ils nous font confiance
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400">⭐</span>
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Besoin d'un accompagnement ?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Confiez vos formalités internationales à 3M Travel & Services et gagnez du temps dans vos démarches.
          </p>
          <Link href="/evaluation-widget">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center gap-2"
            >
              Commencer une évaluation
              <ArrowRight size={20} />
            </motion.button>
          </Link>
        </div>
      </section>
    </div>
  );
}
