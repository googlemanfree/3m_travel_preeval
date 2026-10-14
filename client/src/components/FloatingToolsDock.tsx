import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircleMore, X } from "lucide-react";
import { FloatingActionMenu } from "@/components/FloatingActionMenu";
import AiCopilotWidgetEnhanced from "@/components/AiCopilotWidgetEnhanced";
import { SmartFlightAssistant } from "@/components/SmartFlightAssistant";

/**
 * Sur mobile : un seul bouton ouvre/ferme la pile WhatsApp + Aureol + vols.
 * Sur desktop : les trois pastilles restent toujours visibles.
 */
export function FloatingToolsDock() {
  const prefersReducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("floating-dock-expanded", expanded);
    document.body.classList.toggle("floating-dock-collapsed", !expanded);
    return () => {
      document.body.classList.remove("floating-dock-expanded", "floating-dock-collapsed");
    };
  }, [expanded]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      if (media.matches) setExpanded(true);
    };
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  return (
    <>
      <div
        className="safe-bottom-floating fixed right-4 z-[46] md:hidden"
        data-testid="floating-tools-dock"
      >
        <motion.button
          type="button"
          aria-expanded={expanded}
          aria-controls="floating-tools-stack"
          aria-label={expanded ? "Masquer les assistants" : "Afficher WhatsApp, Aureol et l’assistant de vol"}
          onClick={() => setExpanded((value) => !value)}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.06 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
          className="touch-target flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0b2f6f] to-[#1e4a9a] text-white shadow-lg shadow-blue-950/30 ring-2 ring-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
          data-testid="floating-tools-toggle"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={expanded ? "close" : "open"}
              initial={prefersReducedMotion ? false : { opacity: 0, rotate: -40, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, rotate: 40, scale: 0.8 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
              className="flex"
            >
              {expanded ? <X className="h-5 w-5" aria-hidden="true" /> : <MessageCircleMore className="h-5 w-5" aria-hidden="true" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <div id="floating-tools-stack" data-testid="floating-tools-stack" data-expanded={expanded ? "true" : "false"}>
        <FloatingActionMenu />
        <AiCopilotWidgetEnhanced />
        <SmartFlightAssistant />
      </div>
    </>
  );
}
