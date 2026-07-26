import { useEffect, useCallback } from "react";
import { useLocation } from "wouter";

/**
 * Hook pour gérer les raccourcis clavier globaux
 * 
 * Raccourcis disponibles :
 * - ? : Afficher l'aide
 * - A : Ouvrir Assistant IA
 * - V : Accéder aux visas
 * - D : Dashboard
 * - H : Accueil
 * - S : Recherche
 * - C : Contact/Support
 * - / : Focus barre de recherche
 * - Esc : Fermer modales/menus
 */

export interface KeyboardShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
  description: string;
  excludeInputs?: boolean; // Ne pas déclencher si focus sur input
}

const DEFAULT_SHORTCUTS: KeyboardShortcutConfig[] = [
  {
    key: "?",
    callback: () => {
      // Afficher l'aide des raccourcis
      const event = new CustomEvent("show-keyboard-help");
      window.dispatchEvent(event);
    },
    description: "Afficher l'aide des raccourcis clavier",
  },
  {
    key: "a",
    callback: () => {
      // Ouvrir Assistant IA
      const event = new CustomEvent("open-ai-assistant");
      window.dispatchEvent(event);
    },
    description: "Ouvrir l'Assistant IA",
  },
  {
    key: "v",
    callback: () => {
      // Accéder aux visas
      window.location.href = "/visa-types";
    },
    description: "Accéder aux types de visa",
  },
  {
    key: "d",
    callback: () => {
      // Dashboard
      window.location.href = "/dashboard";
    },
    description: "Aller au Dashboard",
  },
  {
    key: "h",
    callback: () => {
      // Accueil
      window.location.href = "/";
    },
    description: "Aller à l'accueil",
  },
  {
    key: "s",
    callback: () => {
      // Ouvrir la recherche
      const event = new CustomEvent("open-search");
      window.dispatchEvent(event);
    },
    description: "Ouvrir la recherche",
  },
  {
    key: "c",
    callback: () => {
      // Contact/Support
      const event = new CustomEvent("open-contact");
      window.dispatchEvent(event);
    },
    description: "Contacter le support",
  },
  {
    key: "/",
    callback: () => {
      // Focus barre de recherche
      const searchInput = document.querySelector(
        'input[type="search"], input[placeholder*="Recherche"]'
      ) as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    description: "Focus sur la barre de recherche",
    excludeInputs: false, // Permettre même dans les inputs
  },
];

export const useKeyboardShortcuts = (
  customShortcuts?: KeyboardShortcutConfig[]
) => {
  const [location] = useLocation();
  const shortcuts = [...DEFAULT_SHORTCUTS, ...(customShortcuts || [])];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ne pas déclencher si focus sur input/textarea/contenteditable
      const target = e.target as HTMLElement;
      const isFormElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      // Parcourir les raccourcis
      for (const shortcut of shortcuts) {
        const keyMatch =
          e.key.toLowerCase() === shortcut.key.toLowerCase() ||
          e.code === shortcut.key;

        const modifiersMatch =
          e.ctrlKey === (shortcut.ctrlKey || false) &&
          e.shiftKey === (shortcut.shiftKey || false) &&
          e.altKey === (shortcut.altKey || false) &&
          e.metaKey === (shortcut.metaKey || false);

        if (keyMatch && modifiersMatch) {
          // Vérifier si on doit exclure les inputs
          if (shortcut.excludeInputs !== false && isFormElement) {
            continue;
          }

          e.preventDefault();
          shortcut.callback();
          break;
        }
      }

      // Gestion spéciale pour Escape
      if (e.key === "Escape") {
        // Fermer les modales
        const modals = document.querySelectorAll('[role="dialog"]');
        modals.forEach((modal) => {
          const closeBtn = modal.querySelector(
            'button[aria-label="Fermer"]'
          ) as HTMLButtonElement;
          if (closeBtn) {
            closeBtn.click();
          }
        });

        // Fermer les dropdowns
        const dropdowns = document.querySelectorAll('[role="listbox"]');
        dropdowns.forEach((dropdown) => {
          const button = dropdown.previousElementSibling as HTMLButtonElement;
          if (button && button.getAttribute("aria-expanded") === "true") {
            button.click();
          }
        });
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Retourner la liste des raccourcis pour affichage
  return shortcuts;
};

/**
 * Composant pour afficher l'aide des raccourcis clavier
 */
export const KeyboardShortcutsHelp = ({
  shortcuts,
  isOpen,
  onClose,
}: {
  shortcuts: KeyboardShortcutConfig[];
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Raccourcis Clavier
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-start gap-3 pb-3 border-b">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-semibold text-gray-900 whitespace-nowrap">
                {shortcut.key.toUpperCase()}
              </kbd>
              <p className="text-sm text-gray-700">{shortcut.description}</p>
            </div>
          ))}

          <div className="flex items-start gap-3 pb-3 border-b">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-semibold text-gray-900 whitespace-nowrap">
              ESC
            </kbd>
            <p className="text-sm text-gray-700">
              Fermer les modales et menus
            </p>
          </div>

          <div className="flex items-start gap-3">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-semibold text-gray-900 whitespace-nowrap">
              TAB
            </kbd>
            <p className="text-sm text-gray-700">Navigation clavier standard</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
