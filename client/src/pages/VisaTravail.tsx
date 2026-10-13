import { useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  Clock,
  FileText,
  Globe2,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import { PremiumAtmosphere } from "@/components/PremiumAtmosphere";
import { IllustrativeDestinationStrip } from "@/components/IllustrativeDestinationStrip";
import ProofGallerySection from "@/components/ProofGallerySection";
import { getDestinationVisual, getServiceVisual } from "@/data/premiumVisuals";
import { INTERNATIONAL_BRAND } from "@/data/internationalBrand";
import { setPageSeo } from "@/lib/pageSeo";

const DESTINATIONS = [
  {
    flag: "🇨🇦",
    country: "Canada",
    slug: "canada",
    href: "/canada",
    note: "Permis de travail, LMIA / offre d’emploi et voies vers la résidence permanente selon le profil.",
    platform: "Portail IRCC — vérifier chaque exigence avant dépôt",
  },
  {
    flag: "🇩🇪",
    country: "Allemagne",
    slug: "allemagne",
    href: "/procedures/allemagne-travail",
    note: "Emploi qualifié, métiers en tension et formations duales (Ausbildung) selon le parcours.",
    platform: "Make it in Germany / autorités allemandes",
  },
  {
    flag: "🇱🇺",
    country: "Luxembourg",
    slug: "luxembourg",
    href: "/procedures/luxembourg",
    note: "Autorisation de séjour salarié, déclaration ADEM et visa D pour les ressortissants de pays tiers.",
    platform: "Guichet.lu / ADEM",
  },
  {
    flag: "🇫🇷",
    country: "France",
    slug: "france",
    href: "/procedures/france-travail",
    note: "Salarié, talent et titres de séjour liés à un contrat ou à un projet professionnel.",
    platform: "France-Visas / préfecture selon le cas",
  },
  {
    flag: "🇳🇱",
    country: "Pays-Bas",
    slug: "pays-bas",
    href: "/procedures/pays-bas-travail",
    note: "Emploi qualifié et autorisations liées à un contrat néerlandais.",
    platform: "IND / autorités néerlandaises",
  },
  {
    flag: "🇦🇺",
    country: "Australie",
    slug: "australie",
    href: "/procedures/australie-travail",
    note: "Visas qualifiés et voies professionnelles selon le métier et le sponsor.",
    platform: "Home Affairs (AU)",
  },
  {
    flag: "🇶🇦",
    country: "Qatar",
    slug: "qatar",
    href: "/procedures/qatar-travail",
    note: "Contrats sponsorisés et formalités d’entrée liées à l’employeur.",
    platform: "Autorités qataries / employeur",
  },
  {
    flag: "🇬🇧",
    country: "Royaume-Uni",
    slug: "royaume-uni",
    href: "/procedures/royaume-uni-travail",
    note: "Skilled Worker et voies professionnelles sous conditions de sponsor et de salaire.",
    platform: "GOV.UK",
  },
] as const;

const STEPS = [
  {
    number: "1",
    title: "Évaluer votre profil",
    description:
      "Expérience, diplôme, langues et destination cible : nous identifions les parcours réalistes avant toute promesse.",
    icon: FileText,
  },
  {
    number: "2",
    title: "Cibler le bon cadre",
    description:
      "Offre d’emploi, formation duale, métier en tension ou voie permanente : chaque pays a ses règles.",
    icon: Briefcase,
  },
  {
    number: "3",
    title: "Constituer le dossier",
    description:
      "CV, preuves d’expérience, diplômes, contrat ou invitation : nous vérifions les pièces avant dépôt.",
    icon: CheckCircle,
  },
  {
    number: "4",
    title: "Suivre jusqu’à la décision",
    description:
      "Dépôt, biométrie, réponses aux autorités : suivi transparent — la décision reste institutionnelle.",
    icon: ShieldCheck,
  },
] as const;

const REQUIREMENTS = [
  "Passeport valide (souvent 6 mois minimum)",
  "CV et preuves d’expérience professionnelle",
  "Diplômes et relevés, légalisés si exigé",
  "Offre d’emploi, contrat ou invitation employeur",
  "Justificatifs de ressources selon le pays",
  "Assurances et pièces consulaires demandées",
] as const;

const FAQS = [
  {
    question: "Faut-il déjà un employeur pour démarrer ?",
    answer:
      "Pas toujours. Certains parcours exigent une offre d’emploi (Canada LMIA, Skilled Worker UK, Golfe). D’autres s’ouvrent via formation duale, métiers en tension ou évaluation de profil. L’évaluation précise ce qui est réaliste pour vous.",
  },
  {
    question: "3M TRAVEL AGENCY garantit-elle un emploi ou un visa ?",
    answer:
      "Non. Nous préparons et structurons votre dossier. L’emploi, l’admission et le visa relèvent exclusivement de l’employeur et des autorités compétentes.",
  },
  {
    question: "Combien de temps prend une démarche travail ?",
    answer:
      "Les délais varient selon le pays, le type de permis et la période. Nous recommandons d’anticiper plusieurs mois et de confirmer les délais sur les portails officiels.",
  },
  {
    question: "Puis-je viser le Canada et l’Europe en parallèle ?",
    answer:
      "Oui, sous réserve de cohérence de profil et de charge documentaire. L’évaluation aide à prioriser sans disperser le dossier.",
  },
  {
    question: "Quelle est la différence avec le parcours études ?",
    answer:
      "Le parcours travail s’appuie sur l’employabilité et les autorisations de travailler. Les études passent par l’admission scolaire puis le visa étudiant. Les deux peuvent se relayer (études puis post-graduation), mais ce ne sont pas les mêmes pièces.",
  },
] as const;

export default function VisaTravail() {
  const heroVisual = getServiceVisual("travail");

  useEffect(() => {
    setPageSeo({
      title: "Visa travail & mobilité professionnelle | 3M TRAVEL AGENCY",
      description:
        "Corridor Afrique → Canada, Europe et Golfe : évaluation, dossier employeur et préparation des autorisations de travail — sans promesse d’emploi ou de visa.",
      image: heroVisual.desktop,
      imageAlt: "3M TRAVEL AGENCY — mobilité professionnelle internationale",
    });
  }, [heroVisual.desktop]);

  return (
    <PremiumAtmosphere washVisual={heroVisual} washOpacity={16}>
    <main className="min-h-screen text-slate-900">
      <section className="relative min-h-[72vh] overflow-hidden px-4 pb-16 pt-20 text-white sm:min-h-[78vh] sm:px-6 sm:pb-20 lg:px-8">
        <PremiumCoverImage
          visual={{ ...heroVisual, alt: "3M TRAVEL AGENCY — travailler à l’international" }}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#041428]/94 via-[#0a3264]/72 to-[#0e5b9f]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#041428]/80 via-transparent to-[#041428]/35" />
        <div className="relative z-10 mx-auto flex min-h-[56vh] max-w-6xl flex-col justify-end sm:min-h-[62vh]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-[Georgia,Cambria,'Times_New_Roman',serif] text-3xl font-normal tracking-tight text-amber-200 sm:text-4xl lg:text-5xl">
              {INTERNATIONAL_BRAND.publicName}
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100/90">{INTERNATIONAL_BRAND.corridor}</p>
            <h1 className="mt-4 max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Travailler à l’international, dossier maîtrisé
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50/95 sm:text-lg">
              Canada, Europe et Golfe : évaluation de profil, pièces employeur et préparation des autorisations — chaque exigence reste à confirmer auprès des autorités compétentes. Aucun emploi n’est promis.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/?project=travail#evaluation-multi"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-lg transition hover:bg-blue-50"
                data-testid="travail-eval-cta"
              >
                {INTERNATIONAL_BRAND.cta.evaluate.fr}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#destinations-travail"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-amber-300/60 bg-amber-400/15 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-400/25"
              >
                {INTERNATIONAL_BRAND.cta.destinations.fr}
              </a>
              <Link
                href="/ressources"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Bibliothèque PDF pays
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <IllustrativeDestinationStrip
        title="Corridors travail en images"
        lead="Catalogue premium 3M — Europe, Canada et Golfe pour situer l’ambiance de chaque marché."
        destinations={[
          { slug: "canada", flag: "🇨🇦", label: "Canada", href: "/canada" },
          { slug: "allemagne", flag: "🇩🇪", label: "Allemagne", href: "/procedures/allemagne-formation" },
          { slug: "luxembourg", flag: "🇱🇺", label: "Luxembourg", href: "/procedures/luxembourg" },
          { slug: "emirats", flag: "🇦🇪", label: "Émirats", href: "/ressources/emirats" },
          { slug: "qatar", flag: "🇶🇦", label: "Qatar", href: "/procedures/qatar-travail" },
          { slug: "france", flag: "🇫🇷", label: "France", href: "/etudes" },
        ]}
        className="border-b border-slate-200/60 bg-white/45"
      />

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-14 sm:px-6 lg:px-8">
        <section id="destinations-travail" aria-labelledby="destinations-travail-title">
          <h2 id="destinations-travail-title" className="text-2xl font-black text-slate-950 sm:text-3xl">
            Destinations travail prioritaires
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Huit corridors fréquemment demandés depuis Yaoundé — ouvrez la fiche procédure ou le guide Canada.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DESTINATIONS.map((destination, index) => {
              const visual = getDestinationVisual(destination.slug) ?? heroVisual;
              return (
                <motion.div
                  key={destination.slug}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.28) }}
                >
                  <Link
                    href={destination.href}
                    className="group relative flex min-h-[260px] flex-col justify-end overflow-hidden text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                    data-testid={`travail-destination-${destination.slug}`}
                  >
                    <PremiumCoverImage
                      visual={{ ...visual, alt: `3M TRAVEL AGENCY — travail ${destination.country}` }}
                      className="absolute inset-0"
                      imgClassName="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#041428]/95 via-[#0a3264]/40 to-transparent" />
                    <div className="relative z-10 p-4">
                      <p className="text-2xl leading-none" aria-hidden="true">{destination.flag}</p>
                      <h3 className="mt-2 text-lg font-black tracking-tight">{destination.country}</h3>
                      <p className="mt-1 text-xs leading-5 text-blue-100">{destination.note}</p>
                      <p className="mt-2 text-[11px] font-semibold text-amber-200">{destination.platform}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.12em] text-amber-100">
                        Ouvrir <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="etapes-travail-title">
          <h2 id="etapes-travail-title" className="text-2xl font-black text-slate-950 sm:text-3xl">
            Comment ça marche
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Quatre étapes claires — sans promesse d’emploi, d’admission ou de visa.
          </p>
          <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.li
                  key={step.number}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="border-b border-slate-200/80 pb-5"
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">Étape {step.number}</p>
                  <Icon className="mt-3 h-7 w-7 text-blue-800" aria-hidden="true" />
                  <h3 className="mt-3 text-base font-black text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                </motion.li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="pieces-travail-title" className="border-t border-slate-200/80 pt-12">
          <h2 id="pieces-travail-title" className="text-2xl font-black text-slate-950 sm:text-3xl">
            Pièces souvent demandées
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            La liste exacte dépend du pays et du type de permis — elle est confirmée après évaluation.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {REQUIREMENTS.map((item) => (
              <li key={item} className="flex items-start gap-3 border-b border-slate-200/70 py-3 text-sm text-slate-700">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="pourquoi-travail-title" className="border-t border-slate-200/80 pt-12">
          <h2 id="pourquoi-travail-title" className="text-2xl font-black text-slate-950 sm:text-3xl">
            Pourquoi 3M TRAVEL AGENCY
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div className="flex gap-3">
              <Users className="h-8 w-8 shrink-0 text-blue-800" aria-hidden="true" />
              <div>
                <h3 className="font-black text-slate-950">Conseiller dédié</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">Un interlocuteur pour le suivi, joignable aussi par WhatsApp.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe2 className="h-8 w-8 shrink-0 text-blue-800" aria-hidden="true" />
              <div>
                <h3 className="font-black text-slate-950">Corridor international</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">Canada, Schengen, Golfe et partenaires B2B pour les profils sélectionnables.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="h-8 w-8 shrink-0 text-blue-800" aria-hidden="true" />
              <div>
                <h3 className="font-black text-slate-950">Suivi transparent</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">Vous voyez l’étape en cours — même logique admin et espace candidat.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="h-8 w-8 shrink-0 text-blue-800" aria-hidden="true" />
              <div>
                <h3 className="font-black text-slate-950">Vérification avant dépôt</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">Relecture des pièces pour limiter les refus évitables — sans garantie de résultat.</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="faq-travail-title" className="border-t border-slate-200/80 pt-12">
          <h2 id="faq-travail-title" className="text-2xl font-black text-slate-950 sm:text-3xl">
            Questions fréquentes
          </h2>
          <Accordion type="single" collapsible className="mt-6 space-y-2">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`} className="border-b border-slate-200 px-0">
                <AccordionTrigger className="text-left text-sm font-bold text-slate-900 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-slate-600">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="border-t border-slate-200/80 pt-12 text-center">
          <h2 className="text-2xl font-black text-slate-950">Prêt à cadrer votre projet travail ?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Évaluation gratuite, sans engagement — orientation selon votre profil réel.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/?project=travail#evaluation-multi"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-900"
            >
              Faire mon évaluation
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="https://wa.me/237698104832?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20le%20visa%20travail."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-5 py-3 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Poser une question
            </a>
          </div>
        </section>
      </div>

      <ProofGallerySection
        initialFilter="immigration"
        lockFilter
        collapsedCount={3}
        hideWhenEmpty
        className="bg-slate-50/70 px-4 py-16 sm:px-6"
        titleFr="Preuves de dossiers de mobilité"
        titleEn="Mobility file proofs"
        leadFr="Autorisations et visas obtenus par des candidats accompagnés — pour illustrer le suivi, sans garantir un emploi ou un visa."
        leadEn="Authorisations and visas obtained by accompanied candidates — to illustrate follow-up, without guaranteeing a job or visa."
      />
    </main>
    </PremiumAtmosphere>
  );
}
