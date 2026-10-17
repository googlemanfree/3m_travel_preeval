/**
 * Contenus de la campagne d'enrichissement (octobre 2026) : FAQ générale, guide « vérifier une agence », etc.
 * Règles de rédaction (contrôlées par server/contentCampaign.regression.test.ts) : aucun prix ni délai chiffré,
 * aucune promesse de résultat, aucun montant unique de frais d'ouverture, aucun témoignage ou statistique inventés.
 */
import type { CommitmentItem, FaqItem, StepItem } from "@/data/pageEnrichment";

export type FaqGroup = { id: string; title: string; intro?: string; items: FaqItem[] };

// ---- /faq ------------------------------------------------------------------------------------------------------------

export const FAQ_GENERAL_GROUPS: FaqGroup[] = [
  {
    id: "demarrer",
    title: "Démarrer",
    intro: "Ce qu’il faut savoir avant de déposer votre première demande.",
    items: [
      {
        question: "Faut-il créer un compte pour commencer ?",
        answer: "Non. L’évaluation gratuite démarre sans compte : vous indiquez votre projet, votre destination, votre nationalité et vos coordonnées. Le compte est demandé ensuite, pour enregistrer votre dossier, déposer des pièces confidentielles et suivre son statut dans votre espace.",
      },
      {
        question: "L’évaluation est-elle vraiment gratuite ?",
        answer: "Oui. C’est une évaluation d’orientation : elle vous aide à situer votre projet et à savoir quelles pièces et quelles étapes sont à prévoir. Elle ne vous engage pas à ouvrir un dossier et ne remplace jamais la décision d’une autorité, d’une école ou d’un employeur.",
      },
      {
        question: "Que se passe-t-il après l’évaluation ?",
        answer: "Un conseiller relit votre évaluation, puis vous recevez un bilan avec les points forts, les points à clarifier et les pièces à réunir. Si vous décidez de continuer, un dossier est ouvert et un devis écrit vous est remis avant tout paiement.",
      },
      {
        question: "Dans quels pays pouvez-vous m’accompagner ?",
        answer: "L’annuaire des procédures et des destinations présente les pays documentés, par type de projet (travail, études, visiteur, formation, e-Visa). La liste évolue : consultez-la avant de décider, et demandez-nous si votre destination n’y figure pas encore.",
      },
      {
        question: "Puis-je être accompagné si je ne suis pas à Yaoundé ?",
        answer: "Oui. Le suivi se fait à distance, où que vous soyez en Afrique : échanges par WhatsApp, e-mail et espace client, avec un conseiller qui garde l’historique de votre dossier. L’agence de Yaoundé reçoit sur place ; le bureau d’Ottawa coordonne le Canada, sur rendez-vous.",
      },
      {
        question: "Quelle différence entre visa travail, visa études et visa visiteur ?",
        answer: "Le visa travail repose sur une offre ou une autorisation d’emploi, le visa études sur une admission dans un établissement, le visa visiteur (tourisme, famille, affaires de courte durée) sur un séjour temporaire. Les pièces, les autorités et les règles diffèrent : l’évaluation commence par choisir le bon type de projet.",
      },
    ],
  },
  {
    id: "frais",
    title: "Frais et paiement",
    intro: "Transparence sur ce que vous payez, à qui et quand.",
    items: [
      {
        question: "Combien coûte l’ouverture d’un dossier ?",
        answer: "Le montant dépend du type de profil. Il est fixé pour votre dossier et confirmé par écrit avant tout paiement : aucun règlement n’est demandé tant que vous n’avez pas reçu ce montant par écrit.",
      },
      {
        question: "Quels frais ne sont pas payés à 3M TRAVEL AGENCY ?",
        answer: "Les frais consulaires et gouvernementaux, les frais de tests de langue, l’assurance, les traductions assermentées et les billets sont réglés au prestataire ou à l’autorité concernés. Nous vous expliquons à quoi sert chaque ligne ; la page Tarifs détaille la différence entre honoraires et frais de tiers.",
      },
      {
        question: "Quels moyens de paiement sont acceptés ?",
        answer: "Carte bancaire dès que la passerelle est activée, Mobile Money, virement bancaire, dépôt sur le numéro de l’agence ou paiement en agence à Yaoundé. La page Moyens de paiement donne les modalités à jour ; ne payez que sur les coordonnées qui y figurent.",
      },
      {
        question: "Vais-je recevoir un reçu ?",
        answer: "Oui, un reçu nominatif vous est remis pour chaque paiement validé. Vérifiez que votre nom, la référence de dossier et le montant sont exacts, et conservez-le avec votre protocole d’accord.",
      },
      {
        question: "Puis-je être remboursé en cas d’abandon ?",
        answer: "Cela dépend de l’étape atteinte et de ce qui a déjà été réalisé. Les conditions figurent dans les documents que vous recevez (devis, protocole d’accord, reçu) et dans les conditions d’utilisation : lisez-les avant de payer et demandez toute précision par écrit.",
      },
      {
        question: "Les montants affichés sur le site sont-ils définitifs ?",
        answer: "Non. Les exemples de la page Tarifs sont illustratifs : votre devis dépend de votre profil, de la destination et des services choisis. Seul le devis écrit qui vous est remis fait foi.",
      },
    ],
  },
  {
    id: "documents",
    title: "Documents",
    intro: "Préparer, envoyer et corriger vos pièces.",
    items: [
      {
        question: "Quels documents préparer en premier ?",
        answer: "Un passeport en cours de validité, vos pièces d’état civil, vos diplômes et relevés, votre CV et les justificatifs liés à votre projet. La page Conformité des documents indique, par destination et par type de projet, les pièces habituellement attendues.",
      },
      {
        question: "Faut-il faire traduire ou légaliser mes documents ?",
        answer: "Souvent oui, mais cela dépend de la destination et de la pièce. Certaines autorités exigent une traduction assermentée, d’autres une légalisation ou une apostille. Nous vous indiquons ce qui est exigé pour votre dossier avant que vous engagiez ces frais.",
      },
      {
        question: "Comment envoyer mes documents en sécurité ?",
        answer: "Par votre espace client, où l’accès est limité à vous et à l’équipe affectée à votre dossier. Évitez d’envoyer vos pièces d’identité sur des messageries publiques ou à des adresses personnelles, et ne communiquez jamais un mot de passe.",
      },
      {
        question: "Un document m’a été renvoyé : que faire ?",
        answer: "Le motif vous est indiqué (illisible, incomplet, expiré, mauvais document, nom différent du passeport, traduction manquante…). Corrigez le point signalé et déposez à nouveau la pièce ; l’historique est conservé et l’équipe revérifie.",
      },
      {
        question: "Mon passeport doit-il être valable plus longtemps que le voyage ?",
        answer: "De nombreuses destinations exigent une validité minimale après la date d’arrivée prévue. La règle exacte dépend du pays : vérifiez-la sur la source officielle de la destination. Un conseiller signale les passeports dont la validité paraît insuffisante.",
      },
    ],
  },
  {
    id: "delais",
    title: "Délais et suivi",
    items: [
      {
        question: "Combien de temps dure une procédure ?",
        answer: "Cela dépend du pays, du type de visa, de la période et de la complétude du dossier. Les délais affichés sont indicatifs et datés ; ils sont fixés par les autorités, pas par 3M TRAVEL AGENCY, et peuvent changer sans préavis.",
      },
      {
        question: "Comment suivre l’avancement de mon dossier ?",
        answer: "Dans votre espace client : statut du dossier, pièces reçues ou à corriger, messages de l’équipe et prochaines étapes. Vous êtes averti des changements importants.",
      },
      {
        question: "Sous quel délai l’agence me répond-elle ?",
        answer: "Le délai de réponse annoncé et la manière dont il est compté (jours ouvrés à Yaoundé) figurent sur la page Contact. En dehors de ces horaires, votre message est traité dès la reprise.",
      },
      {
        question: "Mon dossier n’avance plus : que faire ?",
        answer: "Regardez d’abord si une pièce est à corriger ou si un message attend votre réponse dans votre espace. Sinon, écrivez-nous avec votre référence de dossier par WhatsApp ou par e-mail : un conseiller vous indique où en est la démarche et ce qui la bloque.",
      },
    ],
  },
  {
    id: "securite",
    title: "Sécurité et confidentialité",
    items: [
      {
        question: "Mes données personnelles sont-elles protégées ?",
        answer: "Elles ne servent qu’à traiter votre demande. L’accès est limité aux personnes habilitées, les échanges sont chiffrés et la politique de confidentialité précise la finalité, la conservation et vos droits.",
      },
      {
        question: "Qui peut voir mes documents ?",
        answer: "Vous et l’équipe affectée à votre dossier. Un employeur ou une agence partenaire ne voit qu’un profil anonymisé, uniquement si vous avez donné un accord actif, que vous pouvez retirer à tout moment.",
      },
      {
        question: "Me demanderez-vous mon mot de passe ou un code reçu par SMS ?",
        answer: "Jamais. 3M TRAVEL AGENCY ne demande ni mot de passe ni code de vérification, ni par message, ni par téléphone. Si on vous les réclame au nom de l’agence, n’y répondez pas et prévenez-nous.",
      },
      {
        question: "Comment savoir qu’un message vient bien de 3M TRAVEL AGENCY ?",
        answer: "Nos canaux officiels sont le WhatsApp de l’agence, l’adresse e-mail hello@3mtravelagency.com sur notre domaine et votre espace client. En cas de doute, ne payez rien et consultez la page « Vérifier une agence avant de payer ».",
      },
    ],
  },
  {
    id: "visas",
    title: "Visas, e-Visa et décisions",
    items: [
      {
        question: "3M TRAVEL AGENCY peut-elle obtenir mon visa ?",
        answer: "Non. La décision appartient aux autorités du pays concerné. Nous préparons votre dossier, vous orientons vers les bonnes sources et suivons la démarche avec vous, sans promettre de résultat.",
      },
      {
        question: "Qu’est-ce qu’un e-Visa ?",
        answer: "Une autorisation d’entrée demandée en ligne sur un portail officiel, sans passage au consulat dans de nombreux cas. Les conditions, frais et délais dépendent du pays : chaque fiche e-Visa renvoie vers le portail officiel et indique la date de dernière vérification.",
      },
      {
        question: "Dois-je obligatoirement passer par une agence pour un e-Visa ?",
        answer: "Non. Vous pouvez déposer votre demande vous-même sur le portail officiel. Notre aide consiste à préparer et relire votre dossier avant dépôt ; elle est facultative.",
      },
      {
        question: "Que se passe-t-il en cas de refus ?",
        answer: "L’autorité notifie sa décision, parfois avec ses motifs. Nous analysons ces éléments avec vous pour comprendre ce qui peut être corrigé et si une nouvelle demande est possible selon les règles du pays. Aucun résultat n’est promis.",
      },
      {
        question: "Puis-je préparer plusieurs destinations en parallèle ?",
        answer: "Oui, projet par projet, avec un dossier distinct pour chaque destination. Le nombre de dossiers simultanés est limité afin de garder un suivi sérieux ; votre conseiller vous précise la limite en vigueur.",
      },
    ],
  },
  {
    id: "reclamations",
    title: "Annulation, réclamation et agence",
    items: [
      {
        question: "Comment annuler une demande ?",
        answer: "Par écrit (e-mail ou message de votre espace), avec votre référence de dossier. Les conséquences dépendent de l’étape atteinte : elles vous sont expliquées avant toute décision de votre part.",
      },
      {
        question: "Comment faire une réclamation ?",
        answer: "Écrivez-nous en décrivant le problème et en joignant vos justificatifs, par e-mail ou par la page Contact. Une réponse écrite vous est adressée ; nous conservons l’historique des échanges.",
      },
      {
        question: "Où se trouve l’agence ?",
        answer: "À Yaoundé, quartier Biyem-Assi, Montée Chapelle Obili, avec réception sur place. Un bureau à Ottawa coordonne le Canada, sur rendez-vous. Les coordonnées complètes sont sur la page Contact.",
      },
      {
        question: "Les avis publiés sur le site sont-ils réels ?",
        answer: "Oui. Aucun avis n’est inventé : chaque témoignage est soumis par une personne qui a réellement eu affaire à l’agence, modéré, et publié avec son accord. Sans avis approuvé, la galerie reste vide : c’est volontaire.",
      },
    ],
  },
];

