import { Link } from "wouter";
import { ArrowRight, BookOpen, Compass, FileText, Landmark, ShieldCheck, UserRound } from "lucide-react";

const SITE_SECTIONS = [
  {
    title: "Découvrir 3M Travel",
    description: "Les accès essentiels pour comprendre l’accompagnement, les tarifs et les canaux de contact.",
    icon: Compass,
    links: [
      { label: "Accueil", href: "/", description: "Revenir aux services principaux et à l’évaluation gratuite." },
      { label: "À propos", href: "/about", description: "Découvrir le rôle de conseil et les engagements de transparence." },
      { label: "Tarifs", href: "/tarifs", description: "Comprendre les honoraires, frais tiers et modalités." },
      { label: "Contact", href: "/contact", description: "Contacter l’agence ou consulter les coordonnées des bureaux." },
      { label: "Avis", href: "/avis", description: "Consulter ou soumettre un avis selon le circuit de modération." },
    ],
  },
  {
    title: "Préparer votre projet",
    description: "Les services publics pour commencer une démarche de mobilité, de voyage ou de visa.",
    icon: Landmark,
    links: [
      { label: "Évaluation gratuite", href: "/?project=travail#evaluation-multi", description: "Demander une première orientation sans créer de compte." },
      { label: "3M Booking", href: "/billets", description: "Rechercher des options de billets et de séjour." },
      { label: "Procédures & destinations", href: "/procedures", description: "Comparer les démarches selon le pays et votre projet." },
      { label: "e-Visas", href: "/evisas", description: "Préparer une demande de visa électronique." },
      { label: "Assurance voyage", href: "/assurance", description: "Initier une demande de couverture adaptée au séjour." },
      { label: "Traduction certifiée", href: "/traduction/order", description: "Consulter le parcours de demande de traduction." },
    ],
  },
  {
    title: "Ressources et procédures",
    description: "Les contenus utiles pour préparer un dossier documenté et retrouver les sources institutionnelles.",
    icon: BookOpen,
    links: [
      { label: "Ressources", href: "/ressources", description: "Parcourir les ressources et informations pratiques." },
      { label: "Guide des procédures", href: "/guide-procedures", description: "Accéder à un guide structuré des démarches." },
      { label: "Sources officielles", href: "/sources-officielles", description: "Vérifier les liens gouvernementaux par destination." },
      { label: "Blog", href: "/blog", description: "Lire les articles et mises à jour publiés par l’agence." },
      { label: "Accessibilité", href: "/accessibilite", description: "Ajuster la taille du texte et les préférences de mouvement." },
    ],
  },
  {
    title: "Compte et informations légales",
    description: "Les accès à l’espace personnel et aux informations encadrant l’usage du site.",
    icon: ShieldCheck,
    links: [
      { label: "Créer un compte", href: "/register", description: "Créer un espace candidat pour suivre vos demandes." },
      { label: "Connexion candidat", href: "/login", description: "Accéder à un compte existant." },
      { label: "Espace candidat", href: "/mon-espace", description: "Suivre vos dossiers et documents une fois connecté." },
      { label: "Politique de confidentialité", href: "/politique-confidentialite", description: "Comprendre le traitement des informations personnelles." },
      { label: "Conditions d’utilisation", href: "/conditions-utilisation", description: "Consulter le cadre d’utilisation du site et des services." },
    ],
  },
];

export default function Sitemap() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-blue-100 bg-[radial-gradient(circle_at_top_left,_#dbeafe,_#f8fafc_52%,_#eff6ff)]">
        <div className="container py-14 sm:py-18">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">Navigation complète</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Plan du site 3M Travel &amp; Services</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">Retrouvez chaque service, ressource et espace d’information dans une navigation structurée. Les liens d’aide indiquent leur rôle avant l’ouverture de la page.</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-white/80 p-4 text-sm leading-relaxed text-slate-700 shadow-sm">
              <UserRound className="h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
              <p>Les services publics restent accessibles sans compte lorsque cela est indiqué ; les espaces de suivi demandent une connexion sécurisée.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10 sm:py-14">
        <nav aria-label="Plan du site complet" className="grid gap-5 md:grid-cols-2">
          {SITE_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" aria-hidden="true" /></div>
                  <div>
                    <h2 className="font-bold text-slate-950">{section.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{section.description}</p>
                  </div>
                </div>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="group flex min-h-14 items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-blue-800 outline-none transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:translate-x-1 hover:border-blue-100 hover:bg-blue-50 focus-visible:translate-x-1 focus-visible:border-blue-300 focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none">
                        <span>
                          <span className="block">{link.label}</span>
                          <span className="mt-0.5 block text-xs font-normal leading-relaxed text-slate-500">{link.description}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-blue-500 transition-transform duration-200 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </nav>

        <aside className="mt-8 grid gap-4 rounded-2xl bg-[#0f2460] p-6 text-white sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <FileText className="h-7 w-7 text-blue-200" aria-hidden="true" />
          <div>
            <h2 className="font-bold">Besoin d’une orientation personnalisée ?</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-200">Commencez par l’évaluation gratuite ou contactez l’agence pour être orienté vers le bon service.</p>
          </div>
          <Link href="/?project=travail#evaluation-multi" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-blue-800 outline-none transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f2460] motion-reduce:transform-none motion-reduce:transition-none">Commencer l’évaluation</Link>
        </aside>
      </section>
    </main>
  );
}
