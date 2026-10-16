import { getCountryById, procedures107Complete, type CountryProcedureComplete } from "../data/procedures107Complete";
import { getEvaluationDocumentRequirements, type EvaluationProjectType } from "../data/evaluationDocumentCatalogue";
import { MAX_CHECKLIST_DOCUMENTS, capDocumentList } from "@shared/documentLimits";
import { normalizePublicEvaluationProject } from "@shared/evaluationFormRequirements";

/**
 * Logique pure de la checklist documentaire (pièces attendues selon le pays et le type de visa, état de chaque pièce) :
 * partagée par l'espace client, la carte « Votre prochaine étape » et les relances automatiques du serveur.
 */
export type ChecklistDocument = {
  documentType?: string | null;
  documentName?: string | null;
  verificationStatus?: string | null;
  status?: string | null;
};

export type Requirement = { category: string; label: string; detail?: string; priority?: string };
export type CustomRequirement = {
  id: number;
  documentType: string;
  status: "pending" | "received" | "approved" | "rejected" | "waived";
  dueAt?: Date | string | null;
  adminComment?: string | null;
};

/** Socle de préparation (≤ 16) lorsque destination/projet ne sont pas encore précisés. */
export const FALLBACK_REQUIREMENTS: Requirement[] = [
  { category: "Identité", label: "Passeport valide", detail: "Page d’identité lisible, validité couvrant le séjour prévu." },
  { category: "Identité", label: "Photo d’identité", detail: "Photo récente aux normes du pays de destination." },
  { category: "Identité", label: "Pièce d’identité nationale", detail: "CNI ou document d’identité en cours de validité." },
  { category: "État civil", label: "Acte de naissance", detail: "Copie lisible ; traduction si exigée plus tard." },
  { category: "État civil", label: "Acte de mariage ou célibat", detail: "Selon votre situation familiale et la procédure." },
  { category: "Domicile", label: "Justificatif de domicile", detail: "Facture, bail ou attestation d’hébergement récente." },
  { category: "Financier", label: "Justificatifs de ressources", detail: "Relevés bancaires ou preuves de moyens adaptés au projet." },
  { category: "Financier", label: "Relevés bancaires récents", detail: "Généralement les 3 derniers mois, selon le pays." },
  { category: "Profil", label: "CV à jour", detail: "Parcours, expériences et dates cohérents avec le projet." },
  { category: "Profil", label: "Diplômes et attestations", detail: "Copies des diplômes et certificats utiles." },
  { category: "Profil", label: "Justificatifs d’expérience", detail: "Attestations d’emploi ou références professionnelles." },
  { category: "Voyage", label: "Itinéraire et motif de séjour", detail: "Calendrier réaliste et motif du séjour." },
  { category: "Voyage", label: "Assurance voyage", detail: "Couverture médicale lorsque la procédure l’exige." },
  { category: "Sécurité", label: "Casier judiciaire / extrait", detail: "À préparer uniquement si le pays le demande." },
  { category: "Santé", label: "Certificat médical / biométrie", detail: "Uniquement lorsque l’autorité compétente le demande." },
  { category: "Projet", label: "Coordonnées et résumé du projet", detail: "Destination, objectif et éléments déjà disponibles." },
];

export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** procedures107Complete utilise "visiteur", le catalogue d'évaluation utilise "tourisme" pour le même parcours. */
export function projectTypeToVisaType(projectType: EvaluationProjectType): CountryProcedureComplete["visaType"] {
  return projectType === "tourisme" ? "visiteur" : projectType;
}

export function resolveProcedure(destination?: string | null, projectType?: string | null) {
  if (!destination) return undefined;
  const key = normalize(destination);
  const resolvedType = isProjectType(projectType) ? projectType : normalizePublicEvaluationProject(projectType);
  if (resolvedType) {
    const visaType = projectTypeToVisaType(resolvedType);
    const exactMatch = procedures107Complete.find((country) => normalize(country.id) === `${key}-${visaType}` || (normalize(country.name) === key && country.visaType === visaType));
    if (exactMatch) return exactMatch;
  }
  // Sans type de projet : ne pas prendre le premier *-travail du catalogue (ambigu).
  const matches = procedures107Complete.filter((country) => {
    const countryKey = normalize(country.id);
    return countryKey.startsWith(`${key}-`) || normalize(country.name) === key;
  });
  if (matches.length === 1) return matches[0];
  if (!resolvedType && matches.length > 1) return undefined;
  return getCountryById(destination) ?? matches[0];
}

