/**
 * Cohérence des données du dossier : pays, zone de destination, type de visa, type de projet, âge, expérience, diplôme, coordonnées.
 * UNE source de vérité : le pays canonique décide de la zone (Schengen / Canada / autre), la zone et le projet décident du code de visa.
 * Jusqu'ici ces trois valeurs étaient saisies ou déduites séparément (liste codée en dur de quatre pays), d'où des dossiers « Italie »
 * ou « Pologne » classés « autre », ou un code de visa en contradiction avec le pays.
 */

export type DestinationZone = "schengen" | "canada" | "autre";
export type CountryInfo = { name: string; iso2: string; zone: DestinationZone; eu: boolean };

const country = (name: string, iso2: string, zone: DestinationZone, eu: boolean, ...aliases: string[]): [CountryInfo, string[]] => [{ name, iso2, zone, eu }, [name, iso2, ...aliases]];

/** Pays les plus demandés. Schengen = espace de libre circulation (complet en 2026) ; l'Union européenne est notée à part (Chypre, Irlande : UE hors Schengen). */
const REGISTRY: Array<[CountryInfo, string[]]> = [
  country("Allemagne", "DE", "schengen", true, "Germany", "Deutschland"),
  country("Autriche", "AT", "schengen", true, "Austria"),
  country("Belgique", "BE", "schengen", true, "Belgium"),
  country("Bulgarie", "BG", "schengen", true, "Bulgaria"),
  country("Croatie", "HR", "schengen", true, "Croatia"),
  country("Danemark", "DK", "schengen", true, "Denmark"),
  country("Espagne", "ES", "schengen", true, "Spain"),
  country("Estonie", "EE", "schengen", true, "Estonia"),
  country("Finlande", "FI", "schengen", true, "Finland"),
  country("France", "FR", "schengen", true),
  country("Grèce", "GR", "schengen", true, "Greece", "Grece"),
  country("Hongrie", "HU", "schengen", true, "Hungary"),
  country("Islande", "IS", "schengen", false, "Iceland"),
  country("Italie", "IT", "schengen", true, "Italy"),
  country("Lettonie", "LV", "schengen", true, "Latvia"),
  country("Liechtenstein", "LI", "schengen", false),
  country("Lituanie", "LT", "schengen", true, "Lithuania"),
  country("Luxembourg", "LU", "schengen", true, "Grand-Duché de Luxembourg", "Grand Duche de Luxembourg"),
  country("Malte", "MT", "schengen", true, "Malta"),
  country("Norvège", "NO", "schengen", false, "Norway", "Norvege"),
  country("Pays-Bas", "NL", "schengen", true, "Netherlands", "Hollande", "Pays Bas"),
  country("Pologne", "PL", "schengen", true, "Poland"),
  country("Portugal", "PT", "schengen", true),
  country("République tchèque", "CZ", "schengen", true, "Tchéquie", "Tchequie", "Czech Republic", "Czechia", "Republique tcheque"),
  country("Roumanie", "RO", "schengen", true, "Romania"),
  country("Slovaquie", "SK", "schengen", true, "Slovakia"),
  country("Slovénie", "SI", "schengen", true, "Slovenia", "Slovenie"),
  country("Suède", "SE", "schengen", true, "Sweden", "Suede"),
  country("Suisse", "CH", "schengen", false, "Switzerland"),
  country("Canada", "CA", "canada", false),
  country("Serbie", "RS", "autre", false, "Serbia"),
  country("Royaume-Uni", "GB", "autre", false, "United Kingdom", "UK", "Angleterre", "Grande-Bretagne", "Royaume Uni"),
  country("Irlande", "IE", "autre", true, "Ireland"),
  country("Chypre", "CY", "autre", true, "Cyprus"),
  country("États-Unis", "US", "autre", false, "Etats-Unis", "Etats Unis", "USA", "United States", "Amérique"),
  country("Émirats arabes unis", "AE", "autre", false, "Emirats arabes unis", "Dubaï", "Dubai", "UAE", "EAU"),
  country("Turquie", "TR", "autre", false, "Turkey", "Türkiye"),
  country("Maroc", "MA", "autre", false, "Morocco"),
  country("Tunisie", "TN", "autre", false, "Tunisia"),
  country("Qatar", "QA", "autre", false),
  country("Arabie saoudite", "SA", "autre", false, "Saudi Arabia"),
  country("Australie", "AU", "autre", false, "Australia"),
  country("Chine", "CN", "autre", false, "China"),
  country("Japon", "JP", "autre", false, "Japan"),
];

