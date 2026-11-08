import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMotionAllowed } from "@/hooks/useMotionAllowed";
import { attachPointerEffects } from "@/lib/pointerEffects";
import { isRevealRoute } from "@/lib/scrollReveal";

/** Halo de survol et boutons magnétiques : pointeur fin uniquement, pages publiques, mouvement permis. */
export default function PremiumPointerEffects() {
  const [location] = useLocation();
  const motionAllowed = useMotionAllowed();
  const enabled = motionAllowed && isRevealRoute(location);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let fine = false;
    try {
      fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    } catch {
      fine = false;
    }
    if (!fine) return;
    return attachPointerEffects(window);
  }, [enabled]);

  return null;
}
