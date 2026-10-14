import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircleMore, X } from "lucide-react";
import { FloatingActionMenu } from "@/components/FloatingActionMenu";
import AiCopilotWidgetEnhanced from "@/components/AiCopilotWidgetEnhanced";
import { SmartFlightAssistant } from "@/components/SmartFlightAssistant";

const DOCK_HINT_KEY = "3m-floating-dock-hint-seen";

/**
 * Sur mobile : un seul bouton ouvre/ferme la pile WhatsApp + Aureol + vols.
 * Sur desktop : les trois pastilles restent toujours visibles.
 */
export function FloatingToolsDock() {
  const prefersReducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [showHint, setShowHint] = useState(false);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches) return;
    try {
      if (window.localStorage.getItem(DOCK_HINT_KEY) === "1") return;
    } catch {
      /* ignore storage */
    }
    const timer = window.setTimeout(() => setShowHint(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const dismissHint = () => {
    setShowHint(false);
    try {
      window.localStorage.setItem(DOCK_HINT_KEY, "1");
    } catch {
      /* ignore storage */
    }
  };

  const toggleDock = () => {
    setExpanded((value) => !value);
    dismissHint();
  };

  return (
    <>
      <div
        className="safe-bottom-floating fixed right-4 z-[46] md:hidden"
        data-testid="floating-tools-dock"
      >
        <AnimatePresence>
          {showHint && !expanded && (
            <motion.div
              role="status"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto absolute bottom-full right-0 mb-3 w-[min(16.5rem,calc(100vw-2.5rem))] rounded-2xl border border-blue-100 bg-white px-3.5 py-3 text-left shadow-xl shadow-slate-900/15"
              data-testid="floating-tools-hint"
            >
              <p className="text-xs font-bold text-[#0b2f6f]">Assistants 3M</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                Touchez ici pour afficher WhatsApp, Aureol et l’assistant de vol — puis refermez pour libérer l’écran.
              </p>
              <button
                type="button"
                onClick={dismissHint}
                className="mt-2 text-[11px] font-semibold text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Compris
              </button>
              <span
                aria-hidden="true"
                className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b border-r border-blue-100 bg-white"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          aria-expanded={expanded}
          aria-controls="floating-tools-stack"
          aria-label={expanded ? "Masquer les assistants" : "Afficher WhatsApp, Aureol et l’assistant de vol"}
          title={expanded ? "Masquer les assistants" : "Ouvrir WhatsApp, Aureol et l’assistant de vol"}
          onClick={toggleDock}
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
              transition={{ duration: prefersReducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex"
            >
              {expanded ? <X className="h-5 w-5" aria-hidden="true" /> : <MessageCircleMore className="h-5 w-5" aria-hidden="true" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <div
        id="floating-tools-stack"
        data-testid="floating-tools-stack"
        data-expanded={expanded ? "true" : "false"}
        className="floating-tools-stack"
      >
        <FloatingActionMenu />
        <AiCopilotWidgetEnhanced />
        <SmartFlightAssistant />
      </div>
    </>
  );
}
