import React from "react";

interface AccessibleInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

/**
 * Composant Input accessible conforme WCAG 2.1 AA
 * 
 * Caractéristiques :
 * - Label associé via htmlFor/id
 * - Messages d'erreur liés via aria-describedby
 * - Indication de champ requis
 * - Contraste des couleurs conforme
 * - Focus ring visible
 */
export const AccessibleInput = React.forwardRef<
  HTMLInputElement,
  AccessibleInputProps
>(
  (
    {
      label,
      error,
      hint,
      required = false,
      icon,
      id,
      className = "",
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const describedByIds = [
      error && errorId,
      hint && hintId,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="w-full">
        {/* Label */}
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-gray-900 mb-2"
        >
          {label}
          {required && (
            <span className="text-red-600 ml-1" aria-label="requis">
              *
            </span>
          )}
        </label>

        {/* Input Container */}
        <div className="relative">
          {/* Icône gauche */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={describedByIds || undefined}
            className={`
              w-full px-4 py-2 border-2 rounded-lg
              text-gray-900 placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:border-blue-500
              disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
              transition-all duration-200
              ${icon ? "pl-10" : ""}
              ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"}
              ${className}
            `}
            {...props}
          />
        </div>

        {/* Hint */}
        {hint && (
          <p id={hintId} className="text-xs text-gray-600 mt-1">
            {hint}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-red-600 mt-1 font-semibold"
          >
            ⚠️ {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = "AccessibleInput";

export default AccessibleInput;
