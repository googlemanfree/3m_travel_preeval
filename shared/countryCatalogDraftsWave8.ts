/**
 * Brouillons de la vague 8 : Danemark, travail — deux dispositifs de l'Agence danoise du recrutement international et de l'intégration (SIRI) sur
 * nyidanmark.dk : le régime du seuil de salaire (Pay Limit scheme) et la Liste positive pour les personnes ayant fait des études supérieures. Les
 * questions dépliées de chaque page ont été LUES le 2026-11-24 ; chaque fait écrit est dans ces pages. Les montants (seuil de salaire, frais de dossier)
 * ne sont pas écrits : ils sont révisés chaque année et renvoyés au conseiller. Les sous-sections des conditions (heures hebdomadaires, durée du titre,
 * droits) n'ont été lues que par leur intitulé : elles figurent ici comme « à lire sur la page ». Non traités : la Liste positive pour le travail qualifié,
 * le régime complémentaire, la procédure accélérée (Fast-track).
 *
 * Les brouillons s'importent en « À confirmer » avec une source « à confirmer » : rien n'est publié par ce fichier. Voir docs/GUIDES_VAGUE_8.md.
 */
import type { DraftPathway, DraftStep } from "./countryCatalogDrafts";

const CONFIRM_AMOUNTS = "Les montants changent chaque année : votre conseiller confirme les valeurs à jour avant tout dépôt.";

/** Démarche en ligne commune aux deux dispositifs. */
const APPLICATION_STEPS: DraftStep[] = [
  { actor: "employer", title: "L'employeur remplit la première partie de la demande", description: "La demande (formulaire AR1) comporte deux parties : l'employeur remplit la sienne en premier et écrit votre adresse électronique. SIRI vous envoie un courriel quand il a terminé ; utilisez le lien pour créer votre compte avec exactement la même adresse. Si vous avez donné procuration à l'employeur, il utilise le formulaire AR6, qu'il est seul à remplir." },
  { actor: "candidate", title: "Suivre la démarche en huit étapes sur le site de SIRI", description: "Créer un numéro de dossier (case order ID) ; payer les frais ; vérifier l'état du paiement ; réunir les documents (une liste particulière existe pour l'hôtellerie et la restauration) ; remplir et déposer le formulaire ; retrouver la demande ; fournir les données biométriques ; recevoir la réponse. Si vous êtes déjà au Danemark au dépôt, votre séjour doit y être légal. En règle générale, vous devez avoir un contrat avec une entreprise enregistrée au Danemark (avec des exceptions, par exemple pour une entreprise étrangère qui fournit des services au Danemark).", fee: "Frais de traitement à confirmer par votre conseiller" },
  { actor: "authority", title: "Décision de SIRI", description: "Délai normal de 1 mois, jusqu'à 3 mois si des informations manquent. SIRI contacte vous ou votre employeur s'il lui faut des informations complémentaires. Un dossier complet ne garantit pas la délivrance du titre." },
  { actor: "candidate", title: "Famille", description: "Le titre de séjour et de travail permet à votre famille de vous accompagner : conjoint, partenaire enregistré ou concubin, et enfants de moins de 18 ans vivant au foyer. Un membre de la famille accompagnant ne doit pas avoir vu son titre retiré plus d'une fois faute du permis de travail exigé." },
];

