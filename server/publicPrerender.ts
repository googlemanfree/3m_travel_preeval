import { OFFICIAL_SITE_ORIGIN } from "./canonicalDomain";
import { PUBLIC_FAQ_ITEMS } from "@shared/publicFaq";
import { getProcedureDisplayTitle, getProcedureFaqItems } from "@shared/procedureSeo";
import { getPublicDestinationDetail, PUBLIC_DESTINATION_DETAILS } from "../client/src/lib/publicDestinationCatalog";
import { getInstitutionalProcedureSource } from "../client/src/data/institutionalProcedureSources";
import { COMPANY_PROFILE } from "../client/src/lib/companyContacts";
import { OFFICIAL_CONSULAR_PORTALS } from "../client/src/data/officialConsularPortals";
import { evisasDatabaseComplete } from "../client/src/data/evisasDatabaseComplete";
import { getStudyDestinationArticle, studyDestinationArticles } from "../client/src/data/studyDestinationArticles";
import { getEnglishContentByEnSlug, getEnglishContentByFrId, type ProcedureEnglishContent } from "../client/src/data/procedures107English";

const LOCAL_BUSINESS_STRUCTURED_DATA = {
  "@type": "LocalBusiness",
  "@id": `${OFFICIAL_SITE_ORIGIN}/#localbusiness`,
  name: COMPANY_PROFILE.legalName,
  url: COMPANY_PROFILE.website,
  email: COMPANY_PROFILE.publicEmail,
  telephone: [
    COMPANY_PROFILE.offices.cameroon.phoneDisplay,
    COMPANY_PROFILE.offices.cameroon.whatsappDisplay,
    COMPANY_PROFILE.offices.ottawa.whatsappDisplay,
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: COMPANY_PROFILE.offices.cameroon.phoneDisplay,
      contactType: "customer service",
      areaServed: "CM",
    },
    {
      "@type": "ContactPoint",
      telephone: COMPANY_PROFILE.offices.cameroon.whatsappDisplay,
      contactType: "customer service",
      areaServed: "CM",
    },
    {
      "@type": "ContactPoint",
      telephone: COMPANY_PROFILE.offices.ottawa.whatsappDisplay,
      contactType: "customer service",
      areaServed: "CA",
    },
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: COMPANY_PROFILE.offices.cameroon.addressLines.join(", "),
    addressLocality: "Yaoundé",
    addressCountry: "CM",
  },
  areaServed: { "@type": "City", name: "Yaoundé" },
  identifier: [
    { "@type": "PropertyValue", propertyID: "RC", value: COMPANY_PROFILE.legalIdentifiers.registration },
    { "@type": "PropertyValue", propertyID: "NIU", value: COMPANY_PROFILE.legalIdentifiers.taxpayerId },
  ],
};

const ORIGIN = OFFICIAL_SITE_ORIGIN;
const SITE = "3M Travel & Services";
const LEGAL = "RC/YAO/2019/A/2567 · NIU M112417203369H";
const SOCIAL_IMAGE_ALT = "Aperçu 3M Travel & Services";
/** Titre et description de l'accueil, fixés par l'agence ; le titre dépasse volontairement les 60 caractères usuels. */
const HOME_TITLE = "3M Travel & Services | Voyages, Visas, Études & Mobilité Internationale";
const HOME_DESCRIPTION = "3M Travel & Services à Yaoundé accompagne vos projets de voyage, études à l'étranger, visas, immigration, travail, billets d'avion et services administratifs.";
/** Logo stable (image carrée du site) : le logo des données structurées ne doit pas être l'image de partage, qui change à chaque page. */
const LOGO_URL = `${OFFICIAL_SITE_ORIGIN}/icon-512.png`;
const socialImageFor = (title: string | undefined, path: string) => `${ORIGIN}/api/og?title=${encodeURIComponent(title?.trim() || SITE)}&path=${encodeURIComponent(path)}`;

type PublicMeta = {
  title: string;
  description: string;
  heading: string;
  lead: string;
  keywords?: string[];
  noindex?: boolean;
};

const procedureMetaForPath = (path: string): PublicMeta | undefined => {
  const match = path.match(/^\/(?:procedures|destinations)\/([^/]+)$/);
  if (!match) return undefined;

  let requestedId = match[1];
  try {
    requestedId = decodeURIComponent(requestedId);
  } catch {
    // Une URL mal encodée retombe sur le comportement de page introuvable.
  }

  const procedure = getPublicDestinationDetail(requestedId)?.procedure;
  if (!procedure) return undefined;

  const projectLabel = procedure.visaType === "etudes" ? "études" : procedure.visaType === "visiteur" ? "visiteur" : "travail";
  const displayTitle = getProcedureDisplayTitle(procedure);
  return {
    title: `${displayTitle} à Yaoundé | ${SITE}`,
    description: `Étapes, documents et ressources de préparation pour votre projet ${projectLabel} vers ${procedure.name}, accompagné depuis Yaoundé et à vérifier auprès des autorités compétentes.`,
    heading: `${displayTitle} à Yaoundé`,
    lead: `Consultez les étapes de préparation, les documents à prévoir et les ressources associées à votre projet ${projectLabel} vers ${procedure.name}, avec un accompagnement 3M Travel & Services depuis Yaoundé.`,
    keywords: [`visa ${procedure.name}`, `${projectLabel} ${procedure.name} Yaoundé`, `procédure ${procedure.name}`, projectLabel, "mobilité internationale", "3M Travel"],
  };
};

const procedureMetaForPathEn = (path: string): PublicMeta | undefined => {
  const match = path.match(/^\/en\/(?:procedures|destinations)\/([^/]+)$/);
  if (!match) return undefined;

  let enSlug = match[1];
  try {
    enSlug = decodeURIComponent(enSlug);
  } catch {
    // Malformed URL falls back to not-found behaviour.
  }

  const englishContent = getEnglishContentByEnSlug(enSlug);
  const procedure = englishContent ? getPublicDestinationDetail(englishContent.frId)?.procedure : undefined;
  if (!englishContent || !procedure) return undefined;

  const displayTitle = getProcedureDisplayTitle({ name: englishContent.name, visaType: procedure.visaType }, "en");
  const projectLabelEn = procedure.visaType === "etudes" ? "study" : procedure.visaType === "visiteur" ? "visitor" : "work";
  return {
    title: `${displayTitle} from Yaoundé | ${SITE}`,
    description: `Steps, documents and preparation resources for your ${projectLabelEn} project to ${englishContent.name}, supported from Yaoundé and to be verified with the competent authorities.`,
    heading: `${displayTitle} from Yaoundé`,
    lead: `Review the preparation steps, documents to gather, and related resources for your ${projectLabelEn} project to ${englishContent.name}, with support from 3M Travel & Services in Yaoundé.`,
    keywords: [`${englishContent.name} visa`, `${projectLabelEn} visa ${englishContent.name} Yaoundé`, `${englishContent.name} procedure`, projectLabelEn, "international mobility", "3M Travel"],
  };
};

// Les noms de pays très longs (« République démocratique du Congo ») font sortir le titre
// des 30-60 caractères : on retient la première variante qui tient.
const fitTitle = (candidates: string[]) => candidates.find((candidate) => candidate.length >= 30 && candidate.length <= 60) ?? candidates[candidates.length - 1];

export const evisaMetaForPath = (path: string): PublicMeta | undefined => {
  const match = path.match(/^\/evisa\/([^/]+)$/);
  if (!match) return undefined;
  const destination = evisasDatabaseComplete.find((entry) => entry.id === match[1]);
  if (!destination) return undefined;
  return {
    title: fitTitle([`${destination.country} e‑Visa | ${SITE}`, `${destination.country} e‑Visa | 3M Travel`]),
    description: `Repères e‑Visa pour ${destination.country} : type, documents, délais et portail officiel à vérifier avant toute démarche.`,
    keywords: [`e‑Visa ${destination.country}`, `visa ${destination.country}`, "e‑Visa Cameroun", "3M Travel"],
    heading: `e‑Visa ${destination.country}`,
    lead: `Consultez les repères disponibles pour ${destination.country} et vérifiez toujours l’éligibilité, les frais et les conditions sur le portail officiel.`,
  };
};

