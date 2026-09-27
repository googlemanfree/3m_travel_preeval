import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, MessageCircle, Search } from "lucide-react";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import FlightTravelersForm from "@/components/FlightTravelersForm";
import { COMPANY_PROFILE } from "@/lib/companyContacts";
import { trpc } from "@/lib/trpc";
import { flightStatusTone } from "@shared/flightRequestStatus";

const office = COMPANY_PROFILE.offices.cameroon;

/**
 * Suivi d'une réservation de vol SANS compte : référence (reçue par e-mail) + adresse e-mail de la demande. L'e-mail est envoyé
 * en POST, jamais dans l'adresse de la page. Le suivi montre l'état, la prochaine étape, le lien de paiement et le formulaire des passeports.
 */
export default function SuiviVol() {
  const initialRef = typeof window === "undefined" ? "" : (new URLSearchParams(window.location.search).get("ref") ?? "").slice(0, 40);
  const [requestRef, setRequestRef] = useState(initialRef);
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const track = trpc.flightFollowUp.track.useMutation();
  const submitTravelers = trpc.flightFollowUp.trackSubmitTravelers.useMutation({
    onSuccess: (result) => {
      setShowForm(false);
      toast.success(result.warnings.length ? `Passeports enregistrés — à vérifier : ${result.warnings[0]}` : "Passeports enregistrés. L’agence les contrôle avant l’émission.");
      track.mutate({ requestRef: requestRef.trim(), email: email.trim() });
    },
    onError: (error) => toast.error(error.message),
  });
  const result = track.data;
  const whatsappHref = `https://wa.me/${office.whatsappNumber}?text=${encodeURIComponent(`Bonjour 3M Travel & Services, je souhaite des nouvelles de ma réservation de vol ${requestRef.trim()}.`)}`;

  return (
    <ServicePageShell
      eyebrow="Vols"
      title="Suivre ma réservation de vol"
      introduction="Sans compte : entrez la référence reçue par e-mail et l’adresse e-mail de votre demande pour voir où en est votre réservation et ce qu’il reste à faire."
      primaryHref="/flights"
      primaryLabel="Rechercher un vol"
      notice="Aucun tarif ni aucune place ne sont garantis avant la confirmation de l’agence, et le billet n’est émis qu’après réception du paiement."
    >
      <ServiceSection title="Retrouver ma demande">
        <form className="grid max-w-xl gap-3" data-testid="track-form" onSubmit={(event) => { event.preventDefault(); setShowForm(false); track.mutate({ requestRef: requestRef.trim(), email: email.trim() }); }}>
          <label className="text-sm font-bold text-slate-800" htmlFor="track-ref">Référence de la demande</label>
          <input id="track-ref" value={requestRef} onChange={(event) => setRequestRef(event.target.value)} placeholder="3M-FL-…" autoComplete="off" maxLength={40} className="h-12 rounded-xl border border-slate-300 px-3 font-mono text-base uppercase" />
          <label className="text-sm font-bold text-slate-800" htmlFor="track-email">Adresse e-mail de la demande</label>
          <input id="track-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={320} className="h-12 rounded-xl border border-slate-300 px-3 text-base" />
          <button type="submit" disabled={track.isPending || requestRef.trim().length < 6 || !email.includes("@")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50" data-testid="track-submit"><Search className="h-4 w-4" aria-hidden="true" />{track.isPending ? "Recherche…" : "Voir ma réservation"}</button>
        </form>
        {track.error && <p role="alert" className="mt-4 max-w-xl rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900" data-testid="track-error">{track.error.message}</p>}

        {result && (
          <div className="mt-6 max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="track-result">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-sm font-bold text-blue-700">{result.requestRef}</p>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${flightStatusTone(result.status)}`} data-testid="track-status">{result.statusLabel}</span>
            </div>
            <p className="mt-2 text-lg font-black text-slate-950">{result.route}</p>
            <p className="text-sm text-slate-600">{result.departureDate ? `Départ le ${result.departureDate}` : "Date à confirmer"}{result.returnDate ? ` · retour le ${result.returnDate}` : ""}</p>
            <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-950" data-testid="track-next-step">{result.nextStep}</p>

            {result.payUrl && (
              <a href={result.payUrl} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800" data-testid="track-pay"><CreditCard className="h-4 w-4" aria-hidden="true" />Comment payer</a>
            )}

            {result.travelers.editable && (
              <div className="mt-4 rounded-xl border border-slate-200 p-3" data-testid="track-travelers">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">{result.travelers.complete ? "Passeports renseignés" : `Passeports à renseigner (${result.travelers.provided}/${result.travelers.expected})`}</p>
                  <button type="button" onClick={() => setShowForm((current) => !current)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-black text-slate-800 hover:bg-slate-100" data-testid="track-toggle-travelers">{showForm ? "Fermer" : result.travelers.complete ? "Modifier" : "Renseigner"}</button>
                </div>
                {showForm && <div className="mt-3"><FlightTravelersForm expected={result.travelers.expected} lastTravelDate={result.lastTravelDate} pending={submitTravelers.isPending} onSubmit={(travelers) => submitTravelers.mutate({ requestRef: requestRef.trim(), email: email.trim(), travelers })} /></div>}
              </div>
            )}

            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-emerald-700 underline"><MessageCircle className="h-4 w-4" aria-hidden="true" />Écrire à l’agence sur WhatsApp ({office.whatsappDisplay})</a>
          </div>
        )}
      </ServiceSection>
    </ServicePageShell>
  );
}
