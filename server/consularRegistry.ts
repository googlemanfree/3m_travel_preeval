/**
 * Registre Officiel des Liens Consulaires et des Procédures — 3M Travel & Services
 * Permet aux administrateurs d'accéder en un clic aux portails officiels des consulats et e-visas mondiaux.
 */

export interface ConsularEntry {
  countryCode: string;
  countryName: string;
  region: string;
  officialPortalUrl: string;
  evisaUrl?: string;
  visaRequirementsSummary: string;
  processingTimeDays: number;
  officialFeesUsd: number;
}

export const CONSULAR_REGISTRY: ConsularEntry[] = [
  {
    countryCode: "ca",
    countryName: "Canada",
    region: "Amérique du Nord",
    officialPortalUrl: "https://www.canada.ca/fr/services/immigration-citoyennete.html",
    evisaUrl: "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/viser-canada/ave.html",
    visaRequirementsSummary: "Passeport biométrique valide, données biométriques, passeport en cours de validité et preuves de fonds.",
    processingTimeDays: 14,
    officialFeesUsd: 100,
  },
  {
    countryCode: "lu",
    countryName: "Luxembourg",
    region: "Europe Schengen",
    officialPortalUrl: "https://maee.gouvernement.lu/fr/services-aux-citoyens/visa-immigration.html",
    evisaUrl: "https://guichet.public.lu/fr/citoyens/immigration.html",
    visaRequirementsSummary: "Formulaire Schengen, assurance voyage 30k€, hébergement attesté, ressources financières suffisantes.",
    processingTimeDays: 15,
    officialFeesUsd: 85,
  },
  {
    countryCode: "fr",
    countryName: "France",
    region: "Europe Schengen",
    officialPortalUrl: "https://france-visas.gouv.fr/",
    evisaUrl: "https://france-visas.gouv.fr/web/france-visas/",
    visaRequirementsSummary: "Formulaire France-Visas, justificatif d'hébergement, attestation de voyage et ressources.",
    processingTimeDays: 15,
    officialFeesUsd: 90,
  },
  {
    countryCode: "us",
    countryName: "États-Unis",
    region: "Amérique du Nord",
    officialPortalUrl: "https://www.ustraveldocs.com/",
    evisaUrl: "https://ceac.state.gov/genniv/",
    visaRequirementsSummary: "Formulaire DS-160, entretien consulaire, passeport valide au moins 6 mois après le séjour.",
    processingTimeDays: 30,
    officialFeesUsd: 185,
  },
  {
    countryCode: "ae",
    countryName: "Émirats Arabes Unis (Dubaï)",
    region: "Moyen-Orient",
    officialPortalUrl: "https://u.ae/en/information-and-services/visa-and-emirates-id",
    evisaUrl: "https://smartservices.icp.gov.ae/",
    visaRequirementsSummary: "Copie couleur du passeport, photo d'identité récente sur fond blanc, billet d'avion aller-retour.",
    processingTimeDays: 4,
    officialFeesUsd: 95,
  },
  {
    countryCode: "gb",
    countryName: "Royaume-Uni",
    region: "Europe",
    officialPortalUrl: "https://www.gov.uk/browse/visas-immigration",
    evisaUrl: "https://www.gov.uk/standard-visitor",
    visaRequirementsSummary: "Passeport en cours de validité, relevés bancaires sur 6 mois, traduction assermentée des documents.",
    processingTimeDays: 21,
    officialFeesUsd: 135,
  },
];

export function getConsularEntry(countryCode: string): ConsularEntry | undefined {
  return CONSULAR_REGISTRY.find(c => c.countryCode.toLowerCase() === countryCode.toLowerCase());
}
