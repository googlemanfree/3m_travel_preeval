import { useState } from "react";
import { Check, ClipboardCopy, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_DESK_WHATSAPP, buildDeskAlertText, clientContactMessage, extractDeskAlertData, normalizeWhatsAppNumber, whatsAppLink } from "@shared/flightDeskAlert";

type DeskRequest = { requestRef: string; priority?: string | null; flightData: unknown; passengerData: unknown; candidateEmail: string };

/**
 * Réservation à effectuer par l'agent de comptoir : résumé prêt à copier et signalement WhatsApp en un clic.
 * (Le même résumé est envoyé par e-mail au comptoir dès la demande du client.)
 */
export function FlightDeskActions({ request }: { request: DeskRequest }) {
  const data = extractDeskAlertData({ requestRef: request.requestRef, priority: request.priority, flightData: request.flightData, passengerData: request.passengerData, requesterEmail: request.candidateEmail });
  const summary = buildDeskAlertText(data);
  const [copied, setCopied] = useState(false);
  const clientLink = normalizeWhatsAppNumber(data.passengerPhone) ? whatsAppLink(data.passengerPhone, clientContactMessage(data)) : null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez ce résumé :", summary);
    }
  };

  return (
    <section data-testid="desk-actions" className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-sm font-black text-amber-950">Réservation à effectuer (comptoir)</h3>
      <p className="mt-1 text-xs text-amber-900">Poser une option auprès de la compagnie ou du GDS, noter le PNR, revalider le tarif. Aucune émission avant paiement validé.</p>
      <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-amber-200 bg-white p-3 text-xs leading-5 text-slate-800">{summary}</pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={copy} className="border-amber-300 bg-white text-amber-950">
          {copied ? <Check className="mr-2 h-4 w-4" aria-hidden="true" /> : <ClipboardCopy className="mr-2 h-4 w-4" aria-hidden="true" />}
          {copied ? "Résumé copié" : "Copier le résumé"}
        </Button>
        {clientLink && (
          <a href={clientLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700">
            <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Écrire au client (WhatsApp)
          </a>
        )}
        <a href={whatsAppLink(DEFAULT_DESK_WHATSAPP, summary)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
          <Send className="mr-2 h-4 w-4" aria-hidden="true" /> Transmettre au comptoir (WhatsApp)
        </a>
      </div>
    </section>
  );
}
