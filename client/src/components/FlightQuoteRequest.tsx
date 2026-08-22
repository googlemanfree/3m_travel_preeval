import { type FormEvent, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function FlightQuoteRequest() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const requestQuote = trpc.contact.sendContactEmail.useMutation({
    onSuccess: () => {
      setSent(true);
      const whatsappText = "Bonjour 3M Travel, je viens d'envoyer une demande de devis vol. Merci de me contacter.";
      window.open(`https://wa.me/16728972999?text=${encodeURIComponent(whatsappText)}`, "_blank", "noopener,noreferrer");
      toast({ title: "Demande envoyée", description: "Notre équipe reçoit votre besoin et vous contactera avec des options adaptées." });
    },
    onError: error => toast({ title: "Envoi impossible", description: error.message, variant: "destructive" }),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const name = String(values.get("quoteName") || "");
    const phone = String(values.get("quotePhone") || "");
    requestQuote.mutate({
      name,
      email: String(values.get("quoteEmail") || ""),
      subject: "Demande de devis vol",
      message: [
        "Nouvelle demande de devis vol", `Client : ${name}`, `WhatsApp : ${phone}`,
        `Itinéraire : ${values.get("quoteOrigin")} → ${values.get("quoteDestination")}`,
        `Dates : aller ${values.get("quoteDeparture")} ; retour ${values.get("quoteReturn") || "aller simple"}`,
        `Passagers : ${values.get("quoteTravelers")}`, `Classe : ${values.get("quoteCabin")}`,
        `Budget approximatif : ${values.get("quoteBudget") || "non précisé"}`,
      ].join("\n"),
    });
  };

  return <section className="max-w-5xl mx-auto px-4 pb-2"><div className="rounded-3xl border border-blue-100 bg-white p-6 md:p-8 shadow-sm"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Billets d’avion</p><h2 className="mt-1 text-2xl font-black text-[#1E3A8A]">Vous préférez être accompagné ?</h2><p className="mt-2 text-sm text-gray-600">Nous recherchons pour vous les meilleures options tarifaires selon votre destination, vos dates et votre budget.</p></div><form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><QuoteField label="Ville ou aéroport de départ" name="quoteOrigin" required /><QuoteField label="Destination" name="quoteDestination" required /><QuoteField label="Date aller" name="quoteDeparture" type="date" required /><QuoteField label="Date retour" name="quoteReturn" type="date" /><QuoteField label="Nombre de passagers" name="quoteTravelers" type="number" min="1" defaultValue="1" required /><div><label className="mb-1 block text-sm font-semibold text-gray-700">Classe de voyage</label><select name="quoteCabin" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" defaultValue="Économique"><option>Économique</option><option>Premium Economy</option><option>Affaires</option><option>Première</option></select></div><QuoteField label="Budget approximatif (FCFA)" name="quoteBudget" type="number" min="0" /><QuoteField label="Nom complet" name="quoteName" required /><QuoteField label="Téléphone WhatsApp" name="quotePhone" type="tel" required /><QuoteField label="E-mail" name="quoteEmail" type="email" required /><div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2"><Button type="submit" disabled={requestQuote.isPending || sent} className="rounded-xl bg-[#1E3A8A] px-6 font-bold text-white hover:bg-[#2563EB]">{requestQuote.isPending ? "Transmission…" : sent ? "Demande envoyée" : "Demander un devis"}</Button><span className="text-xs text-gray-500">Un récapitulatif WhatsApp est préparé après l’envoi.</span></div></form></div></section>;
}

function QuoteField({ label, name, type = "text", required, min, defaultValue }: { label: string; name: string; type?: string; required?: boolean; min?: string; defaultValue?: string }) {
  return <div><label className="mb-1 block text-sm font-semibold text-gray-700">{label}</label><input name={name} type={type} required={required} min={min} defaultValue={defaultValue} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500" /></div>;
}
