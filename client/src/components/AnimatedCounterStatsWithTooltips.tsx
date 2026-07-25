import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Globe, Award, CheckCircle } from "lucide-react";
import { InteractiveTooltip } from "./InteractiveTooltip";

function useCountUp(target: number, duration: number = 2000, started: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const startValue = 0;

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(startValue + (target - startValue) * eased));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [target, duration, started]);

  return count;
}

function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

interface StatItem {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  sublabel?: string;
  color: string;
  tooltip: {
    title: string;
    description: string;
    details: string[];
    creditCost: string;
  };
}

const stats: StatItem[] = [
  {
    icon: TrendingUp,
    value: 1500,
    suffix: "+",
    label: "Dossiers Évalués",
    sublabel: "Clients satisfaits",
    color: "from-blue-500 to-blue-600",
    tooltip: {
      title: "Dossiers Évalués",
      description: "Nombre total de dossiers d'immigration traités et évalués par notre équipe.",
      details: [
        "Chaque évaluation consomme 50-100 crédits",
        "Les consultations détaillées consomment plus",
        "Les mises à jour de dossiers : 25-50 crédits",
        "Support client inclus dans le coût",
      ],
      creditCost: "50-100 crédits par dossier",
    },
  },
  {
    icon: Users,
    value: 98,
    suffix: "%",
    label: "Satisfaction",
    sublabel: "Taux de réussite",
    color: "from-green-500 to-green-600",
    tooltip: {
      title: "Taux de Satisfaction",
      description: "Pourcentage de clients satisfaits de nos services et de la qualité de nos évaluations.",
      details: [
        "Basé sur 1500+ dossiers traités",
        "Feedback clients positifs et recommandations",
        "Suivi post-évaluation inclus",
        "Garantie de qualité de service",
      ],
      creditCost: "Inclus dans l'évaluation",
    },
  },
  {
    icon: Globe,
    value: 24,
    suffix: "h",
    label: "Délai de Réponse",
    sublabel: "Évaluation rapide",
    color: "from-purple-500 to-purple-600",
    tooltip: {
      title: "Délai de Réponse",
      description: "Temps moyen pour recevoir une évaluation complète de votre dossier.",
      details: [
        "Traitement prioritaire : 12-24h",
        "Analyse approfondie du profil",
        "Rapport détaillé fourni",
        "Consultation de suivi gratuite",
      ],
      creditCost: "Inclus dans l'évaluation",
    },
  },
  {
    icon: Award,
    value: 15,
    suffix: "+",
    label: "Ans d'Expérience",
    sublabel: "Expertise reconnue",
    color: "from-orange-500 to-orange-600",
    tooltip: {
      title: "Expérience Professionnelle",
      description: "Plus de 15 ans d'expertise dans les services d'immigration et de visa.",
      details: [
        "Équipe certifiée et agréée",
        "Connaissance approfondie des procédures",
        "Réseau international établi",
        "Taux de succès élevé et reconnu",
      ],
      creditCost: "Expertise incluse",
    },
  },
];

export default function AnimatedCounterStatsWithTooltips() {
  const { ref, inView } = useInView(0.3);

  return (
    <section ref={ref} className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Titre animé */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Notre Impact en Chiffres
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Des résultats concrets qui parlent pour nous
          </p>
          <p className="text-sm text-slate-500 mt-4">
            💡 Survolez les cartes pour voir les détails de consommation des crédits
          </p>
        </motion.div>

        {/* Grille de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            const count = useCountUp(stat.value, 2000, inView);

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="relative group"
              >
                {/* Fond dégradé */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}
                />

                {/* Contenu */}
                <div className="relative bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-slate-100 group-hover:border-slate-200">
                  {/* Header avec Icône et Tooltip */}
                  <div className="flex items-start justify-between mb-6">
                    <motion.div
                      animate={inView ? { scale: 1 } : { scale: 0.8 }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>

                    {/* Tooltip */}
                    <InteractiveTooltip content={stat.tooltip} />
                  </div>

                  {/* Valeur */}
                  <div className="mb-2">
                    <span className="text-4xl md:text-5xl font-bold text-slate-900">
                      {count}
                    </span>
                    <span className="text-2xl font-semibold text-slate-600 ml-1">
                      {stat.suffix}
                    </span>
                  </div>

                  {/* Label */}
                  <p className="text-lg font-semibold text-slate-900 mb-1">
                    {stat.label}
                  </p>

                  {/* Sublabel */}
                  {stat.sublabel && (
                    <p className="text-sm text-slate-500 mb-4">{stat.sublabel}</p>
                  )}

                  {/* Ligne de séparation animée */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inView ? { width: "100%" } : { width: 0 }}
                    transition={{ duration: 0.8, delay: idx * 0.1 + 0.2 }}
                    className={`h-1 bg-gradient-to-r ${stat.color} rounded-full`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6"
        >
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Comprendre la consommation des crédits
              </h3>
              <p className="text-sm text-blue-800 mb-2">
                Les crédits Manus sont consommés en fonction des opérations effectuées :
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• Lectures de fichiers : ~50 crédits par lecture</li>
                <li>• Éditions de fichiers : ~150 crédits par édition</li>
                <li>• Compilations TypeScript : ~100 crédits par compilation</li>
                <li>• Opérations répétées : consomment des crédits à chaque fois</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
