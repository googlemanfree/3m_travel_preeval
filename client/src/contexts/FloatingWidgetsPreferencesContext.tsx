import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type DeviceMode = "mobile" | "tablet" | "desktop";
type FloatingWidgetsPreferences = {
  widgetsVisible: boolean;
  deviceMode: DeviceMode;
  setWidgetsVisible: (visible: boolean) => void;
};

const LEGACY_KEY = "3m-floating-widgets-visible";
const KEYS: Record<DeviceMode, string> = {
  mobile: "3m-floating-widgets-visible-mobile",
  tablet: "3m-floating-widgets-visible-tablet",
  desktop: "3m-floating-widgets-visible-desktop",
};
const FloatingWidgetsPreferencesContext = createContext<FloatingWidgetsPreferences | null>(null);

function detectDeviceMode(): DeviceMode {
  if (typeof window === "undefined") return "desktop";
  if (window.matchMedia("(max-width: 767px)").matches) return "mobile";
  if (window.matchMedia("(min-width: 768px) and (max-width: 1023px)").matches) return "tablet";
  return "desktop";
}

function readPreference(mode: DeviceMode) {
  try {
    const stored = window.localStorage.getItem(KEYS[mode]);
    if (stored !== null) return stored !== "false";
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy !== null) {
      const migrated = legacy !== "false";
      window.localStorage.setItem(KEYS[mode], String(migrated));
      return migrated;
    }
  } catch {
    // localStorage peut être indisponible en navigation privée.
  }
  return true;
}

export function FloatingWidgetsPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>(detectDeviceMode);
  const [widgetsVisible, setWidgetsVisibleState] = useState(() =>
    typeof window === "undefined" ? true : readPreference(detectDeviceMode()),
  );

  useEffect(() => {
    const mediaQueries = [
      window.matchMedia("(max-width: 767px)"),
      window.matchMedia("(min-width: 768px) and (max-width: 1023px)"),
    ];
    const sync = () => {
      const nextMode = detectDeviceMode();
      setDeviceMode(nextMode);
      setWidgetsVisibleState(readPreference(nextMode));
    };
    mediaQueries.forEach((query) => query.addEventListener?.("change", sync));
    return () => mediaQueries.forEach((query) => query.removeEventListener?.("change", sync));
  }, []);

  const setWidgetsVisible = (visible: boolean) => {
    setWidgetsVisibleState(visible);
    try {
      window.localStorage.setItem(KEYS[deviceMode], String(visible));
    } catch {
      // La préférence reste active pour la session courante.
    }
  };

  const value = useMemo(() => ({ widgetsVisible, deviceMode, setWidgetsVisible }), [widgetsVisible, deviceMode]);
  return <FloatingWidgetsPreferencesContext.Provider value={value}>{children}</FloatingWidgetsPreferencesContext.Provider>;
}

export function useFloatingWidgetsPreferences() {
  const context = useContext(FloatingWidgetsPreferencesContext);
  if (!context) throw new Error("useFloatingWidgetsPreferences doit être utilisé dans FloatingWidgetsPreferencesProvider");
  return context;
}
