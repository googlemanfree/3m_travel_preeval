import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Globe2,
  MapPinned,
  MessageCircle,
  PhoneCall,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const journeyStages = [
  {
    number: "01",
    label: "Entrée",
    title: "Facebook ou WhatsApp",
    description: "Le lien de votre campagne conserve le contexte de votre demande.",
    icon: MessageCircle,
    accent: "from-blue-600 to-cyan-500",
  },
  {
    number: "02",
    label: "Profil",
    title: "Évaluation mondiale",
    description: "Votre parcours est étudié pour plusieurs destinations possibles.",
    icon: ClipboardCheck,
    accent: "from-indigo-600 to-violet-500",
  },
  {
    number: "03",
    label: "Orientation",
    title: "Rapport & choix",
    description: "Vous recevez une orientation expliquée et choisissez la suite.",
    icon: Globe2,
    accent: "from-violet-600 to-fuchsia-500",
  },
  {
    number: "04",
    label: "Dossier",
    title: "Pièces sécurisées",
    description: "Vos documents sont centralisés et contrôlés avec vous.",
    icon: FileCheck2,
    accent: "from-cyan-600 to-teal-500",
  },
  {
    number: "05",
    label: "Suivi",
    title: "Avancement partagé",
    description: "Vous et l’équipe voyez la prochaine action à réaliser.",
    icon: Route,
    accent: "from-emerald-600 to-green-500",
  },
] as const;

const destinationFamilies = [
  "Canada",
  "Europe & Schengen",
  "Luxembourg",
  "Amériques",
  "Asie",
  "Golfe & Moyen-Orient",
  "Afrique",
  "Océanie",
];

const trackingRows = [
  { label: "Évaluation reçue", detail: "Votre profil est enregistré", done: true },
  { label: "Analyse en cours", detail: "Comparaison des possibilités", done: true },
  { label: "Destination validée", detail: "Décision partagée avec vous", done: false },
  { label: "Dossier documentaire", detail: "Pièces contrôlées et complétées", done: false },
  { label: "Transmission partenaire", detail: "Suivi après votre accord", done: false },
];

function getSourceContext() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get("source")?.toLowerCase();
  const campaign = params.get("campaign") || params.get("campagne");

  if (source === "whatsapp" || source === "wa") {
    return {
      key: "whatsapp",
      label: "WhatsApp Business",
      helper: "Votre conversation WhatsApp peut être poursuivie ici sans perdre le contexte.",
    };
  }

  if (source === "facebook" || source === "fb") {
    return {
      key: "facebook",
      label: "Facebook",
      helper: campaign
        ? `Campagne « ${campaign} » — votre demande est orientée vers le bon parcours.`
        : "Votre publication Facebook vous a dirigé vers le parcours d’évaluation.",
    };
  }

  return {
    key: "direct",
    label: "Prime Travel Service",
    helper: "Vous pouvez commencer une évaluation mondiale ou parler à un conseiller.",
  };
}

