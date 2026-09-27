import { useState } from "react";
import { BadgeCheck, RefreshCw, ShieldAlert } from "lucide-react";
import FlightTravelersForm from "@/components/FlightTravelersForm";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc";
import { FARE_CHECK_MAX_AGE_HOURS, fareAgeHours } from "@shared/flightFareCheck";
import { DESK_THRESHOLDS, HISTORY, currentOptionDeadline } from "@shared/flightFollowUps";
import { assessTravelers, extractTravelers, lastTravelDateOf } from "@shared/flightTravelerCheck";

type HistoryEntry = { action: string; newValue?: string | null; details?: string | null; createdAt: string | Date };
// La requête admin est typée en partiel par le routeur : on lit seulement les champs utiles.
type Props = { request: any; history: HistoryEntry[] | any[]; sessionToken: string };

const KIND_TONE: Record<string, string> = { same: "bg-emerald-50 text-emerald-900 border-emerald-200", lower: "bg-emerald-50 text-emerald-900 border-emerald-200", higher: "bg-rose-50 text-rose-900 border-rose-200", not_found: "bg-rose-50 text-rose-900 border-rose-200", unavailable: "bg-amber-50 text-amber-900 border-amber-200" };

/**
 * Deux contrôles du conseiller avant de demander un règlement puis d'émettre : (1) le tarif est-il toujours celui présenté au client ?
 * (2) les passeports de tous les voyageurs sont-ils saisis et valides pour le voyage ? L'émission est refusée tant que (2) n'est pas réglé.
 */