export const fold = (value: string | null | undefined): string =>
  String(value ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’'`´]/g, " ").replace(/[^a-z0-9]+/g, " ").trim();

const INDEX = new Map<string, CountryInfo>();
for (const [info, aliases] of REGISTRY) for (const alias of aliases) INDEX.set(fold(alias), info);

export const KNOWN_COUNTRIES: ReadonlyArray<CountryInfo> = REGISTRY.map(([info]) => info);

/** Pays canonique depuis une saisie libre (accents, casse, anglais, code ISO). null si non reconnu : jamais de pays deviné. */
export function canonicalCountry(raw: string | null | undefined): CountryInfo | null {
  const key = fold(raw);
  return key ? INDEX.get(key) ?? null : null;
}

export const zoneOfCountry = (raw: string | null | undefined): DestinationZone | null => canonicalCountry(raw)?.zone ?? null;

// ── Projet et visa ────────────────────────────────────────────────────────

export type ProjectKind = "travail" | "etudes" | "tourisme" | "residence" | "famille" | "affaires" | "evisa" | "autre";

/** Famille de projet depuis un libellé ou un code (« schengen_travail », « canada_etude », « Études », « tourism », « e-Visa »…). Ordre : études, travail, famille, résidence, affaires, e-Visa, tourisme. */
export function projectKindOf(...values: Array<string | null | undefined>): ProjectKind {
  for (const value of values) {
    const text = fold(value);
    if (!text) continue;
    if (/(etude|study|scolaire|academ|student|formation)/.test(text)) return "etudes";
    if (/(travail|work|emploi|job|qualifi|professionnel)/.test(text)) return "travail";
    if (/(famille|family|regroupement)/.test(text)) return "famille";
    if (/(residence|\brp\b|immigration|installation|permanent)/.test(text)) return "residence";
    if (/(affaires|business)/.test(text)) return "affaires";
    if (/(evisa|e visa|visa electronique)/.test(text)) return "evisa";
    if (/(touris|visitor|visiteur|visite|sejour|court)/.test(text)) return "tourisme";
  }
  return "autre";
}

/** Code de visa stocké sur l'évaluation (énumération existante) : décidé par la zone du pays et le type de projet. */
export type EvaluationVisaCode = "schengen_etude" | "schengen_tourisme" | "schengen_travail" | "canada_rp" | "canada_travail" | "canada_etude" | "canada_tourisme" | "autre";

export function deriveVisaCode(zone: DestinationZone | null, kind: ProjectKind): EvaluationVisaCode {
  if (zone === "schengen") return kind === "etudes" ? "schengen_etude" : kind === "travail" ? "schengen_travail" : kind === "tourisme" ? "schengen_tourisme" : "autre";
  if (zone === "canada") return kind === "etudes" ? "canada_etude" : kind === "travail" ? "canada_travail" : kind === "tourisme" ? "canada_tourisme" : kind === "residence" ? "canada_rp" : "autre";
  return "autre";
}

export function visaCodeParts(code: string | null | undefined): { zone: DestinationZone | null; kind: ProjectKind } {
  const text = fold(code);
  if (!text) return { zone: null, kind: "autre" };
  const zone: DestinationZone | null = text.startsWith("schengen") ? "schengen" : text.startsWith("canada") ? "canada" : text === "autre" ? "autre" : null;
  return { zone, kind: text === "canada rp" ? "residence" : projectKindOf(code) };
}

export type NormalizedDestination = {
  destinationCountry: string;
  destinationCategory: DestinationZone;
  visaType: EvaluationVisaCode;
  /** Ce qui a été corrigé par rapport à la saisie (vide si la saisie était déjà cohérente). */
  corrections: string[];
  recognized: boolean;
};

/** Pays, zone et code de visa cohérents entre eux, à partir de la saisie et du type de projet. Un pays inconnu reste tel que saisi, zone « autre ». */
export function normalizeDestination(input: { destinationCountry?: string | null; destinationCategory?: string | null; visaType?: string | null; projectType?: string | null }): NormalizedDestination {
  const info = canonicalCountry(input.destinationCountry);
  const raw = (input.destinationCountry ?? "").trim();
  const zone: DestinationZone = info?.zone ?? (input.destinationCategory === "schengen" || input.destinationCategory === "canada" ? (input.destinationCategory as DestinationZone) : "autre");
  const kind = projectKindOf(input.projectType, input.visaType);
  const visaType = deriveVisaCode(info ? info.zone : zone, kind);
  const corrections: string[] = [];
  const name = info?.name ?? raw;
  if (info && raw && raw !== info.name) corrections.push(`Pays « ${raw} » normalisé en « ${info.name} »`);
  if (info && input.destinationCategory && input.destinationCategory !== info.zone) corrections.push(`Zone « ${input.destinationCategory} » corrigée en « ${info.zone} » (pays : ${info.name})`);
  if (input.visaType && input.visaType !== visaType) corrections.push(`Code de visa « ${input.visaType} » remplacé par « ${visaType} » (pays ${name || "—"}, projet ${kind})`);
  return { destinationCountry: name, destinationCategory: zone, visaType, corrections, recognized: Boolean(info) };
}

// ── Contrôle d'un dossier ─────────────────────────────────────────────────

export type IssueSeverity = "erreur" | "avertissement" | "info";
export type CoherenceIssue = { code: string; severity: IssueSeverity; field: string; message: string; suggestion?: string };

export type CoherenceRecord = {
  destinationCategory?: string | null;
  destinationCountry?: string | null;
  visaType?: string | null;
  projectType?: string | null;
  dateOfBirth?: string | null;
  age?: number | string | null;
  yearsOfExperience?: string | null;
  graduationYear?: string | null;
  email?: string | null;
  phone?: string | null;
};

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const text = value.trim();
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text);
  if (match) return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
  if (match) return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
  return null;
}

