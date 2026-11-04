import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";
import { useAnimationPreferences } from "@/contexts/AnimationPreferencesContext";
import { createRevealSession, isRevealRoute } from "@/lib/scrollReveal";

/**
 * Apparition douce des sections au défilement sur les pages publiques. Respecte « réduire les animations » du système et le
 * réglage Animations du site (désactivé = rien n'est masqué). Voir lib/scrollReveal.ts pour les garde-fous.
 */
export default function ScrollRevealManager() {
  const [location] = useLocation();
  const systemReducedMotion = useReducedMotion();
  const { animationsEnabled } = useAnimationPreferences();

  useEffect(() => {
    if (systemReducedMotion || !animationsEnabled || !isRevealRoute(location)) return;
    if (typeof window === "undefined" || typeof window.IntersectionObserver === "undefined") return;

    let session: ReturnType<typeof createRevealSession> | null = null;
    const attach = () => {
      // La page de la route courante (la précédente peut encore être en train de sortir).
      const shells = document.querySelectorAll<HTMLElement>(".page-transition-shell");
      const root = shells[shells.length - 1];
      if (!root) return;
      if (!session) session = createRevealSession(root);
      session.scan();
    };
    // Le contenu des routes paresseuses arrive après le premier rendu : quelques passages, sans coût (idempotent).
    const timers = [80, 400, 1000].map((delay) => window.setTimeout(attach, delay));
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      session?.stop();
    };
  }, [location, systemReducedMotion, animationsEnabled]);

  return null;
}
