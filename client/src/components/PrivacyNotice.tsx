import { ShieldCheck } from "lucide-react";
import { PRIVACY_NOTICES, type PrivacyNoticeKey } from "@shared/privacyCatalog";

/** Information de confidentialité au moment de la collecte : données, finalité, accès, destinataires, durée, droits. */
export function PrivacyNotice({ notice, className = "" }: { notice: PrivacyNoticeKey; className?: string }) {
  const data = PRIVACY_NOTICES[notice];
  return (
    <details className={`rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 ${className}`} data-testid={`privacy-notice-${notice}`}>
      <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
        <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
        Vos données : ce que nous collectons, pourquoi, qui y accède
      </summary>
      <div className="mt-3 space-y-2 leading-6">
        <p className="font-semibold">{data.title}</p>
        <div><p className="font-semibold">Données collectées</p><ul className="list-disc pl-5">{data.collected.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <p><span className="font-semibold">Pourquoi : </span>{data.purpose}</p>
        <div><p className="font-semibold">Qui peut y accéder</p><ul className="list-disc pl-5">{data.access.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><p className="font-semibold">Destinataires possibles</p><ul className="list-disc pl-5">{data.recipients.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <p><span className="font-semibold">Durée de conservation : </span>{data.retention}{!data.retentionValidated && <span className="text-slate-500"> (durée en cours de validation — la politique de confidentialité fait foi)</span>}</p>
        <p>{data.rights}</p>
        <p><a href="/politique-confidentialite" className="font-semibold text-blue-700 underline underline-offset-2">Lire la politique de confidentialité</a></p>
      </div>
    </details>
  );
}
