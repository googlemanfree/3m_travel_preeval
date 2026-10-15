/**
 * Formulaires d’évaluation préliminaire par pays — livrés dans l’espace client et par e-mail
 * dès qu’un candidat choisit une destination (Canada = PDF AcroForm 3M ; autres pays guides = PDF structuré).
 */

import { GUIDE_COUNTRY_CODES, WORLD_COUNTRY_ROWS } from "./worldCountries";

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
};

const GUIDE_NAME_BY_CODE = new Map(
  WORLD_COUNTRY_ROWS.filter(([code]) => GUIDE_COUNTRY_CODES.includes(code)).map(([code, name]) => [code, name]),
);

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
};

export function resolveDestinationCountryCode(destination: string | null | undefined): string | null {
  const raw = String(destination || "").trim();
  if (!raw) return null;
  if (/^[A-Za-z]{2}$/.test(raw)) {
    const code = raw.toUpperCase();
    return GUIDE_NAME_BY_CODE.has(code) || NAME_TO_CODE.size ? code : code;
  }
  const folded = foldCountry(raw);
  if (DESTINATION_ALIASES[folded]) return DESTINATION_ALIASES[folded];
  // « Canada - Visa Étude », « Canada travail », etc.
  for (const [alias, code] of Object.entries(DESTINATION_ALIASES)) {
    if (folded === alias || folded.startsWith(`${alias} `) || folded.includes(` ${alias} `)) return code;
  }
  return NAME_TO_CODE.get(folded) ?? null;
}

function buildCopy(countryLabel: string): Pick<
  CountryEvaluationFormTemplate,
  "purpose" | "instructions" | "emailSubject" | "emailIntro" | "notificationTitle" | "notificationBody"
> {
  const purpose =
    `Ce PDF est le formulaire d’évaluation préliminaire 3M TRAVEL AGENCY pour votre projet ${countryLabel}. `
    + `Il permet à votre conseiller de comprendre votre profil (identité, études, expérience, langues, budget et objectif) `
    + `avant d’établir un avis d’orientation. Ce n’est ni une demande de visa, ni une garantie d’admission, d’emploi ou d’invitation.`;

  const instructions = [
    "Téléchargez le PDF depuis cet e-mail ou depuis votre espace client (section Documents / coffre).",
    "Remplissez tous les champs demandés avec des informations exactes. Pour le Canada, utilisez un lecteur PDF qui accepte les formulaires (Adobe Reader, Preview, Edge…). Ne joignez pas de numéro de passeport ni de données bancaires dans ce formulaire.",
    "Enregistrez le fichier sous votre nom (ex. Formulaire-evaluation-Prenom-Nom.pdf).",
    "Déposez le PDF rempli dans votre espace client (coffre documentaire), ou renvoyez-le par e-mail / WhatsApp à l’agence si un conseiller vous le demande.",
    "Un conseiller 3M relira ensuite votre formulaire pour préparer l’accompagnement et la checklist de pièces.",
  ];

  return {
    purpose,
    instructions,
    emailSubject: `Votre formulaire d’évaluation ${countryLabel} — à remplir`,
    emailIntro:
      `Bonjour,\n\nVous avez choisi ${countryLabel} comme destination. `
      + `Voici votre formulaire d’évaluation préliminaire remplissable, avec les instructions pour le compléter.`,
    notificationTitle: `Formulaire d’évaluation ${countryLabel}`,
    notificationBody:
      `Votre formulaire d’évaluation préliminaire pour ${countryLabel} est disponible dans votre coffre. `
      + `Remplissez-le, enregistrez-le, puis redéposez-le dans votre espace. `
      + `Il sert à orienter votre dossier — ce n’est pas une demande de visa.`,
  };
}

export function resolveCountryEvaluationForm(destination: string | null | undefined): CountryEvaluationFormTemplate | null {
  const code = resolveDestinationCountryCode(destination);
  if (!code) return null;

  // Canada : PDF AcroForm officiel 3M (Formulaire_evaluation_Canada_3M).
  if (code === "CA") {
    const copy = buildCopy("Canada");
    return {
      countryKey: "CA",
      countryLabel: "Canada",
      formTitle: "Formulaire d’évaluation préliminaire — Canada",
      fileName: "Formulaire_evaluation_Canada_3M.pdf",
      publicPath: "/forms/Formulaire_evaluation_Canada_3M.pdf",
      kind: "static_fillable",
      ...copy,
      emailSubject: "Votre formulaire d’évaluation Canada (remplissable) — instructions 3M",
      emailIntro:
        "Bonjour,\n\nVous avez choisi le Canada. "
        + "Nous vous adressons le formulaire d’évaluation préliminaire 3M (PDF remplissable), "
        + "le même modèle utilisé par nos conseillers pour préparer votre orientation Entrée express / travail / études.",
    };
  }

  // Autres pays du guide (et alias) : PDF structuré généré, même logique d’instructions.
  const label = GUIDE_NAME_BY_CODE.get(code);
  if (!label) {
    // Pays hors guide : on livre quand même un formulaire générique si un libellé pays est fourni.
    const rawLabel = String(destination || "").split(/[-–—|/]/)[0]?.trim() || code;
    if (rawLabel.length < 2) return null;
    const copy = buildCopy(rawLabel);
    const slug = foldCountry(rawLabel).replace(/\s+/g, "_") || code.toLowerCase();
    return {
      countryKey: code,
      countryLabel: rawLabel,
      formTitle: `Formulaire d’évaluation préliminaire — ${rawLabel}`,
      fileName: `Formulaire_evaluation_${slug}_3M.pdf`,
      kind: "generated",
      ...copy,
    };
  }

  const copy = buildCopy(label);
  const slug = foldCountry(label).replace(/\s+/g, "_");
  return {
    countryKey: code,
    countryLabel: label,
    formTitle: `Formulaire d’évaluation préliminaire — ${label}`,
    fileName: `Formulaire_evaluation_${slug}_3M.pdf`,
    kind: "generated",
    ...copy,
  };
}

/** Destinations pour lesquelles un formulaire est toujours prévu (guides + Canada). */
export function listsCountryEvaluationFormSupport(): string[] {
  return Array.from(GUIDE_NAME_BY_CODE.values()).sort((a, b) => a.localeCompare(b, "fr"));
}
