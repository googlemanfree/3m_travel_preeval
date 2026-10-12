import { MessageCircle } from "lucide-react";
import { digitalWhatsAppUrl } from "@/lib/companyContacts";

type Props = {
  dossierNumber?: string | null;
  fullName?: string | null;
  className?: string;
  compact?: boolean;
};

/** CTA WhatsApp conseiller — lecture seule, n’écrit pas dans le dossier. */
export function clientAdvisorWhatsAppHref(dossierNumber?: string | null, fullName?: string | null) {
  const ref = dossierNumber ? ` (dossier ${dossierNumber})` : "";
  const name = fullName ? ` Je suis ${fullName}.` : "";
  return digitalWhatsAppUrl(`Bonjour 3M TRAVEL AGENCY,${name} j’ai une question sur mon dossier${ref}.`);
}

export default function ClientAdvisorWhatsApp({ dossierNumber, fullName, className = "", compact = false }: Props) {
  const href = clientAdvisorWhatsAppHref(dossierNumber, fullName);
  if (compact) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 ${className}`}
        data-testid="client-advisor-whatsapp"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        WhatsApp conseiller
      </a>
    );
  }
  return (
    <aside className={`rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 ${className}`} data-testid="client-advisor-whatsapp-card">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">Besoin d’un conseiller</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">Réponse rapide sur WhatsApp Yaoundé</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">Indiquez votre référence de dossier pour un suivi précis. Aucune modification automatique de votre dossier.</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 sm:w-auto"
        data-testid="client-advisor-whatsapp"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Écrire sur WhatsApp
      </a>
    </aside>
  );
}
