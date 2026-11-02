/**
 * Contenus de la campagne d'enrichissement, lot 2 : documents, paiement, CNI et passeport, accessibilité.
 * Mêmes règles que contentCampaign.ts (contrôlées par server/contentCampaign.regression.test.ts).
 */
import type { CommitmentItem, FaqItem, StepItem } from "@/data/pageEnrichment";

// ---- /conformite-documents -----------------------------------------------------------------------------------------------

export const DOC_FAMILIES: CommitmentItem[] = [
  { title: "Identité", text: "Passeport en cours de validité (copie lisible des pages de données), photo conforme aux exigences de la destination et, selon le cas, carte nationale d’identité." },
  { title: "État civil", text: "Acte de naissance, acte de mariage ou de divorce, actes des enfants lorsque le projet les concerne : les noms et dates doivent concorder avec le passeport." },
  { title: "Parcours scolaire et universitaire", text: "Diplômes, relevés de notes, attestations de réussite et certificats d’inscription ; pour un projet d’études, la lettre d’admission de l’établissement." },
  { title: "Parcours professionnel", text: "CV à jour, attestations de travail, contrats et références ; pour un projet de travail, l’offre ou le contrat de l’employeur et, si exigé, l’autorisation de travail." },
  { title: "Ressources financières", text: "Relevés bancaires, attestation de prise en charge, justificatifs de revenus, de bourse ou de financement : le niveau exigé dépend de la destination et du projet." },
  { title: "Santé et antécédents", text: "Selon le pays : certificat médical, carnet de vaccination, extrait de casier judiciaire et assurance couvrant le séjour." },
];

export const DOC_FORMAT_RULES: string[] = [
  "Scannez à plat, en couleur, avec une bonne lumière : le texte doit être net et les quatre coins du document visibles.",
  "Envoyez toutes les pages, recto et verso, y compris les pages vierges lorsque le document en comporte.",
  "Évitez les photos prises de travers, les captures d’écran et les documents rognés ; n’occultez aucune mention.",
  "Nommez chaque fichier clairement (par exemple type de pièce et nom) pour éviter les confusions.",
  "Vérifiez que l’orthographe de votre nom est identique sur tous les documents ; signalez toute différence avant le dépôt.",
  "Gardez les originaux : les autorités peuvent les demander à n’importe quelle étape.",
];

export const DOC_FORMALITIES: StepItem[] = [
  { title: "Traduction", text: "Un document qui n’est pas dans la langue exigée doit souvent être traduit par un traducteur reconnu. Le pays de destination précise si une traduction simple suffit ou si elle doit être assermentée." },
  { title: "Légalisation", text: "Certaines autorités demandent de faire authentifier la signature ou le cachet d’un document par l’autorité du pays qui l’a délivré, puis parfois par le consulat concerné." },
  { title: "Apostille", text: "Entre pays qui appliquent la convention de La Haye, une apostille remplace la légalisation consulaire. Nous vérifions pour votre dossier laquelle des deux formalités s’applique avant que vous engagiez des frais." },
];

export const DOC_COMMON_ERRORS: string[] = [
  "Nom ou date de naissance différents entre le passeport et l’acte de naissance, sans pièce expliquant la différence.",
  "Passeport qui expire trop tôt par rapport à la date d’arrivée prévue.",
  "Scan flou, incomplet ou pris en photo avec reflets.",
  "Diplôme envoyé sans le relevé de notes correspondant, ou l’inverse.",
  "Document ancien alors que la destination exige une pièce récente.",
  "Traduction faite avant de savoir si elle devait être assermentée.",
  "Fichiers regroupés en un seul document illisible au lieu de pièces séparées.",
];

