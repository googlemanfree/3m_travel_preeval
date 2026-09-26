import { type FormEvent, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { buildQuoteMessage, quoteSubject, type QuotePrefill } from "@/data/flightQuote";

export function FlightQuoteRequest({ prefill = null }: { prefill?: QuotePrefill | null }) {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const intent = prefill?.intent ?? "quote";
  const watching = intent === "watch";

  // Une demande venue d'une offre amène le visiteur directement sur le formulaire, déjà rempli.
  useEffect(() => {
    if (prefill && typeof sectionRef.current?.scrollIntoView === "function") sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [prefill]);

  const requestQuote = trpc.contact.sendContactEmail.useMutation({
    onSuccess: () => {
      setSent(true);
      const whatsappText = watching
        ? "Bonjour 3M Travel, je viens de demander le suivi d'un tarif de vol. Merci de me prévenir en cas de baisse."
        : "Bonjour 3M Travel, je viens d'envoyer une demande de devis vol. Merci de me contacter.";
      window.open(`https://wa.me/237698104832?text=${encodeURIComponent(whatsappText)}`, "_blank", "noopener,noreferrer");
      toast({ title: "Demande envoyée", description: "Notre équipe reçoit votre besoin et vous contactera avec des options adaptées." });
    },
    onError: error => toast({ title: "Envoi impossible", description: error.message, variant: "destructive" }),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const field = (name: string) => String(values.get(name) || "");
    const name = field("quoteName");
    requestQuote.mutate({
      name,
      email: field("quoteEmail"),
      subject: quoteSubject(intent),
      message: buildQuoteMessage(intent, {
        name,
        phone: field("quotePhone"),
        origin: field("quoteOrigin"),
        destination: field("quoteDestination"),
        departure: field("quoteDeparture"),
        returnDate: field("quoteReturn"),
        travelers: field("quoteTravelers"),
        cabin: field("quoteCabin"),
        budget: field("quoteBudget"),
      }, prefill?.note ?? ""),
    });
  };

  return (
    <section id="devis" ref={sectionRef} className="max-w-5xl mx-auto px-4 pb-2 scroll-mt-6" data-testid="flight-quote-request" data-intent={intent}>
      <div className="rounded-3xl border border-blue-100 bg-white p-6 md:p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Billets d’avion</p>
          <h2 className="mt-1 text-2xl font-black text-[#1E3A8A]">{watching ? "Faire suivre ce tarif par un conseiller" : "Vous préférez être accompagné ?"}</h2>
          <p className="mt-2 text-sm text-gray-600">
            {watching
              ? "Un conseiller 3M surveille ce parcours et vous prévient par WhatsApp ou e-mail si un meilleur tarif apparaît. Le suivi est assuré par notre équipe, il n'est pas automatique."
              : "Nous recherchons pour vous les meilleures options tarifaires selon votre destination, vos dates et votre budget."}
          </p>
          {prefill?.note && <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-900" data-testid="quote-prefill-note">{prefill.note}</p>}
        </div>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <QuoteField label="Ville ou aéroport de départ" name="quoteOrigin" required defaultValue={prefill?.origin} />
          <QuoteField label="Destination" name="quoteDestination" required defaultValue={prefill?.destination} />
          <QuoteField label="Date aller" name="quoteDeparture" type="date" required defaultValue={prefill?.departureDate} />
          <QuoteField label="Date retour" name="quoteReturn" type="date" defaultValue={prefill?.returnDate} />
          <QuoteField label="Nombre de passagers" name="quoteTravelers" type="number" min="1" defaultValue="1" required />
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Classe de voyage</label>
            <select name="quoteCabin" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" defaultValue="Économique">
              <option>Économique</option>
              <option>Premium Economy</option>
              <option>Affaires</option>
              <option>Première</option>
            </select>
          </div>
          <QuoteField label={watching ? "Tarif cible (FCFA)" : "Budget approximatif (FCFA)"} name="quoteBudget" type="number" min="0" />
          <QuoteField label="Nom complet" name="quoteName" required maxLength={200} />
          <QuoteField label="Téléphone WhatsApp" name="quotePhone" type="tel" required maxLength={30} />
          <QuoteField label="E-mail" name="quoteEmail" type="email" required />
          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" disabled={requestQuote.isPending || sent} className="rounded-xl bg-[#1E3A8A] px-6 font-bold text-white hover:bg-[#2563EB]">
              {requestQuote.isPending ? "Transmission…" : sent ? "Demande envoyée" : watching ? "Faire suivre ce tarif" : "Demander un devis"}
            </Button>
            <span className="text-xs text-gray-500">Un récapitulatif WhatsApp est préparé après l’envoi.</span>
          </div>
        </form>
      </div>
    </section>
  );
}

function QuoteField({ label, name, type = "text", required, min, defaultValue, maxLength }: { label: string; name: string; type?: string; required?: boolean; min?: string; defaultValue?: string; maxLength?: number }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-gray-700">{label}</label>
      <input name={name} type={type} required={required} min={min} defaultValue={defaultValue} maxLength={maxLength} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500" />
    </div>
  );
}
