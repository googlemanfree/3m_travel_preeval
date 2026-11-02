/**
 * Messages d'erreur précis et rassurants pour les formulaires (visa, évaluation, e-Visa).
 * On distingue : champs invalides (avec le nom du champ), connexion coupée, délai dépassé, fichier trop lourd,
 * trop de tentatives, session expirée, panne du service. Aucun message technique brut n'est montré au visiteur.
 */

const FIELD_LABELS: Record<string, string> = {
  email: "E-mail",
  phone: "Téléphone / WhatsApp",
  whatsapp: "WhatsApp",
  whatsappNumber: "WhatsApp",
  fullName: "Nom complet",
  firstName: "Prénom",
  lastName: "Nom",
  password: "Mot de passe",
  nationality: "Nationalité",
  destinationCountry: "Pays de destination",
  destination: "Destination",
  passportNumber: "Numéro de passeport",
  dateOfBirth: "Date de naissance",
  age: "Âge",
  projectType: "Type de projet",
  visaType: "Type de visa",
  fileName: "Nom du fichier",
  fileBase64: "Fichier",
};

type MaybeTrpcError = {
  message?: unknown;
  data?: { code?: string; httpStatus?: number } | null;
  shape?: { data?: { code?: string; httpStatus?: number } } | null;
  name?: string;
};

const CONNECTION_MESSAGE = "Connexion impossible : vérifiez votre accès à internet puis réessayez. Les informations saisies sont conservées sur cette page.";
const TIMEOUT_MESSAGE = "Le serveur met trop de temps à répondre. Vérifiez votre connexion puis réessayez ; vos informations sont conservées sur cette page.";
const TOO_LARGE_MESSAGE = "Le fichier est trop volumineux. Réduisez sa taille (photo ou scan en qualité moyenne, PDF allégé) puis réessayez.";
const RATE_LIMIT_MESSAGE = "Trop de tentatives en peu de temps. Patientez une minute, puis réessayez.";
const SESSION_MESSAGE = "Votre session a expiré. Reconnectez-vous, puis renvoyez le formulaire : vos réponses ne sont pas perdues tant que vous restez sur cette page.";
const SERVICE_MESSAGE = "Le service est momentanément indisponible. Vos informations ne sont pas perdues : réessayez dans quelques minutes, ou écrivez-nous sur WhatsApp.";
export const DEFAULT_FORM_ERROR = "Votre demande n’a pas pu être envoyée. Réessayez dans quelques instants.";

function humanizeField(path: unknown): string {
  const parts = Array.isArray(path) ? path.map(String) : [];
  const key = parts[parts.length - 1] ?? "";
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase()) || "Champ";
}

/** Les erreurs de validation du serveur arrivent sous la forme d'un tableau JSON de problèmes. */
function describeValidationIssues(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed.startsWith("[")) return null;
  try {
    const issues = JSON.parse(trimmed) as Array<{ path?: unknown; message?: unknown; code?: unknown }>;
    if (!Array.isArray(issues) || issues.length === 0) return null;
    const lines = issues.slice(0, 3).map((issue) => {
      const label = humanizeField(issue.path);
      const detail = typeof issue.message === "string" && !/^Invalid input|^Required$/i.test(issue.message) ? issue.message : "à renseigner ou à corriger";
      return `${label} : ${detail}`;
    });
    const more = issues.length > 3 ? ` (et ${issues.length - 3} autre${issues.length - 3 > 1 ? "s" : ""})` : "";
    return `Vérifiez ces champs — ${lines.join(" ; ")}${more}.`;
  } catch {
    return null;
  }
}

function looksTechnical(message: string): boolean {
  return /^\s*[\[{]/.test(message) || /\bat\s+\S+\s+\(|stack|undefined|TypeError|ReferenceError|ECONN|ENOTFOUND|SQL|ER_|zod|trpc/i.test(message) || message.length > 220;
}

export function describeFormError(error: unknown, fallback: string = DEFAULT_FORM_ERROR): string {
  const err = (error ?? {}) as MaybeTrpcError;
  const message = typeof err.message === "string" ? err.message : "";
  const code = err.data?.code ?? err.shape?.data?.code ?? "";
  const status = err.data?.httpStatus ?? err.shape?.data?.httpStatus ?? 0;

  if (typeof navigator !== "undefined" && navigator.onLine === false) return CONNECTION_MESSAGE;
  if (/failed to fetch|networkerror|network request failed|load failed|fetch failed|err_internet/i.test(message)) return CONNECTION_MESSAGE;
  if (err.name === "AbortError" || /timeout|timed out|aborted/i.test(message) || code === "TIMEOUT") return TIMEOUT_MESSAGE;
  if (code === "PAYLOAD_TOO_LARGE" || status === 413 || /payload too large|entity too large|too large/i.test(message)) return TOO_LARGE_MESSAGE;
  if (code === "TOO_MANY_REQUESTS" || status === 429) return RATE_LIMIT_MESSAGE;
  if (code === "UNAUTHORIZED" || code === "FORBIDDEN" || status === 401 || status === 403) return SESSION_MESSAGE;

  const validation = describeValidationIssues(message);
  if (validation) return validation;

  if (code === "INTERNAL_SERVER_ERROR" || status >= 500) {
    // Un message métier court et lisible (ex. « Ce dossier existe déjà ») vaut mieux qu'un message générique.
    return message && !looksTechnical(message) ? message : SERVICE_MESSAGE;
  }
  if (message && !looksTechnical(message)) return message;
  return fallback;
}
