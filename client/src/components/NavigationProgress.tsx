import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAnimationPreferences } from "@/contexts/AnimationPreferencesContext";

const NAVIGATION_EVENT = "3m:navigation-start";

export function notifyNavigationStart() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NAVIGATION_EVENT));
  }
}

export default function NavigationProgress() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState(8);
  const previousLocation = useRef(location);
  const { animationsEnabled } = useAnimationPreferences();

  useEffect(() => {
    let fallbackTimeout: number | undefined;

    const start = () => {
      setVisible(true);
      setValue((current) => Math.max(current, 18));
      window.requestAnimationFrame(() => setValue((current) => Math.max(current, 68)));
      if (fallbackTimeout) window.clearTimeout(fallbackTimeout);
      fallbackTimeout = window.setTimeout(() => {
        setValue(100);
        window.setTimeout(() => {
          setVisible(false);
          setValue(8);
        }, animationsEnabled ? 180 : 0);
      }, animationsEnabled ? 1400 : 0);
    };

    window.addEventListener(NAVIGATION_EVENT, start);
    return () => {
      window.removeEventListener(NAVIGATION_EVENT, start);
      if (fallbackTimeout) window.clearTimeout(fallbackTimeout);
    };
  }, [animationsEnabled]);

  useEffect(() => {
    if (previousLocation.current === location) return;
    previousLocation.current = location;
    setVisible(true);
    setValue(100);

    const timeout = window.setTimeout(() => {
      setVisible(false);
      setValue(8);
    }, animationsEnabled ? 180 : 0);

    return () => window.clearTimeout(timeout);
  }, [animationsEnabled, location]);

  useEffect(() => {
    const onBeforeUnload = () => {
      setVisible(true);
      setValue(72);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-label="Chargement de la page"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[100] h-0.5 pointer-events-none"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext="Navigation en cours"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.7)]"
        style={{
          width: `${value}%`,
          transition: animationsEnabled ? "width 180ms ease-out, opacity 180ms ease-out" : "none",
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}
