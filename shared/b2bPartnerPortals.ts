/**
 * Portails B2B internationaux — agences de placement vs employeurs.
 * Source unique pour libellés, routes et règles de file de profils.
 */

export type B2bAudience = "placement_partner" | "employer";

export const B2B_ROUTES = {
  agencies: "/agences-placement",
  employers: "/employeurs",
  agencyLogin: "/agences-placement#connexion",
  employerLogin: "/employeurs#connexion",
} as const;

export const B2B_AUDIENCE_COPY = {
  placement_partner: {
    fr: {
      portalTitle: "Espace agences de placement",
      portalSubtitle: "Sélectionnez des candidats éligibles issus de l’évaluation 3M TRAVEL AGENCY.",
      navLabel: "Agences de placement",
      ctaLogin: "Connexion agence",
      ctaRequest: "Demander un accès partenaire",
      poolLabel: "Candidats éligibles",
      poolHint: "Profils anonymisés dont l’évaluation a confirmé une éligibilité de départ, soumis uniquement après consentement.",
    },
    en: {
      portalTitle: "Placement agency workspace",
      portalSubtitle: "Select eligible candidates from the 3M TRAVEL AGENCY evaluation pipeline.",
      navLabel: "Placement agencies",
      ctaLogin: "Agency sign-in",
      ctaRequest: "Request partner access",
      poolLabel: "Eligible candidates",
      poolHint: "Anonymised profiles whose evaluation confirmed initial eligibility, shared only after consent.",
    },
  },
  employer: {
    fr: {
      portalTitle: "Espace employeurs internationaux",
      portalSubtitle: "Examinez les meilleurs profils préparés pour l’Europe, l’Amérique et l’Asie.",
      navLabel: "Employeurs internationaux",
      ctaLogin: "Connexion employeur",
      ctaRequest: "Demander un accès employeur",
      poolLabel: "Meilleurs profils",
      poolHint: "Profils anonymisés à fort potentiel, présentés après vérification humaine et consentement candidat.",
    },
    en: {
      portalTitle: "International employer workspace",
      portalSubtitle: "Review top profiles prepared for Europe, the Americas and Asia.",
      navLabel: "International employers",
      ctaLogin: "Employer sign-in",
      ctaRequest: "Request employer access",
      poolLabel: "Top profiles",
      poolHint: "Anonymised high-potential profiles, presented after human review and candidate consent.",
    },
  },
} as const;

export type ProfilePool = "eligible_evaluation" | "top_talent";

/** File par défaut selon le type d’organisation. */
export function defaultPoolForAudience(audience: B2bAudience): ProfilePool {
  return audience === "employer" ? "top_talent" : "eligible_evaluation";
}

export function audienceFromOrganizationType(value?: string | null): B2bAudience {
  return value === "placement_partner" ? "placement_partner" : "employer";
}