const studyArticleForPath = (path: string) => {
  const match = path.match(/^\/blog\/etudes\/([^/]+)$/);
  return match ? getStudyDestinationArticle(match[1]) : undefined;
};

// Paires FR<->EN pour l'émission des balises hreflang, limitées aux pages
// effectivement traduites dans ce premier lot bilingue.
const HREFLANG_PAIRS: Record<string, string> = {
  "/": "/en",
  "/en": "/",
};
for (const detail of PUBLIC_DESTINATION_DETAILS) {
  const englishContent = getEnglishContentByFrId(detail.procedure.id);
  if (!englishContent) continue;
  const frPath = `/procedures/${detail.procedure.id}`;
  const enPath = `/en/procedures/${englishContent.enSlug}`;
  HREFLANG_PAIRS[frPath] = enPath;
  HREFLANG_PAIRS[enPath] = frPath;
}

// Pages personnelles ou transactionnelles : shell 200 non indexable, absent du sitemap.
const privateShell = (heading: string, description: string, lead = "Cette page est liée à une démarche personnelle et n’est pas indexée."): PublicMeta => ({
  title: `${heading} | ${SITE}`,
  description,
  heading,
  lead,
  noindex: true,
});

export const PUBLIC_PAGES: Record<string, PublicMeta> = {
  "/en": {
    title: `3M Travel & Services | International Mobility from Yaoundé`,
    description: "3M Travel & Services supports your international mobility project — visa applications, study abroad, and travel services — from Yaoundé, Cameroon.",
    keywords: ["visa Cameroon", "Canada work visa Yaoundé", "study in France", "international mobility", "3M Travel & Services"],
    heading: "Your international mobility project, prepared with method",
    lead: "3M Travel & Services supports candidates in preparing their applications. Decisions by authorities, employers and external partners remain independent of the agency.",
  },
  "/": { title: HOME_TITLE, description: HOME_DESCRIPTION, keywords: ["voyages", "visas", "études à l'étranger", "mobilité internationale", "billets d'avion", "3M Travel & Services", "3M Travel Agency"], heading: "3M Travel & Services : voyages, visas, études et mobilité internationale depuis Yaoundé", lead: "Évaluation gratuite, accompagnement personnalisé par une équipe basée à Yaoundé et joignable par WhatsApp, agence enregistrée depuis 2019." },
  "/canada": { title: `Canada | ${SITE}`, description: "Préparez votre projet Canada avec des informations officielles et un accompagnement administratif documenté, sans promesse de résultat.", keywords: ["visa Canada", "immigration Canada", "permis de travail", "études au Canada", "3M Travel"], heading: "Démarches Canada", lead: "Préparez votre projet avec des informations vérifiables, sans promesse d’admission, d’emploi ou de résidence." },
  "/schengen": { title: `Espace Schengen | ${SITE}`, description: "Repères administratifs pour les projets de visa et de mobilité vers l’espace Schengen.", heading: "Démarches Schengen", lead: "Les exigences varient selon le pays et la situation individuelle ; les liens institutionnels sont prioritaires." },
  "/etudes": { title: `Études à l’international | ${SITE}`, description: "Accompagnement documenté pour les projets d’études à l’international et les dossiers associés.", heading: "Projet d’études à l’international", lead: "L’admission et les décisions consulaires relèvent exclusivement des établissements et autorités compétents." },
  "/billets": { title: `Billets d'avion et vols | ${SITE}`, description: "Recherchez vos vols, comparez les options et demandez votre réservation à Yaoundé. Tarifs et disponibilités confirmés avant tout paiement.", keywords: ["billets d'avion", "réservation de vol", "3M Booking", "vol Yaoundé", "agence de voyage Cameroun"], heading: "Réservez votre vol avec 3M Travel", lead: "Recherchez votre itinéraire, comparez les options disponibles et demandez votre réservation. Disponibilités et tarifs confirmés avant toute réservation ou paiement." },
  "/ambassador-program": { title: `Programme Ambassadeur | ${SITE}`, description: "Rejoignez le programme Ambassadeur de 3M Travel & Services, partagez des liens de parrainage et suivez les dossiers éligibles depuis Yaoundé.", keywords: ["programme ambassadeur", "parrainage visa", "3M Travel", "commission parrainage"], heading: "Programme Ambassadeur 3M Travel", lead: "Présentez nos services à votre réseau avec un code de parrainage traçable ; les commissions dépendent des dossiers et paiements effectivement confirmés." },
  "/tourisme": { title: `Tourisme, hôtels et séjours | ${SITE}`, description: "Préparez un séjour avec des repères de destination, des hébergements et une demande de devis accompagnée.", heading: "Tourisme et séjours sur mesure", lead: "Les disponibilités, fournisseurs et tarifs sont confirmés par l’agence avant toute réservation." },
  "/assurance": { title: `Assurance voyage | ${SITE}`, description: "Préparez une demande d’assurance voyage avec un circuit administratif documenté et une validation humaine.", heading: "Assurance voyage", lead: "La couverture, les garanties et le tarif final dépendent du fournisseur et des informations validées." },
  "/traduction/order": { title: `Traduction certifiée | ${SITE}`, description: "Déposez une demande de traduction certifiée avec un parcours documentaire sécurisé.", heading: "Demande de traduction certifiée", lead: "Le délai, le prix et la recevabilité dépendent du document, des langues et du traducteur compétent." },
  "/hotels": { title: `Hôtels et séjours | ${SITE}`, description: "Ancien accès aux services hôteliers de 3M Travel, redirigé vers le parcours tourisme.", heading: "Hôtels et séjours", lead: "Redirection vers le parcours tourisme de 3M Travel." },
  "/visa-etudes": { title: `Études à l’international | ${SITE}`, description: "Ancien accès au parcours études, redirigé vers la page canonique des études.", heading: "Études à l’international", lead: "Redirection vers le parcours études de 3M Travel." },
  "/cni-passeport": { title: `CNI et passeport | ${SITE}`, description: "Demande, renouvellement, perte ou vol de carte nationale d’identité ou de passeport : préparation du dossier et suivi avec 3M Travel & Services à Yaoundé.", heading: "CNI et passeport", lead: "Les frais officiels, les délais et la décision de délivrance relèvent de l’administration ; 3M prépare et suit votre dossier sans garantir de résultat." },
  "/services": { title: `Tous nos services | ${SITE}`, description: "Immigration, visas, billets d’avion, hôtels, assurance voyage, CNI, passeport, e-Visa et formations : tous les services de 3M à Yaoundé.", heading: "Tous les services de 3M Travel & Services", lead: "Mobilité internationale, travel et démarches administratives : choisissez votre besoin et suivez votre dossier avec un seul interlocuteur. Les décisions appartiennent aux autorités et prestataires concernés ; 3M prépare et suit sans garantir de résultat." },
  "/formation": { title: `Formations | ${SITE}`, description: "Découvrez les programmes de formation et d’orientation proposés par 3M Travel & Services.", heading: "Formation et orientation", lead: "Les contenus sont présentés à titre d’information ; chaque inscription est confirmée selon les conditions applicables." },
  "/blog": { title: `Ressources mobilité internationale | ${SITE}`, description: "Guides et articles pratiques sur les démarches de mobilité internationale.", heading: "Ressources et guides", lead: "Consultez nos contenus de préparation et complétez-les avec les sources officielles de votre destination." },
  "/procedures": { title: `Procédures de mobilité | ${SITE}`, description: "Consultez les étapes, documents et repères administratifs des procédures de mobilité internationale par destination.", keywords: ["procédures visa", "documents visa", "mobilité internationale", "dossier immigration", "3M Travel"], heading: "Procédures par destination", lead: "Chaque procédure est adaptée à la destination et vérifiée par l’équipe avant toute étape sensible." },
  "/evisas": { title: `e-Visas | ${SITE}`, description: "Préparation et suivi des demandes d’e-Visa avec circuit documentaire sécurisé.", heading: "Services e-Visa", lead: "La décision de délivrance relève de l’autorité compétente ; les documents sont traités avec traçabilité." },
  "/tarifs": { title: `Tarifs et informations de frais | ${SITE}`, description: "Informations transparentes sur les prestations, frais tiers possibles et conditions de traitement.", heading: "Tarifs et transparence", lead: "Les frais externes et décisions partenaires sont présentés avant engagement lorsqu’ils sont connus." },
  "/avis": { title: `Avis et retours | ${SITE}`, description: "Retours publiés après modération et informations de transparence de 3M Travel & Services.", heading: "Avis et transparence", lead: "Les retours sont traités avec modération ; aucun résultat individuel n’est garanti." },
  "/contact": { title: `Contact | ${SITE}`, description: "Contactez 3M Travel & Services à Yaoundé ou Ottawa pour une orientation sur votre projet de mobilité internationale.", keywords: ["contact 3M Travel", "agence visa Yaoundé", "agence voyage Cameroun", "mobilité internationale", "Ottawa"], heading: "Contacter 3M Travel & Services", lead: "Nos équipes répondent aux demandes d’orientation et précisent les étapes à confirmer." },
  "/consultation": { title: `Prendre rendez-vous | ${SITE}`, description: "Demandez une consultation avec un conseiller 3M Travel : indiquez votre projet et votre pays cible, l’équipe vous recontacte sous 24 à 48 h ouvrées.", keywords: ["rendez-vous conseiller", "consultation visa", "consultation immigration", "agence visa Yaoundé", "3M Travel"], heading: "Prendre rendez-vous avec un conseiller", lead: "Indiquez votre projet et votre pays de destination ; un conseiller vous recontacte pour cadrer votre démarche, sans engagement ni promesse de résultat." },
  "/about": { title: `Qui sommes-nous | ${SITE}`, description: "Présentation, engagements de transparence et informations légales de 3M Travel & Services.", heading: "Une agence de mobilité internationale documentée", lead: "Notre rôle est d’accompagner la préparation administrative ; les décisions externes restent indépendantes." },
  "/politique-confidentialite": { title: `Politique de confidentialité | ${SITE}`, description: "Informations sur le traitement des données et documents confiés à 3M Travel & Services.", heading: "Confidentialité et données", lead: "Les données sensibles sont limitées aux finalités de traitement et aux accès autorisés." },
  "/conditions-utilisation": { title: `Conditions d’utilisation | ${SITE}`, description: "Conditions d’utilisation des services et informations de responsabilité.", heading: "Conditions d’utilisation", lead: "Les services d’accompagnement ne remplacent ni les autorités compétentes ni les décisions de partenaires externes." },
  "/accessibilite": { title: `Accessibilité | ${SITE}`, description: "Engagements et informations d’accessibilité du site 3M Travel & Services.", heading: "Accessibilité", lead: "Nous cherchons à rendre le site utilisable par le plus grand nombre ; signalez-nous toute difficulté rencontrée." },
  "/ressources": { title: `Ressources | ${SITE}`, description: "Ressources utiles et liens d’orientation pour les projets de mobilité internationale.", heading: "Ressources utiles", lead: "Préparez votre projet à partir d’informations vérifiables et de sources institutionnelles." },
  "/guide-procedures": { title: `Guide des procédures | ${SITE}`, description: "Guide de préparation des démarches, documents et étapes de suivi.", heading: "Guide des procédures", lead: "Les étapes réellement applicables dépendent de votre destination, profil et dossier." },
  "/3m-digital": { title: `3M Digital | ${SITE}`, description: "Services numériques et accompagnement documentaire de 3M Travel & Services.", heading: "3M Digital", lead: "Découvrez les services numériques et soumettez une demande détaillée à l’équipe." },
  "/plan-du-site": { title: `Plan du site | ${SITE}`, description: "Accédez aux principales pages, procédures, ressources et informations de 3M Travel & Services.", heading: "Plan du site", lead: "Trouvez rapidement les pages utiles à votre démarche de mobilité internationale." },
  "/sources-officielles": { title: `Sources officielles | ${SITE}`, description: "Liens institutionnels par destination pour préparer une démarche de mobilité internationale.", heading: "Sources officielles par destination", lead: "Les informations institutionnelles constituent la référence pour les exigences, délais et décisions applicables." },
  "/etat-du-service": { title: `État du service | ${SITE}`, description: "Consultez l’état public des services et les informations de maintenance de 3M Travel & Services.", heading: "État du service", lead: "Retrouvez ici les informations publiques sur la disponibilité des services et les maintenances annoncées." },
  "/document-upload": { title: `Dépôt de documents | ${SITE}`, description: "Espace sécurisé de dépôt de documents pour les candidats connectés.", heading: "Dépôt de documents", lead: "Connectez-vous pour déposer ou consulter vos documents. Cette page n’est pas indexée.", noindex: true },
  "/mes-vols-favoris": { title: `Mes vols favoris | ${SITE}`, description: "Espace privé de gestion des vols favoris.", heading: "Mes vols favoris", lead: "Connectez-vous pour consulter vos itinéraires enregistrés. Cette page n’est pas indexée.", noindex: true },
  "/flights": { title: `Recherche de vols | ${SITE}`, description: "Espace de recherche et de demande de vols 3M Booking.", heading: "Recherche de vols", lead: "Les recherches et demandes de réservation sont traitées dans un espace non indexé.", noindex: true },
  "/register": { title: `Inscription | ${SITE}`, description: "Création sécurisée d’un espace client 3M Travel & Services.", heading: "Créer mon espace client", lead: "Créez votre espace pour suivre vos démarches et communiquer avec l’agence. Cette page n’est pas indexée.", noindex: true },
  "/signup": { title: `Inscription | ${SITE}`, description: "Création sécurisée d’un espace client 3M Travel & Services.", heading: "Créer mon espace client", lead: "Créez votre espace pour suivre vos démarches et communiquer avec l’agence. Cette page n’est pas indexée.", noindex: true },
  "/evaluation": { title: `Évaluation de profil | ${SITE}`, description: "Formulaire sécurisé d’évaluation préalable pour préparer votre projet de mobilité internationale.", heading: "Évaluation préalable de votre projet", lead: "Connectez-vous pour compléter votre évaluation. L’analyse aide à préparer le dossier ; aucune décision de visa, d’emploi ou d’admission n’est automatique.", noindex: true },
  "/confirm-email": { title: `Activer mon compte | ${SITE}`, description: "Page sécurisée d’activation du compte candidat.", heading: "Activer mon compte", lead: "Utilisez le lien sécurisé reçu par e-mail. Cette page n’est pas indexée.", noindex: true },
  "/verify-email-link": { title: `Activer mon compte | ${SITE}`, description: "Page sécurisée de confirmation de l’adresse e-mail du candidat.", heading: "Confirmer mon adresse e-mail", lead: "Utilisez le lien sécurisé reçu par e-mail. Cette page n’est pas indexée.", noindex: true },
  "/verify-email": { title: `Vérifier mon adresse e-mail | ${SITE}`, description: "Page sécurisée de vérification de l’adresse e-mail du candidat.", heading: "Vérifier mon adresse e-mail", lead: "Cette page n’est pas indexée.", noindex: true },
  "/verify-email-sent": { title: `Lien d’activation envoyé | ${SITE}`, description: "Confirmation de l’envoi du lien d’activation du compte candidat.", heading: "Consultez votre e-mail", lead: "Cette page n’est pas indexée.", noindex: true },
  "/verify-application-email": { title: `Confirmer mon dossier | ${SITE}`, description: "Page sécurisée de confirmation d’accès au dossier candidat.", heading: "Confirmer mon dossier", lead: "Cette page n’est pas indexée.", noindex: true },
  "/mon-espace": { title: `Mon espace | ${SITE}`, description: "Espace privé de suivi des démarches et communications.", heading: "Mon espace client", lead: "Connectez-vous pour consulter votre espace personnel. Cette page n’est pas indexée.", noindex: true },
  "/mon-dossier": { title: `Mon dossier | ${SITE}`, description: "Espace privé de suivi du dossier client.", heading: "Mon dossier", lead: "Connectez-vous pour suivre votre dossier. Cette page n’est pas indexée.", noindex: true },
  "/confirm-email-change": { title: `Confirmer mon adresse e-mail | ${SITE}`, description: "Page sécurisée de confirmation du changement d’adresse e-mail.", heading: "Confirmer le changement d’adresse", lead: "Cette page sécurisée n’est pas indexée.", noindex: true },
  "/assistance-acces": { title: `Assistance accès | ${SITE}`, description: "Demande d’assistance sécurisée pour la récupération d’accès à un espace client.", heading: "Assistance pour récupérer l’accès", lead: "Cette page de récupération nécessite une vérification humaine et n’est pas indexée.", noindex: true },
  "/parcours": { title: `Comment ça marche | ${SITE}`, description: "Découvrez les étapes du parcours d’accompagnement 3M Travel & Services, de l’évaluation initiale à l’obtention de votre visa.", keywords: ["comment ça marche", "parcours visa", "étapes dossier", "accompagnement mobilité", "3M Travel"], heading: "Votre parcours d’accompagnement", lead: "De l’évaluation initiale à la constitution du dossier : découvrez comment 3M Travel & Services vous accompagne à chaque étape." },
  "/how-it-works": { title: `How it works | ${SITE}`, description: "Discover the 3M Travel & Services support process, from the initial evaluation to your visa application.", keywords: ["how it works", "visa process", "application steps", "international mobility", "3M Travel"], heading: "Your support journey", lead: "From the initial evaluation to building your file: discover how 3M Travel & Services supports you at every step." },
  "/fiches": { title: `Fiches pays et démarches | ${SITE}`, description: "Consultez les fiches pratiques par destination pour préparer votre dossier de mobilité internationale.", keywords: ["fiches pays", "fiches visa", "démarches immigration", "destinations mobilité", "3M Travel"], heading: "Fiches pratiques par destination", lead: "Retrouvez les informations essentielles pour chaque destination : étapes, documents, contacts consulaires et sources officielles." },
  "/destinations": { title: `Destinations | ${SITE}`, description: "Explorez les destinations de mobilité internationale accompagnées par 3M Travel & Services depuis Yaoundé.", keywords: ["destinations visa", "pays immigration", "mobilité internationale", "études travail étranger", "3M Travel"], heading: "Destinations de mobilité internationale", lead: "Choisissez votre destination et consultez les procédures, les sources officielles et les repères d’accompagnement disponibles." },
  "/cv-generator": { title: `Générateur de CV | ${SITE}`, description: "Créez un CV professionnel adapté aux standards des pays de destination avec l’outil gratuit de 3M Travel & Services.", keywords: ["générateur CV", "CV professionnel", "CV immigration", "modèle CV visa", "3M Travel"], heading: "Créer votre CV professionnel", lead: "Générez un CV structuré selon les standards attendus par les employeurs et les autorités de votre pays de destination." },
  "/evisa": { title: `e-Visas | ${SITE}`, description: "Accédez à l’annuaire complet des procédures e-Visa par destination avec 3M Travel & Services.", keywords: ["e-visa", "visa électronique", "demande evisa", "visa en ligne", "3M Travel"], heading: "Services e-Visa", lead: "Consultez les procédures e-Visa disponibles, les conditions d’éligibilité et les étapes de demande vérifiées par l’agence." },
  "/conformite-documents": { title: `Conformité de documents | ${SITE}`, description: "Vérifiez la conformité de vos documents avant de constituer votre dossier de mobilité internationale.", keywords: ["conformité documents", "vérification pièces", "contrôle dossier", "documents visa", "3M Travel"], heading: "Vérification de la conformité de vos documents", lead: "Assurez-vous que vos pièces sont conformes aux exigences de la destination avant de soumettre votre dossier." },
  // Guides formation et travail qualifié rendus par App.tsx sans fiche procédure équivalente.
  "/procedures/allemagne-formation": { title: `Allemagne : formation et visa | ${SITE}`, description: "Cours de langue intensif ou Ausbildung en Allemagne : conditions, étapes du visa et documents à prévoir, avec un accompagnement depuis Yaoundé.", keywords: ["visa Allemagne", "Ausbildung Allemagne", "cours de langue Allemagne", "formation professionnelle", "3M Travel"], heading: "Formation professionnelle en Allemagne", lead: "Repères sur le cours de langue intensif et l’Ausbildung : conditions, étapes du visa et documents à confirmer auprès des autorités compétentes, sans promesse de résultat." },
  "/procedures/autriche-formation": { title: `Autriche : apprentissage et visa | ${SITE}`, description: "Apprentissage (Lehre) et Red-White-Red Card en Autriche : conditions, étapes du visa et documents à prévoir, avec un accompagnement depuis Yaoundé.", keywords: ["visa Autriche", "apprentissage Autriche", "Lehre Autriche", "Red-White-Red Card", "3M Travel"], heading: "Apprentissage en Autriche", lead: "Repères sur la Lehre et les dispositifs d’accès des ressortissants de pays tiers ; les conditions applicables sont à confirmer auprès des autorités compétentes." },
  "/procedures/suisse-formation": { title: `Suisse : apprentissage et visa | ${SITE}`, description: "Formation professionnelle initiale en Suisse : conditions d’engagement, étapes du visa et documents à prévoir, avec un accompagnement depuis Yaoundé.", keywords: ["visa Suisse", "apprentissage Suisse", "formation professionnelle Suisse", "permis de travail Suisse", "3M Travel"], heading: "Apprentissage en Suisse", lead: "Repères sur la formation professionnelle initiale et l’engagement d’apprentis étrangers ; chaque canton et chaque employeur reste décisionnaire." },
  "/procedures/emirats": { title: `Émirats Arabes Unis : visa de travail | ${SITE}`, description: "Employment Visa ou Golden Visa aux Émirats Arabes Unis : dispositifs, secteurs porteurs et étapes à confirmer, avec un accompagnement depuis Yaoundé.", keywords: ["visa Émirats Arabes Unis", "travail Dubaï", "Employment Visa", "Golden Visa", "3M Travel"], heading: "Travailler aux Émirats Arabes Unis", lead: "Repères sur l’Employment Visa et le Golden Visa ; seuils, délais et conditions sont à confirmer auprès des autorités émiraties avant toute démarche." },
  "/procedures/arabie-saoudite": { title: `Arabie Saoudite : visa de travail | ${SITE}`, description: "Visa de travail sponsorisé en Arabie Saoudite : secteurs concernés, étapes et points de vigilance contractuels, avec un accompagnement depuis Yaoundé.", keywords: ["visa Arabie Saoudite", "travail Arabie Saoudite", "visa sponsorisé", "Vision 2030", "3M Travel"], heading: "Travailler en Arabie Saoudite", lead: "Repères sur le visa de travail sponsorisé par l’employeur ; vérifiez attentivement les conditions contractuelles avant toute signature." },
  "/procedures/coree-du-sud": { title: `Corée du Sud : visa de travail E-9 | ${SITE}`, description: "Programme EPS et visa E-9 en Corée du Sud : test de coréen, conditions d’accès et étapes à vérifier avant tout engagement, depuis Yaoundé.", keywords: ["visa Corée du Sud", "visa E-9", "programme EPS", "test EPS-TOPIK", "3M Travel"], heading: "Travailler en Corée du Sud", lead: "Repères sur le programme EPS et le visa E-9 ; l’éligibilité dépend d’un accord bilatéral à vérifier au cas par cas avant tout engagement." },
  "/procedures/japon": { title: `Japon : stage technique et visa | ${SITE}`, description: "Programme de stagiaires techniques (TITP) et visas de spécialistes au Japon : secteurs, étapes et vigilance sur les organismes agréés.", keywords: ["visa Japon", "stage technique Japon", "TITP", "travail Japon", "3M Travel"], heading: "Travailler au Japon", lead: "Repères sur le programme de stagiaires techniques et les visas de spécialistes ; ne traitez qu’avec des organismes agréés et vérifiés." },
  // Parcours personnels, transactionnels ou doublons d’une page de référence : servis en 200 non indexable.
  "/complete-profile": privateShell("Compléter mon profil", "Renseignez les informations manquantes de votre profil pour finaliser votre espace client 3M Travel & Services."),
  "/forgot-password": privateShell("Mot de passe oublié", "Demandez un lien sécurisé pour réinitialiser le mot de passe de votre espace client 3M Travel & Services."),
  "/reset-password": privateShell("Nouveau mot de passe", "Définissez un nouveau mot de passe grâce au lien sécurisé reçu par e-mail pour retrouver l’accès à votre espace client."),
  "/payment/method-selection": privateShell("Choisir un mode de paiement", "Sélectionnez le mode de règlement d’un dossier 3M Travel & Services depuis votre espace client."),
  "/payment/agency-confirmation": privateShell("Paiement en agence", "Confirmation d’une demande de paiement en agence pour un dossier 3M Travel & Services."),
  "/payment/success": privateShell("Retour de paiement", "Page de retour après un paiement en ligne ; le statut définitif du règlement est confirmé par l’agence."),
  "/payment-success": privateShell("Retour de paiement", "Page de retour après un paiement en ligne ; le statut définitif du règlement est confirmé par l’agence."),
  "/payment/error": privateShell("Paiement non abouti", "Page de retour après un paiement interrompu ou refusé, avec les options pour réessayer ou contacter l’agence."),
  "/payment-failed": privateShell("Paiement non abouti", "Page de retour après un paiement interrompu ou refusé, avec les options pour réessayer ou contacter l’agence."),
  "/dossier-confirmation": privateShell("Confirmation de dossier", "Confirmation de la réception de votre dossier par 3M Travel & Services et prochaines étapes."),
  "/open-dossier": privateShell("Ouvrir un dossier", "Ouverture sécurisée d’un dossier depuis votre espace client 3M Travel & Services."),
  "/submit-documents": privateShell("Dépôt de vos documents", "Dépôt sécurisé des pièces de votre dossier depuis votre espace client 3M Travel & Services."),
  "/evaluation-result": privateShell("Résultat de votre évaluation", "Liste des documents à prévoir issue de votre évaluation préalable, à confirmer avec l’agence."),
  "/evisas/request": privateShell("Demande d’e-Visa", "Formulaire sécurisé de demande d’e-Visa avec validation du dossier par l’équipe 3M Travel & Services."),
  "/procedures/comparaison": privateShell("Comparateur de destinations", "Comparez vos destinations favorites selon votre profil ; les scores sont indicatifs et enregistrés sur votre appareil."),
  "/3m-booking": privateShell("3M Booking", "Accès historique à la recherche de vols 3M Booking, dont la page de référence est /billets.", "Accès alternatif à une page existante ; cette adresse n’est pas indexée."),
  "/assurance-inscription": privateShell("Inscription assurance voyage", "Accès alternatif au formulaire d’assurance voyage, dont la page de référence est /assurance.", "Accès alternatif à une page existante ; cette adresse n’est pas indexée."),
};

