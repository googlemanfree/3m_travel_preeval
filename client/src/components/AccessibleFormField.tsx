import React, { useState, useCallback } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

/**
 * Composant AccessibleFormField
 * 
 * Champ de formulaire entièrement accessible WCAG 2.1 AAA avec :
 * - Labels associés
 * - Messages d'erreur en temps réel
 * - Validation instantanée
 * - Indicateurs visuels et textuels
 * - Support lecteur d'écran complet
 * - Contraste conforme AAA
 */

export interface FormFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "password" | "textarea" | "select";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  errorDetails?: string; // Détails supplémentaires pour lecteur d'écran
  success?: boolean;
  successMessage?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  hint?: string; // Conseil d'aide
  options?: { value: string; label: string }[]; // Pour select
  className?: string;
  ariaDescribedBy?: string;
  validator?: (value: string) => { valid: boolean; error?: string };
}

export const AccessibleFormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  errorDetails,
  success,
  successMessage,
  required,
  disabled,
  autoComplete,
  pattern,
  minLength,
  maxLength,
  hint,
  options,
  className,
  ariaDescribedBy,
  validator,
}) => {
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();

  // IDs pour aria-describedby
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const successId = `${id}-success`;
  const describedByIds = [
    ariaDescribedBy,
    hint ? hintId : null,
    touched && (error || validationError) ? errorId : null,
    touched && success ? successId : null,
  ]
    .filter(Boolean)
    .join(" ");

  // Validation en temps réel
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      // Validation si validator fourni
      if (validator && touched) {
        const result = validator(newValue);
        setValidationError(result.error);
      }
    },
    [onChange, validator, touched]
  );

  const handleBlur = () => {
    setTouched(true);

    // Validation au blur
    if (validator) {
      const result = validator(value);
      setValidationError(result.error);
    }

    onBlur?.();
  };

  // Déterminer l'état du champ
  const hasError = touched && (error || validationError);
  const isValid = touched && !hasError && success;

  const commonProps = {
    id,
    value,
    onChange: handleChange,
    onBlur: handleBlur,
    disabled,
    required,
    "aria-invalid": hasError as any,
    "aria-required": required as any,
    "aria-describedby": describedByIds || undefined,
    className: `
      w-full px-4 py-3 rounded-lg border-2 transition-all
      font-sans text-base
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60
      ${
        hasError
          ? "border-red-500 focus:ring-red-500 focus:ring-offset-red-50 bg-red-50"
          : isValid
            ? "border-green-500 focus:ring-green-500 focus:ring-offset-green-50 bg-green-50"
            : "border-gray-300 focus:ring-blue-500 focus:ring-offset-blue-50"
      }
      ${className}
    `,
  };

  return (
    <div className="mb-6">
      {/* Label */}
      <label
        htmlFor={id}
        className={`
          block mb-2 font-semibold text-base
          ${hasError ? "text-red-700" : isValid ? "text-green-700" : "text-gray-900"}
        `}
      >
        {label}
        {required && (
          <span
            className="ml-1 text-red-600 font-bold"
            aria-label="requis"
            title="Ce champ est obligatoire"
          >
            *
          </span>
        )}
      </label>

      {/* Hint/Conseil */}
      {hint && (
        <div
          id={hintId}
          className="mb-2 text-sm text-gray-600 flex items-start gap-2"
          role="note"
        >
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{hint}</span>
        </div>
      )}

      {/* Input/Textarea/Select */}
      {type === "textarea" ? (
        <textarea
          {...commonProps}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          className={`${commonProps.className} resize-vertical min-h-32`}
        />
      ) : type === "select" ? (
        <select {...commonProps} className={commonProps.className}>
          <option value="">
            {placeholder || "Sélectionner une option"}
          </option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...commonProps}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          pattern={pattern}
          minLength={minLength}
          maxLength={maxLength}
        />
      )}

      {/* Message d'erreur */}
      {hasError && (
        <div
          id={errorId}
          role="alert"
          className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
        >
          <AlertCircle
            className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="text-red-700 font-semibold text-sm">
              {error || validationError}
            </p>
            {errorDetails && (
              <p className="text-red-600 text-xs mt-1">{errorDetails}</p>
            )}
          </div>
        </div>
      )}

      {/* Message de succès */}
      {isValid && (
        <div
          id={successId}
          role="status"
          aria-live="polite"
          className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2"
        >
          <CheckCircle2
            className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-green-700 font-semibold text-sm">
            {successMessage || "✓ Champ valide"}
          </p>
        </div>
      )}

      {/* Compteur de caractères pour maxLength */}
      {maxLength && type !== "select" && (
        <div
          className={`mt-2 text-xs ${
            value.length > maxLength * 0.8
              ? "text-orange-600 font-semibold"
              : "text-gray-500"
          }`}
          aria-live="polite"
        >
          {value.length} / {maxLength} caractères
        </div>
      )}
    </div>
  );
};

/**
 * Validateurs prédéfinis
 */
export const FormValidators = {
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      valid: emailRegex.test(value),
      error: emailRegex.test(value)
        ? undefined
        : "Veuillez entrer une adresse email valide (ex: exemple@domaine.com)",
    };
  },

  phone: (value: string) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const hasDigits = /\d/.test(value);
    return {
      valid: phoneRegex.test(value) && hasDigits && value.replace(/\D/g, "").length >= 10,
      error:
        !phoneRegex.test(value)
          ? "Le numéro de téléphone contient des caractères invalides"
          : !hasDigits
            ? "Le numéro doit contenir au moins un chiffre"
            : value.replace(/\D/g, "").length < 10
              ? "Le numéro doit contenir au moins 10 chiffres"
              : undefined,
    };
  },

  password: (value: string) => {
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
    const isLongEnough = value.length >= 8;

    const errors = [];
    if (!isLongEnough) errors.push("au moins 8 caractères");
    if (!hasUppercase) errors.push("une lettre majuscule");
    if (!hasLowercase) errors.push("une lettre minuscule");
    if (!hasNumber) errors.push("un chiffre");
    if (!hasSpecial) errors.push("un caractère spécial");

    return {
      valid: errors.length === 0,
      error:
        errors.length > 0
          ? `Le mot de passe doit contenir : ${errors.join(", ")}`
          : undefined,
    };
  },

  url: (value: string) => {
    try {
      new URL(value);
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: "Veuillez entrer une URL valide (ex: https://exemple.com)",
      };
    }
  },

  required: (value: string) => {
    return {
      valid: value.trim().length > 0,
      error: "Ce champ est obligatoire",
    };
  },

  minLength: (min: number) => (value: string) => {
    return {
      valid: value.length >= min,
      error:
        value.length < min
          ? `Minimum ${min} caractères requis (actuellement ${value.length})`
          : undefined,
    };
  },

  maxLength: (max: number) => (value: string) => {
    return {
      valid: value.length <= max,
      error:
        value.length > max
          ? `Maximum ${max} caractères autorisés (actuellement ${value.length})`
          : undefined,
    };
  },

  pattern: (regex: RegExp, message: string) => (value: string) => {
    return {
      valid: regex.test(value),
      error: regex.test(value) ? undefined : message,
    };
  },

  // Validateur composé
  compose: (...validators: Array<(value: string) => { valid: boolean; error?: string }>) => (
    value: string
  ) => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) return result;
    }
    return { valid: true };
  },
};
