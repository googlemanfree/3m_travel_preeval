import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "promo_etudiant_dismissed_at";
// Délai avant réaffichage après fermeture (24h en ms)
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;
// Délai avant apparition initiale (3s)
const INITIAL_DELAY_MS = 3000;

export default function PromoFloatingBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fermé la bannière récemment
    try {
      const dismissedAt = localStorage.getItem(STORAGE_KEY);
      if (dismissedAt) {
        const elapsed = Date.now() - parseInt(dismissedAt, 10);
        if (elapsed < DISMISS_DURATION_MS) return; // Encore dans la période de suppression
      }
    } catch {
      // localStorage non disponible
    }

    const timer = setTimeout(() => setVisible(true), INITIAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // ignore
    }
  };

  const phoneNumber = "237698104832";
  const waMsg = encodeURIComponent(
    "Bonjour 3M Travel ! Je suis étudiant(e) et je souhaite bénéficier du tarif étudiant -10%. Pouvez-vous m'aider ?"
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 120, scale: 0.85 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 120, scale: 0.85 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed bottom-36 right-4 z-40 w-[200px] sm:w-[220px] cursor-pointer select-none"
          style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.25))" }}
          onClick={() => setExpanded((v) => !v)}
          role="button"
          aria-label="Offre Tarif Étudiant -10%"
        >
          {/* Bouton de fermeture */}
          <button
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors shadow-md"
            aria-label="Fermer la promotion"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Badge pulsant */}
          <div className="absolute -top-1 -left-1 z-10">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500" />
            </span>
          </div>

          {/* Image principale */}
          <div className="rounded-2xl overflow-hidden border-2 border-white shadow-xl">
            <img
              src="/manus-storage/tarif_etudiant_banner_e2283ac3.png"
              alt="Tarif Étudiant -10% — 3M Travel & Services"
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>

          {/* Panneau d'action — visible quand expanded */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs font-bold text-[#1e3a8a] mb-1">
                  Tarif Étudiant <span className="text-yellow-500">-10%</span>
                </p>
                <p className="text-xs text-gray-500 mb-3 leading-snug">
                  Présentez votre carte étudiant et bénéficiez de la réduction sur vos billets et visas.
                </p>
                <a
                  href={`https://wa.me/${phoneNumber}?text=${waMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 bg-[#25D366] text-white text-xs font-bold rounded-lg hover:bg-[#1ebe5a] transition-colors active:scale-[0.97]"
                >
                  💬 En profiter maintenant
                </a>
                <a
                  href="/evaluation-widget"
                  className="block w-full py-2 mt-2 bg-gradient-to-r from-[#0f2460] to-[#2563eb] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity active:scale-[0.97] text-center"
                >
                  ⭐ Évaluation gratuite de mon profil
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
