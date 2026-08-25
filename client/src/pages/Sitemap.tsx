import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpen, Compass, FileText, Landmark, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

type Language = "fr" | "en";
type Copy = Record<Language, string>;
type SitemapLink = { key: string; href: string; label: Copy; description: Copy };
type SitemapSection = { key: string; title: Copy; description: Copy; icon: typeof Compass; links: SitemapLink[] };

const COPY = {
  eyebrow: { fr: "Navigation complète", en: "Full navigation" },
  title: { fr: "Plan du site 3M Travel & Services", en: "3M Travel & Services sitemap" },
  intro: { fr: "Retrouvez chaque service, ressource et espace d’information dans une navigation structurée. Les liens d’aide indiquent leur rôle avant l’ouverture de la page.", en: "Find every service, resource and information area through structured navigation. Each link explains its purpose before you open the page." },
  access: { fr: "Les services publics restent accessibles sans compte lorsque cela est indiqué ; les espaces de suivi demandent une connexion sécurisée.", en: "Public services remain available without an account where indicated; tracking areas require a secure sign-in." },
  searchLabel: { fr: "Rechercher dans le plan du site", en: "Search the sitemap" },
  searchPlaceholder: { fr: "Ex. e-Visa, assurance, contact…", en: "E.g. e-Visa, insurance, contact…" },
  clear: { fr: "Effacer la recherche", en: "Clear search" },
  results: { fr: "résultats", en: "results" },
  noResultsTitle: { fr: "Aucun accès ne correspond à votre recherche", en: "No page matches your search" },
  noResultsText: { fr: "Essayez un autre service, pays ou mot-clé.", en: "Try another service, country or keyword." },
  helpTitle: { fr: "Besoin d’une orientation personnalisée ?", en: "Need tailored guidance?" },
  helpText: { fr: "Commencez par l’évaluation gratuite ou contactez l’agence pour être orienté vers le bon service.", en: "Start with the free assessment or contact the agency to be guided to the appropriate service." },
  helpCta: { fr: "Commencer l’évaluation", en: "Start the assessment" },
} satisfies Record<string, Copy>;

