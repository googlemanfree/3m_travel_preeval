/**
 * Contenus de la campagne d'enrichissement, lot 3 : employeurs, agences de placement, programme ambassadeur.
 * Mêmes règles que contentCampaign.ts (contrôlées par server/contentCampaign.regression.test.ts) :
 * aucun chiffre assorti d'une unité, aucune promesse de résultat, aucun délai ni taux inventé.
 * Les délais de vérification et le barème des commissions ne sont volontairement pas publiés ici : ils sont confirmés par écrit.
 */
import type { CommitmentItem, FaqItem, StepItem } from "@/data/pageEnrichment";

// ---- /employeurs ---------------------------------------------------------------------------------------------------------
export const EMPLOYER_HOW_STEPS: StepItem[] = [
  { title: "Identifier votre organisation", text: "Vous renseignez la raison sociale, le pays, le secteur d’activité et un contact professionnel. Une adresse de messagerie personnelle n’est pas adaptée : l’accès est remis à l’organisation." },
  { title: "Vérification par 3M", text: "Notre équipe contrôle l’existence légale de l’organisation et la cohérence des informations. Si un élément manque, nous écrivons à l’adresse professionnelle indiquée avant toute décision." },
  { title: "Accès créé et remis par un canal approuvé", text: "Une fois la vérification terminée, les identifiants sont créés par l’administration et remis à l’organisation par un canal approuvé." },
  { title: "Consulter des profils anonymisés", text: "Vous voyez uniquement des profils dont le candidat a autorisé le partage, sous forme de code, de secteur, d’expérience, de langues et de synthèse validée par 3M." },
  { title: "Enregistrer un retour", text: "Présélection, sélection, non-retenu ou demande de pièces : votre retour est enregistré dans le dossier et examiné par 3M avant toute communication au candidat." },
];

export const EMPLOYER_VISIBLE: string[] = [
  "Un code de profil, jamais un nom.",
  "La destination et la procédure visées par le candidat.",
  "Le secteur d’activité et le niveau d’expérience déclarés.",
  "Les langues de travail.",
  "Une synthèse rédigée et validée par 3M, téléchargeable en PDF lorsqu’elle existe.",
];

export const EMPLOYER_HIDDEN: string[] = [
  "Le nom, le numéro de téléphone, l’adresse et l’e-mail du candidat.",
  "Les pièces d’identité et les documents du dossier.",
  "Un CV brut, tant que le candidat n’a pas donné son accord et que 3M ne l’a pas contrôlé.",
  "Les notes internes de l’équipe 3M.",
];

export const EMPLOYER_COMMITMENTS: CommitmentItem[] = [
  { title: "Le candidat décide", text: "Un profil n’est partagé qu’avec le consentement actif du candidat, qu’il peut retirer depuis son espace personnel." },
  { title: "Un humain examine", text: "Les profils sont présélectionnés à partir d’une évaluation humaine. Aucune décision d’embauche n’est automatique." },
  { title: "Pas de promesse de visa", text: "Un retour favorable n’est ni une offre d’emploi, ni une promesse de visa : la décision appartient à l’employeur pour l’emploi et aux autorités pour l’entrée sur le territoire." },
  { title: "Vos obligations restent les vôtres", text: "Offre, contrat, autorisation de travail dans le pays concerné : ces démarches relèvent de l’employeur et du droit du pays. Nous vous orientons, nous ne nous y substituons pas." },
];

