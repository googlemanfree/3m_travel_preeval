/**
 * Contenu éditorial des pages publiques à enrichir (parcours, CNI & passeport, tourisme, consultation, assurance, partenaires).
 * Règles : faits vérifiables seulement ; aucun prix, aucun délai chiffré, aucun résultat promis ; le montant des frais
 * d'ouverture dépend du profil et est toujours confirmé par écrit avant paiement.
 */

export type FaqItem = { question: string; answer: string };
export type StepItem = { title: string; text: string };
export type CommitmentItem = { title: string; text: string };

/** Engagements communs à toute la plateforme : chacun correspond à un fonctionnement réel du site. */
export const COMMITMENTS: CommitmentItem[] = [
  { title: "Frais annoncés avant paiement", text: "Le montant des frais d’ouverture dépend de votre profil et vous est confirmé par écrit avant tout paiement. Les frais payés à des tiers (autorités, centres de visa, assureurs, traducteurs) sont indiqués séparément." },
  { title: "Aucune promesse de résultat", text: "Les décisions de visa, d’admission ou d’emploi appartiennent aux autorités, aux établissements et aux employeurs. 3M prépare, oriente et suit votre dossier ; elle ne vend ni visa ni emploi." },
  { title: "Un dossier suivi, pas dispersé", text: "Votre espace client centralise le statut, les pièces demandées et les échanges avec l’équipe : vous savez toujours quelle est la prochaine action." },
  { title: "Vos données sous votre contrôle", text: "Vos pièces ne sont communiquées à un employeur ou à une agence partenaire qu’avec votre accord distinct, que vous pouvez retirer à tout moment." },
  { title: "Des interlocuteurs identifiés", text: "Agence à Yaoundé, bureau à Ottawa, WhatsApp et rendez-vous : vous échangez avec une équipe réelle, pas avec un formulaire anonyme." },
];

// ---- /parcours -------------------------------------------------------------------------------------------------------

/** Ce que le candidat reçoit concrètement à chaque étape du parcours (même ordre que les cinq étapes de la page). */
export const PARCOURS_DELIVERABLES: StepItem[] = [
  { title: "Entrée", text: "Votre demande est enregistrée avec son contexte (campagne, WhatsApp ou formulaire) : vous n’avez pas à tout réexpliquer." },
  { title: "Profil", text: "Un questionnaire structuré sur votre formation, votre expérience, vos langues et vos projets ; vous pouvez y joindre votre CV." },
  { title: "Orientation", text: "Un rapport expliqué : destinations possibles, points forts de votre profil et points de vigilance. Vous décidez ensuite de poursuivre ou non." },
  { title: "Dossier", text: "La liste des pièces utiles à votre démarche, un espace pour les déposer et un contrôle avec vous de leur lisibilité et de leur cohérence." },
  { title: "Suivi", text: "La prochaine action à réaliser, la personne qui doit la faire et l’état d’avancement de votre dossier, visibles dans votre espace client." },
];

export const PARCOURS_FAQ: FaqItem[] = [
  {
    question: "Faut-il payer pour commencer ?",
    answer: "L’évaluation de votre profil est gratuite. Les frais d’ouverture de dossier ne sont demandés qu’ensuite, si vous décidez de poursuivre : leur montant dépend de votre profil et vous est confirmé par écrit avant tout paiement.",
  },
  {
    question: "Puis-je comparer plusieurs destinations ?",
    answer: "Oui. L’évaluation étudie votre parcours pour plusieurs destinations possibles ; vous choisissez ensuite celle que vous souhaitez approfondir avec un conseiller.",
  },
  {
    question: "Et si mon profil ne correspond pas à la destination que je souhaite ?",
    answer: "Le rapport vous l’explique avec les points à renforcer ou d’autres pistes plus adaptées. Aucun dossier n’est engagé sans votre accord.",
  },
  {
    question: "Mes documents sont-ils partagés avec d’autres ?",
    answer: "Non, pas sans votre accord. Vos pièces restent dans l’espace sécurisé de votre dossier et ne sont communiquées à un employeur ou à une agence partenaire qu’avec votre accord distinct, que vous pouvez retirer.",
  },
  {
    question: "Quand vais-je recevoir mon rapport d’orientation ?",
    answer: "Le délai de retour vous est indiqué lors de l’évaluation ; il peut varier selon le volume de demandes. Vous êtes prévenu dans votre espace client dès que le rapport est disponible.",
  },
];

