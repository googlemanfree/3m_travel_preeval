import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";

/**
 * TopProgressBar : Affiche une fine barre de progression animée en haut de l'écran
 * lors des changements de route (navigation SPA) pour indiquer visuellement le chargement.
 */
export function TopProgressBar() {
  const [location] = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProgress(20);

    const timer1 = setTimeout(() => setProgress(60), 100);
    const timer2 = setTimeout(() => setProgress(90), 250);
    const timer3 = setTimeout(() => {
      setProgress(100);
      const timer4 = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer4);
    }, 450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [location]);

  if (!loading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none overflow-hidden"
    >
      <div
        className="h-full bg-blue-600 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(37,99,235,0.6)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