export const DOC_FAQ: FaqItem[] = [
  {
    question: "Cette liste de pièces est-elle définitive ?",
    answer: "Non. Elle indique les pièces habituellement attendues pour la destination et le type de projet choisis. Le consulat, l’établissement ou l’employeur peut demander des pièces supplémentaires ; c’est toujours l’autorité compétente qui décide.",
  },
  {
    question: "Dois-je traduire tous mes documents ?",
    answer: "Pas forcément. Cela dépend de la langue de la destination et de l’autorité. Demandez-nous la liste exacte pour votre dossier avant de commander une traduction : cela évite des frais inutiles.",
  },
  {
    question: "Quelle différence entre légalisation et apostille ?",
    answer: "Ce sont deux manières de faire reconnaître un document à l’étranger. La légalisation passe par des autorités et parfois par un consulat ; l’apostille est une formalité simplifiée entre pays qui appliquent la même convention. La destination indique laquelle s’applique.",
  },
  {
    question: "Mes documents sont-ils en sécurité quand je les téléverse ?",
    answer: "Ils sont déposés dans votre espace client, accessible à vous et à l’équipe affectée à votre dossier, et ne sont jamais publiés. Consultez la politique de confidentialité pour la conservation et vos droits.",
  },
  {
    question: "Que faire si je n’ai pas un document de la liste ?",
    answer: "Indiquez-le à votre conseiller sans attendre : selon le cas, un duplicata, un document de remplacement ou une attestation peut être demandé à l’administration concernée. Ne faites jamais fabriquer ni modifier une pièce : c’est illégal et peut entraîner un refus définitif.",
  },
  {
    question: "Puis-je préparer mes pièces avant l’ouverture de mon dossier ?",
    answer: "Oui : rassembler et numériser vos pièces à l’avance fait gagner du temps. Le traitement par l’équipe suit ensuite les étapes décrites dans votre protocole d’accord.",
  },
];

// ---- /paiement -----------------------------------------------------------------------------------------------------------

export const PAY_STEPS: StepItem[] = [
  { title: "Obtenez le montant par écrit", text: "Avant tout règlement, vous devez avoir reçu par écrit le montant, ce qu’il couvre et votre référence de dossier." },
  { title: "Payez sur les coordonnées publiées", text: "Utilisez uniquement les moyens affichés sur cette page ou confirmés par l’agence, et vérifiez le nom du titulaire avant l’envoi." },
  { title: "Transmettez votre preuve", text: "Indiquez votre référence dans le motif du paiement et envoyez la preuve (capture ou reçu de l’opérateur) depuis cette page ou votre espace client." },
  { title: "Recevez votre reçu", text: "L’agence confirme la réception et vous remet un reçu nominatif. Gardez-le avec votre protocole d’accord." },
];

export const PAY_AFTER: string[] = [
  "Le paiement est enregistré dans votre dossier et visible dans votre espace client.",
  "Un reçu nominatif vous est remis ; vérifiez votre nom, la référence et le montant.",
  "Les étapes suivantes (protocole, pièces à fournir, traitement) sont indiquées dans votre espace.",
  "Si le paiement n’est pas retrouvé, contactez l’agence avec la preuve et la référence : nous vérifions auprès de l’opérateur ou de la banque.",
];

export const PAY_FAQ: FaqItem[] = [
  {
    question: "Pourquoi un moyen de paiement est-il parfois indiqué comme indisponible ?",
    answer: "Chaque moyen n’est affiché « disponible » que lorsqu’il est réellement configuré. Si la carte ou le paiement mobile en ligne n’est pas encore activé, utilisez le virement, le dépôt Mobile Money sur le numéro de l’agence ou le paiement en agence.",
  },
  {
    question: "Des frais supplémentaires peuvent-ils s’ajouter ?",
    answer: "Les opérateurs de paiement et les banques peuvent facturer leurs propres frais de transaction ou de change. Ils dépendent de votre opérateur ou de votre banque, pas de l’agence ; renseignez-vous avant d’envoyer le paiement.",
  },
  {
    question: "J’ai payé mais je n’ai pas de reçu : que faire ?",
    answer: "Envoyez la preuve de paiement avec votre référence depuis cette page, ou écrivez-nous par e-mail ou WhatsApp. Nous vérifions la réception et vous remettons le reçu une fois le paiement confirmé.",
  },
  {
    question: "Je me suis trompé de numéro ou de montant : que faire ?",
    answer: "Contactez immédiatement votre opérateur ou votre banque pour signaler l’erreur, puis prévenez l’agence avec la preuve. Les possibilités d’annulation dépendent de l’opérateur et du moment où l’erreur est signalée.",
  },
  {
    question: "Quelqu’un me demande de payer sur un autre numéro : est-ce normal ?",
    answer: "Non. Les coordonnées de paiement ne sont jamais envoyées par des tiers. Ne payez pas, vérifiez sur cette page ou auprès de l’agence, et consultez notre guide pour vérifier une agence avant de payer.",
  },
  {
    question: "Puis-je payer en plusieurs fois ?",
    answer: "Selon le service choisi, un paiement échelonné peut être prévu dans le devis écrit. S’il ne figure pas dans votre devis, demandez-le avant de payer : rien n’est applicable sans écrit.",
  },
];

