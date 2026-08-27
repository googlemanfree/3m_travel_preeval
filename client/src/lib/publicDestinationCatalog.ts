import { ADMIN_CONSULAR_CATALOG, type AdminConsularCatalogEntry } from "@/lib/adminConsularCatalog";
import { evisasDatabaseComplete } from "@/data/evisasDatabaseComplete";
import { procedures107Complete, type CountryProcedureComplete } from "@/data/procedures107Complete";

export type PublicDestinationDetail = {
  procedure: CountryProcedureComplete;
  sources: AdminConsularCatalogEntry["resources"];
  lastUpdatedAt: string;
  lastUpdatedIso: string;
  consular: Pick<
    AdminConsularCatalogEntry,
    "countryCode" | "officialPortalUrl" | "officialPortalLabel" | "officialVerifiedAt" | "verificationStatus" | "sourceSummary"
  >;
};

const normalizeDestination = (value: string) => {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // La valeur de route peut ne pas être encodée : poursuivre avec sa forme reçue.
  }
  return decoded
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/duba[iï]\s*\/?\s*eau|emirats-arabes-unis-?dubai/g, "emirats-arabes-unis")
    .replace(/rep-?tcheque/g, "republique-tcheque")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const destinationSearchSynonyms: Record<string, readonly string[]> = {
  allemagne: ["germany", "deutschland"],
  belgique: ["belgium"],
  canada: ["canadien", "canadian"],
  "coree-du-sud": ["south korea", "korea"],
  "cote-d-ivoire": ["ivory coast", "ivoire"],
  egypte: ["egypt"],
  "emirats-arabes-unis": ["dubai", "dubaï", "eau", "uae", "united arab emirates"],
  espagne: ["spain"],
  ethiopie: ["ethiopia"],
  "etats-unis": ["usa", "united states", "america", "amerique"],
  italie: ["italy"],
  japon: ["japan"],
  "nouvelle-zelande": ["new zealand", "nz"],
  "pays-bas": ["hollande", "holland", "netherlands"],
  "republique-tcheque": ["tchequie", "czech republic", "czechia"],
  "royaume-uni": ["angleterre", "england", "uk", "grande-bretagne", "united kingdom"],
  "sri-lanka": ["ceylan", "ceylon"],
  turquie: ["turkey", "turkiye", "türkiye"],
};

export const normalizePublicDestinationSearchTerm = (value: string) => normalizeDestination(value);

export const getPublicDestinationSearchTerms = (procedure: Pick<CountryProcedureComplete, "id" | "name">) => [
  procedure.name,
  procedure.id,
  ...(destinationSearchSynonyms[normalizeDestination(procedure.name)] ?? []),
];

const categoryToVisaType = {
  travail: "travail",
  etudes: "etudes",
  visiteur: "visiteur",
} as const;

const consularForCountry = (countryName: string) => {
  const key = normalizeDestination(countryName);
  return ADMIN_CONSULAR_CATALOG.find(
    (entry) => normalizeDestination(entry.countryName) === key || normalizeDestination(entry.countryCode) === key,
  );
};

const guideMatchesProcedure = (
  procedure: Pick<CountryProcedureComplete, "visaType">,
  resource: { category: string; title: string },
) => {
  if (resource.category === procedure.visaType) return true;
  if (resource.category !== "guide") return false;

  const title = normalizeDestination(resource.title);
  const hints = procedure.visaType === "travail"
    ? ["travail", "emploi", "contrat"]
    : procedure.visaType === "etudes"
      ? ["etudes", "formation", "universite"]
      : ["visiteur", "tourisme", "evisa", "voyage"];
  return hints.some((hint) => title.includes(hint));
};

const detailFromProcedure = (procedure: CountryProcedureComplete): PublicDestinationDetail => {
  const consular = consularForCountry(procedure.name);
  const sources = (consular?.resources ?? []).filter((resource) => guideMatchesProcedure(procedure, resource));
  return {
    procedure,
    sources,
    lastUpdatedAt: consular?.officialVerifiedAt ?? "19 août 2026",
    lastUpdatedIso: "2026-08-19",
    consular: {
      countryCode: consular?.countryCode ?? normalizeDestination(procedure.name),
      officialPortalUrl: consular?.officialPortalUrl,
      officialPortalLabel: consular?.officialPortalLabel,
      officialVerifiedAt: consular?.officialVerifiedAt,
      verificationStatus: consular?.verificationStatus ?? "a_completer",
      sourceSummary: sources.length
        ? `${sources.length} guide${sources.length > 1 ? "s" : ""} 3M associé${sources.length > 1 ? "s" : ""} à cette procédure`
        : "Guide 3M en cours de consolidation pour cette procédure",
    },
  };
};

