import { AlertTriangle, CheckCircle2, ClipboardList, Compass, ExternalLink, FileText, HandHeart, Hourglass, ListChecks, Scale, ShieldCheck, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getProcedureBlueprint, resolveProcedureKind, type BlueprintLocale } from "@/data/procedureBlueprints";

type Props = {
  countryName: string;
  visaType?: string | null;
  slug?: string | null;
  locale: BlueprintLocale;
  evaluationUrl: string;
  officialUrl?: string | null;
};

const COPY = {
  fr: {
    title: (country: string) => `Votre dossier complet vers ${country}, de A à Z`,
    intro: "Le parcours ci-dessous vaut pour ce type de procédure. Les montants, délais et pièces exacts du pays sont à confirmer sur le portail officiel cité sur cette fiche ; la décision revient toujours à l’autorité du pays.",
    forWhom: "À qui s’adresse cette procédure",
    journey: "Le parcours, étape par étape",
    watch: "Point de vigilance",
    help: "Ce que fait 3M",
    documents: "Pièces à réunir",
    documentsNote: "Base commune : la liste exacte dépend de votre nationalité, de votre situation et du pays.",
    costs: "Comprendre les coûts avant de vous engager",
    delays: "Ce qui fait varier les délais",
    delaysNote: "Aucun délai n’est promis : il dépend de l’autorité et de la complétude de votre dossier.",
    mistakes: "Les erreurs qui coûtent du temps",
    after: "Après la décision",
    approved: "Si la décision est favorable",
    refused: "Si la décision est défavorable",
    role: "Notre rôle, en toute transparence",
    does: "Ce que nous faisons",
    doesList: ["Évaluer gratuitement votre projet et votre profil", "Établir la liste exacte des pièces à réunir", "Contrôler la cohérence du dossier avant dépôt", "Vous renvoyer vers la source officielle", "Suivre l’avancement dans votre espace client"],
    doesNot: "Ce que nous ne faisons jamais",
    doesNotList: ["Promettre un visa, un emploi ou un délai", "Fabriquer, modifier ou antidater un document", "Influencer la décision d’une autorité", "Demander un paiement sans l’avoir confirmé par écrit"],
    cta: "Démarrer mon évaluation gratuite",
    ctaHelp: "Parler à un conseiller",
    official: "Consulter la source officielle",
    stepWord: "Étape",
  },
  en: {
    title: (country: string) => `Your complete file for ${country}, from A to Z`,
    intro: "The path below applies to this type of procedure. Exact amounts, timelines and documents for the country must be confirmed on the official portal cited on this page; the decision always rests with the country’s authority.",
    forWhom: "Who this procedure is for",
    journey: "The path, step by step",
    watch: "Watch point",
    help: "What 3M does",
    documents: "Documents to gather",
    documentsNote: "Common base: the exact list depends on your nationality, your situation and the country.",
    costs: "Understand the costs before you commit",
    delays: "What makes timelines vary",
    delaysNote: "No timeline is promised: it depends on the authority and the completeness of your file.",
    mistakes: "Mistakes that cost time",
    after: "After the decision",
    approved: "If the decision is favourable",
    refused: "If the decision is unfavourable",
    role: "Our role, in full transparency",
    does: "What we do",
    doesList: ["Assess your project and profile for free", "Draw up the exact list of documents to gather", "Check the file’s consistency before filing", "Point you to the official source", "Track progress in your client space"],
    doesNot: "What we never do",
    doesNotList: ["Promise a visa, a job or a timeline", "Forge, alter or backdate a document", "Influence an authority’s decision", "Ask for a payment not confirmed in writing"],
    cta: "Start my free assessment",
    ctaHelp: "Talk to an adviser",
    official: "Open the official source",
    stepWord: "Step",
  },
} as const;

