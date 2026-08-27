import { OFFICIAL_SITE_ORIGIN } from "./canonicalDomain";
import { PUBLIC_FAQ_ITEMS } from "@shared/publicFaq";
import { getPublicDestinationDetail, PUBLIC_DESTINATION_DETAILS } from "../client/src/lib/publicDestinationCatalog";
import { getInstitutionalProcedureSource } from "../client/src/data/institutionalProcedureSources";

const ORIGIN = OFFICIAL_SITE_ORIGIN;
const SITE = "3M Travel & Services";
const LEGAL = "RC/YAO/2019/A/2567 · NIU M112417203369H";
const SOCIAL_IMAGE_ALT = "Aperçu 3M Travel & Services";
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
  return {
    title: `Procédure ${procedure.name} | ${SITE}`,
    description: `Étapes, documents et ressources de préparation pour votre projet ${projectLabel} vers ${procedure.name}, à vérifier auprès des autorités compétentes.`,
    heading: `Procédure ${procedure.name}`,
    lead: `Consultez les étapes de préparation, les documents à prévoir et les ressources associées à votre projet ${projectLabel} vers ${procedure.name}.`,
    keywords: [`visa ${procedure.name}`, `procédure ${procedure.name}`, projectLabel, "mobilité internationale", "3M Travel"],
  };
};

