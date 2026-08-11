import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) return null;

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className={`ease-pill inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:border-blue-300/60 dark:hover:bg-blue-400/15 ${compact ? "h-10 w-10" : "h-10 px-3"}`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!compact && <span className="text-xs font-bold">{isDark ? "Clair" : "Sombre"}</span>}
    </button>
  );
}
