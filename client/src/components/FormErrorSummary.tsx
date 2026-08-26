import { AlertCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type FormErrorSummaryProps = {
  errors: Record<string, string | undefined>;
  labels?: Record<string, string>;
  title?: string;
  description?: string;
  formId?: string;
};

export default function FormErrorSummary({
  errors,
  labels = {},
  title,
  description,
  formId = "form",
}: FormErrorSummaryProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { language } = useLanguage();
  const entries = Object.entries(errors).filter(([, message]) => Boolean(message));
  const isEnglish = language === "en";
  const summaryTitle = title ?? (isEnglish ? "Check the information entered" : "Vérifiez les informations saisies");
  const summaryDescription = description ?? (isEnglish ? "Correct the fields listed below before continuing." : "Corrigez les champs indiqués avant de continuer.");
  const fieldId = (key: string) => `${formId}-field-${key}`;

  useEffect(() => {
    if (entries.length > 0) headingRef.current?.focus();
  }, [entries.length]);

  if (entries.length === 0) return null;

  return (
    <div
      role="alert"
      aria-labelledby={`${formId}-error-summary-title`}
      className="mb-6 border border-red-300 bg-red-50 px-4 py-4 text-red-950 shadow-sm"
    >
      <h2
        id={`${formId}-error-summary-title`}
        ref={headingRef}
        tabIndex={-1}
        className="flex items-center gap-2 text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
      >
        <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        {summaryTitle}
      </h2>
      <p className="mt-1 text-sm">{summaryDescription}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {entries.map(([key, message]) => (
          <li key={key}>
            <a
              href={`#${fieldId(key)}`}
              className="font-medium underline decoration-red-700 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
            >
              {labels[key] || key}: {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type { FormErrorSummaryProps };

// Les contrôles concernés doivent porter id={`${formId}-field-<fieldName>`}.
// La validation serveur reste la source de vérité finale.
