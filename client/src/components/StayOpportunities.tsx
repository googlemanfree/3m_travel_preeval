import { useState } from "react";
import { Compass } from "lucide-react";
import { toast } from "sonner";
import { MAX_ACTIVE_STAY_REQUESTS, MAX_TRAVELERS, STAY_CATEGORY_LABELS, STAY_CONSENT_TEXT, type StayCategory } from "@shared/stayPrograms";
import { trpc } from "@/lib/trpc";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Pending = { programId: number; title: string };

const durationLabel = (min: number | null, max: number | null) => {
  if (min && max && min !== max) return `${min} à ${max} jours`;
  const days = min ?? max;
  return days ? `${days} jour${days > 1 ? "s" : ""}` : null;
};

/**
 * Séjours pour visiteurs et touristes : programmes accompagnés par l'agence dans le pays choisi, et demande de devis.
 * Le prix n'apparaît que s'il est complet et relu récemment ; sinon le candidat lit que son conseiller le lui communique.
 */
export function StayOpportunities({ countryCode, countryName }: { countryCode: string; countryName: string }) {
  const utils = trpc.useUtils();
  const programs = trpc.stayPrograms.programs.useQuery({ countryCode }, { staleTime: 5 * 60 * 1000, retry: false });
  const mine = trpc.stayPrograms.myRequests.useQuery(undefined, { retry: false });
  const [pending, setPending] = useState<Pending | null>(null);
  const [consent, setConsent] = useState(false);
  const [travelers, setTravelers] = useState(1);
  const [start, setStart] = useState("");
  const [note, setNote] = useState("");

  const refresh = () => { void utils.stayPrograms.myRequests.invalidate(); };
  const reset = () => { setPending(null); setConsent(false); setTravelers(1); setStart(""); setNote(""); };
  const request = trpc.stayPrograms.requestStay.useMutation({
    onSuccess: () => { toast.success("Demande envoyée à votre conseiller"); trackEvent("stay_request_submitted", { country: countryName }); reset(); refresh(); },
    onError: (error) => toast.error("Demande impossible", { description: error.message }),
  });
  const cancel = trpc.stayPrograms.cancelRequest.useMutation({ onSuccess: () => { toast.success("Demande annulée"); refresh(); }, onError: (error) => toast.error("Annulation impossible", { description: error.message }) });

  const requests = mine.data ?? [];
  const requestedIds = new Set(requests.map((item) => item.programId));
  const activeCount = requests.filter((item) => item.status !== "cancelled" && item.status !== "declined").length;
  const list = programs.data ?? [];

  return (
    <Card className="border border-teal-200 bg-white p-5 shadow-sm" role="region" aria-labelledby="stay-opportunities-title" data-testid="stay-opportunities">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-teal-100 p-3 text-teal-800"><Compass className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-800">Séjours · {countryName}</p>
          <h3 id="stay-opportunities-title" className="mt-1 text-lg font-black text-slate-950">Programmes de séjour accompagnés</h3>
          <p className="mt-1 text-sm text-slate-600">Demandez un devis pour un séjour : votre conseiller vérifie les dates, prépare l'offre et vous explique la démarche de visa. Aucune réservation ni paiement à cette étape.</p>

          {requests.length > 0 ? (
            <section className="mt-4" aria-label="Mes demandes de séjour" data-testid="stay-my-requests">
              <h4 className="text-sm font-black text-slate-950">Mes demandes ({activeCount}/{MAX_ACTIVE_STAY_REQUESTS} en cours)</h4>
              <ul className="mt-2 space-y-2">
                {requests.map((item) => (
                  <li key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 font-semibold text-slate-900">{item.title}</p>
                      <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-900">{item.statusLabel}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{item.next}</p>
                    {item.canCancel ? <Button type="button" variant="ghost" size="sm" className="mt-1 h-auto px-0 text-xs text-rose-700" onClick={() => cancel.mutate({ requestId: item.id })} disabled={cancel.isPending}>Annuler cette demande</Button> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {programs.isLoading ? <p className="mt-4 text-sm text-slate-600" role="status">Chargement des séjours…</p> : null}
          {!programs.isLoading && list.length === 0 ? (
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700" data-testid="stay-opportunities-empty">Aucun séjour n'est encore publié pour {countryName}. Votre conseiller peut vous composer un séjour sur mesure.</p>
          ) : null}

          <ul className="mt-4 space-y-3">
            {list.map((program) => {
              const facts = [program.city, STAY_CATEGORY_LABELS[program.category as StayCategory], durationLabel(program.durationDaysMin, program.durationDaysMax), program.seasonNote].filter(Boolean).join(" · ");
              const already = requestedIds.has(program.id);
              return (
                <li key={program.id}>
                  <article className="rounded-xl border border-slate-200 p-4" data-testid={`stay-program-${program.id}`}>
                    <h4 className="text-base font-black text-slate-950">{program.title}</h4>
                    <p className="text-xs text-slate-600">{facts}</p>
                    <p className="mt-2 text-sm text-slate-800">{program.summary}</p>
                    <details className="mt-2 text-sm text-slate-700">
                      <summary className="cursor-pointer text-xs font-semibold text-teal-800">Voir le détail</summary>
                      <p className="mt-2 whitespace-pre-line">{program.description}</p>
                      {program.includedNote ? <p className="mt-2 text-xs"><span className="font-semibold">Ce que l'agence organise :</span> {program.includedNote}</p> : null}
                      {program.visaNote ? <p className="mt-1 text-xs"><span className="font-semibold">Visa et formalités :</span> {program.visaNote}</p> : null}
                    </details>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800" data-testid={`stay-price-${program.id}`}>{program.priceLabel ?? "Tarif communiqué par votre conseiller dans le devis"}</p>
                      <Button type="button" size="sm" disabled={already || activeCount >= MAX_ACTIVE_STAY_REQUESTS} onClick={() => setPending({ programId: program.id, title: program.title })} data-testid={`stay-request-${program.id}`}>{already ? "Déjà demandé" : "Demander un devis"}</Button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-slate-500">Les prix indiqués sont indicatifs et confirmés par devis. Un séjour ne garantit pas l'obtention d'un visa.</p>
        </div>
      </div>

      <Dialog open={Boolean(pending)} onOpenChange={(open) => { if (!open) reset(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander un devis</DialogTitle>
            <DialogDescription>{pending?.title}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-800" htmlFor="stay-travelers">Nombre de voyageurs
              <input id="stay-travelers" type="number" min={1} max={MAX_TRAVELERS} className="mt-1 h-10 w-full rounded-md border border-slate-300 px-2 text-sm font-normal" value={travelers} onChange={(event) => setTravelers(Math.min(MAX_TRAVELERS, Math.max(1, Number(event.target.value) || 1)))} />
            </label>
            <label className="block text-sm font-semibold text-slate-800" htmlFor="stay-start">Début souhaité (facultatif)
              <input id="stay-start" type="date" className="mt-1 h-10 w-full rounded-md border border-slate-300 px-2 text-sm font-normal" value={start} onChange={(event) => setStart(event.target.value)} />
            </label>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800" htmlFor="stay-consent">
            <input id="stay-consent" type="checkbox" className="mt-1 h-4 w-4" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>{STAY_CONSENT_TEXT}</span>
          </label>
          <label className="block text-sm font-semibold text-slate-800" htmlFor="stay-note">Un mot pour votre conseiller (facultatif)
            <textarea id="stay-note" className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm font-normal" rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={reset}>Annuler</Button>
            <Button type="button" disabled={!consent || request.isPending} onClick={() => pending && request.mutate({ programId: pending.programId, consent: true, travelers, preferredStart: start || null, note: note.trim() || null })} data-testid="stay-request-confirm">{request.isPending ? "Envoi…" : "Envoyer ma demande"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
