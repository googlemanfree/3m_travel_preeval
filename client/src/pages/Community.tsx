import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Globe2,
  GraduationCap,
  Headphones,
  Megaphone,
  MessageCircle,
  MonitorCog,
  Network,
  Send,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { COMPANY_CONTACTS, digitalWhatsAppUrl } from "@/lib/companyContacts";
import { toast } from "sonner";

const expertise = [
  {
    id: "01",
    icon: Code2,
    title: "Sites web & plateformes",
    description: "Des expériences digitales fiables pour informer, rassurer et accompagner vos visiteurs.",
    points: ["Site vitrine responsive", "Portail client & espace de suivi", "Plateforme de réservation sur mesure", "Nom de domaine, e-mails et maintenance"],
  },
  {
    id: "02",
    icon: Megaphone,
    title: "Croissance digitale",
    description: "Une présence éditoriale cohérente pour mieux présenter vos services et échanger avec votre audience.",
    points: ["Stratégie et calendrier de contenu", "Visuels, vidéos courtes et réseaux sociaux", "Référencement et acquisition digitale", "Lecture régulière des performances"],
  },
  {
    id: "03",
    icon: MonitorCog,
    title: "Infrastructure & support IT",
    description: "Un environnement de travail connecté, maintenu et mieux protégé au quotidien.",
    points: ["Maintenance et assistance utilisateurs", "Réseaux, Wi-Fi et télécoms", "Cybersécurité et sauvegarde", "Audit digital et accompagnement"],
  },
  {
    id: "04",
    icon: GraduationCap,
    title: "Formation professionnelle",
    description: "Des sessions pratiques autour du digital, de la mobilité et des opérations de voyage.",
    points: ["Marketing digital et création de contenu", "Mobilité internationale et orientation", "Galileo Smartpoint et billetterie", "Relation client et gestion des dossiers"],
  },
];

const method = [
  ["01", "Comprendre", "Nous clarifions votre activité, votre besoin et vos priorités."],
  ["02", "Concevoir", "Nous structurons une solution utile, lisible et adaptée à votre réalité."],
  ["03", "Déployer", "Nous mettons en service les outils, contenus ou formations nécessaires."],
  ["04", "Accompagner", "Nous restons disponibles pour le suivi, l’optimisation et le support."],
];

const serviceLabels = {
  web_platform: "Site web & plateforme",
  digital_growth: "Croissance digitale",
  it_support: "Infrastructure & support IT",
  professional_training: "Formation professionnelle",
} as const;

type PricingPlan = { title: string; subtitle: string; launchRange: string; annualRange: string; delivery: string; points: string[] };

const fallbackPricingPlans: PricingPlan[] = [
  { title: "Présence digitale", subtitle: "Pour cadrer une vitrine, une landing page ou une refonte légère.", launchRange: "150 000–450 000 FCFA", annualRange: "À confirmer", delivery: "2–4 semaines", points: ["Structure et contenus de base", "Design responsive", "Mise en ligne et prise en main"] },
  { title: "Plateforme métier", subtitle: "Pour un espace client, un workflow interne ou une plateforme connectée.", launchRange: "À partir de 650 000 FCFA", annualRange: "À confirmer", delivery: "6–12 semaines", points: ["Cadrage fonctionnel", "Développement et tests", "Accompagnement au lancement"] },
];

const deliveryExamples = [
  ["Portail client", "Espace sécurisé pour déposer des documents, suivre un dossier et recevoir des notifications."],
  ["Site vitrine", "Page de présentation responsive avec parcours de contact, contenus structurés et appels à l’action."],
  ["Tableau de pilotage", "Interface interne pour centraliser des demandes, statuts, documents et historiques."],
  ["Kit de croissance", "Calendrier éditorial, contenus sociaux et repères SEO adaptés à une activité locale."],
];