export default function PrimeJourney() {
  const source = useMemo(getSourceContext, []);
  const [activeStage, setActiveStage] = useState(0);
  const currentStage = journeyStages[activeStage];
  const CurrentIcon = currentStage.icon;
  const progress = ((activeStage + 1) / journeyStages.length) * 100;

  const evaluationHref = `/evaluation?source=${encodeURIComponent(source.key)}`;

  return (
    <div className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <main>
        <section className="relative overflow-hidden border-b border-blue-100 bg-[radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.28),transparent_32%),linear-gradient(135deg,#071d49_0%,#0b2f70_52%,#0e7490_100%)] text-white">
          <div className="absolute -right-24 top-16 h-80 w-80 rounded-full border border-white/10" aria-hidden="true" />
          <div className="absolute -right-8 top-28 h-64 w-64 rounded-full border border-white/10" aria-hidden="true" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-cyan-300/10 blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
            <div className="flex flex-col justify-center">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <Badge className="border border-cyan-200/30 bg-white/10 px-3 py-1.5 text-cyan-100 hover:bg-white/10">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Parcours mondial Prime Travel
                </Badge>
                <span className="inline-flex items-center gap-1.5 text-sm text-blue-100">
                  <MapPinned className="h-4 w-4" aria-hidden="true" />
                  Destinations du monde entier
                </span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
              >
                De votre premier message à une <span className="text-cyan-300">opportunité mondiale.</span>
              </motion.h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
                Prime Travel Service structure votre demande, étudie votre profil et vous accompagne vers la destination qui correspond le mieux à votre projet, selon les opportunités disponibles.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={evaluationHref} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-blue-900 shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">
                  Commencer mon évaluation
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </a>
                <a href="https://wa.me/237620996045?text=Bonjour%20Prime%20Travel%20Service%2C%20je%20souhaite%20%C3%AAtre%20orient%C3%A9" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">
                  <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                  Parler sur WhatsApp
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-blue-100">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" aria-hidden="true" /> Données protégées</span>
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-cyan-300" aria-hidden="true" /> Réponse annoncée clairement</span>
                <span className="inline-flex items-center gap-2"><Globe2 className="h-4 w-4 text-cyan-300" aria-hidden="true" /> Orientation internationale</span>
              </div>
            </div>

            <Card className="relative overflow-hidden border-white/20 !bg-slate-950/35 p-5 text-white shadow-2xl shadow-blue-950/20 backdrop-blur-xl sm:p-7">
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-300/20 blur-3xl" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">Votre point d’entrée</p>
                    <h2 className="mt-2 text-2xl font-black">{source.label}</h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                    {source.key === "whatsapp" ? <MessageCircle className="h-5 w-5" aria-hidden="true" /> : source.key === "facebook" ? <Send className="h-5 w-5" aria-hidden="true" /> : <CircleUserRound className="h-5 w-5" aria-hidden="true" />}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-blue-100">{source.helper}</p>
                <div className="mt-7 rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-100">
                    <span>Progression du parcours</span>
                    <span>{activeStage + 1}/{journeyStages.length}</span>
                  </div>
                  <Progress value={progress} className="mt-3 h-2 bg-white/15 [&>div]:bg-cyan-300" />
                  <div className="mt-4 flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${currentStage.accent}`}>
                      <CurrentIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-cyan-200">Étape {currentStage.number} · {currentStage.label}</p>
                      <p className="mt-0.5 text-sm font-bold text-white">{currentStage.title}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-5 text-xs leading-5 text-blue-100">Aucune destination n’est imposée avant l’analyse de votre profil et votre accord.</p>
              </div>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">Un parcours lisible</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Chaque étape a un objectif précis.</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Vous savez où vous en êtes, ce que Prime Travel Service attend de vous et quelle action vient ensuite. Sélectionnez une étape pour voir son écran principal.</p>

              <div className="mt-8 space-y-2" role="tablist" aria-label="Étapes du parcours utilisateur">
                {journeyStages.map((stage, index) => {
                  const Icon = stage.icon;
                  const isActive = activeStage === index;
                  return (
                    <button
                      type="button"
                      key={stage.number}
                      id={`journey-tab-${index}`}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`journey-panel-${index}`}
                      onClick={() => setActiveStage(index)}
                      className={`group flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${isActive ? "border-blue-200 bg-white shadow-lg shadow-blue-900/5" : "border-transparent bg-transparent hover:border-blue-100 hover:bg-white/70"}`}
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${isActive ? stage.accent : "from-slate-200 to-slate-100"} text-sm font-black ${isActive ? "text-white" : "text-slate-500"}`}>
                        {isActive ? <Icon className="h-5 w-5" aria-hidden="true" /> : stage.number}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-xs font-black uppercase tracking-wider ${isActive ? "text-blue-700" : "text-slate-400"}`}>{stage.label}</span>
                        <span className="mt-0.5 block truncate text-sm font-bold text-slate-900">{stage.title}</span>
                      </span>
                      <ChevronRight className={`h-4 w-4 shrink-0 transition ${isActive ? "translate-x-0 text-blue-600" : "-translate-x-1 text-slate-300 group-hover:translate-x-0 group-hover:text-blue-400"}`} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>

            <motion.div key={activeStage} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
              <Card id={`journey-panel-${activeStage}`} role="tabpanel" aria-labelledby={`journey-tab-${activeStage}`} className="overflow-hidden border-blue-100 bg-white shadow-xl shadow-blue-950/5">
                <div className={`bg-gradient-to-r ${currentStage.accent} p-6 text-white sm:p-8`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><CurrentIcon className="h-6 w-6" aria-hidden="true" /></div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">Écran {currentStage.number}</p>
                        <h3 className="mt-1 text-2xl font-black">{currentStage.title}</h3>
                      </div>
                    </div>
                    <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">Étape {activeStage + 1} sur {journeyStages.length}</span>
                  </div>
                  <p className="mt-5 max-w-2xl text-sm leading-6 text-white/85">{currentStage.description}</p>
                </div>

                <div className="p-6 sm:p-8">
                  {activeStage === 0 && (
                    <div className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-3">
                        {[
                          ["01", "Le contexte", "Votre campagne ou votre conversation est identifiée."],
                          ["02", "Le besoin", "Vous précisez votre projet de mobilité."],
                          ["03", "Le prochain pas", "Vous êtes dirigé vers l’évaluation adaptée."],
                        ].map(([number, title, description]) => (
                          <div key={number} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <span className="text-xs font-black text-blue-600">{number}</span>
                            <h4 className="mt-3 text-sm font-black text-slate-900">{title}</h4>
                            <p className="mt-2 text-sm leading-5 text-slate-600">{description}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:flex-row sm:items-center">
                        <div><p className="font-bold text-blue-950">Vous venez de WhatsApp ou Facebook ?</p><p className="mt-1 text-sm text-blue-800">Commencez avec le même lien : votre conseiller pourra retrouver le contexte.</p></div>
                        <a href={evaluationHref} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Accéder à l’évaluation <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></a>
                      </div>
                    </div>
                  )}

                  {activeStage === 1 && (
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5"><p className="font-black text-indigo-950">Un seul profil, plusieurs possibilités.</p><p className="mt-2 text-sm leading-6 text-indigo-900">Le formulaire recueille les informations qui permettent de comparer votre parcours avec des procédures de travail, d’études, de mobilité, de visite ou de recrutement selon le pays.</p></div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {["Identité & situation", "Formation & compétences", "Expérience & langues", "Projet & destination"].map((label, index) => <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-100 p-4"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">0{index + 1}</span><span className="text-sm font-bold text-slate-800">{label}</span></div>)}
                      </div>
                      <a href={evaluationHref} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Remplir mon profil mondial <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></a>
                    </div>
                  )}

                  {activeStage === 2 && (
                    <div className="space-y-6">
                      <div className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 p-5"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" aria-hidden="true" /><div><p className="font-black text-violet-950">Une orientation expliquée, jamais une promesse automatique.</p><p className="mt-2 text-sm leading-6 text-violet-900">Le rapport présente les compatibilités, les points à confirmer et les documents à préparer. Vous validez ensuite la destination qui correspond à votre projet.</p></div></div>
                      <div><p className="text-sm font-black text-slate-900">Familles de destinations couvertes</p><div className="mt-3 flex flex-wrap gap-2">{destinationFamilies.map((destination) => <span key={destination} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">{destination}</span>)}</div></div>
                      <a href="/mon-espace" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-bold text-violet-800 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Voir mon espace après réception du rapport <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></a>
                    </div>
                  )}

                  {activeStage === 3 && (
                    <div className="space-y-6">
                      <div className="grid gap-4 sm:grid-cols-3">
                        {[["Déposer", "Ajoutez une pièce depuis votre téléphone ou ordinateur."], ["Contrôler", "L’équipe vérifie la lisibilité et le type du document."], ["Corriger", "Vous recevez une demande précise si une pièce doit être remplacée."]].map(([title, description]) => <div key={title} className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4"><FileCheck2 className="h-5 w-5 text-teal-700" aria-hidden="true" /><h4 className="mt-3 text-sm font-black text-teal-950">{title}</h4><p className="mt-2 text-sm leading-5 text-teal-900">{description}</p></div>)}
                      </div>
                      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center"><div><p className="font-black text-slate-900">Le centre documentaire est synchronisé.</p><p className="mt-1 text-sm text-slate-600">Les documents ajoutés par vous ou par l’agence apparaissent dans le même dossier.</p></div><a href="/submit-documents" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">Ouvrir le dépôt sécurisé <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></a></div>
                    </div>
                  )}

                  {activeStage === 4 && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5"><p className="font-black text-emerald-950">Une timeline commune pour vous et l’équipe.</p><p className="mt-2 text-sm leading-6 text-emerald-900">Chaque changement de statut est daté et visible dans votre espace, avec la prochaine action attendue.</p></div>
                      <div className="space-y-1">{trackingRows.map((row, index) => <div key={row.label} className="flex gap-3"><div className="flex flex-col items-center"><div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${row.done ? "bg-emerald-600 text-white" : "border-2 border-slate-200 bg-white text-slate-400"}`}>{row.done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <span className="text-xs font-black">{index + 1}</span>}</div>{index < trackingRows.length - 1 && <div className={`my-1 min-h-8 w-px ${row.done ? "bg-emerald-200" : "bg-slate-200"}`} />}</div><div className="pb-4"><p className={`text-sm font-black ${row.done ? "text-emerald-800" : "text-slate-700"}`}>{row.label}</p><p className="mt-1 text-sm text-slate-500">{row.detail}</p></div></div>)}</div>
                      <a href="/mon-espace" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Accéder à mon suivi de dossier <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></a>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div><p className="text-sm font-black text-slate-900">Besoin d’une réponse humaine ?</p><p className="mt-1 text-sm text-slate-600">Un conseiller peut reprendre votre contexte et vous guider vers la bonne étape.</p></div>
            <div className="flex flex-col gap-3 sm:flex-row"><a href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><PhoneCall className="mr-2 h-4 w-4" aria-hidden="true" /> Contacter l’agence</a><a href={evaluationHref} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Démarrer maintenant <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></a></div>
          </div>
        </section>
      </main>
    </div>
  );
}

