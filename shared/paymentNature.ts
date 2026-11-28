/**
 * Nature des frais déposés : paiement de la totalité, ou avance sur un montant total plus élevé.
 * Écrit sur le reçu et dans le Protocole d'accord, pour que le candidat sache exactement ce qu'il a réglé et ce qui reste dû.
 */

export type PaymentNature = "total" | "avance";

export const PAYMENT_NATURE_LABELS: Record<PaymentNature, string> = {
  total: "Somme totale des frais d'ouverture",
  avance: "Avance sur les frais d'ouverture",
};

export function isPaymentNature(value: unknown): value is PaymentNature {
  return value === "total" || value === "avance";
}

function money(amount: number, currency: string): string {
  return `${Math.round(amount).toLocaleString("fr-FR").replace(/[  ]/g, " ")} ${currency}`;
}

/** Contrôle : une avance peut préciser le solde restant (strictement positif) ; un paiement total n'en a pas. */
export function paymentNatureError(nature: PaymentNature, balanceDue: number | null | undefined): string | null {
  if (nature === "avance" && balanceDue != null && (!Number.isFinite(balanceDue) || balanceDue <= 0)) {
    return "Le solde restant d'une avance doit être supérieur à zéro (ou laissé vide s'il n'est pas encore fixé).";
  }
  return null;
}

/** Phrase officielle (reçu, e-mail, protocole). Vide quand la nature n'a pas été renseignée (anciens dossiers : texte inchangé). */
export function paymentNatureSentence(input: {
  nature?: PaymentNature | null;
  amount: number;
  currency: string;
  balanceDue?: number | null;
}): string {
  if (!input.nature) return "";
  const paid = money(input.amount, input.currency);
  if (input.nature === "total") {
    return `Le montant de ${paid} correspond à la somme totale des frais d'ouverture et de traitement : aucun solde n'est dû à ce titre.`;
  }
  const balance = input.balanceDue && input.balanceDue > 0
    ? ` Le solde restant dû à ce titre est de ${money(input.balanceDue, input.currency)}, à régler selon les modalités convenues avec le conseiller.`
    : " Le solde restant sera communiqué et confirmé par écrit par le conseiller avant tout nouveau règlement.";
  return `Le montant de ${paid} constitue une AVANCE sur les frais d'ouverture et de traitement, et non la somme totale.${balance}`;
}