export function isProjectType(value?: string | null): value is EvaluationProjectType {
  return value === "travail" || value === "etudes" || value === "tourisme";
}

/** Thème générique d'une pièce, pour éviter de répéter la même idée sous deux formulations (ex: "Passeport
 * en cours de validité" côté socle générique et "Passeport valide" côté données pays). Retourne null pour
 * les pièces sans équivalent générique connu (ex: "Certificat de parrainage") : celles-ci ne sont jamais filtrées. */
export function requirementTheme(label: string): string | null {
  const target = normalize(label);
  if (target.includes("passeport") || target.includes("passport")) return "passeport";
  if (target.includes("photo")) return "photo";
  if (/(^| )cv( |$)/.test(target) || target.includes("curriculum")) return "cv";
  if (target.includes("diplome") || target.includes("releve")) return "diplome";
  if (target.includes("naissance")) return "naissance";
  if (target.includes("domicile") || target.includes("residence") || target.includes("hebergement")) return "residence";
  if (target.includes("financ") || target.includes("ressource") || target.includes("bancaire") || target.includes("solvabilite")) return "financement";
  return null;
}

export function getRequirements(destination?: string | null, projectType?: string | null): Requirement[] {
  const generic = destination && isProjectType(projectType) ? getEvaluationDocumentRequirements(destination, projectType) : [];
  // procedures107Complete couvre 41+ pays avec des pieces reellement propres au couple pays+type de visa,
  // contrairement a COUNTRY_REQUIREMENTS (evaluationDocumentCatalogue) qui ne detaille que 5 pays : on le
  // fusionne toujours pour que la checklist ne reste jamais generique faute de couverture.
  const procedure = resolveProcedure(destination, projectType);
  const countrySpecific = procedure?.requiredDocuments?.length
    ? procedure.requiredDocuments.flatMap((group) => group.documents.map((label) => ({ category: group.category, label })))
    : [];

  const genericThemes = new Set(generic.map((requirement) => requirementTheme(requirement.label)).filter((theme): theme is string => theme !== null));
  const genericLabels = new Set(generic.map((requirement) => normalize(requirement.label)));
  const seenCountryLabels = new Set<string>();
  const filteredCountrySpecific = countrySpecific.filter((requirement) => {
    const key = normalize(requirement.label);
    if (genericLabels.has(key) || seenCountryLabels.has(key)) return false;
    const theme = requirementTheme(requirement.label);
    if (theme && genericThemes.has(theme)) return false;
    seenCountryLabels.add(key);
    return true;
  });

  const merged = [...generic, ...filteredCountrySpecific];
  const base = merged.length ? merged : FALLBACK_REQUIREMENTS;
  return capDocumentList(base, MAX_CHECKLIST_DOCUMENTS);
}

/**
 * Assemble catalogue + demandes conseiller sans dépasser 16 lignes.
 * Les demandes du conseiller sont prioritaires (jamais évincées par le catalogue).
 */
export function assembleChecklistRequirements(
  destination?: string | null,
  projectType?: string | null,
  customRequirements: CustomRequirement[] = [],
): { catalogue: Requirement[]; customs: CustomRequirement[]; total: number } {
  const customs = customRequirements
    .filter((requirement) => requirement.status !== "waived")
    .slice(0, MAX_CHECKLIST_DOCUMENTS);
  const catalogueBudget = Math.max(0, MAX_CHECKLIST_DOCUMENTS - customs.length);
  const catalogue = getRequirements(destination, projectType).slice(0, catalogueBudget);
  return { catalogue, customs, total: catalogue.length + customs.length };
}

