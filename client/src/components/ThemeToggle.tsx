import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import type { ThemePreference } from "@shared/themePreferences";

const options: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Système", icon: Monitor },
];

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, preference, setPreference, switchable } = useTheme();
  const [open, setOpen] = useState(false);

  if (!switchable) return null;

  const activeOption = options.find(option => option.value === preference) ?? options[0];
  const ActiveIcon = activeOption.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Thème : ${activeOption.label}`}
        title={`Thème : ${activeOption.label}`}
        className={`ease-pill inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 text-slate-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:border-blue-300/60 dark:hover:bg-blue-400/15 ${compact ? "h-10 w-10" : "h-10 px-3"}`}
      >
        <ActiveIcon className="h-4 w-4" />
        {!compact && <span className="text-xs font-bold">{activeOption.label}</span>}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Choisir le thème"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[70] min-w-36 rounded-2xl border border-slate-200/70 bg-white/90 p-1.5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90"
        >
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={preference === value}
              onClick={() => {
                setPreference(value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${preference === value ? "bg-blue-50 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200" : "text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"}`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {value === "system" && <span className="ml-auto text-[10px] opacity-70">{theme}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
