import { isPreDossierStatus } from "./candidateStatus";

/**
 * Incohérences entre les dossiers : règles pures (aucun accès à la base), appliquées aux lignes chargées par le routeur.
 * Une règle « corrigeable » a une correction sans risque (elle ne touche ni pièces, ni paiements, ni messages) ; les autres sont signalées pour décision.
 */
export type ConsistencyApplication = {
  id: number;
  candidateId: number | null;
  fullName: string;
  dossierNumber: string;
  dossierStatus: string;
  evaluationDeliveryStatus: string | null;
  activationRequestedAt: string | Date | null;
  paymentStatus: string | null;
  candidateStatus?: string | null;
};
export type ConsistencyAgency = { id: number; fullName: string; status: string; initialPaymentStatus: string | null };
export type ConsistencyRow = { id: number; label: string; detail: string };
export type ConsistencyCode = "bilan_sent_status_mismatch" | "paid_but_pre_dossier" | "opening_without_bilan" | "unpaid_with_3m_number" | "agency_advanced_unpaid";
export type ConsistencyIssue = { code: ConsistencyCode; label: string; explanation: string; severity: "high" | "medium" | "info"; fixable: boolean; rows: ConsistencyRow[]; count: number };

export const FIXABLE_CODES: readonly ConsistencyCode[] = ["bilan_sent_status_mismatch"];

const RULES: Array<{ code: ConsistencyCode; label: string; explanation: string; severity: ConsistencyIssue["severity"]; fixable: boolean }> = [
  { code: "bilan_sent_status_mismatch", label: "Bilan envoyé mais étape du dossier pas à jour", explanation: "Le bilan est parti, mais le dossier est resté à « nouveau » ou « en évaluation ». Correction : le dossier passe à « bilan envoyé ».", severity: "medium", fixable: true },
  { code: "paid_but_pre_dossier", label: "Frais payés mais compte pas activé", explanation: "Le paiement est confirmé et le compte est encore un pré-dossier : le dossier est à activer.", severity: "high", fixable: false },
  { code: "opening_without_bilan", label: "Ouverture demandée sans bilan envoyé", explanation: "Une demande d'ouverture existe alors que le bilan n'a pas été envoyé (évaluation déclarée à l'inscription ou erreur) : à vérifier.", severity: "medium", fixable: false },
  { code: "unpaid_with_3m_number", label: "Numéro technique « 3M-… » sur un dossier non payé", explanation: "Le numéro interne existe déjà, mais n'est jamais affiché : la référence montrée reste COMPTE-… jusqu'au paiement. Information seulement.", severity: "info", fixable: false },
  { code: "agency_advanced_unpaid", label: "Dossier agence avancé sans paiement enregistré", explanation: "Le dossier agence a progressé alors que ses frais ne sont pas enregistrés comme payés : paiement au comptoir à enregistrer, ou dossier à reprendre.", severity: "high", fixable: false },
];

export function findConsistencyIssues(input: { applications: ConsistencyApplication[]; agencyDossiers: ConsistencyAgency[] }): ConsistencyIssue[] {
  const buckets = new Map<ConsistencyCode, ConsistencyRow[]>();
  const add = (code: ConsistencyCode, row: ConsistencyRow) => buckets.set(code, [...(buckets.get(code) ?? []), row]);
  for (const app of input.applications) {
    const paid = app.paymentStatus === "SUCCESS";
    const sent = app.evaluationDeliveryStatus === "sent";
    const label = `${app.fullName} (${app.dossierNumber})`;
    if (sent && ["nouveau", "en_evaluation"].includes(app.dossierStatus) && !paid) add("bilan_sent_status_mismatch", { id: app.id, label, detail: `statut « ${app.dossierStatus} » alors que le bilan est envoyé` });
    if (paid && app.candidateStatus !== undefined && app.candidateStatus !== null && isPreDossierStatus(app.candidateStatus)) add("paid_but_pre_dossier", { id: app.id, label, detail: "paiement confirmé, compte encore en pré-dossier" });
    if (app.activationRequestedAt && !sent && !paid) add("opening_without_bilan", { id: app.id, label, detail: "ouverture demandée, bilan non envoyé" });
    if (/^3M-/i.test(app.dossierNumber) && !paid && !["paye", "en_attente_documents", "documents_recus", "soumis_agences", "en_cours_recrutement", "contrat_obtenu", "visa_approuve"].includes(app.dossierStatus)) add("unpaid_with_3m_number", { id: app.id, label, detail: "numéro technique 3M-… sur un dossier non payé" });
  }
  for (const dossier of input.agencyDossiers) {
    if (dossier.status !== "nouveau" && String(dossier.initialPaymentStatus ?? "").toLowerCase() !== "paid") add("agency_advanced_unpaid", { id: dossier.id, label: `${dossier.fullName} (3M-AGN-${String(dossier.id).padStart(4, "0")})`, detail: `statut « ${dossier.status} », frais non enregistrés comme payés` });
  }
  return RULES.map((rule) => {
    const rows = buckets.get(rule.code) ?? [];
    return { ...rule, rows: rows.slice(0, 50), count: rows.length };
  });
}
