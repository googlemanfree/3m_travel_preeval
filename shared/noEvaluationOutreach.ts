/**
 * Brouillons d’e-mail pour les comptes inscrits sans évaluation :
 * demande le pays de préférence et le type d’accompagnement souhaité.
 */

export type OutreachServiceHint =
  | "visa_schengen"
  | "etudes"
  | "immigration"
  | "travail"
  | "evisa"
  | "voyage"
  | "indetermine";

export type NoEvaluationOutreachInput = {
  fullName: string;
  accountReference: string;
  preferredDestinations?: string[] | null;
  destinationPreference?: string | null;
  visaType?: string | null;
  emailVerified?: boolean;
};

export type NoEvaluationOutreachDraft = {
  subject: string;
  bodyText: string;
  bodyHtml: string;
  suggestedService: OutreachServiceHint;
  suggestedDestinationLabel: string;
  mailtoHref: string;
};

const SERVICE_LABELS: Record<OutreachServiceHint, string> = {
  visa_schengen: "visa Schengen / court séjour",
  etudes: "études / formation",
  immigration: "immigration / résidence",
  travail: "travail / recrutement",
  evisa: "e-Visa / autorisation de voyage",
  voyage: "voyage / billet / tourisme",
  indetermine: "accompagnement mobilité internationale",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstNameOf(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || "Bonjour";
}

function inferService(visaType?: string | null, destination?: string | null): OutreachServiceHint {
  const hay = `${visaType ?? ""} ${destination ?? ""}`.toLowerCase();
  if (/schengen|tourisme|visite|court/.test(hay)) return "visa_schengen";
  if (/étude|etude|formation|student|université|universite/.test(hay)) return "etudes";
  if (/immigr|résidence|residence|rp\b|express entry|pnp/.test(hay)) return "immigration";
  if (/travail|emploi|work|ausbildung|lehre/.test(hay)) return "travail";
  if (/e-?visa|eta|ave/.test(hay)) return "evisa";
  if (/vol|billet|hôtel|hotel|tourisme|voyage/.test(hay)) return "voyage";
  return "indetermine";
}

function destinationLabel(input: NoEvaluationOutreachInput): string {
  const prefs = (input.preferredDestinations ?? []).map((item) => item.trim()).filter(Boolean);
  if (prefs.length) return prefs.slice(0, 3).join(", ");
  const coarse = (input.destinationPreference ?? "").trim();
  if (coarse && coarse !== "autre") return coarse;
  return "votre destination de préférence";
}

/** Construit un brouillon prêt à coller / envoyer depuis le back-office. */
export function buildNoEvaluationOutreachDraft(input: NoEvaluationOutreachInput): NoEvaluationOutreachDraft {
  const firstName = firstNameOf(input.fullName);
  const suggestedDestinationLabel = destinationLabel(input);
  const suggestedService = inferService(input.visaType, suggestedDestinationLabel);
  const serviceLabel = SERVICE_LABELS[suggestedService];
  const accountRef = input.accountReference.trim() || "votre compte";
  const verifyNote = input.emailVerified
    ? ""
    : "\n\nSi vous n’avez pas encore confirmé votre adresse e-mail, ouvrez le lien reçu à l’inscription (ou répondez à ce message) afin que nous puissions sécuriser votre espace.";

  const subject = `Votre projet avec 3M TRAVEL AGENCY — précisons votre accompagnement (${accountRef})`;

  const bodyText = [
    `Bonjour ${firstName},`,
    "",
    `Merci pour votre inscription sur 3M TRAVEL AGENCY (référence de compte ${accountRef}).`,
    "",
    "Pour orienter correctement votre dossier, nous avons besoin de deux précisions :",
    `1. Quel est votre pays de préférence ?${suggestedDestinationLabel !== "votre destination de préférence" ? ` (indiqué à l’inscription : ${suggestedDestinationLabel})` : ""}`,
    `2. Quel type d’accompagnement souhaitez-vous ? (par exemple : ${serviceLabel}, ou un autre service)`,
    "",
    "Dès votre réponse, un conseiller pourra vous proposer l’évaluation adaptée ou confirmer la prochaine étape.",
    "Vous pouvez aussi démarrer l’évaluation gratuite depuis votre espace client : https://www.3mtravelagency.com/evaluation",
    verifyNote.trim(),
    "",
    "Cordialement,",
    "L’équipe 3M TRAVEL AGENCY",
    "Yaoundé · Ottawa",
  ]
    .filter((line, index, arr) => !(line === "" && arr[index - 1] === ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  const paragraphs = bodyText.split(/\n{2,}/).map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`).join("");
  const bodyHtml = paragraphs;
  const mailtoHref = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

  return {
    subject,
    bodyText,
    bodyHtml,
    suggestedService,
    suggestedDestinationLabel,
    mailtoHref,
  };
}
