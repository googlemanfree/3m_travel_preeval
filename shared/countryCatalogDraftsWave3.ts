/**
 * Brouillons de la vague 3 : pays hors Schengen, à partir de ce qui a pu être lu sur les pages officielles le 2026-11-19 — États-Unis (visiteur,
 * études), Australie (visiteur, études), Irlande (visiteur). Les portails américain et australien refusent la lecture directe par un robot
 * (erreur 403) : leur contenu a été relevé par recherche limitée au site officiel, extraits à l'appui, et chaque page reste donc À OUVRIR À LA MAIN
 * avant publication. Seuls les faits que ces extraits disent noir sur blanc sont écrits ; tout montant (frais de visa, ressources, assurance) ou délai
 * est volontairement laissé « à confirmer par votre conseiller », car ces valeurs changent et les extraits eux-mêmes signalaient parfois des pages anciennes.
 *
 * Les brouillons s'importent en « À confirmer » avec une source « à confirmer » : rien n'est publié par ce fichier.
 * Voir docs/GUIDES_VAGUE_3.md.
 */
import type { DraftPathway } from "./countryCatalogDrafts";

const CONFIRM_FEES = "Les frais changent : votre conseiller confirme le montant à jour avant tout paiement.";

export const COUNTRY_CATALOG_DRAFTS_WAVE_3: readonly DraftPathway[] = [
  // ─── États-Unis ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "US", pathway: "visit",
    summary: "Pour un séjour touristique ou d'affaires aux États-Unis, un visa de visiteur (B-1/B-2) est demandé selon la nationalité : formulaire en ligne DS-160, entretien avec un officier consulaire, puis décision. Le rendez-vous d'entretien se prend soi-même, et son délai varie.",
    programs: [{
      officialName: "Visitor visa (B-1/B-2)", nameFr: "Visa de visiteur (B-1/B-2)",
      feesNote: `Frais de demande non remboursables, à payer avant l'entretien lorsque c'est exigé. ${CONFIRM_FEES}`,
      processingNote: "Le délai pour obtenir un rendez-vous d'entretien varie : demandez tôt. L'entretien est en principe exigé.",
      steps: [
        { actor: "candidate", title: "Remplir le formulaire DS-160 en ligne", description: "Conservez la page de confirmation : l'ambassade ou le consulat retrouve votre demande grâce à son code-barres, et vous l'apportez à l'entretien." },
        { actor: "candidate", title: "Payer les frais de demande", description: "Non remboursables ; à payer avant l'entretien lorsque c'est exigé. Un supplément peut s'ajouter à la délivrance selon la nationalité.", fee: "Montant à confirmer par votre conseiller" },
        { actor: "candidate", title: "Prendre soi-même rendez-vous pour l'entretien", description: "L'ambassade ou le consulat ne le prend pas à votre place. Les instructions propres au poste où vous déposez sont sur son site." },
        { actor: "candidate", title: "Réunir les pièces de l'entretien", documents: ["Passeport valide au moins six mois après la fin du séjour prévu (sauf accord particulier selon le pays)", "Page de confirmation du DS-160", "Reçu de paiement des frais, si exigé", "Photo téléversée avec le DS-160 (une photo imprimée conforme si le téléversement échoue)"] },
        { actor: "authority", title: "Entretien consulaire et décision", description: "Un officier consulaire détermine si vous remplissez les conditions du visa de visiteur ; des empreintes digitales numériques sont prises. Un dossier complet ne garantit pas la délivrance." },
      ],
    }],
    sources: [{ label: "Département d'État : visa de visiteur", url: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html", authority: "immigration" }],
  },
  {
    countryCode: "US", pathway: "study",
    summary: "Pour étudier aux États-Unis avec un visa étudiant, il faut d'abord être admis par un établissement agréé SEVP et enregistré dans SEVIS : l'établissement délivre alors le formulaire I-20. Le candidat remplit le DS-160, prend rendez-vous pour l'entretien et paie les frais de visa.",
    programs: [{
      officialName: "Student visa (F-1)", nameFr: "Visa étudiant (F-1)",
      feesNote: `Frais de visa non remboursables, à payer avant l'entretien lorsque c'est exigé ; frais SEVIS I-901 dus après l'admission (certains candidats en sont dispensés : à vérifier pour votre cas). ${CONFIRM_FEES}`,
      steps: [
        { actor: "institution", title: "Être admis par un établissement agréé SEVP et enregistré dans SEVIS", description: "Une fois admis, l'établissement vous enregistre dans SEVIS puis délivre le formulaire I-20. Les personnes à charge ont chacune leur propre I-20." },
        { actor: "candidate", title: "Payer les frais SEVIS I-901", description: "Dus après l'enregistrement dans SEVIS ; certains candidats en sont dispensés.", fee: "Montant à confirmer par votre conseiller" },
        { actor: "candidate", title: "Remplir le formulaire DS-160 en ligne", description: "L'identifiant SEVIS et l'adresse de l'établissement, inscrits sur le I-20, sont demandés. Conservez la page de confirmation." },
        { actor: "candidate", title: "Prendre rendez-vous et payer les frais de visa", description: "Le DS-160 ne réserve pas l'entretien : prenez rendez-vous auprès de l'ambassade ou du consulat, qui indique si un entretien est exigé." },
        { actor: "candidate", title: "Réunir les pièces de l'entretien", documents: ["Passeport valide au moins six mois après la fin du séjour prévu", "Page de confirmation du DS-160", "Reçu de paiement des frais, si exigé", "Formulaire I-20 signé par vous et par le responsable de l'établissement"] },
        { actor: "authority", title: "Entretien consulaire et décision", description: "Un officier consulaire décide. Un dossier complet ne garantit pas la délivrance." },
      ],
    }],
    sources: [{ label: "Département d'État : visa étudiant", url: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html", authority: "immigration" }],
  },
  // ─── Australie ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "AU", pathway: "visit",
    summary: "Le visa de visiteur (sous-classe 600), volet Touriste pour les demandes déposées hors d'Australie, permet de visiter l'Australie pour le tourisme, une croisière ou pour voir famille et amis, jusqu'à 12 mois. La plupart des candidats déposent en ligne, dans un compte ImmiAccount.",
    programs: [{
      officialName: "Visitor visa (subclass 600), Tourist stream", nameFr: "Visa de visiteur (sous-classe 600), volet Touriste",
      durationNote: "Séjour jusqu'à 12 mois ; la durée accordée est fixée par la décision.",
      feesNote: CONFIRM_FEES,
      steps: [
        { actor: "candidate", title: "Choisir le bon volet et lire sa liste de pièces", description: "Le visa 600 comprend plusieurs volets (Touriste, visiteur d'affaires, famille parrainée…). Le ministère publie une liste de pièces pour chacun." },
        { actor: "candidate", title: "Créer un compte ImmiAccount et déposer la demande en ligne", description: "Le compte sert aussi à suivre l'avancement, ajouter des documents et mettre à jour ses coordonnées.", documents: ["Pièces demandées par la liste du volet Touriste"] },
        { actor: "authority", title: "Décision", description: "Le ministère de l'Intérieur décide. Un dossier complet ne garantit pas la délivrance." },
      ],
    }],
    sources: [{ label: "Home Affairs : visa de visiteur 600, volet Touriste (hors d'Australie)", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600/tourist-stream-overseas", authority: "immigration" }],
  },
  {
    countryCode: "AU", pathway: "study",
    summary: "Le visa étudiant (sous-classe 500) exige en principe une Confirmation of Enrolment (CoE) pour chaque cours prévu, une assurance santé pour étudiants étrangers (OSHC) et, pour les demandes déposées depuis le 23 mars 2024, de démontrer l'exigence d'étudiant authentique (Genuine Student). La demande se dépose en ligne dans ImmiAccount.",
    programs: [{
      officialName: "Student visa (subclass 500)", nameFr: "Visa étudiant (sous-classe 500)",
      feesNote: `${CONFIRM_FEES} Les moyens financiers exigés sont à confirmer sur la source officielle.`,
      steps: [
        { actor: "institution", title: "Obtenir la Confirmation of Enrolment (CoE)", description: "Sauf catégories particulières, une CoE pour chaque cours prévu est exigée au moment de la demande ; elle se joint à l'ImmiAccount." },
        { actor: "candidate", title: "Prévoir l'assurance santé OSHC", description: "La condition 8501 du visa impose l'Overseas Student Health Cover pendant tout le séjour. L'établissement peut l'organiser et l'indiquer sur la CoE ; sinon, joignez une preuve avec les dates de début et de fin." },
        { actor: "candidate", title: "Répondre à l'exigence d'étudiant authentique (Genuine Student)", description: "Pour les demandes déposées à partir du 23 mars 2024 : réponses écrites en anglais (150 mots au maximum par réponse) sur votre situation actuelle, le choix du cours et de l'établissement, et l'apport du cours pour vous. Les déclarations appuyées de preuves pèsent davantage ; si un cours similaire existe dans votre pays, il faut expliquer pourquoi vous ne l'y suivez pas." },
        { actor: "candidate", title: "Déposer la demande en ligne et joindre les pièces", description: "Dans ImmiAccount, avec les justificatifs (parcours d'études, emploi, preuves à l'appui de vos réponses).", documents: ["Confirmation of Enrolment (CoE)", "Preuve d'assurance OSHC (dates de début et de fin)", "Justificatifs à l'appui des réponses Genuine Student"] },
        { actor: "authority", title: "Décision", description: "Le ministère de l'Intérieur décide. Un dossier complet ne garantit pas la délivrance." },
      ],
    }],
    sources: [
      { label: "Home Affairs : visa étudiant 500, exigence d'étudiant authentique", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500/genuine-student-requirement", authority: "immigration" },
      { label: "Home Affairs : déposer une demande de visa étudiant", url: "https://immi.homeaffairs.gov.au/check-twice-submit-once/student-visa", authority: "immigration" },
    ],
  },
  // ─── Irlande ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "IE", pathway: "visit",
    summary: "Pour un court séjour de moins de 90 jours en Irlande, un visa « C » est demandé selon la nationalité. La demande se crée en ligne (AVATS), les frais se paient, puis les pièces sont envoyées au bureau indiqué sur la fiche récapitulative, dans les 30 jours.",
    programs: [{
      officialName: "Short Stay 'C' visa (visit)", nameFr: "Visa de court séjour « C » (visite)",
      durationNote: "Séjour de moins de 90 jours.",
      feesNote: CONFIRM_FEES,
      processingNote: "L'administration conseille de préparer la demande environ 3 mois avant le voyage.",
      steps: [
        { actor: "candidate", title: "Créer la demande dans AVATS", description: "Choisir le type « Short Stay (C) », le motif du voyage (par exemple « Visit Family/Friend ») et un ou plusieurs voyages. Le système donne un numéro de transaction (Visa Application Transaction Number) à conserver pour le suivi." },
        { actor: "candidate", title: "Payer les frais de visa", description: "Conservez la preuve de paiement : elle fait partie des pièces.", fee: "Montant à confirmer par votre conseiller" },
        { actor: "candidate", title: "Envoyer les pièces dans les 30 jours", description: "Au bureau indiqué sur votre fiche récapitulative, dans les 30 jours suivant la création de la demande dans AVATS. Des données biométriques peuvent être demandées dans certains cas.",
          documents: ["Fiches récapitulatives de la demande, signées", "Lettre de demande", "Lettre d'invitation de l'hôte (visite à la famille ou à des amis), avec copie couleur de sa pièce d'identité ; une lettre par adresse différente", "Plan d'hébergement", "Preuve de paiement des frais", "Deux photos d'identité en couleur, avec votre signature et le numéro de transaction au dos", "Passeport valide au moins six mois après le départ prévu, et copies de tous les anciens passeports", "Relevés bancaires originaux des six derniers mois, sur papier à en-tête (un relevé internet imprimé doit être certifié par la banque)", "Preuve de votre retour dans votre pays (attaches)", "Assurance voyage ou santé"] },
        { actor: "authority", title: "Décision", description: "Un dossier complet ne garantit pas la délivrance du visa." },
      ],
    }],
    sources: [{ label: "Immigration Service Delivery : visa pour visite à la famille ou à des amis", url: "https://www.irishimmigration.ie/coming-to-visit-ireland/how-to-apply-for-a-short-stay-c-visit-tourist-visa/visit-family-friend-visa/", authority: "immigration" }],
  },
];
