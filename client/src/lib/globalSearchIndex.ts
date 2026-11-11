import { procedures107Complete } from "@/data/procedures107Complete";
import { WORLD_DESTINATION_DIRECTORY } from "@/data/worldDestinationDirectory";
import { QUICK_ACTIONS, SERVICE_POLES } from "@/data/serviceCatalog";

export type InternalSearchResult = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: "Pays" | "Procédure" | "Service";
  flag?: string;
};

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR")
    .trim();

const countryResults: InternalSearchResult[] = WORLD_DESTINATION_DIRECTORY.map(
  country => ({
    id: `country-${country.code}`,
    title: country.name,
    description: `${country.region} · ${country.hasProcedurePage ? "guide 3M disponible" : "orientation et évaluation 3M"}`,
    href: country.href,
    category: "Pays",
    flag: country.flag,
  })
);

const procedureResults: InternalSearchResult[] = procedures107Complete.map(
  procedure => ({
    id: `procedure-${procedure.id}`,
    title: `${procedure.name} · ${procedure.visaType}`,
    description: procedure.description,
    href: `/procedures/${encodeURIComponent(procedure.id)}`,
    category: "Procédure",
    flag: procedure.flag,
  })
);

const serviceResults: InternalSearchResult[] = [
  ...SERVICE_POLES.flatMap(pole =>
    pole.services.map(service => ({
      id: `service-${service.id}`,
      title: service.title,
      description: service.description,
      href: service.href,
      category: "Service" as const,
    }))
  ),
  ...QUICK_ACTIONS.map(action => ({
    id: `action-${action.id}`,
    title: action.title,
    description: action.hint,
    href: action.href,
    category: "Service" as const,
  })),
];

export const GLOBAL_SEARCH_INDEX: InternalSearchResult[] = [
  ...countryResults,
  ...procedureResults,
  ...serviceResults,
];

export function searchInternalSite(
  query: string,
  limit = 12
): InternalSearchResult[] {
  const tokens = fold(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return GLOBAL_SEARCH_INDEX.map(item => {
    const haystack = fold(`${item.title} ${item.description} ${item.category}`);
    const score = tokens.reduce((total, token) => {
      if (fold(item.title).startsWith(token)) return total + 6;
      if (fold(item.title).includes(token)) return total + 4;
      if (haystack.includes(token)) return total + 1;
      return total;
    }, 0);
    return { item, score };
  })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.item.title.localeCompare(b.item.title, "fr")
    )
    .slice(0, limit)
    .map(({ item }) => item);
}
