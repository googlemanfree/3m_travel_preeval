/**
 * Parcours de présentation partenaire — source unique public + admin.
 * Même chaîne : critères → examen 3M → envoi → retour → procédure.
 */

export type PresentationStepId =
  | "criteria"
  | "admin_review"
  | "send"
  | "feedback"
  | "procedure";

export type PresentationStepCopy = {
  id: PresentationStepId;
  n: string;
  /** Libellé court (stepper admin / chips). */
  short: { fr: string; en: string };
  /** Titre public employeur. */
  title: { fr: string; en: string };
  /** Phrase d’explication publique. */
  body: { fr: string; en: string };
};

export const PRESENTATION_JOURNEY_STEPS: readonly PresentationStepCopy[] = [
  {
    id: "criteria",
    n: "1",
    short: { fr: "Critères + CV", en: "Criteria + CV" },
    title: { fr: "Vous transmettez vos critères", en: "You share your hiring criteria" },
    body: {
      fr: "Poste, secteur, pays, langues et disponibilités — notre équipe reçoit votre besoin dans le corridor.",
      en: "Role, sector, country, languages and availability — our team receives your need in the corridor.",
    },
  },
  {
    id: "admin_review",
    n: "2",
    short: { fr: "Examen admin 3M", en: "3M admin review" },
    title: { fr: "3M examine et prépare les profils", en: "3M reviews and prepares profiles" },
    body: {
      fr: "Consentement, CV actualisé, synthèse et justificatifs : aucun profil n’est présenté sans examen préalable.",
      en: "Consent, updated CV, summary and documents: no profile is presented without prior review.",
    },
  },
  {
    id: "send",
    n: "3",
    short: { fr: "Envoi partenaire", en: "Partner send" },
    title: { fr: "Présentation contrôlée", en: "Controlled presentation" },
    body: {
      fr: "Le profil anonymisé est transmis à votre organisation vérifiée ; la preuve d’envoi est journalisée.",
      en: "The anonymised profile is sent to your verified organisation; proof of sending is logged.",
    },
  },
  {
    id: "feedback",
    n: "4",
    short: { fr: "Retour / décision", en: "Feedback / decision" },
    title: { fr: "Vous renvoyez votre décision", en: "You return your decision" },
    body: {
      fr: "Présélection, sélection, non-retenu ou pièces demandées — le retour revient dans le bon dossier 3M.",
      en: "Shortlist, select, decline or request documents — feedback returns to the correct 3M file.",
    },
  },
  {
    id: "procedure",
    n: "5",
    short: { fr: "Procédure 3M", en: "3M procedure" },
    title: { fr: "3M ouvre la procédure", en: "3M opens the procedure" },
    body: {
      fr: "Contrat, invitation et démarches documentaires : 3M suit le dossier jusqu’à la mise en route.",
      en: "Contract, invitation and document steps: 3M follows the file through to departure readiness.",
    },
  },
] as const;

export const PRESENTATION_JOURNEY_INTRO = {
  badge: { fr: "Parcours de présentation", en: "Presentation journey" },
  title: {
    fr: "Comment se déroule une présentation",
    en: "How a presentation works",
  },
  lead: {
    fr: "Même chaîne côté employeur et côté admin 3M : critères, examen, envoi, retour, procédure.",
    en: "The same chain for employers and 3M admins: criteria, review, send, feedback, procedure.",
  },
} as const;
