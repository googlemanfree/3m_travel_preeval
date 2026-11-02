/**
 * Informations de confidentialité affichées au moment de la collecte : quelles données, pourquoi, qui y accède, avec qui
 * elles peuvent être partagées, combien de temps. Source unique pour les écrans candidat, employeur et partenaire.
 *
 * `retentionValidated: false` signale une durée encore à valider par le conseil juridique : l'écran le dit honnêtement
 * au lieu d'afficher une durée définitive. Aucune mention de conformité à une réglementation n'est affichée ici.
 */

export type PrivacyNoticeKey = "cvtheque_candidate" | "partner_registration" | "partner_invitation" | "cvtheque_search" | "document_transmission";

export type PrivacyNotice = {
  title: string;
  collected: string[];
  purpose: string;
  access: string[];
  recipients: string[];
  retention: string;
  retentionValidated: boolean;
  rights: string;
};

const RIGHTS = "Vous pouvez demander l’accès, la correction, le retrait de la publication ou la suppression de vos données à tout moment ; 3M TRAVEL AGENCY traite la demande et vous répond.";

export const PRIVACY_NOTICES: Record<PrivacyNoticeKey, PrivacyNotice> = {
  cvtheque_candidate: {
    title: "Votre fiche professionnelle dans la CVthèque",
    collected: ["Métier, compétences, expérience, langues, disponibilité", "Destinations souhaitées, pays de résidence", "Situation d’autorisation de travail que vous déclarez (facultatif)"],
    purpose: "Permettre à des employeurs et agences vérifiés par 3M de trouver votre profil. Votre nom, vos coordonnées, votre nationalité et vos pièces d’identité ne sont jamais affichés dans la CVthèque.",
    access: ["Vous", "Les administrateurs de 3M autorisés", "Les utilisateurs d’entreprises vérifiées par 3M, seulement si vous avez autorisé la diffusion et que 3M a publié votre fiche"],
    recipients: ["Employeurs, cabinets et agences de placement vérifiés, qui peuvent se trouver à l’étranger"],
    retention: "Tant que votre autorisation est active, avec une revue tous les 12 mois. Le retrait de la CVthèque est immédiat et n’entraîne pas la suppression de votre compte.",
    retentionValidated: false,
    rights: RIGHTS,
  },
  partner_registration: {
    title: "Votre demande d’accès professionnelle",
    collected: ["Identité légale de l’organisation, numéro d’enregistrement, pays", "Nom, fonction, e-mail et téléphone du responsable", "Entreprise bénéficiaire ou mandat, justificatif d’autorisation (facultatif selon la catégorie)"],
    purpose: "Vérifier votre organisation avant toute ouverture d’accès. Une inscription seule ne fait pas de votre entreprise un « partenaire officiel ».",
    access: ["Les administrateurs de 3M autorisés", "Le justificatif d’autorisation et les informations de mandat confidentielles ne sont lus que par l’administration"],
    recipients: ["Aucun tiers"],
    retention: "Pendant l’examen de la demande et la durée de la relation, puis archivage.",
    retentionValidated: false,
    rights: RIGHTS,
  },
  partner_invitation: {
    title: "Votre compte partenaire",
    collected: ["Nom, e-mail professionnel, mot de passe (stocké chiffré)", "Journal de connexion et d’actions sensibles"],
    purpose: "Vous donner un accès personnel, limité à votre mission, à l’espace de votre entreprise.",
    access: ["Vous", "Le gestionnaire de votre organisation (rôle et permissions)", "Les administrateurs de 3M autorisés"],
    recipients: ["Aucun tiers"],
    retention: "Tant que le compte est actif ; journaux de sécurité conservés une durée limitée.",
    retentionValidated: false,
    rights: RIGHTS,
  },
  cvtheque_search: {
    title: "Consultation de la CVthèque",
    collected: ["Vos recherches (critères utilisés, sans contenu des fiches) et les fiches consultées"],
    purpose: "Protéger les profils des candidats contre l’aspiration et prouver qui a consulté quoi.",
    access: ["Les administrateurs de 3M autorisés"],
    recipients: ["Aucun tiers"],
    retention: "Journaux de sécurité conservés une durée limitée.",
    retentionValidated: false,
    rights: RIGHTS,
  },
  document_transmission: {
    title: "Transmission d’une pièce privée",
    collected: ["Le motif, le destinataire, l’administrateur, la date et la pièce concernée"],
    purpose: "Encadrer et prouver toute transmission d’un passeport, d’une pièce d’identité ou d’un document financier ou médical, strictement nécessaire à une démarche précise.",
    access: ["Les administrateurs de 3M autorisés (authentification renforcée)"],
    recipients: ["Le destinataire précisé dans la demande, par lien temporaire"],
    retention: "Le registre des transmissions est conservé avec le dossier.",
    retentionValidated: false,
    rights: RIGHTS,
  },
};
