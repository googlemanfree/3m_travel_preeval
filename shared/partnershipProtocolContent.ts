/**
 * Protocole d'accord de partenariat (agence de voyage ou particulier apporteur d'affaires).
 *
 * Le texte est produit à partir de variables (identité des parties, conditions particulières) ; l'identité de 3M est fournie
 * par l'appelant (client/src/lib/companyContacts.ts), jamais recopiée ici. Au moment de l'émission, le texte complet est
 * figé dans le dossier : ce que le partenaire signe est exactement ce que 3M a émis, même si le modèle évolue ensuite.
 *
 * Mise en forme attendue par la génération PDF : un paragraphe = un bloc séparé par une ligne vide ; un titre « Article N — … »
 * ou « Annexe N — … » est seul sur sa ligne et ne contient pas de deux-points.
 *
 * Modèle rédigé pour la pratique commerciale courante ; il doit être relu par un juriste avant tout usage contentieux.
 */

import { formatCommissionRate, type PartnershipKind } from "./partnershipProgram";

export const PARTNERSHIP_PROTOCOL_VERSION = "2026-11-07-v1";

export type PartnershipProtocolProvider = {
  legalName: string;
  commercialName: string;
  legalForm: string;
  shareCapital: string;
  registration: string;
  registryAuthority: string;
  taxpayerId: string;
  addressLine: string;
  representativeName: string;
  representativeTitle: string;
  email: string;
};

export type PartnershipProtocolPartner = {
  /** Raison sociale (agence) ou nom complet (particulier). */
  displayName: string;
  representativeName: string;
  representativeRole?: string | null;
  legalRegistration?: string | null;
  taxId?: string | null;
  licenceNumber?: string | null;
  country: string;
  city?: string | null;
  email: string;
  phone?: string | null;
};

export type PartnershipProtocolVariables = {
  kind: PartnershipKind;
  reference: string;
  /** Date d'émission ; null pour l'aperçu public du modèle. */
  issuedAt: Date | null;
  provider: PartnershipProtocolProvider;
  partner: PartnershipProtocolPartner;
  terms: {
    commissionRateBps: number;
    termMonths: number;
    attributionMonths: number;
    paymentDelayDays: number;
    territory: string;
  };
};

const clean = (value: string | null | undefined, fallback = "") => (value ?? "").replace(/[\u0000-\u001F]/g, " ").replace(/\s+/g, " ").trim() || fallback;

/** Espaces insécables : « 1 000 000 FCFA » ne se coupe plus en fin de ligne. */
const noBreak = (value: string) => value.replace(/ /g, " ");
const lowerFirst = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);

function formatDateFr(date: Date | null): string {
  if (!date) return "[date d’émission]";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Douala" });
}

export const PARTNERSHIP_PROTOCOL_TITLES: Record<PartnershipKind, string> = {
  travel_agency: "Protocole d’accord de partenariat — agence de voyage",
  individual: "Protocole d’accord de partenariat — apporteur d’affaires",
};

/** Aperçu public du modèle : mêmes articles, parties remplacées par des mentions entre crochets. */
export function previewPartnershipVariables(kind: PartnershipKind, provider: PartnershipProtocolProvider): PartnershipProtocolVariables {
  const agency = kind === "travel_agency";
  return {
    kind,
    reference: "PAR-AAAA-NNNN",
    issuedAt: null,
    provider,
    partner: {
      displayName: agency ? "[Raison sociale de l’agence]" : "[Prénom et nom du partenaire]",
      representativeName: agency ? "[Nom du représentant]" : "[Prénom et nom du partenaire]",
      representativeRole: agency ? "[Fonction du représentant]" : null,
      legalRegistration: agency ? "[Numéro d’immatriculation]" : null,
      taxId: agency ? "[Numéro d’identification fiscale]" : null,
      licenceNumber: agency ? "[Licence ou agrément, le cas échéant]" : null,
      country: "[Pays]",
      city: "[Ville]",
      email: "[Adresse e-mail]",
      phone: null,
    },
    terms: { commissionRateBps: 0, termMonths: 0, attributionMonths: 0, paymentDelayDays: 0, territory: "[Zone d’intervention]" },
  };
}

