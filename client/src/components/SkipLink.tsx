import React from "react";
import { motion } from "framer-motion";

/**
 * Composant SkipLink pour l'accessibilité
 * 
 * Permet aux utilisateurs de clavier de sauter le contenu répétitif
 * (navigation, header) et d'aller directement au contenu principal.
 * 
 * Visible uniquement au focus clavier.
 */
export const SkipLink = () => {
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.a
      href="#main-content"
      onClick={handleSkip}
      className="
        sr-only focus:not-sr-only
        fixed top-0 left-0 z-50
        px-4 py-2 bg-blue-600 text-white font-semibold
        focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2
      "
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      Aller au contenu principal
    </motion.a>
  );
};

export default SkipLink;
