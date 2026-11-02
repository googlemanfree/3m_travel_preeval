import { useEffect } from "react";
import { FaqSection } from "@/components/PageEnrichment";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import { EN_FAQ_GROUPS, EN_FAQ_ITEMS } from "@/data/contentCampaignEn";
import { getServiceVisual } from "@/data/premiumVisuals";
import { setPageSeo } from "@/lib/pageSeo";

const TITLE = "Frequently asked questions | 3M TRAVEL AGENCY";
const DESCRIPTION = "Free assessment, fees, documents, timelines, security, visas and e-Visa: answers to the questions most often asked before starting a mobility project.";

/** FAQPage structured data: static content written in code; “<” is escaped so nothing can close the script tag. */
function faqJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "en",
    mainEntity: EN_FAQ_ITEMS.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  }).replace(/</g, "\\u003c");
}

export default function EnFaq() {
  useEffect(() => {
    setPageSeo({ title: TITLE, description: DESCRIPTION });
    document.documentElement.lang = "en";
  }, []);

  return (
    <ServicePageShell
      lang="en"
      eyebrow="Help · Frequently asked questions"
      title="All your questions before you start"
      introduction="Assessment, fees, documents, timelines, security, visas: clear answers, with no promise of results. A question left unanswered? Write to us and an adviser will reply."
      primaryHref="/en"
      primaryLabel="Back to the English home page"
      secondaryHref="/contact"
      secondaryLabel="Ask my question"
      notice="Decisions on visas, admission, work authorisation, insurance and fees belong to the authorities and providers concerned. 3M TRAVEL AGENCY prepares, guides and follows your file without guaranteeing any result."
      heroVisual={getServiceVisual("mobilite")}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd() }} />

      <ServiceSection title="Choose a topic" introduction="Go straight to the answer that concerns you.">
        <nav aria-label="FAQ topics" data-testid="en-faq-themes">
          <ul className="flex flex-wrap gap-3">
            {EN_FAQ_GROUPS.map((group) => (
              <li key={group.id}>
                <a href={`#${group.id}`} className="inline-flex min-h-11 items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-900 shadow-sm hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">
                  {group.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </ServiceSection>

      {EN_FAQ_GROUPS.map((group, index) => (
        <div key={group.id} id={group.id} className="scroll-mt-24" data-testid={`en-faq-group-${group.id}`}>
          <FaqSection title={group.title} introduction={group.intro} items={group.items} tone={index % 2 === 0 ? "white" : "slate"} testId={`en-faq-items-${group.id}`} />
        </div>
      ))}

      <ServiceSection title="Can’t find your answer?" introduction="An adviser replies in writing, quoting your file reference if you have one." tone="blue">
        <div className="flex flex-wrap gap-3">
          <a href="/contact" className="inline-flex min-h-11 items-center rounded-xl bg-blue-800 px-5 py-3 text-sm font-black text-white hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Write to the agency</a>
          <a href="/en/verify-an-agency" className="inline-flex min-h-11 items-center rounded-xl border border-blue-300 bg-white px-5 py-3 text-sm font-black text-blue-900 hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Check an agency before paying</a>
        </div>
      </ServiceSection>
    </ServicePageShell>
  );
}
