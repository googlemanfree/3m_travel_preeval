import React, { useEffect, useState } from "react";
import { Building2, Clock3, ExternalLink, MapPin, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOfficeContact } from "@/contexts/OfficeContactContext";
import { buildQuickOfficeContactMessage, OFFICE_CONTACT_LIST, formatOfficeTime, officeMapEmbedUrl, officeMapsUrl, officeWhatsAppUrl, validateQuickOfficeContact } from "@/lib/officeContacts";

export default function OfficeContactPanel() {
  const { office, officeId, setOfficeId } = useOfficeContact();
  const [now, setNow] = useState(() => new Date());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const submitQuickContact = (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateQuickOfficeContact({ name, email, message });
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    const content = buildQuickOfficeContactMessage(office, { name, email, message });
    window.open(officeWhatsAppUrl(office, content), "_blank", "noopener,noreferrer");
  };

  return (
    <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm md:p-7" aria-labelledby="office-contact-title">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Contact prioritaire</p>
          <h2 id="office-contact-title" className="mt-2 text-2xl font-black text-slate-900">Choisissez votre bureau</h2>
          <fieldset className="mt-5 grid grid-cols-2 gap-2" aria-label="Bureau à contacter">
            <legend className="sr-only">Bureau à contacter</legend>
            {OFFICE_CONTACT_LIST.map((candidate) => {
              const selected = candidate.id === officeId;
              return <button key={candidate.id} type="button" onClick={() => setOfficeId(candidate.id)} aria-pressed={selected} className={`rounded-xl border px-3 py-3 text-left text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${selected ? "border-blue-700 bg-blue-700 text-white shadow-md" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}>
                <span aria-hidden="true" className="mr-1.5 text-base">{candidate.flag}</span><span className="text-xs opacity-80">Bureau</span><span className="mt-0.5 block">{candidate.shortLabel}</span>
              </button>;
            })}
          </fieldset>
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <div className="flex items-start gap-3"><Building2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div className="min-w-0"><p className="break-words text-sm font-black leading-5 text-slate-900"><span aria-hidden="true" className="mr-1.5">{office.flag}</span>{office.label}</p><a href={officeWhatsAppUrl(office, `Bonjour ${office.label} de 3M Travel,`)} target="_blank" rel="noreferrer" className="mt-1 inline-block break-words font-bold text-emerald-800 hover:underline">WhatsApp : {office.whatsappDisplay}</a></div></div>
            <div className="mt-4 border-t border-emerald-100 pt-3 text-xs text-slate-700"><p className="flex items-center gap-1.5 font-bold"><Clock3 className="h-3.5 w-3.5 text-emerald-700" /> {office.timeZoneLabel} · {formatOfficeTime(office, now)}</p><p className="mt-2">{office.openingHours.join(" · ")}</p></div>
            <div className="mt-4 border-t border-emerald-100 pt-3"><p className="flex items-start gap-1.5 text-xs font-semibold text-slate-700"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" /><span>{office.addressLines.map((line) => <React.Fragment key={line}>{line}<br /></React.Fragment>)}</span></p><div className="mt-3 flex flex-wrap gap-2"><a href={officeWhatsAppUrl(office, `Bonjour ${office.label} de 3M Travel, je souhaite échanger avec votre équipe.`)} target="_blank" rel="noreferrer"><Button type="button" size="sm" className="h-9 rounded-lg bg-emerald-600 font-bold text-white hover:bg-emerald-700"><MessageCircle className="mr-1.5 h-4 w-4" />Discuter sur WhatsApp</Button></a><a href={officeMapsUrl(office)} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-50"><ExternalLink className="h-3.5 w-3.5" />Ouvrir la carte</a></div></div>
            <div className="mt-4 overflow-hidden rounded-xl border border-emerald-100 bg-white"><iframe title={`Carte ${office.label}`} src={officeMapEmbedUrl(office)} className="h-40 w-full border-0" loading="eager" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>
          </div>
        </div>

        <form onSubmit={submitQuickContact} className="min-w-0 rounded-2xl bg-slate-50 p-4 md:p-5" noValidate>
          <div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-blue-700" /><div><h3 className="font-black text-slate-900">Message rapide</h3><p className="text-xs text-slate-600">Votre message sera préparé pour le {office.label} sélectionné.</p></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Votre nom" aria-label="Votre nom" required /><Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="votre@email.com" aria-label="Votre adresse e-mail" type="email" required /></div>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Décrivez brièvement votre demande…" aria-label="Votre message" required rows={4} className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500" />
          {error && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p>}
          <Button type="submit" className="mt-4 h-11 w-full rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700"><Send className="mr-2 h-4 w-4" /> Continuer vers WhatsApp · {office.shortLabel}</Button>
        </form>
      </div>
    </section>
  );
}
