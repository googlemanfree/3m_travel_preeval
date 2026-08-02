import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Menu, ArrowUp, Settings } from "lucide-react";

interface FloatingAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
  priority?: number; // 1 = highest (always visible), 2+ = in menu
}

export function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrollVisible, setIsScrollVisible] = useState(false);
  const [, navigate] = useLocation();

  // Gérer la visibilité du bouton "Scroll to Top"
  useEffect(() => {
    const handleScroll = () => {
      setIsScrollVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Actions disponibles
  const actions: FloatingAction[] = [
    {
      id: "whatsapp",
      label: "Chat WhatsApp",
      icon: <MessageCircle className="w-6 h-6" />,
      color: "bg-green-500 hover:bg-green-600",
      action: () => {
        window.open(
          "https://wa.me/237698104832?text=" +
            encodeURIComponent("Bonjour, je souhaiterais obtenir une évaluation pour mon projet de visa."),
          "_blank"
        );
      },
      priority: 1, // Toujours visible
    },
    {
      id: "services",
      label: "Services",
      icon: <Settings className="w-6 h-6" />,
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => {
        setIsOpen(!isOpen);
      },
      priority: 2,
    },
    {
      id: "scroll-top",
      label: "Retour en haut",
      icon: <ArrowUp className="w-6 h-6" />,
      color: "bg-indigo-600 hover:bg-indigo-700",
      action: () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setIsOpen(false);
      },
      priority: 2,
    },
  ];

  // Actions principales (priorité 1)
  const primaryActions = actions.filter((a) => a.priority === 1);
  // Actions secondaires (priorité 2+)
  const secondaryActions = actions.filter((a) => a.priority !== 1);

  // Positions radiales pour les actions secondaires
  const getRadialPosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 1.5 - Math.PI * 0.75;
    const distance = 80;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  };

  return (
    <>
      {/* Menu flottant principal */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Actions secondaires (en radial quand le menu est ouvert) */}
        <AnimatePresence>
          {isOpen &&
            secondaryActions.map((action, index) => {
              const pos = getRadialPosition(index, secondaryActions.length);
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
                  exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: index * 0.05,
                  }}
                  onClick={() => {
                    action.action();
                  }}
                  className={`absolute w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 ${action.color}`}
                  title={action.label}
                  aria-label={action.label}
                >
                  {action.icon}
                </motion.button>
              );
            })}
        </AnimatePresence>

        {/* Bouton principal WhatsApp (toujours visible) */}
        <motion.button
          onClick={() => primaryActions[0]?.action()}
          className={`relative w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 ${primaryActions[0]?.color}`}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          title="Contactez-nous sur WhatsApp"
          aria-label="Contactez-nous sur WhatsApp"
        >
          {/* Pulse animation */}
          <motion.div
            className="absolute inset-0 rounded-full bg-green-400/30 border border-green-300/50"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="relative">{primaryActions[0]?.icon}</span>

          {/* Tooltip */}
          <motion.div
            className="absolute right-20 bg-gray-900 text-white text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none"
            initial={{ opacity: 0, x: 10 }}
            whileHover={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {primaryActions[0]?.label}
            <div className="absolute left-full top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 transform rotate-45" />
          </motion.div>
        </motion.button>

        {/* Bouton menu (visible quand le menu n'est pas ouvert) */}
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsOpen(true)}
              className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all duration-300 hover:scale-110"
              title="Menu"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Bouton fermer (visible quand le menu est ouvert) */}
        <AnimatePresence>
          {isOpen && (
            <motion.button
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0, rotate: 180 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsOpen(false)}
              className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-700 shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all duration-300 hover:scale-110"
              title="Fermer"
              aria-label="Fermer le menu"
            >
              <span className="text-xl">✕</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Backdrop pour fermer le menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-30"
          />
        )}
      </AnimatePresence>

      {/* Label mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.2 }}
            className="fixed bottom-32 right-6 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg z-40 md:hidden"
          >
            Sélectionnez un service
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