export function ProcedureBlueprint({ countryName, visaType, slug, locale, evaluationUrl, officialUrl }: Props) {
  const kind = resolveProcedureKind(visaType, slug);
  const blueprint = getProcedureBlueprint(kind, locale);
  const t = COPY[locale];
  const contactHref = locale === "en" ? "/en" : "/contact";

  return (
    <section aria-labelledby="procedure-blueprint-title" data-testid="procedure-blueprint" data-kind={kind} className="space-y-6">
      <Card className="space-y-4 rounded-3xl border-slate-200 bg-white p-8 shadow-sm">
        <h2 id="procedure-blueprint-title" className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Compass className="h-6 w-6 text-blue-700" aria-hidden="true" /> {t.title(countryName)}
        </h2>
        <p className="text-sm leading-6 text-slate-600">{t.intro}</p>
        <nav aria-label={locale === "en" ? "On this page" : "Sur cette page"} className="flex flex-wrap gap-2 text-xs font-bold">
          {[
            ["blueprint-journey", t.journey],
            ["blueprint-documents", t.documents],
            ["blueprint-costs", t.costs],
            ["blueprint-delays", t.delays],
            ["blueprint-after", t.after],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-slate-50 px-3 text-slate-700 hover:border-blue-300 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">{label}</a>
          ))}
        </nav>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <h3 className="flex items-center gap-2 font-bold text-slate-900"><ClipboardList className="h-4 w-4 text-blue-700" aria-hidden="true" /> {t.forWhom}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-700">{blueprint.forWhom}</p>
        </div>
      </Card>

      <Card id="blueprint-journey" className="scroll-mt-24 space-y-5 rounded-3xl border-slate-200 bg-white p-8 shadow-sm">
        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900"><ListChecks className="h-5 w-5 text-indigo-700" aria-hidden="true" /> {t.journey}</h3>
        <ol className="space-y-4" data-testid="blueprint-steps">
          {blueprint.steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white" aria-hidden="true">{index + 1}</span>
                <div className="min-w-0 space-y-2">
                  <h4 className="font-bold text-slate-900"><span className="sr-only">{t.stepWord} {index + 1} : </span>{step.title}</h4>
                  <p className="text-sm leading-6 text-slate-700">{step.what}</p>
                  <p className="flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950"><AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" /><span><strong>{t.watch} : </strong>{step.watch}</span></p>
                  <p className="flex gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-950"><HandHeart className="mt-1 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" /><span><strong>{t.help} : </strong>{step.help}</span></p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card id="blueprint-documents" className="scroll-mt-24 space-y-4 rounded-3xl border-slate-200 bg-white p-8 shadow-sm">
        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900"><FileText className="h-5 w-5 text-purple-700" aria-hidden="true" /> {t.documents}</h3>
        <p className="text-sm text-slate-600">{t.documentsNote}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {blueprint.documents.map((group) => (
            <div key={group.group} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <h4 className="font-bold text-slate-900">{group.group}</h4>
              <ul className="mt-2 space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card id="blueprint-costs" className="scroll-mt-24 space-y-4 rounded-3xl border-slate-200 bg-white p-8 shadow-sm">
        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Wallet className="h-5 w-5 text-emerald-700" aria-hidden="true" /> {t.costs}</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {blueprint.costs.slice(0, 3).map((family) => (
            <div key={family.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <h4 className="font-bold text-slate-900">{family.title}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-700">{family.text}</p>
            </div>
          ))}
        </div>
        {blueprint.costs.length > 3 && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <h4 className="font-bold text-slate-900">{blueprint.costs[3].title}</h4>
            <p className="mt-1 text-sm leading-6 text-slate-700">{blueprint.costs[3].text}</p>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card id="blueprint-delays" className="scroll-mt-24 space-y-3 rounded-3xl border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Hourglass className="h-5 w-5 text-sky-700" aria-hidden="true" /> {t.delays}</h3>
          <p className="text-sm text-slate-600">{t.delaysNote}</p>
          <ul className="space-y-1.5">
            {blueprint.delayFactors.map((factor) => (
              <li key={factor} className="flex gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />{factor}</li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-3 rounded-3xl border-amber-200 bg-amber-50/60 p-8 shadow-sm">
          <h3 className="flex items-center gap-2 text-xl font-bold text-amber-950"><AlertTriangle className="h-5 w-5 text-amber-700" aria-hidden="true" /> {t.mistakes}</h3>
          <ul className="space-y-1.5">
            {blueprint.mistakes.map((mistake) => (
              <li key={mistake} className="flex gap-2 text-sm text-amber-950"><span aria-hidden="true">•</span>{mistake}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card id="blueprint-after" className="scroll-mt-24 space-y-4 rounded-3xl border-slate-200 bg-white p-8 shadow-sm">
        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Scale className="h-5 w-5 text-indigo-700" aria-hidden="true" /> {t.after}</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><h4 className="font-bold text-emerald-950">{t.approved}</h4><p className="mt-1 text-sm leading-6 text-emerald-950">{blueprint.afterApproved}</p></div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4"><h4 className="font-bold text-rose-950">{t.refused}</h4><p className="mt-1 text-sm leading-6 text-rose-950">{blueprint.afterRefused}</p></div>
        </div>
      </Card>

      <Card className="space-y-4 rounded-3xl border-blue-100 bg-gradient-to-br from-white to-blue-50 p-8 shadow-sm">
        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900"><ShieldCheck className="h-5 w-5 text-blue-700" aria-hidden="true" /> {t.role}</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div><h4 className="font-bold text-slate-900">{t.does}</h4><ul className="mt-2 space-y-1.5">{t.doesList.map((item) => <li key={item} className="flex gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />{item}</li>)}</ul></div>
          <div><h4 className="font-bold text-slate-900">{t.doesNot}</h4><ul className="mt-2 space-y-1.5">{t.doesNotList.map((item) => <li key={item} className="flex gap-2 text-sm text-slate-700"><span className="mt-0.5 h-4 w-4 shrink-0 text-center font-black text-rose-600" aria-hidden="true">×</span>{item}</li>)}</ul></div>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a href={evaluationUrl} data-testid="blueprint-cta" className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">{t.cta}</a>
          <a href={contactHref} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">{t.ctaHelp}</a>
          {officialUrl && (
            <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-blue-800 underline underline-offset-2"><ExternalLink className="h-4 w-4" aria-hidden="true" />{t.official}</a>
          )}
        </div>
      </Card>
    </section>
  );
}
