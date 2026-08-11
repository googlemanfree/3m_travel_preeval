import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ANIMATION_PREFERENCE_KEY,
  isAnimationPreference,
  type AnimationPreference,
} from "@shared/animationPreferences";

interface AnimationPreferencesContextValue {
  preference: AnimationPreference;
  setPreference: (preference: AnimationPreference) => void;
  animationsEnabled: boolean;
}

const AnimationPreferencesContext = createContext<AnimationPreferencesContextValue | undefined>(undefined);

export function AnimationPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<AnimationPreference>(() => {
    if (typeof window === "undefined") return "normal";
    const stored = window.localStorage.getItem(ANIMATION_PREFERENCE_KEY);
    return isAnimationPreference(stored) ? stored : "normal";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.animationPreference = preference;
    root.style.setProperty("--motion-scale", preference === "fast" ? "0.7" : preference === "off" ? "0" : "1");
    if (preference === "off") {
      root.classList.add("motion-disabled");
    } else {
      root.classList.remove("motion-disabled");
    }
    window.localStorage.setItem(ANIMATION_PREFERENCE_KEY, preference);
  }, [preference]);

  const value = useMemo(
    () => ({ preference, setPreference: setPreferenceState, animationsEnabled: preference !== "off" }),
    [preference],
  );

  return <AnimationPreferencesContext.Provider value={value}>{children}</AnimationPreferencesContext.Provider>;
}

export function useAnimationPreferences() {
  const context = useContext(AnimationPreferencesContext);
  if (!context) throw new Error("useAnimationPreferences must be used within AnimationPreferencesProvider");
  return context;
}
