import { useState } from "react";
import { AlertTriangle, Building2, Landmark, Mail, MessageCircle, Phone, Smartphone } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { MANUAL_METHOD_IDS, MANUAL_METHOD_LABELS, formatAmount, paymentFallbackMessage, type ManualMethodId } from "@shared/paymentMethods";
import { CLIENT_AGENCY_FACTS, PaymentDetails } from "@/components/PaymentMethodsPanel";

const ICONS: Record<ManualMethodId, typeof Landmark> = { bank_transfer: Landmark, mobile_money_deposit: Smartphone, cash_agency: Building2 };

type Props = {
  /** Référence du dossier (3M-…) ou de la réservation de vol (FB-…) ; sans elle, seul le contact agence est proposé. */
  reference?: string;
  kind?: "dossier" | "flight";
  amount?: number | null;
  currency?: string;
  name?: string | null;
  /** « failed » : le paiement en ligne n'a pas abouti (mise en avant) ; « alternatives » : autres moyens proposés en plus. */
  reason?: "failed" | "alternatives";
};

/**
 * Repli quand un paiement en ligne échoue ou n'est pas disponible : le client contacte l'agence pour un virement ou un
 * dépôt, ou passe en agence. Rien n'est validé ici : seule la confirmation de réception par l'agence valide le paiement.
 */
export default function PaymentFallbackPanel({ reference = "", kind = "dossier", amount = null, currency = "XAF", name = null, reason = "alternatives" }: Props) {
  const failed = reason === "failed";
  const { isAuthenticated } = useCandidateAuth();
  const [chosen, setChosen] = useState<ManualMethodId | null>(null);
  const mutation = trpc.paymentInstructions.requestManualPayment.useMutation();
  const agency = CLIENT_AGENCY_FACTS;
  const whatsappHref = `https://wa.me/${agency.whatsappNumber}?text=${encodeURIComponent(paymentFallbackMessage({ reference, amount, currency, method: chosen, name }))}`;
  const result = mutation.data;

  const request = (method: ManualMethodId) => {
    setChosen(method);
    mutation.mutate({ kind, reference, method, trigger: failed ? "online_failed" : "chosen" });
  };

  return (
    <section data-testid="payment-fallback" data-reason={reason} className={`rounded-2xl border p-5 ${failed ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start gap-3">
        {failed && <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />}
        <div>
          <h2 className="text-base font-black text-slate-950">{failed ? "Votre paiement en ligne n’a pas abouti" : "Un autre moyen de paiement ?"}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            {failed
              ? "Aucun règlement n’est enregistré tant que l’agence n’a pas confirmé sa réception. Contactez l’agence pour régler par virement ou dépôt Mobile Money, ou passez directement en agence. Si votre compte a été débité, écrivez-nous avec votre référence."
              : "Vous pouvez régler par virement bancaire, par dépôt Mobile Money sur le numéro de l’agence, ou directement en agence. L’agence confirme la réception avant d’activer la suite de votre démarche."}
          </p>
          {reference && <p className="mt-2 text-xs text-slate-600">Référence : <strong className="font-mono text-slate-900">{reference}</strong>{amount ? ` · Montant : ${formatAmount(amount, currency)}` : ""}</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700">
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> Contacter l’agence sur WhatsApp
        </a>
        {agency.phoneDisplay && (
          <a href={`tel:${agency.phoneDisplay.replace(/\s+/g, "")}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50">
            <Phone className="h-4 w-4" aria-hidden="true" /> Appeler {agency.phoneDisplay}
          </a>
        )}
      </div>

      {reference && !result && (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Recevoir les instructions par e-mail</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {MANUAL_METHOD_IDS.map((method) => {
              const Icon = ICONS[method];
              const busy = mutation.isPending && chosen === method;
              return (
                <button key={method} type="button" disabled={!isAuthenticated || mutation.isPending} onClick={() => request(method)} className="flex min-h-14 items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left text-xs font-bold text-slate-800 hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60">
                  <Icon className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
                  <span>{busy ? "Envoi…" : MANUAL_METHOD_LABELS[method]}</span>
                </button>
              );
            })}
          </div>
          {!isAuthenticated && <p className="mt-2 text-xs text-slate-600"><a href="/login" className="font-bold text-blue-700 underline">Connectez-vous</a> pour recevoir vos instructions par e-mail, ou écrivez-nous sur WhatsApp.</p>}
          {mutation.error && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">{mutation.error.message}</p>}
        </div>
      )}

      {result && chosen && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4" data-testid="manual-payment-result">
          <p className="flex items-center gap-2 text-sm font-black text-emerald-900"><Mail className="h-4 w-4" aria-hidden="true" /> {result.clientEmailSent ? "Instructions envoyées par e-mail" : "Demande enregistrée"}</p>
          <p className="mt-1 text-xs text-emerald-900">{MANUAL_METHOD_LABELS[chosen]} · L’agence a été prévenue. Envoyez la preuve de paiement sur WhatsApp avec la référence : le paiement est validé à sa réception.</p>
          <div className="mt-3 rounded-xl bg-white p-3"><PaymentDetails instructions={result.instructions} method={chosen} agency={result.agency} /></div>
        </div>
      )}
    </section>
  );
}
