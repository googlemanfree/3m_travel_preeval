import React, { Suspense } from "react";
import { Link } from "wouter";
import { ExternalLink, ShieldCheck, Languages, GraduationCap, BriefcaseBusiness, Users, Repeat, Building2, Compass, TrendingUp, Sparkles, UsersRound } from "lucide-react";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import { SimulatorRetryBoundary } from "@/components/SimulatorRetryBoundary";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const CanadaScoreSimulator = React.lazy(() => import("@/components/CanadaScoreSimulator"));

const IRCC_CALCULATOR_URL = "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/verifier-note.html#calculatrice";
const IRCC_CRS_CRITERIA_URL = "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/comment-systeme-classement-fonctionne.html";

const crsFactors = [
  { icon: Users, title: "Facteurs liés au capital humain", text: "Âge, niveau d’études, compétences linguistiques (première et, le cas échéant, seconde langue officielle) et expérience de travail qualifiée, avec ou sans époux(se)/conjoint(e) de fait inclus dans la demande." },
  { icon: Languages, title: "Compétences linguistiques, par compétence", text: "Un test de langue reconnu (IELTS, CELPIP, TEF, TCF…) note séparément la compréhension écrite, l’expression écrite, la compréhension orale et l’expression orale. C’est souvent le facteur le plus rapide à améliorer." },
  { icon: GraduationCap, title: "Études et équivalences", text: "Le niveau de diplôme compte, ainsi qu’une évaluation comparative des études (ECA) lorsque le diplôme a été obtenu hors du Canada." },
  { icon: BriefcaseBusiness, title: "Expérience de travail qualifiée", text: "L’expérience canadienne et l’expérience étrangère qualifiée (NOC TEER 0, 1, 2 ou 3) sont valorisées différemment selon leur durée et leur localisation." },
  { icon: Repeat, title: "Transférabilité des compétences", text: "La combinaison de plusieurs facteurs (ex. langue + études, ou langue + expérience canadienne) peut apporter des points supplémentaires, plafonnés par catégorie." },
  { icon: Building2, title: "Points supplémentaires", text: "Une nomination provinciale (PNP), des études au Canada ou un frère/une sœur citoyen(ne) ou résident(e) permanent(e) peuvent ajouter des points. Les points liés à une offre d’emploi ne sont plus accordés depuis le 25 mars 2025." },
];

const crsFaq = [
  { question: "Le score calculé ici est-il exactement celui d’IRCC ?", answer: "Cette calculatrice donne une estimation indicative basée sur le barème public du Système de classement global (SCG/CRS). Le calcul officiel dépend de justificatifs précis (résultats de test, diplômes, preuves d’expérience) qu’IRCC seul peut valider au moment du dépôt du profil." },
  { question: "Pourquoi dois-je renseigner chaque compétence linguistique séparément ?", answer: "IRCC note la compréhension écrite, l’expression écrite, la compréhension orale et l’expression orale indépendamment, puis combine les quatre résultats. Un score global ne reflète pas toujours cette répartition : c’est pourquoi la calculatrice reprend le même détail que l’outil officiel." },
  { question: "Mon score est sous le seuil d’une ronde récente, dois-je abandonner mon projet ?", answer: "Non. Les seuils varient à chaque ronde selon la taille du bassin de candidats et le programme ciblé (Entrée express général, Candidats des provinces, Catégorie de l’expérience canadienne, tirages catégoriels). Améliorer un résultat de langue, obtenir une évaluation comparative des études, cumuler de l’expérience qualifiée ou explorer une nomination provinciale peut faire évoluer votre classement." },
  { question: "Puis-je garder une trace de ma simulation ?", answer: "Oui : la calculatrice sauvegarde votre brouillon sur cet appareil, propose un lien partageable, un partage WhatsApp/Facebook et un récapitulatif par e-mail. Le téléchargement du rapport PDF complet est réservé aux candidats ayant créé un compte 3M TRAVEL AGENCY, pour assurer le suivi de votre dossier." },
];

