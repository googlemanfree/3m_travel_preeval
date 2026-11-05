/**
 * Source unique de vérité du mouvement pour le code impératif (défilements, mesures).
 *
 * Le mouvement est réduit quand l'une de ces deux demandes est active :
 *  - le réglage « Animations : Désactivé » du site (classe `motion-disabled` posée sur <html>) ;
 *  - la préférence « réduire les animations » du système d'exploitation.
 *
 * Les animations CSS suivent déjà ces deux signaux ; les animations framer-motion les suivent via le `MotionConfig`
 * global (MotionPreferenceBridge) ; ce module couvre les `scrollTo` / `scrollIntoView` qui forçaient `smooth`.
 */
export function motionReduced(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return true;
  if (document.documentElement.classList.contains("motion-disabled")) return true;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** `smooth` seulement si le mouvement est permis ; `auto` (saut direct) sinon. */
export function scrollBehavior(): ScrollBehavior {
  return motionReduced() ? "auto" : "smooth";
}
