import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plane,
  CheckCircle, ArrowRight,
  Clock, Shield, ChevronUp, Info, MapPin, FileCheck, BookOpen, LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY_PROFILE } from "@/lib/companyContacts";

import HeroSectionVIP from "@/components/HeroSectionVIP";
import { PublicFAQ } from "@/components/PublicFAQ";
import ApprovedReviewsSection from "@/components/ApprovedReviewsSection";
import { ReviewsErrorBoundary } from "@/components/ReviewsErrorBoundary";
import ProofGallerySection from "@/components/ProofGallerySection";
import ServicesOverviewSection from "@/components/ServicesOverviewSection";
import QuickActionsSection from "@/components/QuickActionsSection";
import DestinationsShowcaseSection from "@/components/DestinationsShowcaseSection";
import { SimpleMultiProjectForm } from "@/components/SimpleMultiProjectForm";
import { FlightBookingFAQ } from "@/components/FlightBookingFAQ";

import { EvaluationFormModal } from "@/components/EvaluationFormModal";
import ProfileVerificationModule from "@/components/ProfileVerificationModule";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { CORRIDOR_ROUTES } from "@shared/talentCorridor";
import { PRESENTATION_JOURNEY_INTRO, PRESENTATION_JOURNEY_STEPS } from "@shared/presentationJourney";

const EMPLOYER_PROFILE_DELIVERABLES = [
  { fr: "Un CV actualisé.", en: "An updated CV." },
  { fr: "Une synthèse de l’expérience pertinente pour votre poste.", en: "A summary of experience relevant to your role." },
  { fr: "Les qualifications et justificatifs disponibles.", en: "Available qualifications and supporting documents." },
  { fr: "L’état des vérifications effectuées.", en: "The status of checks already completed." },
  { fr: "Les points restant à confirmer.", en: "Points still to be confirmed." },
  { fr: "La disponibilité du candidat.", en: "The candidate’s availability." },
  { fr: "Un interlocuteur 3M pour organiser les échanges et les entretiens.", en: "A 3M contact to organise exchanges and interviews." },
] as const;

const registrationYear = COMPANY_PROFILE.legalIdentifiers.registration.match(/\b(19|20)\d{2}\b/)?.[0];
const yaoundeOffice = COMPANY_PROFILE.offices.cameroon;

const WHATSAPP_NUMBER = "237698104832";