export const getGuideLastUpdatedAt = (resource: { title: string }) => {
  const year = resource.title.match(/20\d{2}/)?.[0];
  return year ? `Mis à jour en ${year} — vérifié le 19 août 2026` : "Vérifié le 19 août 2026";
};

export const isRecentlyUpdated = (isoDate: string, days = 45) => {
  const timestamp = new Date(`${isoDate}T00:00:00`).getTime();
  return Number.isFinite(timestamp) && Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
};

export const isDestinationRecentlyUpdated = (detail: PublicDestinationDetail) => isRecentlyUpdated(detail.lastUpdatedIso);

// Les 91 procédures documentées sont complétées par 16 destinations e‑Visa
// déjà référencées avec leurs exigences. Cela constitue les 107 fiches publiques.
const E_VISA_PAGE_IDS = new Set([
  "egypte",
  "tanzanie",
  "maroc",
  "ethiopie",
  "ouganda",
  "rwanda",
  "djibouti",
  "dubai",
  "turquie",
  "inde",
  "vietnam",
  "cambodge",
  "srilanka",
  "albanie",
  "bahrein",
  "oman",
]);

const evisaProcedures: CountryProcedureComplete[] = evisasDatabaseComplete
  .filter((destination) => E_VISA_PAGE_IDS.has(destination.id))
  .map((destination) => ({
    id: `${destination.id}-evisa`,
    name: destination.country.replace(" (Dubaï)", ""),
    flag: destination.flag,
    region: destination.region,
    visaType: "visiteur" as const,
    pdfUrl: "",
    description: destination.note,
    detailedDescription: destination.culture,
    processingTime: destination.delay,
    cost: destination.fee,
    minSalary: undefined,
    totalCost: "Selon les frais officiels en vigueur",
    difficulty: "moyen" as const,
    highlights: destination.highlights,
    steps: destination.steps,
    requiredDocuments: [
      {
        category: "Pièces indiquées pour cette procédure",
        documents: destination.docs.split(",").map((document) => document.trim()).filter(Boolean),
      },
    ],
  }));

export const PUBLIC_DESTINATION_DETAILS: PublicDestinationDetail[] = [
  ...procedures107Complete,
  ...evisaProcedures,
].map(detailFromProcedure);

export const PUBLIC_DESTINATION_PAGE_COUNT = PUBLIC_DESTINATION_DETAILS.length;

/**
 * Résout les identifiants canoniques, les anciennes URL à base de nom de pays
 * et les variantes encodées. La page de détail ne doit jamais dépendre d'une
 * correspondance littérale fragile provenant d'un ancien bouton ou d'une URL
 * enregistrée dans les favoris.
 */
export const getPublicDestinationDetail = (id?: string) => {
  if (!id) return undefined;
  const normalizedId = normalizeDestination(id);

  return (
    PUBLIC_DESTINATION_DETAILS.find((detail) => detail.procedure.id === id) ??
    PUBLIC_DESTINATION_DETAILS.find((detail) => normalizeDestination(detail.procedure.id) === normalizedId) ??
    PUBLIC_DESTINATION_DETAILS.find((detail) => normalizeDestination(detail.procedure.name) === normalizedId)
  );
};

export const getPublicDestinationPath = (idOrName: string) => {
  const detail = getPublicDestinationDetail(idOrName);
  return detail ? `/procedures/${detail.procedure.id}` : "/procedures";
};

export const getDestinationDetailForResource = (resource: { country: string; category: string }) => {
  const countryKey = normalizeDestination(resource.country);
  const expectedVisaType = categoryToVisaType[resource.category as keyof typeof categoryToVisaType];
  return (
    PUBLIC_DESTINATION_DETAILS.find(
      (detail) =>
        normalizeDestination(detail.procedure.name) === countryKey &&
        (!expectedVisaType || detail.procedure.visaType === expectedVisaType),
    ) ??
    PUBLIC_DESTINATION_DETAILS.find((detail) => normalizeDestination(detail.procedure.name) === countryKey)
  );
};

export const getDestinationDetailForProcedure = (countryName: string, visaType?: string) =>
  PUBLIC_DESTINATION_DETAILS.find(
    (detail) =>
      normalizeDestination(detail.procedure.name) === normalizeDestination(countryName) &&
      (!visaType || detail.procedure.visaType === ({
        travail: "travail",
        études: "etudes",
        etudes: "etudes",
        visiteur: "visiteur",
      } as Record<string, "travail" | "etudes" | "visiteur">)[visaType.toLocaleLowerCase("fr")]),
  ) ?? PUBLIC_DESTINATION_DETAILS.find((detail) => normalizeDestination(detail.procedure.name) === normalizeDestination(countryName));