export function buildPartnershipProtocolText(variables: PartnershipProtocolVariables): string {
  const { kind, provider, partner, terms } = variables;
  const agency = kind === "travel_agency";
  const preview = variables.issuedAt === null;
  const rate = preview ? "[taux fixé à l’émission]" : formatCommissionRate(terms.commissionRateBps);
  const term = preview ? "[durée fixée à l’émission]" : `${terms.termMonths} mois`;
  const attribution = preview ? "[durée fixée à l’émission]" : `${terms.attributionMonths} mois`;
  const delay = preview ? "[délai fixé à l’émission]" : `${terms.paymentDelayDays} jours`;
  const place = [clean(partner.city), clean(partner.country)].filter(Boolean).join(", ");

  const partnerParty = agency
    ? `${clean(partner.displayName)}${partner.legalRegistration ? `, immatriculée sous le numéro ${clean(partner.legalRegistration)}` : ""}${partner.taxId ? `, identifiant fiscal ${clean(partner.taxId)}` : ""}${partner.licenceNumber ? `, titulaire de la licence ou de l’agrément ${clean(partner.licenceNumber)}` : ""}, établie à ${place || "[adresse]"}, représentée par ${clean(partner.representativeName)}${partner.representativeRole ? `, ${clean(partner.representativeRole)}` : ""}, dûment habilité(e) à engager l’agence pour les besoins des présentes, ci-après « le Partenaire ».`
    : `${clean(partner.displayName)}, personne physique majeure, agissant en son nom propre et à titre indépendant, demeurant à ${place || "[adresse]"}, ci-après « le Partenaire ».`;

  const status = agency
    ? "Le Partenaire est une entreprise autonome. Il agit sous sa seule responsabilité, avec ses propres moyens, son personnel et ses éventuels sous-traitants, dont il répond entièrement à l’égard de 3M et des tiers. Ses relations avec ses propres clients restent régies par ses propres conditions, distinctes du présent protocole. Il déclare détenir les autorisations, licences et immatriculations exigées pour exercer son activité dans son pays."
    : "Le Partenaire agit à titre indépendant. Il n’est ni salarié, ni agent, ni mandataire de 3M et ne bénéficie d’aucun lien de subordination. Il déclare être majeur, ne pas exercer de fonction publique ou de mandat susceptible de créer un conflit d’intérêts avec les recommandations qu’il formule, et assume seul ses obligations fiscales et sociales sur les commissions perçues.";

  const article5Extra = agency
    ? "Le Partenaire veille à ce que ses collaborateurs et sous-traitants respectent le présent protocole et répond de leurs manquements comme des siens. Il n’utilise pas l’accompagnement de 3M pour proposer sous son propre nom des prestations que 3M réalise, sauf accord écrit préalable de 3M sur une présentation commune."
    : "Le Partenaire recommande 3M de bonne foi, à partir de son expérience ou de l’information officielle fournie par 3M, sans présenter son avis comme celui d’un conseiller de 3M.";

  const blocks: string[] = [
    "Entre les soussignés",
    `${provider.legalName}, ${lowerFirst(provider.legalForm)}, au capital de ${noBreak(provider.shareCapital)}, immatriculée sous le numéro ${provider.registration}, ${provider.registryAuthority}, identifiant fiscal ${provider.taxpayerId}, dont le siège est situé à ${provider.addressLine}, exploitant l’enseigne commerciale ${provider.commercialName}, représentée par ${provider.representativeName}, ${provider.representativeTitle}, ci-après « 3M ».`,
    `Et : ${partnerParty}`,
    "3M et le Partenaire sont ci-après désignés ensemble « les Parties ».",
    "Préambule",
    `3M accompagne des personnes dans leurs projets de mobilité internationale (études, travail, voyages, visas, immigration) : évaluation de leur situation, constitution et suivi du dossier, information sur les démarches officielles. Le Partenaire souhaite orienter vers 3M des personnes susceptibles d’avoir besoin de cet accompagnement. Les Parties se sont rapprochées pour en fixer les conditions, dans le respect de la loi et de l’intérêt des personnes orientées. Référence du dossier : ${variables.reference} — protocole émis le ${formatDateFr(variables.issuedAt)} — version du modèle ${PARTNERSHIP_PROTOCOL_VERSION}.`,
    "Il a été convenu ce qui suit.",

    "Article 1 — Objet",
    "Le présent protocole fixe les conditions dans lesquelles le Partenaire oriente vers 3M des personnes intéressées par ses services (« les Clients référés ») et dans lesquelles 3M rémunère ces recommandations.",
    "Il ne crée ni société, ni association, ni mandat, ni contrat de travail, ni franchise, ni représentation exclusive. Le Partenaire n’a aucun pouvoir d’engager 3M, d’accepter ou de refuser un dossier, de fixer ou de modifier un prix, d’encaisser une somme au nom ou pour le compte de 3M, ni de promettre un résultat.",

    "Article 2 — Définitions",
    "« Client référé » : toute personne physique orientée par le Partenaire qui ouvre un dossier auprès de 3M et dont la provenance est établie par le code ou le lien personnel du Partenaire, ou par une déclaration écrite remise à 3M avant l’ouverture du dossier.\n« Frais d’accompagnement » : les honoraires de 3M, fixés dossier par dossier selon le profil du client et confirmés par écrit à ce dernier avant tout paiement. Ils ne comprennent ni les frais officiels (visa, consulat, centre de dépôt, administrations), ni les frais de tiers (traduction, assurance, transport, hébergement), ni les taxes, ni les frais de transaction bancaire ou de Mobile Money.\n« Paiement validé » : un paiement effectivement reçu par 3M, confirmé par elle, non contesté et non remboursé.\n« Code partenaire » : l’identifiant personnel et le lien remis au Partenaire à l’activation du présent protocole.",

    "Article 3 — Statut et indépendance",
    status,

    "Article 4 — Engagements de 3M",
    "3M remet au Partenaire son code personnel, un lien de recommandation et les informations de présentation de ses services. 3M apprécie seule, selon ses procédures, l’acceptation d’un dossier et la nature de l’accompagnement proposé ; elle traite les Clients référés avec le même soin que tout autre client.\n3M tient le Partenaire informé, sur demande, du nombre de dossiers ouverts à partir de son code et des paiements validés ouvrant droit à commission, sans lui communiquer les informations personnelles ou confidentielles des clients, sauf accord écrit de ces derniers.\n3M verse les commissions dues dans les conditions de l’article 6.",

    "Article 5 — Engagements du Partenaire",
    `Le Partenaire s’engage à : présenter les services de 3M avec exactitude et sans exagération ; indiquer aux personnes orientées que les Frais d’accompagnement sont fixés et confirmés par écrit par 3M, et non par lui ; ne garantir ni l’obtention d’un visa, d’un permis, d’un emploi, d’une admission ou d’une décision favorable, que ni lui ni 3M ne maîtrisent ; ne jamais demander ni encaisser de somme au nom de 3M, tout paiement devant être effectué par le client directement selon les moyens indiqués par 3M ; ne jamais fournir, modifier ou faire établir de faux document ni encourager une déclaration inexacte ; ne transmettre une information personnelle qu’avec l’accord de la personne concernée ; respecter la charte de communication figurant en Annexe 2.\n${article5Extra}`,

    "Article 6 — Rémunération du Partenaire",
    `6.1 Principe. Pour chaque Client référé dont le paiement des Frais d’accompagnement est validé, 3M verse au Partenaire une commission égale à ${rate} des Frais d’accompagnement effectivement encaissés, hors frais officiels, frais de tiers, taxes et frais de transaction.\n6.2 Fait générateur. La commission naît au Paiement validé du client. Elle ne naît ni à la simple orientation, ni à l’ouverture du compte, ni à une promesse de paiement. Elle porte sur les paiements validés pendant ${attribution} à compter de la première ouverture du dossier du Client référé.\n6.3 Attribution. Un client est attribué au Partenaire s’il a ouvert son dossier avec le code ou le lien du Partenaire, ou si le Partenaire l’a déclaré par écrit à 3M avant l’ouverture. En cas de recommandations concurrentes, la première en date, établie par ces éléments, prévaut.\n6.4 Versement. Les commissions dues au titre d’un mois sont versées dans les ${delay} qui suivent la fin de ce mois, par virement ou Mobile Money, après vérification de l’identité du bénéficiaire, sur la base d’un relevé que 3M tient à la disposition du Partenaire.\n6.5 Remboursement ou annulation. Si un paiement est remboursé au client ou annulé, la commission correspondante n’est pas due ; si elle a déjà été versée, elle est déduite des commissions suivantes ou restituée.\n6.6 Contestation. Le Partenaire dispose de trente (30) jours à compter du relevé pour le contester par écrit, avec ses éléments ; passé ce délai, le relevé est réputé accepté.\n6.7 Impôts. Les commissions sont versées sous réserve des retenues exigées par la loi. Le Partenaire demeure seul responsable de ses déclarations et de ses impôts. Aucune commission n’est due au titre de dossiers que le Partenaire aurait ouverts ou suscités en contravention au présent protocole.`,

    "Article 7 — Conformité, éthique et lutte contre la fraude",
    "Chaque Partie respecte les lois applicables, notamment en matière de lutte contre la corruption, le blanchiment de capitaux, la fraude documentaire et les sanctions internationales. Le Partenaire s’interdit de proposer, de promettre ou de verser un avantage à un agent public, à un employé d’une ambassade, d’un consulat ou d’un centre de dépôt, ou à toute personne, pour influencer une décision ou obtenir un traitement de faveur. Il s’interdit toute pratique trompeuse ou discriminatoire et signale sans délai à 3M tout soupçon de fraude ou de conflit d’intérêts. Tout manquement constaté autorise 3M à suspendre le protocole sans préavis.",

    "Article 8 — Protection des données personnelles",
    "Chaque Partie traite les données personnelles qu’elle reçoit conformément à la législation applicable en matière de protection des données, notamment celle du pays de la personne concernée et, le cas échéant, le règlement général européen sur la protection des données. Le Partenaire n’informe 3M des coordonnées d’une personne qu’après avoir obtenu son accord, ne collecte que les données strictement nécessaires, les protège contre tout accès non autorisé et prévient 3M sans délai, au plus tard sous soixante-douze (72) heures, de toute violation. Il ne conserve pas les pièces d’identité, documents ou informations d’un client au-delà de ce qui est nécessaire à l’orientation, et ne les utilise à aucune autre fin.",

    "Article 9 — Confidentialité",
    "Les Parties gardent confidentielles les informations non publiques échangées dans le cadre du présent protocole : tarifs, procédures internes, données des clients, conditions particulières. Cette obligation s’applique pendant toute la durée du protocole et pendant trois (3) ans après son terme, sauf divulgation exigée par la loi ou par une autorité compétente.",

    "Article 10 — Marque, supports et communication",
    "3M concède au Partenaire, pour la durée du protocole et pour la seule promotion des services de 3M, un droit non exclusif, non cessible et révocable d’utiliser son nom, son logo et les supports qu’elle lui remet, sans les modifier. Le Partenaire s’interdit de créer un nom de domaine, un compte, une page ou une marque susceptible d’être confondu avec ceux de 3M. Il ne se présente pas comme « partenaire officiel » de 3M, et n’affiche pas publiquement son nom de partenaire ou le logo de 3M comme tel, sans autorisation écrite de 3M. Toute communication contraire à la charte de l’Annexe 2 peut être retirée sur simple demande de 3M.",

    "Article 11 — Non-exclusivité",
    "Le présent protocole n’est exclusif ni pour 3M ni pour le Partenaire. Chacun reste libre d’exercer son activité et de conclure des accords semblables avec des tiers, sous réserve du respect de la confidentialité et de l’absence de confusion entre les services.",

    "Article 12 — Responsabilité",
    "Chaque Partie répond des dommages directs qu’elle cause à l’autre par son manquement au présent protocole. Le Partenaire est seul responsable de ses propos, de ses supports et des engagements qu’il prendrait au-delà de ses pouvoirs ; il garantit 3M contre les réclamations de tiers qui en résulteraient. 3M ne garantit ni le volume de clients, ni le niveau des commissions, ni l’issue des procédures de ses clients. Aucune Partie ne répond de dommages indirects, tels que la perte d’une occasion ou d’une clientèle.",

    "Article 13 — Durée, renouvellement, suspension et résiliation",
    `13.1 Durée. Le protocole prend effet à la contresignature de 3M et dure ${term}. Il se renouvelle par accord écrit des Parties, éventuellement avec de nouvelles conditions particulières.\n13.2 Résiliation sans motif. Chaque Partie peut y mettre fin à tout moment, par écrit, moyennant un préavis de trente (30) jours.\n13.3 Résiliation ou suspension immédiate. En cas de manquement grave, de fraude, de violation de l’article 7, de la confidentialité ou de la charte de communication, ou de comportement de nature à porter atteinte à l’image de 3M ou à l’intérêt d’un client, 3M peut suspendre le code du Partenaire ou résilier le protocole sans préavis, par notification écrite.\n13.4 Effets. Les commissions nées d’un Paiement validé avant la fin du protocole restent dues, sous réserve de l’article 6.5 et de l’article 6.7 (dernière phrase). À la fin du protocole, le Partenaire cesse d’utiliser la marque et les supports de 3M et détruit les données personnelles qu’il détiendrait. Les articles 8, 9, 12 et 15 survivent au terme du protocole.`,

    "Article 14 — Force majeure",
    "Aucune Partie n’est responsable d’un retard ou d’une inexécution causés par un événement de force majeure au sens du droit applicable, notamment une décision des autorités, une interruption générale des réseaux, de l’électricité ou des paiements. La Partie empêchée en informe l’autre sans délai. Si l’empêchement dure plus de soixante (60) jours, chacune peut résilier le protocole sans indemnité.",

    "Article 15 — Droit applicable et règlement des différends",
    "Le présent protocole est régi par le droit camerounais et, pour les matières qu’ils couvrent, par les Actes uniformes de l’OHADA. Les Parties s’efforcent de régler à l’amiable tout différend, d’abord par un échange écrit, puis par une rencontre dans un délai de trente (30) jours. À défaut d’accord, les juridictions compétentes de Yaoundé (Cameroun) connaissent du litige, sous réserve des règles impératives contraires.",

    "Article 16 — Dispositions générales",
    "Le protocole, avec ses annexes, constitue l’intégralité de l’accord des Parties sur son objet et remplace toute convention ou promesse antérieure. Toute modification fait l’objet d’un avenant écrit accepté par les deux Parties. Le Partenaire ne peut céder le protocole ni se substituer un tiers sans l’accord écrit de 3M. Si une clause est nulle ou inapplicable, les autres demeurent. Le fait de ne pas exercer un droit n’emporte pas renonciation. Les notifications sont valablement faites par écrit aux adresses électroniques des Parties indiquées dans le dossier, sous réserve d’en avoir signalé le changement.\nLes Parties reconnaissent la valeur de la signature électronique apposée dans l’espace sécurisé de 3M : elle est rattachée à son auteur par un lien personnel de durée limitée, horodatée, associée à l’empreinte numérique du texte signé, et vaut signature manuscrite entre elles. Le protocole est rédigé en langue française, qui seule fait foi.",

    "Article 17 — Acceptation",
    "En signant, le Partenaire confirme avoir lu l’intégralité du protocole et de ses annexes, en avoir compris la portée, notamment les limites de son rôle, les conditions de rémunération et les engagements des articles 5, 7 et 8, et avoir fourni des informations exactes sur son identité et son activité. Le protocole ne produit ses effets, et aucune commission n’est due, qu’après la contresignature de 3M.",

    "Annexe 1 — Conditions particulières",
    `Référence du dossier : ${variables.reference}\nPartenaire : ${clean(partner.displayName)}${agency ? ` (représentée par ${clean(partner.representativeName)})` : ""}\nProfil : ${agency ? "agence de voyage" : "particulier apporteur d’affaires"}\nCoordonnées : ${clean(partner.email)}${partner.phone ? ` · ${clean(partner.phone)}` : ""}\nTerritoire ou zone d’intervention : ${clean(terms.territory, "[zone d’intervention]")}\nCommission : ${rate} des Frais d’accompagnement effectivement encaissés\nDurée d’attribution d’un client : ${attribution}\nDélai de versement des commissions : ${delay} après la fin du mois concerné\nDurée du protocole : ${term}, à compter de la contresignature de 3M\nVersion du modèle : ${PARTNERSHIP_PROTOCOL_VERSION}`,

    "Annexe 2 — Charte de communication du Partenaire",
    "Le Partenaire peut dire : que 3M accompagne les démarches de visa et de mobilité internationale ; que le montant des frais est fixé selon le profil et confirmé par écrit avant tout paiement ; que le suivi du dossier se fait dans un espace en ligne ; que 3M n’est ni une ambassade ni une administration ; qu’il est recommandé de lire le protocole du dossier avant de payer.\nLe Partenaire ne doit jamais dire : qu’un visa, un emploi, une admission ou une décision est garanti(e) ; que des délais précis sont assurés ; qu’il existe des « passe-droits », des places réservées ou des contacts privilégiés dans une administration ; qu’un paiement peut lui être remis directement ; qu’il parle ou signe au nom de 3M ; que 3M vend un visa ou un emploi.",
  ];

  return blocks.join("\n\n");
}

/** Texte de la déclaration de signature présentée au partenaire (cases à cocher de l'écran de signature). */
export const PARTNERSHIP_SIGNING_DECLARATIONS = [
  "J’ai lu l’intégralité du protocole et de ses annexes, et je les accepte sans réserve.",
  "Je comprends que ma commission n’est due qu’après un paiement validé et après la contresignature de 3M.",
  "Je m’engage à ne promettre aucun résultat, à n’encaisser aucune somme au nom de 3M et à respecter la charte de communication.",
] as const;