// ---- /cni-passeport --------------------------------------------------------------------------------------------------

export const CNI_FAQ: FaqItem[] = [
  {
    question: "Quels frais dois-je prévoir ?",
    answer: "Les frais officiels sont ceux de l’administration et se règlent selon ses règles. L’accompagnement de 3M, lorsque vous le demandez, vous est annoncé avant tout paiement.",
  },
  {
    question: "Puis-je préparer mon dossier avant de me déplacer à Yaoundé ?",
    answer: "Oui. Votre conseiller vous indique la liste des pièces à réunir et vérifie votre dossier avant le dépôt, pour éviter un déplacement inutile.",
  },
  {
    question: "Que faire en cas de perte ou de vol ?",
    answer: "Précisez-le dès votre message : la démarche diffère d’un simple renouvellement et votre conseiller vous indique les justificatifs et déclarations à prévoir.",
  },
  {
    question: "Les délais sont-ils fixes ?",
    answer: "Non. Ils dépendent de l’administration ; aucun délai n’est promis à l’avance et votre conseiller vous informe de l’avancement de votre dossier.",
  },
];

// ---- /assurance ------------------------------------------------------------------------------------------------------

export const ASSURANCE_PREPARE: string[] = [
  "L’identité et le numéro de passeport de chaque voyageur",
  "Le pays de destination, les dates de départ et de retour et le motif du voyage",
  "Le pays de résidence et la nationalité de chaque voyageur",
  "Un contact à prévenir en cas d’urgence, avec son numéro de téléphone",
];

export const ASSURANCE_FAQ: FaqItem[] = [
  {
    question: "Quand l’assurance est-elle émise ?",
    answer: "Votre demande est d’abord validée par un conseiller, qui vérifie les informations. L’émission intervient ensuite, selon les conditions de l’assureur.",
  },
  {
    question: "Puis-je assurer plusieurs voyageurs ?",
    answer: "Oui. Le formulaire permet d’ajouter d’autres voyageurs au même voyage ; chacun renseigne son identité et son numéro de passeport.",
  },
  {
    question: "L’assurance suffit-elle pour obtenir un visa ?",
    answer: "Non. Elle fait souvent partie des pièces demandées, mais la décision de visa appartient à l’autorité consulaire. Votre conseiller vous aide à vérifier les exigences de votre destination.",
  },
  {
    question: "Mes informations sont-elles protégées ?",
    answer: "Elles servent uniquement à préparer votre demande d’assurance et sont traitées par l’équipe 3M. Le numéro de passeport n’est jamais affiché publiquement.",
  },
];

// ---- /tourisme -------------------------------------------------------------------------------------------------------

export const TOURISM_STEPS: StepItem[] = [
  { title: "Vous décrivez votre besoin", text: "Ville, dates, nombre de voyageurs, budget et préférences : plus votre demande est précise, plus la proposition est pertinente." },
  { title: "Un conseiller étudie votre demande", text: "Il compare les options disponibles auprès des prestataires et vérifie qu’elles correspondent à votre séjour." },
  { title: "Vous recevez une proposition", text: "Le devis vous est présenté pour décision : rien n’est réservé sans votre accord." },
];

export const TOURISM_FAQ: FaqItem[] = [
  {
    question: "Le devis m’engage-t-il ?",
    answer: "Non. Il vous est présenté pour décision ; aucune réservation n’est faite sans votre accord.",
  },
  {
    question: "Puis-je demander plusieurs services dans la même demande ?",
    answer: "Oui : hébergement, véhicule ou pack professionnel peuvent être demandés ensemble, en cochant les services à inclure.",
  },
  {
    question: "Les tarifs sont-ils affichés sur la page ?",
    answer: "Non. Ils dépendent de la ville, des dates et des disponibilités ; ils vous sont communiqués dans le devis, avant tout engagement.",
  },
  {
    question: "Pourquoi un compte est-il demandé ?",
    answer: "Il relie votre demande à votre espace client, où vous suivez la réponse du conseiller et conservez vos échanges.",
  },
];

