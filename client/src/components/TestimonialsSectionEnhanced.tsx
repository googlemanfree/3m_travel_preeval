import { motion } from 'framer-motion';
import { Star, Quote, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Testimonial {
  id: number;
  name: string;
  country: string;
  destination: string;
  rating: number;
  text: string;
  avatar: string;
  date: string;
  verified: boolean;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Aurèol Donfack',
    country: '🇨🇲 Cameroun',
    destination: 'Canada',
    rating: 5,
    text: 'Excellent service ! L\'équipe de 3M Travel a géré mon dossier de visa pour le Canada avec professionnalisme. Mon visa a été approuvé en 3 semaines. Je recommande vivement !',
    avatar: '👨‍💼',
    date: 'Juillet 2026',
    verified: true,
  },
  {
    id: 2,
    name: 'Fatima Traore',
    country: '🇲🇱 Mali',
    destination: 'Luxembourg',
    rating: 5,
    text: 'Service impeccable du début à la fin. L\'équipe m\'a aidée à préparer tous les documents nécessaires pour mon visa d\'études au Luxembourg. Très professionnel et à l\'écoute.',
    avatar: '👩‍🎓',
    date: 'Juin 2026',
    verified: true,
  },
  {
    id: 3,
    name: 'Jean-Pierre Dupont',
    country: '🇨🇩 RDC',
    destination: 'Dubaï',
    rating: 5,
    text: 'J\'ai obtenu mon e-visa pour Dubaï en moins de 48h grâce à 3M Travel. Leur expertise et leur rapidité sont impressionnantes. Merci pour votre aide précieuse !',
    avatar: '👨‍💼',
    date: 'Mai 2026',
    verified: true,
  },
  {
    id: 4,
    name: 'Marie Nkomo',
    country: '🇬🇦 Gabon',
    destination: 'Allemagne',
    rating: 5,
    text: 'Visa d\'études en Allemagne obtenu sans problème grâce à 3M Travel. L\'équipe a été très réactive et m\'a guidée à chaque étape. Fortement recommandé !',
    avatar: '👩‍🎓',
    date: 'Avril 2026',
    verified: true,
  },
  {
    id: 5,
    name: 'Kofi Mensah',
    country: '🇬🇭 Ghana',
    destination: 'Pologne',
    rating: 5,
    text: 'Excellent accompagnement pour mon visa de travail en Pologne. L\'équipe de 3M Travel connaît très bien les procédures et les exigences. Très satisfait !',
    avatar: '👨‍💼',
    date: 'Mars 2026',
    verified: true,
  },
  {
    id: 6,
    name: 'Amara Diallo',
    country: '🇸🇳 Sénégal',
    destination: 'Turquie',
    rating: 5,
    text: 'Mon e-visa pour la Turquie a été traité en 24h. Service rapide, efficace et très abordable. Je suis très content du résultat. Merci 3M Travel !',
    avatar: '👨‍💼',
    date: 'Février 2026',
    verified: true,
  },
];

export default function TestimonialsSectionEnhanced() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoplay]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
      },
    },
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % testimonials.length);
    setAutoplay(false);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setAutoplay(false);
  };

  const visibleTestimonials = [
    testimonials[selectedIndex],
    testimonials[(selectedIndex + 1) % testimonials.length],
    testimonials[(selectedIndex + 2) % testimonials.length],
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-4">
            <span className="text-sm font-bold text-green-600 bg-green-100 px-4 py-2 rounded-full flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Visas Accordés Vérifiés
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Témoignages de nos clients satisfaits
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez les histoires de réussite de nos clients qui ont obtenu leur visa grâce à 3M Travel
          </p>
        </motion.div>

        {/* Statistiques */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-3 gap-4 md:gap-8 mb-16"
        >
          <motion.div variants={itemVariants} className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="text-4xl font-bold text-blue-600 mb-2">1500+</div>
            <p className="text-gray-600 font-semibold">Dossiers traités</p>
          </motion.div>
          <motion.div variants={itemVariants} className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="text-4xl font-bold text-green-600 mb-2">98%</div>
            <p className="text-gray-600 font-semibold">Taux de succès</p>
          </motion.div>
          <motion.div variants={itemVariants} className="text-center p-6 bg-white rounded-xl shadow-md">
            <div className="text-4xl font-bold text-orange-600 mb-2">4.9/5</div>
            <p className="text-gray-600 font-semibold">Note moyenne</p>
          </motion.div>
        </motion.div>

        {/* Carousel de témoignages */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {visibleTestimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-2xl p-6 transition-all transform ${
                  index === 0
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 shadow-2xl border-2 border-blue-500 md:scale-105'
                    : 'bg-white shadow-lg border border-gray-200 hover:shadow-xl'
                }`}
              >
                {/* Étoiles */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Citation */}
                <Quote className="w-8 h-8 text-blue-300 mb-3" />

                {/* Texte */}
                <p className="text-gray-700 mb-6 line-clamp-4 italic leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Auteur */}
                <div className="flex items-start gap-3 pt-4 border-t border-gray-200">
                  <div className="text-4xl flex-shrink-0">{testimonial.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      {testimonial.verified && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Vérifié
                        </motion.span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {testimonial.country} → {testimonial.destination}
                    </p>
                    <p className="text-xs text-gray-400">{testimonial.date}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Indicateurs de pagination */}
          <div className="flex justify-center gap-2 mb-8">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setSelectedIndex(index);
                  setAutoplay(false);
                }}
                className={`h-2 rounded-full transition-all ${
                  index === selectedIndex
                    ? 'bg-blue-600 w-8'
                    : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>

          {/* Boutons de navigation */}
          <div className="flex justify-center gap-4">
            <motion.button
              onClick={handlePrev}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
            >
              ←
            </motion.button>
            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg"
            >
              →
            </motion.button>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-gray-600 mb-4 text-lg">
            Rejoignez les milliers de clients satisfaits qui ont obtenu leur visa grâce à 3M Travel
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:shadow-lg transition-all inline-block"
          >
            Démarrer mon Évaluation Gratuite →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
