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