const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: "easeOut" as const },
  }),
};

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Home() {
  const { t, language } = useLanguage();
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const lang = language === "en" ? "en" : "fr";

  useEffect(() => {
    document.title = "3M TRAVEL AGENCY | Voyages, Visas, Études & Mobilité Internationale";
  }, []);

  useEffect(() => {
    const isNearSection = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      // Masquer la barre si la section cible occupe déjà le viewport (évite le doublon).
      return rect.top < window.innerHeight * 0.72 && rect.bottom > window.innerHeight * 0.28;
    };

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 520);
      const pastHero = window.scrollY > Math.min(480, window.innerHeight * 0.55);
      const nearFormOrFinal = isNearSection("evaluation-multi") || isNearSection("home-final-cta");
      setShowStickyCta(pastHero && !nearFormOrFinal);
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(scrollableHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollableHeight) * 100)) : 0);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    // Ancien ancre #evaluation : rediriger vers le formulaire public unique.
    if (hash !== "#evaluation-multi" && hash !== "#evaluation") return;
    if (hash === "#evaluation") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#evaluation-multi`);
    }
    const scrollToEvaluation = () => {
      document.getElementById("evaluation-multi")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const frame = window.requestAnimationFrame(scrollToEvaluation);
    const retry = window.setTimeout(scrollToEvaluation, 420);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(retry);
    };
  }, []);

  return (
    <main className="min-h-screen bg-white font-sans">
      <div
        className="fixed inset-x-0 top-0 z-[70] h-1 bg-white/20"
        role="progressbar"
        aria-label="Progression du défilement de la page"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(scrollProgress)}
        data-testid="mobile-scroll-progress"
      >
        <div className="h-full origin-left bg-gradient-to-r from-[#d5a84b] via-[#f3c969] to-[#165dff] transition-[width] duration-150 ease-out" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <HeroSectionVIP
        onEvalClick={() => setShowEvalModal(true)}
        logoUrl="/logo-3m.webp"
        whatsappNumber={WHATSAPP_NUMBER}
      />

      <nav
        id="mobile-home-nav"
        aria-label={t("Accès rapides mobile", "Mobile quick links")}
        className="sticky top-0 z-30 flex gap-2 overflow-x-auto border-b border-slate-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur sm:hidden"
      >
        <a href="#quick-actions-title" className="touch-target inline-flex shrink-0 items-center rounded-full bg-blue-900 px-4 text-xs font-bold text-white transition-transform active:scale-[0.97]">
          {t("Démarrer", "Start")}
        </a>
        <a href="#approved-reviews-title" className="touch-target inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-800">
          {t("Avis clients", "Reviews")}
        </a>
        <a href="/procedures" className="touch-target inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-800">
          {t("Procédures", "Procedures")}
        </a>
      </nav>

      {/* Corridor léger — détails B2B plus bas, après preuves/avis. */}
      <section
        id="home-talent-corridor"
        aria-labelledby="home-b2b-title"
        className="border-y border-indigo-100 bg-gradient-to-br from-[#071b3d] via-[#0b2f6f] to-[#1463ff] py-10 md:py-12"
        data-testid="home-talent-corridor"
      >
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-200">{t("Préparation de dossier · canaux autorisés", "File preparation · authorised channels")}</p>
          <h2 id="home-b2b-title" className="mt-2 text-2xl font-black text-white md:text-3xl">{t("3M prépare et suit — les partenaires recrutent", "3M prepares and follows — partners recruit")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-100">
            {t(
              "Dossiers préparés et suivis par 3M. Agences et employeurs vérifiés : canaux de recrutement autorisés.",
              "Files prepared and followed by 3M. Verified agencies and employers: authorised recruitment channels.",
            )}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <a href={CORRIDOR_ROUTES.partnersHub} className="group rounded-2xl border border-white/20 bg-white/95 p-5 transition hover:-translate-y-1 hover:shadow-lg">
              <p className="text-base font-black text-slate-950">{t("Hub partenaires", "Partners hub")}</p>
              <p className="mt-1 text-sm text-slate-600">{t("Candidat, admin 3M, agences et employeurs — un corridor traçable.", "Candidate, 3M admin, agencies and employers — one traceable corridor.")}</p>
              <span className="mt-3 inline-flex items-center text-sm font-bold text-indigo-700">{t("Voir le corridor →", "View the corridor →")}</span>
            </a>
            <a href={CORRIDOR_ROUTES.agencies} className="group rounded-2xl border border-white/20 bg-white/95 p-5 transition hover:-translate-y-1 hover:shadow-lg">
              <p className="text-base font-black text-slate-950">{t("Agences de placement", "Placement agencies")}</p>
              <p className="mt-1 text-sm text-slate-600">{t("Canal autorisé : recevoir des profils consentants et documentés.", "Authorised channel: receive consenting, documented profiles.")}</p>
              <span className="mt-3 inline-flex items-center text-sm font-bold text-indigo-700">{t("Portail agence →", "Agency portal →")}</span>
            </a>
            <a href={CORRIDOR_ROUTES.employers} className="group rounded-2xl border border-white/20 bg-white/95 p-5 transition hover:-translate-y-1 hover:shadow-lg">
              <p className="text-base font-black text-slate-950">{t("Employeurs internationaux", "International employers")}</p>
              <p className="mt-1 text-sm text-slate-600">{t("Sélectionner, décider, renvoyer le retour dans le bon dossier 3M.", "Select, decide, return feedback into the correct 3M file.")}</p>
              <span className="mt-3 inline-flex items-center text-sm font-bold text-amber-700">{t("Portail employeur →", "Employer portal →")}</span>
            </a>
          </div>
          <p className="mt-5 text-center sm:text-left">
            <a href="#home-employer-b2b" className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-200 underline-offset-4 hover:text-white hover:underline">
              {t("Ce que les employeurs reçoivent →", "What employers receive →")}
            </a>
          </p>
        </div>
      </section>

      {/* Intentions dossier / mobilité — vols & annexes en second rang. */}
      <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.48 }} className="mobile-section-transition">
        <QuickActionsSection />
      </motion.div>

      {/* Preuves + avis tôt : confiance avant le détail B2B. */}
      <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.48 }} className="mobile-section-transition">
        <ProofGallerySection />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.48 }} className="mobile-section-transition">
        <ReviewsErrorBoundary>
          <ApprovedReviewsSection />
        </ReviewsErrorBoundary>
      </motion.div>

      {/* B2B détaillé — après réassurance, sans saturer le premier écran. */}
      <section
        id="home-employer-b2b"
        className="border-y border-amber-100 bg-gradient-to-b from-slate-50 to-white py-12 md:py-14"
        data-testid="home-employer-b2b"
        aria-labelledby="home-employer-deliverables-title"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div
            className="min-w-0 rounded-2xl border border-amber-200/70 bg-white p-4 shadow-sm sm:p-6 md:p-8"
            data-testid="home-employer-deliverables"
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">{t("Pour les employeurs", "For employers")}</p>
            <h2 id="home-employer-deliverables-title" className="mt-2 text-xl font-black text-slate-950 md:text-2xl">
              {t("Ce que vous recevez pour chaque profil", "What you receive for each profile")}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {t(
                "Avant toute présentation, un administrateur 3M examine le dossier. Vous ne recevez que des profils préparés, consentants et alignés sur vos critères.",
                "Before any presentation, a 3M administrator reviews the file. You only receive prepared, consenting profiles aligned with your criteria.",
              )}
            </p>
            <ul className="mt-4 grid min-w-0 gap-2.5 sm:mt-5 sm:grid-cols-2">
              {EMPLOYER_PROFILE_DELIVERABLES.map((item) => (
                <li key={item.fr} className="flex items-start gap-2.5 text-sm font-medium leading-6 text-slate-800">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>{item[lang]}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-700">
              {t(
                "Transmettez-nous vos critères : notre équipe examine les profils correspondants avant toute présentation.",
                "Send us your criteria: our team reviews matching profiles before any presentation.",
              )}
            </p>
            <div className="mt-5 flex min-w-0 flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center">
              <a
                href={CORRIDOR_ROUTES.employersRegister}
                data-testid="home-employer-need-cta"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-center text-sm font-black text-[#071b3d] transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 sm:w-auto sm:px-5"
              >
                {t("Transmettre un besoin de recrutement", "Submit a recruitment need")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={CORRIDOR_ROUTES.employersLogin}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-bold text-slate-800 transition hover:border-indigo-300 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 sm:w-auto sm:px-5"
              >
                {t("Déjà vérifié ? Accéder au portail", "Already verified? Open the portal")}
              </a>
            </div>
          </div>

          <div
            className="mt-6 min-w-0 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 sm:mt-8 sm:p-6 md:p-8"
            data-testid="home-presentation-journey"
            aria-labelledby="home-presentation-journey-title"
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{PRESENTATION_JOURNEY_INTRO.badge[lang]}</p>
            <h3 id="home-presentation-journey-title" className="mt-2 text-xl font-black text-slate-950 md:text-2xl">
              {PRESENTATION_JOURNEY_INTRO.title[lang]}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{PRESENTATION_JOURNEY_INTRO.lead[lang]}</p>
            <ol className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2 lg:grid-cols-5">
              {PRESENTATION_JOURNEY_STEPS.map((step) => (
                <li key={step.id} className="min-w-0 rounded-xl border border-white bg-white p-3.5 shadow-sm sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-xs font-black text-white">{step.n}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                          aria-label={lang === "fr" ? `Explication : ${step.short.fr}` : `Explanation: ${step.short.en}`}
                        >
                          <Info className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8} className="max-w-[min(18rem,calc(100vw-2rem))]">
                        <span className="font-bold">{step.short[lang]}</span>
                        <span className="mt-1 block">{step.body[lang]}</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="mt-3 text-sm font-black text-slate-950">{step.title[lang]}</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-600">{step.body[lang]}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <ProfileVerificationModule />

      {/* ─── NOS SERVICES : mobilité internationale, travel et services administratifs/numériques ── */}
      <ServicesOverviewSection />

      {/* ─── PROCÉDURES LES PLUS DEMANDÉES : liens directs vers les pages de service dédiées ── */}
      <section aria-label="Procédures les plus demandées" className="py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-950 text-center mb-2">Depuis l’Afrique vers le monde — parcours les plus demandés</h2>
          <p className="premium-section-lead mx-auto mb-6 text-center">Candidats de tous les pays africains : commencez par la destination qui correspond à votre projet. Chaque fiche détaille les étapes et les documents à préparer.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { href: "/procedures/canada-travail", flag: "🇨🇦", label: "Canada — Travail" },
              { href: "/procedures/canada-etudes", flag: "🇨🇦", label: "Canada — Études" },
              { href: "/procedures/france-etudes", flag: "🇫🇷", label: "Études en France" },
              { href: "/procedures/allemagne-travail", flag: "🇩🇪", label: "Allemagne — Travail" },
              { href: "/evisas", flag: "🌍", label: "e-Visa" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="text-2xl" aria-hidden="true">{item.flag}</span>
                <span className="text-xs font-bold text-slate-800">{item.label}</span>
              </a>
            ))}
          </div>
          <p className="mt-4 text-center">
            <a href="/procedures" className="text-sm font-bold text-blue-700 hover:text-blue-900">Consulter le catalogue des procédures documentées →</a>
          </p>
        </div>
      </section>

      {/* ─── NOS DESTINATIONS : grille des 23 pays de formation/emploi qualifie ── */}
      <DestinationsShowcaseSection />

      {/* ─── ÉVALUATION MULTI-PROJETS : ACTION PRINCIPALE ──────────────────── */}
      <section id="evaluation-multi" className="scroll-mt-24 bg-gradient-to-b from-white to-blue-50 py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <p className="text-sm font-bold text-[#2563eb] uppercase tracking-widest mb-2">Sans engagement · réponse structurée</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Évaluez votre projet avant d’avancer</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Indiquez votre objectif (travail, études ou tourisme) : un conseiller 3M vous oriente sur la bonne procédure, les pièces à préparer et les prochaines étapes — gratuitement.</p>
          </motion.div>
          <SimpleMultiProjectForm />
        </div>
      </section>

      {/* ─── ACCÈS RAPIDES : les contenus détaillés restent sur leurs pages dédiées ─── */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="border-y border-slate-200 bg-slate-50 py-10 md:py-12"
        aria-labelledby="home-quick-access-title"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Pour aller plus loin</p>
              <h2 id="home-quick-access-title" className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">Choisissez votre prochaine étape</h2>
            </div>
            <a href="/procedures" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900">
              Voir toutes les procédures <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a href="/canada#simulateur-crs-canada" className="group rounded-xl border border-blue-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100 focus-within:-translate-y-1 focus-within:border-blue-500 focus-within:shadow-lg">
              <p className="text-sm font-black text-slate-950">Canada · Simulateur CRS</p>
              <p className="premium-copy mt-1.5 text-sm">Score indicatif et estimation rapide — sans remplacer l’évaluation guidée.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">Ouvrir le simulateur CRS Canada <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
            </a>
            <a href="/procedures" className="group rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg hover:shadow-slate-200 focus-within:-translate-y-1 focus-within:border-blue-400 focus-within:shadow-lg">
              <p className="text-sm font-black text-slate-950">Procédures par destination</p>
              <p className="premium-copy mt-1.5 text-sm">Comparer les pays, visas et sources officielles.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">Explorer les destinations <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
            </a>
            <a href="/guide-procedures" className="group rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg hover:shadow-slate-200 focus-within:-translate-y-1 focus-within:border-blue-400 focus-within:shadow-lg" data-testid="home-guide-procedures">
              <p className="text-sm font-black text-slate-950">Guide PDF des procédures</p>
              <p className="premium-copy mt-1.5 text-sm">Bibliothèque travail / études / visiteur — même source que le traitement admin.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">Ouvrir le guide des procédures <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
            </a>
            <a href="/contact" className="group rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg hover:shadow-slate-200 focus-within:-translate-y-1 focus-within:border-blue-400 focus-within:shadow-lg">
              <p className="text-sm font-black text-slate-950">Services et accompagnement</p>
              <p className="premium-copy mt-1.5 text-sm">Parler à l’agence pour un besoin précis.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">Nous contacter <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
            </a>
          </div>
        </div>
      </motion.section>

      {/* ─── POURQUOI 3M : preuves concrètes, pas de slogans vides ─────────── */}
      <section aria-labelledby="why-3m-title" className="py-16 bg-white" data-testid="why-3m-section">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-12">
            <p className="text-sm font-bold text-[#2563eb] uppercase tracking-widest mb-2">Pourquoi 3M TRAVEL AGENCY</p>
            <h2 id="why-3m-title" className="premium-section-title mb-3 text-3xl md:text-4xl">Des preuves concrètes, pas des promesses vagues</h2>
            <p className="premium-section-lead mx-auto text-center">
              Agence enregistrée à Yaoundé{registrationYear ? ` depuis ${registrationYear}` : ""} ({COMPANY_PROFILE.legalIdentifiers.registration}). Nous préparons et suivons votre dossier — la décision finale reste celle des autorités compétentes.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MapPin,
                title: "Agence physique à Yaoundé",
                desc: `${yaoundeOffice.addressLines.join(" · ")}. Accueil en agence ou suivi à distance, WhatsApp ${yaoundeOffice.whatsappDisplay}.`,
                href: "/contact",
                linkLabel: "Voir le contact",
                color: "text-[#1e3a8a] bg-[#dbeafe]",
              },
              {
                icon: FileCheck,
                title: "Dossiers réellement traités",
                desc: "Extraits de dossiers publiés avec données masquées et accord des candidats — pour juger sur du concret.",
                href: "#proof-gallery-title",
                linkLabel: "Voir les preuves",
                color: "text-[#2563eb] bg-[#eff6ff]",
              },
              {
                icon: BookOpen,
                title: "Sources officielles",
                desc: "Chaque procédure s’appuie sur les portails institutionnels : vous savez d’où viennent les exigences.",
                href: "/sources-officielles",
                linkLabel: "Consulter les sources",
                color: "text-[#0369a1] bg-[#e0f2fe]",
              },
              {
                icon: LayoutDashboard,
                title: "Suivi dans votre espace",
                desc: "Étapes, pièces à fournir et messages de l’équipe visibles dans votre espace client sécurisé.",
                href: "/login",
                linkLabel: "Accéder à mon espace",
                color: "text-[#0f766e] bg-[#ccfbf1]",
              },
            ].map((item, i) => (
              <motion.article
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-left transition-colors hover:border-blue-200 hover:bg-white"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.color}`} aria-hidden="true">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-black text-slate-950">{item.title}</h3>
                <p className="premium-copy mt-2 flex-1 text-[0.95rem]">{item.desc}</p>
                <a
                  href={item.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  {item.linkLabel} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </motion.article>
            ))}
          </div>
          <p className="premium-copy mx-auto mt-8 max-w-2xl text-center text-base">
            Besoin d’échanger avant de démarrer ?{" "}
            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour 3M TRAVEL AGENCY, je souhaite en savoir plus sur votre accompagnement.")}`} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 underline-offset-4 hover:underline">
              Écrire sur WhatsApp
            </a>
            {" · "}
            <a href="#evaluation-multi" className="font-bold text-blue-700 underline-offset-4 hover:underline">
              Évaluer mon projet gratuitement
            </a>
          </p>
        </div>
      </section>
      <PublicFAQ />

      <PricingSection />

      <FlightBookingFAQ />

      {/* CTA final unique : une seule action forte avant le footer */}
      <section className="py-16" style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)" }} data-testid="home-final-cta" aria-labelledby="home-final-cta-title">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 id="home-final-cta-title" className="text-3xl font-extrabold text-white md:text-4xl">Prêt à avancer sur votre projet ?</h2>
          <p className="premium-copy-on-dark mx-auto mt-4 max-w-2xl text-lg md:text-xl">
            Évaluez gratuitement votre parcours ou écrivez directement à un conseiller 3M — sans engagement de résultat.
          </p>
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <a href="#evaluation-multi" className="w-full max-w-[22rem] sm:w-auto">
              <Button size="lg" className="min-h-12 w-full bg-white px-8 font-bold text-[#1e3a8a] shadow-xl transition-transform hover:bg-[#dbeafe] active:scale-[0.97]">
                Évaluer mon projet — gratuit <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour 3M TRAVEL AGENCY, je souhaite parler à un conseiller.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-[22rem] sm:w-auto"
            >
              <Button size="lg" variant="outline" className="min-h-12 w-full border-white px-8 font-semibold text-white transition-transform hover:bg-white/10 active:scale-[0.97]">
                WhatsApp conseiller
              </Button>
            </a>
          </div>
          <p className="mt-5 text-sm text-blue-50">
            <a href="/sources-officielles" className="font-semibold underline-offset-4 hover:underline">Sources officielles</a>
            {" · "}
            <a href="/contact" className="font-semibold underline-offset-4 hover:underline">Contact agence</a>
            {" · "}
            <a href="/tarifs" className="font-semibold underline-offset-4 hover:underline">Comprendre les tarifs</a>
          </p>
        </div>
      </section>

      <EvaluationFormModal isOpen={showEvalModal} onClose={() => setShowEvalModal(false)} />

      {showStickyCta && (
        <div
          className="safe-bottom-sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-blue-100 bg-white/95 px-3 pt-2 shadow-[0_-8px_30px_-12px_rgba(15,47,111,0.28)] backdrop-blur md:hidden"
          data-testid="home-sticky-cta"
          role="region"
          aria-label={t("Action rapide d’évaluation", "Quick evaluation action")}
        >
          <div className="mx-auto flex max-w-lg items-center gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <a
              href="#evaluation-multi"
              className="touch-target inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-3 text-center text-sm font-black text-white shadow-md shadow-orange-900/20 transition active:scale-[0.98]"
            >
              {t("Évaluer mon projet — gratuit", "Evaluate my project — free")}
            </a>
          </div>
        </div>
      )}

      {showBackToTop && (
        <button
          type="button"
          aria-label="Retour en haut de la page"
          title="Retour en haut"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`fixed left-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-blue-200 bg-white/95 text-blue-800 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-95 md:bottom-6 md:left-6 ${
            showStickyCta
              ? "bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-6"
              : "bottom-[max(1.5rem,env(safe-area-inset-bottom))]"
          }`}
        >
          <ChevronUp className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </main>
  );
}

// ─── Section Tarifs & Garanties ───────────────────────────────────────────────
function PricingSection() {
  const plans = [
    {
      id: "integral",
      icon: <Plane className="w-7 h-7" />,
      badge: null,
      title: "Règlement Intégral",
      subtitle: "Traitement accéléré",
      color: "from-[#1e3a8a] to-[#2563eb]",
      borderColor: "border-[#2563eb]/30",
      badgeBg: "",
      textAccent: "text-[#7cb9e8]",
      description: "Honoraires d’agence réglés en une fois pour la préparation et le suivi de votre dossier. Les frais consulaires ou médicaux restent à part.",
      features: [
        "Honoraires d’agence clarifiés avant engagement",
        "Suivi personnalisé du dossier",
        "Réponse de l’équipe sous 24h ouvrées (annoncé)",
        "Accompagnement jusqu’au dépôt",
        "Frais tiers (autorités) non inclus",
      ],
      cta: "Demander cette formule",
      highlight: false,
    },
    {
      id: "echelonne",
      icon: <Clock className="w-7 h-7" />,
      badge: "Le plus choisi",
      title: "Échelonné Flexible",
      subtitle: "4 à 5 mois",
      color: "from-[#2563eb] to-[#1d4ed8]",
      borderColor: "border-[#2563eb]",
      badgeBg: "bg-yellow-400 text-yellow-900",
      textAccent: "text-yellow-300",
      description: "Échelonnement des honoraires d’agence sur 4 à 5 mois. Le montant exact et le calendrier sont confirmés avant tout règlement.",
      features: [
        "Honoraires d’agence en plusieurs échéances",
        "Plan adapté après étude de votre cas",
        "Suivi régulier du dossier",
        "Conditions écrites avant paiement",
        "Frais tiers (autorités) non inclus",
      ],
      cta: "Demander cette formule",
      highlight: true,
    },
    {
      id: "differe",
      icon: <Shield className="w-7 h-7" />,
      badge: "Sur éligibilité",
      title: "Paiement Différé",
      subtitle: "Part des honoraires en fin de suivi",
      color: "from-[#059669] to-[#047857]",
      borderColor: "border-emerald-500/40",
      badgeBg: "bg-emerald-400 text-emerald-900",
      textAccent: "text-emerald-300",
      description: "Sous réserve d’éligibilité vérifiée, une part des honoraires d’agence peut être réglée en fin de suivi. Aucun visa n’est garanti.",
      features: [
        "Éligibilité vérifiée avant proposition",
        "Part des honoraires en fin de suivi",
        "Conditions d’éligibilité à confirmer",
        "Décision de visa hors de notre contrôle",
        "Frais tiers (autorités) non inclus",
      ],
      cta: "Vérifier mon éligibilité",
      highlight: false,
    },
  ];

  const phoneNumber = "237698104832";

  return (
    <section id="tarifs" className="py-12 md:py-20 bg-gradient-to-b from-white to-[#f0f6ff]">
      <div className="max-w-7xl mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-bold text-[#2563eb] uppercase tracking-widest mb-2"
          >
            Nos formules
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="premium-section-title mb-4 text-3xl md:text-4xl text-[#1e3a8a]"
          >
            Honoraires d’agence — en toute clarté
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="premium-section-lead mx-auto text-center"
          >
            Ces formules concernent uniquement nos honoraires d’accompagnement. Les frais gouvernementaux, consulaires, médicaux ou biométriques sont distincts et dépendent des autorités.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className={`relative rounded-3xl border-2 ${plan.borderColor} flex flex-col overflow-hidden shadow-lg ${plan.highlight ? "scale-[1.03] shadow-2xl ring-2 ring-[#2563eb]/40" : ""}`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full ${plan.badgeBg}`}>
                  {plan.badge}
                </div>
              )}

              {/* Header coloré */}
              <div className={`bg-gradient-to-br ${plan.color} p-7 text-white`}>
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
                  {plan.icon}
                </div>
                <h3 className="text-xl font-extrabold mb-1">{plan.title}</h3>
                <p className={`text-sm font-semibold ${plan.textAccent}`}>{plan.subtitle}</p>
              </div>

              {/* Corps */}
              <div className="bg-white flex flex-col flex-1 p-7">
                <p className="premium-copy mb-6 text-[0.95rem]">{plan.description}</p>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-[#2563eb] flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(`Bonjour 3M TRAVEL AGENCY ! Je suis intéressé(e) par la formule "${plan.title}". Pouvez-vous me donner plus d'informations ?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3 rounded-xl font-bold text-sm text-center transition-all active:scale-[0.97] block ${
                    plan.highlight
                      ? "bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg shadow-blue-200"
                      : plan.id === "differe"
                      ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                      : "bg-[#1e3a8a] hover:bg-[#1e40af] text-white"
                  }`}
                >
                  {plan.cta} →
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note légale */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-gray-400 mt-8 max-w-2xl mx-auto"
        >
          <Info className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
          Honoraires 3M = accompagnement et suivi. Frais tiers = autorités / prestataires externes. Montants communiqués avant engagement. La décision de visa n’appartient qu’aux autorités compétentes.{" "}
          <a href="/tarifs" className="font-semibold text-blue-700 underline-offset-2 hover:underline">Voir la page tarifs</a>
        </motion.p>
      </div>
    </section>
  );
}