const esc = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
const publicPath = (url: string) => {
  const raw = url.split("?")[0] || "/";
  return raw === "/" ? "/" : raw.replace(/\/+$/, "");
};
const publicNav = `<nav aria-label="Navigation publique pré-rendue"><a href="/">Accueil</a><a href="/procedures">Procédures</a><a href="/evisas">e-Visas</a><a href="/tarifs">Tarifs</a><a href="/sources-officielles">Sources officielles</a><a href="/plan-du-site">Plan du site</a></nav>`;
const OFFICIAL_SOURCE_DESTINATIONS = [
  ["canada", "Canada", "Immigration, Réfugiés et Citoyenneté Canada"],
  ["france", "France", "France-Visas"],
  ["allemagne", "Allemagne", "Ministère fédéral des Affaires étrangères"],
  ["belgique", "Belgique", "SPF Affaires étrangères"],
  ["espagne", "Espagne", "Ministère des Affaires étrangères"],
  ["italie", "Italie", "Ministère des Affaires étrangères"],
  ["luxembourg", "Luxembourg", "Gouvernement du Luxembourg"],
  ["portugal", "Portugal", "Ministère des Affaires étrangères"],
  ["royaume-uni", "Royaume-Uni", "GOV.UK — Visas et immigration"],
  ["suisse", "Suisse", "Secrétariat d’État aux migrations"],
  ["australie", "Australie", "Department of Home Affairs"],
  ["etats-unis", "États-Unis", "U.S. Department of State"],
] as const;

