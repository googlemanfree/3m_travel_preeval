/**
 * Modèle du « guide candidat » : un pays = une page complète en 20 rubriques, calquée sur le guide PDF du Luxembourg.
 * Le document est une suite de sections composées de blocs simples (texte, tableau, étapes, encadré…) : le même composant
 * affiche tous les pays, et chaque pays ne fournit que ses données. Aucun fait n'est inventé : ce qui n'est pas vérifié
 * est écrit « à confirmer » dans un bloc `callout` de ton `confirm`.
 */

export type GuideCalloutTone = "info" | "warning" | "confirm" | "danger";

export type GuideBlock =
  | { type: "text"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; tone: GuideCalloutTone; title?: string; text: string }
  | { type: "table"; caption?: string; headers: string[]; rows: string[][]; note?: string }
  | { type: "cards"; items: Array<{ title: string; text: string }> }
  | { type: "step"; number: string; title: string; actors: string; action: string; expected: string; vigilance: string }
  | { type: "faq"; items: Array<{ question: string; answer: string }> };

export type GuideSection = {
  /** Identifiant d'ancre stable (ex. « evaluation »), utilisé par le sommaire. */
  id: string;
  /** Numéro de rubrique affiché (« 01 »…). */
  number: string;
  title: string;
  /** Sur-titre court (ex. « Procédure détaillée »). */
  kicker?: string;
  blocks: GuideBlock[];
};

export type GuideSource = {
  /** Repère cité dans le texte, ex. « S2 ». */
  key: string;
  /** Description de la source (portail, fiche, date de consultation). Jamais un engagement sur son contenu. */
  text: string;
};

export type CandidateGuide = {
  slug: string;
  country: string;
  flag: string;
  /** Titre court de l'objet du guide (ex. « Travailler au Luxembourg »). */
  heading: string;
  /** Phrase d'accroche sous le titre. */
  lead: string;
  /** Édition affichée (année). */
  edition: string;
  /** Sommaire : une ligne par groupe de rubriques, avec les ancres des rubriques concernées. */
  contents: Array<{ label: string; sectionIds: string[] }>;
  sections: GuideSection[];
  sources: GuideSource[];
  /** Points que l'équipe doit valider avant diffusion ou signature : affichés tels quels dans la dernière rubrique. */
  toValidate: string[];
  /** Avertissement général affiché sous le sommaire. */
  disclaimer: string;
  /** `complete` : guide rédigé et sourcé pour ce pays. `framework` : cadre commun + repères du pays, le reste est marqué « à confirmer ». */
  maturity: "complete" | "framework";
};
