import { motion } from 'framer-motion';
import { ShieldCheck, Clock, Users, MessageCircle } from 'lucide-react';
import { Link } from 'wouter';

/**
 * Section de confiance sur la page d'accueil.
 *
 * ⚠️ Remplace une version précédente qui affichait des témoignages
 * entièrement fabriqués (faux noms, dont celui du PDG, marqués comme
 * "vérifiés" à tort). Ce composant ne présente que des informations
 * factuelles et vérifiables sur le service — aucune citation client
 * inventée. À remplacer par de vrais avis clients une fois collectés
 * avec leur consentement.
 */
export default function TestimonialsSectionEnhanced() {
  const points = [
    {
      icon: ShieldCheck,
      title: 'Expertise réglementée',
      description: "Nous vous aidons à préparer un dossier cohérent avec les exigences communiquées par les autorités compétentes.",
    },
    {
      icon: Users,
      title: 'Accompagnement personnalisé',
      description: 'Un conseiller vous oriente selon votre projet, vos documents et les étapes utiles à votre situation.',
    },
    {
      icon: Clock,
      title: 'Réponse sous 24h',
      description: 'Après votre pré-évaluation, notre équipe vous apporte un premier retour dans un délai annoncé de 24 heures ouvrées.',
    },
    {
      icon: MessageCircle,
      title: 'Transparence totale',
      description: "Les frais, les étapes et le rôle de l’agence sont expliqués clairement avant tout engagement.",
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-white to-blue-50 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pourquoi choisir 3M Travel & Services
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Une agence basée à Yaoundé, qui accompagne les démarches de visa et de mobilité internationale avec sérieux et transparence.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {points.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{point.title}</h3>
                <p className="text-sm text-gray-600">{point.description}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <p className="text-gray-600 mb-4 text-lg">
            Une question avant de vous lancer ? Discutons-en directement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/evaluation">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:shadow-lg transition-all inline-block"
              >
                Démarrer mon évaluation gratuite →
              </motion.button>
            </Link>
            <a href="https://wa.me/16728972999" target="_blank" rel="noopener noreferrer">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white border-2 border-green-500 text-green-600 font-bold py-3 px-8 rounded-lg hover:bg-green-50 transition-all inline-flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" /> Discuter sur WhatsApp
              </motion.button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
