import type { AnchorHTMLAttributes, ReactNode } from "react";

export type EvaluationProject = "travail" | "etudes" | "tourisme" | "evisa";

export function buildFreeEvaluationHref(project: EvaluationProject = "travail") {
  return `/?project=${encodeURIComponent(project)}#evaluation-multi`;
}

export function PublicEvaluationCTA({
  project = "travail",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { project?: EvaluationProject; children: ReactNode }) {
  return (
    <a href={buildFreeEvaluationHref(project)} {...props}>
      {children}
    </a>
  );
}