export default function CanadaCrsPage() {
  return (
    <ServicePageShell
      eyebrow="Canada · Entrée express · SCG / CRS"
      title="Calculatrice CRS Canada — parcours dédié"
      introduction="Cette page est réservée au Canada et au Système de classement global d’Entrée express. Saisissez vos réponses comme dans la calculatrice officielle d’IRCC pour obtenir un résultat indicatif, détaillé et cohérent."
      primaryHref="#calculatrice-crs"
      primaryLabel="Commencer la calculatrice CRS"
      officialHref={IRCC_CALCULATOR_URL}
      officialLabel="Ouvrir la calculatrice IRCC"
      notice="Résultat indicatif uniquement : le système Entrée express et les instructions officielles d’IRCC ont toujours préséance. Les points d’offre d’emploi ne sont plus accordés au SCG depuis le 25 mars 2025."
    >
      <section className="relative isolate overflow-hidden bg-[#071d39] px-4 py-14 text-white sm:px-6 lg:px-8">
        <img src="/manus-storage/canada-hero-original_5fe49ae0.jpg" alt="Ville canadienne au bord de l’eau" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#061a36] via-[#0a3264]/90 to-[#0a3264]/55" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Canada à part</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">Un résultat CRS lisible, avec les quatre compétences linguistiques.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-50 sm:text-base">Âge, études, langue officielle première et seconde, expérience canadienne, conjoint, transférabilité et points additionnels sont regroupés dans un rapport clair. Le calcul ne mélange pas les barèmes des autres pays.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm"><ShieldCheck className="h-8 w-8 text-amber-300" /><p className="mt-3 text-sm font-bold">Référence officielle</p><p className="mt-2 text-xs leading-5 text-blue-100">La calculatrice 3M TRAVEL AGENCY sert à préparer une discussion et ne remplace pas le résultat généré par le profil Entrée express.</p><a href={IRCC_CALCULATOR_URL} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-200 underline underline-offset-4"><ExternalLink className="h-4 w-4" /> Voir la source IRCC</a></div>
        </div>
      </section>

      <div id="calculatrice-crs" className="scroll-mt-24">
        <ServiceSection tone="blue" title="Calculatrice CRS Canada" introduction="Choisissez le parcours Canada dans le formulaire, puis renseignez chaque compétence linguistique séparément. Le résultat et le PDF détaillent les points obtenus et les leviers d’amélioration.">
          <SimulatorRetryBoundary label="La calculatrice CRS Canada" onRetry={() => window.location.reload()} onFailure={() => undefined}>
            <Suspense fallback={<div className="rounded-2xl border border-blue-200 bg-white p-6 text-sm font-semibold text-blue-900" role="status">Chargement de la calculatrice CRS…</div>}>
              <CanadaScoreSimulator />
            </Suspense>
          </SimulatorRetryBoundary>
        </ServiceSection>
      </div>

      <ServiceSection
        title="Comment fonctionne le barème CRS ?"
        introduction="Le Système de classement global évalue plusieurs familles de facteurs. Le barème précis (points par tranche d’âge, niveau de langue, etc.) est fixé par IRCC et peut évoluer : consultez toujours la page officielle avant de tirer une conclusion définitive."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {crsFactors.map((factor) => {
            const Icon = factor.icon;
            return (
              <article key={factor.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Icon className="h-7 w-7 text-blue-700" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-black text-slate-950">{factor.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{factor.text}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-6">
          <a href={IRCC_CRS_CRITERIA_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 underline underline-offset-4 hover:text-blue-800">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />Voir le détail des critères sur Canada.ca
          </a>
        </div>
      </ServiceSection>

      <ServiceSection
        tone="slate"
        title="Score sous le seuil : les leviers les plus courants"
        introduction="La calculatrice propose des recommandations personnalisées selon votre profil. Voici les leviers généralement les plus déterminants."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex gap-3 rounded-xl border border-blue-100 bg-white p-5">
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
            <p className="text-sm leading-6 text-slate-700">Améliorer un résultat de test de langue (français et/ou anglais), compétence par compétence, est souvent le moyen le plus rapide de gagner des points, y compris pour le bilinguisme.</p>
          </div>
          <div className="flex gap-3 rounded-xl border border-blue-100 bg-white p-5">
            <Compass className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
            <p className="text-sm leading-6 text-slate-700">Explorer une nomination provinciale (PNP) adaptée à votre profil et à votre secteur peut ouvrir une voie distincte de l’Entrée express générale.</p>
          </div>
        </div>
        <div className="mt-8">
          <Link
            href="/canada#voies-canada"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
          >
            Explorer les parcours détaillés Canada
          </Link>
        </div>
      </ServiceSection>

      <ServiceSection
        tone="blue"
        title="Questions fréquentes sur le score CRS"
      >
        <Accordion type="single" collapsible className="mx-auto max-w-4xl divide-y divide-blue-100 rounded-2xl border border-blue-100 bg-white px-5 shadow-sm">
          {crsFaq.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`} className="border-blue-100">
              <AccordionTrigger className="py-5 text-left text-base font-black text-slate-950 hover:no-underline focus-visible:ring-2 focus-visible:ring-amber-500 [&>svg]:text-blue-700">{item.question}</AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-7 text-slate-700">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ServiceSection>

      <ServiceSection
        title="Préparer votre prochaine action"
        introduction="Une évaluation complète permet de vérifier l’ensemble de votre dossier, au-delà du seul score indicatif."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/evaluation?destination=canada"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />Évaluer mon profil Canada
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
          >
            <UsersRound className="h-4 w-4" aria-hidden="true" />Contacter 3M TRAVEL AGENCY
          </Link>
        </div>
      </ServiceSection>
    </ServicePageShell>
  );
}