export const EMPLOYER_FAQ: FaqItem[] = [
  { question: "Qui peut demander un accès employeur ?", answer: "Toute organisation légalement établie qui recrute ou envisage de recruter à l’international : entreprise, établissement, association ou groupement. L’accès est donné à l’organisation, pas à une personne seule, et il est examiné au cas par cas." },
  { question: "Combien de temps faut-il pour être vérifié ?", answer: "Le délai dépend de l’exhaustivité des informations fournies et de la facilité à contrôler l’existence de l’organisation. Nous vous écrivons à l’adresse professionnelle indiquée pour confirmer l’avancement ; nous préférons un délai exact à une promesse trop courte." },
  { question: "L’inscription engage-t-elle mon organisation ?", answer: "Non. S’identifier permet seulement à 3M d’examiner la demande. Les éventuelles conditions de collaboration vous sont communiquées par écrit avant tout engagement." },
  { question: "Puis-je contacter directement un candidat ?", answer: "Non. Les échanges passent par 3M, qui examine chaque retour avant de le transmettre au candidat. Cette règle protège les candidats et évite les démarches parallèles qui fragilisent un dossier." },
  { question: "Puis-je partager l’accès avec mes collègues ?", answer: "Oui, dans l’espace sécurisé : un gestionnaire peut inviter des collaborateurs avec un rôle de lecteur ou de gestionnaire, suspendre un accès et consulter un journal d’activité. Il est possible d’activer une authentification à deux facteurs." },
  { question: "Que devient une sélection que j’enregistre ?", answer: "Elle est conservée dans l’historique de votre organisation et dans le dossier concerné. 3M l’examine, puis revient vers vous et vers le candidat selon les règles de consentement ; aucune pièce n’est transmise sans cette étape." },
];

// ---- /agences-placement --------------------------------------------------------------------------------------------------
export const AGENCY_PARTNER_STEPS: StepItem[] = [
  { title: "Présenter votre agence", text: "Vous renseignez la dénomination, le pays d’exercice, l’activité et un contact professionnel dans le formulaire dédié." },
  { title: "Vérification de l’organisation", text: "3M contrôle l’existence légale de l’agence et, lorsque la réglementation du pays l’exige, son droit d’exercer l’activité de placement. Nous pouvons demander des pièces complémentaires." },
  { title: "Accès à l’espace agence", text: "Après validation, l’accès est créé par l’administration et remis par un canal approuvé. La connexion est ensuite possible depuis l’espace agence." },
  { title: "Travailler sur des profils partagés", text: "Vous consultez des profils anonymisés dont le partage a été autorisé, vous les mettez en favoris, vous prenez des notes privées à votre organisation et vous enregistrez vos retours." },
];

export const AGENCY_PARTNER_CRITERIA: string[] = [
  "Une existence légale vérifiable dans le pays d’exercice.",
  "Le droit d’exercer l’activité de placement lorsque la loi locale le demande.",
  "Une adresse professionnelle et un interlocuteur identifié.",
  "L’engagement de ne jamais facturer à un candidat une promesse de visa, d’emploi ou d’admission.",
  "L’engagement de respecter le consentement du candidat et la confidentialité des profils.",
];

export const AGENCY_PARTNER_FAQ: FaqItem[] = [
  { question: "Quelle différence entre une agence de placement et un employeur ?", answer: "L’employeur recrute pour son propre compte. L’agence de placement intervient pour le compte d’employeurs ou de candidats. Les deux passent par le même contrôle, mais l’espace agence est distinct afin de garder la trace du rôle de chacun." },
  { question: "Une agence peut-elle voir les coordonnées des candidats ?", answer: "Non. Les profils sont anonymisés. Ni numéro, ni adresse, ni e-mail, ni pièce d’identité ne sont exposés sans contrôle humain et sans consentement actif du candidat." },
  { question: "Pourquoi 3M refuse-t-elle certains partenariats ?", answer: "Lorsque l’existence légale ne peut pas être vérifiée, lorsque l’activité n’est pas autorisée, ou lorsqu’une pratique contredit nos règles (promesse de visa ou d’emploi, frais prélevés sur la base d’un résultat), la demande est refusée ou suspendue." },
  { question: "Que se passe-t-il si une agence enfreint les règles ?", answer: "L’accès est suspendu immédiatement, sans suppression du compte, le temps d’une révision manuelle. Chaque décision est enregistrée dans le journal de l’organisation." },
  { question: "Comment demander l’accès ?", answer: "Remplissez le formulaire de cette page. Si votre organisation est déjà vérifiée, utilisez directement les identifiants remis par 3M dans l’espace agence." },
];

