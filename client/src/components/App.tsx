import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

/**
 * Bouton WhatsApp flottant en bas à droite de l'écran
 * Permet une prise de contact rapide avec l'agence
 */
export function FloatingWhatsAppButton() {
  const [isHovered, setIsHovered] = useState(false);

  // Numéro WhatsApp de l'agence
  const whatsappNumber = "237698104832";
  const whatsappMessage = "Bonjour, je souhaiterais obtenir une évaluation pour mon projet de visa.";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <motion.div
      className="fixed bottom-6 left-6 z-40"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.4, type: "spring", stiffness: 200 }}
    >
      {/* Pulse d'arrière-plan */}
      <motion.div
        className="absolute inset-0 rounded-full bg-green-500/20 border border-green-400/30"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Bouton principal */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contacter 3M Travel sur WhatsApp"
        className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-7 h-7 text-white" />

        {/* Tooltip au survol */}
        <motion.div
          className="absolute left-16 bg-gray-900 text-white text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none"
          initial={{ opacity: 0, x: 10 }}
          animate={isHovered ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
        >
          Contactez-nous sur WhatsApp
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 transform rotate-45" />
        </motion.div>
      </motion.a>

      {/* Label optionnel (visible sur mobile) */}
      <motion.div
        className="absolute bottom-16 left-0 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap md:hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.3 }}
      >
        💬 Chat rapide
      </motion.div>
    </motion.div>
  );
}
