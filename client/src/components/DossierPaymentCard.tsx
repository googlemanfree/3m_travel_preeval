import { CheckCircle2, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatAmount } from "@shared/paymentMethods";

type Props = {
  dossierNumber: string | null | undefined;
  amount?: number | null;
  currency?: string | null;
  /** Le paiement est confirmé par l'agence. */
  confirmed: boolean;
  /** Le candidat a demandé l'ouverture de son dossier : le règlement des frais est attendu. */
  requested: boolean;
};

/**
 * Règlement des frais d'ouverture, depuis l'espace client : montant à régler et accès à tous les moyens de paiement
 * (virement, dépôt Mobile Money, agence, en ligne quand il est activé). Rien n'est affiché tant que le règlement n'est pas attendu.
 */
export default function DossierPaymentCard({ dossierNumber, amount, currency, confirmed, requested }: Props) {
  if (!dossierNumber || (!requested && !confirmed)) return null;
  if (confirmed) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 p-4" data-testid="dossier-payment" data-state="confirmed" role="status">
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-900"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Paiement confirmé par l’agence pour le dossier {dossierNumber}. Votre reçu vous est envoyé par e-mail.</p>
      </Card>
    );
  }
  const href = `/paiement?ref=${encodeURIComponent(dossierNumber)}${amount ? `&montant=${encodeURIComponent(String(amount))}` : ""}`;
  return (
    <Card className="border-2 border-blue-200 bg-blue-50/60 p-5" data-testid="dossier-payment" data-state="due" aria-labelledby="dossier-payment-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-blue-700 p-3 text-white"><CreditCard className="h-5 w-5" aria-hidden="true" /></span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Frais d’ouverture de dossier</p>
            <h2 id="dossier-payment-title" className="mt-1 text-lg font-black text-slate-950">Régler mon dossier {dossierNumber}</h2>
            <p className="mt-1 text-sm text-slate-700">Montant : <strong>{formatAmount(amount ?? null, currency || "XAF")}</strong>. Virement, dépôt Mobile Money ou paiement en agence : le paiement est pris en compte quand l’agence confirme sa réception.</p>
          </div>
        </div>
        <a href={href} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-black text-white hover:bg-blue-800" data-testid="pay-dossier-link">Comment payer</a>
      </div>
    </Card>
  );
}
