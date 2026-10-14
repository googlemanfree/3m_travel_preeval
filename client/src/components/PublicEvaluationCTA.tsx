import type { AnchorHTMLAttributes, ReactNode } from "react";

export type EvaluationProject = "travail" | "etudes" | "tourisme" | "evisa";

export function buildFreeEvaluationHref(project: EvaluationProject = "travail") {
  return `/?project=${encodeURIComponent(project)}#evaluation-multi`;
}

/** Texte d’accompagnement attendu près des CTA d’évaluation (évite la surprise compte / CV). */
export const EVALUATION_CTA_HINT = {
  fr: "Sans compte pour démarrer et envoyer l’évaluation — compte ensuite pour le suivi et le dépôt de CV.",
  en: "No account needed to start and submit the assessment — account afterwards for follow-up and CV upload.",
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
