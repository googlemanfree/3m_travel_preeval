import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation } from "wouter";
import type { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        className="min-h-[calc(100vh-5rem)]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