export function documentsForRequirement(requirement: Requirement, documents: ChecklistDocument[]): ChecklistDocument[] {
  const target = normalize(requirement.label);
  const aliases = target.includes("passeport") ? ["passport", "passeport"]
    : target.includes("photo") ? ["photo", "identite"]
    : target.includes("cv") ? ["cv", "professional", "experience"]
    : target.includes("diplome") || target.includes("releve") || target.includes("qualification") ? ["diplome", "diploma", "certificate", "releve", "transcript"]
    : target.includes("financement") || target.includes("ressource") ? ["bank", "financ", "ressource"]
    : target.includes("admission") || target.includes("acceptation") ? ["admission", "acceptance", "candidature"]
    : target.includes("employeur") || target.includes("emploi") ? ["employment", "employeur", "contrat", "offre", "professional"]
    : target.includes("residence") || target.includes("domicile") ? ["residence", "domicile", "hebergement"]
    : target.includes("naissance") ? ["naissance", "birth"]
    : [];
  return documents.filter((document) => {
    const source = normalize(`${document.documentType ?? ""} ${document.documentName ?? ""}`);
    if (!source) return false;
    return source.includes(target) || aliases.some((alias) => source.includes(alias));
  });
}


export type ChecklistStateKind = "missing" | "replace" | "verified" | "received";

/** État d'une ligne de la checklist d'après les pièces qui lui correspondent. */
export function kindFromMatches(matches: ChecklistDocument[]): ChecklistStateKind {
  if (!matches.length) return "missing";
  if (matches.some((document) => document.verificationStatus === "rejected" || document.status === "rejected")) return "replace";
  if (matches.some((document) => document.verificationStatus === "verified" || document.status === "verified")) return "verified";
  return "received";
}

export function requirementKind(requirement: Requirement, documents: ChecklistDocument[]): ChecklistStateKind {
  return kindFromMatches(documentsForRequirement(requirement, documents));
}

/** Demande individuelle du conseiller : son propre statut prime, sinon les pièces reçues qui lui correspondent. */
export function customRequirementKind(requirement: CustomRequirement, documents: ChecklistDocument[]): ChecklistStateKind {
  if (requirement.status === "approved") return "verified";
  if (requirement.status === "rejected") return "replace";
  if (requirement.status === "received" || documentsForRequirement({ category: "Demande de votre conseiller", label: requirement.documentType }, documents).length) return "received";
  return "missing";
}

/** Résumé pour « Votre prochaine étape » et les relances : pièces manquantes ou à remplacer, et laquelle en premier. */
export function summarizeChecklist(destination: string | null | undefined, projectType: string | null | undefined, documents: ChecklistDocument[], customRequirements: CustomRequirement[] = []) {
  const assembled = assembleChecklistRequirements(destination, projectType, customRequirements);
  const lines = [
    ...assembled.catalogue.map((requirement) => ({ label: requirement.label, kind: requirementKind(requirement, documents) })),
    ...assembled.customs.map((requirement) => ({ label: requirement.documentType, kind: customRequirementKind(requirement, documents) })),
  ];
  const missing = lines.filter((line) => line.kind === "missing");
  const replace = lines.filter((line) => line.kind === "replace");
  return { total: lines.length, missing: missing.length, replace: replace.length, firstMissingLabel: missing[0]?.label ?? null, firstReplaceLabel: replace[0]?.label ?? null };
}


/**
 * Liste des pièces que le candidat peut choisir à l'envoi : celles de son pays et de son type de visa (les mêmes que la
 * checklist), puis les demandes de son conseiller (hors pièces dispensées), sans doublon.
 */
export function buildRequirementOptions(destination?: string | null, projectType?: string | null, customRequirements: Array<Pick<CustomRequirement, "documentType" | "status">> = []): Array<{ label: string; group: string }> {
  const seen = new Set<string>();
  const options: Array<{ label: string; group: string }> = [];
  const add = (label: string, group: string) => {
    const key = normalize(label);
    if (!key || seen.has(key) || options.length >= MAX_CHECKLIST_DOCUMENTS) return;
    seen.add(key);
    options.push({ label: label.trim(), group });
  };
  // Demandes conseiller d’abord, puis catalogue (capacité 16).
  for (const requirement of customRequirements) if (requirement.status !== "waived") add(requirement.documentType, "Demande de votre conseiller");
  for (const requirement of getRequirements(destination, projectType)) add(requirement.label, requirement.category);
  return options;
}

export type DueInfo = { label: string; tone: "overdue" | "soon" | "normal" };

/**
 * Échéance fixée par le conseiller pour une pièce : « En retard de N j », « Plus que N j » (3 jours ou moins) ou la date.
 * Uniquement une date réellement saisie par le conseiller ; aucune échéance n'est jamais déduite ou inventée.
 */