/** Aplatit les groupes (utile pour les tests et pour les données structurées). */
export const FAQ_GENERAL_ITEMS: FaqItem[] = FAQ_GENERAL_GROUPS.flatMap((group) => group.items);

// ---- /verifier-une-agence -----------------------------------------------------------------------------------------

export const AGENCY_RED_FLAGS: CommitmentItem[] = [
  { title: "Un visa, un emploi ou une admission « assurés »", text: "Aucune agence ne décide à la place d’un consulat, d’un employeur ou d’une école. Toute promesse de résultat est un signal d’alerte." },
  { title: "Un paiement sur un numéro personnel, sans reçu", text: "Un règlement doit aller sur des coordonnées publiées par l’organisme, donner lieu à un reçu nominatif et rester traçable." },
  { title: "Une urgence inventée", text: "« Il ne reste qu’une place », « payez aujourd’hui ou perdez votre dossier » : la pression sert à vous empêcher de vérifier." },
  { title: "Pas de contrat ni de devis écrit", text: "Ce qui est vendu, son prix, ce qui est inclus et les conditions d’annulation doivent figurer par écrit avant tout paiement." },
  { title: "Aucune adresse vérifiable", text: "Une agence sérieuse a une adresse physique, un enregistrement légal consultable et des personnes joignables." },
  { title: "Une offre d’emploi sans employeur identifié", text: "Si vous ne pouvez pas contacter l’employeur par un canal officiel, ne payez rien : l’offre n’est pas vérifiable." },
  { title: "Des frais « pour accélérer » auprès d’un consulat", text: "Les frais officiels sont publiés par l’autorité. Un intermédiaire ne peut pas acheter un traitement plus rapide ni une décision favorable." },
  { title: "La demande de vos identifiants ou de codes reçus par SMS", text: "Personne n’a besoin de vos mots de passe ni de vos codes de vérification pour préparer votre dossier." },
];

