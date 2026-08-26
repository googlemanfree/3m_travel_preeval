import { createContext, useContext, useEffect, useMemo, useState } from "react";

type HighContrastContextValue = {
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
};

const STORAGE_KEY = "3m-high-contrast";
const HighContrastContext = createContext<HighContrastContextValue | null>(null);

export function HighContrastProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrastState] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return window.localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.contrast = highContrast ? "high" : "normal";
    root.classList.toggle("high-contrast", highContrast);
    try { window.localStorage.setItem(STORAGE_KEY, String(highContrast)); } catch { /* session-only fallback */ }
  }, [highContrast]);

  const value = useMemo(() => ({ highContrast, setHighContrast: setHighContrastState }), [highContrast]);
  return <HighContrastContext.Provider value={value}>{children}</HighContrastContext.Provider>;
}

export function useHighContrast() {
  const context = useContext(HighContrastContext);
  if (!context) throw new Error("useHighContrast doit être utilisé dans HighContrastProvider");
  return context;
}