export function dueInfo(dueAt: Date | string | null | undefined, now: Date = new Date()): DueInfo | null {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return null;
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((startOfDay(due) - startOfDay(now)) / 86_400_000);
  const date = due.toLocaleDateString("fr-FR");
  if (days < 0) return { label: `En retard de ${-days} j (à déposer avant le ${date})`, tone: "overdue" };
  if (days === 0) return { label: `À déposer aujourd’hui (${date})`, tone: "soon" };
  if (days <= 3) return { label: `Plus que ${days} j (à déposer avant le ${date})`, tone: "soon" };
  return { label: `À déposer avant le ${date}`, tone: "normal" };
}

export type WelcomeStep = { id: "evaluation" | "documents" | "payment"; title: string; detail: string; done: boolean };

/** Parcours d'accueil en trois étapes, cochées d'après l'état réel du dossier. */
export function buildWelcomeSteps(input: { evaluationRequired: boolean; checklistMissing: number; checklistTotal: number; paymentConfirmed: boolean; agreementSigned: boolean }): WelcomeStep[] {
  return [
    { id: "evaluation", title: "Faire votre évaluation", detail: "Elle précise votre destination et votre projet.", done: !input.evaluationRequired },
    { id: "documents", title: "Envoyer vos pièces", detail: input.checklistTotal > 0 ? `${Math.max(0, input.checklistTotal - input.checklistMissing)} sur ${input.checklistTotal} déjà reçues, chacune en un geste.` : "Chaque pièce s’envoie en un geste, photo du téléphone comprise.", done: input.checklistTotal > 0 && input.checklistMissing === 0 },
    { id: "payment", title: "Régler puis signer le protocole", detail: "Le reçu et le protocole d’accord vous arrivent ensemble après confirmation du paiement.", done: input.paymentConfirmed && input.agreementSigned },
  ];
}

type LooseCaseRequirement = {
  id?: number;
  documentType?: string | null;
  status?: CustomRequirement["status"] | string | null;
  dueAt?: Date | string | null;
  adminComment?: string | null;
};

type CaseWithRequirements = {
  caseNumber?: string | null;
  requirements?: LooseCaseRequirement[] | null;
  updatedAt?: Date | string | null;
};

const VALID_REQUIREMENT_STATUSES = new Set<CustomRequirement["status"]>([
  "pending",
  "received",
  "approved",
  "rejected",
  "waived",
]);

/**
 * Choisit les exigences du dossier actif (pays × visa) plutôt que celles
 * d’une ancienne évaluation EVAL-… lorsque le client a un dossier 3M-AGN / en ligne.
 */
export function pickActiveCaseRequirements(
  cases: CaseWithRequirements[] | null | undefined,
  preferredCaseNumbers: Array<string | null | undefined>,
): CustomRequirement[] {
  const list = Array.isArray(cases) ? cases : [];
  if (!list.length) return [];
  const normalizeRequirements = (requirements: CaseWithRequirements["requirements"]): CustomRequirement[] =>
    (Array.isArray(requirements) ? requirements : [])
      .filter((item) => Boolean(item?.documentType && item?.status && VALID_REQUIREMENT_STATUSES.has(item.status as CustomRequirement["status"])))
      .map((item, index) => ({
        id: typeof item.id === "number" ? item.id : index + 1,
        documentType: String(item.documentType),
        status: item.status as CustomRequirement["status"],
        dueAt: item.dueAt ?? null,
        adminComment: item.adminComment ?? null,
      }));

  for (const preferred of preferredCaseNumbers) {
    const key = String(preferred || "").trim();
    if (!key) continue;
    const matched = list.filter((item) => String(item.caseNumber || "").trim() === key);
    if (matched.length) {
      return matched.flatMap((item) => normalizeRequirements(item.requirements));
    }
  }
  const withRequirements = list
    .filter((item) => Array.isArray(item.requirements) && item.requirements.length > 0)
    .sort((left, right) => new Date(String(right.updatedAt ?? 0)).getTime() - new Date(String(left.updatedAt ?? 0)).getTime());
  if (withRequirements.length) {
    return normalizeRequirements(withRequirements[0].requirements);
  }
  return list.flatMap((item) => normalizeRequirements(item.requirements));
}

export { MAX_CHECKLIST_DOCUMENTS } from "@shared/documentLimits";
