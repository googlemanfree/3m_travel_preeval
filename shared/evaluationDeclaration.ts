export type EvaluationDeclarationStatus = "not_declared" | "declared_complete";

export function resolveEvaluationDeclaration(alreadyCompleted: boolean, now = new Date()): {
  evaluationDeclarationStatus: EvaluationDeclarationStatus;
  evaluationDeclaredAt: Date | null;
} {
  return alreadyCompleted
    ? { evaluationDeclarationStatus: "declared_complete", evaluationDeclaredAt: now }
    : { evaluationDeclarationStatus: "not_declared", evaluationDeclaredAt: null };
}

export function isEvaluationDeclarationComplete(status: EvaluationDeclarationStatus | null | undefined): boolean {
  return status === "declared_complete";
}
