import React, { useEffect, useRef, useState } from "react";
import { useMotionAllowed } from "@/hooks/useMotionAllowed";

interface CountUpProps {
  /** Nombre réel à afficher (issu d'un catalogue ou d'une liste : jamais un chiffre de communication). */
  value: number;
  durationMs?: number;
  className?: string;
}

/**
 * Nombre qui s'incrémente de 0 à `value` la première fois qu'il apparaît à l'écran.
 * La valeur finale est TOUJOURS le texte de départ : sans animation (préférence « réduire les animations »,
 * navigateur sans IntersectionObserver, rendu serveur), le visiteur voit directement le bon nombre.
 */
export default function CountUp({ value, durationMs = 1100, className }: CountUpProps) {
  const motionAllowed = useMotionAllowed();
  const ref = useRef<HTMLSpanElement>(null);
  const valueRef = useRef(value);
  const played = useRef(false);
  const [display, setDisplay] = useState(value);

  valueRef.current = value;

  // Une valeur qui change après la première lecture (données rechargées, filtre) s'affiche aussitôt, sans rejouer.
  useEffect(() => {
    if (!motionAllowed || played.current) setDisplay(value);
  }, [value, motionAllowed]);

  useEffect(() => {
    const node = ref.current;
    if (!motionAllowed || played.current || !node || typeof IntersectionObserver === "undefined") return;

    let frame = 0;
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting) || played.current) return;
        played.current = true;
        observer.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(valueRef.current * eased));
          if (progress < 1) frame = window.requestAnimationFrame(step);
          else setDisplay(valueRef.current);
        };
        setDisplay(0);
        frame = window.requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [motionAllowed, durationMs]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
