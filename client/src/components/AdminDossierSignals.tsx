import React from "react";

/** Valeurs connues : PENDING, SUCCESS, FAILED, CANCELLED, NOT_PAID ; toute autre chaîne est traitée comme « non payé ». */
type PaymentStatus = string | null | undefined;

export interface DossierSignal {
  key: "payment" | "protocol" | "documents";
  label: string;
  tone: "ok" | "wait" | "bad" | "idle";
  title: string;
}

const TONE: Record<DossierSignal["tone"], string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  wait: "border-amber-200 bg-amber-50 text-amber-900",
  bad: "border-rose-200 bg-rose-50 text-rose-800",
  idle: "border-slate-200 bg-slate-50 text-slate-600",
};

/** Pastilles « paiement · protocole · pièces » d'un dossier, calculées à partir des champs déjà présents dans la liste. */
export function buildDossierSignals(input: { paymentStatus?: PaymentStatus; agreementSigned?: boolean | null; checklistPercent?: number | null }): DossierSignal[] {
  const signals: DossierSignal[] = [];
  const payment = input.paymentStatus;
  if (payment === "SUCCESS") signals.push({ key: "payment", label: "Payé", tone: "ok", title: "Paiement validé" });
  else if (payment === "PENDING") signals.push({ key: "payment", label: "Paiement à valider", tone: "wait", title: "Un paiement est en attente de validation" });
  else if (payment === "FAILED" || payment === "CANCELLED") signals.push({ key: "payment", label: "Paiement échoué", tone: "bad", title: "Le dernier paiement a échoué ou a été annulé" });
  else signals.push({ key: "payment", label: "Non payé", tone: "idle", title: "Aucun paiement enregistré" });

  // Le protocole n'a de sens qu'après paiement : avant, on n'affiche rien pour ne pas ajouter de bruit.
  if (payment === "SUCCESS") {
    signals.push(input.agreementSigned
      ? { key: "protocol", label: "Protocole signé", tone: "ok", title: "Le candidat a signé le protocole d'accord" }
      : { key: "protocol", label: "Protocole à signer", tone: "wait", title: "Paiement validé, signature du protocole en attente" });
  }

  const percent = input.checklistPercent;
  if (typeof percent === "number" && Number.isFinite(percent)) {
    const rounded = Math.max(0, Math.min(100, Math.round(percent)));
    signals.push({
      key: "documents",
      label: `Pièces ${rounded} %`,
      tone: rounded >= 100 ? "ok" : rounded >= 50 ? "wait" : "idle",
      title: `Liste de pièces complète à ${rounded} %`,
    });
  }
  return signals;
}

export default function AdminDossierSignals(props: { paymentStatus?: PaymentStatus; agreementSigned?: boolean | null; checklistPercent?: number | null }) {
  const signals = buildDossierSignals(props);
  return (
    <ul className="mt-1.5 flex max-w-[200px] flex-wrap gap-1" aria-label="Signaux du dossier" data-testid="admin-dossier-signals">
      {signals.map((signal) => (
        <li key={signal.key} title={signal.title} data-signal={signal.key} data-tone={signal.tone} className={`rounded-full border px-2 py-0.5 text-[10px] font-bold leading-none ${TONE[signal.tone]}`}>
          {signal.label}
        </li>
      ))}
    </ul>
  );
}
