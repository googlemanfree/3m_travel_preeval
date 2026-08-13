import { UNAUTHED_ERR_MSG, NOT_ADMIN_ERR_MSG } from "@shared/const";

export const API_ERROR_TRANSLATIONS: Record<string, { fr: string; en: string }> = {
  [UNAUTHED_ERR_MSG]: {
    fr: "Veuillez vous connecter pour continuer.",
    en: "Please log in to continue.",
  },
  [NOT_ADMIN_ERR_MSG]: {
    fr: "Accès refusé : privilèges administrateur requis.",
    en: "Access denied: administrator privileges required.",
  },
  "Unauthorized": {
    fr: "Session expirée ou non autorisée. Veuillez vous reconnecter.",
    en: "Session expired or unauthorized. Please log in again.",
  },
  "Forbidden": {
    fr: "Vous n'avez pas l'autorisation d'effectuer cette opération.",
    en: "You do not have permission to perform this operation.",
  },
  "Internal Server Error": {
    fr: "Une erreur interne est survenue sur le serveur. Veuillez réessayer plus tard.",
    en: "An internal error occurred on the server. Please try again later.",
  },
  "Failed to fetch": {
    fr: "Impossible de contacter le serveur. Vérifiez votre connexion Internet.",
    en: "Unable to reach the server. Please check your Internet connection.",
  },
  "Network Error": {
    fr: "Erreur de réseau. Veuillez réessayer.",
    en: "Network error. Please try again.",
  },
  "Dossier introuvable": {
    fr: "Dossier introuvable ou accès non autorisé.",
    en: "File not found or unauthorized access.",
  },
  "Candidate not found": {
    fr: "Compte candidat introuvable.",
    en: "Candidate account not found.",
  },
  "Invalid credentials": {
    fr: "Identifiants incorrects. Veuillez vérifier votre e-mail et votre mot de passe.",
    en: "Invalid credentials. Please verify your email and password.",
  },
};

export function translateApiErrorMessage(rawMessage: string, language: "fr" | "en"): string {
  if (!rawMessage) {
    return language === "en" ? "An unexpected error occurred." : "Une erreur inattendue est survenue.";
  }

  // Correspondance exacte dans le catalogue
  if (API_ERROR_TRANSLATIONS[rawMessage]) {
    return API_ERROR_TRANSLATIONS[rawMessage][language];
  }

  // Correspondance partielle pour les erreurs courantes
  const lower = rawMessage.toLowerCase();
  if (lower.includes("unauthorized") || lower.includes("please login")) {
    return language === "en" ? "Please log in to continue." : "Veuillez vous connecter pour continuer.";
  }
  if (lower.includes("forbidden") || lower.includes("permission") || lower.includes("admin")) {
    return language === "en" ? "Access denied for this operation." : "Accès refusé pour cette opération.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return language === "en" ? "Network connection error. Please try again." : "Erreur de connexion réseau. Veuillez réessayer.";
  }
  if (lower.includes("not found")) {
    return language === "en" ? "The requested resource was not found." : "La ressource demandée est introuvable.";
  }

  // Si aucun motif ne correspond, on retourne le message original ou un repli propre
  return rawMessage;
}
