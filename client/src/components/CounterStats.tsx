import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Globe, Award, CheckCircle } from "lucide-react";

// ─── HOOK : animation de décompte ────────────────────────────────────────────
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
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(startValue + (target - startValue) * eased));
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [target, duration, started]);

  return count;
}

// ─── HOOK : détection de visibilité ──────────────────────────────────────────
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

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface StatItem {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  sublabel?: string;
  color: string;
  iconBg: string;
}

// ─── DONNÉES DES STATISTIQUES ─────────────────────────────────────────────────
const STATS: StatItem[] = [
  {
    icon: Users,
    value: 1247,
    suffix: "+",
    label: "Dossiers traités",
    sublabel: "depuis 2019",
    color: "text-[#1E3A8A]",
    iconBg: "bg-blue-100",
  },
  {
    icon: CheckCircle,
    value: 89,
    suffix: "%",
    label: "Taux de succès",
    sublabel: "visas obtenus",
    color: "text-green-600",
    iconBg: "bg-green-100",
  },
  {
    icon: Globe,
    value: 5,
    suffix: "",
    label: "Destinations",
    sublabel: "Canada · Europe · Golfe",
    color: "text-indigo-600",
    iconBg: "bg-indigo-100",
  },
  {
    icon: Award,
    value: 7,
    suffix: " ans",
    label: "D'expérience",
    sublabel: "agence agréée RC/YAO",
    color: "text-amber-600",
    iconBg: "bg-amber-100",
  },
];

// ─── SOUS-COMPOSANT : une statistique ─────────────────────────────────────────
function StatCard({ stat, started, index }: { stat: StatItem; started: boolean; index: number }) {
  const count = useCountUp(stat.value, 1800 + index * 200, started);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={started ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center text-center px-4 py-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center mb-3`}>
        <stat.icon className={`w-6 h-6 ${stat.color}`} />
      </div>
      <div className={`text-4xl font-black ${stat.color} leading-none mb-1`}>
        {count.toLocaleString("fr-FR")}
        <span className="text-2xl">{stat.suffix}</span>
      </div>
      <div className="font-bold text-gray-800 text-sm mt-1">{stat.label}</div>
      {stat.sublabel && (
        <div className="text-gray-400 text-xs mt-0.5">{stat.sublabel}</div>
      )}
    </motion.div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
interface CounterStatsProps {
  /** Variante visuelle : "light" = fond blanc, "dark" = fond bleu foncé */
  variant?: "light" | "dark";
  /** Titre optionnel affiché au-dessus */
  title?: string;
  /** Sous-titre optionnel */
  subtitle?: string;
}

export default function CounterStats({
  variant = "light",
  title,
  subtitle,
}: CounterStatsProps) {
  const { ref, inView } = useInView(0.2);

  const isDark = variant === "dark";

  return (
    <div
      ref={ref}
      className={`py-12 px-4 ${isDark ? "bg-gradient-to-br from-[#0f2460] to-[#1E3A8A]" : "bg-gray-50"}`}
    >
      <div className="max-w-5xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h2 className={`text-2xl md:text-3xl font-black mb-2 ${isDark ? "text-white" : "text-[#1E3A8A]"}`}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className={`text-sm ${isDark ? "text-blue-200" : "text-gray-500"}`}>
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} started={inView} index={i} />
          ))}
        </div>

        {/* Barre de progression taux de succès */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className={`mt-6 rounded-2xl p-5 ${isDark ? "bg-white/10 border border-white/20" : "bg-white border border-gray-100 shadow-sm"}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 ${isDark ? "text-green-300" : "text-green-600"}`} />
              <span className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
                Taux de succès global — Visas obtenus
              </span>
            </div>
            <span className={`text-sm font-black ${isDark ? "text-green-300" : "text-green-600"}`}>
              89%
            </span>
          </div>
          <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? "bg-white/20" : "bg-gray-100"}`}>
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
              initial={{ width: "0%" }}
              animate={inView ? { width: "89%" } : {}}
              transition={{ duration: 1.8, delay: 0.8, ease: [0.23, 1, 0.32, 1] }}
            />
          </div>
          <div className={`flex justify-between text-xs mt-1.5 ${isDark ? "text-blue-300" : "text-gray-400"}`}>
            <span>Canada 92% · Luxembourg 87% · Pologne 94%</span>
            <span>Mis à jour : juillet 2026</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
