/** Réponse du candidat à son bilan : motifs proposés et raisons d'ouvrir son dossier sans attendre (honnêtes, sans urgence inventée ni promesse de résultat). */
export const DECLINE_REASONS = {
  price: "Les frais me paraissent trop élevés",
  thinking: "J'ai besoin de réfléchir",
  other_project: "Mon projet a changé",
  question: "J'ai une question sur mon bilan",
  not_matching: "Le bilan ne correspond pas à ma situation",
} as const;
export type DeclineReason = keyof typeof DECLINE_REASONS;
export const DECLINE_REASON_KEYS = Object.keys(DECLINE_REASONS) as [DeclineReason, ...DeclineReason[]];

export const WHY_OPEN_NOW: ReadonlyArray<{ title: string; text: string }> = [
  { title: "Les pièces prennent du temps", text: "Passeport, diplômes, casier judiciaire, traductions : réunir et légaliser ces documents demande souvent plusieurs semaines." },
  { title: "Du temps pour les délais et les rendez-vous", text: "Les délais de traitement et de rendez-vous des administrations varient. Commencer tôt laisse de la marge." },
  { title: "Un conseiller vérifie chaque pièce", text: "Une erreur ou un oubli dans un dossier peut entraîner des retards. Votre conseiller contrôle vos pièces avant tout dépôt." },
  { title: "Vous gardez la main", text: "Valider ouvre la suite : les frais d'ouverture, confirmés par votre conseiller selon votre profil, puis le dépôt des pièces. Vous pouvez poser vos questions avant de payer." },
];

export const DECISION_DISCLAIMER = "Ce bilan évalue la préparation de votre dossier. Il ne garantit aucune décision : seule l'autorité compétente décide.";
