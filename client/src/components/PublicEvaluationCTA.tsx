import type { AnchorHTMLAttributes, ReactNode } from "react";

export type EvaluationProject = "travail" | "etudes" | "tourisme" | "evisa";

export function buildFreeEvaluationHref(project: EvaluationProject = "travail") {
  return `/?project=${encodeURIComponent(project)}#evaluation-multi`;
}

/** Texte d’accompagnement attendu près des CTA d’évaluation (évite la surprise compte / CV). */
export const EVALUATION_CTA_HINT = {
  fr: "Compte candidat gratuit requis pour envoyer l’évaluation — il sert aussi au suivi et au dépôt de CV.",
  en: "A free candidate account is required to submit the assessment — it also covers follow-up and CV upload.",
} as const;

export function PublicEvaluationCTA({
  project = "travail",
  children,
  hint,
  hintClassName,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  project?: EvaluationProject;
  children: ReactNode;
  /** Affiche le parcours attendu sous le bouton. */
  hint?: boolean | string;
  hintClassName?: string;
}) {
  const hintText =
    hint === true ? EVALUATION_CTA_HINT.fr : typeof hint === "string" ? hint : null;

  if (!hintText) {
    return (
      <a href={buildFreeEvaluationHref(project)} {...props}>
        {children}
      </a>
    );
  }

  const { className, ...rest } = props;
  return (
    <span className="inline-flex flex-col items-stretch gap-1.5">
      <a href={buildFreeEvaluationHref(project)} className={className} {...rest}>
        {children}
      </a>
      <span
        className={hintClassName ?? "max-w-sm text-center text-xs leading-5 text-slate-600"}
        data-testid="evaluation-cta-hint"
      >
        {hintText}
      </span>
    </span>
  );
}
