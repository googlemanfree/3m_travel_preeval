import { procedures107Complete } from "@/data/procedures107Complete";
import { WORLD_DESTINATION_DIRECTORY } from "@/data/worldDestinationDirectory";
import { QUICK_ACTIONS, SERVICE_POLES } from "@/data/serviceCatalog";

export type InternalSearchFilters = {
  country?: string;
  visaType?: string;
  serviceType?: string;
};

export type InternalSearchResult = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: "Pays" | "Procédure" | "Service";
  flag?: string;
  country?: string;
  visaType?: string;
  serviceType?: string;
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
    country: country.name,
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
    country: procedure.name,
    visaType: procedure.visaType,
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
      serviceType: pole.title,
    }))
  ),
  ...QUICK_ACTIONS.map(action => ({
    id: `action-${action.id}`,
    title: action.title,
    description: action.hint,
    href: action.href,
    category: "Service" as const,
    serviceType: "Actions rapides",
  })),
];

export const GLOBAL_SEARCH_INDEX: InternalSearchResult[] = [
  ...countryResults,
  ...procedureResults,
  ...serviceResults,
];

const uniqueStrings = (values: Array<string | undefined>) =>
  Array.from(
    new Set(values.filter((value): value is string => Boolean(value)))
  );

export const SEARCH_COUNTRIES = uniqueStrings(
  countryResults.map(item => item.country)
).sort((a, b) => a.localeCompare(b, "fr"));
export const SEARCH_VISA_TYPES = uniqueStrings(
  procedureResults.map(item => item.visaType)
);
export const SEARCH_SERVICE_TYPES = uniqueStrings(
  serviceResults.map(item => item.serviceType)
).sort((a, b) => a.localeCompare(b, "fr"));

export function searchInternalSite(
  query: string,
  limit = 12,
  filters: InternalSearchFilters = {}
): InternalSearchResult[] {
  const tokens = fold(query).split(/\s+/).filter(Boolean);
  return GLOBAL_SEARCH_INDEX.map(item => {
    const haystack = fold(`${item.title} ${item.description} ${item.category}`);
    const score =
      tokens.length === 0
        ? 1
        : tokens.reduce((total, token) => {
            if (fold(item.title).startsWith(token)) return total + 6;
            if (fold(item.title).includes(token)) return total + 4;
            if (haystack.includes(token)) return total + 1;
            return total;
          }, 0);
    return { item, score };
  })
    .filter(({ item, score }) => {
      if (score <= 0) return false;
      if (filters.country && item.country !== filters.country) return false;
      if (filters.visaType && item.visaType !== filters.visaType) return false;
      if (filters.serviceType && item.serviceType !== filters.serviceType)
        return false;
      return true;
    })
    .sort(
      (a, b) =>
        b.score - a.score || a.item.title.localeCompare(b.item.title, "fr")
    )
    .slice(0, limit)
    .map(({ item }) => item);
}
