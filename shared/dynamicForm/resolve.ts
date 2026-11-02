import { getCountryEvaluationProfile, type CountryEvaluationProfile } from "../countryEvaluationProfile";
import { countryFields } from "./countryModules";
import { DOMAINS, getDomain, type DomainDef } from "./domains";
import { FAMILY_DOCUMENTS } from "./documents";
import {
  EDUCATION_LEVELS,
  EDUCATION_LEVELS_STANDARD,
  EMPLOYMENT_STATUSES,
  LANGUAGE_LEVELS,
  YEARS_OF_EXPERIENCE,
  area,
  col,
  sel,
  txt,
} from "./fieldKit";
import { programFields } from "./programModules";
import { applyFormOverrides, type FormOverride } from "./overrides";
import { FAMILY_RULES, getProgram, orientationProgram, programsFor, type CvPolicy, type FamilyRules, type ProgramDef, type ProgramFamily } from "./programs";
import { COLUMN_FIELD_KEYS, visibleFields, type ColumnFieldKey, type DynamicField, type DynamicSection, type FormValues, type ProjectKind } from "./types";

export const FORM_SCHEMA_VERSION = "dynamic-form-v1";

export type DynamicFormContext = {
  country?: string | null;
  projectType: ProjectKind;
  programId?: string | null;
  domainId?: string | null;
  /** Règles de l'administration (questions masquées, renommées, obligatoires ou ajoutées). */
  overrides?: FormOverride[];
};

export type ResolvedForm = {
  kind: ProjectKind;
  program: ProgramDef;
  programs: ProgramDef[];
  rules: FamilyRules;
  family: ProgramFamily;
  /** Domaines proposés (liste vide quand le programme ne dépend pas du métier). */
  domains: DomainDef[];
  domain: DomainDef | null;
  countryName: string | null;
  countryCode: string | null;
  schengen: boolean;
  sections: DynamicSection[];
  documents: string[];
  cv: CvPolicy;
  blurb: string;
};

const TRAINING_FAMILIES: ReadonlySet<ProgramFamily> = new Set<ProgramFamily>(["work_training", "study_vocational"]);
const STUDY_PREFIX = "study_";

function educationSection(family: ProgramFamily, variant: FamilyRules["education"]): DynamicSection | null {
  if (variant === "hidden") return null;
  const training = TRAINING_FAMILIES.has(family);
  const study = family.startsWith(STUDY_PREFIX) || family === "generic_etudes";
  const levelField = col(sel("educationLevel", training ? "Dernier niveau d’études atteint" : "Niveau d’études le plus élevé", training ? EDUCATION_LEVELS : EDUCATION_LEVELS_STANDARD));
  const fields: DynamicField[] = variant === "light"
    ? [levelField]
    : [levelField, col(txt("diplomaTitle", "Intitulé exact du diplôme")), col(txt("graduationYear", "Année d’obtention", { placeholder: "2022", maxLength: 20 })), col(txt("fieldOfStudy", "Domaine d’études", { maxLength: 150 }))];
  return {
    id: "education",
    layer: "profil",
    title: training ? "Formation initiale" : study ? "Parcours scolaire & académique" : "Études & diplômes",
    intro: training ? "Indiquez votre dernier niveau, même s’il est inférieur au baccalauréat : plusieurs formations professionnelles l’acceptent." : undefined,
    fields,
  };
}

function experienceSection(variant: FamilyRules["experience"], domain: DomainDef | null, visitLike: boolean): DynamicSection | null {
  if (variant === "hidden") return null;
  const status = col(sel("employmentStatus", visitLike ? "Votre situation professionnelle" : "Situation professionnelle", EMPLOYMENT_STATUSES));
  const title = col(txt("currentJobTitle", variant === "light" ? "Poste ou activité actuelle" : "Intitulé du poste actuel", { maxLength: 150 }));
  if (variant === "light") return { id: "experience", layer: "profil", title: visitLike ? "Situation actuelle" : "Situation professionnelle", fields: [status, title] };
  return {
    id: "experience",
    layer: "profil",
    title: "Expérience professionnelle",
    fields: [
      status,
      title,
      col(sel("yearsOfExperience", "Années d’expérience continue", YEARS_OF_EXPERIENCE)),
      col(txt("industrySector", "Secteur d’activité", { maxLength: 100, placeholder: domain ? domain.label : undefined })),
      col(area("mainTasks", "Tâches principales", { maxLength: 2000 })),
    ],
  };
}

