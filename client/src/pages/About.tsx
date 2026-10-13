import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, FileSearch, Globe2, ShieldCheck, UsersRound } from "lucide-react";
import { PublicEvaluationCTA } from "@/components/PublicEvaluationCTA";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import ProofGallerySection from "@/components/ProofGallerySection";
import { getServiceVisual } from "@/data/premiumVisuals";
import { setPageSeo } from "@/lib/pageSeo";

const FOUNDER = {
  name: "Aureol DONFACK",
  role: "Fondateur & PDG",
  organization: "3M Group SARL",
  brand: "3M TRAVEL AGENCY",
  lead: "3M TRAVEL AGENCY est dirigée depuis Yaoundé par Aureol DONFACK (3M Group SARL) : préparer le dossier, expliquer les étapes, et accompagner jusqu’au dépôt — sans promettre la décision des autorités.",
};

const founderJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: FOUNDER.name,
  jobTitle: `${FOUNDER.role} — ${FOUNDER.organization}`,
  worksFor: {
    "@type": "Organization",
    name: FOUNDER.organization,
    alternateName: FOUNDER.brand,
    url: "https://www.3mtravelagency.com",
  },
  url: "https://www.3mtravelagency.com/about",
  description: FOUNDER.lead,
};

const OPERATING_PRINCIPLES = [
  {
    icon: FileSearch,
    title: "Information expliquée",
    text: "Étapes, documents et frais applicables à votre situation, avant toute décision de votre part.",
  },
  {
    icon: UsersRound,
    title: "Suivi humain",
    text: "Un conseiller traite le dossier et confirme les prochaines actions. Rien de sensible n’est automatisé.",
  },
  {
    icon: ShieldCheck,
    title: "Données protégées",
    text: "Vos informations servent le traitement demandé ; les accès documents restent contrôlés.",
  },
  {
    icon: Globe2,
    title: "Sources à confirmer",
    text: "Exigences et délais évoluent. Les points déterminants sont vérifiés auprès des sources officielles.",
  },
];

const PROCESS = [
  "Vous présentez votre projet via l’évaluation gratuite ou à l’agence de Yaoundé.",
  "L’équipe précise le périmètre, les pièces attendues et les honoraires applicables à votre cas.",
  "Vous poursuivez uniquement après avoir reçu ces informations — sans pression.",
  "Visa, admission, assurance ou prestataire : la décision finale reste celle des autorités ou organismes compétents.",
];

