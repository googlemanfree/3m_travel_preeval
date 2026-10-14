/**
 * Politique affichée dans le coffre documentaire client.
 * Lecture seule — ne modifie jamais un dossier actif.
 */

export const DOCUMENT_VAULT_POLICY = {
  title: "Coffre-fort documentaire",
  access: {
    fr: "Accès réservé à votre compte candidat et à l’équipe 3M affectée à votre dossier. Aucun partage public des fichiers.",
    en: "Access limited to your candidate account and the 3M team assigned to your file. No public file sharing.",
  },
  permissions: {
    fr: "Vous déposez et consultez vos pièces ; l’agence valide, demande une correction ou publie une pièce vers ce coffre. Les statuts restent ceux validés par l’agence.",
    en: "You upload and view your documents; the agency validates, requests a correction, or publishes a file to this vault. Statuses remain those set by the agency.",
  },
  retention: {
    fr: "Conservation pendant le traitement du dossier, puis archivage selon les obligations légales. Voir la politique de confidentialité (§ Conservation).",
    en: "Kept for the duration of case processing, then archived under applicable legal duties. See the privacy policy (Retention).",
  },
  notifications: {
    fr: "Vous êtes averti dans Mon espace (et par e-mail selon vos préférences) lorsqu’une pièce manque, est reçue ou doit être corrigée.",
    en: "You are notified in My space (and by email per your preferences) when a document is missing, received, or needs correction.",
  },
  privacyPath: "/politique-confidentialite",
} as const;
