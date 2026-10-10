/**
 * Traitement opérationnel aligné sur les guides PDF publiés sur le site.
 * Admin, espace client et protocole d’accord doivent résoudre la même fiche
 * (pays + type de visa) et le même PDF de référence.
 */

import { procedures107Complete, type CountryProcedureComplete } from "../client/src/data/procedures107Complete";
import { OFFICIAL_SOURCE_CATALOG } from "./officialSourceCatalog";
import { getAllResources, type PdfResource } from "./pdfResources";

export type PublishedProcedureKind = "travail" | "etudes" | "visiteur";

export type PublishedCountryStep = {
  id: string;
  label: string;
  description: string;
  requiredInputs: string[];
  sourceUrl: string;
};

export type PublishedProcedureTreatment = {
  procedureId: string;
  country: string;
  visaKind: PublishedProcedureKind;
  programLabel: string;
  guideTitle: string;
  pdfUrl: string;
  relatedGuideUrls: string[];
  officialSourceUrl: string;
  countrySteps: PublishedCountryStep[];
  documents: string[];
};

const fold = (value: string | null | undefined) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const CANADA_IRCC = "https://www.canada.ca/fr/services/immigration-citoyennete.html";
const CANADA_WORK = "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada.html";
const CANADA_STUDY = "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada.html";
const CANADA_VISIT = "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/visiter-canada.html";

const LUX_PORTAL = "https://guichet.public.lu/fr/citoyens/immigration.html";
const LUX_WORK = "https://guichet.public.lu/fr/citoyens/immigration/vivre/non-luxembourg/immigration/pays-tiers/salarie.html";
const LUX_STUDY = "https://guichet.public.lu/fr/citoyens/immigration/vivre/non-luxembourg/immigration/pays-tiers/etudiant.html";
const LUX_VISIT = "https://guichet.public.lu/fr/citoyens/immigration/visite/loisir.html";
const LUX_ADEM = "https://adem.public.lu/fr/employeurs/recruter/recruter-international/Embauche-ressortissant-pays-tiers.html";

function officialCatalogUrl(country: string, kind: PublishedProcedureKind): string {
  const key = fold(country);
  const entry = Object.entries(OFFICIAL_SOURCE_CATALOG).find(
    ([slug, record]) => key.includes(slug) || fold(record.country) === key || key.includes(fold(record.country)),
  );
  const sources = entry?.[1]?.sources ?? [];
  if (!sources.length) return "";
  const pick = (patterns: RegExp[]) =>
    sources.find((source) => patterns.some((pattern) => pattern.test(fold(`${source.label} ${source.url}`))))?.url;
  if (kind === "etudes") {
    return pick([/etud|study|student|academ/]) || sources[0].url;
  }
  if (kind === "visiteur") {
    return pick([/visit|touris|court sejour|schengen|visitor/]) || sources[0].url;
  }
  return pick([/travail|work|emploi|salarie|worker|eimt|adem/]) || sources[0].url;
}

function detectVisaKind(visaType?: string | null, procedureLabel?: string | null): PublishedProcedureKind {
  const key = fold(`${visaType || ""} ${procedureLabel || ""}`);
  if (/etud|study|student|academ|admission|permis d etudes/.test(key)) return "etudes";
  if (/visiteur|visitor|touris|schengen|court sejour/.test(key)) return "visiteur";
  if (/travail|work|emploi|worker|lmia|eimt|permis de travail|contrat/.test(key)) return "travail";
  if (/formation|ausbildung|apprentissage/.test(key)) return "etudes";
  return "travail";
}

function step(
  id: string,
  label: string,
  description: string,
  requiredInputs: string[],
  sourceUrl: string,
): PublishedCountryStep {
  return { id, label, description, requiredInputs, sourceUrl };
}

