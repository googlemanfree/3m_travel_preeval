import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMotionAllowed } from "@/hooks/useMotionAllowed";
import { isRevealRoute } from "@/lib/scrollReveal";

/**
 * Fine barre dorée en haut de l'écran : avancement de la lecture de la page (pages publiques seulement).
 * Purement décorative (aria-hidden, aucun clic) ; une seule `transform` mise à jour par image, sans relayout.
 * Absente quand le mouvement est réduit (système ou réglage « Animations : Désactivé »).
 */
export default function ReadingProgress() {
  const [location] = useLocation();
  const motionAllowed = useMotionAllowed();
  const barRef = useRef<HTMLDivElement | null>(null);
  const enabled = motionAllowed && isRevealRoute(location);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const bar = barRef.current;
      if (!bar) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${ratio})`;
      bar.style.opacity = ratio > 0.004 ? "1" : "0";
    };
    const request = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    request();
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
    };
  }, [enabled, location]);

  if (!enabled) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]" aria-hidden="true" data-testid="reading-progress" data-no-reveal>
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-[#c39231] via-[#efd38a] to-[#c39231] opacity-0 transition-opacity duration-200"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