function languagesSection(variant: FamilyRules["languages"], profile: CountryEvaluationProfile | null): DynamicSection | null {
  if (variant === "hidden") return null;
  const destination = (profile?.languages ?? []).slice(0, 2);
  const fields: DynamicField[] = [];
  const hasFrench = destination.some((language) => language.code === "fr");
  const hasEnglish = destination.some((language) => language.code === "en");
  for (const language of destination) {
    if (language.code === "fr") fields.push(col(sel("frenchLevel", "Niveau en français (langue du pays)", LANGUAGE_LEVELS)));
    else if (language.code === "en") fields.push(col(sel("englishLevel", "Niveau en anglais (langue du pays)", LANGUAGE_LEVELS)));
    else fields.push(sel(`lang_${language.code}`, `Niveau en ${language.label} (langue du pays)`, LANGUAGE_LEVELS));
  }
  if (variant === "full" || destination.length === 0) {
    if (!hasFrench) fields.push(col(sel("frenchLevel", destination.length ? "Niveau en français (langue d’appui)" : "Niveau en français", LANGUAGE_LEVELS)));
    if (!hasEnglish) fields.push(col(sel("englishLevel", destination.length ? "Niveau en anglais (langue d’appui)" : "Niveau en anglais", LANGUAGE_LEVELS)));
  }
  const tests = destination[0]?.tests;
  fields.push(col(txt("languageTestsTaken", "Tests officiels passés ou à passer", { placeholder: tests ? `Ex. : ${tests}` : "Ex. : TEF, TCF, IELTS…", maxLength: 100 })));
  return {
    id: "languages",
    layer: "profil",
    title: destination.length ? `Langues — ${destination.map((language) => language.label).join(" et ")} en priorité` : "Compétences linguistiques",
    intro: destination.length ? `La langue du pays de destination est demandée en premier${tests ? ` (tests usuels : ${tests})` : ""}. Le niveau exigé dépend du visa : il se confirme sur la source officielle.` : undefined,
    fields,
  };
}

function dedupe(sections: DynamicSection[]): DynamicSection[] {
  const seen = new Set<string>();
  return sections
    .map((section) => ({ ...section, fields: section.fields.filter((field) => (seen.has(field.key) ? false : (seen.add(field.key), true))) }))
    .filter((section) => section.fields.length > 0);
}

export function resolveDynamicForm(context: DynamicFormContext): ResolvedForm {
  const kind = context.projectType;
  const programs = programsFor(kind);
  const program = (() => { const chosen = getProgram(context.programId); return chosen && chosen.kind === kind ? chosen : orientationProgram(kind); })();
  const family = program.family;
  const rules = FAMILY_RULES[family];
  const profile = getCountryEvaluationProfile(context.country);
  const domains = rules.domain ? DOMAINS : [];
  const domain = rules.domain ? getDomain(context.domainId) : null;
  const visitLike = kind === "tourisme";

  const programSection: DynamicSection = {
    id: "program",
    layer: "programme",
    title: program.id.endsWith("-orientation") ? "Informations utiles pour votre projet" : program.label,
    intro: rules.blurb,
    chip: program.id.endsWith("-orientation") ? undefined : `Visa / programme : ${program.label}`,
    fields: programFields(family, { countryLanguageLabels: (profile?.languages ?? []).map((language) => language.label) }),
  };
  const domainSection: DynamicSection | null = domain
    ? { id: "domain", layer: "domaine", title: `Votre domaine : ${domain.label}`, intro: domain.hint, chip: `Domaine : ${domain.label}`, fields: domain.fields(family) }
    : null;
  const countryExtra = countryFields(profile?.code ?? null, profile?.schengen ?? false, family);
  const countrySection: DynamicSection | null = countryExtra.length
    ? { id: "country", layer: "pays", title: `Spécificités — ${profile?.name ?? context.country}`, chip: `Pays : ${profile?.name ?? context.country}`, fields: countryExtra }
    : null;

  const baseSections = dedupe([
    educationSection(family, rules.education),
    experienceSection(rules.experience, domain, visitLike),
    languagesSection(rules.languages, profile),
    programSection,
    domainSection,
    countrySection,
  ].filter((section): section is DynamicSection => Boolean(section)));
  const sections = applyFormOverrides(baseSections, context.overrides, { kind, programId: program.id, domainId: domain?.id ?? null, countryCode: profile?.code ?? null });

  const documents = Array.from(new Set([...FAMILY_DOCUMENTS[family], ...(domain?.documents ?? [])]));
  return {
    kind,
    program,
    programs,
    rules,
    family,
    domains,
    domain,
    countryName: profile?.name ?? (context.country?.trim() || null),
    countryCode: profile?.code ?? null,
    schengen: profile?.schengen ?? false,
    sections,
    documents,
    cv: rules.cv,
    blurb: rules.blurb,
  };
}

