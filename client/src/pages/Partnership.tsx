import { useState } from "react";
import { ArrowRight, BadgeCheck, Building2, CheckCircle2, FileSignature, Loader2, Printer, ScrollText, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { scrollBehavior } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import {
  PARTNERSHIP_CHANNELS,
  PARTNERSHIP_CHANNEL_LABELS,
  PARTNERSHIP_FIELD_LIMITS,
  PARTNERSHIP_KINDS,
  PARTNERSHIP_KIND_LABELS,
  PARTNERSHIP_VOLUME_BANDS,
  type PartnershipChannel,
  type PartnershipKind,
} from "@shared/partnershipProgram";

type FormState = {
  kind: PartnershipKind;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  companyName: string;
  representativeRole: string;
  legalRegistration: string;
  taxId: string;
  licenceNumber: string;
  website: string;
  yearsActive: string;
  volumeBand: string;
  channels: PartnershipChannel[];
  message: string;
  isAdult: boolean;
  consentPrivacy: boolean;
  codeOfConduct: boolean;
  hp: string;
};

const emptyForm = (kind: PartnershipKind): FormState => ({
  kind, contactName: "", email: "", phone: "", country: "", city: "", companyName: "", representativeRole: "", legalRegistration: "", taxId: "", licenceNumber: "",
  website: "", yearsActive: "", volumeBand: "", channels: [], message: "", isAdult: false, consentPrivacy: false, codeOfConduct: false, hp: "",
});

const fieldClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

/** Interface publique du programme de partenariat : agence de voyage ou particulier apporteur d'affaires. */
export default function Partnership() {
  const { t, language } = useLanguage();
  const en = language === "en";
  const [form, setForm] = useState<FormState>(() => emptyForm("travel_agency"));
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ reference: string; alreadyReceived: boolean } | null>(null);
  const [previewKind, setPreviewKind] = useState<PartnershipKind | null>(null);
  const preview = trpc.partnership.previewProtocol.useQuery({ kind: previewKind ?? "travel_agency" }, { enabled: previewKind !== null, staleTime: 10 * 60_000 });
  const submit = trpc.partnership.submit.useMutation({
    onSuccess: (result) => { setDone({ reference: result.reference, alreadyReceived: result.alreadyReceived }); setError(""); toast.success(result.alreadyReceived ? t("Votre candidature est déjà enregistrée.", "Your application is already registered.") : t("Votre candidature a bien été envoyée.", "Your application was sent successfully.")); window.scrollTo({ top: document.getElementById("candidature")?.offsetTop ?? 0, behavior: scrollBehavior() }); },
    onError: (mutationError) => { setError(mutationError.message); toast.error(mutationError.message); },
  });
  const agency = form.kind === "travel_agency";
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const missing = !form.contactName.trim() || !form.email.trim() || !form.phone.trim() || !form.country.trim()
      || (agency && (!form.companyName.trim() || !form.legalRegistration.trim()));
    if (missing) return setError(t("Complétez les champs obligatoires (marqués d’une étoile).", "Please complete the required fields (marked with a star)."));
    if (!agency && !form.isAdult) return setError(t("Le partenariat est réservé aux personnes majeures.", "The partnership is reserved for adults."));
    if (!form.consentPrivacy || !form.codeOfConduct) return setError(t("Cochez le consentement et la charte pour envoyer votre candidature.", "Tick the consent and the charter to send your application."));
    setError("");
    const years = Number.parseInt(form.yearsActive, 10);
    submit.mutate({
      kind: form.kind,
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      country: form.country,
      city: form.city || undefined,
      companyName: agency ? form.companyName || undefined : undefined,
      representativeRole: agency ? form.representativeRole || undefined : undefined,
      legalRegistration: agency ? form.legalRegistration || undefined : undefined,
      taxId: agency ? form.taxId || undefined : undefined,
      licenceNumber: agency ? form.licenceNumber || undefined : undefined,
      website: form.website || undefined,
      yearsActive: agency && Number.isFinite(years) ? years : undefined,
      volumeBand: (PARTNERSHIP_VOLUME_BANDS as readonly string[]).includes(form.volumeBand) ? (form.volumeBand as (typeof PARTNERSHIP_VOLUME_BANDS)[number]) : undefined,
      channels: form.channels.length ? form.channels : undefined,
      message: form.message || undefined,
      isAdult: agency ? undefined : form.isAdult,
      consentPrivacy: form.consentPrivacy,
      codeOfConduct: form.codeOfConduct,
      hp: form.hp,
    });
  };

  const steps = en
    ? ["You apply online", "3M checks your details", "You receive your agreement, with your own terms", "You read and sign it online; 3M countersigns", "You get your personal code and link"]
    : ["Vous déposez votre candidature", "3M vérifie vos informations", "Vous recevez votre protocole d’accord, avec vos conditions", "Vous le lisez et le signez en ligne ; 3M le contresigne", "Vous recevez votre code et votre lien personnels"];

  const guarantees = en
    ? [
        ["Terms written before you sign", "Your commission rate, term and payment delay are set for you and written in the agreement. Nothing is hidden or changed afterwards."],
        ["Paid only on real payments", "A commission exists once a client you referred has actually paid and 3M has confirmed it. No payment, no commission."],
        ["No promise, no cash handling", "You never promise a visa, a job or a decision, and you never collect money in 3M’s name. Clients pay 3M directly."],
        ["No “official partner” without permission", "Your name or logo is displayed as a 3M partner only with 3M’s written authorisation."],
      ]
    : [
        ["Des conditions écrites avant de signer", "Votre taux de commission, la durée et le délai de versement sont fixés pour vous et inscrits dans le protocole. Rien n’est caché ni modifié ensuite."],
        ["Rémunéré sur des paiements réels", "Une commission existe quand un client que vous avez orienté a réellement payé et que 3M l’a confirmé. Pas de paiement, pas de commission."],
        ["Aucune promesse, aucun encaissement", "Vous ne promettez jamais un visa, un emploi ou une décision, et vous n’encaissez aucune somme au nom de 3M. Le client paie 3M directement."],
        ["Pas de « partenaire officiel » sans accord", "Votre nom ou votre logo n’apparaît comme partenaire de 3M qu’avec l’autorisation écrite de 3M."],
      ];

  const faq = en
    ? [
        ["How much is the commission?", "It is set individually and written in your agreement before you sign. It is a share of 3M’s fees actually collected from clients you referred, not of official fees."],
        ["Who can apply?", "Travel agencies and firms with a valid registration, and adults acting independently. Applications are reviewed by 3M."],
        ["Do I become an employee or an agent of 3M?", "No. You are an independent partner. You cannot commit 3M, set prices or accept files."],
        ["Can I stop?", "Yes. Either party can end the agreement with 30 days’ notice. Commissions already earned stay due."],
      ]
    : [
        ["Quel est le taux de commission ?", "Il est fixé au cas par cas et inscrit dans votre protocole avant votre signature. C’est une part des honoraires de 3M effectivement encaissés auprès des clients que vous orientez, jamais des frais officiels."],
        ["Qui peut candidater ?", "Les agences et cabinets immatriculés, et les personnes majeures qui agissent à titre indépendant. Chaque candidature est examinée par 3M."],
        ["Suis-je salarié ou agent de 3M ?", "Non. Vous êtes un partenaire indépendant : vous ne pouvez ni engager 3M, ni fixer un prix, ni accepter un dossier."],
        ["Puis-je arrêter ?", "Oui. Chaque partie peut mettre fin au protocole avec un préavis de 30 jours. Les commissions déjà acquises restent dues."],
      ];

  return (
    <main className="min-h-screen bg-slate-50" data-testid="partnership-page">
      <section className="bg-[linear-gradient(160deg,#071b3d_0%,#0b2f6f_60%,#1463ff_130%)] px-4 pb-14 pt-14 text-white sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-200">{t("Programme de partenariat", "Partnership programme")}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">{t("Devenez partenaire de 3M TRAVEL AGENCY", "Become a partner of 3M TRAVEL AGENCY")}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-sky-100 sm:text-lg">
            {t(
              "Agence de voyage ou particulier : orientez des clients vers un accompagnement visa et mobilité sérieux, dans un cadre écrit, transparent et signé des deux côtés.",
              "Travel agency or individual: refer clients to serious visa and mobility support, within a written, transparent framework signed by both sides.",
            )}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#candidature" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
              {t("Déposer ma candidature", "Apply now")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="#protocole" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20">
              <ScrollText className="h-4 w-4" aria-hidden="true" /> {t("Lire le modèle de protocole d’accord", "Read the agreement template")}
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="profiles-title">
        <h2 id="profiles-title" className="text-2xl font-black text-slate-950">{t("Deux profils de partenaires", "Two partner profiles")}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {PARTNERSHIP_KINDS.map((kind) => (
            <article key={kind} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-testid={`partnership-profile-${kind}`}>
              {kind === "travel_agency" ? <Building2 className="h-8 w-8 text-blue-800" aria-hidden="true" /> : <UserRound className="h-8 w-8 text-blue-800" aria-hidden="true" />}
              <h3 className="mt-3 text-xl font-black text-slate-950">{en ? PARTNERSHIP_KIND_LABELS[kind].en : PARTNERSHIP_KIND_LABELS[kind].fr}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{en ? PARTNERSHIP_KIND_LABELS[kind].hintEn : PARTNERSHIP_KIND_LABELS[kind].hintFr}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {(kind === "travel_agency"
                  ? en
                    ? ["You keep your own customers and your own contract with them", "You refer them to 3M with your personal code or link", "You are paid a commission on fees 3M actually collects", "A registered business and a representative who can sign are required"]
                    : ["Vous gardez vos clients et votre propre contrat avec eux", "Vous les orientez vers 3M avec votre code ou lien personnel", "Vous percevez une commission sur les honoraires que 3M encaisse réellement", "Une entreprise immatriculée et un représentant habilité à signer sont requis"]
                  : en
                    ? ["You recommend 3M to people you know, in good faith", "You act independently, as a private individual", "You are paid a commission on fees 3M actually collects", "You must be an adult, with no conflict of interest"]
                    : ["Vous recommandez 3M à vos proches, de bonne foi", "Vous agissez à titre indépendant, en tant que particulier", "Vous percevez une commission sur les honoraires que 3M encaisse réellement", "Vous devez être majeur et sans conflit d’intérêts"]
                ).map((item) => (
                  <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />{item}</li>
                ))}
              </ul>
              <a href="#candidature" onClick={() => setForm(emptyForm(kind))} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-700 underline underline-offset-2">
                {t("Candidater comme", "Apply as")} {en ? PARTNERSHIP_KIND_LABELS[kind].en.toLowerCase() : PARTNERSHIP_KIND_LABELS[kind].fr.toLowerCase()} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12" aria-labelledby="how-title">
        <h2 id="how-title" className="text-2xl font-black text-slate-950">{t("Comment ça marche", "How it works")}</h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-black text-white">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12" aria-labelledby="guarantees-title">
        <h2 id="guarantees-title" className="flex items-center gap-2 text-2xl font-black text-slate-950"><ShieldCheck className="h-6 w-6 text-emerald-700" aria-hidden="true" />{t("Un cadre clair, des deux côtés", "A clear framework for both sides")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {guarantees.map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
              <p className="flex items-center gap-2 font-black text-slate-900"><BadgeCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />{title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="protocole" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-12" aria-labelledby="protocol-title" data-testid="partnership-protocol-preview">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 id="protocol-title" className="flex items-center gap-2 text-2xl font-black text-slate-950"><FileSignature className="h-6 w-6 text-blue-800" aria-hidden="true" />{t("Le protocole d’accord", "The partnership agreement")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {t(
              "Voici le modèle, article par article. Il est lisible avant toute candidature. Votre protocole personnel reprend ce texte avec vos informations et vos conditions (commission, durée, délais), puis se signe en ligne.",
              "Here is the template, article by article. You can read it before applying. Your personal agreement reuses this text with your details and terms (commission, term, delays) and is signed online.",
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("Choisir le modèle", "Choose the template")}>
            {PARTNERSHIP_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setPreviewKind(kind)}
                aria-pressed={previewKind === kind}
                className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold ${previewKind === kind ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"}`}
                data-testid={`partnership-preview-${kind}`}
              >
                {en ? PARTNERSHIP_KIND_LABELS[kind].en : PARTNERSHIP_KIND_LABELS[kind].fr}
              </button>
            ))}
            {previewKind && preview.data ? (
              <Button type="button" variant="outline" onClick={() => window.print()} className="min-h-11"><Printer className="mr-2 h-4 w-4" aria-hidden="true" />{t("Imprimer", "Print")}</Button>
            ) : null}
          </div>
          {previewKind ? (
            preview.isLoading ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-600" role="status"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{t("Chargement du modèle…", "Loading the template…")}</p>
            ) : preview.isError ? (
              <p className="mt-4 text-sm text-rose-700" role="alert">{t("Le modèle n’a pas pu être chargé. Réessayez dans un instant.", "The template could not be loaded. Please try again shortly.")}</p>
            ) : (
              <div className="mt-4 max-h-[32rem] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800" tabIndex={0} aria-label={t("Texte du protocole", "Agreement text")}>
                {(preview.data?.text ?? "").split(/\n\n/).map((block, index) => {
                  const heading = /^(Article \d+|Annexe \d+|Préambule$|Entre les soussignés$)/.test(block) && !block.includes("\n") && block.length < 120;
                  return heading
                    ? <h3 key={index} className="mt-4 font-black text-blue-950 first:mt-0">{block}</h3>
                    : <p key={index} className="mt-2 whitespace-pre-line">{block}</p>;
                })}
                <p className="mt-4 text-xs text-slate-500">{t(`Version du modèle : ${preview.data?.version ?? ""}. Texte en français, qui seul fait foi.`, `Template version: ${preview.data?.version ?? ""}. French text, which alone is binding.`)}</p>
              </div>
            )
          ) : null}
        </div>
      </section>

      <section id="candidature" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-16" aria-labelledby="apply-title" data-testid="partnership-apply">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 id="apply-title" className="text-2xl font-black text-slate-950">{t("Déposer ma candidature", "Apply")}</h2>
          {done ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950" role="status" data-testid="partnership-success">
              <p className="flex items-center gap-2 font-black"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{done.alreadyReceived ? t("Une candidature est déjà en cours avec cette adresse.", "An application is already in progress with this address.") : t("Candidature reçue.", "Application received.")}</p>
              <p className="mt-2 text-sm leading-6">{t(`Votre référence : ${done.reference}. Nous vous répondons par e-mail après vérification. Si votre candidature est retenue, vous recevrez le protocole d’accord à lire et à signer en ligne, avec vos conditions.`, `Your reference: ${done.reference}. We will reply by email after checking. If your application is accepted you will receive the agreement to read and sign online, with your terms.`)}</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-4 space-y-5" aria-busy={submit.isPending}>
              <fieldset>
                <legend className="text-sm font-bold text-slate-900">{t("Je candidate comme", "I apply as")}</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {PARTNERSHIP_KINDS.map((kind) => (
                    <label key={kind} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold ${form.kind === kind ? "border-blue-700 bg-blue-50 text-blue-950" : "border-slate-300 text-slate-800"}`}>
                      <input type="radio" name="kind" value={kind} checked={form.kind === kind} onChange={() => set("kind", kind)} data-testid={`partnership-kind-${kind}`} />
                      {en ? PARTNERSHIP_KIND_LABELS[kind].en : PARTNERSHIP_KIND_LABELS[kind].fr}
                    </label>
                  ))}
                </div>
              </fieldset>

              {agency ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Label htmlFor="p-company">{t("Nom de l’agence *", "Agency name *")}</Label><Input id="p-company" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} maxLength={PARTNERSHIP_FIELD_LIMITS.company} className="mt-1" autoComplete="organization" data-testid="partnership-company" /></div>
                  <div><Label htmlFor="p-reg">{t("N° d’immatriculation *", "Registration no. *")}</Label><Input id="p-reg" value={form.legalRegistration} onChange={(e) => set("legalRegistration", e.target.value)} maxLength={PARTNERSHIP_FIELD_LIMITS.registration} className="mt-1" data-testid="partnership-registration" /></div>
                  <div><Label htmlFor="p-tax">{t("Identifiant fiscal", "Tax ID")}</Label><Input id="p-tax" value={form.taxId} onChange={(e) => set("taxId", e.target.value)} maxLength={PARTNERSHIP_FIELD_LIMITS.taxId} className="mt-1" /></div>
                  <div><Label htmlFor="p-licence">{t("Licence ou agrément (si applicable)", "Licence or approval (if any)")}</Label><Input id="p-licence" value={form.licenceNumber} onChange={(e) => set("licenceNumber", e.target.value)} maxLength={PARTNERSHIP_FIELD_LIMITS.licence} className="mt-1" /></div>
                  <div><Label htmlFor="p-site">{t("Site web", "Website")}</Label><Input id="p-site" value={form.website} onChange={(e) => set("website", e.target.value)} maxLength={PARTNERSHIP_FIELD_LIMITS.website} className="mt-1" inputMode="url" autoComplete="url" /></div>
                  <div><Label htmlFor="p-role">{t("Votre fonction", "Your role")}</Label><Input id="p-role" value={form.representativeRole} onChange={(e) => set("representativeRole", e.target.value)} maxLength={PARTNERSHIP_FIELD_LIMITS.role} className="mt-1" autoComplete="organization-title" /></div>
                  <div><Label htmlFor="p-years">{t("Années d’activité", "Years in business")}</Label><Input id="p-years" value={form.yearsActive} onChange={(e) => set("yearsActive", e.target.value.replace(/\D/g, "").slice(0, 2))} inputMode="numeric" className="mt-1" /></div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label htmlFor="p-name">{agency ? t("Nom du représentant *", "Representative’s name *") : t("Prénom et nom *", "Full name *")}</Label><Input id="p-name" value={form.contactName} onChange={(e) => set("contactName", e.target.value)} maxLength={PARTNERSHIP_FIELD_LIMITS.name} className="mt-1" autoComplete="name" data-testid="partnership-name" /></div>
                <div><Label htmlFor="p-email">{t("E-mail *", "Email *")}</Label><Input id="p-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={PARTNERSHIP_FIELD_LIMITS.email} className="mt-1" autoComplete="email" data-testid="partnership-email" /></div>
                <div><Label htmlFor="p-phone">{t("Téléphone / WhatsApp *", "Phone / WhatsApp *")}</Label><Input id="p-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={PARTNERSHIP_FIELD_LIMITS.phone} className="mt-1" autoComplete="tel" data-testid="partnership-phone" /></div>
                <div><Label htmlFor="p-country">{t("Pays *", "Country *")}</Label><Input id="p-country" value={form.country} onChange={(e) => set("country", e.target.value)} maxLength={PARTNERSHIP_FIELD_LIMITS.country} className="mt-1" autoComplete="country-name" data-testid="partnership-country" /></div>
                <div><Label htmlFor="p-city">{t("Ville", "City")}</Label><Input id="p-city" value={form.city} onChange={(e) => set("city", e.target.value)} maxLength={PARTNERSHIP_FIELD_LIMITS.city} className="mt-1" autoComplete="address-level2" /></div>
              </div>

              <fieldset>
                <legend className="text-sm font-bold text-slate-900">{t("Comment comptez-vous faire connaître 3M ?", "How will you make 3M known?")}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PARTNERSHIP_CHANNELS.map((channel) => {
                    const active = form.channels.includes(channel);
                    return (
                      <label key={channel} className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${active ? "border-blue-700 bg-blue-50 font-bold text-blue-950" : "border-slate-300 text-slate-700"}`}>
                        <input type="checkbox" checked={active} onChange={() => set("channels", active ? form.channels.filter((item) => item !== channel) : [...form.channels, channel])} />
                        {en ? PARTNERSHIP_CHANNEL_LABELS[channel].en : PARTNERSHIP_CHANNEL_LABELS[channel].fr}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <Label htmlFor="p-volume">{t("Personnes que vous pourriez orienter par mois (estimation)", "People you could refer per month (estimate)")}</Label>
                <select id="p-volume" value={form.volumeBand} onChange={(e) => set("volumeBand", e.target.value)} className={fieldClass}>
                  <option value="">{t("Je ne sais pas encore", "I don’t know yet")}</option>
                  {PARTNERSHIP_VOLUME_BANDS.map((band) => <option key={band} value={band}>{band}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="p-message">{t("Un mot sur votre activité ou votre projet", "A word about your activity or project")}</Label>
                <Textarea id="p-message" value={form.message} onChange={(e) => set("message", e.target.value)} maxLength={PARTNERSHIP_FIELD_LIMITS.message} rows={4} className="mt-1" />
              </div>

              {/* Champ piège : invisible pour une personne, rempli par un robot. */}
              <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                <label>Ne pas remplir<input tabIndex={-1} autoComplete="off" value={form.hp} onChange={(e) => set("hp", e.target.value)} /></label>
              </div>

              <PrivacyNotice notice="partnership_application" />
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
                {!agency ? (
                  <label className="flex gap-3"><input type="checkbox" checked={form.isAdult} onChange={(e) => set("isAdult", e.target.checked)} className="mt-1" data-testid="partnership-adult" /><span>{t("Je suis majeur(e) et j’agis à titre indépendant.", "I am an adult and act independently.")}</span></label>
                ) : null}
                <label className="flex gap-3"><input type="checkbox" checked={form.consentPrivacy} onChange={(e) => set("consentPrivacy", e.target.checked)} className="mt-1" data-testid="partnership-consent" /><span>{t("J’accepte que 3M TRAVEL AGENCY traite ces informations pour examiner ma candidature.", "I agree that 3M TRAVEL AGENCY processes this information to review my application.")}</span></label>
                <label className="flex gap-3"><input type="checkbox" checked={form.codeOfConduct} onChange={(e) => set("codeOfConduct", e.target.checked)} className="mt-1" data-testid="partnership-conduct" /><span>{t("Je m’engage à ne promettre aucun résultat (visa, emploi, décision), à n’encaisser aucune somme au nom de 3M et à ne pas me présenter comme « partenaire officiel » sans son accord écrit.", "I will not promise any outcome (visa, job, decision), will not collect any money in 3M’s name and will not present myself as an “official partner” without its written consent.")}</span></label>
              </div>

              {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900" role="alert" data-testid="partnership-error">{error}</p> : null}
              {submit.isPending ? (
                <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-950" role="status" aria-live="polite" data-testid="partnership-loading">
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-700" aria-hidden="true" />
                  <span>{t("Votre candidature est en cours d’envoi… Ne fermez pas cette page.", "Your application is being sent… Please keep this page open.")}</span>
                </div>
              ) : null}
              <Button type="submit" disabled={submit.isPending} className="min-h-12 w-full text-base font-black" data-testid="partnership-submit">
                {submit.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />{t("Envoi…", "Sending…")}</> : t("Envoyer ma candidature", "Send my application")}
              </Button>
              <p className="text-xs leading-5 text-slate-500">{t("Une candidature ne vaut ni accord ni autorisation de se présenter comme partenaire de 3M : seul le protocole signé par les deux parties produit des effets.", "An application is neither an agreement nor a permission to present yourself as a 3M partner: only the agreement signed by both parties takes effect.")}</p>
            </form>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-2xl font-black text-slate-950">{t("Questions fréquentes", "Frequently asked questions")}</h2>
        <div className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {faq.map(([question, answer]) => (
            <details key={question} className="group p-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-bold text-slate-900">{question}<span className="text-blue-700 transition group-open:rotate-45" aria-hidden="true">+</span></summary>
              <p className="mt-2 text-sm leading-6 text-slate-700">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
