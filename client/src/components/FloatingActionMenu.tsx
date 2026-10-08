import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { OFFICE_CONTACTS, officeWhatsAppUrl } from "@/lib/officeContacts";
import { whatsAppMessageForPage } from "@/lib/whatsappContext";

/**
 * Point de contact WhatsApp global, discret et toujours accessible.
 * Le bouton Aureol est monté séparément par App.tsx pour éviter tout chevauchement.
 * Le message est adapté à la page consultée (procédure, vols, assurance…).
 */
export function FloatingActionMenu() {
  const [isHovered, setIsHovered] = useState(false);
  const [location] = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const office = OFFICE_CONTACTS.cameroon;
  const urlForCurrentPage = () =>
    officeWhatsAppUrl(office, whatsAppMessageForPage({ pathname: window.location.pathname, pageTitle: document.title }));
  const [whatsappUrl, setWhatsappUrl] = useState(() =>
    officeWhatsAppUrl(office, whatsAppMessageForPage({ pathname: "/" })),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setWhatsappUrl(urlForCurrentPage()), 350);
    return () => window.clearTimeout(timer);
  }, [location]);

  return (
    <div className="safe-bottom-floating safe-bottom-floating-whatsapp fixed right-4 z-40 md:right-6">
      <motion.a
        href={whatsappUrl}
        onClick={(event) => {
          event.currentTarget.href = urlForCurrentPage();
        }}
        onFocus={(event) => {
          event.currentTarget.href = urlForCurrentPage();
        }}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.06 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
        aria-label="Contacter 3M Travel sur WhatsApp"
        data-testid="floating-whatsapp"
        className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-green-900/20 ring-2 ring-white/90 transition-shadow hover:shadow-xl focus-visible:ring-4 focus-visible:ring-emerald-200 focus-visible:ring-offset-2 md:h-14 md:w-14"
      >
        <MessageCircle className="relative z-10 h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
        {!prefersReducedMotion && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-emerald-200/50"
            animate={{ scale: [1, 1.22, 1], opacity: [0.45, 0, 0.45] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span
          className={`pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-opacity ${
            isHovered ? "opacity-100" : "opacity-0 md:group-focus-visible:opacity-100"
          }`}
        >
          WhatsApp — une question ?
        </span>
      </motion.a>
    </div>
  );
}