export const COUNTRY_CATALOG_DRAFTS_WAVE_8: readonly DraftPathway[] = [
  {
    countryCode: "DK", pathway: "work",
    summary: "Au Danemark, deux voies de travail sont décrites ici : le régime du seuil de salaire (une offre d'emploi à haut salaire, sans exigence de formation ni de secteur) et la Liste positive pour les personnes ayant fait des études supérieures (métiers en pénurie, avec une formation exigée par intitulé de poste). Dans les deux cas, le titre est lié à l'emploi et traité par SIRI en 1 mois en général, jusqu'à 3 mois.",
    programs: [
      {
        officialName: "Pay Limit scheme", nameFr: "Régime du seuil de salaire (Pay Limit scheme)",
        routeType: "employer", offerRequired: "yes", familyAllowed: true,
        processingNote: "Délai normal de 1 mois ; jusqu'à 3 mois si des informations complémentaires sont nécessaires. Un nouveau régime « Collective Agreement Scheme » est annoncé par SIRI à partir du 1er janvier 2027 : à vérifier.",
        feesNote: `Des frais de traitement sont à payer avant le dépôt (une exemption est possible dans certains cas). ${CONFIRM_AMOUNTS}`,
        steps: [
          { actor: "employer", title: "Vérifier l'offre d'emploi à haut salaire", description: "Il faut une offre d'emploi au Danemark dont le salaire atteint au moins le montant minimal du régime, fixé et révisé chaque année sur la page officielle. Aucune formation précise ni aucun secteur précis n'est exigé. Un demandeur d'asile qui a reçu une telle offre peut aussi demander le titre.", fee: "Seuil de salaire à confirmer par votre conseiller" },
          { actor: "candidate", title: "Remplir les conditions du régime", description: "Votre salaire atteint au moins le montant minimal et est versé sur un compte bancaire danois à votre nom ; le salaire et les conditions d'emploi correspondent aux normes danoises ; des exigences portent sur les heures hebdomadaires de travail (à lire sur la page) ; l'emploi n'est pas touché par un conflit du travail légal ; dans certains cas, une autorisation danoise d'exercer ou une autorisation temporaire d'emploi pour adaptation et formation est nécessaire." },
          ...APPLICATION_STEPS,
          { actor: "candidate", title: "Connaître la durée et les changements d'emploi", description: "La durée du titre dépend de la durée de l'emploi (moins de 4 ans, ou 4 ans et plus) et de la validité du passeport (à lire sur la page). Le titre est lié à votre emploi : informez toujours SIRI si vous perdez ou changez d'emploi. Avec ce régime, vous pouvez changer de poste au sein de la même entreprise sans demander un nouveau permis de travail." },
        ],
      },
      {
        officialName: "Positive List for people with a higher education", nameFr: "Liste positive pour les personnes ayant fait des études supérieures",
        routeType: "qualified", offerRequired: "yes", familyAllowed: true,
        processingNote: "Délai normal de 1 mois ; jusqu'à 3 mois si des informations complémentaires sont nécessaires. La liste a été mise à jour le 1er octobre 2026.",
        feesNote: `Des frais de traitement sont à payer avant le dépôt (une exemption est possible dans certains cas). ${CONFIRM_AMOUNTS}`,
        steps: [
          { actor: "candidate", title: "Vérifier que votre emploi figure sur la Liste positive", description: "La liste recense les professions en pénurie de personnel qualifié, au niveau national ou régional, classées par domaine avec leur code DISCO-08. Un intitulé de poste y entre si le suivi du marché du travail, une caisse d'assurance chômage professionnelle ou un conseil régional du marché du travail constate une pénurie. Les intitulés ajoutés par un conseil régional ne valent que pour les communes de ce conseil. La liste indique aussi la date à laquelle chaque intitulé peut en sortir. Mises à jour : le suivi du marché du travail les 1er janvier et 1er juillet ; les conseils régionaux et les caisses d'assurance chômage en principe les 1er avril et 1er octobre, et à tout moment en cas de pénurie aiguë." },
          { actor: "candidate", title: "Remplir les conditions du régime", description: "Votre formation doit répondre à l'exigence indiquée pour l'intitulé de poste et être pertinente pour l'emploi. Votre salaire et vos conditions d'emploi correspondent aux normes danoises ; des exigences portent sur les heures hebdomadaires et sur le salaire (à lire sur la page) ; le salaire est versé sur un compte bancaire danois à votre nom ; dans certains cas, une autorisation danoise d'exercer est nécessaire." },
          ...APPLICATION_STEPS,
          { actor: "candidate", title: "Connaître la durée et les changements d'emploi", description: "La durée du titre dépend de la durée de l'emploi (moins de 4 ans, ou 4 ans et plus) et de la validité du passeport (à lire sur la page). Le titre est limité à l'emploi qui en est la base : vous ne pouvez pas travailler à un autre poste que celui indiqué, même dans la même entreprise. Informez toujours SIRI si vous perdez ou changez d'emploi." },
        ],
      },
    ],
    sources: [
      { label: "New to Denmark (SIRI) : régime du seuil de salaire", url: "https://nyidanmark.dk/en-GB/Applying/Work/Pay%20limit%20scheme", authority: "immigration" },
      { label: "New to Denmark (SIRI) : Liste positive, études supérieures", url: "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Work/Positive-List-Higher-Education", authority: "immigration" },
    ],
  },
];
