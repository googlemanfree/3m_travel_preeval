import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Plane, Mail,
  CheckCircle2, CheckCircle, ArrowRight, Users,
  Clock, Shield, ChevronUp, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

import HeroSectionVIP from "@/components/HeroSectionVIP";
import { PublicFAQ } from "@/components/PublicFAQ";
import ApprovedReviewsSection from "@/components/ApprovedReviewsSection";
import { ReviewsErrorBoundary } from "@/components/ReviewsErrorBoundary";
import ProofGallerySection from "@/components/ProofGallerySection";
import ServicesOverviewSection from "@/components/ServicesOverviewSection";
import QuickActionsSection from "@/components/QuickActionsSection";
import DestinationsShowcaseSection from "@/components/DestinationsShowcaseSection";
import { SimpleMultiProjectForm } from "@/components/SimpleMultiProjectForm";
import { SimulatorRetryBoundary } from "@/components/SimulatorRetryBoundary";
import { FlightBookingFAQ } from "@/components/FlightBookingFAQ";

import { EvaluationFormModal } from "@/components/EvaluationFormModal";
import ProfileVerificationModule from "@/components/ProfileVerificationModule";

const createSimulatorExpress = () => lazy(() => import("@/components/SimulatorExpress").then((module) => ({ default: module.SimulatorExpress })));

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
  const [showExpressSimulator, setShowExpressSimulator] = useState(false);
  const [expressSimulatorAttempt, setExpressSimulatorAttempt] = useState(0);
  const SimulatorExpress = useMemo(createSimulatorExpress, [expressSimulatorAttempt]);
  const reportSimulatorFailure = trpc.simulatorDiagnostics.reportFailure.useMutation();
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    document.title = "3M Travel & Services | Voyages, Visas, Études & Mobilité Internationale";
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 520);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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

  const contactMutation = trpc.contact.sendContactEmail.useMutation({
    onSuccess: () => {
      toast.success("Votre message a bien été envoyé.");
      setContactForm({ name: "", email: "", message: "" });
    },
    onError: error => toast.error(error.message || "Impossible d’envoyer votre message."),
  });

  const handleContactSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    contactMutation.mutate({
      name: contactForm.name,
      email: contactForm.email,
      subject: "Demande depuis la page d’accueil",
      message: contactForm.message,
    });
  };

  return (
    <main className="min-h-screen bg-white font-sans">

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}

      {/* ─── HERO ────────────────────────────────────────────────────────── */}
      <HeroSectionVIP
        onEvalClick={() => setShowEvalModal(true)}
        logoUrl="/logo-3m.webp"
        whatsappNumber={WHATSAPP_NUMBER}
      />

      {/* ─── QUE VOULEZ-VOUS FAIRE ? : accès direct aux démarches selon l'intention du visiteur ── */}
      <QuickActionsSection />

      {/* ─── PREUVES + AVIS : réassurance tôt pour convaincre avant le catalogue de services ── */}
      <ProofGallerySection />

      <ReviewsErrorBoundary>
        <ApprovedReviewsSection />
      </ReviewsErrorBoundary>

      <ProfileVerificationModule />

      {/* ─── NOS SERVICES : mobilité internationale, travel et services administratifs/numériques ── */}
      <ServicesOverviewSection />

      {/* ─── PROCÉDURES LES PLUS DEMANDÉES : liens directs vers les pages de service dédiées ── */}
      <section aria-label="Procédures les plus demandées" className="py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-950 text-center mb-2">Les parcours les plus demandés depuis Yaoundé</h2>
          <p className="mb-6 text-center text-sm text-slate-600 md:text-base">Commencez par la destination qui correspond à votre projet — chaque fiche détaille les étapes et les documents à préparer.</p>
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
              <p className="text-sm font-black text-slate-950">Canada</p>
              <p className="mt-1 text-sm text-slate-600">Calculez votre score indicatif avant d’explorer les parcours.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">Ouvrir le simulateur CRS Canada <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
            </a>
            <a href="/procedures" className="group rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg hover:shadow-slate-200 focus-within:-translate-y-1 focus-within:border-blue-400 focus-within:shadow-lg">
              <p className="text-sm font-black text-slate-950">Procédures par destination</p>
              <p className="mt-1 text-sm text-slate-600">Comparer les pays, visas et sources officielles.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">Explorer les destinations <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
            </a>
            <a href="/ressources" className="group rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg hover:shadow-slate-200 focus-within:-translate-y-1 focus-within:border-blue-400 focus-within:shadow-lg">
              <p className="text-sm font-black text-slate-950">Ressources et actualités</p>
              <p className="mt-1 text-sm text-slate-600">Guides, informations pratiques et mises à jour.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">Consulter les ressources <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
            </a>
            <a href="/contact" className="group rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg hover:shadow-slate-200 focus-within:-translate-y-1 focus-within:border-blue-400 focus-within:shadow-lg">
              <p className="text-sm font-black text-slate-950">Services et accompagnement</p>
              <p className="mt-1 text-sm text-slate-600">Parler à l’agence pour un besoin précis.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">Nous contacter <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
            </a>
          </div>
        </div>
      </motion.section>

      {/* ─── POURQUOI NOUS ───────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm font-bold text-[#2563eb] uppercase tracking-widest mb-2">Pourquoi nous choisir</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">L'expertise à votre service</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield,       title: "Expertise réglementée",      desc: "Professionnels experts en visa et immigration internationale",   color: "text-[#1e3a8a] bg-[#dbeafe]" },
              { icon: Users,        title: "Accompagnement personnalisé", desc: "Analyse de votre profil pour des solutions sur mesure",         color: "text-[#2563eb] bg-[#eff6ff]" },
              { icon: Clock,        title: "Réponse rapide",              desc: "Retour de nos experts sous 24h après soumission",               color: "text-[#0369a1] bg-[#e0f2fe]" },
              { icon: CheckCircle2, title: "Suivi transparent",           desc: "Étapes, pièces à fournir et échéances visibles dans votre espace client", color: "text-[#7cb9e8] bg-[#f0f9ff]" },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp} className="text-center p-6">
                <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* ─── TÉMOIGNAGES ─────────────────────────────────────────────────── */}
      <PublicFAQ />

      {/* --- TARIFS & GARANTIES --- */}
      <PricingSection />

      {/* --- CTA --- */}
      <section className="py-16" style={{ background: 'linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Prêt à réaliser votre projet ?</h2>
          <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">Contactez nos experts dès aujourd'hui pour une consultation gratuite et personnalisée.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#evaluation-multi">
              <Button size="lg" className="bg-white hover:bg-[#dbeafe] text-[#1e3a8a] font-bold shadow-xl px-8 active:scale-[0.97] transition-transform">
                Évaluer mon projet — gratuit <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="mailto:hello@3mtravelagency.com">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold px-8 active:scale-[0.97] transition-transform">
                <Mail className="w-4 h-4 mr-2" />Nous écrire
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── ASSISTANCE & TRANSPARENCE (avant le footer global) ─────────────── */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <p className="text-sm font-bold text-[#2563eb] uppercase tracking-widest mb-2">Assistance & transparence</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Préparez votre démarche avec les bonnes informations</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Consultez les sources institutionnelles, posez une question à l’agence et retrouvez toutes les coordonnées dans le footer unique ci-dessous.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10"
          >
            <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-5 rounded-2xl border border-blue-100 bg-white p-6 text-center md:flex-row md:text-left">
              <div>
                <p className="font-bold text-slate-900">Une information claire avant toute décision</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Les exigences, frais et délais relèvent des autorités compétentes et peuvent évoluer. Notre rôle est de vous accompagner dans vos démarches.</p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-center gap-3">
                <a href="/sources-officielles"><Button variant="outline" className="border-blue-200 text-blue-800">Sources officielles</Button></a>
                <a href="/contact"><Button className="bg-blue-700 hover:bg-blue-800">Contacter l’agence</Button></a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <details className="mx-auto max-w-xl rounded-2xl border border-blue-100 bg-white p-5">
              <summary className="cursor-pointer list-none text-center font-bold text-slate-900">Envoyer une question à l’agence</summary>
              <div className="mt-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h4 className="font-semibold text-gray-900 mb-4">Envoyez-nous un message</h4>
                <form className="space-y-4" onSubmit={handleContactSubmit}>
                  <div>
                    <Label htmlFor="contact-name" className="text-sm font-medium text-gray-700 mb-1 block">
                      Votre nom
                    </Label>
                    <Input
                      id="contact-name"
                      placeholder="Jean Dupont"
                      value={contactForm.name}
                      onChange={event => setContactForm(current => ({ ...current, name: event.target.value }))}
                      required
                      maxLength={255}
                      className="bg-white border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-email" className="text-sm font-medium text-gray-700 mb-1 block">
                      Votre email
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="jean@example.com"
                      value={contactForm.email}
                      onChange={event => setContactForm(current => ({ ...current, email: event.target.value }))}
                      required
                      maxLength={320}
                      className="bg-white border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-message" className="text-sm font-medium text-gray-700 mb-1 block">
                      Message
                    </Label>
                    <Textarea
                      id="contact-message"
                      placeholder="Votre message..."
                      value={contactForm.message}
                      onChange={event => setContactForm(current => ({ ...current, message: event.target.value }))}
                      required
                      maxLength={2000}
                      className="bg-white border-gray-300 resize-none"
                      rows={3}
                    />
                  </div>
                  <Button type="submit" disabled={contactMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    {contactMutation.isPending ? "Envoi en cours..." : "Envoyer"}
                  </Button>
                </form>
              </div>
            </details>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ INTERACTIVE DES RÉSERVATIONS ET VOLS ──────────────────────── */}
      <FlightBookingFAQ />

      {/* Footer partagé unique : FooterLegal */}

      {/* ─── SIMULATEUR EXPRESS 30 SECONDES ────────────────────────────────────── */}
      {showExpressSimulator ? (
        <SimulatorRetryBoundary
          label="Le simulateur express"
          onRetry={() => setExpressSimulatorAttempt((attempt) => attempt + 1)}
          onFailure={() => reportSimulatorFailure.mutate({ route: "/", simulator: "express" })}
        >
          <Suspense fallback={<section className="mx-auto max-w-4xl rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center text-sm font-semibold text-blue-900" role="status">Chargement du simulateur express…</section>}>
            <SimulatorExpress key={expressSimulatorAttempt} />
          </Suspense>
        </SimulatorRetryBoundary>
      ) : (
        <section className="mx-auto max-w-4xl rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
          <h2 className="text-xl font-black text-slate-950">Besoin d’une estimation rapide ?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-700">Le simulateur express reste disponible à la demande — l’évaluation guidée ci-dessus reste le parcours principal.</p>
          <button type="button" onClick={() => setShowExpressSimulator(true)} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">Ouvrir le simulateur express</button>
        </section>
      )}

      {/* ─── MODAL AUTO-ÉVALUATION EXPRESS ────────────────────────── */}
      <EvaluationFormModal isOpen={showEvalModal} onClose={() => setShowEvalModal(false)} />

      {/* Les boutons WhatsApp et Aureol sont désormais montés une seule fois
          dans App.tsx afin de rester séparés sur toutes les pages. */}
          {showBackToTop && (
        <button
          type="button"
          aria-label="Retour en haut de la page"
          title="Retour en haut"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-blue-200 bg-white/95 text-blue-800 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-95"
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
      description: "Payez en une seule fois et bénéficiez d'un traitement prioritaire de votre dossier, sans frais supplémentaires.",
      features: [
        "Traitement prioritaire du dossier",
        "Suivi personnalisé dédié",
        "Réponse sous 24h",
        "Accompagnement complet",
        "Sans frais supplémentaires",
      ],
      cta: "Choisir cette option",
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
      description: "Un paiement structuré et modulable sur 4 à 5 mois pour adapter nos honoraires à votre situation.",
      features: [
        "Paiement sur 4 à 5 mensualités",
        "Plan personnalisé selon votre budget",
        "Suivi régulier de votre dossier",
        "Flexibilité des échéances",
        "Accompagnement complet inclus",
      ],
      cta: "Choisir cette option",
      highlight: true,
    },
    {
      id: "differe",
      icon: <Shield className="w-7 h-7" />,
      badge: "Sur éligibilité",
      title: "Paiement Différé",
      subtitle: "Part des honoraires réglée en fin de dossier",
      color: "from-[#059669] to-[#047857]",
      borderColor: "border-emerald-500/40",
      badgeBg: "bg-emerald-400 text-emerald-900",
      textAccent: "text-emerald-300",
      description: "Sous réserve d'éligibilité vérifiée, une partie de nos honoraires d'agence est réglée en fin de suivi. La décision de visa reste exclusivement du ressort des autorités compétentes.",
      features: [
        "Éligibilité vérifiée avant proposition",
        "Part des honoraires réglée en fin de dossier",
        "Engagement total de notre équipe",
        "Suivi jusqu'à la décision finale",
        "Conditions d'éligibilité à confirmer",
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
            className="text-3xl md:text-4xl font-extrabold text-[#1e3a8a] mb-4"
          >
            Nos Formules Tarifaires
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 max-w-2xl mx-auto text-base"
          >
            Choisissez la formule qui correspond à votre situation. Transparence totale, aucun frais caché.
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
                <p className="text-gray-500 text-sm leading-relaxed mb-6">{plan.description}</p>

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
                  href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(`Bonjour 3M Travel & Services ! Je suis intéressé(e) par la formule "${plan.title}". Pouvez-vous me donner plus d'informations ?`)}`}
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
          Les honoraires d'agence couvrent l'accompagnement, la préparation du dossier et le suivi administratif. La décision d'octroi du visa appartient exclusivement aux autorités compétentes.
        </motion.p>
      </div>
    </section>
  );
}

