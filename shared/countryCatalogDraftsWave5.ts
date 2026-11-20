/**
 * Brouillons de la vague 5 : études en Tchéquie, en Estonie et en Lettonie, travail en Estonie — pages officielles LUES EN ENTIER le 2026-11-20
 * (ministère tchèque des Affaires étrangères, Police et garde-frontières estonienne, Office letton de la citoyenneté et des migrations).
 * Chaque fait écrit est dans la page citée. Les montants (moyens de subsistance, salaire minimal, frais d'État) ne sont pas écrits : ils changent
 * et sont renvoyés au conseiller. La page lettone a été mise à jour pour la dernière fois en 2022 : à revérifier avant publication.
 *
 * Les brouillons s'importent en « À confirmer » avec une source « à confirmer » : rien n'est publié par ce fichier. Voir docs/GUIDES_VAGUE_5.md.
 */
import type { DraftPathway } from "./countryCatalogDrafts";

const CONFIRM_AMOUNTS = "Les montants changent : votre conseiller confirme les valeurs à jour avant tout dépôt.";

export const COUNTRY_CATALOG_DRAFTS_WAVE_5: readonly DraftPathway[] = [
  // ─── Tchéquie : études ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "CZ", pathway: "study",
    summary: "Un titre de séjour de longue durée pour études est exigé des ressortissants de pays tiers qui étudient en Tchéquie, en général plus d'un an : études universitaires, préparation linguistique ou spécialisée aux études, programmes de bourses, stages. Le dossier se dépose en personne au consulat, avec entretien et prise d'empreintes ; le délai légal de traitement est de 60 jours.",
    programs: [{
      officialName: "Long-term residence permit for the purpose of study", nameFr: "Titre de séjour de longue durée pour études",
      feesNote: `Des frais de dossier sont exigés au dépôt. ${CONFIRM_AMOUNTS}`,
      processingNote: "Le délai légal de traitement est de 60 jours. Un dossier incomplet ne peut pas être traité : son examen est suspendu jusqu'à ce que les pièces manquantes soient ajoutées, ce qui allonge la procédure.",
      steps: [
        { actor: "candidate", title: "Trouver le consulat où déposer la demande", description: "Chaque consulat fixe ses propres rendez-vous, le plus souvent par courriel ou par téléphone : consultez son site." },
        { actor: "candidate", title: "Prendre rendez-vous et déposer en personne", description: "Le dépôt se fait en personne, avec entretien et prise d'empreintes. Les enfants de moins de 12 ans n'ont pas d'empreintes à donner ; de 12 à 15 ans, ils viennent avec leurs parents ou tuteurs. Vérifiez si le régime de facilitation « Student » peut s'appliquer." },
        { actor: "candidate", title: "Réunir les pièces", description: "Ne déposez qu'un dossier complet.",
          documents: ["Passeport", "Formulaire de demande de titre de séjour de longue durée (formulaire vert)", "Deux photos", "Empreintes digitales (prises au dépôt)", "Justificatif de l'objet du séjour : le plus souvent la lettre d'admission ou une confirmation équivalente", "Justificatif d'hébergement", "Justificatif de moyens financiers : preuve de fonds correspondant à de réels frais de logement, OU prise en charge de tous les frais par un tiers (institution d'État, personne morale, organisation d'accueil, par exemple une bourse)", "Autorisation parentale de voyage pour un enfant, rédigée librement et signée par les deux parents ou tuteurs", "Extrait de casier judiciaire", "Frais de dossier"] },
        { actor: "candidate", title: "Respecter les règles de forme des pièces", description: "Les justificatifs ne doivent pas dater de plus de 180 jours (sauf le passeport et la photo). Ils sont remis en tchèque, ou avec une traduction officielle en tchèque. Les documents publics étrangers doivent être légalisés (apostille ou surlégalisation). Le passeport, la lettre d'admission et l'autorisation parentale sont remis en original ; les autres pièces en original ou en copie officiellement certifiée. Préparez aussi un jeu de copies." },
        { actor: "authority", title: "Décision", description: "Le délai légal est de 60 jours. Un dossier complet ne garantit pas la délivrance du titre ; il ne donne pas non plus automatiquement le droit d'entrer en Tchéquie ou dans l'espace Schengen : les conditions du Code frontières Schengen s'appliquent à la frontière." },
        { actor: "candidate", title: "Souscrire une assurance maladie de voyage une fois le visa accordé", description: "Elle n'est pas exigée au dépôt. Au retrait du visa, remettez une traduction officiellement certifiée en tchèque de la police et de ses conditions générales ; sur demande, la preuve du paiement." },
        { actor: "candidate", title: "Retirer le visa, ou le formulaire de refus", description: "Vous pouvez retirer votre passeport vous-même ou autoriser quelqu'un à le faire (procuration certifiée, sauf si vous avez prévenu le consulat au dépôt)." },
      ],
    }],
    sources: [{ label: "Ministère tchèque des Affaires étrangères : titre de séjour pour études", url: "https://mzv.gov.cz/jnp/en/information_for_aliens/long_stay_visa/study_long_term.html", authority: "ministry" }],
  },
  // ─── Estonie : études ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "EE", pathway: "study",
    summary: "Un titre de séjour pour études est exigé en Estonie des ressortissants de pays tiers dont les études durent plus d'un an et qui n'ont pas déjà un titre de séjour estonien à un autre titre. Il est délivré par la Police et garde-frontières pour toute la durée d'un programme à temps plein, jusqu'à 5 ans, après admission dans un établissement reconnu.",
    programs: [{
      officialName: "Temporary residence permit for study", nameFr: "Titre de séjour temporaire pour études",
      durationNote: "Délivré pour toute la durée du programme à temps plein, jusqu'à 5 ans selon le niveau d'études.",
      feesNote: `Des frais d'État sont à payer au dépôt. ${CONFIRM_AMOUNTS}`,
      processingNote: "Réponse sous 90 jours ; la carte de séjour est délivrée dans les 30 jours qui suivent.",
      steps: [
        { actor: "candidate", title: "Choisir un établissement estonien et réussir les épreuves d'admission", description: "Les établissements et les programmes sont présentés sur le site Study in Estonia ; contactez l'établissement pour connaître ses conditions d'admission." },
        { actor: "institution", title: "Faire confirmer l'admission", description: "L'établissement confirme que vous y êtes admis. Le titre convient aux élèves du primaire et du secondaire, aux élèves de l'enseignement professionnel, aux étudiants de licence, master et doctorat, aux cours préparatoires, aux stagiaires et aux jeunes en service volontaire." },
        { actor: "candidate", title: "Remplir les conditions et déposer le dossier", description: "Vous avez des revenus suffisants (quatre fois le minimum vital, fixé chaque année par la loi budgétaire), confirmés en signant la demande, et un contrat d'assurance maladie conforme à l'article 120 de la loi sur les étrangers, également confirmé en signant la demande. Déposez les pièces demandées et payez les frais d'État.", fee: "Montant à confirmer par votre conseiller" },
        { actor: "authority", title: "Décision et carte de séjour", description: "Réponse sous 90 jours ; carte de séjour délivrée dans les 30 jours suivants. Un dossier complet ne garantit pas la délivrance du titre." },
        { actor: "candidate", title: "Vous installer et conserver le titre", description: "Après réception du titre, vous vous installez en Estonie et enregistrez votre lieu de résidence au registre de la population. Pour le conserver, commencez vos études à temps, suivez tout le programme et ne l'interrompez pas. Vous pouvez travailler en parallèle si l'emploi ne gêne pas vos études et si vous restez à temps plein." },
      ],
    }],
    sources: [{ label: "Police et garde-frontières estonienne : titre de séjour pour études", url: "https://www.politsei.ee/en/instructions/residence-permit-for-study", authority: "immigration" }],
  },
  // ─── Estonie : travail ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "EE", pathway: "work",
    summary: "Le titre de séjour pour emploi est un titre temporaire délivré par la Police et garde-frontières estonienne pour travailler en Estonie, jusqu'à 5 ans. Il exige un employeur enregistré en Estonie, un salaire au moins égal au salaire brut moyen estonien (règle générale, avec des exceptions) et l'autorisation du Fonds d'assurance chômage que l'employeur obtient pour recruter un étranger.",
    programs: [{
      officialName: "Temporary residence permit for employment", nameFr: "Titre de séjour temporaire pour emploi",
      routeType: "employer", offerRequired: "yes",
      durationNote: "Délivré jusqu'à 5 ans ; prolongeable jusqu'à 10 ans à la fois.",
      feesNote: `Des frais d'État sont à payer au dépôt. ${CONFIRM_AMOUNTS}`,
      processingNote: "Réponse sous 90 jours ; la carte de séjour est délivrée dans les 30 jours qui suivent.",
      steps: [
        { actor: "candidate", title: "Trouver un emploi correspondant à l'un des motifs d'emploi", description: "Les motifs comprennent notamment : travailleur qualifié (conditions générales), travailleur intérimaire, saisonnier (emploi de courte durée seulement), spécialiste de haut niveau, membre d'un organe de direction, expert, salarié d'une start-up, scientifique ou enseignant, titulaire d'une Carte bleue européenne, diplômé d'un établissement supérieur estonien, salarié détaché depuis l'UE. Chaque motif a ses propres conditions, pour l'étranger comme pour l'employeur." },
        { actor: "employer", title: "Obtenir l'autorisation du Fonds d'assurance chômage", description: "L'employeur, enregistré en Estonie, obtient cette autorisation de recruter un étranger pour le poste. Il vous verse un salaire au moins égal au salaire brut moyen estonien (règle générale, avec exceptions) ; la page officielle publie le barème par date de dépôt.", fee: "Salaire minimal à confirmer par votre conseiller" },
        { actor: "candidate", title: "Remplir les conditions personnelles et déposer le dossier", description: "Vous avez la formation, l'expérience, l'état de santé et les compétences nécessaires pour le poste. Déposez les pièces demandées, des justificatifs supplémentaires pouvant être exigés selon le motif, et payez les frais d'État.", fee: "Montant à confirmer par votre conseiller" },
        { actor: "authority", title: "Décision et carte de séjour", description: "Réponse sous 90 jours ; carte de séjour délivrée dans les 30 jours suivants. Un dossier complet ne garantit pas la délivrance du titre." },
        { actor: "candidate", title: "Vous installer et préparer les prolongations", description: "Après réception du titre, vous vous installez en Estonie et enregistrez votre lieu de résidence au registre de la population. Depuis le 15 juillet 2018, un niveau A2 d'estonien est exigé si vous avez vécu 5 ans en Estonie avec un titre d'emploi délivré depuis le 16 juillet 2018 et que vous demandez une prolongation ou un nouveau titre d'emploi." },
      ],
    }],
    sources: [{ label: "Police et garde-frontières estonienne : titre de séjour pour emploi", url: "https://www.politsei.ee/en/instructions/residence-permit-for-employment", authority: "immigration" }],
  },
  // ─── Lettonie : études ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "LV", pathway: "study",
    summary: "Pour obtenir un titre de séjour en Lettonie en raison d'études dans un établissement d'enseignement supérieur accrédité, le dossier est constitué de pièces précises (passeport, formulaire, photo, moyens de subsistance, paiement du droit d'État, accord d'études) et l'établissement qui vous invite doit d'abord approuver l'invitation auprès de l'Office de la citoyenneté et des migrations.",
    programs: [{
      officialName: "Temporary residence permit for studies at an accredited higher education establishment", nameFr: "Titre de séjour temporaire pour études (enseignement supérieur accrédité)",
      feesNote: `Un droit d'État est à payer. ${CONFIRM_AMOUNTS}`,
      processingNote: "La page officielle lue date de 2022 (dernière mise à jour du 22 avril 2022) : les pièces et les montants sont à revérifier avant publication.",
      steps: [
        { actor: "institution", title: "Faire approuver l'invitation par l'Office de la citoyenneté et des migrations", description: "Avant le dépôt de vos documents, l'établissement qui vous invite approuve l'invitation auprès de l'Office." },
        { actor: "candidate", title: "Réunir les pièces", description: "Si vos enfants mineurs ou à charge vous accompagnent, joignez les mêmes pièces pour chacun (sauf l'acte de mariage), ainsi que la preuve du lien de parenté et l'autorisation de l'autre parent de résider en Lettonie, certifiée par notaire ou signée devant un agent d'une administration ou d'une représentation.",
          documents: ["Copie complète du passeport (la validité du document est certifiée par l'étranger lui-même)", "Formulaire de demande de titre de séjour", "Photographie", "Justificatif de moyens de subsistance (montant fixé par l'Office : à confirmer)", "Justificatif du paiement du droit d'État", "Accord d'études en Lettonie"] },
        { actor: "authority", title: "Décision", description: "L'Office décide. Un dossier complet ne garantit pas la délivrance du titre." },
      ],
    }],
    sources: [{ label: "Office letton de la citoyenneté et des migrations : études", url: "https://www.pmlp.gov.lv/en/studies", authority: "immigration" }],
  },
];