// ---- /ambassador-program -------------------------------------------------------------------------------------------------
export const AMBASSADOR_HOW_STEPS: StepItem[] = [
  { title: "S’inscrire", text: "Le formulaire demande votre nom, votre e-mail, votre téléphone et votre pays. Aucun paiement n’est demandé pour devenir ambassadeur." },
  { title: "Recevoir son code et son lien", text: "Un code de parrainage personnel est créé, avec un lien prêt à partager. Il identifie les personnes que vous orientez vers 3M TRAVEL AGENCY." },
  { title: "Présenter nos services avec honnêteté", text: "Vous parlez de ce que fait l’agence — évaluation, constitution de dossier, accompagnement — sans promettre de résultat." },
  { title: "Suivre depuis le tableau de bord", text: "Parrainages, dossiers payés et commissions comptabilisées s’affichent dans votre espace, avec le taux appliqué à votre compte." },
];

export const AMBASSADOR_YOU_CAN_SAY: string[] = [
  "Que 3M TRAVEL AGENCY évalue d’abord un profil et explique les démarches avant toute décision.",
  "Que les frais dépendent du profil et sont confirmés par écrit avant tout paiement.",
  "Que vous êtes ambassadeur et que vous pouvez recevoir une commission si un dossier est validé et payé.",
  "Que la décision finale appartient toujours aux autorités du pays visé.",
];

export const AMBASSADOR_NEVER_SAY: string[] = [
  "Qu’un visa, un emploi ou une admission est assuré ou facile à obtenir.",
  "Un prix, un délai ou un taux de réussite que vous n’avez pas lu sur le site ou dans un document de l’agence.",
  "Que des places sont presque épuisées pour presser une personne à payer.",
  "Que vous pouvez « arranger » un dossier ou obtenir un traitement de faveur.",
  "Quoi que ce soit qui cache votre qualité d’ambassadeur à la personne que vous orientez.",
];

export const AMBASSADOR_FAQ: FaqItem[] = [
  { question: "Faut-il payer pour devenir ambassadeur ?", answer: "Non. Le formulaire d’inscription ne comporte aucun champ de paiement. Méfiez-vous de toute personne qui vous demanderait de l’argent au nom du programme : écrivez-nous pour vérifier." },
  { question: "Quand une commission est-elle comptabilisée ?", answer: "Uniquement après la validation du dossier et un paiement effectivement confirmé. Une simple inscription, un simple rendez-vous ou un paiement non confirmé ne donne pas lieu à commission." },
  { question: "Où voir le taux de commission ?", answer: "Il s’affiche dans le tableau de bord de votre compte. Le barème détaillé et les modalités de versement vous sont confirmés par écrit ; ils ne sont pas annoncés sur cette page pour éviter qu’ils soient repris hors contexte." },
  { question: "Que se passe-t-il si la personne que j’oriente n’obtient pas son visa ?", answer: "Le programme ne dépend jamais d’un résultat de visa, d’emploi ou d’admission. Il repose sur des dossiers validés et des paiements confirmés. Ne promettez jamais l’issue d’une demande." },
  { question: "Puis-je utiliser mon lien sur les réseaux sociaux ?", answer: "Oui, à condition de rester honnête : indiquez que vous êtes ambassadeur, utilisez uniquement les informations publiées par l’agence et respectez la liste de ce qu’il ne faut jamais dire." },
  { question: "J’ai perdu mon code, comment le retrouver ?", answer: "Rouvrez la page du programme sur l’appareil utilisé à l’inscription : le code est conservé dans le navigateur. Sinon, saisissez-le dans le tableau de bord ou écrivez-nous depuis l’e-mail d’inscription." },
  { question: "Puis-je me retirer du programme ?", answer: "Oui, à tout moment : écrivez-nous depuis l’adresse d’inscription. Les commissions déjà acquises sur des paiements confirmés restent régies par ce qui vous a été confirmé par écrit." },
];
