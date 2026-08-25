const ORIGIN = "https://www.3mtravelagency.com";
const SITE = "3M Travel & Services";
const LEGAL = "RC/YAO/2019/A/2567 · NIU M112417203369H";

type PublicMeta = {
  title: string;
  description: string;
  heading: string;
  lead: string;
  noindex?: boolean;
};

const PUBLIC_PAGES: Record<string, PublicMeta> = {
  "/": { title: `${SITE} | Mobilité internationale et démarches accompagnées`, description: "Accompagnement documenté pour les démarches de mobilité internationale, avec évaluation, sources officielles et validation humaine des étapes sensibles.", heading: "Mobilité internationale accompagnée avec transparence", lead: "3M Travel & Services accompagne les candidats dans la préparation de leurs démarches. Les décisions des autorités, employeurs et partenaires externes restent indépendantes de l’agence." },
  "/canada": { title: `Canada | ${SITE}`, description: "Informations de préparation de dossiers pour le Canada, avec sources institutionnelles et accompagnement administratif documenté.", heading: "Démarches Canada", lead: "Préparez votre projet avec des informations vérifiables, sans promesse d’admission, d’emploi ou de résidence." },
  "/schengen": { title: `Espace Schengen | ${SITE}`, description: "Repères administratifs pour les projets de visa et de mobilité vers l’espace Schengen.", heading: "Démarches Schengen", lead: "Les exigences varient selon le pays et la situation individuelle ; les liens institutionnels sont prioritaires." },
  "/etudes": { title: `Études à l’international | ${SITE}`, description: "Accompagnement documenté pour les projets d’études à l’international et les dossiers associés.", heading: "Projet d’études à l’international", lead: "L’admission et les décisions consulaires relèvent exclusivement des établissements et autorités compétents." },
  "/billets": { title: `3M Booking | ${SITE}`, description: "Demandes de vols, hôtels et services de voyage avec traitement et confirmation humaine.", heading: "3M Booking", lead: "Les disponibilités et tarifs sont confirmés avant toute réservation ou paiement." },
  "/formation": { title: `Formations | ${SITE}`, description: "Découvrez les programmes de formation et d’orientation proposés par 3M Travel & Services.", heading: "Formation et orientation", lead: "Les contenus sont présentés à titre d’information ; chaque inscription est confirmée selon les conditions applicables." },
  "/blog": { title: `Ressources mobilité internationale | ${SITE}`, description: "Guides et articles pratiques sur les démarches de mobilité internationale.", heading: "Ressources et guides", lead: "Consultez nos contenus de préparation et complétez-les avec les sources officielles de votre destination." },
  "/procedures": { title: `Procédures de mobilité | ${SITE}`, description: "Parcours de préparation de dossier, documents et étapes administratives par destination.", heading: "Procédures par destination", lead: "Chaque procédure est adaptée à la destination et vérifiée par l’équipe avant toute étape sensible." },
  "/evisas": { title: `e-Visas | ${SITE}`, description: "Préparation et suivi des demandes d’e-Visa avec circuit documentaire sécurisé.", heading: "Services e-Visa", lead: "La décision de délivrance relève de l’autorité compétente ; les documents sont traités avec traçabilité." },
  "/tarifs": { title: `Tarifs et informations de frais | ${SITE}`, description: "Informations transparentes sur les prestations, frais tiers possibles et conditions de traitement.", heading: "Tarifs et transparence", lead: "Les frais externes et décisions partenaires sont présentés avant engagement lorsqu’ils sont connus." },
  "/avis": { title: `Avis et retours | ${SITE}`, description: "Retours publiés après modération et informations de transparence de 3M Travel & Services.", heading: "Avis et transparence", lead: "Les retours sont traités avec modération ; aucun résultat individuel n’est garanti." },
  "/contact": { title: `Contact | ${SITE}`, description: "Contactez 3M Travel & Services à Yaoundé ou Ottawa pour une orientation administrative.", heading: "Contacter 3M Travel & Services", lead: "Nos équipes répondent aux demandes d’orientation et précisent les étapes à confirmer." },
  "/about": { title: `Qui sommes-nous | ${SITE}`, description: "Présentation, engagements de transparence et informations légales de 3M Travel & Services.", heading: "Une agence de mobilité internationale documentée", lead: "Notre rôle est d’accompagner la préparation administrative ; les décisions externes restent indépendantes." },
  "/politique-confidentialite": { title: `Politique de confidentialité | ${SITE}`, description: "Informations sur le traitement des données et documents confiés à 3M Travel & Services.", heading: "Confidentialité et données", lead: "Les données sensibles sont limitées aux finalités de traitement et aux accès autorisés." },
  "/conditions-utilisation": { title: `Conditions d’utilisation | ${SITE}`, description: "Conditions d’utilisation des services et informations de responsabilité.", heading: "Conditions d’utilisation", lead: "Les services d’accompagnement ne remplacent ni les autorités compétentes ni les décisions de partenaires externes." },
  "/ressources": { title: `Ressources | ${SITE}`, description: "Ressources utiles et liens d’orientation pour les projets de mobilité internationale.", heading: "Ressources utiles", lead: "Préparez votre projet à partir d’informations vérifiables et de sources institutionnelles." },
  "/guide-procedures": { title: `Guide des procédures | ${SITE}`, description: "Guide de préparation des démarches, documents et étapes de suivi.", heading: "Guide des procédures", lead: "Les étapes réellement applicables dépendent de votre destination, profil et dossier." },
  "/3m-digital": { title: `3M Digital | ${SITE}`, description: "Services numériques et accompagnement documentaire de 3M Travel & Services.", heading: "3M Digital", lead: "Découvrez les services numériques et soumettez une demande détaillée à l’équipe." },
  "/plan-du-site": { title: `Plan du site | ${SITE}`, description: "Accédez aux principales pages, procédures, ressources et informations de 3M Travel & Services.", heading: "Plan du site", lead: "Trouvez rapidement les pages utiles à votre démarche de mobilité internationale." },
  "/sources-officielles": { title: `Sources officielles | ${SITE}`, description: "Liens institutionnels par destination pour préparer une démarche de mobilité internationale.", heading: "Sources officielles par destination", lead: "Les informations institutionnelles constituent la référence pour les exigences, délais et décisions applicables." },
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

export function composePublicPrerender(template: string, url: string) {
  const path = publicPath(url);
  const blogArticle = path.startsWith("/blog/") ? { title: `Article mobilité internationale | ${SITE}`, description: "Ressource de préparation pour un projet de mobilité internationale.", heading: "Ressource mobilité internationale", lead: "Cette ressource complète les informations officielles applicables à votre destination." } : undefined;
  const meta = PUBLIC_PAGES[path] ?? blogArticle;
  const privatePath = /^\/(admin|mon-espace|employeurs|login|panier)(?:\/|$)/.test(path);
  const unknown = !meta && !privatePath;
  const current: PublicMeta = meta ?? {
    title: unknown ? `Page introuvable | ${SITE}` : SITE,
    description: unknown ? "La page demandée n’est pas disponible." : "Espace réservé, non indexé.",
    heading: unknown ? "Page introuvable" : "Espace réservé",
    lead: unknown ? "Vérifiez l’adresse ou revenez à l’accueil." : "Cette page nécessite une authentification et ne doit pas être indexée.",
    noindex: privatePath || unknown,
  };
  const canonical = `${ORIGIN}${path}`;
  const robot = current.noindex ? `<meta name="robots" content="noindex,follow" />` : `<meta name="robots" content="index,follow" />`;
  const head = [
    `<title>${esc(current.title)}</title>`,
    `<meta name="description" content="${esc(current.description)}" />`,
    robot,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:site_name" content="${SITE}" />`,
    `<meta property="og:title" content="${esc(current.title)}" />`,
    `<meta property="og:description" content="${esc(current.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(current.title)}" />`,
    `<meta name="twitter:description" content="${esc(current.description)}" />`,
  ].join("\n");
  const body = `<article class="seo-prerender" data-prerendered="true"><header><p class="seo-prerender__legal">${LEGAL}</p>${publicNav}</header><main><h1>${esc(current.heading)}</h1><p>${esc(current.lead)}</p><section aria-label="Repères de transparence"><h2>Informations vérifiables avant toute démarche</h2><ul><li>Les documents et informations à fournir sont confirmés selon la destination et la procédure.</li><li>Les décisions d’employeurs, d’agences partenaires et d’autorités compétentes ne sont pas garanties par 3M Travel &amp; Services.</li><li>Les actions sensibles sont contrôlées par une personne habilitée.</li></ul></section></main><footer><p>${LEGAL}</p><p>Yaoundé · Ottawa · <a href="/contact">Nous contacter</a></p></footer></article>`;
  let html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/i, "")
    .replace(/<meta\s+name="robots"[^>]*>\s*/i, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/i, "")
    .replace(/<meta\s+property="og:[^"]+"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="twitter:[^"]+"[^>]*>\s*/gi, "");
  html = html.replace("</head>", () => `${head}\n</head>`);
  html = html.replace("<!--prerender-app-->", () => body);
  return { html, status: unknown ? 404 : 200, noindex: Boolean(current.noindex) };
}
