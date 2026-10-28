import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Compass } from "lucide-react";
import {
  AGES,
  AGE_LABELS,
  DIPLOMAS,
  DIPLOMA_LABELS,
  FAMILIES,
  FAMILY_LABELS,
  FUNDS,
  FUNDS_LABELS,
  GOALS,
  GOAL_LABELS,
  LANGUAGES,
  LANGUAGE_LABELS,
  READINESS_COPY,
  STATUSES,
  STATUS_LABELS,
  TIMELINES,
  TIMELINE_LABELS,
  orient,
  type Answers,
  type Goal,
} from "@shared/mobilityOrientation";
import { setPageSeo } from "@/lib/pageSeo";
import { trackEvent } from "@/lib/analytics";
import { ServicePageShell } from "@/components/ServicePageShell";

type Draft = Partial<Answers>;

function Choice<T extends string>({ name, legend, options, labels, value, onChange }: { name: string; legend: string; options: readonly T[]; labels: Record<T, string>; value: T | undefined; onChange: (value: T) => void }) {
  return (
    <fieldset className="mt-6">
      <legend className="text-base font-black text-slate-950">{legend}</legend>
      <div className="mt-2 grid gap-2">
        {options.map((option) => (
          <label key={option} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-base ${value === option ? "border-blue-600 bg-blue-50 font-semibold text-blue-950" : "border-slate-300 bg-white text-slate-800"}`}>
            <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} className="h-5 w-5 shrink-0" />
            <span>{labels[option]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Outil gratuit : cinq questions, une famille de parcours, les points d'attention et les premières étapes. Sans compte ni donnée envoyée. */
export default function MobilityOrientationTool() {
  const [draft, setDraft] = useState<Draft>({});
  const resultRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setPageSeo({
      title: "Quel parcours de mobilité pour mon profil ? | 3M TRAVEL AGENCY",
      description: "Cinq questions pour savoir quelle voie correspond à votre projet (travail, études, séjour, famille, installation), quels points surveiller et par quoi commencer. Gratuit, sans compte.",
    });
  }, []);

  const complete = draft.goal && draft.status && draft.language && draft.timeline && draft.funds ? (draft as Answers) : null;
  const result = useMemo(() => (complete ? orient(complete) : null), [complete]);

  useEffect(() => {
    if (!complete) return;
    trackEvent("mobility_orientation_result", { goal: complete.goal });
    resultRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [complete?.goal, complete?.status, complete?.language, complete?.timeline, complete?.funds]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const goal = draft.goal as Goal | undefined;

  return (
    <ServicePageShell
      eyebrow="Outil gratuit"
      title="Quel parcours pour mon projet ?"
      introduction="Répondez à cinq questions : vous voyez la famille de parcours qui correspond à votre situation, les points à surveiller et les premières étapes. Rien n'est envoyé, aucun compte n'est demandé."
      primaryHref="/#evaluation-multi"
      primaryLabel="Évaluer mon profil"
      secondaryHref="/pays"
      secondaryLabel="Guides par pays"
      notice="Orientation générale et indicative. Elle ne garantit ni l'obtention d'un visa ni un délai : seule l'autorité du pays décide. Votre conseiller 3M TRAVEL AGENCY confirme la voie adaptée à votre dossier."
    >
      <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6" aria-labelledby="orientation-title" data-testid="mobility-orientation">
        <h2 id="orientation-title" className="flex items-center gap-2 text-xl font-black text-slate-950"><Compass className="h-6 w-6 text-blue-700" aria-hidden="true" />Votre situation</h2>

        <Choice name="goal" legend="1. Quel est votre objectif ?" options={GOALS} labels={GOAL_LABELS} value={draft.goal} onChange={(value) => setDraft({ goal: value })} />
        {goal ? <Choice name="status" legend="2. Où en êtes-vous ?" options={STATUSES} labels={STATUS_LABELS[goal]} value={draft.status} onChange={(value) => set("status", value)} /> : null}
        {draft.status ? <Choice name="language" legend="3. Votre niveau dans la langue du pays visé ?" options={LANGUAGES} labels={LANGUAGE_LABELS} value={draft.language} onChange={(value) => set("language", value)} /> : null}
        {draft.language ? <Choice name="timeline" legend="4. Quand souhaitez-vous partir ?" options={TIMELINES} labels={TIMELINE_LABELS} value={draft.timeline} onChange={(value) => set("timeline", value)} /> : null}
        {draft.timeline ? <Choice name="funds" legend="5. Vos fonds pour le projet ?" options={FUNDS} labels={FUNDS_LABELS} value={draft.funds} onChange={(value) => set("funds", value)} /> : null}

        {complete ? (
          <details className="mt-6 rounded-xl border border-slate-200 bg-white p-4" data-testid="orientation-refine">
            <summary className="min-h-11 cursor-pointer text-base font-black text-slate-950">Affiner mon orientation (facultatif)</summary>
            <Choice name="age" legend="Votre tranche d'âge" options={AGES} labels={AGE_LABELS} value={draft.age} onChange={(value) => set("age", value)} />
            <Choice name="diploma" legend="Votre plus haut diplôme" options={DIPLOMAS} labels={DIPLOMA_LABELS} value={draft.diploma} onChange={(value) => set("diploma", value)} />
            <Choice name="family" legend="Voyagez-vous seul(e) ?" options={FAMILIES} labels={FAMILY_LABELS} value={draft.family} onChange={(value) => set("family", value)} />
          </details>
        ) : null}

        {result && complete ? (
          <section ref={resultRef} className="mt-8 scroll-mt-24 rounded-2xl border border-blue-200 bg-blue-50/60 p-5" aria-live="polite" aria-labelledby="orientation-result-title" data-testid="orientation-result">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">Votre orientation</p>
            <h3 id="orientation-result-title" className="mt-1 text-xl font-black text-slate-950">{result.route.title}</h3>
            <p className="mt-2 text-base leading-7 text-slate-800">{result.route.summary}</p>
            <p className="mt-3 rounded-lg bg-white p-3 text-sm font-semibold text-slate-800" data-testid="orientation-readiness">{READINESS_COPY[result.readiness]}</p>

            {result.attention.length > 0 ? (
              <div className="mt-4">
                <h4 className="text-base font-black text-slate-950">Points d'attention</h4>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-800">{result.attention.map((line) => <li key={line}>{line}</li>)}</ul>
              </div>
            ) : null}

            <div className="mt-4">
              <h4 className="text-base font-black text-slate-950">Vos premières étapes</h4>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-800">{result.steps.map((line) => <li key={line}>{line}</li>)}</ol>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Link href="/#evaluation-multi" onClick={() => trackEvent("mobility_orientation_cta", { target: "evaluation" })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-base font-bold text-white hover:bg-blue-800">Évaluer mon profil<ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
              <Link href="/outils/liste-de-pieces" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-300 bg-white px-4 py-3 text-base font-bold text-blue-900 hover:bg-blue-50">Liste des pièces à préparer</Link>
            </div>
            <button type="button" onClick={() => setDraft({})} className="mt-3 min-h-11 text-sm font-semibold text-blue-800 underline">Recommencer</button>
          </section>
        ) : null}
      </section>
    </ServicePageShell>
  );
}
