export type EvaluationDeclarationStatus = "not_declared" | "pending_validation" | "validated" | "refused";

export function resolveEvaluationDeclaration(alreadyCompleted: boolean, now = new Date()): {
  evaluationDeclarationStatus: EvaluationDeclarationStatus;
  evaluationDeclaredAt: Date | null;
} {
  return alreadyCompleted
    ? { evaluationDeclarationStatus: "pending_validation", evaluationDeclaredAt: now }
    : { evaluationDeclarationStatus: "not_declared", evaluationDeclaredAt: null };
}

export function isEvaluationDeclarationComplete(status: EvaluationDeclarationStatus | null | undefined): boolean {
  return status === "validated";
}

export function requiresEvaluationValidation(status: EvaluationDeclarationStatus | null | undefined): boolean {
  return status === "pending_validation" || status === "refused";
}
