import { evisasDatabaseComplete } from "@/data/evisasDatabaseComplete";
import { getAllResources, type PdfResource } from "@shared/pdfResources";
import type { EvaluationProjectType, ProjectDetailField } from "./projectEvaluationConfig";

export type ProcedureGuide = {
  id: string;
  country: string;
  flag: string;
  projectType: EvaluationProjectType;
  procedureLabel: string;
  guideTitle: string;
  guideUrl: string;
  guideType: "pdf" | "docx";
  source: "bibliotheque_3m" | "portail_evisa";
  officialPortalUrl?: string;
  officialPortalLabel?: string;
  officialVerifiedAt?: string;
};

const resourceProjectType: Record<PdfResource["category"], EvaluationProjectType | null> = {
  travail: "travail",
  etudes: "etudes",
  visiteur: "tourisme",
  guide: null,
  formulaire: null,
};

const countryAliases: Record<string, string> = {
  "dubaï / eau": "Émirats arabes unis",
  "rép. tchèque": "République tchèque",
  "arménie / schengen": "Arménie",
  "espace schengen": "Espace Schengen",
};

const normalize = (value: string) => value
  .trim()
  .toLocaleLowerCase("fr")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

export const normalizeDestinationCountry = (country: string) =>
  countryAliases[country.trim().toLocaleLowerCase("fr")] ?? country.trim();

function resourceToProcedure(resource: PdfResource): ProcedureGuide | null {
  const projectType = resourceProjectType[resource.category];
  if (!projectType) return null;

  return {
    id: `guide-${resource.id}`,
    country: normalizeDestinationCountry(resource.country),
    flag: resource.flag,
    projectType,
    procedureLabel: projectType === "travail" ? "Visa Travail" : projectType === "etudes" ? "Visa Études" : "Visa Visiteur / Tourisme",
    guideTitle: resource.title,
    guideUrl: resource.url,
    guideType: resource.type,
    source: "bibliotheque_3m",
  };
}

const libraryProcedures = getAllResources()
  .map(resourceToProcedure)
  .filter((entry): entry is ProcedureGuide => Boolean(entry));

const evisaProcedures: ProcedureGuide[] = evisasDatabaseComplete.map((destination) => ({
  id: `evisa-${destination.id}`,
  country: normalizeDestinationCountry(destination.country),
  flag: destination.flag || "🌐",
  projectType: "evisa",
  procedureLabel: destination.type || "e‑Visa / autorisation de voyage",
  guideTitle: `Procédure ${destination.type || "e‑Visa"} — ${destination.country}`,
  guideUrl: destination.officialPortalUrl ?? "",
  guideType: "pdf",
  source: "portail_evisa",
  officialPortalUrl: destination.officialPortalUrl,
  officialPortalLabel: destination.officialPortalLabel,
  officialVerifiedAt: destination.officialVerifiedAt,
}));

const immigrationProcedures: ProcedureGuide[] = [
  {
    id: "immigration-canada",
    country: "Canada",
    flag: "🍁",
    projectType: "immigration",
    procedureLabel: "Résidence permanente et programmes économiques",
    guideTitle: "Dossier Client Immigration 2026",
    guideUrl: "/manus-storage/3MTravel_DossierClient_Immigration_2026_a445cced.docx",
    guideType: "docx",
    source: "bibliotheque_3m",
  },
  {
    id: "immigration-australie",
    country: "Australie",
    flag: "🇦🇺",
    projectType: "immigration",
    procedureLabel: "Résidence permanente",
    guideTitle: "Résidence Permanente — Australie (FR)",
    guideUrl: "/manus-storage/3MTravel_RP_Australie_FR_009b820d.pdf",
    guideType: "pdf",
    source: "bibliotheque_3m",
  },
  {
    id: "immigration-nouvelle-zelande",
    country: "Nouvelle-Zélande",
    flag: "🇳🇿",
    projectType: "immigration",
    procedureLabel: "Résidence permanente",
    guideTitle: "Résidence Permanente — Nouvelle-Zélande (FR)",
    guideUrl: "/manus-storage/3MTravel_RP_NouvelleZelande_FR_772f66e4.pdf",
    guideType: "pdf",
    source: "bibliotheque_3m",
  },
];

export const destinationProcedures: ProcedureGuide[] = [
  ...libraryProcedures,
  ...evisaProcedures,
  ...immigrationProcedures,
];

export const getCountriesForProject = (projectType: EvaluationProjectType): string[] =>
  Array.from(new Set(destinationProcedures
    .filter((procedure) => procedure.projectType === projectType)
    .map((procedure) => procedure.country)))
    .sort((left, right) => left.localeCompare(right, "fr"));

export type DestinationOption = { country: string; flag: string };

export const getDestinationOptionsForProject = (projectType: EvaluationProjectType): DestinationOption[] => {
  const options = new Map<string, DestinationOption>();
  destinationProcedures.filter((procedure) => procedure.projectType === projectType).forEach((procedure) => {
    const key = normalize(procedure.country);
    if (!options.has(key)) options.set(key, { country: procedure.country, flag: procedure.flag || "🌐" });
  });
  return Array.from(options.values()).sort((left, right) => left.country.localeCompare(right.country, "fr"));
};

