import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type PremiumRevealProps = {
  children: ReactNode;
  className?: string;
  /** Décalage d’apparition (0–2) pour un rythme léger entre blocs. */
  delay?: number;
  /** Décalage en pixels (défaut 18). */
  y?: number;
};

/**
 * Apparition au scroll — une seule motion douce, désactivée si reduced-motion.
 */
export function PremiumReveal({ children, className, delay = 0, y = 18 }: PremiumRevealProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: Math.min(delay, 0.24), ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