export const AGENCY_CHECKS: StepItem[] = [
  { title: "Vérifier l’enregistrement légal", text: "Demandez la raison sociale et le numéro d’immatriculation, puis recherchez-les sur le registre officiel du commerce de votre pays. Les noms et numéros doivent concorder avec les documents que l’on vous remet." },
  { title: "Se rendre sur place ou en visioconférence", text: "Visitez l’agence ou demandez un échange en visio. Une organisation réelle accepte de se présenter et de répondre à vos questions." },
  { title: "Exiger un devis et un contrat écrits", text: "Le document précise les services, le prix, ce qui reste à la charge de tiers, les étapes et les conditions d’abandon. Ne payez pas avant de l’avoir lu." },
  { title: "Payer par un moyen traçable et obtenir un reçu", text: "Paiement sur les coordonnées officielles de l’organisme, reçu nominatif avec votre référence. Gardez toutes les preuves." },
  { title: "Recouper auprès des sources officielles", text: "Conditions de visa, frais et délais se vérifient sur les sites des consulats, ministères ou services d’immigration. Si l’agence contredit la source officielle, croyez la source." },
  { title: "Contacter vous-même l’école ou l’employeur", text: "Retrouvez ses coordonnées par un annuaire officiel, pas par le lien que l’agence vous donne, et confirmez que l’admission ou l’offre existe." },
];

