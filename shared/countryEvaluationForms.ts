/**
 * Formulaires d’évaluation préliminaire par pays — livrés dans l’espace client et par e-mail
 * dès qu’un candidat choisit une destination.
 *
 * Canada = PDF AcroForm 3M statique ; toutes les autres destinations du catalogue mondial =
 * PDF structuré 5 pages (même rubriques que le formulaire Canada), adapté au profil pays.
 */

import { WORLD_COUNTRY_ROWS } from "./worldCountries";
import {
  resolveCountryFormProfile,
  type CountryEvaluationFormProfile,
} from "./countryEvaluationFormProfiles";

export const COUNTRY_EVAL_FORM_DOCUMENT_TYPE = "Formulaire d’évaluation préliminaire";

export type CountryEvaluationFormTemplate = {
  countryKey: string;
  countryLabel: string;
  formTitle: string;
  fileName: string;
  /** Asset public servi tel quel (PDF remplissable AcroForm). */
  publicPath?: string;
  kind: "static_fillable" | "generated";
  purpose: string;
  instructions: string[];
  emailSubject: string;
  emailIntro: string;
  notificationTitle: string;
  notificationBody: string;
  /** Profil pays (langues, reconnaissance, voies) — absent seulement pour le PDF Canada statique optionnel. */
  profile?: CountryEvaluationFormProfile;
};

const CODE_TO_ROW = new Map(WORLD_COUNTRY_ROWS.map((row) => [row[0], row]));
const NAME_TO_CODE = new Map(WORLD_COUNTRY_ROWS.map(([code, name]) => [foldCountry(name), code]));

