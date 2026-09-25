import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { OFFICE_CONTACTS, officeWhatsAppUrl } from "@/lib/officeContacts";
import { whatsAppMessageForPage } from "@/lib/whatsappContext";

/**
 * Point de contact WhatsApp global.
 * Le bouton Aureol est monté séparément par App.tsx et se place au-dessus/
 * à gauche selon la largeur d'écran afin d'éviter tout chevauchement.
 * Le message est adapté à la page consultée (procédure, vols, assurance…) : le conseiller sait de quoi il s'agit.
 */
export function FloatingActionMenu() {
  const [isHovered, setIsHovered] = useState(false);
  const [location] = useLocation();
  const office = OFFICE_CONTACTS.cameroon;
  const urlForCurrentPage = () => officeWhatsAppUrl(office, whatsAppMessageForPage({ pathname: window.location.pathname, pageTitle: document.title }));
  const [whatsappUrl, setWhatsappUrl] = useState(() => officeWhatsAppUrl(office, whatsAppMessageForPage({ pathname: "/" })));

  // Le titre de la page est posé après le rendu de la route : on attend un instant, et on recalcule aussi au clic.
  useEffect(() => {
    const timer = window.setTimeout(() => setWhatsappUrl(urlForCurrentPage()), 350);
    return () => window.clearTimeout(timer);
  }, [location]);

  return (
    <div className="safe-bottom-floating safe-bottom-floating-whatsapp fixed right-4 z-40 md:right-6">
      <motion.a
        href={whatsappUrl}
        onClick={(event) => { event.currentTarget.href = urlForCurrentPage(); }}
        onFocus={(event) => { event.currentTarget.href = urlForCurrentPage(); }}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Contacter 3M Travel sur WhatsApp"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl shadow-green-900/25 ring-4 ring-white/80 transition-shadow hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-emerald-200 focus-visible:ring-offset-2"
      >
        <MessageCircle className="relative z-10 h-6 w-6" />
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-2 border-emerald-200/70"
          animate={{ scale: [1, 1.18, 1], opacity: [0.75, 0, 0.75] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
        {isHovered && (
          <span className="absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg">
            WhatsApp — Besoin d’aide ?
          </span>
        )}
      </motion.a>
    </div>
  );
}
