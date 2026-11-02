/**
 * Contenus de la campagne d'enrichissement, lot 5 : /traduction/order.
 * Mêmes règles que contentCampaign.ts : aucun chiffre assorti d'une unité, aucune promesse.
 * Les tarifs viennent du serveur (grille de tarification) ; les délais et le statut assermenté ne sont pas inventés ici :
 * ils sont confirmés par écrit après examen de la demande.
 */
import type { FaqItem, StepItem } from "@/data/pageEnrichment";

/** Libellés français des types de document du formulaire (la valeur envoyée au serveur ne change pas). */
export const TRANSLATION_DOCUMENT_LABELS: Record<string, string> = {
  birth_certificate: "Acte de naissance",
  diploma: "Diplôme",
  transcript: "Relevé de notes",
  criminal_record: "Casier judiciaire",
  marriage_certificate: "Acte de mariage",
  divorce_decree: "Jugement de divorce",
  employment_letter: "Attestation de travail",
  bank_statement: "Relevé bancaire",
  passport: "Passeport",
  driver_license: "Permis de conduire",
  medical_report: "Rapport médical",
  other: "Autre document",
};

export const TRANSLATION_STEPS: StepItem[] = [
  { title: "Remplir la demande", text: "Vous indiquez votre identité, le type de document, la langue d’origine et la langue de destination, et le nombre de pages." },
  { title: "Voir l’estimation", text: "Dès que le type de document et les deux langues sont choisis, le tarif par page s’affiche, puis le total estimé selon le nombre de pages." },
  { title: "Envoyer le document", text: "Vous joignez un fichier lisible. Il est transmis de manière sécurisée à l’équipe qui traite la demande." },
  { title: "Recevoir les instructions de paiement", text: "Après l’envoi, un e-mail vous donne les instructions de paiement. Vous ne payez rien avant d’avoir reçu cette confirmation écrite." },
  { title: "Récupérer la traduction", text: "La traduction vous est remise selon les modalités confirmées par écrit dans cet échange." },
];

export const TRANSLATION_PREPARE: string[] = [
  "Scannez ou photographiez chaque page entière, bien à plat, sans coin coupé ni reflet.",
  "Joignez le recto et le verso, les cachets, les signatures et les mentions en marge : ce sont des éléments à traduire aussi.",
  "Vérifiez que les noms et prénoms correspondent à ceux du passeport, avec la même orthographe.",
  "Indiquez le nombre de pages du document tel qu’il sera envoyé, pas celui d’un modèle.",
  "Avant de commander, demandez à l’autorité qui recevra le document si elle exige une traduction simple ou assermentée.",
  "Ne traduisez pas vous-même un document officiel : une traduction faite sans cadre peut être refusée.",
];

export const TRANSLATION_FAQ: FaqItem[] = [
  {
    question: "Quelle différence entre une traduction simple et une traduction assermentée ?",
    answer: "Une traduction simple restitue le contenu dans une autre langue. Une traduction assermentée est signée par un traducteur habilité par une juridiction et porte sa mention officielle. Laquelle est exigée dépend de l’autorité qui recevra le document : demandez-le-lui avant de commander, ou écrivez-nous. Ce qui vous sera livré est confirmé par écrit.",
  },
  {
    question: "Quels documents puis-je faire traduire ?",
    answer: "Le formulaire propose les documents les plus demandés dans un dossier : acte de naissance, diplôme, relevé de notes, casier judiciaire, acte de mariage, jugement de divorce, attestation de travail, relevé bancaire, passeport, permis de conduire et rapport médical. Pour tout autre document, choisissez « Autre document » et décrivez-le dans votre échange avec nous.",
  },
  {
    question: "Comment le prix est-il calculé ?",
    answer: "Le tarif est établi par page, selon le type de document et la combinaison de langues. L’estimation s’affiche avant l’envoi de la demande. Le montant définitif et les instructions de paiement vous sont envoyés par e-mail avant tout paiement.",
  },
  {
    question: "Faut-il payer avant d’envoyer le document ?",
    answer: "Non. Vous envoyez la demande et le document, puis vous recevez par e-mail les instructions de paiement. Si on vous demande de payer avant, sur un autre canal ou à une autre personne, ne le faites pas et écrivez-nous.",
  },
  {
    question: "Combien de temps faut-il pour obtenir la traduction ?",
    answer: "Le délai dépend du volume, de la combinaison de langues et de la lisibilité du document. Nous le précisons par écrit après examen de votre demande, plutôt que d’afficher ici un délai qui ne tiendrait pas pour tous les cas.",
  },
  {
    question: "Une traduction suffit-elle pour que mon document soit accepté ?",
    answer: "Pas toujours. Certaines autorités demandent aussi la légalisation ou l’apostille du document d’origine : ce sont des formalités distinctes de la traduction. Notre page sur la conformité des documents explique ces trois notions et aide à savoir laquelle vous concerne.",
  },
  {
    question: "Que se passe-t-il si mon scan est illisible ?",
    answer: "Nous vous écrivons pour demander un nouveau fichier avant de commencer. Un document dont une partie est illisible ne doit pas être traduit « au mieux » : une mention manquante peut faire refuser le dossier.",
  },
  {
    question: "Mon document est-il en sécurité ?",
    answer: "Le fichier est transmis de manière sécurisée à l’équipe qui traite la demande. Par prudence, ne l’envoyez jamais à une personne qui vous contacte spontanément sur les réseaux sociaux, et ne communiquez jamais de mot de passe : 3M TRAVEL AGENCY n’en demande pas.",
  },
];
