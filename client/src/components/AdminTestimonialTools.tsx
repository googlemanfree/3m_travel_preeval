import React, { useId, useState } from "react";
import { PlusCircle, Quote, Star } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CONSENT_CHANNELS, CONSENT_CHANNEL_LABELS, type ConsentChannel } from "@shared/testimonialConsent";

type DisplayNameChoice = "full_name" | "first_name_only" | "initials";

const DISPLAY_NAME_LABELS: Record<DisplayNameChoice, string> = {
  first_name_only: "Prénom seulement (recommandé)",
  initials: "Initiales",
  full_name: "Nom complet",
};

/** Même règle que le serveur : le nom tel que le public le verra. */
export function publicDisplayName(fullName: string, choice: DisplayNameChoice): string {
  const normalized = fullName.trim();
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (!normalized) return "Nom du client";
  if (choice === "full_name") return normalized;
  if (choice === "first_name_only") return parts[0] ?? normalized;
  return parts.map((part) => `${part.charAt(0).toUpperCase()}.`).join(" ");
}

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  fullName: "",
  email: "",
  destinationCountry: "",
  serviceType: "",
  rating: "5",
  reviewText: "",
  displayNameChoice: "first_name_only" as DisplayNameChoice,
  consentChannel: "whatsapp" as ConsentChannel,
  consentDate: today(),
  consentProof: "",
  dossierReference: "",
  consentToPublish: false,
  attestation: false,
});

const fieldClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900";

