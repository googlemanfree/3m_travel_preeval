import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Globe, Award, CheckCircle } from "lucide-react";

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
}

const stats: StatItem[] = [
  {
    icon: TrendingUp,
    value: 1500,
    suffix: "+",
    label: "Dossiers Évalués",
    sublabel: "Clients satisfaits",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Users,
    value: 98,
    suffix: "%",
    label: "Satisfaction",
    sublabel: "Taux de réussite",
    color: "from-green-500 to-green-600",
  },
  {
    icon: Globe,
    value: 24,
    suffix: "h",
    label: "Délai de Réponse",
    sublabel: "Évaluation rapide",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Award,
    value: 15,
    suffix: "+",
    label: "Ans d'Expérience",
    sublabel: "Expertise reconnue",
    color: "from-orange-500 to-orange-600",
  },
];

export default function AnimatedCounterStats() {
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
                  {/* Icône */}
                  <motion.div
                    animate={inView ? { scale: 1 } : { scale: 0.8 }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-6`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>

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
                    <p className="text-sm text-slate-500">{stat.sublabel}</p>
                  )}

                  {/* Ligne de séparation animée */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inView ? { width: "100%" } : { width: 0 }}
                    transition={{ duration: 0.8, delay: idx * 0.1 + 0.2 }}
                    className={`h-1 bg-gradient-to-r ${stat.color} rounded-full mt-4`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