export default function About() {
  const heroVisual = getServiceVisual("mobilite");
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setPageSeo({
      title: "À propos | 3M TRAVEL AGENCY",
      description:
        "3M TRAVEL AGENCY à Yaoundé : accompagnement mobilité internationale — évaluation, visas, e-Visas et suivi documentaire, avec validation humaine.",
      image: heroVisual.desktop,
      imageAlt: heroVisual.alt,
    });
  }, [heroVisual.desktop, heroVisual.alt]);

  const fade = {
    hidden: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 18 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.65, delay: 0.08 + i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  return (
    <main className="min-h-screen bg-[#f3f7fd] text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(founderJsonLd) }} />

      {/* Hero plein écran — marque en signal principal, une phrase, un CTA */}
      <section className="relative flex min-h-[88svh] items-end overflow-hidden px-4 pb-16 pt-28 text-white sm:items-center sm:px-6 sm:pb-24 sm:pt-24 lg:px-8">
        <PremiumCoverImage
          visual={heroVisual}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-[42%_28%] sm:object-[48%_32%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061018]/90 via-[#0a2748]/48 to-[#061018]/25 sm:bg-gradient-to-r sm:from-[#061018]/88 sm:via-[#0a2748]/50 sm:to-[#061018]/15" />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <motion.div initial="hidden" animate="visible" variants={fade} custom={0} className="max-w-xl sm:max-w-lg lg:max-w-xl">
            <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-4xl md:text-5xl">
              3M TRAVEL AGENCY
            </h1>
            <p className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-amber-50 sm:text-3xl md:text-4xl">
              Qui sommes-nous
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-blue-50/95 sm:text-lg">
              Cabinet de mobilité internationale à Yaoundé : préparer, expliquer et suivre votre dossier jusqu’au dépôt — études, travail, visas et e-Visas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <PublicEvaluationCTA className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-slate-950 shadow-lg transition hover:bg-amber-400 sm:w-auto">
                Évaluer mon profil gratuitement
                <ArrowRight size={18} aria-hidden="true" />
              </PublicEvaluationCTA>
              <a
                href="#notre-methode"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/35 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/18"
              >
                Notre méthode
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Fondateur — mention discrète, sans portrait (réservé à /about uniquement) */}
      <section
        id="aureol-fondateur"
        aria-labelledby="founder-heading"
        className="scroll-mt-24 border-b border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8"
        data-testid="about-founder"
      >
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#165dff]">Direction</p>
          <h2 id="founder-heading" className="mt-2 text-xl font-semibold tracking-tight text-[#061a36] sm:text-2xl">
            {FOUNDER.name}
          </h2>
          <p className="mt-1 text-sm font-medium text-[#0a3264]">
            {FOUNDER.role} · {FOUNDER.organization}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{FOUNDER.lead}</p>
        </div>
      </section>

      {/* Une section = une intention */}
      <section className="border-y border-slate-200/80 bg-[#061a36] px-4 py-14 text-white sm:px-6 sm:py-16 lg:px-8" aria-labelledby="about-mission-title">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="about-mission-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ce que 3M prépare — ce que les autorités décident
          </h2>
          <p className="mt-4 text-base leading-7 text-blue-100/95 sm:text-lg">
            Nous structurons l’accueil, l’évaluation et le suivi des dossiers. Nous n’inventons ni agrément, ni taux de réussite, ni partenariat institutionnel sans source vérifiable. La décision finale appartient toujours aux organismes compétents.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="principles-heading">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#165dff]">Principes d’accompagnement</p>
            <h2 id="principles-heading" className="mt-3 text-3xl font-semibold tracking-tight text-[#061a36]">
              Quatre règles pour un dossier lisible
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Chaque parcours reste explicable : ce qui est préparé par 3M, ce qui vous revient, et ce qui dépend des autorités.
            </p>
          </div>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {OPERATING_PRINCIPLES.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="border-t border-[#d5a84b]/70 pt-5">
                  <Icon className="h-6 w-6 text-[#165dff]" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold text-[#061a36]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section id="notre-methode" className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="process-heading">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#165dff]">Méthode</p>
            <h2 id="process-heading" className="mt-3 text-3xl font-semibold tracking-tight text-[#061a36]">
              Un accompagnement clair, étape par étape
            </h2>
            <ol className="mt-8 space-y-4">
              {PROCESS.map((step, index) => (
                <li key={step} className="flex gap-4 border-b border-slate-100 pb-4 last:border-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#061a36] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm leading-6 text-slate-700 sm:text-base">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <aside className="rounded-[1.5rem] bg-[#061a36] px-7 py-8 text-white shadow-[0_28px_50px_-30px_rgba(6,26,54,0.55)] sm:px-8">
            <h3 className="text-xl font-semibold tracking-tight">Engagement de transparence</h3>
            <p className="mt-4 text-sm leading-7 text-blue-100">
              Pas de certification, agrément ou note client inventés. Les autorités consulaires, établissements et fournisseurs conservent leurs décisions indépendantes.
            </p>
            <p className="mt-6 text-sm font-semibold text-amber-100">Confirmé avant toute démarche</p>
            <ul className="mt-3 space-y-2.5 text-sm text-blue-50">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d5a84b]" aria-hidden="true" />
                Le service demandé et les documents attendus.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d5a84b]" aria-hidden="true" />
                Honoraires d’agence, frais tiers éventuels et conditions.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d5a84b]" aria-hidden="true" />
                Limites de l’accompagnement et rôle des autorités.
              </li>
            </ul>
          </aside>
        </div>
      </section>

      <ProofGallerySection
        initialFilter="all"
        collapsedCount={3}
        hideWhenEmpty
        className="bg-[#f3f7fd] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        titleFr="Des accompagnements concrets"
        titleEn="Concrete support outcomes"
        leadFr="Extraits anonymisés de visas et autorisations obtenus par des candidats suivis par 3M TRAVEL AGENCY."
        leadEn="Redacted excerpts of visas and authorisations obtained by candidates supported by 3M TRAVEL AGENCY."
      />

      <section className="relative overflow-hidden px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#061a36] via-[#0a3264] to-[#165dff]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(213,168,75,0.22),transparent_50%)]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Parlons de votre projet</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-blue-100">
            Commencez par une évaluation gratuite. Elle n’engage aucune procédure et permet une première orientation humaine par un conseiller 3M.
          </p>
          <PublicEvaluationCTA className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-slate-950 shadow-lg transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061a36]">
            Commencer l’évaluation gratuite
          </PublicEvaluationCTA>
        </div>
      </section>
    </main>
  );
}