function foldCountry(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Alias courants saisis dans les formulaires / admin. */
const DESTINATION_ALIASES: Record<string, string> = {
  canada: "CA",
  ca: "CA",
  "canada rp": "CA",
  "canada etude": "CA",
  "canada tourisme": "CA",
  "canada travail": "CA",
  canadarp: "CA",
  canadaetude: "CA",
  canadaturisme: "CA",
  canadatravail: "CA",
  france: "FR",
  luxembourg: "LU",
  belgique: "BE",
  belgium: "BE",
  allemagne: "DE",
  germany: "DE",
  "royaume uni": "GB",
  "united kingdom": "GB",
  uk: "GB",
  "etats unis": "US",
  usa: "US",
  "united states": "US",
  pologne: "PL",
  poland: "PL",
  italie: "IT",
  espagne: "ES",
  portugal: "PT",
  suisse: "CH",
  "pays bas": "NL",
  netherlands: "NL",
  dubai: "AE",
  "emirats arabes unis": "AE",
  uae: "AE",
  australie: "AU",
  "nouvelle zelande": "NZ",
  japon: "JP",
  qatar: "QA",
};

export function resolveDestinationCountryCode(destination: string | null | undefined): string | null {
  const raw = String(destination || "").trim();
  if (!raw) return null;
  if (/^[A-Za-z]{2}$/.test(raw)) {
    const code = raw.toUpperCase();
    return CODE_TO_ROW.has(code) ? code : code;
  }
  const folded = foldCountry(raw);
  if (DESTINATION_ALIASES[folded]) return DESTINATION_ALIASES[folded];
  for (const [alias, code] of Object.entries(DESTINATION_ALIASES)) {
    if (folded === alias || folded.startsWith(`${alias} `) || folded.includes(` ${alias} `)) return code;
  }
  // Correspondance exacte sur le nom catalogue
  const exact = NAME_TO_CODE.get(folded);
  if (exact) return exact;
  // Préfixe : « France - Visa Études », « Allemagne travail »
  for (const [name, code] of Array.from(NAME_TO_CODE.entries())) {
    if (folded.startsWith(`${name} `) || folded.includes(` ${name} `)) return code;
  }
  return null;
}

function slugFor(label: string, code: string): string {
  const slug = foldCountry(label).replace(/\s+/g, "_");
  return slug || code.toLowerCase();
}

function buildCopy(
  countryLabel: string,
  profile: CountryEvaluationFormProfile,
): Pick<
  CountryEvaluationFormTemplate,
  "purpose" | "instructions" | "emailSubject" | "emailIntro" | "notificationTitle" | "notificationBody"
> {
  const purpose =
    `Ce PDF est le formulaire d’évaluation préliminaire 3M TRAVEL AGENCY pour votre projet ${countryLabel}. `
    + `Il reprend les mêmes rubriques que notre modèle Canada (identité, famille, études, emplois, langues, liens locaux, budget, objectif) `
    + `adaptées à ${countryLabel} (${profile.authorityHint}). `
    + `Il permet à votre conseiller de comprendre votre profil avant un avis d’orientation. `
    + `Ce n’est ni une demande de visa, ni une garantie d’admission, d’emploi ou d’invitation.`;

  const instructions = [
    "Téléchargez le PDF depuis cet e-mail ou depuis votre espace client (section Documents / coffre).",
    `Remplissez toutes les sections. Langues attendues : ${profile.languageFocus}. Tests typiques : ${profile.languageTestsHint}. Ne joignez pas de numéro de passeport ni de données bancaires.`,
    `Pour les diplômes, précisez toute reconnaissance déjà obtenue (${profile.diplomaRecognitionHint}).`,
    "Enregistrez le fichier sous votre nom (ex. Formulaire-evaluation-Prenom-Nom.pdf).",
    "Déposez le PDF rempli dans votre espace client (coffre), ou renvoyez-le à l’agence si un conseiller vous le demande.",
    "Un conseiller 3M relira ensuite votre formulaire pour préparer l’accompagnement et la checklist de pièces.",
  ];

  return {
    purpose,
    instructions,
    emailSubject: `Votre formulaire d’évaluation ${countryLabel} — à remplir`,
    emailIntro:
      `Bonjour,\n\nVous avez choisi ${countryLabel} comme destination. `
      + `Voici votre formulaire d’évaluation préliminaire 3M (modèle aligné sur notre formulaire Canada, adapté à ${countryLabel}), `
      + `avec les instructions pour le compléter.`,
    notificationTitle: `Formulaire d’évaluation ${countryLabel}`,
    notificationBody:
      `Votre formulaire d’évaluation préliminaire pour ${countryLabel} est disponible dans votre coffre. `
      + `Remplissez-le, enregistrez-le, puis redéposez-le dans votre espace. `
      + `Il sert à orienter votre dossier — ce n’est pas une demande de visa.`,
  };
}

function buildGeneratedTemplate(code: string, label: string, region: string): CountryEvaluationFormTemplate {
  const profile = resolveCountryFormProfile(code, region);
  const copy = buildCopy(label, profile);
  const slug = slugFor(label, code);
  const fileName = `Formulaire_evaluation_${slug}_3M.pdf`;
  // Les pays du guide sont pré-générés sous client/public/forms/ (voir scripts/generate-country-evaluation-forms.mts).
  const publicPath = `/forms/${fileName}`;
  return {
    countryKey: code,
    countryLabel: label,
    formTitle: `Formulaire d’évaluation préliminaire — ${label}`,
    fileName,
    publicPath,
    kind: "generated",
    profile,
    ...copy,
  };
}

export function resolveCountryEvaluationForm(destination: string | null | undefined): CountryEvaluationFormTemplate | null {
  const code = resolveDestinationCountryCode(destination);
  if (!code) {
    // Libellé libre hors catalogue : formulaire générique nommé d’après le texte saisi.
    const rawLabel = String(destination || "").split(/[-–—|/]/)[0]?.trim();
    if (!rawLabel || rawLabel.length < 2) return null;
    return buildGeneratedTemplate("XX", rawLabel, "Europe");
  }

  // Canada : PDF AcroForm officiel 3M (inchangé), profil joint pour messages.
  if (code === "CA") {
    const profile = resolveCountryFormProfile("CA", "Amérique du Nord");
    const copy = buildCopy("Canada", profile);
    return {
      countryKey: "CA",
      countryLabel: "Canada",
      formTitle: "Formulaire d’évaluation préliminaire — Canada",
      fileName: "Formulaire_evaluation_Canada_3M.pdf",
      publicPath: "/forms/Formulaire_evaluation_Canada_3M.pdf",
      kind: "static_fillable",
      profile,
      ...copy,
      emailSubject: "Votre formulaire d’évaluation Canada (remplissable) — instructions 3M",
      emailIntro:
        "Bonjour,\n\nVous avez choisi le Canada. "
        + "Nous vous adressons le formulaire d’évaluation préliminaire 3M (PDF remplissable AcroForm), "
        + "le même modèle utilisé par nos conseillers pour préparer votre orientation Entrée express / travail / études.",
      instructions: [
        "Téléchargez le PDF depuis cet e-mail ou depuis votre espace client (section Documents / coffre).",
        "Ouvrez-le dans un lecteur compatible formulaires (Adobe Reader, Preview, Edge…) et remplissez les 5 sections. Ne joignez pas de numéro de passeport ni de données bancaires.",
        "Précisez l’EDE (WES, IQAS…) et les tests TEF/TCF ou IELTS/CELPIP dès qu’ils sont disponibles.",
        "Enregistrez le fichier sous votre nom, puis redéposez-le dans votre coffre.",
        "Un conseiller 3M relira le formulaire pour l’orientation et la checklist de pièces.",
      ],
    };
  }

  const row = CODE_TO_ROW.get(code);
  if (row) {
    return buildGeneratedTemplate(code, row[1], row[2]);
  }

  // Code ISO inconnu du catalogue : libellé brut.
  const rawLabel = String(destination || code).split(/[-–—|/]/)[0]?.trim() || code;
  return buildGeneratedTemplate(code, rawLabel, "Europe");
}

/** Toutes les destinations du catalogue mondial pour lesquelles un formulaire est généré. */
export function listsCountryEvaluationFormSupport(): string[] {
  return WORLD_COUNTRY_ROWS.map(([, name]) => name).sort((a, b) => a.localeCompare(b, "fr"));
}

/** Nombre de destinations couvertes (catalogue mondial). */
export function countCountryEvaluationForms(): number {
  return WORLD_COUNTRY_ROWS.length;
}