export function ageAt(birth: Date, now: Date): number {
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  if (now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

export function checkRecordCoherence(record: CoherenceRecord, now: Date = new Date()): CoherenceIssue[] {
  const issues: CoherenceIssue[] = [];
  const add = (code: string, severity: IssueSeverity, field: string, message: string, suggestion?: string) => issues.push({ code, severity, field, message, suggestion });
  const info = canonicalCountry(record.destinationCountry);
  const raw = (record.destinationCountry ?? "").trim();

  if (raw && !info) add("PAYS_NON_RECONNU", "avertissement", "destinationCountry", `Pays « ${raw} » absent du référentiel : zone et visa non vérifiables.`);
  if (info && raw !== info.name) add("PAYS_ORTHOGRAPHE", "info", "destinationCountry", `Pays saisi « ${raw} », nom normalisé « ${info.name} ».`, info.name);
  if (info && record.destinationCategory && record.destinationCategory !== info.zone) add("ZONE_INCOHERENTE", "erreur", "destinationCategory", `Zone « ${record.destinationCategory} » alors que ${info.name} relève de « ${info.zone} ».`, info.zone);
  if (!raw && record.destinationCategory && record.destinationCategory !== "autre") add("PAYS_MANQUANT", "avertissement", "destinationCountry", `Zone « ${record.destinationCategory} » sans pays précis.`);

  const visa = visaCodeParts(record.visaType);
  if (record.visaType && info && visa.zone && visa.zone !== info.zone) add("VISA_PAYS_INCOHERENT", "erreur", "visaType", `Visa « ${record.visaType} » alors que ${info.name} relève de « ${info.zone} ».`, deriveVisaCode(info.zone, visa.kind));
  const projectKind = projectKindOf(record.projectType);
  if (record.visaType && record.projectType && visa.kind !== "autre" && projectKind !== "autre" && visa.kind !== projectKind) add("VISA_PROJET_INCOHERENT", "erreur", "visaType", `Visa « ${record.visaType} » (${visa.kind}) en contradiction avec le projet « ${record.projectType} ».`);
  if (record.visaType && info && !visa.zone) add("VISA_INCONNU", "avertissement", "visaType", `Code de visa « ${record.visaType} » non reconnu.`);

  const birth = parseDate(record.dateOfBirth);
  const declaredAge = record.age === null || record.age === undefined || record.age === "" ? null : Number(record.age);
  let age: number | null = null;
  if (record.dateOfBirth) {
    if (!birth) add("NAISSANCE_ILLISIBLE", "avertissement", "dateOfBirth", `Date de naissance « ${record.dateOfBirth} » illisible.`);
    else {
      age = ageAt(birth, now);
      if (birth > now) add("NAISSANCE_FUTURE", "erreur", "dateOfBirth", "Date de naissance dans le futur.");
      else if (age < 16 || age > 80) add("AGE_INVRAISEMBLABLE", "avertissement", "dateOfBirth", `Âge de ${age} ans peu plausible pour un projet de mobilité.`);
    }
  }
  if (declaredAge !== null && Number.isFinite(declaredAge)) {
    if (declaredAge < 14 || declaredAge > 90) add("AGE_INVRAISEMBLABLE", "avertissement", "age", `Âge déclaré de ${declaredAge} ans peu plausible.`);
    if (age !== null && Math.abs(age - declaredAge) > 1) add("AGE_DIVERGENT", "avertissement", "age", `Âge déclaré (${declaredAge}) différent de celui de la date de naissance (${age}).`);
    if (age === null) age = declaredAge;
  }

  const years = (() => { const m = /(\d+(?:[.,]\d+)?)/.exec(record.yearsOfExperience ?? ""); return m ? Number(m[1].replace(",", ".")) : null; })();
  if (years !== null && age !== null && years > Math.max(0, age - 15)) add("EXPERIENCE_VS_AGE", "avertissement", "yearsOfExperience", `${years} an(s) d'expérience pour ${age} ans : début d'activité avant 15 ans.`);

  const graduation = record.graduationYear && /^\d{4}$/.test(record.graduationYear.trim()) ? Number(record.graduationYear.trim()) : null;
  if (graduation !== null) {
    if (graduation > now.getUTCFullYear() + 1) add("DIPLOME_FUTUR", "avertissement", "graduationYear", `Année de diplôme ${graduation} dans le futur (diplôme en cours : à signaler comme tel).`);
    if (birth && graduation - birth.getUTCFullYear() < 15) add("DIPLOME_AVANT_AGE", "erreur", "graduationYear", `Diplôme en ${graduation} pour une naissance en ${birth.getUTCFullYear()}.`);
  }

  if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(record.email.trim())) add("EMAIL_INVALIDE", "erreur", "email", "Adresse e-mail invalide.");
  if (record.phone) {
    const digits = record.phone.replace(/[^\d]/g, "");
    if (digits.length < 8 || digits.length > 15) add("TELEPHONE_INVALIDE", "avertissement", "phone", "Numéro de téléphone de longueur invraisemblable.");
  }
  return issues;
}

export const ISSUE_LABELS: Record<string, string> = {
  PAYS_NON_RECONNU: "Pays non reconnu", PAYS_ORTHOGRAPHE: "Orthographe du pays à normaliser", ZONE_INCOHERENTE: "Zone en contradiction avec le pays", PAYS_MANQUANT: "Pays manquant",
  VISA_PAYS_INCOHERENT: "Visa en contradiction avec le pays", VISA_PROJET_INCOHERENT: "Visa en contradiction avec le projet", VISA_INCONNU: "Code de visa inconnu",
  NAISSANCE_ILLISIBLE: "Date de naissance illisible", NAISSANCE_FUTURE: "Naissance dans le futur", AGE_INVRAISEMBLABLE: "Âge peu plausible", AGE_DIVERGENT: "Âge divergent de la date de naissance",
  EXPERIENCE_VS_AGE: "Expérience supérieure à l'âge possible", DIPLOME_FUTUR: "Année de diplôme future", DIPLOME_AVANT_AGE: "Diplôme avant l'âge possible", EMAIL_INVALIDE: "E-mail invalide", TELEPHONE_INVALIDE: "Téléphone invraisemblable",
};
