export const CRS_HISTORY_SOURCE = {
  organization: "Immigration, Refugees and Citizenship Canada (IRCC)",
  url: "https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds.html",
  verifiedAt: "2026-08-19",
} as const;

// Série homogène CEC, choisie pour visualiser l'évolution mensuelle d'un même type de ronde.
export const CEC_SIX_MONTH_CRS_HISTORY = [
  { month: "Mars", date: "17 mars 2026", round: "#404", minScore: 507, invitations: 4000 },
  { month: "Avril", date: "14 avril 2026", round: "#410", minScore: 515, invitations: 2000 },
  { month: "Mai", date: "27 mai 2026", round: "#417", minScore: 518, invitations: 3000 },
  { month: "Juin", date: "23 juin 2026", round: "#420", minScore: 516, invitations: 4000 },
  { month: "Juillet", date: "21 juillet 2026", round: "#428", minScore: 516, invitations: 2000 },
  { month: "Août", date: "18 août 2026", round: "#436", minScore: 523, invitations: 1000 },
] as const;

// Rondes d'invitation les plus récentes par catégorie, utilisées pour le tableau comparatif et le
// seuil affiché dans CanadaScoreSimulator (PDF, message copié, message WhatsApp). Relevées manuellement
// sur la page officielle IRCC (voir CRS_HISTORY_SOURCE.url) le 2026-09-27. IRCC ne tient plus de rondes
// "Général / toutes catégories" depuis fin 2023 : seules les catégories CEC, PNP et Santé ont des rondes
// récentes et vérifiables, d'où leur présence exclusive ici. Ne jamais ajouter de ronde ou de seuil sans
// les avoir vérifiés sur la page officielle et mis à jour LATEST_ROUNDS_VERIFIED_AT en conséquence.
export const LATEST_ROUNDS_VERIFIED_AT = "2026-09-27";

export type InvitationCategory = "cec" | "provincial" | "sante";

export interface InvitationRound {
  roundNum: string;
  category: InvitationCategory;
  type: string;
  date: string;
  minScore: number;
  invitations: number;
  description: string;
}

// Triées de la plus récente à la plus ancienne (par numéro de ronde IRCC décroissant).
export const LATEST_INVITATION_ROUNDS: InvitationRound[] = [
  {
    roundNum: "Ronde #443",
    category: "cec",
    type: "Canadian Experience Class (CEC)",
    date: "15 septembre 2026",
    minScore: 519,
    invitations: 2000,
    description: "Réservée aux candidats justifiant d'une première expérience de travail qualifiée acquise au Canada (Classe de l'expérience canadienne)."
  },
  {
    roundNum: "Ronde #442",
    category: "provincial",
    type: "Candidats des Provinces (PNP)",
    date: "14 septembre 2026",
    minScore: 734,
    invitations: 576,
    description: "Inclut automatiquement le bonus de 600 points accordé aux candidats nommés par un programme des candidats des provinces (PNP)."
  },
  {
    roundNum: "Ronde #441",
    category: "sante",
    type: "Professions de la santé et des services sociaux (catégoriel)",
    date: "4 septembre 2026",
    minScore: 475,
    invitations: 3500,
    description: "Tirage catégoriel ciblant les professions de la santé et des services sociaux jugées prioritaires par IRCC (Healthcare and Social Services Occupations, 2026-Version 3)."
  },
  {
    roundNum: "Ronde #439",
    category: "cec",
    type: "Canadian Experience Class (CEC)",
    date: "1er septembre 2026",
    minScore: 521,
    invitations: 2000,
    description: "Réservée aux candidats justifiant d'une première expérience de travail qualifiée acquise au Canada (Classe de l'expérience canadienne)."
  },
  {
    roundNum: "Ronde #438",
    category: "provincial",
    type: "Candidats des Provinces (PNP)",
    date: "31 août 2026",
    minScore: 697,
    invitations: 562,
    description: "Inclut automatiquement le bonus de 600 points accordé aux candidats nommés par un programme des candidats des provinces (PNP)."
  },
  {
    roundNum: "Ronde #432",
    category: "cec",
    type: "Canadian Experience Class (CEC)",
    date: "5 août 2026",
    minScore: 516,
    invitations: 3000,
    description: "Réservée aux candidats justifiant d'une première expérience de travail qualifiée acquise au Canada (Classe de l'expérience canadienne)."
  },
  {
    roundNum: "Ronde #431",
    category: "provincial",
    type: "Candidats des Provinces (PNP)",
    date: "4 août 2026",
    minScore: 768,
    invitations: 507,
    description: "Inclut automatiquement le bonus de 600 points accordé aux candidats nommés par un programme des candidats des provinces (PNP)."
  },
  {
    roundNum: "Ronde #422",
    category: "sante",
    type: "Professions de la santé et des services sociaux (catégoriel)",
    date: "25 juin 2026",
    minScore: 475,
    invitations: 4000,
    description: "Tirage catégoriel ciblant les professions de la santé et des services sociaux jugées prioritaires par IRCC (Healthcare and Social Services Occupations, 2026-Version 3)."
  },
  {
    roundNum: "Ronde #398",
    category: "sante",
    type: "Professions de la santé et des services sociaux (catégoriel)",
    date: "20 février 2026",
    minScore: 467,
    invitations: 4000,
    description: "Tirage catégoriel ciblant les professions de la santé et des services sociaux jugées prioritaires par IRCC (Healthcare and Social Services Occupations, 2026-Version 3)."
  },
];