export const AGENCY_3M_DOES: string[] = [
  "Remettre un devis écrit avant tout paiement ; le montant d’ouverture dépend du profil et vous est confirmé par écrit.",
  "Délivrer un reçu nominatif pour chaque paiement validé et conserver l’historique dans votre espace client.",
  "Indiquer à chaque étape ce qui relève des autorités, des écoles ou des employeurs, sans promettre de résultat.",
  "Ne jamais vous demander de mot de passe ni de code de vérification.",
  "Ne publier que des avis réels, modérés et autorisés ; ne jamais en inventer.",
  "Citer ses sources officielles et la date de dernière vérification sur les pages de procédures.",
];

export const AGENCY_IF_SCAMMED: string[] = [
  "Cessez tout paiement et toute communication d’informations personnelles avec l’intermédiaire.",
  "Conservez les preuves : messages, reçus, captures d’écran, numéros utilisés, noms mentionnés.",
  "Si un paiement a été fait par Mobile Money ou virement, contactez sans attendre l’opérateur ou la banque pour signaler l’opération.",
  "Signalez les faits aux autorités compétentes de votre pays (police, gendarmerie ou parquet) et, si une plateforme est utilisée, signalez le compte.",
  "Si votre passeport ou vos pièces d’identité ont été transmis, surveillez leur usage et signalez toute utilisation suspecte à l’administration émettrice.",
];

export const AGENCY_CHECK_FAQ: FaqItem[] = [
  {
    question: "Comment vérifier que 3M TRAVEL AGENCY est enregistrée ?",
    answer: "Notre raison sociale, notre numéro d’immatriculation au registre du commerce et notre identifiant fiscal sont publiés sur cette page et dans la politique de confidentialité. Vous pouvez les rechercher vous-même sur le portail officiel du registre (lien ci-dessous) et venir nous rencontrer à Yaoundé.",
  },
  {
    question: "Une agence peut-elle garantir un visa si elle a des contacts à l’ambassade ?",
    answer: "Non. Aucune relation avec un agent ne remplace l’examen du dossier par l’autorité, et se présenter comme capable d’influencer une décision est un signe d’escroquerie ou de pratique illégale.",
  },
  {
    question: "Est-il normal de payer avant d’avoir vu un contrat ?",
    answer: "Non. Demandez toujours un devis ou un contrat écrit avant tout paiement. Si on refuse ou si on vous presse, arrêtez-vous.",
  },
  {
    question: "Que faire si j’ai déjà payé une agence douteuse ?",
    answer: "Appliquez les mesures de la section « Si vous avez déjà payé » : cessez les paiements, conservez les preuves, alertez votre opérateur ou votre banque et signalez les faits aux autorités. Vous pouvez aussi nous écrire pour que nous vous aidions à vérifier ce que l’on vous a remis.",
  },
];

