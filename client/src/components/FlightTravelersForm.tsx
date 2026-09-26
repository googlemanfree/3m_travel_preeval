import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { checkTraveler, type TravelerDetails } from "@shared/flightTravelerCheck";

type Props = {
  expected: number;
  initial?: TravelerDetails[];
  /** Dernier jour de voyage « AAAA-MM-JJ » : le passeport doit le couvrir. */
  lastTravelDate: string | null;
  pending?: boolean;
  submitLabel?: string;
  onSubmit: (travelers: TravelerDetails[]) => void;
};

const empty = (): TravelerDetails => ({ fullName: "", passportNumber: "", passportExpiry: "", dateOfBirth: "" });

/**
 * Données voyageurs d'une réservation : nom exactement comme sur le passeport, numéro, expiration, naissance.
 * Chaque champ est contrôlé pendant la saisie (mêmes règles que le serveur) ; une erreur bloque l'envoi, un avertissement non.
 */
export default function FlightTravelersForm({ expected, initial = [], lastTravelDate, pending = false, submitLabel = "Enregistrer les passeports", onSubmit }: Props) {
  const count = Math.max(1, expected);
  const [travelers, setTravelers] = useState<TravelerDetails[]>(() => Array.from({ length: count }, (_, index) => ({ ...empty(), ...(initial[index] ?? {}) })));
  const today = useMemo(() => new Date(), []);
  const results = travelers.map((traveler) => checkTraveler(traveler, { lastTravelDate, today }));
  // Une erreur n'apparaît que sur un champ déjà rempli : pas de rouge sur un formulaire vierge (l'envoi reste bloqué tant que tout n'est pas valide).
  const visible = results.map((issues, index) => issues.filter((issue) => String(travelers[index][issue.field] ?? "") !== ""));
  const hasError = results.some((issues) => issues.some((issue) => issue.severity === "error"));

  const update = (index: number, field: keyof TravelerDetails, value: string) => setTravelers((current) => current.map((traveler, position) => (position === index ? { ...traveler, [field]: value } : traveler)));
  const input = "mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900";
  const label = "block text-xs font-bold text-slate-700";

  return (
    <form className="space-y-4" data-testid="flight-travelers-form" onSubmit={(event) => { event.preventDefault(); if (!hasError && !pending) onSubmit(travelers); }}>
      {travelers.map((traveler, index) => (
        <fieldset key={index} className="rounded-xl border border-slate-200 bg-white p-3" data-testid="traveler-fieldset">
          <legend className="px-1 text-xs font-black text-slate-800">{count > 1 ? `Voyageur ${index + 1}` : "Voyageur"}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className={label} htmlFor={`traveler-name-${index}`}>Nom complet, exactement comme sur le passeport</label><input id={`traveler-name-${index}`} className={input} value={traveler.fullName} onChange={(event) => update(index, "fullName", event.target.value)} autoComplete="off" maxLength={120} /></div>
            <div><label className={label} htmlFor={`traveler-passport-${index}`}>Numéro de passeport</label><input id={`traveler-passport-${index}`} className={`${input} font-mono uppercase`} value={traveler.passportNumber} onChange={(event) => update(index, "passportNumber", event.target.value)} autoComplete="off" maxLength={24} /></div>
            <div><label className={label} htmlFor={`traveler-expiry-${index}`}>Date d’expiration</label><input id={`traveler-expiry-${index}`} type="date" className={input} value={traveler.passportExpiry} onChange={(event) => update(index, "passportExpiry", event.target.value)} /></div>
            <div><label className={label} htmlFor={`traveler-birth-${index}`}>Date de naissance</label><input id={`traveler-birth-${index}`} type="date" className={input} value={traveler.dateOfBirth} onChange={(event) => update(index, "dateOfBirth", event.target.value)} /></div>
            <div><label className={label} htmlFor={`traveler-nationality-${index}`}>Nationalité (facultatif)</label><input id={`traveler-nationality-${index}`} className={input} value={traveler.nationality ?? ""} onChange={(event) => update(index, "nationality", event.target.value)} maxLength={60} /></div>
          </div>
          {visible[index].length > 0 && (
            <ul className="mt-2 space-y-1" data-testid="traveler-issues">
              {visible[index].map((issue, position) => (
                <li key={position} className={`flex items-start gap-1.5 text-xs ${issue.severity === "error" ? "text-rose-700" : "text-amber-800"}`}><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{issue.message}</li>
              ))}
            </ul>
          )}
        </fieldset>
      ))}
      <button type="submit" disabled={hasError || pending} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50" data-testid="travelers-submit">{pending ? "Enregistrement…" : submitLabel}</button>
    </form>
  );
}