/** Étapes Canada alignées sur les PDF publiés (Visa Travail / Études / guides procédure). */
const CANADA_TREATMENT: Record<PublishedProcedureKind, PublishedCountryStep[]> = {
  travail: [
    step(
      "canada-travail-profil",
      "Évaluation du profil et du métier visé",
      "Contrôler l’expérience, les diplômes, la langue et la cohérence du projet avec le marché canadien, conformément au guide Visa Travail Canada.",
      ["CV actualisé", "Diplômes", "Preuves d’expérience", "Niveau de langue"],
      CANADA_WORK,
    ),
    step(
      "canada-travail-offre",
      "Offre d’emploi ou projet employeur",
      "Documenter l’employeur canadien, le poste, le lieu et les conditions de l’offre avant toute demande de permis.",
      ["Offre d’emploi", "Contrat ou lettre employeur", "Description du poste"],
      CANADA_WORK,
    ),
    step(
      "canada-travail-eimt",
      "EIMT / LMIA ou exemption applicable",
      "Identifier avec l’employeur le volet requis : étude d’impact sur le marché du travail (EIMT/LMIA) ou exemption, selon les règles IRCC / EDSC.",
      ["Référence EIMT ou exemption", "Dossier employeur"],
      CANADA_WORK,
    ),
    step(
      "canada-travail-demande",
      "Demande de permis de travail IRCC",
      "Préparer et déposer la demande de permis de travail sur le portail IRCC avec les formulaires et pièces du guide publié.",
      ["Passeport", "Formulaires IRCC", "Preuves d’emploi", "Photos"],
      CANADA_WORK,
    ),
    step(
      "canada-travail-biometrie",
      "Biométrie et examens médicaux",
      "Suivre les instructions IRCC pour la biométrie et tout examen médical éventuellement exigé.",
      ["Convocation biométrique", "Certificat médical si demandé"],
      CANADA_IRCC,
    ),
    step(
      "canada-travail-decision",
      "Décision IRCC et conditions du permis",
      "Suivre la décision officielle, vérifier l’employeur lié, la durée et les conditions du permis délivré.",
      ["Numéro de demande", "Lettre de décision", "Conditions du permis"],
      CANADA_WORK,
    ),
    step(
      "canada-travail-arrivee",
      "Arrivée et formalités au Canada",
      "Préparer l’entrée, les documents d’arrivée et le respect des conditions du permis de travail.",
      ["Documents d’arrivée", "Adresse au Canada", "Conditions à respecter"],
      CANADA_IRCC,
    ),
  ],
  etudes: [
    step(
      "canada-etudes-projet",
      "Évaluation du projet d’études et du budget",
      "Valider le programme, le niveau, le budget et la cohérence du projet selon le guide Visa Études Canada.",
      ["Projet d’études", "Parcours académique", "Budget prévisionnel"],
      CANADA_STUDY,
    ),
    step(
      "canada-etudes-admission",
      "Admission dans un établissement désigné (DLI)",
      "Obtenir une lettre d’acceptation d’un établissement d’enseignement désigné avant la demande de permis.",
      ["Lettre d’acceptation", "Code DLI", "Détails du programme"],
      CANADA_STUDY,
    ),
    step(
      "canada-etudes-caq",
      "CAQ si le Québec est choisi",
      "Vérifier si un Certificat d’acceptation du Québec est requis avant le permis d’études fédéral.",
      ["CAQ si applicable", "Preuve de ressources Québec"],
      "https://www.quebec.ca/education/etudier-quebec",
    ),
    step(
      "canada-etudes-fonds",
      "Preuve de fonds et dossier documentaire",
      "Réunir les justificatifs financiers, scolaires et d’identité exigés par le guide et le portail IRCC.",
      ["Preuve de fonds", "Diplômes", "Passeport", "Relevés"],
      CANADA_STUDY,
    ),
    step(
      "canada-etudes-demande",
      "Demande de permis d’études IRCC",
      "Déposer la demande de permis d’études avec les pièces du guide PDF publié sur le site.",
      ["Formulaires IRCC", "Lettre d’acceptation", "Preuve de fonds"],
      CANADA_STUDY,
    ),
    step(
      "canada-etudes-biometrie",
      "Biométrie et examens éventuellement requis",
      "Respecter les convocations biométriques et médicales publiées par IRCC.",
      ["Convocation biométrique", "Certificat médical si demandé"],
      CANADA_IRCC,
    ),
    step(
      "canada-etudes-decision",
      "Décision, arrivée et conditions du permis",
      "Suivre la décision officielle et les conditions du permis d’études à l’arrivée au Canada.",
      ["Lettre de décision", "Documents d’arrivée", "Conditions du permis"],
      CANADA_STUDY,
    ),
  ],
  visiteur: [
    step(
      "canada-visite-objet",
      "Objet du séjour et attaches",
      "Clarifier le motif, les dates, les attaches au pays de résidence et la cohérence du séjour temporaire.",
      ["Objet du voyage", "Dates prévues", "Attaches familiales / professionnelles"],
      CANADA_VISIT,
    ),
    step(
      "canada-visite-identite",
      "Identité et passeport",
      "Préparer un passeport valide et les informations personnelles exactes pour la demande.",
      ["Passeport", "État civil", "Adresse"],
      CANADA_VISIT,
    ),
    step(
      "canada-visite-moyens",
      "Hébergement, itinéraire et ressources",
      "Documenter l’hébergement, l’itinéraire et les moyens financiers pour la durée du séjour.",
      ["Itinéraire", "Hébergement", "Preuve de fonds"],
      CANADA_VISIT,
    ),
    step(
      "canada-visite-demande",
      "Demande de visa / AVE selon le cas",
      "Déposer la demande applicable (visa de visiteur ou AVE) selon la nationalité et les instructions IRCC.",
      ["Formulaire", "Photos", "Frais officiels"],
      CANADA_VISIT,
    ),
    step(
      "canada-visite-biometrie",
      "Biométrie si demandée",
      "Suivre la convocation biométrique lorsque IRCC l’exige.",
      ["Convocation biométrique"],
      CANADA_IRCC,
    ),
    step(
      "canada-visite-decision",
      "Décision et conditions d’entrée",
      "Suivre la décision officielle et respecter la durée / les conditions autorisées à l’entrée.",
      ["Numéro de demande", "Décision", "Conditions d’entrée"],
      CANADA_VISIT,
    ),
  ],
};

