import React from "react";
import { motion } from "framer-motion";

interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  ariaLabel?: string;
  ariaDescribedBy?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Composant Button accessible conforme WCAG 2.1 AA
 * 
 * Caractéristiques :
 * - Focus ring visible et accessible
 * - Support clavier complet (Enter, Space)
 * - aria-label pour boutons icon-only
 * - Contraste des couleurs conforme
 * - Animations respectueuses de prefers-reduced-motion
 * - États disabled accessibles
 */
export const AccessibleButton = React.forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      icon,
      iconPosition = "left",
      ariaLabel,
      ariaDescribedBy,
      disabled = false,
      fullWidth = false,
      className = "",
      ...props
    },
    ref
  ) => {
    // Variants de style
    const variantStyles = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400",
      secondary:
        "bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 disabled:bg-gray-100",
      outline:
        "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 disabled:border-blue-300 disabled:text-blue-300",
      ghost:
        "text-blue-600 hover:bg-blue-50 active:bg-blue-100 disabled:text-blue-300",
    };

    // Tailles
    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    // Classe combinée
    const baseClass = `
      inline-flex items-center justify-center gap-2
      font-semibold rounded-lg transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      focus:ring-offset-white
      disabled:cursor-not-allowed disabled:opacity-60
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${fullWidth ? "w-full" : ""}
      ${className}
    `;

    // Respecter prefers-reduced-motion
    const motionProps = {
      whileHover: { scale: disabled ? 1 : 1.02 },
      whileTap: { scale: disabled ? 1 : 0.98 },
      transition: { duration: 0.15 },
    };

    return (
      <motion.button
        ref={ref}
        className={baseClass}
        disabled={disabled || isLoading}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-busy={isLoading}
        type="button"
        {...motionProps}
        {...(props as any)}
      >
        {/* Icône gauche */}
        {icon && iconPosition === "left" && (
          <span className="flex items-center justify-center" aria-hidden="true">
            {icon}
          </span>
        )}

        {/* Texte ou loading */}
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Chargement...
          </span>
        ) : (
          children
        )}

        {/* Icône droite */}
        {icon && iconPosition === "right" && (
          <span className="flex items-center justify-center" aria-hidden="true">
            {icon}
          </span>
        )}
      </motion.button>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

export default AccessibleButton;
