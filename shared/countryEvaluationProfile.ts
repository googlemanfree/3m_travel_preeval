/**
 * Profil d'évaluation par pays de destination (196 pays) : langue(s) principale(s), appartenance à l'espace Schengen et
 * tests de langue usuels. Il sert à poser, pour N'IMPORTE QUEL pays choisi, des questions utiles et adaptées au type de
 * projet (études, travail, visite, immigration), là où seules quelques destinations avaient des champs dédiés.
 *
 * Règle : ne contient que des faits stables (langues, appartenance à Schengen). Aucune condition d'entrée, aucun montant,
 * aucun délai : ceux-ci viennent de la source officielle de chaque pays et ne sont jamais déduits ici.
 */
import { WORLD_COUNTRY_ROWS } from "./worldCountries";

export type EvaluationFieldKind = "text" | "select";
export type CountryAdaptiveProjectType = "travail" | "etudes" | "tourisme" | "evisa" | "immigration";

export type CountryAdaptiveField = {
  key: string;
  label: string;
  kind: EvaluationFieldKind;
  placeholder?: string;
  required: false;
  options?: Array<{ value: string; label: string }>;
};

type LanguageInfo = { label: string; tests?: string };

const LANGUAGES: Record<string, LanguageInfo> = {
  fr: { label: "français", tests: "TCF, TEF, DELF/DALF" },
  en: { label: "anglais", tests: "IELTS, TOEFL, Duolingo, Cambridge" },
  de: { label: "allemand", tests: "Goethe, TestDaF, telc, DSH" },
  es: { label: "espagnol", tests: "DELE, SIELE" },
  pt: { label: "portugais", tests: "CELPE-Bras, CAPLE" },
  it: { label: "italien", tests: "CILS, CELI, PLIDA" },
  nl: { label: "néerlandais", tests: "CNaVT, NT2" },
  ar: { label: "arabe" },
  zh: { label: "chinois", tests: "HSK" },
  ja: { label: "japonais", tests: "JLPT" },
  ko: { label: "coréen", tests: "TOPIK" },
  ru: { label: "russe", tests: "TORFL (TRKI)" },
  tr: { label: "turc", tests: "TÖMER" },
  sv: { label: "suédois", tests: "TISUS" },
  da: { label: "danois", tests: "Prøve i Dansk" },
  no: { label: "norvégien", tests: "Norskprøven, Bergenstest" },
  fi: { label: "finnois", tests: "YKI" },
  is: { label: "islandais" },
  pl: { label: "polonais", tests: "certificat d’État de polonais" },
  cs: { label: "tchèque", tests: "CCE" },
  sk: { label: "slovaque" },
  hu: { label: "hongrois", tests: "ECL" },
  ro: { label: "roumain" },
  bg: { label: "bulgare" },
  el: { label: "grec", tests: "certificat de grec (KPG)" },
  hr: { label: "croate" },
  sr: { label: "serbe" },
  bs: { label: "bosniaque" },
  sl: { label: "slovène" },
  mk: { label: "macédonien" },
  sq: { label: "albanais" },
  et: { label: "estonien" },
  lv: { label: "letton" },
  lt: { label: "lituanien" },
  uk: { label: "ukrainien" },
  he: { label: "hébreu" },
  hi: { label: "hindi" },
  bn: { label: "bengali" },
  ur: { label: "ourdou" },
  ne: { label: "népalais" },
  si: { label: "cingalais" },
  th: { label: "thaï" },
  vi: { label: "vietnamien" },
  id: { label: "indonésien", tests: "UKBI" },
  ms: { label: "malais" },
  km: { label: "khmer" },
  lo: { label: "lao" },
  my: { label: "birman" },
  mn: { label: "mongol" },
  fa: { label: "persan" },
  ka: { label: "géorgien" },
  hy: { label: "arménien" },
  az: { label: "azéri" },
  kk: { label: "kazakh" },
  uz: { label: "ouzbek" },
  am: { label: "amharique" },
  sw: { label: "swahili" },
  ca: { label: "catalan" },
};

