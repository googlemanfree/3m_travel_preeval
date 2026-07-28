import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

/**
 * Composant Modal accessible conforme WCAG 2.1 AA
 * 
 * Caractéristiques :
 * - Focus trap (focus reste dans la modal)
 * - aria-modal et aria-labelledby
 * - Fermeture avec Escape
 * - Focus restauré après fermeture
 * - Overlay cliquable pour fermer
 */
export const AccessibleModal = React.forwardRef<
  HTMLDivElement,
  AccessibleModalProps
>(
  (
    { isOpen, onClose, title, description, children, size = "md" },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Tailles
    const sizeStyles = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
    };

    // Gestion du focus trap
    useEffect(() => {
      if (!isOpen) return;

      // Sauvegarder l'élément actif avant d'ouvrir la modal
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus sur la modal
      setTimeout(() => {
        const closeButton = modalRef.current?.querySelector(
          "[data-close-button]"
        ) as HTMLButtonElement;
        closeButton?.focus();
      }, 100);

      // Gestion du clavier
      const handleKeyDown = (e: KeyboardEvent) => {
        // Fermer avec Escape
        if (e.key === "Escape") {
          onClose();
          return;
        }

        // Focus trap
        if (e.key === "Tab" && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
          ) as NodeListOf<HTMLElement>;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        // Restaurer le focus
        previousActiveElement.current?.focus();
      };
    }, [isOpen, onClose]);

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40"
              aria-hidden="true"
            />

            {/* Modal */}
            <motion.div
              ref={ref || modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`
                fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                z-50 w-[90vw] ${sizeStyles[size]}
                bg-white rounded-lg shadow-2xl
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              aria-describedby={description ? "modal-description" : undefined}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2
                  id="modal-title"
                  className="text-xl font-bold text-gray-900"
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  data-close-button
                  aria-label="Fermer la modal"
                  className="
                    p-2 text-gray-500 hover:text-gray-700
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    rounded-lg transition-colors
                  "
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              {description && (
                <p id="modal-description" className="sr-only">
                  {description}
                </p>
              )}

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
);

AccessibleModal.displayName = "AccessibleModal";

export default AccessibleModal;