export const PUBLIC_PAGES: Record<string, PublicMeta> = {
  "/": { title: "3M Travel Agency | Mobilité internationale en confiance", description: "Accompagnement documenté pour vos projets de mobilité internationale, avec évaluation, sources officielles et validation humaine des étapes sensibles.", keywords: ["mobilité internationale", "visa", "immigration", "voyage", "évaluation de profil", "3M Travel Agency"], heading: "Votre projet de mobilité, préparé avec méthode", lead: "3M Travel & Services accompagne les candidats dans la préparation de leurs démarches. Les décisions des autorités, employeurs et partenaires externes restent indépendantes de l’agence." },
  "/canada": { title: `Canada | ${SITE}`, description: "Préparez votre projet Canada avec des informations officielles et un accompagnement administratif documenté, sans promesse de résultat.", keywords: ["visa Canada", "immigration Canada", "permis de travail", "études au Canada", "3M Travel"], heading: "Démarches Canada", lead: "Préparez votre projet avec des informations vérifiables, sans promesse d’admission, d’emploi ou de résidence." },
  "/schengen": { title: `Espace Schengen | ${SITE}`, description: "Repères administratifs pour les projets de visa et de mobilité vers l’espace Schengen.", heading: "Démarches Schengen", lead: "Les exigences varient selon le pays et la situation individuelle ; les liens institutionnels sont prioritaires." },
  "/etudes": { title: `Études à l’international | ${SITE}`, description: "Accompagnement documenté pour les projets d’études à l’international et les dossiers associés.", heading: "Projet d’études à l’international", lead: "L’admission et les décisions consulaires relèvent exclusivement des établissements et autorités compétents." },
  "/billets": { title: `3M Booking | ${SITE}`, description: "Demandes de vols, hôtels et services de voyage avec traitement et confirmation humaine.", heading: "3M Booking", lead: "Les disponibilités et tarifs sont confirmés avant toute réservation ou paiement." },
  "/tourisme": { title: `Tourisme, hôtels et séjours | ${SITE}`, description: "Préparez un séjour avec des repères de destination, des hébergements et une demande de devis accompagnée.", heading: "Tourisme et séjours sur mesure", lead: "Les disponibilités, fournisseurs et tarifs sont confirmés par l’agence avant toute réservation." },
  "/assurance": { title: `Assurance voyage | ${SITE}`, description: "Préparez une demande d’assurance voyage avec un circuit administratif documenté et une validation humaine.", heading: "Assurance voyage", lead: "La couverture, les garanties et le tarif final dépendent du fournisseur et des informations validées." },
  "/traduction/order": { title: `Traduction certifiée | ${SITE}`, description: "Déposez une demande de traduction certifiée avec un parcours documentaire sécurisé.", heading: "Demande de traduction certifiée", lead: "Le délai, le prix et la recevabilité dépendent du document, des langues et du traducteur compétent." },
  "/hotels": { title: `Hôtels et séjours | ${SITE}`, description: "Ancien accès aux services hôteliers de 3M Travel, redirigé vers le parcours tourisme.", heading: "Hôtels et séjours", lead: "Redirection vers le parcours tourisme de 3M Travel." },
  "/visa-etudes": { title: `Études à l’international | ${SITE}`, description: "Ancien accès au parcours études, redirigé vers la page canonique des études.", heading: "Études à l’international", lead: "Redirection vers le parcours études de 3M Travel." },
  "/formation": { title: `Formations | ${SITE}`, description: "Découvrez les programmes de formation et d’orientation proposés par 3M Travel & Services.", heading: "Formation et orientation", lead: "Les contenus sont présentés à titre d’information ; chaque inscription est confirmée selon les conditions applicables." },
  "/blog": { title: `Ressources mobilité internationale | ${SITE}`, description: "Guides et articles pratiques sur les démarches de mobilité internationale.", heading: "Ressources et guides", lead: "Consultez nos contenus de préparation et complétez-les avec les sources officielles de votre destination." },
  "/procedures": { title: `Procédures de mobilité | ${SITE}`, description: "Consultez les étapes, documents et repères administratifs des procédures de mobilité internationale par destination.", keywords: ["procédures visa", "documents visa", "mobilité internationale", "dossier immigration", "3M Travel"], heading: "Procédures par destination", lead: "Chaque procédure est adaptée à la destination et vérifiée par l’équipe avant toute étape sensible." },
  "/evisas": { title: `e-Visas | ${SITE}`, description: "Préparation et suivi des demandes d’e-Visa avec circuit documentaire sécurisé.", heading: "Services e-Visa", lead: "La décision de délivrance relève de l’autorité compétente ; les documents sont traités avec traçabilité." },
  "/tarifs": { title: `Tarifs et informations de frais | ${SITE}`, description: "Informations transparentes sur les prestations, frais tiers possibles et conditions de traitement.", heading: "Tarifs et transparence", lead: "Les frais externes et décisions partenaires sont présentés avant engagement lorsqu’ils sont connus." },
  "/avis": { title: `Avis et retours | ${SITE}`, description: "Retours publiés après modération et informations de transparence de 3M Travel & Services.", heading: "Avis et transparence", lead: "Les retours sont traités avec modération ; aucun résultat individuel n’est garanti." },
  "/contact": { title: `Contact | ${SITE}`, description: "Contactez 3M Travel & Services à Yaoundé ou Ottawa pour une orientation sur votre projet de mobilité internationale.", keywords: ["contact 3M Travel", "agence visa Yaoundé", "agence voyage Cameroun", "mobilité internationale", "Ottawa"], heading: "Contacter 3M Travel & Services", lead: "Nos équipes répondent aux demandes d’orientation et précisent les étapes à confirmer." },
  "/about": { title: `Qui sommes-nous | ${SITE}`, description: "Présentation, engagements de transparence et informations légales de 3M Travel & Services.", heading: "Une agence de mobilité internationale documentée", lead: "Notre rôle est d’accompagner la préparation administrative ; les décisions externes restent indépendantes." },
  "/politique-confidentialite": { title: `Politique de confidentialité | ${SITE}`, description: "Informations sur le traitement des données et documents confiés à 3M Travel & Services.", heading: "Confidentialité et données", lead: "Les données sensibles sont limitées aux finalités de traitement et aux accès autorisés." },
  "/conditions-utilisation": { title: `Conditions d’utilisation | ${SITE}`, description: "Conditions d’utilisation des services et informations de responsabilité.", heading: "Conditions d’utilisation", lead: "Les services d’accompagnement ne remplacent ni les autorités compétentes ni les décisions de partenaires externes." },
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
  "/confirm-email": { title: `Activer mon compte | ${SITE}`, description: "Page sécurisée d’activation du compte candidat.", heading: "Activer mon compte", lead: "Utilisez le lien sécurisé reçu par e-mail. Cette page n’est pas indexée.", noindex: true },
  "/verify-email-link": { title: `Activer mon compte | ${SITE}`, description: "Page sécurisée de confirmation de l’adresse e-mail du candidat.", heading: "Confirmer mon adresse e-mail", lead: "Utilisez le lien sécurisé reçu par e-mail. Cette page n’est pas indexée.", noindex: true },
  "/verify-email": { title: `Vérifier mon adresse e-mail | ${SITE}`, description: "Page sécurisée de vérification de l’adresse e-mail du candidat.", heading: "Vérifier mon adresse e-mail", lead: "Cette page n’est pas indexée.", noindex: true },
  "/verify-email-sent": { title: `Lien d’activation envoyé | ${SITE}`, description: "Confirmation de l’envoi du lien d’activation du compte candidat.", heading: "Consultez votre e-mail", lead: "Cette page n’est pas indexée.", noindex: true },
  "/verify-application-email": { title: `Confirmer mon dossier | ${SITE}`, description: "Page sécurisée de confirmation d’accès au dossier candidat.", heading: "Confirmer mon dossier", lead: "Cette page n’est pas indexée.", noindex: true },
  "/mon-espace": { title: `Mon espace | ${SITE}`, description: "Espace privé de suivi des démarches et communications.", heading: "Mon espace client", lead: "Connectez-vous pour consulter votre espace personnel. Cette page n’est pas indexée.", noindex: true },
  "/mon-dossier": { title: `Mon dossier | ${SITE}`, description: "Espace privé de suivi du dossier client.", heading: "Mon dossier", lead: "Connectez-vous pour suivre votre dossier. Cette page n’est pas indexée.", noindex: true },
  "/confirm-email-change": { title: `Confirmer mon adresse e-mail | ${SITE}`, description: "Page sécurisée de confirmation du changement d’adresse e-mail.", heading: "Confirmer le changement d’adresse", lead: "Cette page sécurisée n’est pas indexée.", noindex: true },
  "/assistance-acces": { title: `Assistance accès | ${SITE}`, description: "Demande d’assistance sécurisée pour la récupération d’accès à un espace client.", heading: "Assistance pour récupérer l’accès", lead: "Cette page de récupération nécessite une vérification humaine et n’est pas indexée.", noindex: true },
};