/** Langue(s) principale(s) de la vie courante et administrative, par code ISO 3166-1 alpha-2 (la plus utile pour un projet d'études ou de travail en premier). */
const COUNTRY_LANGUAGES: Record<string, string[]> = {
  AF: ["fa"], ZA: ["en"], AL: ["sq"], DZ: ["ar", "fr"], DE: ["de"], AD: ["ca"], AO: ["pt"], AG: ["en"], SA: ["ar"], AR: ["es"], AM: ["hy"], AU: ["en"],
  AT: ["de"], AZ: ["az"], BS: ["en"], BH: ["ar"], BD: ["bn"], BB: ["en"], BE: ["fr", "nl"], BZ: ["en"], BJ: ["fr"], BT: ["en"], BY: ["ru"], BO: ["es"],
  BA: ["bs"], BW: ["en"], BR: ["pt"], BN: ["ms"], BG: ["bg"], BF: ["fr"], BI: ["fr"], KH: ["km"], CM: ["fr", "en"], CA: ["en", "fr"], CV: ["pt"], CL: ["es"],
  CN: ["zh"], CY: ["el", "en"], CO: ["es"], KM: ["fr"], CG: ["fr"], CD: ["fr"], KP: ["ko"], KR: ["ko"], CR: ["es"], CI: ["fr"], HR: ["hr"], CU: ["es"],
  DK: ["da"], DJ: ["fr", "ar"], DM: ["en"], EG: ["ar"], AE: ["ar", "en"], EC: ["es"], ER: ["en"], ES: ["es"], EE: ["et"], SZ: ["en"], US: ["en"], ET: ["am"],
  FJ: ["en"], FI: ["fi"], FR: ["fr"], GA: ["fr"], GM: ["en"], GE: ["ka"], GH: ["en"], GR: ["el"], GD: ["en"], GT: ["es"], GN: ["fr"], GQ: ["es", "fr"],
  GW: ["pt"], GY: ["en"], HT: ["fr"], HN: ["es"], HU: ["hu"], MH: ["en"], SB: ["en"], IN: ["en", "hi"], ID: ["id"], IQ: ["ar"], IR: ["fa"], IE: ["en"],
  IS: ["is"], IL: ["he"], IT: ["it"], JM: ["en"], JP: ["ja"], JO: ["ar"], KZ: ["kk", "ru"], KE: ["en", "sw"], KG: ["ru"], KI: ["en"], KW: ["ar"], LA: ["lo"],
  LS: ["en"], LV: ["lv"], LB: ["ar", "fr"], LR: ["en"], LY: ["ar"], LI: ["de"], LT: ["lt"], LU: ["fr", "de"], MK: ["mk"], MG: ["fr"], MY: ["ms", "en"],
  MW: ["en"], MV: ["en"], ML: ["fr"], MT: ["en"], MA: ["ar", "fr"], MU: ["en", "fr"], MR: ["ar", "fr"], MX: ["es"], FM: ["en"], MD: ["ro"], MC: ["fr"],
  MN: ["mn"], ME: ["sr"], MZ: ["pt"], MM: ["my"], NA: ["en"], NR: ["en"], NP: ["ne"], NI: ["es"], NE: ["fr"], NG: ["en"], NO: ["no"], NZ: ["en"], OM: ["ar"],
  UG: ["en"], UZ: ["uz", "ru"], PK: ["ur", "en"], PW: ["en"], PS: ["ar"], PA: ["es"], PG: ["en"], PY: ["es"], NL: ["nl"], PE: ["es"], PH: ["en"], PL: ["pl"],
  PT: ["pt"], QA: ["ar"], CF: ["fr"], DO: ["es"], RO: ["ro"], GB: ["en"], RU: ["ru"], RW: ["en", "fr"], KN: ["en"], SM: ["it"], VC: ["en"], LC: ["en"],
  SV: ["es"], WS: ["en"], ST: ["pt"], SN: ["fr"], RS: ["sr"], SC: ["en", "fr"], SL: ["en"], SG: ["en"], SK: ["sk"], SI: ["sl"], SO: ["ar"], SD: ["ar"],
  SS: ["en"], LK: ["si"], SE: ["sv"], CH: ["de", "fr"], SR: ["nl"], SY: ["ar"], TJ: ["ru"], TW: ["zh"], TZ: ["sw", "en"], TD: ["fr", "ar"], CZ: ["cs"],
  TH: ["th"], TL: ["pt"], TG: ["fr"], TO: ["en"], TT: ["en"], TN: ["ar", "fr"], TM: ["ru"], TR: ["tr"], TV: ["en"], UA: ["uk"], UY: ["es"], VU: ["en"],
  VA: ["it"], VE: ["es"], VN: ["vi"], YE: ["ar"], ZM: ["en"], ZW: ["en"],
};

