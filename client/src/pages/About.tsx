import { useEffect } from "react";
import { ArrowUpRight, CheckCircle2, Facebook, FileSearch, Globe2, Linkedin, ShieldCheck, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PublicEvaluationCTA } from "@/components/PublicEvaluationCTA";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import ProofGallerySection from "@/components/ProofGallerySection";
import { SocialShareButtons } from "@/components/SocialShareButtons";
import { getServiceVisual } from "@/data/premiumVisuals";
import { setPageSeo } from "@/lib/pageSeo";
import {
  BRAND_PUBLIC_NAME,
  COMPANY_FOUNDER,
  COMPANY_PROFILE,
  GROUP_LEGAL_NAME,
  COMPANY_CONTACTS,
} from "@/lib/companyContacts";

const FOUNDER = COMPANY_FOUNDER;
const SITE_ORIGIN = COMPANY_PROFILE.website;

const founderJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_ORIGIN}/about#aureol-donfack`,
      name: FOUNDER.name,
      givenName: FOUNDER.givenName,
      familyName: FOUNDER.familyName,
      jobTitle: `${FOUNDER.jobTitle} — ${GROUP_LEGAL_NAME}`,
      image: [
        `${SITE_ORIGIN}${FOUNDER.imageHd}`,
        `${SITE_ORIGIN}${FOUNDER.imageJpg}`,
        `${SITE_ORIGIN}${FOUNDER.imageWebp}`,
        `${SITE_ORIGIN}${FOUNDER.imageSquare}`,
      ],
      url: `${SITE_ORIGIN}${FOUNDER.aboutPath}`,
      mainEntityOfPage: `${SITE_ORIGIN}${FOUNDER.aboutPath}`,
      description: FOUNDER.description,
      knowsAbout: ["mobilité internationale", "visas", "immigration", GROUP_LEGAL_NAME, BRAND_PUBLIC_NAME],
      worksFor: { "@id": `${SITE_ORIGIN}/#organization` },
      affiliation: { "@id": `${SITE_ORIGIN}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_ORIGIN}/#organization`,
      name: GROUP_LEGAL_NAME,
      legalName: GROUP_LEGAL_NAME,
      alternateName: [BRAND_PUBLIC_NAME, COMPANY_PROFILE.legalName],
      url: SITE_ORIGIN,
      founder: { "@id": `${SITE_ORIGIN}/about#aureol-donfack` },
      employee: { "@id": `${SITE_ORIGIN}/about#aureol-donfack` },
      identifier: [
        COMPANY_PROFILE.legalIdentifiers.registration,
        COMPANY_PROFILE.legalIdentifiers.taxpayerId,
      ],
    },
    {
      "@type": "AboutPage",
      "@id": `${SITE_ORIGIN}/about#webpage`,
      url: `${SITE_ORIGIN}${FOUNDER.aboutPath}`,
      name: `${FOUNDER.name}, fondateur et PDG de ${GROUP_LEGAL_NAME}`,
      description: FOUNDER.description,
      mainEntity: { "@id": `${SITE_ORIGIN}/about#aureol-donfack` },
      about: { "@id": `${SITE_ORIGIN}/about#aureol-donfack` },
    },
  ],
};

const OPERATING_PRINCIPLES = [
  {
    icon: FileSearch,
    title: "Information expliquée",
    text: "Les étapes, documents et frais applicables sont précisés pour votre situation avant toute décision de votre part.",
  },
  {
    icon: UsersRound,
    title: "Suivi humain",
    text: "Un conseiller traite le dossier et confirme les prochaines actions ; aucune décision administrative sensible n’est automatisée.",
  },
  {
    icon: ShieldCheck,
    title: "Données protégées",
    text: "Les informations transmises sont utilisées pour le traitement demandé et les documents restent soumis à des contrôles d’accès.",
  },
  {
    icon: Globe2,
    title: "Sources à confirmer",
    text: "Les exigences et délais peuvent évoluer. Les éléments déterminants sont vérifiés auprès des sources officielles concernées avant soumission.",
  },
];

const PROCESS = [
  "Vous présentez votre projet par le formulaire gratuit ou à l’agence.",
  "L’équipe confirme le périmètre, les documents attendus et les honoraires applicables à votre cas.",
  "Vous choisissez de poursuivre uniquement après avoir reçu les informations nécessaires.",
  "Les décisions de visa, permis, admission, assurance ou fournisseur restent prises par les autorités ou organismes compétents.",
];