const esc = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char);
const publicPath = (url: string) => {
  const raw = url.split("?")[0] || "/";
  return raw === "/" ? "/" : raw.replace(/\/+$/, "");
};
const publicNav = `<nav aria-label="Navigation publique pré-rendue"><a href="/">Accueil</a><a href="/procedures">Procédures</a><a href="/evisas">e-Visas</a><a href="/tarifs">Tarifs</a><a href="/sources-officielles">Sources officielles</a><a href="/plan-du-site">Plan du site</a></nav>`;

export function isPublicIndexablePath(url: string) {
  return Boolean(PUBLIC_PAGES[publicPath(url)]);
}

export function getIndexablePublicPaths() {
  const staticPaths = Object.entries(PUBLIC_PAGES)
    .filter(([, meta]) => !meta.noindex)
    .map(([path]) => path);
  const destinationPaths = PUBLIC_DESTINATION_DETAILS.map((detail) => `/procedures/${detail.procedure.id}`);
  return staticPaths.concat(destinationPaths.filter((path) => staticPaths.indexOf(path) === -1));
}

export function composePublicPrerender(template: string, url: string) {
  const path = publicPath(url);
  const blogArticle = path.startsWith("/blog/") ? { title: `Article mobilité internationale | ${SITE}`, description: "Ressource de préparation pour un projet de mobilité internationale.", heading: "Ressource mobilité internationale", lead: "Cette ressource complète les informations officielles applicables à votre destination." } : undefined;
  const procedurePage = procedureMetaForPath(path);
  const procedureDetail = procedurePage ? getPublicDestinationDetail(path.replace(/^\/(?:procedures|destinations)\//, "")) : undefined;
  const meta = PUBLIC_PAGES[path] ?? procedurePage ?? blogArticle;
  const privatePath = /^\/(admin|mon-espace|mon-dossier|confirm-email|verify-email-link|verify-email|verify-email-sent|verify-application-email|confirm-email-change|employeurs|login|panier|document-upload|mes-vols-favoris|flights)(?:\/|$)/.test(path);
  const unknown = !meta && !privatePath;
  const current: PublicMeta = meta ?? {
    title: unknown ? `Page introuvable | ${SITE}` : SITE,
    description: unknown ? "La page demandée n’est pas disponible." : "Espace réservé, non indexé.",
    heading: unknown ? "Page introuvable" : "Espace réservé",
    lead: unknown ? "Vérifiez l’adresse ou revenez à l’accueil." : "Cette page nécessite une authentification et ne doit pas être indexée.",
    noindex: privatePath || unknown,
  };
  const canonical = `${ORIGIN}${path}`;
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
    publisher: { "@type": "Organization", name: "3M Travel & Services", url: ORIGIN, logo: { "@type": "ImageObject", url: socialImage } },
    inLanguage: "fr-FR",
  } : null;
  const structuredData = path === "/"
    ? { "@context": "https://schema.org", "@graph": [
        { "@type": "Organization", "@id": `${ORIGIN}/#organization`, name: "3M Travel & Services", url: ORIGIN, logo: socialImage, description: current.description, identifier: ["RC/YAO/2019/A/2567", "M112417203369H"], sameAs: ["https://www.facebook.com/3mtravelcm"] },
        { "@type": "WebSite", "@id": `${ORIGIN}/#website`, name: "3M Travel Agency", url: ORIGIN, description: current.description, publisher: { "@id": `${ORIGIN}/#organization` }, inLanguage: "fr-FR" },
      ] }
    : path === "/procedures"
      ? { "@context": "https://schema.org", "@graph": [
          { "@type": "FAQPage", mainEntity: PUBLIC_FAQ_ITEMS.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
          breadcrumb,
        ] }
      : article
        ? { "@context": "https://schema.org", "@graph": [article, breadcrumb] }
        : breadcrumb;
  const structuredDataTag = structuredData ? `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script>` : "";
  const head = [
    `<title>${esc(current.title)}</title>`,
    `<meta name="description" content="${esc(current.description)}" />`,
    ...(current.keywords?.length ? [`<meta name="keywords" content="${esc(current.keywords.join(", "))}" />`] : []),
    robot,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:site_name" content="${SITE}" />`,
    `<meta property="og:title" content="${esc(current.title)}" />`,
    `<meta property="og:description" content="${esc(current.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${socialImage}" />`,
    `<meta property="og:image:alt" content="${SOCIAL_IMAGE_ALT}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(current.title)}" />`,
    `<meta name="twitter:description" content="${esc(current.description)}" />`,
    `<meta name="twitter:image" content="${socialImage}" />`,
    `<meta name="twitter:image:alt" content="${SOCIAL_IMAGE_ALT}" />`,
    structuredDataTag,
  ].join("\n");
  const canadaFallback = path === "/canada" ? `<section aria-label="Parcours Canada"><h2>Préparer votre parcours Canada</h2><p>Accédez à l’évaluation protégée, consultez les ressources IRCC et contactez l’agence pour clarifier votre projet.</p><p><a href="/?project=travail&amp;destination=canada#evaluation-multi">Créer un compte pour évaluer mon profil Canada</a> · <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada.html" rel="noreferrer">Consulter les programmes IRCC</a> · <a href="/contact">Contacter 3M Travel</a></p></section>` : "";
  const procedureFallback = procedurePage && procedureDetail ? (() => {
    const { procedure, sources, consular } = procedureDetail;
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
    return `<section aria-label="Détails de la procédure"><h2>Préparer votre dossier pour ${esc(procedure.name)}</h2><p>${esc(procedure.detailedDescription)}</p><h2>Étapes de préparation</h2><ol>${steps}</ol><h2>Documents à préparer</h2><ul>${documents}</ul>${institutionalSection}<h2>Guides et sources associés</h2>${guides || primaryGuide ? `<ul>${primaryGuide}${guides}</ul>` : "<p>Le guide détaillé est en cours de consolidation ; consultez le portail institutionnel lorsqu’il est vérifié.</p>"}${officialPortal}<p>Les exigences applicables, les délais et les décisions relèvent des autorités et partenaires compétents ; ils sont à confirmer avant toute démarche.</p><p><a href="/?project=${projectQuery}&amp;destination=${encodeURIComponent(procedure.id)}#evaluation-multi">Commencer l’évaluation protégée</a> · <a href="/procedures">Retourner à l’annuaire</a> · <a href="/contact">Contacter 3M Travel</a></p></section>`;
  })() : "";
  const procedureFaqFallback = path === "/procedures" ? `<section aria-labelledby="seo-procedures-faq"><h2 id="seo-procedures-faq">Questions fréquentes</h2><dl>${PUBLIC_FAQ_ITEMS.map((item) => `<div><dt>${esc(item.question)}</dt><dd>${esc(item.answer)}</dd></div>`).join("")}</dl></section>` : "";
  const body = `<article class="seo-prerender" data-prerendered="true"><header><p class="seo-prerender__legal">${LEGAL}</p>${publicNav}</header><main><h1>${esc(current.heading)}</h1><p>${esc(current.lead)}</p>${canadaFallback}${procedureFallback}${procedureFaqFallback}<section aria-label="Repères de transparence"><h2>Informations vérifiables avant toute démarche</h2><ul><li>Les documents et informations à fournir sont confirmés selon la destination et la procédure.</li><li>Les décisions d’employeurs, d’agences partenaires et d’autorités compétentes ne sont pas garanties par 3M Travel &amp; Services.</li><li>Les actions sensibles sont contrôlées par une personne habilitée.</li></ul></section></main><footer><p>${LEGAL}</p><p>Yaoundé · Ottawa · <a href="/contact">Nous contacter</a></p></footer></article>`;
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
