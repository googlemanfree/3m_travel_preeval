import { OFFICIAL_SITE_ORIGIN } from "./canonicalDomain";
import { PUBLIC_FAQ_ITEMS } from "@shared/publicFaq";
import { getProcedureDisplayTitle, getProcedureFaqItems } from "@shared/procedureSeo";
import { getPublicDestinationDetail, PUBLIC_DESTINATION_DETAILS } from "../client/src/lib/publicDestinationCatalog";
import { getInstitutionalProcedureSource } from "../client/src/data/institutionalProcedureSources";
import {
  BRAND_PUBLIC_NAME,
  COMPANY_FOUNDER,
  COMPANY_PROFILE,
  GROUP_LEGAL_NAME,
} from "../client/src/lib/companyContacts";
import { OFFICIAL_CONSULAR_PORTALS } from "../client/src/data/officialConsularPortals";
import { evisasDatabaseComplete } from "../client/src/data/evisasDatabaseComplete";
import { getStudyDestinationArticle, studyDestinationArticles } from "../client/src/data/studyDestinationArticles";
import { getEnglishContentByEnSlug, getEnglishContentByFrId, type ProcedureEnglishContent } from "../client/src/data/procedures107English";
import { getCataloguedDestinationImage } from "../client/src/data/premiumVisuals";
import { getServiceVisual } from "../client/src/data/premiumVisuals";
import {
  countryResourceLead,
  getCountryResourcePage,
  listCountryResourcePages,
  primaryEvalProjectForPage,
} from "@shared/countryResourceCatalog";
import { normalizePublicEvaluationProject } from "@shared/evaluationFormRequirements";

