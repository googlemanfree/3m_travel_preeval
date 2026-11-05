import { useReducedMotion } from "framer-motion";
import { useAnimationPreferences } from "@/contexts/AnimationPreferencesContext";

/** `true` si l'utilisateur n'a demandé aucune réduction du mouvement (système ou réglage du site). */
export function useMotionAllowed(): boolean {
  const systemReducedMotion = useReducedMotion();
  const { animationsEnabled } = useAnimationPreferences();
  return !systemReducedMotion && animationsEnabled;
}