// ---- /evisas -------------------------------------------------------------------------------------------------------------

export const EVISA_HOW_STEPS: StepItem[] = [
  { title: "Vérifier l’éligibilité", text: "Confirmez, sur la fiche du pays et sur le portail officiel, que votre nationalité et votre motif de voyage ouvrent droit à un e-Visa et non à un visa déposé auprès d’un consulat." },
  { title: "Réunir les pièces", text: "Passeport en cours de validité, photo conforme, justificatifs de voyage (itinéraire, hébergement ou invitation) et moyen de paiement en ligne : les exigences exactes sont celles du portail officiel." },
  { title: "Déposer sur le portail officiel", text: "Créez la demande, relisez chaque champ (le nom doit être identique à celui du passeport), réglez les frais officiels et conservez l’accusé de réception." },
  { title: "Conserver et présenter l’autorisation", text: "Imprimez ou enregistrez l’autorisation reçue, vérifiez les dates et le nombre d’entrées, puis présentez-la avec votre passeport à l’embarquement et à l’arrivée." },
];

export const EVISA_BEFORE_YOU_APPLY: string[] = [
  "Votre passeport est valable assez longtemps après la date d’arrivée prévue (la règle exacte dépend du pays).",
  "Votre nom, votre date de naissance et votre numéro de passeport sont saisis exactement comme sur le passeport.",
  "Vous êtes sur le portail officiel du pays : vérifiez l’adresse du site, qui doit correspondre à celle indiquée sur la fiche.",
  "Vous avez lu les frais officiels et la date de dernière vérification affichée sur la fiche : les frais et délais peuvent changer sans préavis.",
  "Votre adresse e-mail est accessible, car l’autorisation et les demandes de compléments y sont envoyées.",
  "Vous avez prévu un itinéraire, un hébergement ou une invitation, et un justificatif de retour si le pays le demande.",
];

export const EVISA_HUB_FAQ: FaqItem[] = [
  {
    question: "Un e-Visa est-il la même chose qu’un visa à l’arrivée ?",
    answer: "Non. L’e-Visa se demande en ligne avant le départ et l’autorisation est présentée à l’embarquement ; le visa à l’arrivée se délivre sur place, à la frontière, selon des conditions propres à chaque pays. Les deux régimes changent : vérifiez la règle en vigueur avant de réserver votre billet.",
  },
  {
    question: "Dois-je passer par une agence pour obtenir un e-Visa ?",
    answer: "Non. Vous pouvez déposer votre demande vous-même sur le portail officiel. Notre aide est facultative : relecture du dossier avant dépôt et conseils sur les pièces, jamais une promesse d’obtention.",
  },
  {
    question: "Pourquoi les frais ne sont-ils pas les mêmes d’un pays à l’autre ?",
    answer: "Chaque pays fixe librement ses frais, sa durée de validité et ses conditions. Les montants affichés sur les fiches sont ceux relevés sur le portail officiel à la date de vérification indiquée ; seul le portail fait foi au moment du dépôt.",
  },
  {
    question: "Comment reconnaître un faux portail e-Visa ?",
    answer: "Méfiez-vous des sites qui ressemblent au portail officiel mais ajoutent des frais de « traitement accéléré », ne montrent aucune mention de l’autorité qui délivre l’autorisation ou utilisent une adresse inhabituelle. Passez toujours par le lien officiel cité sur la fiche du pays, et consultez notre guide pour vérifier une agence avant de payer.",
  },
  {
    question: "Que faire si ma demande d’e-Visa est refusée ou reste sans réponse ?",
    answer: "Relisez le message de l’autorité pour en comprendre le motif, corrigez ce qui peut l’être et vérifiez si une nouvelle demande est permise. Si la réponse tarde, utilisez uniquement les canaux de contact du portail officiel. Aucun résultat ne peut être promis.",
  },
];