// ---- /consultation ---------------------------------------------------------------------------------------------------

export const CONSULTATION_STEPS: StepItem[] = [
  { title: "Vous choisissez votre sujet", text: "Immigration, visa, études, travail, regroupement familial ou autre projet : le conseiller qui vous répond connaît déjà votre besoin." },
  { title: "Un conseiller vous contacte", text: "Il analyse votre projet, vous pose les questions utiles et vous oriente vers les démarches adaptées à votre situation." },
  { title: "Vous décidez de la suite", text: "À l’issue de l’échange, vous poursuivez ou non avec une évaluation de profil, sans engagement." },
];

export const CONSULTATION_PREPARE: string[] = [
  "Votre projet en quelques phrases : pays visé, motif, calendrier souhaité",
  "Votre parcours : diplômes, expériences professionnelles, langues parlées",
  "Votre situation administrative : passeport en cours de validité ou non, démarches déjà entreprises",
  "Vos questions : listez-les pour ne rien oublier pendant l’échange",
];

export const CONSULTATION_FAQ: FaqItem[] = [
  {
    question: "La consultation est-elle vraiment sans engagement ?",
    answer: "Oui. La prise de rendez-vous est gratuite et sans engagement. Si vous décidez ensuite d’ouvrir un dossier, le montant des frais d’ouverture dépend de votre profil et vous est confirmé par écrit avant tout paiement.",
  },
  {
    question: "Dois-je avoir tous mes documents avant de demander un rendez-vous ?",
    answer: "Non. Le premier échange sert justement à identifier les pièces utiles. Munissez-vous simplement des informations de base sur votre parcours et votre projet.",
  },
  {
    question: "Le conseiller peut-il me garantir un visa ?",
    answer: "Non, et méfiez-vous de quiconque le promet : seules les autorités décident. Le conseiller vous explique la voie la plus réaliste, les pièces à fournir et les points de vigilance.",
  },
  {
    question: "Puis-je préférer WhatsApp à un appel ?",
    answer: "Vous laissez votre numéro dans le formulaire et vous pouvez aussi écrire directement à l’équipe sur WhatsApp : l’échange se poursuit sur le canal qui vous convient.",
  },
];

// ---- /partenaires (français et anglais) ------------------------------------------------------------------------------

export const PARTNERS_FAQ: { fr: FaqItem[]; en: FaqItem[] } = {
  fr: [
    {
      question: "Quels profils sont présentés aux employeurs et aux agences ?",
      answer: "Uniquement des profils anonymisés dont le candidat a autorisé le partage. Chaque fiche de synthèse est relue et validée par un administrateur de 3M avant d’être visible, et elle ne contient ni coordonnées ni numéros de pièces.",
    },
    {
      question: "Le portrait du candidat figure-t-il sur la fiche ?",
      answer: "Seulement si le candidat a donné un accord distinct pour la photo. Sans cet accord, la fiche est diffusée sans portrait.",
    },
    {
      question: "Comment les organisations sont-elles vérifiées ?",
      answer: "Toute demande d’accès est examinée avant l’ouverture d’un compte : les identifiants sont remis par 3M après examen de l’inscription. Il n’y a aucun accès automatique.",
    },
    {
      question: "Qui décide de l’embauche et de l’immigration ?",
      answer: "L’employeur décide du recrutement, les autorités décident de l’immigration. 3M assure le suivi administratif entre les parties et ne promet aucune issue.",
    },
  ],
  en: [
    {
      question: "Which profiles are shown to employers and agencies?",
      answer: "Only anonymised profiles that the candidate has agreed to share. Each summary sheet is reviewed and approved by a 3M administrator before it becomes visible, and it contains no contact details or document numbers.",
    },
    {
      question: "Does the candidate’s portrait appear on the sheet?",
      answer: "Only if the candidate has given a separate consent for the photo. Without it, the sheet is shared without a portrait.",
    },
    {
      question: "How are organisations verified?",
      answer: "Every access request is reviewed before an account is opened: credentials are issued by 3M after the registration is examined. There is no automatic access.",
    },
    {
      question: "Who decides on hiring and immigration?",
      answer: "The employer decides on recruitment and the authorities decide on immigration. 3M handles the administrative follow-up between the parties and does not guarantee any outcome.",
    },
  ],
};
