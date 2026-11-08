import { useEffect, useState, type MouseEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  ClipboardCheck,
  Info,
  Printer,
  ShieldAlert,
} from "lucide-react";
import type {
  CandidateGuide,
  GuideBlock,
  GuideCalloutTone,
  GuideSection,
} from "@/data/candidateGuides/types";
import { scrollBehavior } from "@/lib/motion";

const CALLOUT_STYLES: Record<
  GuideCalloutTone,
  { box: string; label: string; Icon: typeof Info; defaultTitle?: string }
> = {
  info: {
    box: "border-blue-200 bg-blue-50 text-blue-950",
    label: "text-blue-800",
    Icon: Info,
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-950",
    label: "text-amber-800",
    Icon: AlertTriangle,
  },
  confirm: {
    box: "border-dashed border-violet-300 bg-violet-50 text-violet-950",
    label: "text-violet-800",
    Icon: ClipboardCheck,
    defaultTitle: "À confirmer",
  },
  danger: {
    box: "border-red-200 bg-red-50 text-red-950",
    label: "text-red-800",
    Icon: ShieldAlert,
  },
};

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "text":
      return <p className="text-sm leading-7 text-slate-700">{block.text}</p>;
    case "list":
      return (
        <ul className="space-y-1.5 text-sm leading-6 text-slate-700">
          {block.items.map(item => (
            <li key={item} className="flex gap-2">
              <span className="text-blue-600" aria-hidden="true">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "callout": {
      const style = CALLOUT_STYLES[block.tone];
      const title = block.title ?? style.defaultTitle;
      return (
        <div
          role="note"
          className={`flex gap-3 rounded-xl border p-4 text-sm leading-6 ${style.box}`}
          data-testid={`guide-callout-${block.tone}`}
        >
          <style.Icon
            className={`mt-0.5 h-5 w-5 shrink-0 ${style.label}`}
            aria-hidden="true"
          />
          <p>
            {title ? (
              <strong className={`${style.label} mr-1`}>{title} —</strong>
            ) : null}
            {block.text}
          </p>
        </div>
      );
    }
    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            {block.caption ? (
              <caption className="bg-slate-50 px-3 py-2 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                {block.caption}
              </caption>
            ) : null}
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                {block.headers.map((header, index) => (
                  <th
                    key={`${header}-${index}`}
                    scope="col"
                    className="px-3 py-2 font-black"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {block.rows.map((row, rowIndex) => (
                <tr key={`${row[0]}-${rowIndex}`}>
                  {row.map((cell, cellIndex) =>
                    cellIndex === 0 ? (
                      <th
                        key={cellIndex}
                        scope="row"
                        className="px-3 py-2 align-top font-bold text-slate-900"
                      >
                        {cell}
                      </th>
                    ) : (
                      <td
                        key={cellIndex}
                        className="px-3 py-2 align-top leading-6"
                      >
                        {cell}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {block.note ? (
            <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
              {block.note}
            </p>
          ) : null}
        </div>
      );
    case "cards":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {block.items.map(item => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <h3 className="text-sm font-black text-slate-950">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      );
    case "step":
      return (
        <div
          className="rounded-xl border border-slate-200 bg-white p-4"
          data-testid="guide-step"
        >
          <div className="flex items-start gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-black text-white"
              aria-hidden="true"
            >
              {block.number}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-950">
                <span className="sr-only">Étape {block.number} — </span>
                {block.title}
              </h3>
              <dl className="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
                <div>
                  <dt className="inline font-bold text-slate-900">
                    Intervenants :{" "}
                  </dt>
                  <dd className="inline">{block.actors}</dd>
                </div>
                <div>
                  <dt className="inline font-bold text-slate-900">
                    Concrètement :{" "}
                  </dt>
                  <dd className="inline">{block.action}</dd>
                </div>
                <div>
                  <dt className="inline font-bold text-slate-900">
                    Confirmation attendue :{" "}
                  </dt>
                  <dd className="inline">{block.expected}</dd>
                </div>
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-950">
                  <dt className="inline font-bold">Vigilance : </dt>
                  <dd className="inline">{block.vigilance}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      );
    case "faq":
      return (
        <dl className="space-y-3">
          {block.items.map(item => (
            <div
              key={item.question}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <dt className="text-sm font-black text-slate-950">
                {item.question}
              </dt>
              <dd className="mt-1 text-sm leading-6 text-slate-600">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      );
  }
}

function Section({ section }: { section: GuideSection }) {
  return (
    <section
      id={section.id}
      tabIndex={-1}
      aria-labelledby={`${section.id}-title`}
      className="scroll-mt-32 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:scroll-mt-40 sm:p-7"
      data-testid={`guide-section-${section.id}`}
    >
      {section.kicker ? (
        <p className="text-xs font-black uppercase tracking-[.16em] text-blue-700">
          {section.kicker}
        </p>
      ) : null}
      <h2
        id={`${section.id}-title`}
        className="mt-1 text-xl font-black text-slate-950 sm:text-2xl"
      >
        <span className="mr-2 text-blue-700" aria-hidden="true">
          {section.number}
        </span>
        {section.title}
      </h2>
      <div className="mt-4 space-y-4">
        {section.blocks.map((block, index) => (
          <Block key={`${section.id}-${index}`} block={block} />
        ))}
      </div>
    </section>
  );
}

/**
 * Guide candidat complet d'une destination : sommaire cliquable, rubriques en blocs, sources et points à valider.
 * Le même composant affiche tous les pays ; seule la donnée (`CandidateGuide`) change.
 */
export default function CandidateGuideDocument({
  guide,
}: {
  guide: CandidateGuide;
}) {
  const titleOf = (id: string) =>
    id === "sources"
      ? "Sources et validations"
      : (guide.sections.find(section => section.id === id)?.title ?? id);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const isLuxembourgGuide = guide.slug === "luxembourg";

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleContentsClick = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    const target = document.getElementById(sectionId);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    window.history.replaceState(null, "", `#${sectionId}`);
    window.setTimeout(() => target.focus({ preventScroll: true }), 0);
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  };

  return (
    <>
      <article
        className="space-y-6"
        aria-labelledby="candidate-guide-title"
        data-testid="candidate-guide"
        data-maturity={guide.maturity}
      >
        <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-blue-700">
                Guide complet · édition {guide.edition}
              </p>
              <h2
                id="candidate-guide-title"
                className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl"
              >
                <span aria-hidden="true">{guide.flag} </span>
                {guide.heading}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {guide.lead}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-50 print:hidden"
              data-testid="guide-print"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Imprimer / enregistrer en PDF
            </button>
          </div>

          {guide.maturity === "framework" ? (
            <p
              className="mt-4 rounded-xl border border-dashed border-violet-300 bg-violet-50 p-3 text-sm leading-6 text-violet-950"
              data-testid="guide-framework-note"
            >
              <strong>Guide en cours de complétion.</strong> Les rubriques de
              méthode (évaluation, protocoles, paiements, sécurité) sont celles
              de l’agence ; les règles propres à {guide.country} marquées « à
              confirmer » sont ajoutées après relecture des sources officielles.
            </p>
          ) : null}

          <nav aria-label="Sommaire du guide" className="mt-5 print:hidden">
            <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">
              Sommaire
            </h3>
            <ul
              className="mt-2 grid gap-2 sm:grid-cols-2"
              data-testid="guide-contents"
            >
              {guide.contents.map(group => (
                <li
                  key={group.label}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <p className="text-sm font-black text-slate-900">
                    {group.label}
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {group.sectionIds.map(id => (
                      <li key={id}>
                        <a
                          href={`#${id}`}
                          onClick={event => handleContentsClick(event, id)}
                          className="inline-flex min-h-9 items-center text-xs font-bold text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                        >
                          {titleOf(id)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </nav>

          <p
            className="mt-5 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-950"
            data-testid="guide-disclaimer"
          >
            {guide.disclaimer}
          </p>
        </header>

        {guide.sections.map(section => (
          <Section key={section.id} section={section} />
        ))}

        <section
          id="sources"
          aria-labelledby="sources-title"
          className="scroll-mt-24 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-7"
          data-testid="guide-sources"
        >
          <h2
            id="sources-title"
            className="text-xl font-black text-slate-950 sm:text-2xl"
          >
            Sources et validations finales
          </h2>
          <dl className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
            {guide.sources.map(source => (
              <div key={source.key} className="flex gap-2">
                <dt className="w-14 shrink-0 font-black text-slate-900">
                  {source.key}
                </dt>
                <dd>{source.text}</dd>
              </div>
            ))}
          </dl>
          <div
            className="mt-5 rounded-xl border border-dashed border-violet-300 bg-violet-50 p-4"
            data-testid="guide-to-validate"
          >
            <h3 className="text-sm font-black text-violet-900">
              À valider avant diffusion ou signature
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-violet-950">
              {guide.toValidate.map(item => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {isLuxembourgGuide ? (
          <section
            aria-labelledby="guide-evaluation-cta-title"
            className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#061a36] via-[#0a3264] to-[#0e5b9f] p-6 text-white shadow-lg sm:p-8"
            data-testid="guide-evaluation-cta-section"
          >
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[.16em] text-amber-200">
                Prochaine étape
              </p>
              <h2
                id="guide-evaluation-cta-title"
                className="mt-2 text-2xl font-black sm:text-3xl"
              >
                Vérifier mon projet pour le Luxembourg
              </h2>
              <p className="mt-3 text-sm leading-6 text-blue-50 sm:text-base">
                Décrivez votre parcours, votre expérience et votre objectif.
                L’évaluation vous aide à identifier les prochaines informations
                à confirmer avant toute démarche.
              </p>
              <a
                href="/evaluation?project=travail&destination=Luxembourg"
                data-testid="guide-evaluation-cta"
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-center text-sm font-black text-[#061a36] shadow-md transition-transform hover:bg-amber-200 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a3264] sm:w-auto"
              >
                Démarrer mon évaluation gratuite{" "}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <p className="mt-3 text-xs leading-5 text-blue-100">
                Cette évaluation est informative et ne garantit ni emploi, ni
                visa, ni autorisation de séjour.
              </p>
            </div>
          </section>
        ) : null}
      </article>

      {showBackToTop ? (
        <button
          type="button"
          onClick={handleBackToTop}
          data-testid="guide-back-to-top"
          aria-label="Retour en haut du guide"
          title="Retour en haut"
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#123665]/95 px-4 py-3 text-sm font-black text-white shadow-lg ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-[#1a4a86] active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 sm:right-6"
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
          <span>Retour en haut</span>
        </button>
      ) : null}
    </>
  );
}
