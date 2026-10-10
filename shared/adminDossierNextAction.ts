/**
 * Prochaine action conseiller dérivée des champs déjà présents dans la liste admin.
 * Aucune écriture côté client : lecture pure pour prioriser le traitement des dossiers.
 */

export type AdminDossierNextActionUrgency = "high" | "medium" | "low";

export type AdminDossierNextAction = {
  key: string;
  label: string;
  urgency: AdminDossierNextActionUrgency;
};

const PAID = new Set(["SUCCESS", "success", "completed", "paye", "PAYE"]);

export function determineAdminListNextAction(input: {
  paymentStatus?: string | null;
  procedureStep?: string | null;
  status?: string | null;
  activationStatus?: string | null;
  /** Pays du dossier — contextualise le libellé sans changer la priorisation. */
  destination?: string | null;
  visaType?: string | null;
}): AdminDossierNextAction {
  const place = [input.destination?.trim(), input.visaType?.trim()].filter(Boolean).join(" · ");
  const withPlace = (label: string) => (place ? `${label} — ${place}` : label);

  const activation = (input.activationStatus ?? "").toLowerCase();
  if (activation === "pending" || activation === "expired" || activation === "failed") {
    return {
      key: "activation",
      label: withPlace(activation === "failed" ? "Relancer l’activation" : activation === "expired" ? "Renouveler le lien d’activation" : "Suivre l’activation compte"),
      urgency: activation === "failed" || activation === "expired" ? "high" : "medium",
    };
  }

  const payment = input.paymentStatus ?? "NOT_PAID";
  if (!PAID.has(payment)) {
    return {
      key: "payment",
      label: withPlace(payment === "PENDING" ? "Contrôler le justificatif" : "Vérifier le paiement"),
      urgency: "high",
    };
  }

  const step = (input.procedureStep || input.status || "").toUpperCase();
  if (step === "PENDING_48H") {
    return { key: "evaluation", label: withPlace("Traiter l’évaluation 48h"), urgency: "high" };
  }
  if (step === "PUBLISHED") {
    return { key: "bilan", label: withPlace("Suivre bilan / ouverture"), urgency: "medium" };
  }
  if (step === "DOCUMENTS_CHECK") {
    return { key: "documents", label: withPlace("Contrôler les documents"), urgency: "high" };
  }
  if (step === "SUBMITTED") {
    const evisa = /(e[\s-]?visa|electronique|eta)/i.test(`${input.visaType || ""}`);
    return {
      key: "submission",
      label: withPlace(evisa ? "Suivre le portail e‑Visa" : "Suivre la soumission"),
      urgency: "medium",
    };
  }
  if (step === "APPROVED") {
    return { key: "departure", label: withPlace("Préparer la suite / départ"), urgency: "low" };
  }

  return { key: "open", label: withPlace("Ouvrir la fiche 360°"), urgency: "low" };
}

export const ADMIN_NEXT_ACTION_URGENCY_CLASS: Record<AdminDossierNextActionUrgency, string> = {
  high: "border-rose-200 bg-rose-50 text-rose-800",
  medium: "border-amber-200 bg-amber-50 text-amber-900",
  low: "border-slate-200 bg-slate-50 text-slate-700",
};