const LOCAL_BUSINESS_STRUCTURED_DATA = {
  "@type": "LocalBusiness",
  "@id": `${OFFICIAL_SITE_ORIGIN}/#localbusiness`,
  name: COMPANY_PROFILE.legalName,
  legalName: GROUP_LEGAL_NAME,
  alternateName: [BRAND_PUBLIC_NAME, GROUP_LEGAL_NAME],
  url: COMPANY_PROFILE.website,
  email: COMPANY_PROFILE.publicEmail,
  founder: {
    "@type": "Person",
    "@id": `${OFFICIAL_SITE_ORIGIN}/about#aureol-donfack`,
    name: COMPANY_FOUNDER.name,
    jobTitle: `${COMPANY_FOUNDER.jobTitle} — ${GROUP_LEGAL_NAME}`,
  },
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
const SITE = BRAND_PUBLIC_NAME;
const LEGAL = "RC/YAO/2019/A/2567 · NIU M112417203369H";
const SOCIAL_IMAGE_ALT = `Aperçu ${BRAND_PUBLIC_NAME}`;
/** Titre et description de l'accueil, fixés par l'agence ; le titre dépasse volontairement les 60 caractères usuels. */
const HOME_TITLE = `${BRAND_PUBLIC_NAME} | Voyages, Visas, Études & Mobilité Internationale`;
const HOME_DESCRIPTION = `${BRAND_PUBLIC_NAME} accompagne candidats africains : visas, études, voyages et suivi à distance — bureaux Yaoundé et Ottawa.`;
/** Logo stable (image carrée du site) : le logo des données structurées ne doit pas être l'image de partage, qui change à chaque page. */
const LOGO_URL = `${OFFICIAL_SITE_ORIGIN}/icon-512.png`;
/** Portrait SEO du fondateur — Meta / Google doivent identifier Aureol DONFACK ↔ 3M Group SARL. */
const FOUNDER = {
  name: COMPANY_FOUNDER.name,
  givenName: COMPANY_FOUNDER.givenName,
  familyName: COMPANY_FOUNDER.familyName,
  jobTitle: `${COMPANY_FOUNDER.jobTitle} — ${GROUP_LEGAL_NAME}`,
  organization: GROUP_LEGAL_NAME,
  brand: BRAND_PUBLIC_NAME,
  legalOperatingName: COMPANY_PROFILE.legalName,
  imageHd: `${ORIGIN}${COMPANY_FOUNDER.imageHd}`,
  imageJpg: `${ORIGIN}${COMPANY_FOUNDER.imageJpg}`,
  imageWebp: `${ORIGIN}${COMPANY_FOUNDER.imageWebp}`,
  imageSquare: `${ORIGIN}${COMPANY_FOUNDER.imageSquare}`,
  imageAlt: COMPANY_FOUNDER.imageAlt,
  aboutUrl: `${ORIGIN}${COMPANY_FOUNDER.aboutPath}`,
  description: COMPANY_FOUNDER.description,
} as const;

const ORGANIZATION_ALTERNATE_NAMES = [
  GROUP_LEGAL_NAME,
  COMPANY_PROFILE.legalName,
  BRAND_PUBLIC_NAME,
] as const;
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
  const fullTitle = `${displayTitle} | ${SITE}`;
  const fullDescription = `Étapes, documents et ressources de préparation pour votre projet ${projectLabel} vers ${procedure.name}, avec accompagnement à distance 3M TRAVEL AGENCY — à vérifier auprès des autorités compétentes.`;
  return {
    title: fullTitle.length <= 65 ? fullTitle : `${displayTitle} | ${SITE}`,
    description: fullDescription.length <= 175 ? fullDescription : `Étapes et documents pour votre projet ${projectLabel} vers ${procedure.name}, accompagnement à distance ; à vérifier auprès des autorités.`,
    heading: displayTitle,
    lead: `Consultez les étapes de préparation, les documents à prévoir et les ressources associées à votre projet ${projectLabel} vers ${procedure.name}, avec un accompagnement 3M TRAVEL AGENCY à distance.`,
    keywords: [`visa ${procedure.name}`, `${projectLabel} ${procedure.name}`, `procédure ${procedure.name}`, projectLabel, "mobilité internationale", "Afrique", "3M TRAVEL AGENCY"],
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
    title: `${displayTitle} | ${SITE}`,
    description: `Steps, documents and preparation resources for your ${projectLabelEn} project to ${englishContent.name}, with remote support from 3M TRAVEL AGENCY — verify with the competent authorities.`,
    heading: displayTitle,
    lead: `Review the preparation steps, documents to gather, and related resources for your ${projectLabelEn} project to ${englishContent.name}, with remote support from 3M TRAVEL AGENCY.`,
    keywords: [`${englishContent.name} visa`, `${projectLabelEn} visa ${englishContent.name}`, `${englishContent.name} procedure`, projectLabelEn, "international mobility", "Africa", "3M TRAVEL AGENCY"],
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
    title: fitTitle([`${destination.country} e‑Visa | ${SITE}`, `${destination.country} e‑Visa | 3M TRAVEL AGENCY`]),
    description: `Repères e‑Visa pour ${destination.country} : type, documents, délais et portail officiel à vérifier avant toute démarche.`,
    keywords: [`e‑Visa ${destination.country}`, `visa ${destination.country}`, "e‑Visa Cameroun", "3M TRAVEL AGENCY"],
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
    title: `3M TRAVEL AGENCY | International Mobility from Africa`,
    description: "3M TRAVEL AGENCY supports African candidates’ international mobility — visas, study abroad and travel — with remote follow-up and offices in Yaoundé and Ottawa.",
    keywords: ["visa Africa", "Canada work visa", "study in France", "international mobility", "remote support", "3M TRAVEL AGENCY"],
    heading: "Your international mobility project, prepared with method",
    lead: "3M TRAVEL AGENCY supports candidates across Africa with remote follow-up. Decisions by authorities, employers and external partners remain independent of the agency.",
  },
  "/": { title: HOME_TITLE, description: HOME_DESCRIPTION, keywords: ["voyages", "visas", "études à l'étranger", "mobilité internationale", "Afrique", "suivi à distance", "3M TRAVEL AGENCY"], heading: "3M TRAVEL AGENCY : de l’Afrique vers le monde — visas, études et mobilité internationale", lead: "Évaluation gratuite, accompagnement à distance pour candidats africains, bureaux Yaoundé et Ottawa, joignable par WhatsApp — agence enregistrée depuis 2019." },
  "/canada": { title: `Visa et immigration Canada | ${SITE}`, description: "Préparez votre projet Canada avec des informations officielles et un accompagnement administratif documenté, sans promesse de résultat.", keywords: ["visa Canada", "immigration Canada", "permis de travail", "études au Canada", "3M TRAVEL AGENCY"], heading: "Démarches Canada", lead: "Préparez votre projet avec des informations vérifiables, sans promesse d’admission, d’emploi ou de résidence." },
  "/canada/crs": { title: `Calculatrice CRS Canada | ${SITE}`, description: "Calculez votre score indicatif du Système de classement global pour Entrée express, avec les quatre compétences linguistiques et les repères officiels IRCC.", keywords: ["calculatrice CRS", "score CRS Canada", "Entrée express", "CLB", "NCLC", "IRCC"], heading: "Calculatrice CRS Canada", lead: "Saisissez votre profil et vos résultats linguistiques pour obtenir une estimation indicative du score CRS. Le résultat officiel dépend d’IRCC et de votre profil Entrée express." },
  "/schengen": { title: `Espace Schengen | ${SITE}`, description: "Repères administratifs pour les projets de visa et de mobilité vers l’espace Schengen.", heading: "Démarches Schengen", lead: "Les exigences varient selon le pays et la situation individuelle ; les liens institutionnels sont prioritaires." },
  "/hotels": { title: `Hôtels et séjours | ${SITE}`, description: "Ancien accès aux services hôteliers de 3M TRAVEL AGENCY, redirigé vers le parcours tourisme.", heading: "Hôtels et séjours", lead: "Redirection vers le parcours tourisme de 3M TRAVEL AGENCY.", noindex: true },
  "/visa-etudes": { title: `Études à l’international | ${SITE}`, description: "Ancien accès au parcours études, redirigé vers la page canonique des études.", heading: "Études à l’international", lead: "Redirection vers le parcours études de 3M TRAVEL AGENCY.", noindex: true },
  "/etudes": { title: `Visa études à l’international | ${SITE}`, description: "Accompagnement documenté pour les projets d’études à l’international et les dossiers associés.", heading: "Projet d’études à l’international", lead: "L’admission et les décisions consulaires relèvent exclusivement des établissements et autorités compétents." },
  "/visa-travail": { title: `Travail à l’international | ${SITE}`, description: "Ancien accès au parcours travail, redirigé vers la page canonique du visa travail.", heading: "Travail à l’international", lead: "Redirection vers le parcours travail de 3M TRAVEL AGENCY.", noindex: true },
  "/travail": { title: `Visa travail & mobilité professionnelle | ${SITE}`, description: "Corridor Afrique → Canada, Europe et Golfe : évaluation, dossier employeur et préparation des autorisations de travail.", heading: "Projet travail à l’international", lead: "L’emploi et les décisions de visa relèvent exclusivement des employeurs et autorités compétents." },
  "/ambassador-program": { title: `Programme Ambassadeur | ${SITE}`, description: "Rejoignez le programme Ambassadeur de 3M TRAVEL AGENCY, partagez des liens de parrainage et suivez les dossiers éligibles depuis Yaoundé.", keywords: ["programme ambassadeur", "parrainage visa", "3M TRAVEL AGENCY", "commission parrainage"], heading: "Programme Ambassadeur 3M TRAVEL AGENCY", lead: "Présentez nos services à votre réseau avec un code de parrainage traçable ; les commissions dépendent des dossiers et paiements effectivement confirmés." },
  "/tourisme": { title: `Tourisme, hôtels et séjours | ${SITE}`, description: "Préparez un séjour avec des repères de destination, des hébergements et une demande de devis accompagnée.", heading: "Tourisme et séjours sur mesure", lead: "Les disponibilités, fournisseurs et tarifs sont confirmés par l’agence avant toute réservation." },
  "/assurance": { title: `Assurance voyage | ${SITE}`, description: "Préparez une demande d’assurance voyage avec un circuit administratif documenté et une validation humaine.", heading: "Assurance voyage", lead: "La couverture, les garanties et le tarif final dépendent du fournisseur et des informations validées." },
  "/traduction/order": { title: `Traduction certifiée | ${SITE}`, description: "Déposez une demande de traduction certifiée avec un parcours documentaire sécurisé.", heading: "Demande de traduction certifiée", lead: "Le délai, le prix et la recevabilité dépendent du document, des langues et du traducteur compétent." },
  "/cni-passeport": { title: `CNI et passeport | ${SITE}`, description: "Demande, renouvellement, perte ou vol de carte nationale d’identité ou de passeport : préparation du dossier et suivi avec 3M TRAVEL AGENCY à Yaoundé.", heading: "CNI et passeport", lead: "Les frais officiels, les délais et la décision de délivrance relèvent de l’administration ; 3M prépare et suit votre dossier sans garantir de résultat." },
  "/paiement": { title: `Moyens de paiement | ${SITE}`, description: "Carte, Mobile Money, virement bancaire, dépôt sur le numéro de l’agence ou paiement en agence à Yaoundé : tous les moyens de règlement de 3M TRAVEL AGENCY.", heading: "Moyens de paiement", lead: "Payez en ligne dès que la passerelle est activée, ou par virement, dépôt Mobile Money ou en agence. Un paiement n’est pris en compte qu’après confirmation de réception par l’agence ; vérifiez toujours les coordonnées sur cette page." },
  "/services": { title: `Tous nos services | ${SITE}`, description: "Études, travail, immigration, visas, billets, assurance, CNI, passeport et e-Visa : les services internationaux de 3M TRAVEL AGENCY depuis Yaoundé et Ottawa.", heading: "Tous les services de 3M TRAVEL AGENCY", lead: "Mobilité internationale, travel et démarches administratives : un interlocuteur structure votre dossier. Les décisions appartiennent aux autorités et prestataires ; 3M prépare et suit sans garantir de résultat." },
  "/formation": { title: `Nos formations | ${SITE}`, description: "Découvrez les programmes de formation et d’orientation proposés par 3M TRAVEL AGENCY.", heading: "Formation et orientation", lead: "Les contenus sont présentés à titre d’information ; chaque inscription est confirmée selon les conditions applicables." },
  "/blog": { title: `Ressources mobilité internationale | ${SITE}`, description: "Guides et articles pratiques sur les démarches de mobilité internationale.", heading: "Ressources et guides", lead: "Consultez nos contenus de préparation et complétez-les avec les sources officielles de votre destination." },
  "/procedures": { title: `Procédures de mobilité | ${SITE}`, description: "Annuaire des procédures de mobilité : étapes, documents et repères par destination. Évaluation gratuite sans compte pour démarrer ; compte ensuite pour le suivi du dossier.", keywords: ["procédures visa", "documents visa", "mobilité internationale", "dossier immigration", "évaluation sans compte", "3M TRAVEL AGENCY"], heading: "Procédures par destination", lead: "Chaque procédure est adaptée à la destination. Démarrez l’évaluation gratuite sans compte ; créez un compte pour enregistrer le dossier et suivre les pièces." },
  "/evisas": { title: `Services e-Visa | ${SITE}`, description: "Préparation et suivi des demandes d’e-Visa avec circuit documentaire sécurisé.", heading: "Services e-Visa", lead: "La décision de délivrance relève de l’autorité compétente ; les documents sont traités avec traçabilité." },
  "/tarifs": { title: `Tarifs et honoraires | ${SITE}`, description: "Honoraires indicatifs, étapes de paiement, et résumé public d’annulation/remboursement avant engagement (protocole signé).", heading: "Tarifs et transparence", lead: "Les frais externes et décisions partenaires sont présentés avant engagement lorsqu’ils sont connus. Résumé public des cas d’annulation et de remboursement ci-dessous, avant tout paiement." },
  "/avis": { title: `Avis et retours | ${SITE}`, description: "Retours publiés après modération et informations de transparence de 3M TRAVEL AGENCY.", heading: "Avis et transparence", lead: "Les retours sont traités avec modération ; aucun résultat individuel n’est garanti." },
  "/contact": { title: `Contactez-nous | ${SITE}`, description: "Contact 3M TRAVEL AGENCY : WhatsApp Yaoundé +237 698 104 832 (canal principal), fixe +237 620 996 045 (appels), Ottawa sur rendez-vous.", keywords: ["contact 3M TRAVEL AGENCY", "agence visa Yaoundé", "WhatsApp Yaoundé", "agence voyage Cameroun", "Ottawa"], heading: "Contacter 3M TRAVEL AGENCY", lead: "Canal principal Yaoundé : WhatsApp +237 698 104 832 (messages, dossiers). Fixe +237 620 996 045 pour les appels vocaux uniquement. Ottawa : WhatsApp secondaire sur rendez-vous." },
  "/consultation": { title: `Prendre rendez-vous | ${SITE}`, description: "Demandez une consultation avec un conseiller 3M TRAVEL AGENCY : indiquez votre projet et votre pays cible, l’équipe vous recontacte sous 24 à 48 h ouvrées.", keywords: ["rendez-vous conseiller", "consultation visa", "consultation immigration", "agence visa Yaoundé", "3M TRAVEL AGENCY"], heading: "Prendre rendez-vous avec un conseiller", lead: "Indiquez votre projet et votre pays de destination ; un conseiller vous recontacte pour cadrer votre démarche, sans engagement ni promesse de résultat." },
  "/about": {
    title: `Aureol DONFACK, fondateur PDG 3M Group SARL | ${SITE}`,
    description:
      "Aureol DONFACK, fondateur et PDG de 3M Group SARL (3M TRAVEL AGENCY) : direction de l’agence, engagements de transparence et accompagnement mobilité internationale à Yaoundé.",
    keywords: [
      "Aureol DONFACK",
      "Aureol DONFACK fondateur",
      "fondateur 3M Group SARL",
      "PDG 3M Group SARL",
      "3M Group SARL",
      "3M TRAVEL AGENCY",
      "agence voyage Yaoundé",
    ],
    heading: "Aureol DONFACK, fondateur et PDG de 3M Group SARL",
    lead: "Aureol DONFACK dirige 3M Group SARL et 3M TRAVEL AGENCY. Notre rôle est d’accompagner la préparation administrative des projets de mobilité internationale ; les décisions externes restent indépendantes.",
  },
  "/politique-confidentialite": {
    title: `Politique de confidentialité | ${SITE}`,
    description: "Politique complète 3M TRAVEL AGENCY : qui consulte vos documents (vous et l’équipe affectée), données collectées, finalités, conservation jusqu’à 5 ans après clôture, sécurité SSL, cookies techniques et droits d’accès ou de suppression.",
    heading: "Confidentialité et données",
    lead: "Politique complète : vos documents ne sont pas publics — consultation limitée à votre compte (Mon espace) et à l’équipe 3M affectée ; conservation pendant le traitement puis archivage jusqu’à 5 ans après clôture ; données d’identité, coordonnées et pièces d’immigration utilisées uniquement pour l’évaluation et le suivi ; droits d’accès, rectification et suppression via hello@3mtravelagency.com. Le détail des sections suit ci-dessous.",
  },
  "/conditions-utilisation": { title: `Conditions d’utilisation | ${SITE}`, description: "Conditions d’utilisation des services et informations de responsabilité.", heading: "Conditions d’utilisation", lead: "Les services d’accompagnement ne remplacent ni les autorités compétentes ni les décisions de partenaires externes." },
  "/accessibilite": { title: `Accessibilité | ${SITE}`, description: "Engagements et informations d’accessibilité du site 3M TRAVEL AGENCY : ce qui est déjà en place et comment signaler une difficulté.", heading: "Accessibilité", lead: "Nous cherchons à rendre le site utilisable par le plus grand nombre ; signalez-nous toute difficulté rencontrée." },
  "/ressources": { title: `Bibliothèque de ressources | ${SITE}`, description: "Guides PDF par pays pour le travail, les études et la visite — pages destinations premium et fiches 3M TRAVEL AGENCY.", heading: "Guides par destination", lead: "Choisissez un pays pour consulter tous les guides PDF associés, avec images premium et renvoi vers les sources officielles." },
  "/guide-procedures": { title: `Guide des procédures | ${SITE}`, description: "Bibliothèque PDF des procédures 3M TRAVEL AGENCY : travail, études, visiteur, avec renvoi vers les portails officiels (IRCC, ADEM, France-Visas…).", heading: "Bibliothèque PDF des procédures de mobilité", lead: "Chaque guide publié est rattaché à sa fiche procédure et aux sources officielles à vérifier avant toute démarche." },
  "/3m-solutions": { title: "3M Solutions | 3M TRAVEL AGENCY", description: "Services numériques et accompagnement documentaire de 3M TRAVEL AGENCY : web, formation, réseaux et sécurité.", heading: "3M Solutions", lead: "Découvrez les services numériques et soumettez une demande détaillée à l’équipe." },
  "/partenaires": { title: `Partenaires B2B internationaux | ${SITE}`, description: "Corridor de talents Afrique → Europe, Amériques et Asie : espace candidat, back-office 3M, agences de placement et employeurs. Profils anonymisés, vérification humaine.", keywords: ["partenaires B2B", "agences de placement", "employeurs internationaux", "mobilité Afrique", "3M TRAVEL AGENCY"], heading: "Corridor de talents international", lead: "Quatre interfaces pour recruteurs et candidats. 3M TRAVEL AGENCY gère la procédure administrative après sélection, contrat et lettre d’invitation." },
  "/agences-placement": { title: `Agences de placement | ${SITE}`, description: "Portail B2B pour agences de placement partenaires : candidats éligibles, profils anonymisés, accès après vérification humaine.", keywords: ["agences de placement", "partenaires recrutement", "candidats éligibles", "3M TRAVEL AGENCY"], heading: "Espace agences de placement", lead: "Demandez un accès vérifié pour sélectionner des candidats éligibles issus de l’évaluation 3M." },
  "/employeurs": { title: `Employeurs internationaux | ${SITE}`, description: "Portail B2B pour employeurs en Europe, Amériques et Asie : identification à l’inscription, profils anonymisés, consentement candidat, suivi 3M après sélection.", keywords: ["employeurs internationaux", "recrutement mobilité", "profils anonymisés", "3M TRAVEL AGENCY"], heading: "Espace employeurs internationaux", lead: "Identifiez votre organisation, puis connectez-vous après vérification 3M. Aucun accès automatique." },
  "/plan-du-site": { title: `Plan du site | ${SITE}`, description: "Accédez aux principales pages, procédures, ressources et informations de 3M TRAVEL AGENCY.", heading: "Plan du site", lead: "Trouvez rapidement les pages utiles à votre démarche de mobilité internationale." },
  "/sources-officielles": { title: `Sources officielles | ${SITE}`, description: "Liens institutionnels par destination pour préparer une démarche de mobilité internationale.", heading: "Sources officielles par destination", lead: "Les informations institutionnelles constituent la référence pour les exigences, délais et décisions applicables." },
  "/etat-du-service": { title: `État du service | ${SITE}`, description: "Consultez l’état public des services et les informations de maintenance de 3M TRAVEL AGENCY.", heading: "État du service", lead: "Retrouvez ici les informations publiques sur la disponibilité des services et les maintenances annoncées." },
  "/document-upload": { title: `Dépôt de documents | ${SITE}`, description: "Espace sécurisé de dépôt de documents pour les candidats connectés.", heading: "Dépôt de documents", lead: "Connectez-vous pour déposer ou consulter vos documents. Cette page n’est pas indexée.", noindex: true },
  "/suivi-vol": { title: `Suivre ma réservation de vol | ${SITE}`, description: "Suivez votre demande de réservation de vol avec votre référence et votre e-mail, sans compte.", heading: "Suivre ma réservation de vol", lead: "Entrez la référence reçue par e-mail et l’adresse e-mail de votre demande. Cette page n’est pas indexée.", noindex: true },
  "/mes-vols-favoris": { title: `Mes vols favoris | ${SITE}`, description: "Espace privé de gestion des vols favoris.", heading: "Mes vols favoris", lead: "Connectez-vous pour consulter vos itinéraires enregistrés. Cette page n’est pas indexée.", noindex: true },
  "/flights": { title: `Billets d'avion internationaux | ${SITE}`, description: "Billets d'avion internationaux et réservation avec 3M TRAVEL AGENCY. Visas, assurance et hôtels au même endroit. Tarifs confirmés avant paiement.", keywords: ["billets d'avion internationaux", "réservation de vol", "3M TRAVEL AGENCY", "agence de voyage", "mobilité internationale"], heading: "Billets d'avion internationaux avec 3M TRAVEL AGENCY", lead: "Comparez les vols internationaux, réservez avec un conseiller, puis complétez visas, assurance et hébergement. Disponibilités et tarifs confirmés avant toute réservation ou paiement." },
  "/register": { title: `Inscription | ${SITE}`, description: "Création sécurisée d’un espace client 3M TRAVEL AGENCY.", heading: "Créer mon espace client", lead: "Créez votre espace pour suivre vos démarches et communiquer avec l’agence. Cette page n’est pas indexée.", noindex: true },
  "/signup": { title: `Inscription | ${SITE}`, description: "Création sécurisée d’un espace client 3M TRAVEL AGENCY.", heading: "Créer mon espace client", lead: "Créez votre espace pour suivre vos démarches et communiquer avec l’agence. Cette page n’est pas indexée.", noindex: true },
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
  "/parcours": { title: `Comment ça marche | ${SITE}`, description: "Découvrez les étapes du parcours d’accompagnement 3M TRAVEL AGENCY, de l’évaluation initiale à l’obtention de votre visa.", keywords: ["comment ça marche", "parcours visa", "étapes dossier", "accompagnement mobilité", "3M TRAVEL AGENCY"], heading: "Votre parcours d’accompagnement", lead: "De l’évaluation initiale à la constitution du dossier : découvrez comment 3M TRAVEL AGENCY vous accompagne à chaque étape." },
  "/how-it-works": { title: `Comment ça marche : les étapes | ${SITE}`, description: "Parcours 3M TRAVEL AGENCY : évaluation, structuration du dossier, pièces, réseau de partenaires autorisés et suivi dans l’espace client — de Yaoundé et Ottawa vers le monde.", keywords: ["comment ça marche", "étapes du dossier", "processus visa", "mobilité internationale", "3M TRAVEL AGENCY"], heading: "Comment ça marche ?", lead: "Évaluation, dossier documenté, espace client et canaux autorisés — sans promesse de visa, d’emploi ou d’admission." },
  "/fiches": { title: `Fiches pays et démarches | ${SITE}`, description: "Consultez les fiches pratiques par destination pour préparer votre dossier de mobilité internationale.", keywords: ["fiches pays", "fiches visa", "démarches immigration", "destinations mobilité", "3M TRAVEL AGENCY"], heading: "Fiches pratiques par destination", lead: "Retrouvez les informations essentielles pour chaque destination : étapes, documents, contacts consulaires et sources officielles." },
  "/destinations": { title: `Destinations | ${SITE}`, description: "Explorez les destinations de mobilité internationale accompagnées par 3M TRAVEL AGENCY depuis Yaoundé.", keywords: ["destinations visa", "pays immigration", "mobilité internationale", "études travail étranger", "3M TRAVEL AGENCY"], heading: "Destinations de mobilité internationale", lead: "Choisissez votre destination et consultez les procédures, les sources officielles et les repères d’accompagnement disponibles." },
  "/evisa": { title: `Annuaire e-Visa | ${SITE}`, description: "Accédez à l’annuaire complet des procédures e-Visa par destination avec 3M TRAVEL AGENCY.", keywords: ["e-visa", "visa électronique", "demande evisa", "visa en ligne", "3M TRAVEL AGENCY"], heading: "Services e-Visa", lead: "Consultez les procédures e-Visa disponibles, les conditions d’éligibilité et les étapes de demande vérifiées par l’agence." },
  "/conformite-documents": { title: `Conformité de documents | ${SITE}`, description: "Vérifiez la conformité de vos documents avant de constituer votre dossier de mobilité internationale.", keywords: ["conformité documents", "vérification pièces", "contrôle dossier", "documents visa", "3M TRAVEL AGENCY"], heading: "Vérification de la conformité de vos documents", lead: "Assurez-vous que vos pièces sont conformes aux exigences de la destination avant de soumettre votre dossier." },
  // Guides formation et travail qualifié rendus par App.tsx sans fiche procédure équivalente.
  "/procedures/allemagne-formation": { title: `Allemagne : formation et visa | ${SITE}`, description: "Cours de langue intensif ou Ausbildung en Allemagne : conditions, étapes du visa et documents à prévoir, avec un accompagnement depuis Yaoundé.", keywords: ["visa Allemagne", "Ausbildung Allemagne", "cours de langue Allemagne", "formation professionnelle", "3M TRAVEL AGENCY"], heading: "Formation professionnelle en Allemagne", lead: "Repères sur le cours de langue intensif et l’Ausbildung : conditions, étapes du visa et documents à confirmer auprès des autorités compétentes, sans promesse de résultat." },
  "/procedures/autriche-formation": { title: `Autriche : apprentissage et visa | ${SITE}`, description: "Apprentissage (Lehre) et Red-White-Red Card en Autriche : conditions, étapes du visa et documents à prévoir, avec un accompagnement depuis Yaoundé.", keywords: ["visa Autriche", "apprentissage Autriche", "Lehre Autriche", "Red-White-Red Card", "3M TRAVEL AGENCY"], heading: "Apprentissage en Autriche", lead: "Repères sur la Lehre et les dispositifs d’accès des ressortissants de pays tiers ; les conditions applicables sont à confirmer auprès des autorités compétentes." },
  "/procedures/suisse-formation": { title: `Suisse : apprentissage et visa | ${SITE}`, description: "Formation professionnelle initiale en Suisse : conditions d’engagement, étapes du visa et documents à prévoir, avec un accompagnement depuis Yaoundé.", keywords: ["visa Suisse", "apprentissage Suisse", "formation professionnelle Suisse", "permis de travail Suisse", "3M TRAVEL AGENCY"], heading: "Apprentissage en Suisse", lead: "Repères sur la formation professionnelle initiale et l’engagement d’apprentis étrangers ; chaque canton et chaque employeur reste décisionnaire." },
  "/procedures/emirats": { title: `Émirats Arabes Unis : visa de travail | ${SITE}`, description: "Employment Visa ou Golden Visa aux Émirats Arabes Unis : dispositifs, secteurs porteurs et étapes à confirmer, avec un accompagnement depuis Yaoundé.", keywords: ["visa Émirats Arabes Unis", "travail Dubaï", "Employment Visa", "Golden Visa", "3M TRAVEL AGENCY"], heading: "Travailler aux Émirats Arabes Unis", lead: "Repères sur l’Employment Visa et le Golden Visa ; seuils, délais et conditions sont à confirmer auprès des autorités émiraties avant toute démarche." },
  "/procedures/arabie-saoudite": { title: `Arabie Saoudite : visa de travail | ${SITE}`, description: "Visa de travail sponsorisé en Arabie Saoudite : secteurs concernés, étapes et points de vigilance contractuels, avec un accompagnement depuis Yaoundé.", keywords: ["visa Arabie Saoudite", "travail Arabie Saoudite", "visa sponsorisé", "Vision 2030", "3M TRAVEL AGENCY"], heading: "Travailler en Arabie Saoudite", lead: "Repères sur le visa de travail sponsorisé par l’employeur ; vérifiez attentivement les conditions contractuelles avant toute signature." },
  "/procedures/coree-du-sud": { title: `Corée du Sud : visa de travail E-9 | ${SITE}`, description: "Programme EPS et visa E-9 en Corée du Sud : test de coréen, conditions d’accès et étapes à vérifier avant tout engagement, depuis Yaoundé.", keywords: ["visa Corée du Sud", "visa E-9", "programme EPS", "test EPS-TOPIK", "3M TRAVEL AGENCY"], heading: "Travailler en Corée du Sud", lead: "Repères sur le programme EPS et le visa E-9 ; l’éligibilité dépend d’un accord bilatéral à vérifier au cas par cas avant tout engagement." },
  "/procedures/japon": { title: `Japon : stage technique et visa | ${SITE}`, description: "Programme de stagiaires techniques (TITP) et visas de spécialistes au Japon : secteurs, étapes et vigilance sur les organismes agréés.", keywords: ["visa Japon", "stage technique Japon", "TITP", "travail Japon", "3M TRAVEL AGENCY"], heading: "Travailler au Japon", lead: "Repères sur le programme de stagiaires techniques et les visas de spécialistes ; ne traitez qu’avec des organismes agréés et vérifiés." },
  // Parcours personnels, transactionnels ou doublons d’une page de référence : servis en 200 non indexable.
  "/complete-profile": privateShell("Compléter mon profil", "Renseignez les informations manquantes de votre profil pour finaliser votre espace client 3M TRAVEL AGENCY."),
  "/forgot-password": privateShell("Mot de passe oublié", "Demandez un lien sécurisé pour réinitialiser le mot de passe de votre espace client 3M TRAVEL AGENCY."),
  "/reset-password": privateShell("Nouveau mot de passe", "Définissez un nouveau mot de passe grâce au lien sécurisé reçu par e-mail pour retrouver l’accès à votre espace client."),
  "/payment/method-selection": privateShell("Choisir un mode de paiement", "Sélectionnez le mode de règlement d’un dossier 3M TRAVEL AGENCY depuis votre espace client."),
  "/payment/agency-confirmation": privateShell("Paiement en agence", "Confirmation d’une demande de paiement en agence pour un dossier 3M TRAVEL AGENCY."),
  "/payment-success": privateShell("Retour de paiement", "Page de retour après un paiement en ligne ; le statut définitif du règlement est confirmé par l’agence."),
  "/payment/error": privateShell("Paiement non abouti", "Page de retour après un paiement interrompu ou refusé, avec les options pour réessayer ou contacter l’agence."),
  "/payment-failed": privateShell("Paiement non abouti", "Page de retour après un paiement interrompu ou refusé, avec les options pour réessayer ou contacter l’agence."),
  "/dossier-confirmation": privateShell("Confirmation de dossier", "Confirmation de la réception de votre dossier par 3M TRAVEL AGENCY et prochaines étapes."),
  "/open-dossier": privateShell("Ouvrir un dossier", "Ouverture sécurisée d’un dossier depuis votre espace client 3M TRAVEL AGENCY."),
  "/submit-documents": privateShell("Dépôt de vos documents", "Dépôt sécurisé des pièces de votre dossier depuis votre espace client 3M TRAVEL AGENCY."),
  "/evaluation-result": privateShell("Résultat de votre évaluation", "Liste des documents à prévoir issue de votre évaluation préalable, à confirmer avec l’agence."),
  "/evisas/request": privateShell("Demande d’e-Visa", "Formulaire sécurisé de demande d’e-Visa avec validation du dossier par l’équipe 3M TRAVEL AGENCY."),
  "/procedures/comparaison": {
    title: `Comparateur de corridors | ${SITE}`,
    description: "Comparez des corridors Afrique → Canada, Europe et Golfe selon votre profil. Scores indicatifs enregistrés sur votre appareil.",
    keywords: ["comparateur de corridors", "mobilité internationale", "Canada", "Europe", "Golfe"],
    heading: "Comparateur de corridors",
    lead: "Choisissez un pack prêt à comparer ou vos favoris. Les scores restent indicatifs — sans promesse d’admission, d’emploi ou de visa.",
  },
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
    const yaounde = COMPANY_PROFILE.offices.cameroon;
    const ottawa = COMPANY_PROFILE.offices.ottawa;
    const ids = COMPANY_PROFILE.legalIdentifiers;
    return [
      `<section aria-label="Accueil 3M TRAVEL AGENCY"><h2>${esc(BRAND_PUBLIC_NAME)} — de l’Afrique vers le monde</h2><p>Voyages, visas, études et mobilité internationale : évaluation gratuite sans compte pour démarrer, accompagnement documenté, bureaux à Yaoundé et Ottawa. Aucune décision de visa ou d’emploi n’est garantie.</p></section>`,
      `<section aria-label="Preuve d’enregistrement vérifiable"><h2>Identité légale</h2><p><strong>${esc(COMPANY_PROFILE.legalName)}</strong> — ${esc(ids.country)}. Registre : ${esc(ids.registryAuthority)}. N° RC : ${esc(ids.registration)}. NIU : ${esc(ids.taxpayerId)}.</p><p><a href="${esc(ids.registryPortalUrl)}" rel="noopener noreferrer">Portail RCCM Cameroun (OHADA)</a> · <a href="${esc(ids.registrySearchUrl)}" rel="noopener noreferrer">Recherche au registre</a> · <a href="/about">À propos</a></p></section>`,
      `<section aria-label="Services principaux"><h2>Services</h2><ul><li><a href="/?project=travail#evaluation-multi">Évaluation gratuite (sans compte pour démarrer)</a></li><li><a href="/procedures">Procédures et destinations</a></li><li><a href="/travail">Visa travail</a></li><li><a href="/etudes">Visa études</a></li><li><a href="/flights">Vols et réservation</a></li><li><a href="/tarifs">Tarifs et honoraires</a></li><li><a href="/sources-officielles">Sources officielles</a></li><li><a href="/contact">Contact</a></li><li><a href="/about">À propos</a></li><li><a href="/conditions-utilisation">Conditions d’utilisation</a></li><li><a href="/politique-confidentialite">Politique de confidentialité</a></li></ul></section>`,
      `<section aria-label="Destinations prioritaires"><h2>Corridors les plus demandés</h2><ul><li><a href="/canada">Canada</a></li><li><a href="/procedures/france-visiteur">France — visiteur</a></li><li><a href="/procedures/france-etudes">France — études</a></li><li><a href="/procedures/france-travail">France — travail</a></li><li><a href="/procedures/allemagne-travail">Allemagne — travail</a></li><li><a href="/schengen">Espace Schengen</a></li></ul></section>`,
      `<section aria-label="Bureaux"><h2>Bureaux et canaux</h2><p><strong>${esc(yaounde.label)}</strong> — ${yaounde.addressLines.map(esc).join(", ")}. ${esc(COMPANY_PROFILE.contactRoles.yaoundeWhatsapp)} : ${esc(yaounde.whatsappDisplay)}${yaounde.phoneDisplay ? ` · ${esc(COMPANY_PROFILE.contactRoles.yaoundePhone)} : ${esc(yaounde.phoneDisplay)}` : ""}. ${esc(yaounde.openingHours.join(" · "))}</p><p><strong>${esc(ottawa.label)}</strong> — ${ottawa.addressLines.map(esc).join(", ")}. ${esc(COMPANY_PROFILE.contactRoles.ottawaWhatsapp)} : ${esc(ottawa.whatsappDisplay)}. ${esc(ottawa.openingHours.join(" · "))}</p><p>Délai de réponse indicatif : ${esc(COMPANY_PROFILE.responseSla.label)}. ${esc(COMPANY_PROFILE.responseSla.definition)}</p><p><a href="mailto:${esc(COMPANY_PROFILE.publicEmail)}">${esc(COMPANY_PROFILE.publicEmail)}</a> · <a href="/contact">Page contact</a> · <a href="/tarifs">Tarifs</a></p></section>`,
    ].join("");
  }
  if (path === "/en") {
    const links = PUBLIC_DESTINATION_DETAILS
      .map((detail) => getEnglishContentByFrId(detail.procedure.id))
      .filter((entry): entry is ProcedureEnglishContent => Boolean(entry))
      .map((entry) => `<li><a href="/en/procedures/${encodeURIComponent(entry.enSlug)}">${esc(entry.description)}</a></li>`)
      .join("");
    return `<section aria-label="Mobility services"><h2>Prepare your international mobility project</h2><p>Discover our most requested procedures, verified institutional sources, and a free initial evaluation before any step.</p><p><a href="/?project=travail&amp;destination=canada#evaluation-multi">Start the free evaluation</a> · <a href="/en">Explore priority procedures</a> · <a href="/sources-officielles">View official sources</a></p></section><section aria-label="Priority destinations"><h2>Most requested procedures from Yaoundé</h2><ul>${links}</ul></section>`;
  }
  if (path === "/canada/crs") {
    return `<section aria-label="Calculatrice CRS Canada"><h2>Simulateur du Système de classement global</h2><p>Le parcours dédié Canada permet d’examiner l’âge, les études, les langues officielles, l’expérience canadienne, le conjoint, la transférabilité et les points additionnels.</p><p>Les quatre compétences linguistiques — lecture, écriture, écoute et expression orale — doivent être saisies selon le test reconnu par IRCC.</p><p><a href="https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express/verifier-note.html#calculatrice" target="_blank" rel="noopener noreferrer">Comparer avec la calculatrice officielle IRCC</a> · <a href="/evaluation?destination=canada">Faire une évaluation complète du profil</a> · <a href="/canada">Retourner à la page Canada</a></p></section>`;
  }
  if (path === "/travail") {
    return `<section aria-label="Hub visa travail"><h2>Travailler à l’international</h2><p>Corridor Afrique → Canada, Europe et Golfe : évaluation de profil, pièces employeur et préparation des autorisations — sans promesse d’emploi ou de visa.</p><ul><li><a href="/canada">Canada</a></li><li><a href="/procedures/allemagne-travail">Allemagne</a></li><li><a href="/procedures/luxembourg">Luxembourg</a></li><li><a href="/procedures/france-travail">France</a></li><li><a href="/procedures/pays-bas-travail">Pays-Bas</a></li><li><a href="/procedures/australie-travail">Australie</a></li><li><a href="/procedures/qatar-travail">Qatar</a></li><li><a href="/procedures/royaume-uni-travail">Royaume-Uni</a></li></ul><p><a href="/?project=travail#evaluation-multi">Évaluer mon profil travail</a> · <a href="/etudes">Parcours études</a> · <a href="/procedures">Toutes les procédures</a></p></section>`;
  }
  if (path === "/ressources") {
    const countries = listCountryResourcePages()
      .map((page) => `<li><a href="${esc(page.path)}">${esc(page.flag)} ${esc(page.country)} — ${page.resources.length} guide(s)</a></li>`)
      .join("");
    return `<section aria-label="Bibliothèque de ressources par pays"><h2>Guides PDF par destination</h2><p>Chaque pays regroupe les fiches travail, études et visite publiées par 3M TRAVEL AGENCY.</p><ul>${countries}</ul><p><a href="/guide-procedures">Ouvrir le guide des procédures</a> · <a href="/?project=travail#evaluation-multi">Commencer l’évaluation</a></p></section>`;
  }
  {
    const resourceMatch = path.match(/^\/ressources\/([^/]+)$/);
    if (resourceMatch) {
      let slug = resourceMatch[1];
      try { slug = decodeURIComponent(slug); } catch { /* keep */ }
      const page = getCountryResourcePage(slug);
      if (page) {
        const lead = countryResourceLead(page, "fr");
        const docs = page.resources
          .map((resource) => `<li><a href="${esc(resource.url)}">${esc(resource.title)}</a></li>`)
          .join("");
        const evalProject = normalizePublicEvaluationProject(primaryEvalProjectForPage(page)) ?? "travail";
        return `<section aria-label="Guides ${esc(page.country)}"><h2>Guides ${esc(page.country)}</h2><p>${esc(lead)}</p><ul>${docs}</ul><p><a href="/ressources">Retour à la bibliothèque</a> · <a href="/?project=${esc(evalProject)}&amp;destination=${esc(page.slug)}#evaluation-multi">Évaluer mon profil</a>${page.officialSources[0] ? ` · <a href="${esc(page.officialSources[0].url)}" rel="noreferrer">Source officielle</a>` : ""}</p></section>`;
      }
    }
  }
  if (path === "/procedures/comparaison") {
    return `<section aria-label="Comparateur de corridors"><h2>Comparateur de corridors</h2><p>Comparez des packs Afrique → Canada, Europe et Golfe selon votre profil. Les scores sont indicatifs et enregistrés sur votre appareil.</p><ul><li>Corridor travail · Canada &amp; Europe</li><li>Corridor études · destinations prioritaires</li><li>Corridor travail · Golfe &amp; Océanie</li></ul><p><a href="/travail">Hub Travail</a> · <a href="/etudes">Hub Études</a> · <a href="/ressources">Bibliothèque pays</a> · <a href="/?project=travail#evaluation-multi">Évaluer mon profil</a></p></section>`;
  }
  if (path === "/contact") {
    const yaounde = COMPANY_PROFILE.offices.cameroon;
    const ottawa = COMPANY_PROFILE.offices.ottawa;
    return `<section aria-label="Coordonnées de 3M TRAVEL AGENCY"><h2>Coordonnées et bureaux</h2><p><strong>Numéros Yaoundé — même logique que l’accueil :</strong> WhatsApp ${esc(yaounde.whatsappDisplay)} = canal principal (messages, dossiers, urgences) ; fixe ${esc(yaounde.phoneDisplay || "")} = appels vocaux uniquement (pas WhatsApp). Ottawa ${esc(ottawa.whatsappDisplay)} = WhatsApp secondaire, coordination Canada sur rendez-vous.</p><article><h3>${esc(yaounde.label)}</h3><p>${yaounde.addressLines.map(esc).join("<br />")}</p><p>${esc(COMPANY_PROFILE.contactRoles.yaoundeWhatsapp)} : <a href="https://wa.me/${esc(yaounde.whatsappNumber)}">${esc(yaounde.whatsappDisplay)}</a>${yaounde.phoneDisplay ? ` · ${esc(COMPANY_PROFILE.contactRoles.yaoundePhone)} : <a href="tel:${esc(yaounde.phoneDisplay.replace(/\s/g, ""))}">${esc(yaounde.phoneDisplay)}</a>` : ""}</p><p>${esc(yaounde.openingHours.join(" · "))}</p></article><article><h3>${esc(ottawa.label)}</h3><p>${ottawa.addressLines.map(esc).join("<br />")}</p><p>${esc(COMPANY_PROFILE.contactRoles.ottawaWhatsapp)} : <a href="https://wa.me/${esc(ottawa.whatsappNumber)}">${esc(ottawa.whatsappDisplay)}</a></p><p>${esc(ottawa.openingHours.join(" · "))}</p></article><p>Délai indicatif : ${esc(COMPANY_PROFILE.responseSla.label)}. ${esc(COMPANY_PROFILE.responseSla.definition)}</p><p><a href="mailto:${esc(COMPANY_PROFILE.publicEmail)}">${esc(COMPANY_PROFILE.publicEmail)}</a> · <a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(yaounde.mapQuery)}">Ouvrir la carte de Yaoundé</a></p></section>`;
  }
  if (path === "/politique-confidentialite") {
    const yaounde = COMPANY_PROFILE.offices.cameroon;
    return `<section aria-label="Politique de confidentialité" id="politique-confidentialite-complete"><h2>Politique de confidentialité — texte complet</h2><p>Dernière mise à jour : 14 octobre 2026. Entité : ${esc(COMPANY_PROFILE.legalName)} (RC ${esc(COMPANY_PROFILE.legalIdentifiers.registration)}, NIU ${esc(COMPANY_PROFILE.legalIdentifiers.taxpayerId)}), Yaoundé, Biyem-Assi, Montée Chapelle Obili.</p><h3>1. Objet</h3><p>3M Travel Agency SARL accorde une importance particulière à la protection des données personnelles de ses clients et visiteurs.</p><h3>2. En résumé</h3><ul><li>Qui consulte vos documents : vous (Mon espace) et les conseillers 3M affectés à votre dossier. Pas de consultation publique ni par des partenaires B2B, sauf transmission volontaire vers une autorité pour votre procédure.</li><li>Conservation : pendant le traitement actif, puis archivage interne jusqu’à 5 ans après clôture (obligations comptables / litiges), sauf suppression anticipée recevable.</li></ul><h3>3. Données collectées</h3><p>Identité (nom, prénom, date de naissance, nationalité), coordonnées (e-mail, téléphone, adresse), documents d’immigration (passeport, diplômes, relevés, casier, justificatifs financiers), données de connexion du compte candidat.</p><h3>4. Finalités</h3><p>Évaluation d’éligibilité, constitution et suivi de dossier, communication liée au dossier, amélioration des services.</p><h3>5. Qui peut consulter vos documents</h3><ul><li>Vous, via Mon espace</li><li>L’équipe 3M affectée à votre dossier</li><li>Autorités compétentes uniquement si la transmission est nécessaire à votre démarche</li><li>Non concernés : public, moteurs de recherche, partenaires B2B (profils anonymisés seulement avec consentement)</li></ul><p>Vos données ne sont jamais vendues à des tiers à des fins commerciales.</p><h3>6. Conservation — combien de temps</h3><ul><li>Dossier actif : durée du traitement</li><li>Après clôture : jusqu’à 5 ans</li><li>Suppression anticipée : demande à ${esc(COMPANY_PROFILE.publicEmail)}</li></ul><h3>7. Sécurité</h3><p>Chiffrement SSL ; authentification du coffre. Seuls votre compte et l’équipe 3M affectée y accèdent.</p><h3>8. Vos droits</h3><p>Droits d’accès, rectification et suppression : ${esc(COMPANY_PROFILE.publicEmail)} ou WhatsApp ${esc(yaounde.whatsappDisplay)}.</p><h3>9. Cookies</h3><p>Cookies techniques nécessaires au fonctionnement (session, préférences).</p><h3>10. Contact</h3><p>${esc(COMPANY_PROFILE.legalName)} — Yaoundé, Biyem-Assi. ${esc(COMPANY_PROFILE.publicEmail)}. WhatsApp (canal principal) : ${esc(yaounde.whatsappDisplay)} · Fixe (appels) : ${esc(yaounde.phoneDisplay || "")}.</p></section>`;
  }
  if (path === "/sources-officielles") {
    const sources = OFFICIAL_SOURCE_DESTINATIONS.map(([key, country, authority]) => {
      const portal = OFFICIAL_CONSULAR_PORTALS[key];
      return portal ? `<article><h2>${esc(country)}</h2><p><strong>${esc(authority)}</strong><br />${esc(portal.label)}</p><p>Dernière vérification : ${esc(portal.verifiedAt)}. Les exigences peuvent changer.</p><p><a href="${esc(portal.url)}" target="_blank" rel="noopener noreferrer">Ouvrir la source officielle</a></p></article>` : "";
    }).join("");
    return `<section aria-label="Portails institutionnels"><h2>Portails institutionnels vérifiés</h2><p>Les liens ci-dessous ne constituent ni une garantie d’éligibilité, ni une soumission, ni une décision. Confirmez la procédure correspondant à votre nationalité et à votre projet.</p>${sources}</section>`;
  }
  if (path === "/tarifs") {
    return `<section aria-label="Informations tarifaires"><h2>Comprendre les tarifs avant de vous engager</h2><article><h3>Fourchettes par type de service</h3><p>e-Visa / court séjour : 65 000 – 150 000 FCFA · Schengen / études Europe : 200 000 – 450 000 FCFA · Canada études ou travail : 350 000 – 800 000 FCFA. Honoraires d’agence indicatifs hors frais tiers.</p></article><article><h3>Exemple de devis — visa études France</h3><p>Ouverture 65 000 FCFA + accompagnement 180 000 FCFA + coordination dépôt 55 000 FCFA = total indicatif 300 000 FCFA. Devis écrit avant engagement.</p></article><article><h3>Ouverture de dossier — à partir de 65 000 FCFA</h3><p>Montant indicatif selon le profil ; confirmation écrite et reçu avant tout règlement.</p></article><article><h3>Services inclus</h3><p>Orientation, checklist documentaire, relecture des pièces, protocole et suivi de statut dans le périmètre écrit.</p></article><article><h3>Frais externes exclus</h3><p>Consulats, biométrie, examens médicaux, assurances, traductions, billets et frais universitaires.</p></article><article><h3>Étapes de paiement</h3><ol><li>Évaluation gratuite</li><li>Devis écrit</li><li>Protocole signé</li><li>Paiement canaux officiels + reçu</li><li>Suivi Mon espace</li></ol></article><article><h3>Annulation et remboursement — cas couverts (résumé public)</h3><ul><li>Évaluation gratuite : aucun paiement — rien à rembourser.</li><li>Avant paiement : aucun engagement financier.</li><li>Après paiement / phase engagée : frais d’ouverture et diligences déjà réalisées en principe non remboursables (protocole + reçu), sauf disposition légale impérative contraire ; situation particulière examinée selon le protocole signé.</li><li>Frais tiers déjà versés : règles des organismes concernés.</li><li>Refus de visa ou résultat négatif : pas de remboursement automatique des honoraires.</li></ul><p>Le détail figure dans le protocole signé et les <a href="/conditions-utilisation#annulation">conditions d’utilisation</a>.</p></article><p><a href="/?project=travail#evaluation-multi">Demander une orientation</a> · <a href="/conditions-utilisation#annulation">Conditions d’utilisation</a></p></section>`;
  }
  if (path === "/plan-du-site") {
    const links = [["Accueil", "/"], ["Procédures et destinations", "/procedures"], ["e-Visas", "/evisas"], ["Tarifs", "/tarifs"], ["Contact", "/contact"], ["Sources officielles", "/sources-officielles"], ["Ressources", "/ressources"], ["Guide des procédures", "/guide-procedures"], ["Créer un compte", "/register"], ["Connexion candidat", "/login"]] as const;
    return `<section aria-label="Navigation complète"><h2>Accéder rapidement aux services 3M TRAVEL AGENCY</h2><ul>${links.map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join("")}</ul></section>`;
  }
  if (path === "/procedures") {
    const featured = PUBLIC_DESTINATION_DETAILS.slice(0, 18);
    const germanyVisitor = PUBLIC_DESTINATION_DETAILS.find(({ procedure }) => procedure.id === "allemagne-visiteur");
    const featuredWithGermany = germanyVisitor && !featured.some(({ procedure }) => procedure.id === germanyVisitor.procedure.id) ? [...featured, germanyVisitor] : featured;
    const procedures = featuredWithGermany.map(({ procedure }) => `<li><a href="/procedures/${encodeURIComponent(procedure.id)}">${esc(procedure.name)} — ${esc(procedure.visaType)}</a></li>`).join("");
    return `<section aria-label="Catalogue des procédures"><h2>Catalogue des procédures documentées</h2><p>Les fiches de procédures restent disponibles dans l’annuaire interactif. Pour accélérer le premier affichage, voici une sélection de destinations prioritaires ; utilisez la recherche pour accéder à toute la liste.</p><p>Vous pouvez commencer l’évaluation gratuite sans compte, puis créer un compte pour enregistrer le dossier, déposer un CV et suivre le statut.</p><ul>${procedures}</ul><p><a href="/?project=travail#evaluation-multi">Évaluation gratuite (sans compte pour démarrer)</a> · <a href="/procedures#catalogue">Ouvrir l’annuaire interactif complet</a> · <a href="/sources-officielles">Consulter les sources officielles</a></p></section>`;
  }
  if (path === "/evisas") {
    const catalogue = evisasDatabaseComplete.map((entry) => `<li><a href="/evisa/${encodeURIComponent(entry.id)}">${esc(entry.country)}</a> — ${esc(entry.type)} · ${esc(entry.region)}</li>`).join("");
    return `<section aria-label="Aperçu de l’annuaire e-Visa"><h2>Annuaire des procédures e-Visa</h2><p>Les conditions de délivrance, nationalités admises, frais et délais doivent être confirmés sur le portail officiel de la destination avant toute démarche.</p><ul>${catalogue}</ul><p><a href="/contact">Demander une orientation à 3M TRAVEL AGENCY</a></p></section>`;
  }
  const evisaMatch = path.match(/^\/evisa\/([^/]+)$/);
  if (evisaMatch) {
    const destination = evisasDatabaseComplete.find((entry) => entry.id === evisaMatch[1]);
    if (!destination) return "";
    const steps = destination.steps.map((step) => `<li>${esc(step)}</li>`).join("");
    const officialPortal = destination.officialPortalUrl
      ? `<p><a href="${esc(destination.officialPortalUrl)}" target="_blank" rel="noopener noreferrer">${esc(destination.officialPortalLabel || "Consulter le portail officiel")}</a>${destination.officialVerifiedAt ? ` · Vérifié le ${esc(destination.officialVerifiedAt)}` : ""}</p>`
      : `<p>Le portail officiel doit être vérifié avant tout paiement ou dépôt de document.</p>`;
    return `<section aria-label="Détails e-Visa"><h2>${esc(destination.country)} : repères e-Visa</h2><p>${esc(destination.culture)}</p><p><strong>Type :</strong> ${esc(destination.type)} · <strong>Durée :</strong> ${esc(destination.duration)} · <strong>Délai :</strong> ${esc(destination.delay)} · <strong>Frais :</strong> ${esc(destination.fee)}</p><h2>Étapes à vérifier</h2><ol>${steps}</ol><p><strong>Documents :</strong> ${esc(destination.docs)}</p>${officialPortal}<p>Ces informations sont indicatives et à confirmer sur le portail officiel avant toute démarche, paiement ou réservation. La délivrance relève de l’autorité compétente : 3M TRAVEL AGENCY n’en garantit ni l’obtention ni les délais.</p><p><a href="/evisas">Retourner à l’annuaire e-Visa</a> · <a href="/contact">Demander une orientation</a></p></section>`;
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
  const resourceCountryMatch = path.match(/^\/ressources\/([^/]+)$/);
  let resourceCountryMeta: PublicMeta | undefined;
  if (resourceCountryMatch) {
    let slug = resourceCountryMatch[1];
    try { slug = decodeURIComponent(slug); } catch { /* keep */ }
    const resourcePage = getCountryResourcePage(slug);
    if (resourcePage) {
      const lead = countryResourceLead(resourcePage, "fr");
      resourceCountryMeta = {
        title: `Guides ${resourcePage.country} | ${SITE}`,
        description: lead,
        heading: `Guides ${resourcePage.country}`,
        lead,
      };
    }
  }
  const meta = PUBLIC_PAGES[path] ?? procedurePage ?? evisaPage ?? blogArticle ?? resourceCountryMeta;
  const isStudyArticle = Boolean(studyArticle);
  const socialType = isStudyArticle ? "article" : "website";
  const privatePath = /^\/(admin|mon-espace|mon-dossier|confirm-email|verify-email-link|verify-email|verify-email-sent|verify-application-email|confirm-email-change|login|panier|document-upload|mes-vols-favoris|flights|payment\/[^/]+|flight-booking\/[^/]+)(?:\/|$)/.test(path);
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
  const isAboutPage = path === "/about";
  const procedureMatch = path.match(/^\/(?:en\/)?(?:procedures|destinations)\/([^/]+)$/);
  let procedureImage: string | undefined;
  let procedureImageAlt = SOCIAL_IMAGE_ALT;
  if (procedureMatch) {
    let requestedId = procedureMatch[1];
    try {
      requestedId = decodeURIComponent(requestedId);
    } catch {
      // ignore
    }
    const procedure = getPublicDestinationDetail(requestedId)?.procedure
      ?? getPublicDestinationDetail(getEnglishContentByEnSlug(requestedId)?.frId ?? "")?.procedure;
    const catalogued = procedure ? getCataloguedDestinationImage(procedure.id) : getCataloguedDestinationImage(requestedId);
    if (catalogued) {
      procedureImage = catalogued.startsWith("http") ? catalogued : `${ORIGIN}${catalogued}`;
      procedureImageAlt = procedure
        ? `Illustration mobilité internationale pour ${procedure.name}`
        : SOCIAL_IMAGE_ALT;
    }
  }
  const serviceHeroPaths: Record<string, string> = {
    "/services": "mobilite",
    "/visa-etudes": "visa-etudes",
    "/etudes": "visa-etudes",
    "/visa-travail": "travail",
    "/travail": "travail",
    "/schengen": "schengen",
    "/tourisme": "hotels",
    "/cni-passeport": "cni",
    "/formation": "formations",
    "/canada": "immigration",
    "/ressources": "mobilite",
  };
  if (resourceCountryMatch) {
    let slug = resourceCountryMatch[1];
    try { slug = decodeURIComponent(slug); } catch { /* keep */ }
    const resourcePage = getCountryResourcePage(slug);
    const catalogued = resourcePage ? getCataloguedDestinationImage(resourcePage.visualSlug) : undefined;
    if (catalogued) {
      procedureImage = catalogued.startsWith("http") ? catalogued : `${ORIGIN}${catalogued}`;
      procedureImageAlt = resourcePage ? `Illustration mobilité pour ${resourcePage.country}` : SOCIAL_IMAGE_ALT;
    }
  }
  const serviceThemeId = serviceHeroPaths[path];
  const serviceVisual = serviceThemeId ? getServiceVisual(serviceThemeId) : null;
  const serviceImage = serviceVisual ? `${ORIGIN}${serviceVisual.desktop}` : undefined;

  const socialImage = isAboutPage
    ? FOUNDER.imageHd
    : procedureImage ?? serviceImage ?? socialImageFor(current.title, path);
  const socialImageAlt = isAboutPage
    ? FOUNDER.imageAlt
    : procedureImage
      ? procedureImageAlt
      : serviceVisual?.alt ?? SOCIAL_IMAGE_ALT;
  const socialImageType = isAboutPage || procedureImage || serviceImage ? "image/jpeg" : "image/png";
  const socialImageWidth = isAboutPage ? "1152" : "1200";
  const socialImageHeight = isAboutPage ? "864" : "630";
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
    author: { "@type": "Organization", name: "3M TRAVEL AGENCY", url: ORIGIN },
    publisher: { "@type": "Organization", name: "3M TRAVEL AGENCY", url: ORIGIN, logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 } },
    inLanguage: isEnPath ? "en" : "fr-FR",
  } : null;
  const founderPerson = {
    "@type": "Person",
    "@id": `${ORIGIN}/about#aureol-donfack`,
    name: FOUNDER.name,
    givenName: FOUNDER.givenName,
    familyName: FOUNDER.familyName,
    jobTitle: FOUNDER.jobTitle,
    image: [FOUNDER.imageHd, FOUNDER.imageJpg, FOUNDER.imageWebp, FOUNDER.imageSquare],
    url: FOUNDER.aboutUrl,
    mainEntityOfPage: FOUNDER.aboutUrl,
    description: FOUNDER.description,
    knowsAbout: [
      "mobilité internationale",
      "visas",
      "immigration",
      GROUP_LEGAL_NAME,
      BRAND_PUBLIC_NAME,
    ],
    worksFor: {
      "@type": "Organization",
      "@id": `${ORIGIN}/#organization`,
      name: FOUNDER.organization,
      legalName: FOUNDER.organization,
      alternateName: [FOUNDER.brand, FOUNDER.legalOperatingName],
      url: ORIGIN,
    },
    affiliation: {
      "@type": "Organization",
      "@id": `${ORIGIN}/#organization`,
      name: FOUNDER.organization,
    },
  };
  const organizationNode = {
    "@type": "Organization",
    "@id": `${ORIGIN}/#organization`,
    name: BRAND_PUBLIC_NAME,
    legalName: GROUP_LEGAL_NAME,
    alternateName: [...ORGANIZATION_ALTERNATE_NAMES],
    url: ORIGIN,
    logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 },
    image: LOGO_URL,
    description: current.description,
    identifier: [
      COMPANY_PROFILE.legalIdentifiers.registration,
      COMPANY_PROFILE.legalIdentifiers.taxpayerId,
    ],
    sameAs: ["https://www.facebook.com/3mtravelcm"],
    founder: { "@id": `${ORIGIN}/about#aureol-donfack` },
    employee: { "@id": `${ORIGIN}/about#aureol-donfack` },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Yaoundé",
      addressCountry: "CM",
    },
  };
  const structuredData = path === "/" || path === "/en"
    ? { "@context": "https://schema.org", "@graph": [
        organizationNode,
        founderPerson,
        { "@type": "WebSite", "@id": `${ORIGIN}/#website`, name: BRAND_PUBLIC_NAME, alternateName: [...ORGANIZATION_ALTERNATE_NAMES], url: ORIGIN, description: current.description, publisher: { "@id": `${ORIGIN}/#organization` }, inLanguage: isEnPath ? "en" : "fr-FR" },
      ] }
    : isAboutPage
      ? { "@context": "https://schema.org", "@graph": [
          founderPerson,
          {
            ...organizationNode,
            name: GROUP_LEGAL_NAME,
            legalName: GROUP_LEGAL_NAME,
            alternateName: [BRAND_PUBLIC_NAME, COMPANY_PROFILE.legalName],
            description: FOUNDER.description,
          },
          { "@type": "AboutPage", "@id": `${ORIGIN}/about#webpage`, url: FOUNDER.aboutUrl, name: current.title, description: current.description, mainEntity: { "@id": `${ORIGIN}/about#aureol-donfack` }, about: { "@id": `${ORIGIN}/about#aureol-donfack` }, isPartOf: { "@id": `${ORIGIN}/#website` } },
          breadcrumb,
        ] }
    : path === "/procedures"
      ? { "@context": "https://schema.org", "@graph": [
          { "@type": "FAQPage", mainEntity: PUBLIC_FAQ_ITEMS.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
          breadcrumb,
        ] }
    : path === "/politique-confidentialite"
      ? { "@context": "https://schema.org", "@graph": [
          {
            "@type": "WebPage",
            "@id": `${canonical}#webpage`,
            name: current.title,
            description: current.description,
            url: canonical,
            inLanguage: "fr-FR",
            isPartOf: { "@id": `${ORIGIN}/#website` },
            about: { "@id": `${ORIGIN}/#organization` },
            mainEntity: {
              "@type": "PrivacyPolicy",
              name: "Politique de confidentialité 3M TRAVEL AGENCY",
              text: current.lead,
              dateModified: "2026-10-14",
            },
          },
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
    `<meta property="og:type" content="${isAboutPage ? "profile" : socialType}" />`,
    `<meta property="og:locale" content="${isEnPath ? "en_US" : "fr_FR"}" />`,
    `<meta property="og:site_name" content="${esc(SITE)}" />`,
    `<meta property="og:title" content="${esc(current.title)}" />`,
    `<meta property="og:description" content="${esc(current.description)}" />`,
    `<meta property="og:url" content="${canonicalAttr}" />`,
    `<meta property="og:image" content="${socialImage}" />`,
    `<meta property="og:image:alt" content="${esc(socialImageAlt)}" />`,
    `<meta property="og:image:type" content="${socialImageType}" />`,
    `<meta property="og:image:width" content="${socialImageWidth}" />`,
    `<meta property="og:image:height" content="${socialImageHeight}" />`,
    ...(isAboutPage ? [
      `<meta property="profile:first_name" content="Aureol" />`,
      `<meta property="profile:last_name" content="DONFACK" />`,
      `<meta property="profile:username" content="Aureol DONFACK" />`,
    ] : []),
    ...(isStudyArticle ? [`<meta property="article:publisher" content="${esc(COMPANY_PROFILE.website)}" />`] : []),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(current.title)}" />`,
    `<meta name="twitter:description" content="${esc(current.description)}" />`,
    `<meta name="twitter:url" content="${canonicalAttr}" />`,
    `<meta name="twitter:image" content="${socialImage}" />`,
    `<meta name="twitter:image:alt" content="${esc(socialImageAlt)}" />`,
    structuredDataTag,
  ].join("\n");
  const canadaFallback = path === "/canada" ? `<section aria-label="Parcours Canada"><h2>Évaluez votre score et construisez votre stratégie Canada</h2><p>Le parcours Canada commence par l’évaluation de votre profil et de votre score indicatif, avant d’explorer les programmes officiels.</p><ul><li>Entrée express et classement CRS</li><li>Candidats des provinces et voies régionales</li><li>Permis de travail, études, visite et famille</li></ul><p><a href="/evaluation?destination=canada">Faire évaluer mon profil Canada</a> · <a href="/canada/crs">Ouvrir la calculatrice CRS Canada</a> · <a href="/?project=travail&amp;destination=canada#evaluation-multi">Évaluation rapide protégée</a> · <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada.html" rel="noreferrer">Consulter les programmes IRCC</a> · <a href="/contact">Contacter 3M TRAVEL AGENCY</a></p></section>` : "";
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
      return `<section aria-label="Procedure details"><h2>${esc(englishContentForPath.name)} procedure — preparing your file</h2><p>${esc(englishContentForPath.detailedDescription)}</p><h2>Preparation steps</h2><ol>${steps}</ol><h2>Documents to prepare</h2><ul>${documents}</ul>${officialPortalEn}${faqSectionEn}<p>Legal identification: ${LEGAL}</p><p>Applicable requirements, timelines and decisions belong to the competent authorities and partners; they must be confirmed before any step.</p><p><a href="/?project=${projectQueryEn}&amp;destination=${encodeURIComponent(procedure.id)}#evaluation-multi">Start the guided evaluation</a> · <a href="/en">Back to the English overview</a> · <a href="/contact">Contact 3M TRAVEL AGENCY</a></p></section>`;
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
    return `<section aria-label="Détails de la procédure"><h2>Procédure ${esc(procedure.name)} — préparer votre dossier</h2><p>${esc(procedure.detailedDescription)}</p><h2>Étapes de préparation</h2><ol>${steps}</ol><h2>Documents à préparer</h2><ul>${documents}</ul>${institutionalSection}<h2>Guides et sources associés</h2>${guides || primaryGuide ? `<ul>${primaryGuide}${guides}</ul>` : "<p>Le guide détaillé est en cours de consolidation ; consultez le portail institutionnel lorsqu’il est vérifié.</p>"}${officialPortal}${faqSection}<p>Identification légale : ${LEGAL}</p><p>Les exigences applicables, les délais et les décisions relèvent des autorités et partenaires compétents ; ils sont à confirmer avant toute démarche.</p><p><a href="/?project=${projectQuery}&amp;destination=${encodeURIComponent(procedure.id)}#evaluation-multi">Commencer l’évaluation protégée</a> · <a href="/procedures">Retourner à l’annuaire</a> · <a href="/contact">Contacter 3M TRAVEL AGENCY</a></p></section>`;
  })() : "";
  const procedureFaqFallback = path === "/procedures" ? `<section aria-labelledby="seo-procedures-faq"><h2 id="seo-procedures-faq">Questions fréquentes</h2><dl>${PUBLIC_FAQ_ITEMS.map((item) => `<div><dt>${esc(item.question)}</dt><dd>${esc(item.answer)}</dd></div>`).join("")}</dl></section><p>Identification légale : ${LEGAL}</p>` : "";
  const routeContent = routeSpecificPrerender(path);
  const transparencySection = isEnPath
    ? `<section aria-label="Transparency notes"><h2>Verifiable information before any step</h2><ul><li>Required documents and information are confirmed based on destination and procedure.</li><li>Decisions by employers, partner agencies and competent authorities are not guaranteed by 3M TRAVEL AGENCY.</li><li>Sensitive actions are controlled by an authorized person.</li></ul></section>`
    : `<section aria-label="Repères de transparence"><h2>Informations vérifiables avant toute démarche</h2><ul><li>Les documents et informations à fournir sont confirmés selon la destination et la procédure.</li><li>Les décisions d’employeurs, d’agences partenaires et d’autorités compétentes ne sont pas garanties par 3M TRAVEL AGENCY.</li><li>Les actions sensibles sont contrôlées par une personne habilitée.</li></ul></section>`;
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
