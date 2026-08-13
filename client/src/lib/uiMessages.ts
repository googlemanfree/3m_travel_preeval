import { useLanguage } from "@/contexts/LanguageContext";

export const UI_MESSAGES = {
  success: {
    fr: "Succès",
    en: "Success",
  },
  error: {
    fr: "Erreur",
    en: "Error",
  },
  warning: {
    fr: "Attention",
    en: "Warning",
  },
  info: {
    fr: "Information",
    en: "Information",
  },
  networkError: {
    fr: "Problème de connexion réseau. Veuillez vérifier votre connexion et réessayer.",
    en: "Network connection error. Please check your connection and try again.",
  },
  unauthorized: {
    fr: "Veuillez vous connecter pour accéder à cette section.",
    en: "Please log in to access this section.",
  },
  forbidden: {
    fr: "Vous n'avez pas les autorisations requises pour effectuer cette action.",
    en: "You do not have the required permissions to perform this action.",
  },
  internalError: {
    fr: "Une erreur interne est survenue. Veuillez réessayer ultérieurement.",
    en: "An internal error occurred. Please try again later.",
  },
  copiedToClipboard: {
    fr: "Copié dans le presse-papier avec succès !",
    en: "Successfully copied to clipboard!",
  },
  formValidationFailed: {
    fr: "Veuillez remplir tous les champs obligatoires correctement.",
    en: "Please fill in all required fields correctly.",
  },
  confirmDelete: {
    fr: "Êtes-vous sûr de vouloir supprimer cet élément ?",
    en: "Are you sure you want to delete this item?",
  },
  confirmAction: {
    fr: "Veuillez confirmer votre action",
    en: "Please confirm your action",
  },
  cancel: {
    fr: "Annuler",
    en: "Cancel",
  },
  confirm: {
    fr: "Confirmer",
    en: "Confirm",
  },
  saving: {
    fr: "Enregistrement en cours...",
    en: "Saving...",
  },
  savedSuccessfully: {
    fr: "Modifications enregistrées avec succès.",
    en: "Changes saved successfully.",
  },
  emailSentSuccessfully: {
    fr: "E-mail envoyé avec succès.",
    en: "Email sent successfully.",
  },
  emailSendFailed: {
    fr: "Échec de l'envoi de l'e-mail. Veuillez vérifier l'adresse.",
    en: "Failed to send email. Please verify the address.",
  },
};

export function useUiMessage() {
  const { language } = useLanguage();
  return (key: keyof typeof UI_MESSAGES, fallbackFr?: string): string => {
    const entry = UI_MESSAGES[key];
    if (!entry) return fallbackFr || key;
    return language === "en" ? entry.en : entry.fr;
  };
}
