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
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

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
        aria-label="Accès rapides mobile"
        className="sticky top-0 z-30 flex gap-2 overflow-x-auto border-b border-slate-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur sm:hidden"
      >
        <a href="#quick-actions-title" className="touch-target inline-flex shrink-0 items-center rounded-full bg-blue-900 px-4 text-xs font-bold text-white transition-transform active:scale-[0.97]">
          Démarrer
        </a>
        <a href="#approved-reviews-title" className="touch-target inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-800">
          Avis clients
        </a>
        <a href="#evaluation-multi" className="touch-target inline-flex shrink-0 items-center rounded-full border border-blue-200 bg-blue-50 px-4 text-xs font-bold text-blue-800 transition-colors hover:bg-blue-100">
          Évaluer mon projet
        </a>
        <a href="/procedures" className="touch-target inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-800">
          Procédures
        </a>
      </nav>

      {/* ─── QUE VOULEZ-VOUS FAIRE ? : accès direct aux démarches selon l'intention du visiteur ── */}
      <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.48 }} className="mobile-section-transition">
        <QuickActionsSection />
      </motion.div>

      {/* ─── PREUVES + AVIS : réassurance tôt pour convaincre avant le catalogue de services ── */}
      <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.48 }} className="mobile-section-transition">
        <ProofGallerySection />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.48 }} className="mobile-section-transition">
        <ReviewsErrorBoundary>
          <ApprovedReviewsSection />
        </ReviewsErrorBoundary>
      </motion.div>

      <ProfileVerificationModule />

      {/* ─── NOS SERVICES : mobilité internationale, travel et services administratifs/numériques ── */}
      <ServicesOverviewSection />

      {/* ─── PROCÉDURES LES PLUS DEMANDÉES : liens directs vers les pages de service dédiées ── */}
      <section aria-label="Procédures les plus demandées" className="py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-950 text-center mb-2">Les parcours les plus demandés depuis Yaoundé</h2>
          <p className="premium-section-lead mx-auto mb-6 text-center">Commencez par la destination qui correspond à votre projet — chaque fiche détaille les étapes et les documents à préparer.</p>
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
            <a href="/procedures" className="text-sm font-bold text-blue-700 hover:text-blue-900">Voir les 107 procédures par destination →</a>
          </p>
        </div>
      </section>

      {/* ─── NOS DESTINATIONS : grille des 23 pays de formation/emploi qualifie ── */}
      <DestinationsShowcaseSection />

      {/* ─── ÉVALUATION MULTI-PROJETS : ACTION PRINCIPALE ──────────────────── */}
      <section id="evaluation-multi" className="scroll-mt-24 py-12 md:py-16 bg-gradient-to-b from-white to-blue-50">
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
            <a href="/ressources" className="group rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg hover:shadow-slate-200 focus-within:-translate-y-1 focus-within:border-blue-400 focus-within:shadow-lg">
              <p className="text-sm font-black text-slate-950">Ressources et actualités</p>
              <p className="premium-copy mt-1.5 text-sm">Guides, informations pratiques et mises à jour.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">Consulter les ressources <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
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
          aria-label="Actions rapides d’évaluation"
        >
          <div className="mx-auto flex max-w-lg items-center gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <a
              href="#evaluation-multi"
              className="touch-target inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-3 text-center text-sm font-black text-white shadow-md shadow-orange-900/20 transition active:scale-[0.98]"
            >
              Évaluer — gratuit
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour 3M TRAVEL AGENCY, je souhaite parler à un conseiller.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-center text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 active:scale-[0.98]"
            >
              WhatsApp
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
