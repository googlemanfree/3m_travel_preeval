/**
 * Invitation à donner un avis : un lien pré-rempli et un message que l'équipe envoie elle-même (WhatsApp ou copie).
 * Principes : rien n'est envoyé automatiquement, l'avis reste soumis à l'accord de publication du client et à la
 * modération, et l'invitation est neutre (avis positif OU critique), jamais orientée.
 */

export const REVIEW_SERVICE_OPTIONS = ["Visa Travail", "Visa Études", "Visa Visiteur", "E-Visa"] as const;
export type ReviewServiceType = (typeof REVIEW_SERVICE_OPTIONS)[number];

export const REVIEW_PAGE_URL = "https://www.3mtravelagency.com/avis";
/** Ancre de la section du formulaire sur la page /avis. */
export const REVIEW_FORM_ANCHOR = "deposer-un-avis";

const MAX_DESTINATION = 100;

const stripControl = (value: string) => Array.from(value).filter((char) => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127).join("");
const clean = (value: string | null | undefined, max: number) => stripControl(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export type ReviewInviteParams = { serviceType?: ReviewServiceType; destinationCountry?: string };

/** Paramètres d'un lien d'invitation, relus prudemment : service limité aux choix connus, pays borné et nettoyé. */
export function parseReviewInviteParams(search: string): ReviewInviteParams {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const service = clean(params.get("service"), 40);
  const destination = clean(params.get("destination"), MAX_DESTINATION);
  const result: ReviewInviteParams = {};
  const knownService = REVIEW_SERVICE_OPTIONS.find((option) => option === service);
  if (knownService) result.serviceType = knownService;
  if (destination) result.destinationCountry = destination;
  return result;
}

export function buildReviewInviteUrl(input: { serviceType?: string | null; destinationCountry?: string | null }, base: string = REVIEW_PAGE_URL): string {
  const params = new URLSearchParams();
  const service = REVIEW_SERVICE_OPTIONS.find((option) => option === clean(input.serviceType, 40));
  const destination = clean(input.destinationCountry, MAX_DESTINATION);
  if (service) params.set("service", service);
  if (destination) params.set("destination", destination);
  const query = params.toString();
  return `${base}${query ? `?${query}` : ""}#${REVIEW_FORM_ANCHOR}`;
}

/** Message d'invitation : neutre (tout avis est bienvenu), avec la règle de publication annoncée d'avance. */
export function buildReviewInviteMessage(input: { firstName?: string | null; url: string }): string {
  const name = clean(input.firstName, 40);
  return [
    `Bonjour${name ? ` ${name}` : ""},`,
    "",
    "Merci d’avoir fait confiance à 3M Travel & Services.",
    "Votre avis nous aide à nous améliorer et éclaire les personnes qui préparent un projet comme le vôtre : positif ou critique, il est le bienvenu.",
    "",
    `Vous pouvez le déposer ici, en quelques minutes : ${input.url}`,
    "",
    "Votre avis n’est publié qu’avec votre accord, et sous le nom d’affichage que vous choisissez (prénom, initiales ou nom complet).",
  ].join("\n");
}

/** Lien WhatsApp vers le client si son numéro est connu ; sinon partage libre (l'équipe choisit le contact). */
export function buildReviewInviteWhatsAppUrl(input: { phone?: string | null; message: string }): string {
  const digits = (input.phone ?? "").replace(/\D+/g, "");
  const validPhone = digits.length >= 8 && digits.length <= 15 ? digits : "";
  return `https://wa.me/${validPhone}?text=${encodeURIComponent(input.message)}`;
}
