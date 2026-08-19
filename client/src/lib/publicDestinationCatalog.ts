import { ADMIN_CONSULAR_CATALOG, type AdminConsularCatalogEntry } from "@/lib/adminConsularCatalog";
import { evisasDatabaseComplete } from "@/data/evisasDatabaseComplete";
import { procedures107Complete, type CountryProcedureComplete } from "@/data/procedures107Complete";

export type PublicDestinationDetail = {
  procedure: CountryProcedureComplete;
  sources: AdminConsularCatalogEntry["resources"];
  consular: Pick<
    AdminConsularCatalogEntry,
    "countryCode" | "officialPortalUrl" | "officialPortalLabel" | "officialVerifiedAt" | "verificationStatus" | "sourceSummary"
  >;
};

const normalizeDestination = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/duba[iï]\s*\/?\s*eau|emirats-arabes-unis-?dubai/g, "emirats-arabes-unis")
    .replace(/rep-?tcheque/g, "republique-tcheque")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

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

const detailFromProcedure = (procedure: CountryProcedureComplete): PublicDestinationDetail => {
  const consular = consularForCountry(procedure.name);
  return {
    procedure,
    sources: consular?.resources ?? [],
    consular: {
      countryCode: consular?.countryCode ?? normalizeDestination(procedure.name),
      officialPortalUrl: consular?.officialPortalUrl,
      officialPortalLabel: consular?.officialPortalLabel,
      officialVerifiedAt: consular?.officialVerifiedAt,
      verificationStatus: consular?.verificationStatus ?? "a_completer",
      sourceSummary: consular?.sourceSummary ?? "Guide 3M associé à la procédure",
    },
  };
};

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

export const getPublicDestinationDetail = (id?: string) =>
  PUBLIC_DESTINATION_DETAILS.find((detail) => detail.procedure.id === id);

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