export default function Community() {
  const [form, setForm] = useState({ service: "web_platform" as keyof typeof serviceLabels, fullName: "", email: "", phone: "", organization: "", message: "" });
  const { data: content } = trpc.digitalServices.getContent.useQuery();
  const publishedExpertise = useMemo(() => {
    try {
      const definitions = JSON.parse(content?.serviceDefinitionsJson || "[]") as Array<{ title?: string; description?: string; points?: string[] }>;
      if (definitions.length !== expertise.length) return expertise;
      return expertise.map((item, index) => ({ ...item, title: definitions[index]?.title || item.title, description: definitions[index]?.description || item.description, points: definitions[index]?.points || item.points }));
    } catch { return expertise; }
  }, [content?.serviceDefinitionsJson]);
  const pricingPlans = useMemo(() => {
    try {
      const parsed = JSON.parse(content?.pricingJson || "[]") as PricingPlan[];
      const validPlans = Array.isArray(parsed) ? parsed.filter((plan) => plan?.title && plan?.launchRange && Array.isArray(plan?.points)) : [];
      return validPlans.length ? validPlans : fallbackPricingPlans;
    } catch { return fallbackPricingPlans; }
  }, [content?.pricingJson]);
  const submitRequest = trpc.digitalServices.createRequest.useMutation({
    onSuccess: ({ reference }) => {
      toast.success(`Votre demande ${reference} a été transmise à l’équipe 3M Digital.`);
      setForm({ service: "web_platform", fullName: "", email: "", phone: "", organization: "", message: "" });
    },
    onError: (error) => toast.error(error.message || "La demande n’a pas pu être transmise."),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitRequest.mutate({ ...form, organization: form.organization || undefined });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main>
        <section className="relative overflow-hidden bg-[#0b1f5e] px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_15%_20%,rgba(37,99,235,.9),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(56,189,248,.55),transparent_28%),linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:auto,auto,42px_42px,42px_42px]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-blue-100">
                <UsersRound className="h-4 w-4" /> Service 3M Digital
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                {content?.heroTitle || "Le digital qui fait avancer vos projets."}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">
                {content?.heroDescription || "3M Digital est le pôle de services numériques de 3M Travel & Services : plateformes web, croissance digitale, support IT et formation professionnelle pour les particuliers, agences et entreprises."}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#demande">
                  <Button className="h-12 w-full rounded-xl bg-white px-6 font-bold text-blue-900 hover:bg-blue-50 sm:w-auto">
                    <Send className="mr-2 h-5 w-5" /> Faire une demande
                  </Button>
                </a>
                <a href="#expertises" className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-6 font-bold text-white hover:bg-white/10">
                  Voir nos expertises <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [Globe2, "Web & plateformes", "Des outils qui donnent une présence claire à votre activité."],
                [GraduationCap, "Formation", "Des compétences pratiques pour gagner en autonomie."],
                [Network, "Solutions connectées", "Des services digitaux pensés pour vos opérations."],
                [ShieldCheck, "Support IT", "Des environnements de travail plus fiables et sécurisés."],
              ].map(([Icon, title, text]) => {
                const CardIcon = Icon as typeof Globe2;
                return <div key={title as string} className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <CardIcon className="h-6 w-6 text-sky-300" />
                  <p className="mt-4 font-bold text-white">{title as string}</p>
                  <p className="mt-2 text-sm leading-6 text-blue-100">{text as string}</p>
                </div>;
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3">
            {[
              [UsersRound, "Un interlocuteur", "Une équipe 3M qui qualifie votre besoin."],
              [BookOpen, "Une offre structurée", "Des services numériques et formations accessibles."],
              [Headphones, "Un suivi humain", "WhatsApp, e-mail ou agence selon votre préférence."],
            ].map(([Icon, title, text]) => {
              const ItemIcon = Icon as typeof UsersRound;
              return <div key={title as string} className="flex items-center gap-3 border-slate-200 sm:border-r sm:pr-4 last:border-0">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-700"><ItemIcon className="h-5 w-5" /></div>
                <div><p className="font-bold text-slate-900">{title as string}</p><p className="text-sm text-slate-600">{text as string}</p></div>
              </div>;
            })}
          </div>
        </section>

        <section id="expertises" className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[.14em] text-blue-700">Nos expertises</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Un même écosystème pour vos projets.</h2>
            <p className="mt-4 leading-7 text-slate-600">{content?.serviceIntro || "Le pôle 3M Digital met en relation les compétences nécessaires pour rendre vos activités plus visibles, mieux organisées et plus simples à développer."}</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {publishedExpertise.map((item) => {
              const Icon = item.icon;
              return <article key={item.id} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-start justify-between gap-4"><div className="rounded-xl bg-blue-50 p-3 text-blue-700"><Icon className="h-6 w-6" /></div><span className="font-mono text-sm font-bold text-slate-400">{item.id}</span></div>
                <h3 className="mt-5 text-xl font-black text-slate-950">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{item.description}</p>
                <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
                  {item.points.map((point) => <li key={point} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{point}</li>)}
                </ul>
              </article>;
            })}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-4 py-18 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><p className="text-sm font-black uppercase tracking-[.14em] text-blue-700">Exemples de livrables</p><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Des formats concrets, adaptés à votre besoin.</h2><p className="mt-4 leading-7 text-slate-600">Ces exemples décrivent des formats de réalisation possibles. Ils ne constituent pas une liste de références clients ni une promesse de résultat ; le périmètre, le tarif et le délai sont confirmés après cadrage.</p></div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">{deliveryExamples.map(([title, text]) => <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6"><h3 className="text-xl font-black text-slate-950">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article>)}</div>
          </div>
        </section>

        <section className="bg-blue-50 px-4 py-18 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex max-w-3xl flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-black uppercase tracking-[.14em] text-blue-700">Notre méthode</p><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Une feuille de route claire, du besoin au suivi.</h2></div><Link href="/contact" className="font-bold text-blue-700 hover:text-blue-900">Nous contacter <ArrowRight className="inline h-4 w-4" /></Link></div>
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {method.map(([number, title, text]) => <div key={number} className="rounded-2xl border border-blue-100 bg-white p-5"><span className="font-mono text-sm font-black text-blue-600">{number}</span><h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>)}
            </div>
          </div>
        </section>

        {pricingPlans.length > 0 && <section id="tarifs" className="border-y border-slate-200 bg-white px-4 py-18 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl"><p className="text-sm font-black uppercase tracking-[.14em] text-blue-700">Repères de cadrage</p><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Comprendre l’ampleur d’un projet digital.</h2><p className="mt-4 leading-7 text-slate-600">Les fourchettes ci-dessous servent à cadrer un projet selon son niveau d’ambition. Elles doivent être confirmées par une analyse de besoin et un devis 3M Digital ; elles ne constituent ni une offre ferme ni un paiement automatique.</p></div>
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>À distinguer :</strong> les frais de lancement couvrent le cadrage, le design, les contenus, le développement et les tests. Les charges annuelles couvrent ensuite l’hébergement, la maintenance, la sécurité, les outils et le support. Les API, commissions, taxes et fournisseurs externes sont évalués séparément lorsque nécessaires.</div>
            <div className="mt-8 grid gap-5 lg:grid-cols-2">{pricingPlans.map((plan) => <article key={plan.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"><p className="text-sm font-black uppercase tracking-[.12em] text-blue-700">Niveau de service</p><h3 className="mt-3 text-2xl font-black text-slate-950">{plan.title}</h3><p className="mt-3 min-h-14 leading-7 text-slate-600">{plan.subtitle}</p><div className="mt-6 grid gap-3 border-y border-slate-200 py-5 sm:grid-cols-3"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Lancement</p><p className="mt-1 font-black text-slate-950">{plan.launchRange}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Charges annuelles</p><p className="mt-1 font-bold text-slate-800">{plan.annualRange}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Délai indicatif</p><p className="mt-1 font-bold text-slate-800">{plan.delivery}</p></div></div><ul className="mt-5 space-y-2.5 text-sm leading-6 text-slate-700">{plan.points.map((point) => <li key={point} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{point}</li>)}</ul><a href="#demande" className="mt-6 inline-flex items-center font-bold text-blue-700 hover:text-blue-900">Demander un cadrage personnalisé <ArrowRight className="ml-2 h-4 w-4" /></a></article>)}</div>
          </div>
        </section>}

        <section id="demande" className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-800 to-sky-700 text-white lg:grid-cols-[.9fr_1.1fr]">
            <div className="p-8 sm:p-12"><p className="text-sm font-black uppercase tracking-[.14em] text-sky-200">Demande 3M Digital</p><h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Décrivez votre besoin, l’équipe vous répond.</h2><p className="mt-4 leading-7 text-blue-100">{content?.requestIntro || "Chaque demande reçoit une référence, entre dans la file de traitement du back-office et peut être suivie par nos conseillers avant toute proposition."}</p><div className="mt-9 space-y-4 border-t border-white/15 pt-6 text-sm text-blue-100"><p><strong className="text-white">Bureau principal :</strong><br />{COMPANY_CONTACTS.yaounde.address}</p><p><strong className="text-white">Contacts :</strong><br />{COMPANY_CONTACTS.yaounde.whatsappNumber} · {COMPANY_CONTACTS.yaounde.email}</p><a href={digitalWhatsAppUrl("Bonjour 3M Travel & Services, je souhaite échanger sur un projet digital, une formation ou un besoin de mobilité.")} target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-bold text-white hover:text-sky-200"><MessageCircle className="mr-2 h-4 w-4" /> Discuter sur WhatsApp Yaoundé</a></div></div>
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 text-slate-900 sm:p-10" aria-label="Demande de service 3M Digital">
              <div><p className="text-xl font-black">Envoyer une demande</p><p className="mt-1 text-sm text-slate-600">Les champs marqués sont nécessaires au traitement.</p></div>
              <div><label className="mb-1.5 block text-sm font-bold" htmlFor="digital-service">Service souhaité</label><Select value={form.service} onValueChange={(value) => setForm(current => ({ ...current, service: value as keyof typeof serviceLabels }))}><SelectTrigger id="digital-service"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(serviceLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-sm font-bold" htmlFor="digital-name">Nom complet</label><Input id="digital-name" value={form.fullName} onChange={(event) => setForm(current => ({ ...current, fullName: event.target.value }))} required /></div><div><label className="mb-1.5 block text-sm font-bold" htmlFor="digital-phone">Téléphone</label><Input id="digital-phone" value={form.phone} onChange={(event) => setForm(current => ({ ...current, phone: event.target.value }))} required /></div></div>
              <div><label className="mb-1.5 block text-sm font-bold" htmlFor="digital-email">E-mail</label><Input id="digital-email" type="email" value={form.email} onChange={(event) => setForm(current => ({ ...current, email: event.target.value }))} required /></div>
              <div><label className="mb-1.5 block text-sm font-bold" htmlFor="digital-organization">Organisation <span className="font-normal text-slate-500">(facultatif)</span></label><Input id="digital-organization" value={form.organization} onChange={(event) => setForm(current => ({ ...current, organization: event.target.value }))} /></div>
              <div><label className="mb-1.5 block text-sm font-bold" htmlFor="digital-message">Votre besoin</label><Textarea id="digital-message" value={form.message} onChange={(event) => setForm(current => ({ ...current, message: event.target.value }))} rows={5} placeholder="Expliquez brièvement votre projet, vos priorités et l’échéance souhaitée." required /></div>
              <Button type="submit" disabled={submitRequest.isPending} className="h-12 w-full rounded-xl bg-blue-700 font-black hover:bg-blue-800">{submitRequest.isPending ? "Transmission…" : "Transmettre ma demande"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
              <p className="text-center text-xs leading-5 text-slate-500">Votre demande est traitée par l’équipe 3M Digital. Aucun engagement commercial automatique n’est créé.</p>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