// ───────────── Valeurs, validation, enregistrement ─────────────

export function visibleSections(form: ResolvedForm, values: FormValues): DynamicSection[] {
  return form.sections.map((section) => ({ ...section, fields: visibleFields(section.fields, values) })).filter((section) => section.fields.length > 0);
}

export const allVisibleFields = (form: ResolvedForm, values: FormValues): DynamicField[] => visibleSections(form, values).flatMap((section) => section.fields);

export function missingRequiredFields(form: ResolvedForm, values: FormValues): DynamicField[] {
  return allVisibleFields(form, values).filter((field) => field.required && !(values[field.key] ?? "").trim());
}

export type FormCompleteness = { answered: number; total: number; percent: number; missingRequired: string[] };

export function formCompleteness(form: ResolvedForm, values: FormValues): FormCompleteness {
  const fields = allVisibleFields(form, values);
  const answered = fields.filter((field) => (values[field.key] ?? "").trim()).length;
  const total = fields.length;
  return { answered, total, percent: total ? Math.round((answered / total) * 100) : 100, missingRequired: missingRequiredFields(form, values).map((field) => field.label) };
}

export const DETAIL_META_KEYS = ["programId", "programLabel", "programFamily", "domainId", "domainLabel", "formSchemaVersion"] as const;
/** Clés conservées telles quelles : lien vers le guide 3M choisi par le candidat. */
const PASSTHROUGH_KEYS = ["procedureId", "selectedProcedure"] as const;

export type SplitValues = { columns: Partial<Record<ColumnFieldKey, string>>; details: Record<string, string> };

