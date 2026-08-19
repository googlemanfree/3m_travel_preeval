import { evisasDatabaseComplete } from "@/data/evisasDatabaseComplete";
import { OFFICIAL_CONSULAR_PORTALS } from "@/data/officialConsularPortals";
import { getAllResources, type PdfResource } from "@shared/pdfResources";
import { CONSULAR_REGISTRY } from "../../../server/consularRegistry";

export type PortalVerificationStatus = "verifie" | "a_completer";

export type AdminConsularCatalogEntry = {
  countryCode: string;
  countryName: string;
  region: string;
  officialPortalUrl?: string;
  officialPortalLabel?: string;
  evisaUrl?: string;
  officialVerifiedAt?: string;
  verificationStatus: PortalVerificationStatus;
  resources: PdfResource[];
  procedures: string[];
  sourceSummary: string;
};

const genericResourceCountries = new Set(["multi-destinations", "espace schengen", "arménie / schengen"]);

const aliases: Record<string, string> = {
  "dubaï / eau": "Émirats Arabes Unis",
  "rép. tchèque": "République tchèque",
};

const normalize = (value: string) => value
  .trim()
  .toLocaleLowerCase("fr")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const displayCountry = (country: string) => aliases[country.trim().toLocaleLowerCase("fr")] ?? country.trim();

const regionForCountry = (country: string, fallback?: string) => {
  if (fallback) return fallback;
  const key = normalize(country);
  if (["canada", "etats-unis"].includes(key)) return "Amérique du Nord";
  if (["allemagne", "autriche", "belgique", "bulgarie", "croatie", "danemark", "espagne", "estonie", "finlande", "france", "grece", "hongrie", "italie", "lettonie", "liechtenstein", "lituanie", "luxembourg", "malte", "norvege", "pays-bas", "pologne", "portugal", "republique-tcheque", "slovaquie", "slovenie", "suede", "suisse", "islande"].includes(key)) return "Europe / Schengen";
  if (["australie", "nouvelle-zelande"].includes(key)) return "Océanie";
  if (["qatar", "emirats-arabes-unis", "turquie", "azerbaidjan"].includes(key)) return "Moyen-Orient";
  return "International";
};

const resourcesByCountry = getAllResources().reduce<Record<string, PdfResource[]>>((accumulator, resource) => {
  const country = displayCountry(resource.country);
  if (genericResourceCountries.has(country.toLocaleLowerCase("fr"))) return accumulator;
  const key = normalize(country);
  accumulator[key] = [...(accumulator[key] ?? []), resource];
  return accumulator;
}, {});

const legacyByCountry = new Map(CONSULAR_REGISTRY.map((entry) => [normalize(entry.countryName.replace(" (Dubaï)", "")), entry]));
const evisaByCountry = new Map(evisasDatabaseComplete.map((entry) => [normalize(displayCountry(entry.country)), entry]));
const allCountryKeys = Array.from(new Set([...Object.keys(resourcesByCountry), ...Array.from(evisaByCountry.keys()), ...Array.from(legacyByCountry.keys())]));

const labelForResource = (resource: PdfResource) => {
  if (resource.category === "travail") return "Travail";
  if (resource.category === "etudes") return "Études";
  if (resource.category === "visiteur") return "Visiteur / Tourisme";
  if (resource.category === "formulaire") return "Formulaire officiel";
  return "Guide / procédure";
};

export const ADMIN_CONSULAR_CATALOG: AdminConsularCatalogEntry[] = allCountryKeys
  .map((key) => {
    const resources = resourcesByCountry[key] ?? [];
    const evisa = evisaByCountry.get(key);
    const legacy = legacyByCountry.get(key);
    const countryName = displayCountry(resources[0]?.country ?? evisa?.country ?? legacy?.countryName ?? key);
    const procedures = Array.from(new Set<string>([...resources.map(labelForResource), ...(evisa ? [evisa.type] : [])]));
    const researchedPortal = OFFICIAL_CONSULAR_PORTALS[key];
    const officialPortalUrl = evisa?.officialPortalUrl ?? researchedPortal?.url ?? legacy?.officialPortalUrl;
    const officialPortalLabel = evisa?.officialPortalLabel ?? researchedPortal?.label ?? (legacy ? "Portail officiel visa / immigration" : undefined);
    const evisaUrl = evisa?.officialPortalUrl ?? legacy?.evisaUrl;
    const officialVerifiedAt = evisa?.officialVerifiedAt ?? researchedPortal?.verifiedAt;
    const verificationStatus: PortalVerificationStatus = officialPortalUrl ? "verifie" : "a_completer";
    return {
      countryCode: evisa?.id ?? legacy?.countryCode ?? key,
      countryName,
      region: regionForCountry(countryName, evisa?.region ?? legacy?.region),
      officialPortalUrl,
      officialPortalLabel,
      evisaUrl,
      officialVerifiedAt,
      verificationStatus,
      resources,
      procedures,
      sourceSummary: resources.length ? `${resources.length} guide${resources.length > 1 ? "s" : ""} 3M associé${resources.length > 1 ? "s" : ""}` : "Portail e‑Visa référencé",
    };
  })
  .sort((left, right) => left.countryName.localeCompare(right.countryName, "fr"));

export const ADMIN_CONSULAR_RESOURCE_TOTAL = getAllResources().length;
