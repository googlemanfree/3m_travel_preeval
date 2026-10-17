import { useEffect } from "react";
import { FaqSection } from "@/components/PageEnrichment";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import { FAQ_GENERAL_GROUPS, FAQ_GENERAL_ITEMS } from "@/data/contentCampaign";
import { getServiceVisual } from "@/data/premiumVisuals";
import { setPageSeo } from "@/lib/pageSeo";

const TITLE = "Questions fréquentes | 3M TRAVEL AGENCY";
const DESCRIPTION = "Évaluation gratuite, frais et paiement, documents, délais, sécurité, visas et e-Visa : les réponses de 3M TRAVEL AGENCY aux questions les plus posées avant de lancer un projet de mobilité internationale.";

/**
 * Données structurées FAQPage (lisibles par les moteurs de recherche qui exécutent le JavaScript).
 * Contenu statique rédigé dans le code ; « < » est échappé pour qu'aucune séquence ne puisse fermer la balise script.
 */
function faqJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_GENERAL_ITEMS.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  }).replace(/</g, "\\u003c");
}

export default function Faq() {
  useEffect(() => {
    setPageSeo({ title: TITLE, description: DESCRIPTION });
  }, []);

  return (
    <ServicePageShell
      eyebrow="Aide · Questions fréquentes"
      title="Toutes vos questions avant de commencer"
      introduction="Évaluation, frais, documents, délais, sécurité, visas : des réponses claires, sans promesse de résultat. Une question reste sans réponse ? Écrivez-nous, un conseiller vous répond."
      primaryHref="/?project=travail#evaluation-multi"
      primaryLabel="Commencer l’évaluation gratuite"
      secondaryHref="/contact"
      secondaryLabel="Poser ma question"
      notice="Les décisions de visa, d’admission, d’autorisation de travail, d’assurance et de tarif appartiennent aux autorités et prestataires concernés. 3M TRAVEL AGENCY prépare, oriente et suit votre dossier sans garantir de résultat."
      heroVisual={getServiceVisual("mobilite")}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd() }} />

      <ServiceSection title="Choisir un thème" introduction="Accédez directement à la réponse qui vous concerne.">
        <nav aria-label="Thèmes de la foire aux questions" data-testid="faq-themes">
          <ul className="flex flex-wrap gap-3">
            {FAQ_GENERAL_GROUPS.map((group) => (
              <li key={group.id}>
                <a href={`#${group.id}`} className="inline-flex min-h-11 items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-900 shadow-sm hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">
                  {group.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </ServiceSection>

      {FAQ_GENERAL_GROUPS.map((group, index) => (
        <div key={group.id} id={group.id} className="scroll-mt-24" data-testid={`faq-group-${group.id}`}>
          <FaqSection title={group.title} introduction={group.intro} items={group.items} tone={index % 2 === 0 ? "white" : "slate"} testId={`faq-items-${group.id}`} />
        </div>
      ))}

      <ServiceSection title="Vous ne trouvez pas votre réponse ?" introduction="Un conseiller vous répond par écrit, avec votre référence de dossier si vous en avez une." tone="blue">
        <div className="flex flex-wrap gap-3">
          <a href="/contact" className="inline-flex min-h-11 items-center rounded-xl bg-blue-800 px-5 py-3 text-sm font-black text-white hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Écrire à l’agence</a>
          <a href="/verifier-une-agence" className="inline-flex min-h-11 items-center rounded-xl border border-blue-300 bg-white px-5 py-3 text-sm font-black text-blue-900 hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Vérifier une agence avant de payer</a>
          <a href="/tarifs" className="inline-flex min-h-11 items-center rounded-xl border border-blue-300 bg-white px-5 py-3 text-sm font-black text-blue-900 hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">Comprendre les tarifs</a>
        </div>
      </ServiceSection>
    </ServicePageShell>
  );
}