const routeSpecificPrerender = (path: string) => {
  if (path === "/") {
    return `<section aria-label="Services de mobilité"><h2>Préparez votre projet de mobilité internationale</h2><p>Découvrez les procédures, les sources institutionnelles et une évaluation initiale gratuite avant toute démarche.</p><p><a href="/?project=travail&amp;destination=canada#evaluation-multi">Commencer l’évaluation gratuite</a> · <a href="/procedures">Explorer les procédures</a> · <a href="/sources-officielles">Consulter les sources officielles</a></p></section>`;
  }
  if (path === "/en") {
    const links = PUBLIC_DESTINATION_DETAILS
      .map((detail) => getEnglishContentByFrId(detail.procedure.id))
      .filter((entry): entry is ProcedureEnglishContent => Boolean(entry))
      .map((entry) => `<li><a href="/en/procedures/${encodeURIComponent(entry.enSlug)}">${esc(entry.description)}</a></li>`)
      .join("");
    return `<section aria-label="Mobility services"><h2>Prepare your international mobility project</h2><p>Discover our most requested procedures, verified institutional sources, and a free initial evaluation before any step.</p><p><a href="/?project=travail&amp;destination=canada#evaluation-multi">Start the free evaluation</a> · <a href="/en">Explore priority procedures</a> · <a href="/sources-officielles">View official sources</a></p></section><section aria-label="Priority destinations"><h2>Most requested procedures from Yaoundé</h2><ul>${links}</ul></section>`;
  }
  if (path === "/contact") {
    const yaounde = COMPANY_PROFILE.offices.cameroon;
    const ottawa = COMPANY_PROFILE.offices.ottawa;
    return `<section aria-label="Coordonnées de 3M Travel"><h2>Coordonnées et bureaux</h2><article><h3>${esc(yaounde.label)}</h3><p>${yaounde.addressLines.map(esc).join("<br />")}</p><p><a href="https://wa.me/${esc(yaounde.whatsappNumber)}">WhatsApp : ${esc(yaounde.whatsappDisplay)}</a>${yaounde.phoneDisplay ? ` · <a href="tel:${esc(yaounde.phoneDisplay.replace(/\s/g, ""))}">${esc(yaounde.phoneDisplay)}</a>` : ""}</p><p>${esc(yaounde.openingHours.join(" · "))}</p></article><article><h3>${esc(ottawa.label)}</h3><p>${ottawa.addressLines.map(esc).join("<br />")}</p><p><a href="tel:${esc(ottawa.whatsappNumber)}">${esc(ottawa.whatsappDisplay)}</a></p></article><p><a href="mailto:${esc(COMPANY_PROFILE.publicEmail)}">${esc(COMPANY_PROFILE.publicEmail)}</a> · <a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(yaounde.mapQuery)}">Ouvrir la carte de Yaoundé</a></p></section>`;
  }
  if (path === "/sources-officielles") {
    const sources = OFFICIAL_SOURCE_DESTINATIONS.map(([key, country, authority]) => {
      const portal = OFFICIAL_CONSULAR_PORTALS[key];
      return portal ? `<article><h2>${esc(country)}</h2><p><strong>${esc(authority)}</strong><br />${esc(portal.label)}</p><p>Dernière vérification : ${esc(portal.verifiedAt)}. Les exigences peuvent changer.</p><p><a href="${esc(portal.url)}" target="_blank" rel="noopener noreferrer">Ouvrir la source officielle</a></p></article>` : "";
    }).join("");
    return `<section aria-label="Portails institutionnels"><h2>Portails institutionnels vérifiés</h2><p>Les liens ci-dessous ne constituent ni une garantie d’éligibilité, ni une soumission, ni une décision. Confirmez la procédure correspondant à votre nationalité et à votre projet.</p>${sources}</section>`;
  }
  if (path === "/tarifs") {
    return `<section aria-label="Informations tarifaires"><h2>Comprendre les tarifs avant de vous engager</h2><article><h3>Évaluation gratuite</h3><p>Première orientation sur votre projet et les informations à confirmer, sans engagement de procédure.</p></article><article><h3>Ouverture et suivi de dossier</h3><p>Les honoraires d’agence sont communiqués pour le service demandé avant tout règlement.</p></article><article><h3>Accompagnement sur mesure</h3><p>Un devis peut être nécessaire selon la destination, les documents et les prestations retenues.</p></article><p>Les frais tiers ne sont pas présumés inclus. Leur montant, destinataire et conditions sont précisés selon la procédure.</p><p><a href="/?project=travail#evaluation-multi">Demander une orientation</a></p></section>`;
  }
  if (path === "/plan-du-site") {
    const links = [["Accueil", "/"], ["Procédures et destinations", "/procedures"], ["e-Visas", "/evisas"], ["Tarifs", "/tarifs"], ["Contact", "/contact"], ["Sources officielles", "/sources-officielles"], ["Ressources", "/ressources"], ["Guide des procédures", "/guide-procedures"], ["Créer un compte", "/register"], ["Connexion candidat", "/login"]] as const;
    return `<section aria-label="Navigation complète"><h2>Accéder rapidement aux services 3M Travel</h2><ul>${links.map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join("")}</ul></section>`;
  }
  if (path === "/procedures") {
    const procedures = PUBLIC_DESTINATION_DETAILS.map(({ procedure }) => `<li><a href="/procedures/${encodeURIComponent(procedure.id)}">${esc(procedure.name)} — ${esc(procedure.visaType)}</a></li>`).join("");
    return `<section aria-label="Catalogue des procédures"><h2>107 procédures par destination</h2><p>Recherchez une destination puis vérifiez les informations applicables auprès du portail institutionnel associé.</p><ul>${procedures}</ul></section>`;
  }
  if (path === "/evisas") {
    const catalogue = evisasDatabaseComplete.map((entry) => `<li><a href="/evisa/${encodeURIComponent(entry.id)}">${esc(entry.country)}</a> — ${esc(entry.type)} · ${esc(entry.region)}</li>`).join("");
    return `<section aria-label="Aperçu de l’annuaire e-Visa"><h2>Annuaire des procédures e-Visa</h2><p>Les conditions de délivrance, nationalités admises, frais et délais doivent être confirmés sur le portail officiel de la destination avant toute démarche.</p><ul>${catalogue}</ul><p><a href="/contact">Demander une orientation à 3M Travel</a></p></section>`;
  }
  const evisaMatch = path.match(/^\/evisa\/([^/]+)$/);
  if (evisaMatch) {
    const destination = evisasDatabaseComplete.find((entry) => entry.id === evisaMatch[1]);
    if (!destination) return "";
    const steps = destination.steps.map((step) => `<li>${esc(step)}</li>`).join("");
    const officialPortal = destination.officialPortalUrl
      ? `<p><a href="${esc(destination.officialPortalUrl)}" target="_blank" rel="noopener noreferrer">${esc(destination.officialPortalLabel || "Consulter le portail officiel")}</a>${destination.officialVerifiedAt ? ` · Vérifié le ${esc(destination.officialVerifiedAt)}` : ""}</p>`
      : `<p>Le portail officiel doit être vérifié avant tout paiement ou dépôt de document.</p>`;
    return `<section aria-label="Détails e-Visa"><h2>${esc(destination.country)} : repères e-Visa</h2><p>${esc(destination.culture)}</p><p><strong>Type :</strong> ${esc(destination.type)} · <strong>Durée :</strong> ${esc(destination.duration)} · <strong>Délai :</strong> ${esc(destination.delay)} · <strong>Frais :</strong> ${esc(destination.fee)}</p><h2>Étapes à vérifier</h2><ol>${steps}</ol><p><strong>Documents :</strong> ${esc(destination.docs)}</p>${officialPortal}<p>Ces informations sont indicatives et à confirmer sur le portail officiel avant toute démarche, paiement ou réservation. La délivrance relève de l’autorité compétente : 3M Travel &amp; Services n’en garantit ni l’obtention ni les délais.</p><p><a href="/evisas">Retourner à l’annuaire e-Visa</a> · <a href="/contact">Demander une orientation</a></p></section>`;
  }
  const studyArticle = studyArticleForPath(path);
  if (studyArticle) {
    const steps = studyArticle.steps.map((step) => `<li>${esc(step)}</li>`).join("");
    const documents = studyArticle.documents.map((document) => `<li>${esc(document)}</li>`).join("");
    return `<article aria-label="Article études ${esc(studyArticle.country)}"><p>${esc(studyArticle.overview)}</p><h2>Le point de départ du projet</h2><p>${esc(studyArticle.focus)}</p><h2>Étapes de préparation</h2><ol>${steps}</ol><h2>Documents à anticiper</h2><ul>${documents}</ul><h2>Budget et vérification</h2><p>${esc(studyArticle.budget)}</p><p><a href="${esc(studyArticle.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(studyArticle.sourceLabel)}</a> · <a href="/blog">Retour aux ressources</a></p></article>`;
  }
  return "";
};

