import { useEffect } from "react";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import { GUIDES } from "@/data/guidesData";
import { getServiceVisual } from "@/data/premiumVisuals";
import { setPageSeo } from "@/lib/pageSeo";

export const GUIDES_HUB_TITLE = "Guides pratiques mobilité | 3M TRAVEL AGENCY";
export const GUIDES_HUB_DESCRIPTION = "Documents, calendrier, financement, budget, premières démarches et vocabulaire : les guides pratiques pour préparer un projet de mobilité.";

export default function GuidesHub() {
  useEffect(() => {
    setPageSeo({ title: GUIDES_HUB_TITLE, description: GUIDES_HUB_DESCRIPTION });
  }, []);

  return (
    <ServicePageShell
      eyebrow="Aide · Guides pratiques"
      title="Les guides pour préparer votre projet"
      introduction="Des repères simples pour les points qui bloquent le plus souvent un dossier : documents, calendrier, financement, budget, premières démarches sur place et vocabulaire."
      primaryHref="/?project=travail#evaluation-multi"
      primaryLabel="Commencer l’évaluation gratuite"
      secondaryHref="/faq"
      secondaryLabel="Questions fréquentes"
      notice="Ces guides sont généraux et rédigés pour durer : les conditions, montants et délais changent et se vérifient auprès des autorités concernées. Aucun résultat n’est garanti."
      heroVisual={getServiceVisual("mobilite")}
    >
      <ServiceSection title="Tous les guides" introduction="Choisissez le sujet qui vous concerne.">
        <ul className="grid gap-5 md:grid-cols-2" data-testid="guides-list">
          {GUIDES.map((guide) => (
            <li key={guide.slug} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">
                <a href={`/guides/${guide.slug}`} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">{guide.title}</a>
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{guide.description}</p>
              <a href={`/guides/${guide.slug}`} className="mt-4 inline-flex min-h-11 items-center font-bold text-blue-800 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">Lire le guide</a>
            </li>
          ))}
        </ul>
      </ServiceSection>
    </ServicePageShell>
  );
}
