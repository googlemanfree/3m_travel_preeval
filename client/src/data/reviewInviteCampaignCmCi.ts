/**
 * Campagne d’invitation — 40 créneaux Cameroun / Côte d’Ivoire × Canada / Schengen / Chine.
 *
 * Ce n’est PAS une banque de faux témoignages. Chaque ligne sert à inviter un vrai client
 * à déposer son avis sur /avis (accord de publication + modération obligatoires).
 * Aucun prénom inventé, aucun récit de visa inventé, aucune note inventée.
 */
import type { ReviewServiceType } from "@/lib/reviewInvitation";

export type InviteOrigin = "Cameroun" | "Côte d’Ivoire";
export type InviteDestinationGroup = "Canada" | "Schengen" | "Chine";

export type ReviewInviteCampaignSlot = {
  id: string;
  origin: InviteOrigin;
  destinationGroup: InviteDestinationGroup;
  /** Pays concret prérempli dans le lien d’invitation (ex. France pour Schengen). */
  destinationCountry: string;
  serviceType: ReviewServiceType;
  /** Libellé interne pour le conseiller (suivi de campagne). */
  label: string;
};

/** Répartition : 24 Cameroun + 16 Côte d’Ivoire ; destinations Canada / Schengen / Chine. */
export const REVIEW_INVITE_CAMPAIGN_CM_CI: ReviewInviteCampaignSlot[] = [
  // —— Cameroun · Canada (10) ——
  { id: "cm-ca-et-01", origin: "Cameroun", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Études", label: "CM · Canada · Études #1" },
  { id: "cm-ca-et-02", origin: "Cameroun", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Études", label: "CM · Canada · Études #2" },
  { id: "cm-ca-et-03", origin: "Cameroun", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Études", label: "CM · Canada · Études #3" },
  { id: "cm-ca-et-04", origin: "Cameroun", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Études", label: "CM · Canada · Études #4" },
  { id: "cm-ca-et-05", origin: "Cameroun", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Études", label: "CM · Canada · Études #5" },
  { id: "cm-ca-tr-01", origin: "Cameroun", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Travail", label: "CM · Canada · Travail #1" },
  { id: "cm-ca-tr-02", origin: "Cameroun", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Travail", label: "CM · Canada · Travail #2" },
  { id: "cm-ca-tr-03", origin: "Cameroun", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Travail", label: "CM · Canada · Travail #3" },
  { id: "cm-ca-tr-04", origin: "Cameroun", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Travail", label: "CM · Canada · Travail #4" },
  { id: "cm-ca-vi-01", origin: "Cameroun", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Visiteur", label: "CM · Canada · Visiteur #1" },

  // —— Cameroun · Schengen (8) ——
  { id: "cm-sch-et-01", origin: "Cameroun", destinationGroup: "Schengen", destinationCountry: "France", serviceType: "Visa Études", label: "CM · France · Études #1" },
  { id: "cm-sch-et-02", origin: "Cameroun", destinationGroup: "Schengen", destinationCountry: "France", serviceType: "Visa Études", label: "CM · France · Études #2" },
  { id: "cm-sch-tr-01", origin: "Cameroun", destinationGroup: "Schengen", destinationCountry: "Allemagne", serviceType: "Visa Travail", label: "CM · Allemagne · Travail #1" },
  { id: "cm-sch-tr-02", origin: "Cameroun", destinationGroup: "Schengen", destinationCountry: "Allemagne", serviceType: "Visa Travail", label: "CM · Allemagne · Travail #2" },
  { id: "cm-sch-vi-01", origin: "Cameroun", destinationGroup: "Schengen", destinationCountry: "Espagne", serviceType: "Visa Visiteur", label: "CM · Espagne · Visiteur #1" },
  { id: "cm-sch-vi-02", origin: "Cameroun", destinationGroup: "Schengen", destinationCountry: "Italie", serviceType: "Visa Visiteur", label: "CM · Italie · Visiteur #1" },
  { id: "cm-sch-et-03", origin: "Cameroun", destinationGroup: "Schengen", destinationCountry: "Belgique", serviceType: "Visa Études", label: "CM · Belgique · Études #1" },
  { id: "cm-sch-tr-03", origin: "Cameroun", destinationGroup: "Schengen", destinationCountry: "Luxembourg", serviceType: "Visa Travail", label: "CM · Luxembourg · Travail #1" },

  // —— Cameroun · Chine (6) ——
  { id: "cm-cn-et-01", origin: "Cameroun", destinationGroup: "Chine", destinationCountry: "Chine", serviceType: "Visa Études", label: "CM · Chine · Études #1" },
  { id: "cm-cn-et-02", origin: "Cameroun", destinationGroup: "Chine", destinationCountry: "Chine", serviceType: "Visa Études", label: "CM · Chine · Études #2" },
  { id: "cm-cn-tr-01", origin: "Cameroun", destinationGroup: "Chine", destinationCountry: "Chine", serviceType: "Visa Travail", label: "CM · Chine · Travail #1" },
  { id: "cm-cn-tr-02", origin: "Cameroun", destinationGroup: "Chine", destinationCountry: "Chine", serviceType: "Visa Travail", label: "CM · Chine · Travail #2" },
  { id: "cm-cn-vi-01", origin: "Cameroun", destinationGroup: "Chine", destinationCountry: "Chine", serviceType: "Visa Visiteur", label: "CM · Chine · Visiteur #1" },
  { id: "cm-cn-ev-01", origin: "Cameroun", destinationGroup: "Chine", destinationCountry: "Chine", serviceType: "E-Visa", label: "CM · Chine · E-Visa #1" },

  // —— Côte d’Ivoire · Canada (7) ——
  { id: "ci-ca-et-01", origin: "Côte d’Ivoire", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Études", label: "CI · Canada · Études #1" },
  { id: "ci-ca-et-02", origin: "Côte d’Ivoire", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Études", label: "CI · Canada · Études #2" },
  { id: "ci-ca-et-03", origin: "Côte d’Ivoire", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Études", label: "CI · Canada · Études #3" },
  { id: "ci-ca-tr-01", origin: "Côte d’Ivoire", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Travail", label: "CI · Canada · Travail #1" },
  { id: "ci-ca-tr-02", origin: "Côte d’Ivoire", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Travail", label: "CI · Canada · Travail #2" },
  { id: "ci-ca-tr-03", origin: "Côte d’Ivoire", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Travail", label: "CI · Canada · Travail #3" },
  { id: "ci-ca-vi-01", origin: "Côte d’Ivoire", destinationGroup: "Canada", destinationCountry: "Canada", serviceType: "Visa Visiteur", label: "CI · Canada · Visiteur #1" },

  // —— Côte d’Ivoire · Schengen (5) ——
  { id: "ci-sch-et-01", origin: "Côte d’Ivoire", destinationGroup: "Schengen", destinationCountry: "France", serviceType: "Visa Études", label: "CI · France · Études #1" },
  { id: "ci-sch-tr-01", origin: "Côte d’Ivoire", destinationGroup: "Schengen", destinationCountry: "Allemagne", serviceType: "Visa Travail", label: "CI · Allemagne · Travail #1" },
  { id: "ci-sch-vi-01", origin: "Côte d’Ivoire", destinationGroup: "Schengen", destinationCountry: "Espagne", serviceType: "Visa Visiteur", label: "CI · Espagne · Visiteur #1" },
  { id: "ci-sch-et-02", origin: "Côte d’Ivoire", destinationGroup: "Schengen", destinationCountry: "Belgique", serviceType: "Visa Études", label: "CI · Belgique · Études #1" },
  { id: "ci-sch-tr-02", origin: "Côte d’Ivoire", destinationGroup: "Schengen", destinationCountry: "Italie", serviceType: "Visa Travail", label: "CI · Italie · Travail #1" },

  // —— Côte d’Ivoire · Chine (4) ——
  { id: "ci-cn-et-01", origin: "Côte d’Ivoire", destinationGroup: "Chine", destinationCountry: "Chine", serviceType: "Visa Études", label: "CI · Chine · Études #1" },
  { id: "ci-cn-tr-01", origin: "Côte d’Ivoire", destinationGroup: "Chine", destinationCountry: "Chine", serviceType: "Visa Travail", label: "CI · Chine · Travail #1" },
  { id: "ci-cn-vi-01", origin: "Côte d’Ivoire", destinationGroup: "Chine", destinationCountry: "Chine", serviceType: "Visa Visiteur", label: "CI · Chine · Visiteur #1" },
  { id: "ci-cn-ev-01", origin: "Côte d’Ivoire", destinationGroup: "Chine", destinationCountry: "Chine", serviceType: "E-Visa", label: "CI · Chine · E-Visa #1" },
];

if (REVIEW_INVITE_CAMPAIGN_CM_CI.length !== 40) {
  throw new Error(`Campagne CM/CI : attendu 40 créneaux, reçu ${REVIEW_INVITE_CAMPAIGN_CM_CI.length}`);
}