export const getProceduresForCountry = (projectType: EvaluationProjectType, country: string): ProcedureGuide[] => {
  const normalizedCountry = normalize(normalizeDestinationCountry(country));
  return destinationProcedures.filter((procedure) =>
    procedure.projectType === projectType && normalize(procedure.country) === normalizedCountry,
  );
};

export const getProcedureById = (procedureId: string | undefined): ProcedureGuide | undefined =>
  destinationProcedures.find((procedure) => procedure.id === procedureId);

export const getSuggestedDestinationCategory = (country: string): "canada" | "schengen" | "autre" => {
  if (normalize(country) === "canada") return "canada";
  const schengenCountries = new Set([
    "allemagne", "autriche", "belgique", "bulgarie", "croatie", "danemark", "espagne", "estonie", "finlande", "france", "grece", "hongrie", "italie", "lettonie", "liechtenstein", "lituanie", "luxembourg", "malte", "norvege", "pays-bas", "pologne", "portugal", "republique-tcheque", "slovaquie", "slovenie", "suede", "suisse",
  ]);
  return schengenCountries.has(normalize(country)) ? "schengen" : "autre";
};

const field = (key: string, label: string, options?: ProjectDetailField["options"]): ProjectDetailField => ({
  key,
  label,
  kind: options ? "select" : "text",
  required: true,
  options,
});

const hasCanadaStudyFields = (projectType: EvaluationProjectType, country: string) => projectType === "etudes" && normalize(country) === "canada";
const hasCanadaWorkFields = (projectType: EvaluationProjectType, country: string) => projectType === "travail" && normalize(country) === "canada";
const isSchengenVisit = (projectType: EvaluationProjectType, country: string) => projectType === "tourisme" && getSuggestedDestinationCategory(country) === "schengen";

export const getCountryProcedureFields = (projectType: EvaluationProjectType, country: string, procedure?: ProcedureGuide): ProjectDetailField[] => {
  const selectedCountry = normalizeDestinationCountry(country);
  const shared: ProjectDetailField[] = procedure ? [
    {
      key: "selectedProcedure",
      label: "Procédure sélectionnée",
      kind: "text",
      required: true,
      placeholder: procedure?.procedureLabel ?? "Sélectionnez une procédure",
    },
  ] : [];

  if (projectType === "evisa") {
    return [
      ...shared,
      field("passportIssuingCountry", "Pays de délivrance du passeport"),
      field("passportType", "Type de passeport", [{ value: "ordinaire", label: "Ordinaire" }, { value: "service", label: "Service / officiel" }, { value: "diplomatique", label: "Diplomatique" }]),
      field("entryPurpose", "Motif d’entrée", [{ value: "tourisme", label: "Tourisme" }, { value: "affaires", label: "Affaires" }, { value: "visite", label: "Visite" }, { value: "transit", label: "Transit" }, { value: "autre", label: "Autre" }]),
      field("arrivalPoint", "Point d’arrivée envisagé"),
    ];
  }

  if (hasCanadaStudyFields(projectType, selectedCountry)) {
    return [
      ...shared,
      field("canadaDli", "Établissement ou DLI visé"),
      field("letterOfAcceptance", "Lettre d’acceptation", [{ value: "recue", label: "Reçue" }, { value: "en_cours", label: "Demande en cours" }, { value: "non", label: "Pas encore" }]),
      field("provincialAttestation", "Lettre d’attestation provinciale (si applicable)", [{ value: "recue", label: "Reçue" }, { value: "en_cours", label: "En cours" }, { value: "a_verifier", label: "À vérifier" }]),
    ];
  }

  if (hasCanadaWorkFields(projectType, selectedCountry)) {
    return [
      ...shared,
      field("canadaJobOffer", "Offre d’emploi canadienne", [{ value: "signee", label: "Signée" }, { value: "en_discussion", label: "En discussion" }, { value: "aucune", label: "Aucune" }]),
      field("employerCompliance", "Référence employeur ou conformité (si disponible)"),
      field("workPermitRoute", "Voie de permis de travail envisagée", [{ value: "employeur", label: "Avec employeur" }, { value: "mobilite", label: "Mobilité internationale" }, { value: "a_evaluer", label: "À évaluer" }]),
    ];
  }

  if (isSchengenVisit(projectType, selectedCountry)) {
    return [
      ...shared,
      field("schengenEntryCountry", "Premier pays d’entrée Schengen"),
      field("schengenInsurance", "Assurance voyage conforme", [{ value: "deja_souscrite", label: "Déjà souscrite" }, { value: "a_souscrire", label: "À souscrire" }]),
      field("schengenStayProof", "Preuve d’hébergement principale", [{ value: "hotel", label: "Réservation d’hôtel" }, { value: "invitation", label: "Invitation / attestation d’accueil" }, { value: "autre", label: "Autre justificatif" }]),
    ];
  }

  return shared;
};
