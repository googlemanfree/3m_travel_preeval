import { motion } from "framer-motion";

interface AIScoreGaugeProps {
  score: number | null | undefined;
  compact?: boolean;
  label?: string;
}

function clampScore(score: number | null | undefined) {
  if (typeof score !== "number" || Number.isNaN(score)) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getScoreTheme(score: number | null) {
  if (score === null) {
    return { label: "En attente", text: "text-slate-500", track: "bg-slate-200", bar: "from-slate-400 to-slate-500", ring: "ring-slate-200" };
  }
  if (score >= 80) {
    return { label: "Très favorable", text: "text-emerald-700", track: "bg-emerald-100", bar: "from-emerald-500 to-green-600", ring: "ring-emerald-200" };
  }
  if (score >= 60) {
    return { label: "Admissible", text: "text-blue-700", track: "bg-blue-100", bar: "from-blue-500 to-indigo-600", ring: "ring-blue-200" };
  }
  if (score >= 40) {
    return { label: "À renforcer", text: "text-amber-700", track: "bg-amber-100", bar: "from-amber-400 to-orange-500", ring: "ring-amber-200" };
  }
  return { label: "Faible", text: "text-red-700", track: "bg-red-100", bar: "from-red-500 to-rose-600", ring: "ring-red-200" };
}

export function AIScoreGauge({ score: rawScore, compact = false, label = "Score IA" }: AIScoreGaugeProps) {
  const score = clampScore(rawScore);
  const theme = getScoreTheme(score);

  return (
    <div className={compact ? "min-w-[170px]" : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className={`text-sm font-bold ${theme.text}`}>
          {score === null ? "—" : `${score}/100`}
        </span>
      </div>
      <div className={`h-3 w-full overflow-hidden rounded-full ${theme.track} ${compact ? "" : `ring-4 ${theme.ring}`}`}>
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${theme.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${score ?? 0}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className={`mt-2 text-xs font-medium ${theme.text}`}>{theme.label}</p>
    </div>
  );
}

export default AIScoreGauge;
