import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface AccessibleDropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

/**
 * Composant Dropdown accessible conforme WCAG 2.1 AA
 * 
 * Caractéristiques :
 * - Support clavier complet (Arrow Up/Down, Enter, Escape)
 * - aria-expanded et aria-haspopup
 * - Focus management
 * - Animations fluides
 */
export const AccessibleDropdown = React.forwardRef<
  HTMLDivElement,
  AccessibleDropdownProps
>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Sélectionner...",
      label,
      ariaLabel,
      disabled = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Gestion du clavier
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setFocusedIndex((prev) =>
              prev < options.length - 1 ? prev + 1 : 0
            );
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex((prev) =>
              prev > 0 ? prev - 1 : options.length - 1
            );
          }
          break;

        case "Enter":
        case " ":
          e.preventDefault();
          if (isOpen && focusedIndex >= 0) {
            onChange(options[focusedIndex].value);
            setIsOpen(false);
          } else {
            setIsOpen(true);
          }
          break;

        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;

        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;

        case "End":
          e.preventDefault();
          setFocusedIndex(options.length - 1);
          break;

        default:
          break;
      }
    };

    // Focus sur l'option en surbrillance
    useEffect(() => {
      if (isOpen && focusedIndex >= 0) {
        const items = listRef.current?.querySelectorAll("[role='option']");
        (items?.[focusedIndex] as HTMLElement)?.focus();
      }
    }, [focusedIndex, isOpen]);

    // Fermer au clic extérieur
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          ref &&
          "current" in ref &&
          !ref.current?.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen, ref]);

    return (
      <div ref={ref} className="relative w-full">
        {/* Label */}
        {label && (
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            {label}
          </label>
        )}

        {/* Button */}
        <button
          ref={buttonRef}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={ariaLabel || label || placeholder}
          disabled={disabled}
          className={`
            w-full px-4 py-2 border-2 rounded-lg
            text-left font-medium
            flex items-center justify-between gap-2
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            focus:border-blue-500
            transition-all duration-200
            ${
              isOpen
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-white"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <span>
            {selectedOption ? (
              <span className="flex items-center gap-2">
                {selectedOption.icon && <span>{selectedOption.icon}</span>}
                {selectedOption.label}
              </span>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </span>
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown List */}
        <AnimatePresence>
          {isOpen && (
            <motion.ul
              ref={listRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              role="listbox"
              className="
                absolute top-full left-0 right-0 mt-2 z-50
                bg-white border-2 border-blue-500 rounded-lg
                shadow-lg overflow-hidden
              "
            >
              {options.map((option, index) => (
                <motion.li
                  key={option.value}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <button
                    role="option"
                    aria-selected={value === option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    onKeyDown={handleKeyDown}
                    className={`
                      w-full px-4 py-2.5 text-left
                      flex items-center gap-2
                      transition-colors duration-150
                      ${
                        value === option.value
                          ? "bg-blue-100 text-blue-900 font-semibold"
                          : "text-gray-900 hover:bg-gray-100"
                      }
                      ${focusedIndex === index ? "bg-blue-50" : ""}
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                    `}
                  >
                    {option.icon && <span>{option.icon}</span>}
                    {option.label}
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

AccessibleDropdown.displayName = "AccessibleDropdown";

export default AccessibleDropdown;
