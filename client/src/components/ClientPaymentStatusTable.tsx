import { CheckCircle2, Clock3, CreditCard, CircleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";

export type ClientPaymentDossier = {
  dossierNumber?: string | null;
  dossierStatus?: string | null;
  paymentStatus?: string | null;
  visaType?: string | null;
  projectType?: string | null;
  destination?: string | null;
};

type Props = {
  dossiers: ClientPaymentDossier[];
  selectedDossierNumber?: string | null;
  onSelect: (dossierNumber: string) => void;
  dossierLabel: (dossier: ClientPaymentDossier) => string;
};

function paymentState(dossier: ClientPaymentDossier) {
  const normalized = String(dossier.paymentStatus ?? "").toUpperCase();
  if (normalized === "SUCCESS" || normalized === "PAID" || normalized === "COMPLETED") {
    return { label: "Paiement confirmé", tone: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: CheckCircle2 };
  }
  if (["FAILED", "CANCELLED"].includes(normalized)) {
    return { label: normalized === "FAILED" ? "Paiement à corriger" : "Paiement annulé", tone: "border-rose-200 bg-rose-50 text-rose-800", icon: CircleAlert };
  }
  return { label: "Paiement à confirmer", tone: "border-amber-200 bg-amber-50 text-amber-900", icon: Clock3 };
}

function progressForDossier(dossier: ClientPaymentDossier) {
  const status = String(dossier.dossierStatus ?? "").toLowerCase();
  const payment = String(dossier.paymentStatus ?? "").toUpperCase();
  if (["approuve", "visa_approuve", "approved"].includes(status)) return 100;
  if (["soumis", "submitted"].includes(status)) return 80;
  if (["traitement", "processing"].includes(status)) return 65;
  if (["documents", "documents_requis"].includes(status)) return 45;
  if (payment !== "SUCCESS") return 25;
  if (["evaluation", "evaluation_en_cours"].includes(status)) return 20;
  return 10;
}

export default function ClientPaymentStatusTable({ dossiers, selectedDossierNumber, onSelect, dossierLabel }: Props) {
  if (!dossiers.length) return null;
  return (
    <Card className="border-slate-200 bg-white p-4 shadow-sm sm:p-5" data-testid="client-payment-status-table" aria-labelledby="client-payment-status-title">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-blue-100 p-2.5 text-blue-800"><CreditCard className="h-5 w-5" aria-hidden="true" /></span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Paiements par dossier</p>
          <h3 id="client-payment-status-title" className="mt-1 text-lg font-black text-slate-950">Vue rapide de vos règlements</h3>
          <p className="mt-1 text-sm text-slate-600">Chaque ligne correspond à un dossier actif et à son propre paiement d’ouverture.</p>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">Statut du paiement de chaque dossier actif</caption>
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr><th scope="col" className="px-3 py-3 font-black">Dossier</th><th scope="col" className="px-3 py-3 font-black">Référence unique</th><th scope="col" className="px-3 py-3 font-black">Statut paiement</th><th scope="col" className="px-3 py-3 font-black">Progression</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {dossiers.map((dossier) => {
              const reference = String(dossier.dossierNumber ?? "").trim();
              const progress = progressForDossier(dossier);
              const payment = paymentState(dossier);
              const Icon = payment.icon;
              const selected = reference === selectedDossierNumber;
              return (
                <tr key={reference || dossierLabel(dossier)} className={selected ? "bg-blue-50/70" : undefined}>
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-900">{dossierLabel(dossier)}</td>
                  <td className="whitespace-nowrap px-3 py-3"><button type="button" className="font-mono text-xs font-black text-blue-800 underline decoration-blue-300 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" onClick={() => reference && onSelect(reference)} aria-label={`Afficher le dossier ${reference}`}>{reference}</button></td>
                  <td className="whitespace-nowrap px-3 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${payment.tone}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{payment.label}</span></td>
                  <td className="min-w-32 px-3 py-3"><div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} /></div><span className="text-xs font-black text-blue-800">{progress}%</span></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
