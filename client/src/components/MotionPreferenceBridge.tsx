import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { useAnimationPreferences } from "@/contexts/AnimationPreferencesContext";

/**
 * Applique le réglage « Animations » du site à toutes les animations framer-motion (plus de 80 fichiers).
 *  - Désactivé : `reducedMotion="always"` → plus aucun déplacement, échelle ni rotation (seuls les fondus subsistent).
 *  - Autrement : `reducedMotion="user"` → la préférence « réduire les animations » du système est respectée.
 *  - Rapide : durée par défaut raccourcie pour les animations qui ne fixent pas leur propre transition.
 * Sans ce pont, seul le CSS suivait le réglage : les ressorts et sorties animées de framer-motion l'ignoraient.
 */
export default function MotionPreferenceBridge({ children }: { children: ReactNode }) {
  const { preference, animationsEnabled } = useAnimationPreferences();
  return (
    <MotionConfig
      reducedMotion={animationsEnabled ? "user" : "always"}
      transition={preference === "fast" ? { duration: 0.12, ease: "easeOut" } : undefined}
    >
      {children}
    </MotionConfig>
  );
}
