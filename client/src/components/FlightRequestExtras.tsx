import { useState } from "react";
import { toast } from "sonner";
import { PencilLine, UserCheck } from "lucide-react";
import FlightTravelersForm from "@/components/FlightTravelersForm";
import { trpc } from "@/lib/trpc";
import { CHANGE_KINDS, CHANGE_KIND_LABELS, type ChangeKind } from "@shared/flightFollowUps";
import { lastTravelDateOf } from "@shared/flightTravelerCheck";

type Overview = {
  requestId: number;
  travelers: { expected: number; provided: number; complete: boolean; messages: string[]; details: Array<{ fullName: string; passportNumber: string; passportExpiry: string; dateOfBirth: string; nationality?: string }> };
  changeRequests: Array<{ id: number; kind: string; message: string; createdAt: string; handled: boolean; handledNote: string | null }>;
};

type Props = { requestId: number; status: string; flightData: unknown; paymentExpected: boolean; overview: Overview | undefined };

const mask = (passport: string): string => (passport.length > 4 ? `${"•".repeat(passport.length - 3)}${passport.slice(-3)}` : passport);

/**
 * Sous chaque réservation de l'espace client : les passeports des voyageurs (indispensables à l'émission : le nom du billet doit être
 * celui du passeport) et la demande de modification ou d'annulation, traitée par un conseiller selon les conditions de la compagnie.
 */
export default function FlightRequestExtras({ requestId, status, flightData, paymentExpected, overview }: Props) {
  const utils = trpc.useUtils();
  const [showTravelers, setShowTravelers] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const [kind, setKind] = useState<ChangeKind>("change_date");
  const [message, setMessage] = useState("");

  const refresh = () => { void utils.flightFollowUp.myOverview.invalidate(); };
  const submitTravelers = trpc.flightFollowUp.submitTravelers.useMutation({
    onSuccess: (result) => { setShowTravelers(false); refresh(); toast.success(result.warnings.length ? "Passeports enregistrés — à vérifier : " + result.warnings[0] : "Passeports enregistrés. L’agence les contrôle avant l’émission."); },
    onError: (error) => toast.error(error.message),
  });
  const requestChange = trpc.flightFollowUp.requestChange.useMutation({
    onSuccess: () => { setShowChange(false); setMessage(""); refresh(); toast.success("Demande envoyée. Un conseiller vous répond avec les conditions applicables."); },
    onError: (error) => toast.error(error.message),
  });

  if (status === "cancelled" || !overview) return null;
  const travelers = overview.travelers;
  const editable = status !== "issued";
  const openChange = overview.changeRequests.find((change) => !change.handled);

  return (
    <div className="mt-2 w-full space-y-2" data-testid="flight-request-extras">
      {editable && (
        <div className={`rounded-xl border p-3 ${travelers.complete ? "border-emerald-200 bg-emerald-50" : paymentExpected ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50"}`} data-testid="travelers-status">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><UserCheck className="h-4 w-4" aria-hidden="true" />{travelers.complete ? "Passeports renseignés" : `Passeports à renseigner (${travelers.provided}/${travelers.expected})`}</p>
            <button type="button" onClick={() => setShowTravelers((current) => !current)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-black text-slate-800 hover:bg-slate-100" data-testid="toggle-travelers">{showTravelers ? "Fermer" : travelers.complete ? "Modifier" : "Renseigner"}</button>
          </div>
          {!travelers.complete && <p className="mt-1 text-xs text-slate-700">{paymentExpected ? "Avant de payer, " : ""}le nom sur le billet doit être identique à celui du passeport : une erreur oblige à refaire le billet, parfois avec des frais.</p>}
          {travelers.complete && travelers.details.length > 0 && <ul className="mt-1 text-xs text-slate-700">{travelers.details.map((traveler, index) => <li key={index}>{traveler.fullName} · passeport {mask(traveler.passportNumber)} · expire le {traveler.passportExpiry}</li>)}</ul>}
          {showTravelers && (
            <div className="mt-3">
              <FlightTravelersForm expected={travelers.expected} initial={travelers.details} lastTravelDate={lastTravelDateOf(flightData)} pending={submitTravelers.isPending} onSubmit={(list) => submitTravelers.mutate({ requestId, travelers: list })} />
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-3" data-testid="change-request">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900"><PencilLine className="h-4 w-4" aria-hidden="true" />Modifier ou annuler</p>
          {!openChange && <button type="button" onClick={() => setShowChange((current) => !current)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-black text-slate-800 hover:bg-slate-100" data-testid="toggle-change">{showChange ? "Fermer" : "Faire une demande"}</button>}
        </div>
        {openChange && <p className="mt-1 text-xs text-amber-800" data-testid="change-open">Votre demande « {CHANGE_KIND_LABELS[openChange.kind as ChangeKind] ?? "Autre demande"} » est en cours de traitement par un conseiller.</p>}
        {overview.changeRequests.filter((change) => change.handled).slice(0, 2).map((change) => <p key={change.id} className="mt-1 text-xs text-emerald-800" data-testid="change-handled">Demande « {CHANGE_KIND_LABELS[change.kind as ChangeKind] ?? "Autre demande"} » traitée{change.handledNote ? ` : ${change.handledNote}` : "."}</p>)}
        {showChange && !openChange && (
          <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); requestChange.mutate({ requestId, kind, message }); }}>
            <label className="block text-xs font-bold text-slate-700" htmlFor={`change-kind-${requestId}`}>Votre demande</label>
            <select id={`change-kind-${requestId}`} value={kind} onChange={(event) => setKind(event.target.value as ChangeKind)} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base">{CHANGE_KINDS.map((value) => <option key={value} value={value}>{CHANGE_KIND_LABELS[value]}</option>)}</select>
            <label className="block text-xs font-bold text-slate-700" htmlFor={`change-message-${requestId}`}>Précisez (nouvelle date souhaitée, nom à corriger, motif…)</label>
            <textarea id={`change-message-${requestId}`} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} rows={3} className="w-full rounded-lg border border-slate-300 p-3 text-base" />
            <p className="text-[11px] text-slate-600">Les possibilités et les frais dépendent des conditions de votre billet : le conseiller vous les communique avant toute modification.</p>
            <button type="submit" disabled={requestChange.isPending || message.trim().length < 10} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-black text-white disabled:opacity-50" data-testid="change-submit">{requestChange.isPending ? "Envoi…" : "Envoyer ma demande"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