export default function FlightRequestChecks({ request, history, sessionToken }: Props) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState("");
  const readiness = assessTravelers({ flightData: request.flightData, passengerData: request.passengerData, today: new Date() });
  const travelers = extractTravelers(request.passengerData);
  const closed = request.status === "issued" || request.status === "cancelled";

  const lastCheck = history.filter((entry) => entry.action === HISTORY.fareChecked).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const referenceAt = lastCheck && new Date(lastCheck.createdAt) > new Date(request.createdAt) ? lastCheck.createdAt : request.createdAt;
  const ageHours = fareAgeHours(referenceAt, new Date());
  const stale = ageHours === null || ageHours > FARE_CHECK_MAX_AGE_HOURS;

  const refresh = () => { void utils.flightBooking.getRequest.invalidate(); void utils.flightFollowUp.deskOverview.invalidate(); };
  const optionDeadline = currentOptionDeadline(history.map((entry: HistoryEntry) => ({ requestId: request.id, action: entry.action, newValue: entry.newValue ?? null, createdAt: new Date(entry.createdAt) })));
  const optionHoursLeft = optionDeadline ? (optionDeadline.getTime() - Date.now()) / 3_600_000 : null;
  const setOption = trpc.flightFollowUp.setOptionDeadline.useMutation({
    onSuccess: (result) => { setDeadlineInput(""); refresh(); toast({ title: result.deadline ? "Échéance enregistrée" : "Échéance effacée", description: result.deadline ? "Le suivi du comptoir signalera cette option avant son expiration." : "Plus d’option suivie sur cette demande." }); },
    onError: (error) => toast({ title: "Échéance refusée", description: error.message, variant: "destructive" }),
  });
  const recheck = trpc.flightFollowUp.recheckFare.useMutation({
    onSuccess: (result) => { refresh(); toast({ title: "Tarif revérifié", description: result.description }); },
    onError: (error) => toast({ title: "Contrôle impossible", description: error.message, variant: "destructive" }),
  });
  const save = trpc.flightFollowUp.adminSaveTravelers.useMutation({
    onSuccess: () => { setShowForm(false); refresh(); toast({ title: "Passeports enregistrés", description: "Les données voyageurs sont dans le dossier." }); },
    onError: (error) => toast({ title: "Enregistrement refusé", description: error.message, variant: "destructive" }),
  });

  return (
    <section className="space-y-3" data-testid="flight-request-checks">
      <div className={`rounded-2xl border p-4 ${stale && !closed ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`} data-testid="fare-check">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black text-slate-900"><RefreshCw className="h-4 w-4" aria-hidden="true" />Tarif présenté au client</h3>
            <p className="mt-1 text-xs text-slate-700" data-testid="fare-age">{ageHours === null ? "Date du dernier relevé inconnue." : `Dernier relevé il y a ${ageHours < 1 ? "moins d’1 h" : `${Math.round(ageHours)} h`} (${lastCheck && referenceAt === lastCheck.createdAt ? "contrôle du conseiller" : "création de la demande"}).`}{stale && !closed ? ` Au-delà de ${FARE_CHECK_MAX_AGE_HOURS} h, revérifiez avant de demander le paiement.` : ""}</p>
          </div>
          {!closed && <button type="button" disabled={recheck.isPending} onClick={() => recheck.mutate({ sessionToken, requestId: request.id })} className="min-h-10 rounded-lg bg-blue-700 px-3 text-xs font-black text-white hover:bg-blue-800 disabled:opacity-60" data-testid="recheck-fare">{recheck.isPending ? "Contrôle en cours…" : "Revérifier le tarif"}</button>}
        </div>
        {recheck.data && <p className={`mt-2 rounded-lg border p-2 text-xs font-bold ${KIND_TONE[recheck.data.comparison.kind] ?? ""}`} data-testid="fare-result">{recheck.data.description}</p>}
        <p className="mt-2 text-[11px] text-slate-500">Contrôle indicatif : relevé chez le fournisseur avec les voyageurs facturés comme adultes. Le conseiller confirme le tarif définitif.</p>
      </div>

      {!closed && (
        <div className={`rounded-2xl border p-4 ${optionHoursLeft !== null && optionHoursLeft <= DESK_THRESHOLDS.optionWarningHours ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50"}`} data-testid="option-deadline">
          <h3 className="text-sm font-black text-slate-900">Option de réservation (compagnie)</h3>
          <p className="mt-1 text-xs text-slate-700" data-testid="option-status">{optionDeadline ? (optionHoursLeft !== null && optionHoursLeft <= 0 ? `Option expirée depuis ${Math.round(-optionHoursLeft)} h (${optionDeadline.toLocaleString("fr-FR")}).` : `Option valable jusqu’au ${optionDeadline.toLocaleString("fr-FR")} (dans ${Math.max(1, Math.round(optionHoursLeft ?? 0))} h).`) : "Aucune échéance saisie. Si vous avez posé une option auprès de la compagnie, notez sa date limite : le suivi vous alerte avant l’expiration."}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`option-deadline-${request.id}`}>Date et heure limite de l’option</label>
            <input id={`option-deadline-${request.id}`} type="datetime-local" value={deadlineInput} onChange={(event) => setDeadlineInput(event.target.value)} className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm" />
            <button type="button" disabled={!deadlineInput || setOption.isPending} onClick={() => setOption.mutate({ sessionToken, requestId: request.id, deadline: new Date(deadlineInput).toISOString() })} className="min-h-10 rounded-lg bg-slate-900 px-3 text-xs font-black text-white disabled:opacity-50" data-testid="save-option">Enregistrer l’échéance</button>
            {optionDeadline && <button type="button" disabled={setOption.isPending} onClick={() => setOption.mutate({ sessionToken, requestId: request.id, deadline: null })} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-black text-slate-800" data-testid="clear-option">Effacer</button>}
          </div>
        </div>
      )}

      <div className={`rounded-2xl border p-4 ${readiness.complete ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`} data-testid="traveler-check">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">{readiness.complete ? <BadgeCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" /> : <ShieldAlert className="h-4 w-4 text-rose-700" aria-hidden="true" />}Passeports des voyageurs ({readiness.provided}/{readiness.expected})</h3>
          {!closed && <button type="button" onClick={() => setShowForm((current) => !current)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-black text-slate-800 hover:bg-slate-100" data-testid="toggle-admin-travelers">{showForm ? "Fermer" : "Saisir / corriger"}</button>}
        </div>
        {travelers.length > 0 && <ul className="mt-2 space-y-1 text-xs text-slate-800">{travelers.map((traveler, index) => <li key={index} data-testid="traveler-row">{traveler.fullName || "Nom manquant"} · {traveler.passportNumber || "n° manquant"} · exp. {traveler.passportExpiry || "—"} · né(e) le {traveler.dateOfBirth || "—"}</li>)}</ul>}
        {readiness.messages.length > 0 && <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-rose-800" data-testid="traveler-messages">{readiness.messages.slice(0, 6).map((message, index) => <li key={index}>{message}</li>)}</ul>}
        {!readiness.complete && !closed && <p className="mt-2 text-xs font-bold text-rose-800">L’émission est refusée tant que ces données ne sont pas complètes et valides.</p>}
        {showForm && !closed && <div className="mt-3"><FlightTravelersForm expected={readiness.expected} initial={travelers} lastTravelDate={lastTravelDateOf(request.flightData)} pending={save.isPending} onSubmit={(list) => save.mutate({ sessionToken, requestId: request.id, travelers: list })} /></div>}
      </div>
    </section>
  );
}
