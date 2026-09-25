/**
 * Message WhatsApp adapté à la page consultée : le conseiller sait de quoi le visiteur parle avant de répondre.
 * Aucune donnée personnelle : seulement le titre de la page publique (nettoyé et borné) ou son type.
 */

export const DEFAULT_WHATSAPP_MESSAGE = "Bonjour, je souhaiterais obtenir des informations sur les procédures de visa 3M Travel.";

const MAX_TITLE_LENGTH = 80;

/** Titre lisible d'une page : sans marque, sans « à Yaoundé » de fin, sans caractères de contrôle. */
export function cleanPageTitle(rawTitle: string | null | undefined): string {
  const first = (rawTitle ?? "").split("|")[0];
  const withoutControl = Array.from(first).filter((char) => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127).join("");
  const title = withoutControl
    .replace(/\s+à\s+Yaound[ée]\s*$/i, "")
    .replace(/\s*[—–-]\s*3M Travel.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…` : title;
}

const STATIC_TOPICS: Array<{ test: RegExp; message: string }> = [
  { test: /^\/(flights|vols)(\/|$)/, message: "Bonjour, je prépare un voyage et j’aimerais de l’aide pour réserver un vol." },
  { test: /^\/assurance(\/|$)/, message: "Bonjour, je souhaite des informations sur l’assurance voyage." },
  { test: /^\/cni-passeport(\/|$)/, message: "Bonjour, j’ai une question sur ma demande de CNI ou de passeport." },
  { test: /^\/tourisme(\/|$)/, message: "Bonjour, je souhaite des informations sur un séjour, un hôtel ou une location de véhicule." },
  { test: /^\/tarifs(\/|$)/, message: "Bonjour, je souhaite comprendre vos tarifs et les frais liés à ma démarche." },
  { test: /^\/canada(\/|$)/, message: "Bonjour, j’ai une question sur mon projet vers le Canada." },
  { test: /^\/schengen(\/|$)/, message: "Bonjour, j’ai une question sur un visa Schengen." },
  { test: /^\/(etudes|visa-etudes)(\/|$)/, message: "Bonjour, j’ai une question sur mon projet d’études à l’étranger." },
  { test: /^\/formation(\/|$)/, message: "Bonjour, je souhaite des informations sur vos formations." },
  { test: /^\/3m-digital(\/|$)/, message: "Bonjour, je souhaite des informations sur les services 3M Digital." },
  { test: /^\/evisas(\/|$)/, message: "Bonjour, j’ai une question sur un e-Visa." },
];

/** Message prérempli pour la page `pathname` ; `pageTitle` (document.title) précise les pages de procédure et d'e-Visa. */
export function whatsAppMessageForPage(input: { pathname: string; pageTitle?: string | null }): string {
  const pathname = (input.pathname || "/").split("?")[0].split("#")[0];
  const title = cleanPageTitle(input.pageTitle);

  if (/^\/procedures\/[^/]+/.test(pathname) && !/^\/procedures\/comparaison/.test(pathname)) {
    return title
      ? `Bonjour, je consulte la procédure « ${title} » sur votre site et j’aimerais parler à un conseiller.`
      : "Bonjour, je consulte une procédure de visa sur votre site et j’aimerais parler à un conseiller.";
  }
  if (/^\/evisa\/[^/]+/.test(pathname)) {
    return title
      ? `Bonjour, je consulte la page « ${title} » et j’ai une question sur cet e-Visa.`
      : "Bonjour, j’ai une question sur un e-Visa.";
  }
  for (const topic of STATIC_TOPICS) {
    if (topic.test.test(pathname)) return topic.message;
  }
  return DEFAULT_WHATSAPP_MESSAGE;
}
