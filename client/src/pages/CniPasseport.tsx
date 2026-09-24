import { type FormEvent, useState } from "react";
import { CheckCircle2, ClipboardCheck, FileCheck2, MessageCircle, Send, UserCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";

export const CNI_PASSPORT_REQUEST_TYPES = [
  "Carte nationale d’identité — première demande",
  "Carte nationale d’identité — renouvellement",
  "Carte nationale d’identité — perte ou vol",
  "Passeport — première demande",
  "Passeport — renouvellement",
  "Passeport — perte ou vol",
  "Autre demande (précisez dans le message)",
] as const;

const WHATSAPP_NUMBER = "237698104832";

const STEPS = [
  { icon: UserCheck, title: "Vous nous décrivez votre situation", text: "Première demande, renouvellement, perte ou vol : indiquez-le dans le formulaire ci-dessous." },
  { icon: FileCheck2, title: "Nous vous indiquons les pièces à réunir", text: "La liste exacte dépend de votre situation ; elle vous est confirmée par notre équipe avant toute démarche, pour éviter un dépôt refusé." },
  { icon: ClipboardCheck, title: "Nous préparons et suivons le dossier", text: "Vérification des pièces, orientation vers le bon guichet et suivi de l’avancement avec vous." },
];

const GOOD_TO_KNOW = [
  "Les frais officiels, les délais de délivrance et la décision appartiennent à l’administration : nous ne les fixons pas et ne les garantissons pas.",
  "Ne joignez aucun document sensible dans le formulaire : les pièces se remettent ensuite par un canal sécurisé ou en agence, à Yaoundé.",
  "Vos informations ne servent qu’à traiter votre demande et à vous recontacter.",
];

function RequestForm() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const send = trpc.contact.sendContactEmail.useMutation({
    onSuccess: () => {
      setSent(true);
      toast({ title: "Demande envoyée", description: "Notre équipe vous recontacte pour confirmer les pièces à fournir." });
    },
    onError: (error) => toast({ title: "Envoi impossible", description: error.message, variant: "destructive" }),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const name = String(values.get("cniName") || "").trim();
    const phone = String(values.get("cniPhone") || "").trim();
    const type = String(values.get("cniType") || CNI_PASSPORT_REQUEST_TYPES[0]);
    send.mutate({
      name,
      email: String(values.get("cniEmail") || "").trim(),
      phone: phone || undefined,
      subject: `Demande CNI & passeport — ${type}`,
      message: [
        "Nouvelle demande CNI & passeport",
        `Client : ${name}`,
        `Téléphone / WhatsApp : ${phone || "non précisé"}`,
        `Type de demande : ${type}`,
        `Ville : ${String(values.get("cniCity") || "").trim() || "non précisée"}`,
        `Précisions : ${String(values.get("cniMessage") || "").trim() || "aucune"}`,
      ].join("\n"),
    });
  };

  if (sent) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden="true" />
        <div>
          <p className="font-black">Votre demande a bien été envoyée.</p>
          <p className="mt-1 text-sm leading-6">Notre équipe vous recontacte pour confirmer les pièces à fournir et la marche à suivre.</p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour 3M Travel, je viens d’envoyer une demande CNI & passeport. Merci de me contacter.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-emerald-900 underline"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Écrire aussi sur WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const field = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2" aria-label="Demande CNI et passeport">
      <label className="text-sm font-semibold text-slate-700">
        Nom complet
        <input name="cniName" required minLength={2} maxLength={200} autoComplete="name" className={field} />
      </label>
      <label className="text-sm font-semibold text-slate-700">
        Adresse e-mail
        <input name="cniEmail" type="email" required maxLength={320} autoComplete="email" className={field} />
      </label>
      <label className="text-sm font-semibold text-slate-700">
        Téléphone / WhatsApp
        <input name="cniPhone" type="tel" maxLength={30} autoComplete="tel" className={field} />
      </label>
      <label className="text-sm font-semibold text-slate-700">
        Ville
        <input name="cniCity" maxLength={100} placeholder="Yaoundé" className={field} />
      </label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">
        Votre demande
        <select name="cniType" required defaultValue={CNI_PASSPORT_REQUEST_TYPES[0]} className={field}>
          {CNI_PASSPORT_REQUEST_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold text-slate-700 md:col-span-2">
        Précisions (facultatif)
        <textarea name="cniMessage" rows={3} maxLength={1500} className={field} placeholder="Par exemple : document expiré, urgence, questions particulières…" />
      </label>
      <div className="md:col-span-2">
        <Button type="submit" disabled={send.isPending} className="gap-2 bg-blue-700 text-white hover:bg-blue-800">
          <Send className="h-4 w-4" aria-hidden="true" />
          {send.isPending ? "Envoi…" : "Envoyer ma demande"}
        </Button>
      </div>
    </form>
  );
}

export default function CniPasseport() {
  return (
    <ServicePageShell
      eyebrow="Services 3M · Documents d’identité et de voyage"
      title="CNI et passeport : un accompagnement clair, de la demande au suivi"
      introduction="Carte nationale d’identité ou passeport : première demande, renouvellement, perte ou vol. 3M Travel & Services vous aide à préparer un dossier complet et à en suivre l’avancement."
      primaryHref="/cni-passeport#demande"
      primaryLabel="Faire ma demande"
      notice="Les frais officiels, les délais et la décision de délivrance relèvent de l’administration. 3M prépare et suit votre dossier, sans garantir un résultat."
    >
      <ServiceSection title="Comment ça se passe" introduction="Trois étapes simples, sans déplacement inutile.">
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700" aria-hidden="true">
                <step.icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-xs font-black uppercase tracking-wider text-blue-700">Étape {index + 1}</p>
              <h3 className="mt-1 font-black text-slate-950">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </ServiceSection>

      <ServiceSection title="À savoir avant de commencer" tone="slate">
        <ul className="mt-6 space-y-3">
          {GOOD_TO_KNOW.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </ServiceSection>

      <section id="demande" className="scroll-mt-24 bg-white px-4 py-14 sm:px-6 lg:px-8" aria-labelledby="cni-request-title">
        <div className="mx-auto max-w-4xl">
          <h2 id="cni-request-title" className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Faire ma demande</h2>
          <p className="mt-2 mb-6 max-w-2xl text-sm leading-6 text-slate-600">Décrivez votre situation : un conseiller vous recontacte pour confirmer les pièces à fournir.</p>
          <RequestForm />
        </div>
      </section>
    </ServicePageShell>
  );
}
