import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, CheckCircle2, AlertCircle, Award } from 'lucide-react';
import LuxembourgEvaluationForm from '@/components/LuxembourgEvaluationForm';

export default function LuxembourgEvaluation() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-16 pb-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
              <Globe className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            🇱🇺 Évaluation d'Éligibilité Luxembourg
          </h1>

          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Découvrez votre potentiel d'admission au Luxembourg en répondant à un formulaire simple et rapide.
            Obtenez un score détaillé et des recommandations personnalisées en quelques minutes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              whileHover={{ translateY: -5 }}
              className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6"
            >
              <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Rapide & Gratuit</h3>
              <p className="text-slate-400 text-sm">
                Complétez l'évaluation en 5-10 minutes sans frais
              </p>
            </motion.div>

            <motion.div
              whileHover={{ translateY: -5 }}
              className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6"
            >
              <Award className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Score Détaillé</h3>
              <p className="text-slate-400 text-sm">
                Recevez un rapport complet avec vos points forts et axes d'amélioration
              </p>
            </motion.div>

            <motion.div
              whileHover={{ translateY: -5 }}
              className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6"
            >
              <AlertCircle className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-2">Recommandations</h3>
              <p className="text-slate-400 text-sm">
                Découvrez des destinations alternatives si nécessaire
              </p>
            </motion.div>
          </div>

          {/* Criteria Overview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8 mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Critères d'Évaluation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="text-blue-400 font-semibold mb-3">Formation Académique</h3>
                <ul className="text-slate-300 space-y-2 text-sm">
                  <li>• Master/Diplôme dual : 15 points</li>
                  <li>• Licence/Certification : 11 points</li>
                  <li>• Bac/CQP : 6 points</li>
                </ul>
              </div>

              <div>
                <h3 className="text-blue-400 font-semibold mb-3">Expérience Professionnelle</h3>
                <ul className="text-slate-300 space-y-2 text-sm">
                  <li>• 8+ ans : 14 points</li>
                  <li>• 4-7 ans : 11 points</li>
                  <li>• 1-3 ans : 5 points</li>
                </ul>
              </div>

              <div>
                <h3 className="text-blue-400 font-semibold mb-3">Langues</h3>
                <ul className="text-slate-300 space-y-2 text-sm">
                  <li>• Français : C2 natif (15) → B1 (6)</li>
                  <li>• Anglais : B2+ (14) → Absent (2)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-blue-400 font-semibold mb-3">Secteur Professionnel</h3>
                <ul className="text-slate-300 space-y-2 text-sm">
                  <li>• Santé, Tech, Finance : 15 points</li>
                  <li>• Admin, RH, Mécanique : 10 points</li>
                  <li>• Autre : 8 points</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-slate-400 text-sm">
                <strong className="text-white">Score total sur 100 points</strong> — Seuils d'éligibilité :
                <br />
                ✅✅✅ Très éligible (80+) | ✅✅ Éligible (70-79) | 🟡 Modérément (60-69) | 🔴 Non-éligible (&lt;60)
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Form Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="pb-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700 rounded-lg p-8 shadow-2xl">
            <LuxembourgEvaluationForm />
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Questions Fréquentes</h2>

          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Que se passe-t-il après mon évaluation ?
              </h3>
              <p className="text-slate-300">
                Vous recevrez un email avec votre score détaillé, vos points forts, et un lien WhatsApp
                pour discuter directement avec notre équipe d'experts. Frais d'ouverture de dossier : 65 000 FCFA.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Puis-je améliorer mon score ?
              </h3>
              <p className="text-slate-300">
                Oui ! Notre équipe peut vous recommander des formations, certifications (IELTS, TOEFL) ou
                expériences professionnelles pour augmenter votre éligibilité.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Quelles sont les destinations alternatives ?
              </h3>
              <p className="text-slate-300">
                Si vous n'êtes pas éligible au Luxembourg, nous vous proposerons la Belgique, la France,
                le Canada (Québec) ou la Suisse avec des scores estimés et des délais de traitement.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Mes données sont-elles sécurisées ?
              </h3>
              <p className="text-slate-300">
                Absolument. Vos données sont chiffrées et stockées de manière sécurisée. Nous ne les
                partagerons que si vous acceptez explicitement.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="py-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Besoin d'aide ?</h2>
          <p className="text-slate-300 mb-8">
            Contactez notre équipe d'experts pour discuter de votre profil et de vos options.
          </p>
          <a
            href="https://wa.me/16728972999?text=Bonjour, j'aimerais discuter de mon évaluation Luxembourg."
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            💬 Discuter sur WhatsApp
          </a>
        </div>
      </motion.section>
    </div>
  );
}
