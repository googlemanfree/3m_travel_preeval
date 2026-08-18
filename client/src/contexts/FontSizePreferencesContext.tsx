import React, { createContext, useContext, useEffect, useState } from "react";

export type FontSizePreference = "standard" | "large" | "xlarge";

interface FontSizeContextType {
  fontSize: FontSizePreference;
  setFontSize: (size: FontSizePreference) => void;
}

const FontSizePreferencesContext = createContext<FontSizeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "3m_travel_font_size";

export function FontSizePreferencesProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSizePreference>(() => {
    if (typeof window === "undefined") return "standard";
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved === "large" || saved === "xlarge" || saved === "standard") {
      return saved;
    }
    return "standard";
  });

  const setFontSize = (size: FontSizePreference) => {
    setFontSizeState(size);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, size);
    }
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("text-size-standard", "text-size-large", "text-size-xlarge");
    if (fontSize === "large") {
      root.classList.add("text-size-large");
      root.style.setProperty("--font-size-scale", "1.125");
    } else if (fontSize === "xlarge") {
      root.classList.add("text-size-xlarge");
      root.style.setProperty("--font-size-scale", "1.25");
    } else {
      root.classList.add("text-size-standard");
      root.style.setProperty("--font-size-scale", "1");
    }
  }, [fontSize]);

  return (
    <FontSizePreferencesContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizePreferencesContext.Provider>
  );
}

export function useFontSizePreferences() {
  const context = useContext(FontSizePreferencesContext);
  if (!context) {
    throw new Error("useFontSizePreferences must be used within a FontSizePreferencesProvider");
  }
  return context;
}
