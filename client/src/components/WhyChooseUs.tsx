import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Users,
  TrendingUp,
  Award,
  Headphones,
} from "lucide-react";

interface BenefitProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const BenefitCard = ({ icon, title, description, delay }: BenefitProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
  >
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  </motion.div>
);

export default function WhyChooseUs() {
  const benefits = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Traitement Rapide",
      description:
        "Nos experts traitent votre dossier en priorité pour vous garantir une réponse rapide et efficace.",
      delay: 0,
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Sécurité Garantie",
      description:
        "Vos données sont protégées par les plus hauts standards de sécurité et de confidentialité.",
      delay: 0.1,
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Équipe Expérimentée",
      description:
        "Notre équipe compte des experts avec plus de 12 ans d'expérience dans le secteur.",
      delay: 0.2,
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Taux de Succès Élevé",
      description:
        "98% de nos clients obtiennent leur visa grâce à notre accompagnement personnalisé.",
      delay: 0.3,
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Certifications Officielles",
      description:
        "Nous sommes certifiés et agréés par les autorités compétentes pour exercer cette activité.",
      delay: 0.4,
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "Support 24/7",
      description:
        "Nos conseillers sont disponibles 24h/24, 7j/7 pour répondre à vos questions et préoccupations.",
      delay: 0.5,
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Pourquoi Choisir 3M Travel & Services SARL ?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez les avantages qui font de nous le partenaire idéal pour votre projet d'immigration.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <BenefitCard
              key={index}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
              delay={benefit.delay}
            />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white text-center"
        >
          <h3 className="text-2xl font-bold mb-4">
            Prêt à Réaliser Votre Rêve ?
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Contactez nos experts dès aujourd'hui pour une consultation gratuite et découvrez comment nous pouvons vous aider.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Demander un Devis
            </button>
            <button className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Nous Contacter sur WhatsApp
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