/** Étapes Luxembourg alignées sur les PDF publiés + Guichet.lu / ADEM. */
const LUXEMBOURG_TREATMENT: Record<PublishedProcedureKind, PublishedCountryStep[]> = {
  travail: [
    step(
      "lux-travail-profil",
      "Évaluation du profil et du métier",
      "Contrôler l’expérience, les diplômes et la cohérence du projet avec le marché luxembourgeois, selon le guide Visa Travail Luxembourg.",
      ["CV actualisé", "Diplômes", "Preuves d’expérience"],
      LUX_WORK,
    ),
    step(
      "lux-travail-employeur",
      "Offre d’emploi / employeur partenaire",
      "Documenter l’employeur, le poste et les conditions avant les formalités ADEM et Direction de l’Immigration.",
      ["Offre d’emploi", "Contrat ou promesse d’embauche", "Description du poste"],
      LUX_ADEM,
    ),
    step(
      "lux-travail-adem",
      "Déclaration de poste vacant ADEM",
      "Suivre avec l’employeur la procédure ADEM d’embauche d’un ressortissant de pays tiers.",
      ["Référence ADEM", "Dossier employeur"],
      LUX_ADEM,
    ),
    step(
      "lux-travail-autorisation",
      "Autorisation de séjour salarié",
      "Préparer le dossier d’autorisation de séjour pour travailleur salarié (pays tiers) via Guichet.lu.",
      ["Passeport", "Contrat", "Justificatifs ADEM", "Photos"],
      LUX_WORK,
    ),
    step(
      "lux-travail-visa",
      "Visa D / dépôt consulaire",
      "Déposer la demande de visa long séjour auprès du poste compétent une fois l’autorisation obtenue.",
      ["Autorisation de séjour", "Passeport", "Rendez-vous consulaire"],
      LUX_PORTAL,
    ),
    step(
      "lux-travail-arrivee",
      "Arrivée et titre de séjour",
      "Accomplir les formalités d’arrivée et de titre de séjour au Luxembourg selon Guichet.lu.",
      ["Documents d’arrivée", "Adresse au Luxembourg", "Titre de séjour"],
      LUX_WORK,
    ),
  ],
  etudes: [
    step(
      "lux-etudes-projet",
      "Projet d’études et établissement",
      "Valider le programme, le budget et l’établissement selon le guide Visa Études Luxembourg.",
      ["Projet d’études", "Parcours académique", "Budget"],
      LUX_STUDY,
    ),
    step(
      "lux-etudes-admission",
      "Admission / inscription",
      "Obtenir la preuve d’admission ou d’inscription dans un établissement d’enseignement au Luxembourg.",
      ["Lettre d’admission", "Preuve d’inscription"],
      LUX_STUDY,
    ),
    step(
      "lux-etudes-fonds",
      "Preuve de moyens et logement",
      "Réunir les justificatifs financiers et d’hébergement exigés pour l’autorisation de séjour étudiant.",
      ["Preuve de fonds", "Hébergement", "Assurance"],
      LUX_STUDY,
    ),
    step(
      "lux-etudes-autorisation",
      "Autorisation de séjour étudiant",
      "Déposer le dossier d’autorisation de séjour pour étudiant (pays tiers) selon Guichet.lu.",
      ["Passeport", "Admission", "Preuve de fonds", "Photos"],
      LUX_STUDY,
    ),
    step(
      "lux-etudes-visa",
      "Visa D / dépôt consulaire",
      "Prendre rendez-vous et déposer la demande de visa long séjour auprès du poste compétent.",
      ["Autorisation", "Passeport", "Rendez-vous"],
      LUX_PORTAL,
    ),
    step(
      "lux-etudes-arrivee",
      "Arrivée et formalités étudiantes",
      "Finaliser l’inscription et les formalités de séjour à l’arrivée.",
      ["Documents d’arrivée", "Adresse", "Titre de séjour"],
      LUX_STUDY,
    ),
  ],
  visiteur: [
    step(
      "lux-visite-objet",
      "Objet et durée du séjour",
      "Clarifier le motif, les dates et la cohérence du court séjour selon le guide Visa Visiteur.",
      ["Objet du voyage", "Dates", "Itinéraire"],
      LUX_VISIT,
    ),
    step(
      "lux-visite-moyens",
      "Ressources, hébergement et attaches",
      "Documenter les moyens, l’hébergement et les attaches au pays de résidence.",
      ["Preuve de fonds", "Hébergement", "Attaches"],
      LUX_VISIT,
    ),
    step(
      "lux-visite-demande",
      "Demande de visa Schengen si requis",
      "Vérifier l’obligation de visa et déposer la demande auprès du poste compétent.",
      ["Formulaire", "Passeport", "Photos", "Assurance voyage"],
      LUX_VISIT,
    ),
    step(
      "lux-visite-biometrie",
      "Biométrie et décision",
      "Suivre la convocation biométrique et la décision consulaire.",
      ["Convocation", "Décision"],
      LUX_PORTAL,
    ),
  ],
};

