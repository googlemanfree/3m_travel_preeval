import { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { useRoute } from "wouter";
import { FaqSection } from "@/components/PageEnrichment";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import { PrintBrandedButton } from "@/components/PrintBrandedButton";
import { GUIDES, getGuide, type Guide } from "@/data/guidesData";
import { getServiceVisual } from "@/data/premiumVisuals";
import { setPageSeo } from "@/lib/pageSeo";

const SITE = "3M TRAVEL AGENCY";

/** Données structurées FAQPage : contenu statique du code, « < » échappé pour ne jamais fermer la balise script. */
function faqJsonLd(guide: Guide) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  }).replace(/</g, "\\u003c");
}

export function GuideNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-4 px-4 py-16">
      <h1 className="text-3xl font-black text-slate-900">Guide introuvable</h1>
      <p className="text-slate-700">Ce guide n’existe pas ou a changé d’adresse. Voici la liste de tous les guides disponibles.</p>
      <a href="/guides" className="inline-flex min-h-11 items-center rounded-xl bg-blue-800 px-5 py-3 text-sm font-black text-white hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Voir tous les guides</a>
    </main>
  );
}

export default function GuidePage() {
  const [, params] = useRoute<{ slug: string }>("/guides/:slug");
  const guide = params?.slug ? getGuide(params.slug) : undefined;

  useEffect(() => {
    if (!guide) return;
    setPageSeo({ title: `${guide.seoTitle} | ${SITE}`, description: guide.description });
  }, [guide]);

  if (!guide) return <GuideNotFound />;

  const others = GUIDES.filter((entry) => entry.slug !== guide.slug);

  return (
    <ServicePageShell
      eyebrow="Guides pratiques"
      title={guide.title}
      introduction={guide.lead}
      primaryHref="/?project=travail#evaluation-multi"
      primaryLabel="Commencer l’évaluation gratuite"
      secondaryHref="/contact"
      secondaryLabel="Poser ma question"
      notice="Ce guide est une aide générale, rédigée pour durer. Les conditions, montants et délais changent : vérifiez-les toujours auprès de l’autorité, de l’établissement ou de l’employeur concerné. 3M TRAVEL AGENCY ne garantit aucun résultat."
      heroVisual={getServiceVisual("mobilite")}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(guide) }} />

      <ServiceSection title="Dans ce guide">
        <div className="mb-4">
          <PrintBrandedButton
            label="Imprimer ce guide"
            build={() => ({
              title: guide.title,
              intro: guide.lead,
              sections: guide.sections.map((section) => ({ title: section.title, paragraphs: section.paragraphs, bullets: section.bullets })),
              note: "Guide général rédigé pour durer : vérifiez toujours les conditions, montants et délais auprès de l'autorité ou de l'établissement concerné.",
            })}
          />
        </div>
        <nav aria-label="Sommaire du guide" data-testid="guide-toc">
          <ul className="flex flex-wrap gap-3">
            {guide.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="inline-flex min-h-11 items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-900 shadow-sm hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </ServiceSection>

      {guide.sections.map((section, index) => (
        <div key={section.id} id={section.id} className="scroll-mt-24" data-testid={`guide-section-${section.id}`}>
          <ServiceSection title={section.title} tone={index % 2 === 0 ? "slate" : "white"}>
            <div className="max-w-3xl space-y-4 text-base leading-7 text-slate-700">
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.bullets && (
                <ul className="list-disc space-y-2 pl-6">
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              )}
            </div>
          </ServiceSection>
        </div>
      ))}

      <FaqSection title="Questions sur ce sujet" items={guide.faq} tone="white" testId="guide-faq" />

      {guide.sources && guide.sources.length > 0 && (
        <ServiceSection title="Sources officielles" introduction="Pour vérifier une information, partez toujours de la source.">
          <ul className="space-y-3" data-testid="guide-sources">
            {guide.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-blue-800 underline underline-offset-2 hover:text-blue-950">
                  {source.label} <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
                <span className="ml-2 text-sm text-slate-600">consultée le {source.consultedAt}</span>
              </li>
            ))}
          </ul>
        </ServiceSection>
      )}

      <ServiceSection title="Pour aller plus loin" tone="blue">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="guide-related">
          {guide.related.map((link) => (
            <li key={link.href}><a href={link.href} className="block rounded-xl border border-blue-200 bg-white p-4 font-bold text-blue-900 shadow-sm hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">{link.label}</a></li>
          ))}
          {others.slice(0, 3).map((other) => (
            <li key={other.slug}><a href={`/guides/${other.slug}`} className="block rounded-xl border border-blue-200 bg-white p-4 font-bold text-blue-900 shadow-sm hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">Guide : {other.seoTitle}</a></li>
          ))}
        </ul>
      </ServiceSection>
    </ServicePageShell>
  );
}