// ---- /cni-passeport ------------------------------------------------------------------------------------------------------

export const CNI_BEFORE_CHECKLIST: string[] = [
  "Vous savez si votre demande est une première demande, un renouvellement ou une perte ou un vol.",
  "Vos pièces d’état civil sont lisibles et vos noms sont écrits de la même façon partout.",
  "Vous avez vérifié auprès de l’administration compétente la liste des pièces et les frais officiels en vigueur.",
  "Vous avez prévu la photo exigée et les éventuels timbres ou quittances demandés par l’administration.",
  "Vous avez informé votre conseiller si votre voyage dépend de la date de réception du document.",
];

export const CNI_LOST_STEPS: StepItem[] = [
  { title: "Déclarer la perte ou le vol", text: "Faites la déclaration auprès des autorités compétentes et conservez le récépissé : il vous sera demandé pour la nouvelle demande." },
  { title: "Réunir de nouveau les pièces", text: "Réunissez l’état civil, la photo et tout justificatif que l’administration exige pour un duplicata ou un renouvellement." },
  { title: "Prévenir ceux qui comptent sur le document", text: "Si un dossier de visa ou d’études est en cours, informez votre conseiller : une pièce d’identité manquante peut suspendre la démarche." },
];

export const CNI_COMMON_ERRORS: string[] = [
  "Payer un intermédiaire qui promet un délai de délivrance : les délais appartiennent à l’administration.",
  "Remettre ses originaux à une personne qui ne peut pas présenter de reçu nominatif.",
  "Déposer un dossier avec une orthographe de nom différente de celle de l’acte de naissance.",
  "Attendre la veille d’un départ pour commencer la démarche.",
];

// ---- /accessibilite (bilingue) -------------------------------------------------------------------------------------------

export type BilingualBlock = { title: { fr: string; en: string }; text: { fr: string; en: string } };

export const ACCESSIBILITY_STATEMENT: BilingualBlock[] = [
  {
    title: { fr: "Notre objectif", en: "Our goal" },
    text: {
      fr: "Nous visons le niveau AA des règles internationales d’accessibilité des contenus web (WCAG). Ce niveau est un objectif de travail : le site n’a pas fait l’objet d’une certification externe à ce jour.",
      en: "We aim for level AA of the international Web Content Accessibility Guidelines (WCAG). This is a working goal: the website has not undergone external certification to date.",
    },
  },
  {
    title: { fr: "Ce qui est en place", en: "What is in place" },
    text: {
      fr: "Navigation au clavier avec focus visible, libellés associés aux champs de formulaire, structure de titres, textes alternatifs pour les images, contrastes renforcés en option, réduction ou arrêt des animations, taille de texte réglable et respect des préférences de mouvement du système.",
      en: "Keyboard navigation with a visible focus, labels attached to form fields, heading structure, alternative text for images, optional higher contrast, reduced or disabled animations, adjustable text size and respect for system motion preferences.",
    },
  },
  {
    title: { fr: "Limites connues", en: "Known limitations" },
    text: {
      fr: "Certains documents PDF issus d’administrations ou de partenaires, et les pages des portails officiels vers lesquels nous renvoyons, ne dépendent pas de nous et peuvent ne pas être accessibles. Quelques contenus animés ou illustrés peuvent perdre de leur intérêt sans leur effet visuel : si c’est le cas, désactivez les animations ci-dessus.",
      en: "Some PDF documents from administrations or partners, and the pages of the official portals we link to, are outside our control and may not be accessible. A few animated or illustrated contents may lose some of their interest without the visual effect: if so, disable animations above.",
    },
  },
  {
    title: { fr: "Signaler un obstacle", en: "Report a barrier" },
    text: {
      fr: "Écrivez-nous en décrivant la page, l’appareil et la difficulté rencontrée : un conseiller vous répond par écrit et, si besoin, vous fournit l’information par un autre moyen (message, appel ou rendez-vous à l’agence).",
      en: "Write to us describing the page, device and difficulty you met: an advisor replies in writing and, if needed, provides the information another way (message, phone call or appointment at the agency).",
    },
  },
  {
    title: { fr: "Suivi et revue", en: "Follow-up and review" },
    text: {
      fr: "Les signalements sont traités par ordre d’impact. Une revue interne de l’accessibilité a été réalisée en octobre 2026 ; ce texte est mis à jour après chaque évolution importante.",
      en: "Reports are handled by order of impact. An internal accessibility review was carried out in October 2026; this text is updated after each major change.",
    },
  },
];