const SITE_SECTIONS: SitemapSection[] = [
  {
    key: "discover", title: { fr: "Découvrir 3M Travel", en: "Discover 3M Travel" }, description: { fr: "Les accès essentiels pour comprendre l’accompagnement, les tarifs et les canaux de contact.", en: "Essential links to understand support, pricing and contact channels." }, icon: Compass,
    links: [
      { key: "home", label: { fr: "Accueil", en: "Home" }, href: "/", description: { fr: "Revenir aux services principaux et à l’évaluation gratuite.", en: "Return to core services and the free assessment." } },
      { key: "about", label: { fr: "À propos", en: "About us" }, href: "/about", description: { fr: "Découvrir le rôle de conseil et les engagements de transparence.", en: "Learn about our advisory role and transparency commitments." } },
      { key: "pricing", label: { fr: "Tarifs", en: "Pricing" }, href: "/tarifs", description: { fr: "Comprendre les honoraires, frais tiers et modalités.", en: "Understand agency fees, third-party costs and terms." } },
      { key: "contact", label: { fr: "Contact", en: "Contact" }, href: "/contact", description: { fr: "Contacter l’agence ou consulter les coordonnées des bureaux.", en: "Contact the agency or view office details." } },
      { key: "reviews", label: { fr: "Avis", en: "Reviews" }, href: "/avis", description: { fr: "Consulter ou soumettre un avis selon le circuit de modération.", en: "Read or submit a review through the moderation process." } },
    ],
  },
  {
    key: "prepare", title: { fr: "Préparer votre projet", en: "Prepare your project" }, description: { fr: "Les services publics pour commencer une démarche de mobilité, de voyage ou de visa.", en: "Public services to begin a mobility, travel or visa process." }, icon: Landmark,
    links: [
      { key: "assessment", label: { fr: "Évaluation gratuite", en: "Free assessment" }, href: "/?project=travail#evaluation-multi", description: { fr: "Demander une première orientation sans créer de compte.", en: "Request initial guidance without creating an account." } },
      { key: "booking", label: { fr: "3M Booking", en: "3M Booking" }, href: "/billets", description: { fr: "Rechercher des options de billets et de séjour.", en: "Search ticket and stay options." } },
      { key: "procedures", label: { fr: "Procédures & destinations", en: "Procedures & destinations" }, href: "/procedures", description: { fr: "Comparer les démarches selon le pays et votre projet.", en: "Compare procedures by country and project." } },
      { key: "evisas", label: { fr: "e-Visas", en: "e-Visas" }, href: "/evisas", description: { fr: "Préparer une demande de visa électronique.", en: "Prepare an electronic visa application." } },
      { key: "insurance", label: { fr: "Assurance voyage", en: "Travel insurance" }, href: "/assurance", description: { fr: "Initier une demande de couverture adaptée au séjour.", en: "Start a request for travel coverage suited to your stay." } },
      { key: "translation", label: { fr: "Traduction certifiée", en: "Certified translation" }, href: "/traduction/order", description: { fr: "Consulter le parcours de demande de traduction.", en: "View the translation request process." } },
    ],
  },
  {
    key: "resources", title: { fr: "Ressources et procédures", en: "Resources & procedures" }, description: { fr: "Les contenus utiles pour préparer un dossier documenté et retrouver les sources institutionnelles.", en: "Useful content to prepare a documented case and find institutional sources." }, icon: BookOpen,
    links: [
      { key: "resources", label: { fr: "Ressources", en: "Resources" }, href: "/ressources", description: { fr: "Parcourir les ressources et informations pratiques.", en: "Browse practical resources and information." } },
      { key: "procedure_guide", label: { fr: "Guide des procédures", en: "Procedure guide" }, href: "/guide-procedures", description: { fr: "Accéder à un guide structuré des démarches.", en: "Access a structured guide to procedures." } },
      { key: "official_sources", label: { fr: "Sources officielles", en: "Official sources" }, href: "/sources-officielles", description: { fr: "Vérifier les liens gouvernementaux par destination.", en: "Check government links by destination." } },
      { key: "blog", label: { fr: "Blog", en: "Blog" }, href: "/blog", description: { fr: "Lire les articles et mises à jour publiés par l’agence.", en: "Read articles and updates published by the agency." } },
      { key: "accessibility", label: { fr: "Accessibilité", en: "Accessibility" }, href: "/accessibilite", description: { fr: "Ajuster la taille du texte et les préférences de mouvement.", en: "Adjust text size and motion preferences." } },
    ],
  },
  {
    key: "account", title: { fr: "Compte et informations légales", en: "Account & legal information" }, description: { fr: "Les accès à l’espace personnel et aux informations encadrant l’usage du site.", en: "Access personal areas and information governing use of the site." }, icon: ShieldCheck,
    links: [
      { key: "register", label: { fr: "Créer un compte", en: "Create an account" }, href: "/register", description: { fr: "Créer un espace candidat pour suivre vos demandes.", en: "Create a candidate space to follow your requests." } },
      { key: "login", label: { fr: "Connexion candidat", en: "Candidate sign-in" }, href: "/login", description: { fr: "Accéder à un compte existant.", en: "Access an existing account." } },
      { key: "candidate_space", label: { fr: "Espace candidat", en: "Candidate space" }, href: "/mon-espace", description: { fr: "Suivre vos dossiers et documents une fois connecté.", en: "Track your cases and documents once signed in." } },
      { key: "privacy", label: { fr: "Politique de confidentialité", en: "Privacy policy" }, href: "/politique-confidentialite", description: { fr: "Comprendre le traitement des informations personnelles.", en: "Understand how personal information is handled." } },
      { key: "terms", label: { fr: "Conditions d’utilisation", en: "Terms of use" }, href: "/conditions-utilisation", description: { fr: "Consulter le cadre d’utilisation du site et des services.", en: "Read the framework governing use of the site and services." } },
    ],
  },
];

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const SITEMAP_SYNONYMS: Record<string, string[]> = {
  home: ["home", "accueil", "start", "depart"],
  pricing: ["tarif", "tarifs", "price", "pricing", "cout", "cost", "frais", "fee"],
  contact: ["contact", "whatsapp", "telephone", "phone", "email", "adresse", "office", "bureau"],
  assessment: ["evaluation", "assessment", "bilan", "eligibility", "eligibilite", "profil", "score", "preassessment"],
  booking: ["booking", "billet", "billets", "flight", "flights", "vol", "vols", "hotel", "hotels", "sejour", "stay", "voyage", "travel", "reservation"],
  procedures: ["procedure", "procedures", "demarche", "demarches", "destination", "visa", "immigration"],
  evisas: ["evisa", "e-visa", "electronic visa", "visa electronique"],
  insurance: ["assurance", "insurance", "couverture", "coverage", "travel insurance"],
  translation: ["traduction", "translation", "certifie", "certified", "document"],
  official_sources: ["source", "sources", "official", "officiel", "government", "gouvernement", "ambassade", "embassy"],
  register: ["inscription", "register", "signup", "sign up", "compte", "account"],
  login: ["connexion", "login", "sign in", "connecter", "connect"],
  candidate_space: ["espace", "dashboard", "dossier", "case", "suivi", "tracking"],
};