export function isPublicIndexablePath(url: string) {
  return Boolean(PUBLIC_PAGES[publicPath(url)]);
}

export function getIndexablePublicPaths() {
  const staticPaths = Object.entries(PUBLIC_PAGES)
    .filter(([, meta]) => !meta.noindex)
    .map(([path]) => path);
  const destinationPaths = PUBLIC_DESTINATION_DETAILS.map((detail) => `/procedures/${detail.procedure.id}`);
  const englishProcedurePaths = PUBLIC_DESTINATION_DETAILS
    .map((detail) => getEnglishContentByFrId(detail.procedure.id))
    .filter((entry): entry is ProcedureEnglishContent => Boolean(entry))
    .map((entry) => `/en/procedures/${entry.enSlug}`);
  const evisaPaths = evisasDatabaseComplete.map((entry) => `/evisa/${entry.id}`);
  const studyArticlePaths = studyDestinationArticles.map((entry) => `/blog/etudes/${entry.slug}`);
  return staticPaths
    .concat(destinationPaths.filter((path) => staticPaths.indexOf(path) === -1))
    .concat(englishProcedurePaths.filter((path) => staticPaths.indexOf(path) === -1))
    .concat(evisaPaths.filter((path) => staticPaths.indexOf(path) === -1))
    .concat(studyArticlePaths.filter((path) => staticPaths.indexOf(path) === -1));
}