/** États membres de l'espace Schengen (Bulgarie et Roumanie inclus depuis 2025). */
const SCHENGEN_CODES = new Set(["AT", "BE", "BG", "HR", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "CH"]);

export type CountryEvaluationProfile = {
  code: string;
  name: string;
  region: string;
  schengen: boolean;
  languages: Array<{ code: string; label: string; tests?: string }>;
};

const normalizeName = (value: string) => value.trim().toLocaleLowerCase("fr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const ROW_BY_NAME = new Map(WORLD_COUNTRY_ROWS.map(([code, name, region]) => [normalizeName(name), { code, name, region }]));
// Libellés historiques ou usuels non identiques aux noms de la liste officielle des formulaires.
const NAME_ALIASES: Record<string, string> = { "emirats arabes unis": "AE", "republique tcheque": "CZ", "viet nam": "VN", "vietnam": "VN", "cote d ivoire": "CI", "etats unis": "US", "usa": "US", "royaume uni": "GB", "coree du sud": "KR" };

export function getCountryEvaluationProfile(countryName: string | null | undefined): CountryEvaluationProfile | null {
  const key = normalizeName(String(countryName ?? ""));
  if (!key) return null;
  const aliasCode = NAME_ALIASES[key];
  const row = aliasCode ? WORLD_COUNTRY_ROWS.find(([code]) => code === aliasCode) : undefined;
  const found = row ? { code: row[0], name: row[1], region: row[2] } : ROW_BY_NAME.get(key);
  if (!found) return null;
  const languages = (COUNTRY_LANGUAGES[found.code] ?? []).map((code) => ({ code, ...(LANGUAGES[code] ?? { label: code }) }));
  return { code: found.code, name: found.name, region: found.region, schengen: SCHENGEN_CODES.has(found.code), languages };
}

const opt = (value: string, label: string) => ({ value, label });
const select = (key: string, label: string, options: Array<{ value: string; label: string }>): CountryAdaptiveField => ({ key, label, kind: "select", required: false, options });
const text = (key: string, label: string, placeholder?: string): CountryAdaptiveField => ({ key, label, kind: "text", required: false, placeholder });

const PRIOR_STATUS = [opt("non", "Non"), opt("oui_court", "Oui, un court séjour"), opt("oui_long", "Oui, un long séjour (études, travail, résidence)")];

/**
 * Questions adaptées au pays choisi et au type de projet. Toutes facultatives : elles enrichissent le dossier sans bloquer
 * l'envoi. `skipLanguage` évite de redemander la langue quand le formulaire la demande déjà pour ce pays.
 */
export function buildCountryAdaptiveFields(projectType: CountryAdaptiveProjectType, countryName: string | null | undefined, options: { skipLanguage?: boolean } = {}): CountryAdaptiveField[] {
  const profile = getCountryEvaluationProfile(countryName);
  if (!profile) return [];
  const fields: CountryAdaptiveField[] = [];

  if (projectType === "etudes") {
    fields.push(
      select("studyProgramType", "Programme d’études visé", [opt("langue", "Formation en langue"), opt("licence", "Licence / bachelor"), opt("master", "Master"), opt("doctorat", "Doctorat"), opt("professionnel", "Formation professionnelle ou technique"), opt("echange", "Échange ou stage"), opt("autre", "Autre")]),
      select("admissionStatus", "Où en est votre admission ?", [opt("aucune", "Pas encore de candidature"), opt("en_cours", "Candidature en cours"), opt("admis", "Admis (lettre d’acceptation reçue)"), opt("refus", "Candidature refusée")]),
      select("studyFundingPlan", "Comment financez-vous le séjour d’études ?", [opt("famille", "Ressources familiales"), opt("epargne", "Épargne personnelle"), opt("bourse", "Bourse"), opt("pret", "Prêt"), opt("garant", "Garant"), opt("a_definir", "À définir")]),
    );
  } else if (projectType === "travail") {
    fields.push(
      select("workRoute", "Voie envisagée", [opt("offre", "Offre d’emploi déjà obtenue"), opt("candidatures", "Candidatures en cours"), opt("competences", "Permis fondé sur les compétences ou un système de points"), opt("saisonnier", "Emploi saisonnier ou stage"), opt("activite", "Création d’activité"), opt("a_definir", "À définir")]),
      select("diplomaRecognitionStatus", "Vos diplômes ont-ils été reconnus ou évalués pour ce pays ?", [opt("oui", "Oui"), opt("en_cours", "En cours"), opt("non", "Non"), opt("inconnu", "Je ne sais pas")]),
    );
  } else if (projectType === "tourisme") {
    fields.push(
      select("visitPurpose", "Motif précis du voyage", [opt("tourisme", "Tourisme"), opt("famille", "Visite à la famille ou à des amis"), opt("affaires", "Affaires ou événement professionnel"), opt("soins", "Soins médicaux"), opt("transit", "Transit")]),
      select("invitationStatus", "Justificatif de séjour prévu", [opt("reservation", "Réservation d’hébergement"), opt("invitation_particulier", "Invitation d’un particulier"), opt("invitation_entreprise", "Invitation d’une entreprise"), opt("aucun", "Aucun pour l’instant")]),
      select("tripLength", "Durée envisagée", [opt("courte", "Quelques jours"), opt("moyenne", "Quelques semaines"), opt("longue", "Plus longue")]),
    );
  } else if (projectType === "immigration") {
    fields.push(select("immigrationRoute", "Voie d’immigration envisagée", [opt("points", "Résidence fondée sur un système de points"), opt("famille", "Rapprochement ou parrainage familial"), opt("employeur", "Permis lié à un employeur"), opt("regional", "Programme régional ou provincial"), opt("investisseur", "Investisseur ou entrepreneur"), opt("a_definir", "À définir")]));
  }

  const primary = profile.languages[0];
  if (!options.skipLanguage && primary && (projectType === "etudes" || projectType === "travail" || projectType === "immigration")) {
    fields.push(text(`languageProof_${primary.code}`, `Niveau en ${primary.label} ou test déjà passé`, primary.tests ? `Ex. : ${primary.tests}, ou niveau estimé` : "Niveau estimé ou certificat éventuel"));
  }

  // Questions de contexte communes à tous les pays et à tous les types de projet.
  fields.push(
    select("priorVisaRefusal", "Avez-vous déjà eu un visa refusé (pour cette destination ou une autre) ?", [opt("non", "Non"), opt("une_fois", "Oui, une fois"), opt("plusieurs", "Oui, plusieurs fois"), opt("jamais_demande", "Je n’ai jamais fait de demande")]),
    select("priorStayInCountry", profile.schengen ? "Avez-vous déjà séjourné dans l’espace Schengen ?" : "Avez-vous déjà séjourné dans ce pays ?", PRIOR_STATUS),
    select("contactInCountry", "Avez-vous un point d’appui dans ce pays ?", [opt("non", "Non"), opt("famille", "De la famille"), opt("employeur", "Un employeur"), opt("etablissement", "Un établissement d’enseignement"), opt("connaissance", "Un ami ou une connaissance")]),
  );
  return fields;
}

/** Résumé affichable du contexte du pays (aucune condition d'entrée : uniquement des faits stables). */
export function describeCountryContext(countryName: string | null | undefined): string[] {
  const profile = getCountryEvaluationProfile(countryName);
  if (!profile) return [];
  const lines: string[] = [];
  lines.push(profile.schengen ? "Espace Schengen : un seul visa Schengen peut couvrir plusieurs pays de la zone, selon le type de visa et le pays principal de séjour." : "Hors espace Schengen : la destination a ses propres règles d’entrée, à confirmer sur son portail officiel.");
  if (profile.languages.length) lines.push(`Langue${profile.languages.length > 1 ? "s" : ""} principale${profile.languages.length > 1 ? "s" : ""} : ${profile.languages.map((language) => language.label).join(", ")}.`);
  return lines;
}