const FOUNDER_PUBLICATIONS = [
  {
    label: "Publication de référence",
    title: "Le fondateur et la méthode 3M TRAVEL AGENCY",
    text: "Une présentation publique de la direction, du groupe et des principes de transparence qui encadrent l’accompagnement des projets de mobilité internationale.",
    href: "/about#aureol-donfack",
    linkLabel: "Lire la présentation du fondateur",
  },
  {
    label: "Ressource publique",
    title: "Les ressources pays et les sources officielles",
    text: "La bibliothèque pays rassemble des repères documentaires, des étapes et des liens officiels à vérifier avant toute démarche.",
    href: "/ressources",
    linkLabel: "Consulter la bibliothèque pays",
  },
  {
    label: "Actualité éditoriale",
    title: "Préparer et suivre un projet de travail international",
    text: "Le hub Travail présente les corridors, les étapes et les pièces à anticiper, sans promettre d’emploi, de visa ou d’admission.",
    href: "/travail",
    linkLabel: "Découvrir le hub Travail",
  },
] as const;

export default function About() {
  const heroVisual = getServiceVisual("mobilite");

  useEffect(() => {
    setPageSeo({
      title: `${FOUNDER.name}, fondateur PDG ${GROUP_LEGAL_NAME} | ${BRAND_PUBLIC_NAME}`,
      description: FOUNDER.description,
      image: FOUNDER.imageHd,
      imageAlt: FOUNDER.imageAlt,
    });
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(founderJsonLd) }} />
      <section className="relative overflow-hidden px-4 pb-16 pt-20 text-white sm:px-6 lg:px-8">
        <PremiumCoverImage
          visual={heroVisual}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-center opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061a36]/92 via-[#0a3264]/80 to-[#0e5b9f]/55" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <p className="font-[Georgia,Cambria,'Times_New_Roman',serif] text-3xl font-normal tracking-tight text-amber-200 sm:text-4xl">
            {BRAND_PUBLIC_NAME}
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            {FOUNDER.name}, fondateur et PDG de {GROUP_LEGAL_NAME}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-50">
            {BRAND_PUBLIC_NAME} accompagne les particuliers, entreprises et professionnels dans la préparation de projets de mobilité internationale&nbsp;: procédures, visas, eVisas, voyages, documents et services connexes.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-blue-100/90">
            Sous la direction d’{FOUNDER.name}, fondateur et PDG de {GROUP_LEGAL_NAME}, nous présentons notre mode d’accompagnement — et non des résultats garantis. Chaque dossier est examiné selon sa situation, les exigences applicables et les décisions des organismes compétents.
          </p>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="founder-heading" id="aureol-donfack">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
            <picture>
              <source srcSet={FOUNDER.imageWebp} type="image/webp" />
              <img
                src={FOUNDER.imageJpg}
                alt={FOUNDER.imageAlt}
                title={`${FOUNDER.name} — ${FOUNDER.jobTitle}, ${GROUP_LEGAL_NAME}`}
                width={1152}
                height={864}
                loading="eager"
                decoding="async"
                className="aspect-[4/3] h-auto w-full object-cover object-center"
              />
            </picture>
            <figcaption className="border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <strong className="font-black text-slate-950">{FOUNDER.name}</strong>
              {" — "}
              {FOUNDER.jobTitle}, {GROUP_LEGAL_NAME} ({BRAND_PUBLIC_NAME})
            </figcaption>
          </figure>
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">Direction · {GROUP_LEGAL_NAME}</p>
            <h2 id="founder-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {FOUNDER.name}
            </h2>
            <p className="mt-2 text-lg font-bold text-blue-800">
              {FOUNDER.jobTitle} · {GROUP_LEGAL_NAME}
            </p>
            <p className="premium-copy mt-5 text-base leading-7">{FOUNDER.description}</p>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Sous sa direction, {BRAND_PUBLIC_NAME} ({COMPANY_PROFILE.legalName}) structure l’accueil, l’évaluation et le suivi des dossiers depuis Yaoundé, avec un accent sur la clarté des honoraires, le consentement des candidats et la vérification humaine avant toute remise d’accès partenaires.
            </p>
            <dl className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Fondateur</dt>
                <dd className="mt-1 font-bold text-slate-950">{FOUNDER.name}</dd>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Groupe</dt>
                <dd className="mt-1 font-bold text-slate-950">{GROUP_LEGAL_NAME}</dd>
              </div>
            </dl>
            <div className="mt-7 flex flex-wrap gap-3" aria-label="Réseaux et partage du profil du fondateur">
              <SocialShareButtons title={`${FOUNDER.name}, fondateur et PDG de ${GROUP_LEGAL_NAME}`} className="w-full" />
              <a
                href={COMPANY_CONTACTS.yaounde.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contacter 3M TRAVEL AGENCY sur WhatsApp, nouvel onglet"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-700 bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              >
                <span aria-hidden="true">WhatsApp</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://www.facebook.com/3mtravelcm"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Suivre la page Facebook officielle de 3M TRAVEL AGENCY, nouvel onglet"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-800 bg-blue-800 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2"
              >
                <Facebook className="h-4 w-4" aria-hidden="true" />
                <span>Facebook officiel</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fwww.3mtravelagency.com%2Fabout%23aureol-donfack"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Partager le profil du fondateur sur LinkedIn, nouvel onglet"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#0A66C2] bg-white px-3 py-2 text-xs font-bold text-[#084f96] shadow-sm transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-2"
              >
                <Linkedin className="h-4 w-4 text-[#0A66C2]" aria-hidden="true" />
                <span>Partager sur LinkedIn</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-blue-50/70 px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="founder-publications-heading">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">Actualités & publications</p>
          <h2 id="founder-publications-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Les publications récentes de {FOUNDER.name}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
            Cette sélection renvoie uniquement vers des pages publiques de {BRAND_PUBLIC_NAME}. Elle présente les sujets éditoriaux portés par la direction ; elle ne constitue ni une promesse de résultat ni une actualité institutionnelle indépendante.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {FOUNDER_PUBLICATIONS.map((publication) => (
              <article key={publication.href} className="flex h-full flex-col rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[.14em] text-blue-700">{publication.label}</p>
                <h3 className="mt-3 text-xl font-black text-slate-950">{publication.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{publication.text}</p>
                <a href={publication.href} className="mt-5 inline-flex min-h-10 items-center gap-2 self-start rounded-xl border border-blue-700 px-3 py-2 text-sm font-bold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
                  {publication.linkLabel}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="operating-principles-heading">
        <div className="mx-auto max-w-6xl">
          <h2 id="operating-principles-heading" className="sr-only">Les principes de fonctionnement de 3M TRAVEL AGENCY</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {OPERATING_PRINCIPLES.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-slate-200 p-6 shadow-sm">
                  <Icon className="h-7 w-7 text-blue-700" aria-hidden="true" />
                  <h2 className="mt-4 text-lg font-black text-slate-950">{item.title}</h2>
                  <p className="premium-copy mt-2 text-[0.95rem]">{item.text}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="process-heading">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">Notre manière de travailler</p>
            <h2 id="process-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950">Un accompagnement clair, étape par étape</h2>
            <ol className="mt-8 space-y-4">
              {PROCESS.map((step, index) => (
                <li key={step} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-black text-white">{index + 1}</span>
                  <span className="text-sm leading-6 text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <Card className="border-blue-100 bg-blue-950 p-8 text-white shadow-xl">
            <h2 className="text-2xl font-black">Engagement de transparence</h2>
            <p className="mt-4 text-sm leading-7 text-blue-100">
              Nous ne présentons pas de certification, agrément, partenariat institutionnel, volume de dossiers, note client ou taux de réussite sans source vérifiable et autorisation adaptée. Les autorités consulaires, établissements et fournisseurs conservent leurs décisions indépendantes.
            </p>
            <div className="mt-6 border-t border-white/15 pt-6">
              <p className="text-sm font-bold text-white">Ce qui est confirmé avant toute démarche</p>
              <ul className="mt-3 space-y-2 text-sm text-blue-100">
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Le service demandé et les documents attendus.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Les honoraires d’agence, les frais tiers éventuels et leurs conditions.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Les limites de l’accompagnement et la responsabilité des autorités compétentes.</li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      <ProofGallerySection
        initialFilter="all"
        collapsedCount={3}
        hideWhenEmpty
        className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        titleFr="Des accompagnements concrets"
        titleEn="Concrete support outcomes"
        leadFr="Extraits anonymisés de visas et autorisations obtenus par des candidats suivis par 3M TRAVEL AGENCY."
        leadEn="Redacted excerpts of visas and authorisations obtained by candidates supported by 3M TRAVEL AGENCY."
      />

      <section className="bg-slate-950 px-4 py-16 text-center sm:px-6 lg:px-8" aria-labelledby="about-final-cta-heading">
        <h2 id="about-final-cta-heading" className="text-3xl font-black text-white">Parlons de votre projet</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300">Commencez par une évaluation gratuite. Elle n’engage aucune procédure et permet de recevoir une première orientation humaine.</p>
        <PublicEvaluationCTA className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-900 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
          Commencer l’évaluation gratuite
        </PublicEvaluationCTA>
      </section>
    </main>
  );
}