function linkMatchesQuery(link: SitemapLink, section: SitemapSection, query: string) {
  if (!query) return true;
  const searchable = [
    link.key,
    ...(SITEMAP_SYNONYMS[link.key] ?? []),
    link.label.fr, link.label.en, link.description.fr, link.description.en,
    section.title.fr, section.title.en, section.description.fr, section.description.en,
  ].map(normalize);
  return searchable.some((value) => value.includes(query) || query.includes(value));
}

export default function Sitemap() {
  const { language, setLanguage } = useLanguage();
  const [query, setQuery] = useState("");
  const copy = (value: Copy) => value[language];
  const normalizedQuery = normalize(query);
  const sections = useMemo(() => SITE_SECTIONS.map((section) => ({
    ...section,
    links: section.links.filter((link) => linkMatchesQuery(link, section, normalizedQuery)),
  })).filter((section) => section.links.length > 0), [normalizedQuery]);
  const resultCount = sections.reduce((count, section) => count + section.links.length, 0);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-blue-100 bg-[radial-gradient(circle_at_top_left,_#dbeafe,_#f8fafc_52%,_#eff6ff)]">
        <div className="container py-14 sm:py-18">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">{copy(COPY.eyebrow)}</p>
            <div className="inline-flex rounded-lg border border-blue-200 bg-white p-1" role="group" aria-label="Language selection">
              {(["fr", "en"] as const).map((item) => <button key={item} type="button" onClick={() => setLanguage(item)} aria-pressed={language === item} className={`min-h-9 rounded-md px-3 text-xs font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${language === item ? "bg-blue-700 text-white" : "text-blue-800 hover:bg-blue-50"}`}>{item === "fr" ? "Français" : "English"}</button>)}
            </div>
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{copy(COPY.title)}</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">{copy(COPY.intro)}</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-white/80 p-4 text-sm leading-relaxed text-slate-700 shadow-sm"><UserRound className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" /><p>{copy(COPY.access)}</p></div>
          </div>
          <div className="relative mt-7 max-w-2xl">
            <label htmlFor="sitemap-search" className="sr-only">{copy(COPY.searchLabel)}</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-700" aria-hidden="true" />
            <Input id="sitemap-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy(COPY.searchPlaceholder)} className="h-12 border-blue-200 bg-white pl-12 pr-12 text-base shadow-sm focus-visible:ring-blue-600" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label={copy(COPY.clear)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-600"><X className="h-4 w-4" /></button>}
            {query && <p className="mt-2 text-sm text-slate-600" aria-live="polite">{resultCount} {copy(COPY.results)}</p>}
          </div>
        </div>
      </section>

      <section className="container py-10 sm:py-14">
        {sections.length ? <nav aria-label={copy(COPY.title)} className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return <section key={section.key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start gap-3 border-b border-slate-100 pb-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" aria-hidden="true" /></div><div><h2 className="font-bold text-slate-950">{copy(section.title)}</h2><p className="mt-1 text-sm leading-relaxed text-slate-600">{copy(section.description)}</p></div></div><ul className="mt-4 grid gap-2 sm:grid-cols-2">{section.links.map((link) => <li key={link.key}><Link href={link.href} className="group flex min-h-14 items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-blue-800 outline-none transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:translate-x-1 hover:border-blue-100 hover:bg-blue-50 focus-visible:translate-x-1 focus-visible:border-blue-300 focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"><span><span className="block">{copy(link.label)}</span><span className="mt-0.5 block text-xs font-normal leading-relaxed text-slate-500">{copy(link.description)}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-blue-500 transition-transform duration-200 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true" /></Link></li>)}</ul></section>;
          })}
        </nav> : <div className="rounded-2xl border border-dashed border-blue-200 bg-white p-10 text-center"><Search className="mx-auto h-7 w-7 text-blue-700" aria-hidden="true" /><h2 className="mt-3 font-bold text-slate-950">{copy(COPY.noResultsTitle)}</h2><p className="mt-1 text-sm text-slate-600">{copy(COPY.noResultsText)}</p></div>}

        <aside className="mt-8 grid gap-4 rounded-2xl bg-[#0f2460] p-6 text-white sm:grid-cols-[auto_1fr_auto] sm:items-center"><FileText className="h-7 w-7 text-blue-200" aria-hidden="true" /><div><h2 className="font-bold">{copy(COPY.helpTitle)}</h2><p className="mt-1 text-sm leading-relaxed text-slate-200">{copy(COPY.helpText)}</p></div><Link href="/?project=travail#evaluation-multi" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-blue-800 outline-none transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f2460] motion-reduce:transform-none motion-reduce:transition-none">{copy(COPY.helpCta)}</Link></aside>
      </section>
    </main>
  );
}
