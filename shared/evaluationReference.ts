import { accountReference } from "./caseReference";

/**
 * Référence AFFICHÉE d'un dossier d'évaluation : « COMPTE-… » tant que rien n'est payé, « 3M-… » seulement une fois les frais d'ouverture payés.
 * Le numéro stocké (`dossierNumber`) reste la clé technique interne : il peut être attribué plus tôt, mais ne doit jamais être montré comme référence
 * d'un dossier non activé (bilan, e-mails, PDF, notifications, listes de suivi).
 * Sans compte rattaché et sans paiement : aucune référence plutôt qu'une fausse référence « 3M ».
 */
const PAID_APPLICATION_STATUSES = ["paye", "en_attente_documents", "documents_recus", "soumis_agences", "en_cours_recrutement", "contrat_obtenu", "visa_approuve"];

export type EvaluationReferenceSource = { dossierNumber?: unknown; candidateId?: unknown; paymentStatus?: unknown; dossierStatus?: unknown };

export function isEvaluationPaid(app: EvaluationReferenceSource): boolean {
  return app.paymentStatus === "SUCCESS" || PAID_APPLICATION_STATUSES.includes(String(app.dossierStatus ?? ""));
}

export function evaluationDisplayReference(app: EvaluationReferenceSource): string | null {
  const number = String(app.dossierNumber ?? "").trim();
  if (isEvaluationPaid(app) && /^3M-/i.test(number)) return number;
  const candidateId = Number(app.candidateId);
  if (Number.isInteger(candidateId) && candidateId > 0) return accountReference(candidateId);
  return null;
}