export function composePublicPrerender(template: string, url: string) {
  const path = publicPath(url);
  const isEnPath = path === "/en" || path.startsWith("/en/");
  const studyArticle = studyArticleForPath(path);
  const blogArticle = studyArticle
    ? { title: `${studyArticle.seoTitle} | ${SITE}`, description: studyArticle.description, heading: studyArticle.title, lead: studyArticle.description }
    : undefined;
  const procedurePage = procedureMetaForPath(path) ?? procedureMetaForPathEn(path);
  const procedureDetail = procedurePage
    ? isEnPath
      ? (() => {
          const match = path.match(/^\/en\/(?:procedures|destinations)\/([^/]+)$/);
          const enSlug = match ? decodeURIComponent(match[1]) : "";
          const englishContent = getEnglishContentByEnSlug(enSlug);
          return englishContent ? getPublicDestinationDetail(englishContent.frId) : undefined;
        })()
      : getPublicDestinationDetail(path.replace(/^\/(?:procedures|destinations)\//, ""))
    : undefined;
  const englishContentForPath = isEnPath && procedureDetail
    ? getEnglishContentByFrId(procedureDetail.procedure.id)
    : undefined;
  // Le nom anglais doit alimenter la FAQ en_US pour eviter qu'un nom de pays
  // francais (ex: "Allemagne") n'apparaisse dans un texte anglais.
  const faqProcedureInput = procedureDetail
    ? isEnPath && englishContentForPath
      ? { name: englishContentForPath.name, visaType: procedureDetail.procedure.visaType }
      : procedureDetail.procedure
    : undefined;
  const evisaPage = evisaMetaForPath(path);
  const meta = PUBLIC_PAGES[path] ?? procedurePage ?? evisaPage ?? blogArticle;
  const isStudyArticle = Boolean(studyArticle);
  const socialType = isStudyArticle ? "article" : "website";
  const privatePath = /^\/(admin|mon-espace|mon-dossier|confirm-email|verify-email-link|verify-email|verify-email-sent|verify-application-email|confirm-email-change|employeurs|login|panier|document-upload|mes-vols-favoris|flights|payment\/[^/]+|flight-booking\/[^/]+)(?:\/|$)/.test(path);
  const unknown = !meta && !privatePath;
  const current: PublicMeta = meta ?? {
    title: unknown ? `Page introuvable | ${SITE}` : SITE,
    description: unknown ? "La page demandée n’est pas disponible." : "Espace réservé, non indexé.",
    heading: unknown ? "Page introuvable" : "Espace réservé",
    lead: unknown ? "Vérifiez l’adresse ou revenez à l’accueil." : "Cette page nécessite une authentification et ne doit pas être indexée.",
    noindex: privatePath || unknown,
  };
  const canonical = `${ORIGIN}${path}`;
  // Le chemin vient de l’URL demandée : le JSON-LD l’échappe déjà, pas les attributs HTML.
  const canonicalAttr = esc(canonical);
  const socialImage = socialImageFor(current.title, path);
  const robot = current.noindex ? `<meta name="robots" content="noindex,follow" />` : `<meta name="robots" content="index,follow" />`;
  const breadcrumb = path !== "/" && !current.noindex ? {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: ORIGIN },
      { "@type": "ListItem", position: 2, name: current.heading, item: canonical },
    ],
  } : null;
  const article = (path === "/blog" || path.startsWith("/blog/")) && !current.noindex ? {
    "@type": "BlogPosting",
    headline: current.title,
    description: current.description,
    mainEntityOfPage: canonical,
    image: socialImage,
    author: { "@type": "Organization", name: "3M Travel & Services", url: ORIGIN },
    publisher: { "@type": "Organization", name: "3M Travel & Services", url: ORIGIN, logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 } },
    inLanguage: isEnPath ? "en" : "fr-FR",
  } : null;
  const structuredData = path === "/" || path === "/en"
    ? { "@context": "https://schema.org", "@graph": [
        { "@type": "Organization", "@id": `${ORIGIN}/#organization`, name: "3M Travel & Services", alternateName: "3M Travel Agency", url: ORIGIN, logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 }, image: LOGO_URL, description: current.description, identifier: ["RC/YAO/2019/A/2567", "M112417203369H"], sameAs: ["https://www.facebook.com/3mtravelcm"] },
        { "@type": "WebSite", "@id": `${ORIGIN}/#website`, name: "3M Travel & Services", alternateName: "3M Travel Agency", url: ORIGIN, description: current.description, publisher: { "@id": `${ORIGIN}/#organization` }, inLanguage: isEnPath ? "en" : "fr-FR" },
      ] }
    : path === "/procedures"
      ? { "@context": "https://schema.org", "@graph": [
          { "@type": "FAQPage", mainEntity: PUBLIC_FAQ_ITEMS.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
          breadcrumb,
        ] }
      : procedurePage && procedureDetail && faqProcedureInput
        ? { "@context": "https://schema.org", "@graph": [
            { "@type": "FAQPage", mainEntity: getProcedureFaqItems(faqProcedureInput, isEnPath ? "en" : "fr").map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
            LOCAL_BUSINESS_STRUCTURED_DATA,
            breadcrumb,
          ] }
        : article
          ? { "@context": "https://schema.org", "@graph": [article, breadcrumb] }
          : breadcrumb;
  const structuredDataTag = structuredData ? `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script>` : "";
  const hreflangAlternatePath = HREFLANG_PAIRS[path];
  const hreflangTags = hreflangAlternatePath ? [
    `<link rel="alternate" hreflang="${isEnPath ? "en" : "fr"}" href="${canonical}" />`,
    `<link rel="alternate" hreflang="${isEnPath ? "fr" : "en"}" href="${ORIGIN}${hreflangAlternatePath}" />`,
    `<link rel="alternate" hreflang="x-default" href="${ORIGIN}${isEnPath ? hreflangAlternatePath : path}" />`,
  ] : [];
  const head = [
    `<title>${esc(current.title)}</title>`,
    `<meta name="description" content="${esc(current.description)}" />`,
    ...(current.keywords?.length ? [`<meta name="keywords" content="${esc(current.keywords.join(", "))}" />`] : []),
    robot,
    `<link rel="canonical" href="${canonicalAttr}" />`,
    ...hreflangTags,
    `<meta property="og:type" content="${socialType}" />`,
    `<meta property="og:locale" content="${isEnPath ? "en_US" : "fr_FR"}" />`,
    `<meta property="og:site_name" content="${SITE}" />`,
    `<meta property="og:title" content="${esc(current.title)}" />`,
    `<meta property="og:description" content="${esc(current.description)}" />`,
    `<meta property="og:url" content="${canonicalAttr}" />`,
    `<meta property="og:image" content="${socialImage}" />`,
    `<meta property="og:image:alt" content="${SOCIAL_IMAGE_ALT}" />`,
    `<meta property="og:image:type" content="image/png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    ...(isStudyArticle ? [`<meta property="article:publisher" content="${esc(COMPANY_PROFILE.website)}" />`] : []),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(current.title)}" />`,
    `<meta name="twitter:description" content="${esc(current.description)}" />`,
    `<meta name="twitter:url" content="${canonicalAttr}" />`,
    `<meta name="twitter:image" content="${socialImage}" />`,
    `<meta name="twitter:image:alt" content="${SOCIAL_IMAGE_ALT}" />`,
    structuredDataTag,
  ].join("\n");
  const canadaFallback = path === "/canada" ? `<section aria-label="Parcours Canada"><h2>Préparer votre parcours Canada</h2><p>Accédez à l’évaluation protégée, consultez les ressources IRCC et contactez l’agence pour clarifier votre projet.</p><p><a href="/?project=travail&amp;destination=canada#evaluation-multi">Créer un compte pour évaluer mon profil Canada</a> · <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada.html" rel="noreferrer">Consulter les programmes IRCC</a> · <a href="/contact">Contacter 3M Travel</a></p></section>` : "";
  const procedureFallback = procedurePage && procedureDetail ? (() => {
    const { procedure, sources, consular } = procedureDetail;

    if (isEnPath && englishContentForPath) {
      const steps = englishContentForPath.steps.map((step) => `<li>${esc(step)}</li>`).join("");
      const documents = englishContentForPath.requiredDocuments.map((category) => `<li><strong>${esc(category.category)}:</strong> ${category.documents.map(esc).join(", ")}</li>`).join("");
      const officialPortalEn = consular.officialPortalUrl && consular.verificationStatus === "verifie"
        ? `<p><a href="${esc(consular.officialPortalUrl)}" target="_blank" rel="noopener noreferrer">${esc(consular.officialPortalLabel || "Visit the official portal")}</a></p>`
        : `<p>The associated official portal is currently being verified. Do not send any payment or document to a third party without prior verification.</p>`;
      const faqSectionEn = `<section aria-labelledby="seo-procedure-faq"><h2 id="seo-procedure-faq">Frequently asked questions</h2><dl>${getProcedureFaqItems({ name: englishContentForPath.name, visaType: procedure.visaType }, "en").map((item) => `<div><dt>${esc(item.question)}</dt><dd>${esc(item.answer)}</dd></div>`).join("")}</dl></section>`;
      const projectQueryEn = procedure.visaType === "etudes" ? "etudes" : procedure.visaType === "visiteur" ? "tourisme" : "travail";
      return `<section aria-label="Procedure details"><h2>${esc(englishContentForPath.name)} procedure — preparing your file</h2><p>${esc(englishContentForPath.detailedDescription)}</p><h2>Preparation steps</h2><ol>${steps}</ol><h2>Documents to prepare</h2><ul>${documents}</ul>${officialPortalEn}${faqSectionEn}<p>Legal identification: ${LEGAL}</p><p>Applicable requirements, timelines and decisions belong to the competent authorities and partners; they must be confirmed before any step.</p><p><a href="/?project=${projectQueryEn}&amp;destination=${encodeURIComponent(procedure.id)}#evaluation-multi">Start the guided evaluation</a> · <a href="/en">Back to the English overview</a> · <a href="/contact">Contact 3M Travel</a></p></section>`;
    }

    const institutionalSource = getInstitutionalProcedureSource(procedure.id);
    const projectQuery = procedure.visaType === "etudes" ? "etudes" : procedure.visaType === "visiteur" ? "tourisme" : "travail";
    const steps = procedure.steps.map((step) => `<li>${esc(step)}</li>`).join("");
    const documents = procedure.requiredDocuments.map((category) => `<li><strong>${esc(category.category)} :</strong> ${category.documents.map(esc).join(", ")}</li>`).join("");
    const guides = sources.map((source) => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></li>`).join("");
    const primaryGuide = procedure.pdfUrl && !sources.some((source) => source.url === procedure.pdfUrl)
      ? `<li><a href="${esc(procedure.pdfUrl)}" target="_blank" rel="noopener noreferrer">Guide de préparation associé</a></li>`
      : "";
    const officialPortal = consular.officialPortalUrl && consular.verificationStatus === "verifie"
      ? `<p><a href="${esc(consular.officialPortalUrl)}" target="_blank" rel="noopener noreferrer">${esc(consular.officialPortalLabel || "Consulter le portail institutionnel")}</a></p>`
      : `<p>Le portail institutionnel associé est en cours de vérification. Ne transmettez aucun paiement ou document à un tiers sans contrôle préalable.</p>`;
    const institutionalSection = institutionalSource ? `<h2>Repères institutionnels</h2>${institutionalSource.preparationPoints.length ? `<ul>${institutionalSource.preparationPoints.map((point) => `<li>${esc(point)}</li>`).join("")}</ul>` : ""}<p>${esc(institutionalSource.caveat)}</p><p><a href="${esc(institutionalSource.officialUrl)}" target="_blank" rel="noopener noreferrer">${esc(institutionalSource.sourceTitle)}</a> · Dernière vérification de la source : ${esc(institutionalSource.consultedOn)}.</p>` : "";
    const faqSection = `<section aria-labelledby="seo-procedure-faq"><h2 id="seo-procedure-faq">Questions fréquentes</h2><dl>${getProcedureFaqItems(procedure).map((item) => `<div><dt>${esc(item.question)}</dt><dd>${esc(item.answer)}</dd></div>`).join("")}</dl></section>`;
    return `<section aria-label="Détails de la procédure"><h2>Procédure ${esc(procedure.name)} — préparer votre dossier</h2><p>${esc(procedure.detailedDescription)}</p><h2>Étapes de préparation</h2><ol>${steps}</ol><h2>Documents à préparer</h2><ul>${documents}</ul>${institutionalSection}<h2>Guides et sources associés</h2>${guides || primaryGuide ? `<ul>${primaryGuide}${guides}</ul>` : "<p>Le guide détaillé est en cours de consolidation ; consultez le portail institutionnel lorsqu’il est vérifié.</p>"}${officialPortal}${faqSection}<p>Identification légale : ${LEGAL}</p><p>Les exigences applicables, les délais et les décisions relèvent des autorités et partenaires compétents ; ils sont à confirmer avant toute démarche.</p><p><a href="/?project=${projectQuery}&amp;destination=${encodeURIComponent(procedure.id)}#evaluation-multi">Commencer l’évaluation protégée</a> · <a href="/procedures">Retourner à l’annuaire</a> · <a href="/contact">Contacter 3M Travel</a></p></section>`;
  })() : "";
  const procedureFaqFallback = path === "/procedures" ? `<section aria-labelledby="seo-procedures-faq"><h2 id="seo-procedures-faq">Questions fréquentes</h2><dl>${PUBLIC_FAQ_ITEMS.map((item) => `<div><dt>${esc(item.question)}</dt><dd>${esc(item.answer)}</dd></div>`).join("")}</dl></section><p>Identification légale : ${LEGAL}</p>` : "";
  const routeContent = routeSpecificPrerender(path);
  const transparencySection = isEnPath
    ? `<section aria-label="Transparency notes"><h2>Verifiable information before any step</h2><ul><li>Required documents and information are confirmed based on destination and procedure.</li><li>Decisions by employers, partner agencies and competent authorities are not guaranteed by 3M Travel &amp; Services.</li><li>Sensitive actions are controlled by an authorized person.</li></ul></section>`
    : `<section aria-label="Repères de transparence"><h2>Informations vérifiables avant toute démarche</h2><ul><li>Les documents et informations à fournir sont confirmés selon la destination et la procédure.</li><li>Les décisions d’employeurs, d’agences partenaires et d’autorités compétentes ne sont pas garanties par 3M Travel &amp; Services.</li><li>Les actions sensibles sont contrôlées par une personne habilitée.</li></ul></section>`;
  const body = `<main class="seo-prerender" data-prerendered="true"><h1>${esc(current.heading)}</h1><p>${esc(current.lead)}</p>${routeContent}${canadaFallback}${procedureFallback}${procedureFaqFallback}${transparencySection}</main>`;
  let html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/i, "")
    .replace(/<meta\s+name="keywords"[^>]*>\s*/i, "")
    .replace(/<meta\s+name="robots"[^>]*>\s*/i, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/i, "")
    .replace(/<meta\s+property="og:[^"]+"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="twitter:[^"]+"[^>]*>\s*/gi, "");
  html = html.replace("</head>", () => `${head}\n</head>`);
  html = html.replace("<!--prerender-app-->", () => body);
  return { html, status: unknown ? 404 : 200, noindex: Boolean(current.noindex) };
}
