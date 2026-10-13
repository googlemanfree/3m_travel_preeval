import React from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { ServiceSection } from "@/components/ServicePageShell";
import type { CommitmentItem, FaqItem, StepItem } from "@/data/pageEnrichment";

type Tone = "white" | "slate" | "blue";

/** Étapes numérotées (ce qui se passe, dans l'ordre). */
export function StepsSection({ title, introduction, steps, tone = "white", testId }: { title: string; introduction?: string; steps: StepItem[]; tone?: Tone; testId?: string }) {
  return (
    <ServiceSection title={title} introduction={introduction} tone={tone}>
      <ol className="grid gap-4 md:grid-cols-3" data-testid={testId}>
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-black text-white" aria-hidden="true">{index + 1}</span>
            <h3 className="mt-3 text-base font-black text-slate-950">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">{step.text}</p>
          </li>
        ))}
      </ol>
    </ServiceSection>
  );
}

/** Liste de points à préparer (cases cochées, texte simple). */
export function ChecklistSection({ title, introduction, items, tone = "slate", testId }: { title: string; introduction?: string; items: string[]; tone?: Tone; testId?: string }) {
  return (
    <ServiceSection title={title} introduction={introduction} tone={tone}>
      <ul className="grid gap-3 sm:grid-cols-2" data-testid={testId}>
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </ServiceSection>
  );
}

/** Engagements de la plateforme. */
export function CommitmentsSection({ title = "Nos engagements", introduction, items, tone = "blue", testId = "commitments" }: { title?: string; introduction?: string; items: CommitmentItem[]; tone?: Tone; testId?: string }) {
  return (
    <ServiceSection title={title} introduction={introduction} tone={tone}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid={testId}>
        {items.map((item) => (
          <li key={item.title} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-blue-700" aria-hidden="true" />
            <h3 className="mt-3 text-base font-black text-slate-950">{item.title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.text}</p>
          </li>
        ))}
      </ul>
    </ServiceSection>
  );
}

/** Questions fréquentes dépliables (éléments <details> natifs : accessibles au clavier et sans script). */
export function FaqSection({ title = "Questions fréquentes", introduction, items, tone = "white", testId = "page-faq" }: { title?: string; introduction?: string; items: FaqItem[]; tone?: Tone; testId?: string }) {
  return (
    <ServiceSection title={title} introduction={introduction} tone={tone}>
      <div className="mx-auto max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white" data-testid={testId}>
        {items.map((item) => (
          <details key={item.question} className="group px-5 py-4">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-black text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              <span>{item.question}</span>
              <span className="text-xl font-black text-blue-700 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </ServiceSection>
  );
}