/** Sépare les réponses visibles entre colonnes de l'évaluation et détails du projet, avec les métadonnées du formulaire. */
export function splitFormValues(form: ResolvedForm, values: FormValues, passthrough: FormValues = {}): SplitValues {
  const columns: Partial<Record<ColumnFieldKey, string>> = {};
  const details: Record<string, string> = {};
  for (const field of allVisibleFields(form, values)) {
    const value = (values[field.key] ?? "").trim();
    if (!value) continue;
    if (field.storage === "column") columns[field.key as ColumnFieldKey] = value;
    else details[field.key] = value.slice(0, 1000);
  }
  for (const key of PASSTHROUGH_KEYS) if (passthrough[key]) details[key] = passthrough[key].slice(0, 1000);
  details.programId = form.program.id;
  details.programLabel = form.program.label;
  details.programFamily = form.family;
  if (form.domain) { details.domainId = form.domain.id; details.domainLabel = form.domain.label; }
  details.formSchemaVersion = FORM_SCHEMA_VERSION;
  return { columns, details };
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Libellé lisible d'une réponse (options des listes déroulantes). */
export function answerLabel(field: DynamicField, value: string): string {
  return field.options?.find((option) => option.value === value)?.label ?? value;
}

/**
 * Nettoyage côté serveur : recompose le formulaire à partir du contexte et ne garde que les réponses des champs visibles, avec
 * des valeurs valides (liste, date, longueur). Aucune clé arbitraire envoyée par un client ne parvient en base ni au modèle d'IA.
 */
export function sanitizeProjectDetails(context: Omit<DynamicFormContext, "programId" | "domainId">, raw: Record<string, string> | null | undefined): Record<string, string> {
  const input = raw ?? {};
  const form = resolveDynamicForm({ ...context, programId: input.programId, domainId: input.domainId });
  const clean: Record<string, string> = {};
  const candidates: FormValues = {};
  for (const [key, value] of Object.entries(input)) if (typeof value === "string") candidates[key] = value.trim();
  for (const field of allVisibleFields(form, candidates)) {
    if (field.storage === "column") continue;
    const value = candidates[field.key];
    if (!value) continue;
    if (field.kind === "select" && !field.options?.some((option) => option.value === value)) continue;
    if (field.kind === "date" && !DATE_PATTERN.test(value)) continue;
    clean[field.key] = value.slice(0, field.maxLength ?? 1000);
  }
  for (const key of PASSTHROUGH_KEYS) if (input[key]) clean[key] = String(input[key]).slice(0, 1000);
  clean.programId = form.program.id;
  clean.programLabel = form.program.label;
  clean.programFamily = form.family;
  if (form.domain) { clean.domainId = form.domain.id; clean.domainLabel = form.domain.label; }
  clean.formSchemaVersion = FORM_SCHEMA_VERSION;
  return clean;
}

export type DescribedAnswer = { key: string; question: string; answer: string };

/** Questions et réponses lisibles d'une évaluation enregistrée (espace conseiller, bilan, IA). Reconstruit les libellés depuis les clés. */
export function describeProjectDetails(context: Omit<DynamicFormContext, "programId" | "domainId">, details: Record<string, unknown> | null | undefined): DescribedAnswer[] {
  const raw: Record<string, string> = {};
  for (const [key, value] of Object.entries(details ?? {})) if (typeof value === "string") raw[key] = value.trim();
  const form = resolveDynamicForm({ ...context, programId: raw.programId, domainId: raw.domainId });
  const result: DescribedAnswer[] = [];
  for (const field of allVisibleFields(form, raw)) {
    if (field.storage === "column") continue;
    const value = raw[field.key];
    if (value) result.push({ key: field.key, question: field.label, answer: answerLabel(field, value) });
  }
  return result;
}

// ───────────── Changements, destination, incohérences ─────────────

export type FormChange = { addedSections: string[]; removedSections: string[]; addedFields: number; removedFields: number };

/** Ce que le dernier choix du candidat a changé dans le formulaire (pour l'annoncer et l'expliquer). */
export function diffForms(previous: ResolvedForm | null, next: ResolvedForm): FormChange {
  const keysOf = (form: ResolvedForm) => new Set(form.sections.flatMap((section) => section.fields.map((field) => field.key)));
  const titleOf = (form: ResolvedForm) => new Map(form.sections.map((section) => [section.id, section.title]));
  if (!previous) return { addedSections: [], removedSections: [], addedFields: 0, removedFields: 0 };
  const before = keysOf(previous), after = keysOf(next);
  const beforeTitles = titleOf(previous), afterTitles = titleOf(next);
  const added = Array.from(afterTitles).filter(([id, title]) => !beforeTitles.has(id) || beforeTitles.get(id) !== title).map(([, title]) => title);
  const removed = Array.from(beforeTitles).filter(([id, title]) => !afterTitles.has(id) || afterTitles.get(id) !== title).map(([, title]) => title);
  return { addedSections: added, removedSections: removed, addedFields: Array.from(after).filter((key) => !before.has(key)).length, removedFields: Array.from(before).filter((key) => !after.has(key)).length };
}

export type DerivedDestination = { destinationCategory: "canada" | "schengen" | "autre"; visaType: "schengen_etude" | "schengen_tourisme" | "schengen_travail" | "canada_rp" | "canada_etude" | "canada_tourisme" | "autre" };

/** Catégorie et type de visa déduits du pays et du projet : plus de menu « type de visa » qui peut contredire le pays choisi. */
export function deriveDestination(country: string | null | undefined, kind: ProjectKind): DerivedDestination {
  const profile = getCountryEvaluationProfile(country);
  if (profile?.code === "CA") {
    return { destinationCategory: "canada", visaType: kind === "etudes" ? "canada_etude" : kind === "tourisme" || kind === "evisa" ? "canada_tourisme" : "canada_rp" };
  }
  if (profile?.schengen) {
    return { destinationCategory: "schengen", visaType: kind === "etudes" ? "schengen_etude" : kind === "tourisme" || kind === "evisa" ? "schengen_tourisme" : "schengen_travail" };
  }
  return { destinationCategory: "autre", visaType: "autre" };
}

export type FormFlag = { code: string; message: string };

const monthsBetween = (from: Date, to: Date) => (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());

/** Points que le conseiller doit vérifier : formulés comme des questions à clarifier, jamais comme des accusations. */
export function detectFormFlags(form: ResolvedForm, values: FormValues, now: Date = new Date()): FormFlag[] {
  const flags: FormFlag[] = [];
  const v = (key: string) => (values[key] ?? "").trim();
  if (v("trainingContract") === "aucune" && v("trainingFunding") === "remuneree") flags.push({ code: "training_pay_without_contract", message: "Formation déclarée rémunérée par l’employeur, mais sans contrat ni promesse : à clarifier." });
  if (v("healthSchoolStatus") === "terminee" && !v("healthRecognitionStatus")) flags.push({ code: "health_recognition_missing", message: "Formation de santé terminée : l’état de la reconnaissance du diplôme n’est pas renseigné." });
  if (v("holidayAgreement") === "non") flags.push({ code: "holiday_no_agreement", message: "Aucun accord vacances-travail déclaré avec cette destination : vérifier que le programme existe pour la nationalité du candidat." });
  if (v("offerStatus") === "aucune" && ["work_employer", "work_highly_qualified", "imm_employer"].includes(form.family)) flags.push({ code: "offer_missing", message: "Programme lié à un employeur, mais aucune offre déclarée : vérifier la voie envisagée." });
  if (v("admissionStatus") === "aucune" && v("languageProofStatus") === "non_concerne") flags.push({ code: "study_language_unclear", message: "Aucune admission et langue d’enseignement non cadrée : à préciser avant toute démarche." });
  const languageKeys = Object.keys(values).filter((key) => key.startsWith("lang_"));
  const frenchOrEnglishDestination = form.countryCode ? ["frenchLevel", "englishLevel"] : [];
  const destinationLevels = [...languageKeys, ...frenchOrEnglishDestination].map((key) => v(key)).filter(Boolean);
  if (destinationLevels.length > 0 && destinationLevels.every((level) => level === "aucun" || level === "a1_a2") && ["work_training", "study_vocational", "work_employer", "work_points", "study_degree"].includes(form.family)) {
    flags.push({ code: "language_level_low", message: "Niveau déclaré faible dans la langue du pays pour ce programme : prévoir un plan de préparation linguistique et vérifier l’exigence officielle." });
  }
  const departure = v("plannedDeparture") || v("plannedArrival");
  if (DATE_PATTERN.test(departure) && new Date(departure) < new Date(now.toISOString().slice(0, 10))) flags.push({ code: "travel_date_past", message: "La date de voyage indiquée est déjà passée." });
  if (DATE_PATTERN.test(v("passportExpiry")) && DATE_PATTERN.test(departure)) {
    const margin = monthsBetween(new Date(departure), new Date(v("passportExpiry")));
    if (margin < 0) flags.push({ code: "passport_expires_before_travel", message: "Le passeport expire avant la date de voyage indiquée." });
    else if (margin < 6) flags.push({ code: "passport_short_validity", message: "Validité du passeport courte au regard de la date de voyage : vérifier l’exigence officielle." });
  }
  return flags;
}

/** Consignes ajoutées à l'invite de l'IA : faits stables et points à clarifier ; jamais de condition d'entrée inventée. */
export function buildAiGuidance(form: ResolvedForm, values: FormValues): string[] {
  const lines = [
    `Projet : ${form.kind}. Visa ou programme déclaré : ${form.program.label}${form.domain ? `. Domaine : ${form.domain.label}` : ""}.`,
    form.blurb,
  ];
  if (form.countryName) lines.push(form.schengen ? `${form.countryName} appartient à l’espace Schengen : ne confonds pas les règles nationales d’un pays avec celles de la zone.` : `${form.countryName} a ses propres règles d’entrée : ne les énonce pas, renvoie à la source officielle.`);
  const flags = detectFormFlags(form, values);
  if (flags.length) lines.push(`Points à clarifier en priorité : ${flags.map((flag) => flag.message).join(" ")}`);
  const missing = missingRequiredFields(form, values).map((field) => field.label);
  if (missing.length) lines.push(`Informations demandées mais non renseignées : ${missing.slice(0, 8).join(" ; ")}.`);
  lines.push("N’énonce aucune condition d’entrée, aucun seuil, aucun délai ni aucun montant propre au pays : place-les dans les questions à vérifier sur la source officielle.");
  return lines;
}

export { COLUMN_FIELD_KEYS };
