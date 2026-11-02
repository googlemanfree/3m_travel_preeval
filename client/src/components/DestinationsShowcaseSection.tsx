import { ArrowRight, Globe2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { getDestinationVisual } from "@/data/premiumVisuals";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import {
  WORLD_DESTINATION_COUNT,
  WORLD_DESTINATION_DIRECTORY,
  WORLD_DESTINATION_REGION_ORDER,
  worldDestinationsByRegion,
} from "@/data/worldDestinationDirectory";
import { buildFreeEvaluationHref } from "@/components/PublicEvaluationCTA";

interface DestinationCard {
  href: string;
  flag: string;
  name: string;
  label: string;
  slug: string;
}

interface DestinationGroup {
  title: string;
  items: DestinationCard[];
}

/** Corridors accompagnés — fiches photo premium (local Wikimedia prioritaire). */
const DESTINATION_GROUPS: DestinationGroup[] = [
  {
    title: "Europe francophone & germanophone",
    items: [
      { href: "/procedures/allemagne-formation", flag: "🇩🇪", name: "Allemagne", label: "Ausbildung dès B1", slug: "allemagne" },
      { href: "/procedures/autriche-formation", flag: "🇦🇹", name: "Autriche", label: "Lehre & métiers en pénurie", slug: "autriche" },
      { href: "/procedures/suisse-formation", flag: "🇨🇭", name: "Suisse", label: "CFC reconnu à l'international", slug: "suisse" },
      { href: "/procedures/france", flag: "🇫🇷", name: "France", label: "Apprentissage & passeport talent", slug: "france" },
      { href: "/procedures/belgique", flag: "🇧🇪", name: "Belgique", label: "Permis unique multi-secteurs", slug: "belgique" },
      { href: "/procedures/luxembourg", flag: "🇱🇺", name: "Luxembourg", label: "Parmi les plus hauts salaires d'Europe", slug: "luxembourg" },
    ],
  },
  {
    title: "Europe (autres destinations)",
    items: [
      { href: "/procedures/pays-bas", flag: "🇳🇱", name: "Pays-Bas", label: "MBO & Highly Skilled Migrant", slug: "pays-bas" },
      { href: "/procedures/royaume-uni", flag: "🇬🇧", name: "Royaume-Uni", label: "Skilled Worker — santé & IT", slug: "royaume-uni" },
      { href: "/procedures/irlande", flag: "🇮🇪", name: "Irlande", label: "Critical Skills, voie vers la RP", slug: "irlande" },
      { href: "/procedures/portugal", flag: "🇵🇹", name: "Portugal", label: "Job Seeker Visa, 120 jours", slug: "portugal" },
      { href: "/procedures/espagne", flag: "🇪🇸", name: "Espagne", label: "Travail salarié ou arraigo", slug: "espagne" },
      { href: "/procedures/italie", flag: "🇮🇹", name: "Italie", label: "Decreto Flussi par quotas", slug: "italie" },
      { href: "/procedures/pologne", flag: "🇵🇱", name: "Pologne", label: "Procédure rapide, coût réduit", slug: "pologne" },
      { href: "/procedures/malte", flag: "🇲🇹", name: "Malte", label: "Anglophone — iGaming & IT", slug: "malte" },
      { href: "/procedures/norvege", flag: "🇳🇴", name: "Norvège", label: "Métiers en tension, hauts salaires", slug: "norvege" },
    ],
  },
  {
    title: "Amérique & Océanie",
    items: [
      { href: "/canada", flag: "🇨🇦", name: "Canada", label: "Entrée express vers la résidence permanente", slug: "canada" },
      { href: "/procedures/australie", flag: "🇦🇺", name: "Australie", label: "Skilled visas 189 / 190", slug: "australie" },
      { href: "/procedures/nouvelle-zelande", flag: "🇳🇿", name: "Nouvelle-Zélande", label: "Accredited Employer Work Visa", slug: "nouvelle-zelande" },
    ],
  },
  {
    title: "Golfe & Asie",
    items: [
      { href: "/procedures/emirats", flag: "🇦🇪", name: "Émirats", label: "Golden Visa 10 ans", slug: "emirats" },
      { href: "/procedures/qatar", flag: "🇶🇦", name: "Qatar", label: "Visa sponsorisé, secteurs en essor", slug: "qatar" },
      { href: "/procedures/arabie-saoudite", flag: "🇸🇦", name: "Arabie Saoudite", label: "Vision 2030, grands projets", slug: "arabie-saoudite" },
      { href: "/procedures/coree-du-sud", flag: "🇰🇷", name: "Corée du Sud", label: "Programme EPS (visa E-9)", slug: "coree-du-sud" },
      { href: "/procedures/japon", flag: "🇯🇵", name: "Japon", label: "TITP — industrie & soins", slug: "japon" },
    ],
  },
];

function DestinationCardTile({ item }: { item: DestinationCard }) {
  const visual = getDestinationVisual(item.slug);
  return (
    <a
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
        {visual ? (
          <PremiumCoverImage
            visual={visual}
            className="h-full w-full"
            imgClassName="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl opacity-90" aria-hidden="true">{item.flag}</span>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-lg leading-none" aria-hidden="true">{item.flag}</span>
      </div>
      <div className="p-3">
        <p className="font-black text-slate-950">{item.name}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{item.label}</p>
      </div>
    </a>
  );
}

export default function DestinationsShowcaseSection() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("fr");

  const filteredWorld = useMemo(() => {
    if (!normalizedQuery) return WORLD_DESTINATION_DIRECTORY;
    return WORLD_DESTINATION_DIRECTORY.filter((entry) => {
      const hay = `${entry.name} ${entry.region} ${entry.code}`.toLocaleLowerCase("fr");
      return hay.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const regionsToShow = normalizedQuery
    ? WORLD_DESTINATION_REGION_ORDER.filter((region) => filteredWorld.some((entry) => entry.region === region))
    : WORLD_DESTINATION_REGION_ORDER;

  return (
    <section aria-labelledby="destinations-showcase-title" className="bg-slate-50 px-4 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-blue-700">
            <Globe2 className="h-4 w-4" aria-hidden="true" /> Un accompagnement, {WORLD_DESTINATION_COUNT} pays listés
          </p>
          <h2 id="destinations-showcase-title" className="mt-4 text-2xl font-black text-slate-950 md:text-3xl">Destinations d’accompagnement</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
            Corridors photo ci-dessous, puis l’annuaire complet des pays du monde. Chaque fiche procédure cite la source officielle consultée — la qualité se mesure au suivi traçable, pas à une promesse de visa.
          </p>
        </div>

        {DESTINATION_GROUPS.map((group) => (
          <div key={group.title} className="mb-9 last:mb-0">
            <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">{group.title}</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {group.items.map((item) => (
                <DestinationCardTile key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}

        <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" data-testid="world-destinations-directory">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-950">Tous les pays du monde ({WORLD_DESTINATION_COUNT})</h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Guide officiel disponible ou évaluation gratuite selon le pays — sélectionnez pour ouvrir la fiche ou démarrer votre dossier.
              </p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <span className="sr-only">Rechercher un pays</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un pays…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none ring-blue-600 focus:bg-white focus:ring-2"
                data-testid="world-destinations-search"
              />
            </label>
          </div>

          <div className="mt-6 space-y-6">
            {regionsToShow.map((region) => {
              const items = normalizedQuery
                ? filteredWorld.filter((entry) => entry.region === region)
                : worldDestinationsByRegion(region);
              if (items.length === 0) return null;
              return (
                <div key={region}>
                  <h4 className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
                    {region} · {items.length}
                  </h4>
                  <ul className="flex flex-wrap gap-2">
                    {items.map((entry) => (
                      <li key={entry.code}>
                        <a
                          href={entry.href}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 sm:min-h-0 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
                          title={entry.hasProcedurePage ? "Fiche procédure avec source officielle" : "Évaluation / orientation"}
                        >
                          <span aria-hidden="true">{entry.flag}</span>
                          {entry.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {filteredWorld.length === 0 ? (
              <p className="text-sm font-medium text-slate-600">Aucun pays ne correspond à « {query} ».</p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="mb-4 text-base font-bold text-slate-800">Vous ne savez pas quelle destination choisir ?</p>
          <a
            href={buildFreeEvaluationHref("etudes")}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-black text-white hover:bg-blue-800"
          >
            Démarrez votre évaluation gratuite <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