function findCatalogueProcedure(country: string, kind: PublishedProcedureKind): CountryProcedureComplete | null {
  const countryKey = fold(country);
  return (
    procedures107Complete.find(
      (item) => fold(item.name) === countryKey && item.visaType === kind,
    )
    ?? null
  );
}

function findPdfResources(country: string, kind: PublishedProcedureKind): PdfResource[] {
  const countryKey = fold(country);
  const category = kind === "etudes" ? "etudes" : kind === "visiteur" ? "visiteur" : "travail";
  const all = getAllResources().filter((resource) => fold(resource.country) === countryKey);
  const titleKey = (resource: PdfResource) => fold(resource.title);
  const primary = all.filter((resource) =>
    resource.category === category
    || (kind === "travail" && resource.category === "guide" && /contrat|travail/.test(titleKey(resource)))
  );
  const guides = all.filter((resource) => resource.category === "guide" && (
    (kind === "etudes" && /etud/.test(titleKey(resource)))
    || (kind === "travail" && /travail|contrat/.test(titleKey(resource)))
    || (kind === "visiteur" && /visit|touris/.test(titleKey(resource)))
  ));
  const merged = [...primary, ...guides];
  const seen = new Set<string>();
  return merged.filter((resource) => {
    if (seen.has(resource.url)) return false;
    seen.add(resource.url);
    return Boolean(resource.url);
  });
}

function catalogueStepsAsPublished(
  procedure: CountryProcedureComplete,
  officialSourceUrl: string,
): PublishedCountryStep[] {
  const documentPool = procedure.requiredDocuments.flatMap((group) => group.documents);
  return procedure.steps.map((label, index) => {
    const requiredInputs = documentPool.slice(
      index === 0 ? 0 : Math.max(0, index - 1) * 2,
      index === procedure.steps.length - 1 ? undefined : index * 2 + 2,
    );
    return step(
      `${procedure.id}-step-${index + 1}`,
      label,
      `Étape issue du guide de procédure publié (${procedure.description}). Vérifiez toujours la version et les exigences du portail institutionnel avant dépôt.`,
      requiredInputs.length ? requiredInputs : ["Pièces du guide de procédure"],
      officialSourceUrl || procedure.pdfUrl || "",
    );
  });
}

