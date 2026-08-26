import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";
import type { ReactNode } from "react";
import { useAnimationPreferences } from "@/contexts/AnimationPreferencesContext";

export default function PageTransition({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const { preference, animationsEnabled } = useAnimationPreferences();
  const motionDisabled = prefersReducedMotion || !animationsEnabled;
  const duration = preference === "fast" ? 0.16 : 0.22;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        initial={motionDisabled ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={motionDisabled ? undefined : { opacity: 0, y: -8 }}
        transition={motionDisabled ? { duration: 0 } : { duration, ease: [0.23, 1, 0.32, 1] }}
        className="min-h-[calc(100vh-5rem)] will-change-[opacity,transform]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
