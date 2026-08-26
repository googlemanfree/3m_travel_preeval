import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type FloatingWidgetsPreferences = {
  widgetsVisible: boolean;
  setWidgetsVisible: (visible: boolean) => void;
};

const STORAGE_KEY = "3m-floating-widgets-visible";
const FloatingWidgetsPreferencesContext = createContext<FloatingWidgetsPreferences | null>(null);

export function FloatingWidgetsPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [widgetsVisible, setWidgetsVisibleState] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setWidgetsVisibleState(stored !== "false");
    } catch {
      // localStorage peut être indisponible en navigation privée ; garder l'affichage par défaut.
    }
  }, []);

  const setWidgetsVisible = (visible: boolean) => {
    setWidgetsVisibleState(visible);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(visible));
    } catch {
      // La préférence reste active pour la session courante.
    }
  };

  const value = useMemo(() => ({ widgetsVisible, setWidgetsVisible }), [widgetsVisible]);
  return <FloatingWidgetsPreferencesContext.Provider value={value}>{children}</FloatingWidgetsPreferencesContext.Provider>;
}

export function useFloatingWidgetsPreferences() {
  const context = useContext(FloatingWidgetsPreferencesContext);
  if (!context) throw new Error("useFloatingWidgetsPreferences doit être utilisé dans FloatingWidgetsPreferencesProvider");
  return context;
}