/** Aperçu fidèle de ce que verra le visiteur sur /avis et sur l'accueil. */
export function TestimonialPreview({ name, country, service, rating, text }: { name: string; country: string; service: string; rating: number; text: string }) {
  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="testimonial-preview">
      <Quote className="h-5 w-5 text-blue-700" aria-hidden="true" />
      <div className="mt-2 flex gap-0.5" aria-label={`${rating} étoiles sur 5`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className={`h-4 w-4 ${index < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} aria-hidden="true" />
        ))}
      </div>
      <blockquote className="mt-3 text-sm leading-6 text-slate-700">{text.trim() || "Le témoignage du client apparaîtra ici."}</blockquote>
      <figcaption className="mt-3 text-xs font-semibold text-slate-600">
        {name}
        {country.trim() ? ` · ${country.trim()}` : ""}
        {service.trim() ? ` · ${service.trim()}` : ""}
      </figcaption>
    </figure>
  );
}

/**
 * Saisie d'un témoignage réellement donné par un client. La preuve de l'accord de publication (canal, date, élément
 * conservé) et l'attestation d'authenticité sont obligatoires : sans elles, rien ne s'enregistre.
 */
export function TestimonialComposer({ sessionToken, onSaved }: { sessionToken: string; onSaved: () => void }) {
  const base = useId();
  const id = (name: string) => `${base}-${name}`;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const create = trpc.customerReview.createByAdmin.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setForm(emptyForm());
      setOpen(false);
      onSaved();
    },
    onError: (error) => toast.error(error.message),
  });

  const set = (key: keyof ReturnType<typeof emptyForm>) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const complete = form.fullName.trim().length >= 3 && form.reviewText.trim().length >= 10 && form.consentProof.trim().length >= 10 && form.consentToPublish && form.attestation;

  const submit = (publishNow: boolean) => {
    if (!complete) {
      toast.error("Renseignez le témoignage, la preuve de l’accord et cochez les deux confirmations.");
      return;
    }
    create.mutate({
      sessionToken,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      destinationCountry: form.destinationCountry.trim() || undefined,
      serviceType: form.serviceType.trim() || undefined,
      rating: Number(form.rating),
      reviewText: form.reviewText.trim(),
      displayNameChoice: form.displayNameChoice,
      consentChannel: form.consentChannel,
      consentDate: form.consentDate,
      consentProof: form.consentProof.trim(),
      dossierReference: form.dossierReference.trim() || undefined,
      consentToPublish: true,
      attestation: true,
      publishNow,
    });
  };

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/60 p-5" data-testid="testimonial-composer">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-bold text-slate-900">Publier le témoignage d’un client</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pour un retour reçu par WhatsApp, e-mail, SMS, en agence ou par formulaire signé. Seul un témoignage réellement donné par un client, avec son accord de publication, peut être saisi : la preuve de cet accord est conservée avec l’avis.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setOpen((value) => !value)} className="gap-2 border-blue-300 bg-white" aria-expanded={open}>
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          {open ? "Fermer" : "Ajouter un témoignage"}
        </Button>
      </div>

      {open && (
        <form className="mt-5 grid gap-6 lg:grid-cols-[1.4fr_1fr]" onSubmit={(event) => { event.preventDefault(); submit(false); }}>
          <div className="grid gap-4 md:grid-cols-2">
            <label htmlFor={id("name")} className="text-sm font-semibold text-slate-700">Nom du client
              <input id={id("name")} required value={form.fullName} onChange={set("fullName")} maxLength={255} className={fieldClass} />
            </label>
            <label htmlFor={id("email")} className="text-sm font-semibold text-slate-700">E-mail du client (facultatif)
              <input id={id("email")} type="email" value={form.email} onChange={set("email")} maxLength={320} className={fieldClass} />
            </label>
            <label htmlFor={id("country")} className="text-sm font-semibold text-slate-700">Pays de destination
              <input id={id("country")} value={form.destinationCountry} onChange={set("destinationCountry")} maxLength={100} className={fieldClass} placeholder="Ex. Canada" />
            </label>
            <label htmlFor={id("service")} className="text-sm font-semibold text-slate-700">Service concerné
              <input id={id("service")} value={form.serviceType} onChange={set("serviceType")} maxLength={100} className={fieldClass} placeholder="Ex. Visa études" />
            </label>
            <label htmlFor={id("rating")} className="text-sm font-semibold text-slate-700">Note donnée par le client
              <select id={id("rating")} value={form.rating} onChange={set("rating")} className={fieldClass}>
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} sur 5</option>)}
              </select>
            </label>
            <label htmlFor={id("display")} className="text-sm font-semibold text-slate-700">Nom affiché au public
              <select id={id("display")} value={form.displayNameChoice} onChange={set("displayNameChoice")} className={fieldClass}>
                {(Object.keys(DISPLAY_NAME_LABELS) as DisplayNameChoice[]).map((value) => <option key={value} value={value}>{DISPLAY_NAME_LABELS[value]}</option>)}
              </select>
            </label>
            <label htmlFor={id("text")} className="text-sm font-semibold text-slate-700 md:col-span-2">Témoignage (tel que donné par le client)
              <textarea id={id("text")} required minLength={10} maxLength={1000} rows={5} value={form.reviewText} onChange={set("reviewText")} className={fieldClass} />
              <span className="text-xs font-normal text-slate-500">{form.reviewText.length}/1000 · Recopiez les mots du client ; corrigez au plus l’orthographe.</span>
            </label>

            <fieldset className="grid gap-4 rounded-xl border border-blue-200 bg-white p-4 md:col-span-2 md:grid-cols-2">
              <legend className="px-1 text-sm font-black text-slate-900">Preuve de l’accord de publication</legend>
              <label htmlFor={id("channel")} className="text-sm font-semibold text-slate-700">Comment le client a donné son accord
                <select id={id("channel")} value={form.consentChannel} onChange={set("consentChannel")} className={fieldClass}>
                  {CONSENT_CHANNELS.map((channel) => <option key={channel} value={channel}>{CONSENT_CHANNEL_LABELS[channel]}</option>)}
                </select>
              </label>
              <label htmlFor={id("date")} className="text-sm font-semibold text-slate-700">Date de l’accord
                <input id={id("date")} type="date" required max={today()} value={form.consentDate} onChange={set("consentDate")} className={fieldClass} />
              </label>
              <label htmlFor={id("proof")} className="text-sm font-semibold text-slate-700 md:col-span-2">Élément conservé qui le prouve
                <input id={id("proof")} required minLength={10} maxLength={500} value={form.consentProof} onChange={set("consentProof")} className={fieldClass} placeholder="Ex. capture WhatsApp du 12/10 enregistrée dans le dossier du client" />
              </label>
              <label htmlFor={id("dossier")} className="text-sm font-semibold text-slate-700 md:col-span-2">Référence du dossier (facultatif)
                <input id={id("dossier")} maxLength={60} value={form.dossierReference} onChange={set("dossierReference")} className={fieldClass} placeholder="Ex. 3M-2026-0012" />
              </label>
            </fieldset>

            <label htmlFor={id("consent")} className="flex items-start gap-2 text-sm text-slate-700 md:col-span-2">
              <input id={id("consent")} type="checkbox" checked={form.consentToPublish} onChange={(event) => setForm((current) => ({ ...current, consentToPublish: event.target.checked }))} className="mt-1" />
              <span>Le client a donné son accord pour publier ce témoignage sous le nom affiché ci-contre.</span>
            </label>
            <label htmlFor={id("attest")} className="flex items-start gap-2 text-sm text-slate-700 md:col-span-2">
              <input id={id("attest")} type="checkbox" checked={form.attestation} onChange={(event) => setForm((current) => ({ ...current, attestation: event.target.checked }))} className="mt-1" />
              <span>J’atteste que ce témoignage a été réellement donné par ce client : il n’a été ni inventé ni modifié dans son sens.</span>
            </label>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit" variant="outline" disabled={create.isPending || !complete} data-testid="testimonial-save-pending">
                Enregistrer pour validation
              </Button>
              <Button type="button" disabled={create.isPending || !complete} onClick={() => submit(true)} className="bg-green-700 hover:bg-green-800" data-testid="testimonial-publish-now">
                {create.isPending ? "Enregistrement…" : "Publier maintenant"}
              </Button>
            </div>
          </div>

          <aside aria-label="Aperçu public" className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-600">Aperçu tel que le public le verra</p>
            <TestimonialPreview name={publicDisplayName(form.fullName, form.displayNameChoice)} country={form.destinationCountry} service={form.serviceType} rating={Number(form.rating)} text={form.reviewText} />
            <p className="text-xs leading-5 text-slate-600">L’e-mail et la preuve de l’accord ne sont jamais affichés au public.</p>
          </aside>
        </form>
      )}
    </Card>
  );
}

/** Actions sur un avis déjà enregistré : corriger (avec motif) ou retirer de la publication. */
export function ReviewRowTools({ sessionToken, review, onChanged }: {
  sessionToken: string;
  review: { id: number; status: string; reviewText: string; destinationCountry: string | null; serviceType: string | null; displayNameChoice: DisplayNameChoice };
  onChanged: () => void;
}) {
  const base = useId();
  const [mode, setMode] = useState<null | "edit" | "withdraw">(null);
  const [reason, setReason] = useState("");
  const [text, setText] = useState(review.reviewText);
  const [country, setCountry] = useState(review.destinationCountry ?? "");
  const [service, setService] = useState(review.serviceType ?? "");
  const [choice, setChoice] = useState<DisplayNameChoice>(review.displayNameChoice);

  const done = (message: string) => { toast.success(message); setMode(null); setReason(""); onChanged(); };
  const update = trpc.customerReview.updateByAdmin.useMutation({ onSuccess: (result) => done(result.changed ? "Témoignage corrigé." : "Aucune modification."), onError: (error) => toast.error(error.message) });
  const withdraw = trpc.customerReview.withdrawReview.useMutation({ onSuccess: () => done("Témoignage retiré de la publication."), onError: (error) => toast.error(error.message) });

  return (
    <div className="mt-3 border-t border-slate-100 pt-3" data-testid={`review-tools-${review.id}`}>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setMode(mode === "edit" ? null : "edit")} data-testid={`review-edit-${review.id}`}>Corriger</Button>
        {review.status === "approved" && (
          <Button type="button" variant="outline" size="sm" className="border-rose-300 text-rose-800" onClick={() => setMode(mode === "withdraw" ? null : "withdraw")} data-testid={`review-withdraw-${review.id}`}>Retirer de la publication</Button>
        )}
      </div>

      {mode === "edit" && (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label htmlFor={`${base}-text`} className="text-sm font-semibold text-slate-700 md:col-span-2">Témoignage
            <textarea id={`${base}-text`} rows={4} maxLength={1000} value={text} onChange={(event) => setText(event.target.value)} className={fieldClass} />
          </label>
          <label htmlFor={`${base}-country`} className="text-sm font-semibold text-slate-700">Pays
            <input id={`${base}-country`} value={country} maxLength={100} onChange={(event) => setCountry(event.target.value)} className={fieldClass} />
          </label>
          <label htmlFor={`${base}-service`} className="text-sm font-semibold text-slate-700">Service
            <input id={`${base}-service`} value={service} maxLength={100} onChange={(event) => setService(event.target.value)} className={fieldClass} />
          </label>
          <label htmlFor={`${base}-choice`} className="text-sm font-semibold text-slate-700">Nom affiché
            <select id={`${base}-choice`} value={choice} onChange={(event) => setChoice(event.target.value as DisplayNameChoice)} className={fieldClass}>
              {(Object.keys(DISPLAY_NAME_LABELS) as DisplayNameChoice[]).map((value) => <option key={value} value={value}>{DISPLAY_NAME_LABELS[value]}</option>)}
            </select>
          </label>
          <label htmlFor={`${base}-reason`} className="text-sm font-semibold text-slate-700">Motif de la correction
            <input id={`${base}-reason`} value={reason} maxLength={300} onChange={(event) => setReason(event.target.value)} className={fieldClass} placeholder="Ex. faute d’orthographe corrigée" />
          </label>
          <div className="md:col-span-2">
            <Button type="button" size="sm" disabled={update.isPending || reason.trim().length < 5 || text.trim().length < 10} data-testid={`review-edit-save-${review.id}`}
              onClick={() => update.mutate({ sessionToken, reviewId: review.id, reviewText: text.trim(), destinationCountry: country.trim(), serviceType: service.trim(), displayNameChoice: choice, reason: reason.trim() })}>
              Enregistrer la correction
            </Button>
          </div>
        </div>
      )}

      {mode === "withdraw" && (
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label htmlFor={`${base}-why`} className="text-sm font-semibold text-slate-700">Motif du retrait
            <input id={`${base}-why`} value={reason} maxLength={300} onChange={(event) => setReason(event.target.value)} className={fieldClass} placeholder="Ex. le client a retiré son accord le 14/10" />
          </label>
          <Button type="button" size="sm" className="bg-rose-700 hover:bg-rose-800" disabled={withdraw.isPending || reason.trim().length < 3} data-testid={`review-withdraw-confirm-${review.id}`}
            onClick={() => withdraw.mutate({ sessionToken, reviewId: review.id, reason: reason.trim() })}>
            Confirmer le retrait
          </Button>
        </div>
      )}
    </div>
  );
}
