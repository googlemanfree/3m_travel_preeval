/**
 * Résumé d'avancement d'un dossier tel que le client le lit (carte de dossier, tableau des paiements).
 * Source unique : la carte et le tableau affichaient chacun leur propre calcul, et un dossier dont le paiement était confirmé
 * restait bloqué à « 10 % — Nouveau dossier » tant que l'administration n'avait pas changé son statut interne.
 */
export type ClientDossierStatusSummary = {
  label: string;
  progress: number;
  tone: string;
  nextAction: string;
};

/**
 * `agreementSigned` : true = protocole signé, false = à signer, null/undefined = inconnu (aucune promesse sur la signature).
 */
export function clientDossierStatusSummary(status: string | null | undefined, paymentStatus?: string | null, agreementSigned?: boolean | null): ClientDossierStatusSummary {
  const normalized = String(status ?? "evaluation").toLowerCase();
  if (["approuve", "visa_approuve", "approved"].includes(normalized)) return { label: "Visa approuvé", progress: 100, tone: "border-emerald-200 bg-emerald-50 text-emerald-800", nextAction: "Préparer votre départ" };
  if (["refuse", "rejected"].includes(normalized)) return { label: "Décision à revoir", progress: 100, tone: "border-rose-200 bg-rose-50 text-rose-800", nextAction: "Contacter votre conseiller" };
  if (["soumis", "submitted"].includes(normalized)) return { label: "Dossier soumis", progress: 80, tone: "border-indigo-200 bg-indigo-50 text-indigo-800", nextAction: "Suivre la décision" };
  if (["traitement", "processing"].includes(normalized)) return { label: "En traitement", progress: 65, tone: "border-blue-200 bg-blue-50 text-blue-800", nextAction: "Vérifier les messages" };
  if (["documents", "documents_requis"].includes(normalized)) return { label: "Documents requis", progress: 45, tone: "border-amber-200 bg-amber-50 text-amber-800", nextAction: "Déposer les pièces demandées" };
  const paid = ["SUCCESS", "PAID", "COMPLETED"].includes(String(paymentStatus).toUpperCase());
  if (!paid) return { label: "Paiement à confirmer", progress: 25, tone: "border-orange-200 bg-orange-50 text-orange-800", nextAction: "Vérifier le paiement d’ouverture" };
  // Paiement confirmé : le dossier passe à l'étape suivante, quel que soit son statut interne (nouveau, évaluation…).
  if (agreementSigned === false) return { label: "Protocole à signer", progress: 35, tone: "border-amber-200 bg-amber-50 text-amber-800", nextAction: "Signer le protocole d’accord" };
  if (agreementSigned === true) return { label: "Dossier ouvert", progress: 40, tone: "border-blue-200 bg-blue-50 text-blue-800", nextAction: "Déposer les pièces demandées" };
  return { label: "Paiement confirmé", progress: 35, tone: "border-emerald-200 bg-emerald-50 text-emerald-800", nextAction: "Signer le protocole puis déposer vos pièces" };
}