/**
 * Résout le programme publié (PDF + étapes) pour un pays et un type de visa.
 * Canada : étapes détaillées calquées sur les PDF du site.
 * Autres destinations : étapes du catalogue 107 + URL PDF publiée.
 */
export function resolvePublishedProcedureTreatment(
  destination?: string | null,
  visaType?: string | null,
  procedureLabel?: string | null,
): PublishedProcedureTreatment | null {
  const countryRaw = destination?.trim();
  if (!countryRaw) return null;
  const kind = detectVisaKind(visaType, procedureLabel);
  const countryKey = fold(countryRaw);
  const catalogue = findCatalogueProcedure(countryRaw, kind);
  const pdfResources = findPdfResources(countryRaw, kind);
  const primaryPdf = catalogue?.pdfUrl?.trim() || pdfResources[0]?.url || "";
  if (!catalogue && !primaryPdf && !countryKey.includes("canada")) return null;

  const programLabel =
    kind === "etudes" ? "Visa / permis d’études"
      : kind === "visiteur" ? "Visa visiteur / séjour temporaire"
        : "Visa / permis de travail";

  if (countryKey.includes("canada")) {
    const canadaSteps = CANADA_TREATMENT[kind];
    const guideTitle =
      pdfResources[0]?.title
      || (kind === "etudes"
        ? "Visa Études — Canada 2026"
        : kind === "visiteur"
          ? "Visa Visiteur — Canada"
          : "Visa Travail — Canada Complet 2026");
    const related = pdfResources.map((resource) => resource.url).filter((url) => url && url !== primaryPdf);
    const docs = catalogue?.requiredDocuments.flatMap((group) => group.documents)
      ?? canadaSteps.flatMap((item) => item.requiredInputs);
    return {
      procedureId: catalogue?.id ?? `canada-${kind}`,
      country: "Canada",
      visaKind: kind,
      programLabel,
      guideTitle,
      pdfUrl: primaryPdf || pdfResources[0]?.url || "",
      relatedGuideUrls: related,
      officialSourceUrl: kind === "etudes" ? CANADA_STUDY : kind === "travail" ? CANADA_WORK : CANADA_VISIT,
      countrySteps: canadaSteps,
      documents: Array.from(new Set(docs)),
    };
  }

  if (countryKey.includes("luxembourg")) {
    const luxSteps = LUXEMBOURG_TREATMENT[kind];
    const guideTitle =
      pdfResources[0]?.title
      || (kind === "etudes"
        ? "Visa Études — Luxembourg 2026"
        : kind === "visiteur"
          ? "Visa Visiteur — Luxembourg"
          : "Visa Travail — Luxembourg 2026");
    const related = pdfResources.map((resource) => resource.url).filter((url) => url && url !== primaryPdf);
    const docs = catalogue?.requiredDocuments.flatMap((group) => group.documents)
      ?? luxSteps.flatMap((item) => item.requiredInputs);
    return {
      procedureId: catalogue?.id ?? `luxembourg-${kind}`,
      country: "Luxembourg",
      visaKind: kind,
      programLabel,
      guideTitle,
      pdfUrl: primaryPdf || pdfResources[0]?.url || "",
      relatedGuideUrls: related,
      officialSourceUrl: kind === "etudes" ? LUX_STUDY : kind === "travail" ? LUX_WORK : LUX_VISIT,
      countrySteps: luxSteps,
      documents: Array.from(new Set(docs)),
    };
  }

  if (!catalogue) return null;
  const officialSourceUrl = officialCatalogUrl(catalogue.name, kind) || catalogue.pdfUrl || "";
  return {
    procedureId: catalogue.id,
    country: catalogue.name,
    visaKind: kind,
    programLabel: `${catalogue.name} · ${programLabel}`,
    guideTitle: catalogue.description || `${catalogue.name} — ${programLabel}`,
    pdfUrl: catalogue.pdfUrl || pdfResources[0]?.url || "",
    relatedGuideUrls: pdfResources.map((resource) => resource.url).filter((url) => url && url !== catalogue.pdfUrl),
    officialSourceUrl,
    countrySteps: catalogueStepsAsPublished(catalogue, officialSourceUrl),
    documents: catalogue.requiredDocuments.flatMap((group) => group.documents),
  };
}

export function publishedProcedureKindLabel(kind: PublishedProcedureKind): string {
  if (kind === "etudes") return "Études";
  if (kind === "visiteur") return "Visiteur";
  return "Travail";
}
