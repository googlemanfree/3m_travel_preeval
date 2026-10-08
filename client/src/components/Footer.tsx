import { Link } from "wouter";
import { useEffect, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Facebook, MapPin, MessageCircle, Phone, Mail, ArrowUp } from "lucide-react";
import { COMPANY_CONTACTS, COMPANY_PROFILE } from "@/lib/companyContacts";
import { OFFICE_CONTACTS } from "@/lib/officeContacts";
import { useAnimationPreferences } from "@/contexts/AnimationPreferencesContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

type Language = "fr" | "en";
type Copy = Record<Language, string>;
type FooterLink = { key: string; href: string; label: Copy; description: Copy };
type SocialLink = FooterLink & { icon: typeof Facebook; color: string };

const footerCopy = {
  agencySummary: { fr: "Accompagnement documenté en mobilité internationale, voyage et services administratifs.", en: "Documented support for international mobility, travel and administrative services." },
  fraudLabel: { fr: "Avertissement anti-fraude.", en: "Anti-fraud notice." },
  fraudText: { fr: "Les règlements d’ouverture de dossier s’effectuent uniquement via le guichet sécurisé officiel ou en agence avec reçu officiel.", en: "Case-opening payments are made only through the official secure checkout or at the agency with an official receipt." },
  question: { fr: "Une question sur votre projet ?", en: "Questions about your project?" },
  contact: { fr: "Nous contacter", en: "Contact us" },
  whatsapp: { fr: "WhatsApp Yaoundé", en: "Yaoundé WhatsApp" },
  aboutTitle: { fr: "3M TRAVEL AGENCY", en: "3M TRAVEL AGENCY" },
  aboutText: { fr: "Un accompagnement fondé sur vos documents, les sources institutionnelles disponibles et des validations humaines à chaque étape sensible.", en: "Support grounded in your documents, available institutional sources and human validation for every sensitive step." },
  navigation: { fr: "Navigation", en: "Navigation" },
  destinations: { fr: "Destinations", en: "Destinations" },
  sitemap: { fr: "Mini-plan du site", en: "Mini sitemap" },
  contacts: { fr: "Coordonnées", en: "Contact details" },
  useful: { fr: "Informations utiles", en: "Useful information" },
  officialPage: { fr: "Page officielle", en: "Official page" },
  yaoundeWhatsapp: { fr: "WhatsApp Yaoundé (principal)", en: "Yaoundé WhatsApp (primary)" },
  yaoundePhone: { fr: "Fixe Yaoundé", en: "Yaoundé landline" },
  ottawaOffice: { fr: "Bureau Ottawa", en: "Ottawa office" },
  legalNotice: { fr: "Rôle de conseil et d’accompagnement. Les décisions de visa appartiennent aux autorités consulaires.", en: "We provide advisory and support services. Visa decisions remain with consular authorities." },
  newsletterTitle: { fr: "Recevoir nos actualités utiles", en: "Receive useful updates" },
  newsletterText: { fr: "Conseils, sources officielles et nouveautés 3M TRAVEL AGENCY, sans promesse commerciale excessive.", en: "Tips, official sources and 3M TRAVEL AGENCY updates, without excessive marketing promises." },
  newsletterEmail: { fr: "Votre adresse e-mail", en: "Your email address" },
  newsletterConsent: { fr: "J’accepte de recevoir la newsletter et peux me désinscrire à tout moment.", en: "I agree to receive the newsletter and can unsubscribe at any time." },
  newsletterSubmit: { fr: "S’inscrire", en: "Subscribe" },
  newsletterSuccess: { fr: "Votre inscription est enregistrée.", en: "Your subscription is recorded." },
  newsletterAlready: { fr: "Cette adresse est déjà inscrite.", en: "This address is already subscribed." },
  newsletterError: { fr: "Impossible d’enregistrer l’inscription pour le moment.", en: "The subscription could not be recorded right now." },
  officesTitle: { fr: "Nos bureaux", en: "Our offices" },
  officesIntro: { fr: "Appelez ou écrivez au bureau qui correspond à votre zone.", en: "Call or message the office that serves your area." },
  exploreTitle: { fr: "Explorer", en: "Explore" },
} satisfies Record<string, Copy>;

const SOCIAL_LINKS: SocialLink[] = [
  { key: "facebook", icon: Facebook, href: "https://www.facebook.com/3mtravelcm", label: { fr: "Facebook officiel", en: "Official Facebook" }, description: { fr: "Ouvrir la page Facebook officielle dans un nouvel onglet.", en: "Open the official Facebook page in a new tab." }, color: "hover:text-blue-300" },
];

const USEFUL_LINKS: FooterLink[] = [
  { key: "useful_destinations", label: { fr: "Destinations populaires", en: "Popular destinations" }, href: "/procedures", description: { fr: "Explorer les procédures disponibles selon votre destination.", en: "Explore procedures available for your destination." } },
  { key: "useful_contact", label: { fr: "Contact", en: "Contact" }, href: "/contact", description: { fr: "Consulter les coordonnées et envoyer une demande à l’agence.", en: "View contact details and send a request to the agency." } },
  { key: "useful_terms", label: { fr: "Mentions légales", en: "Legal notice" }, href: "/conditions-utilisation", description: { fr: "Lire les conditions d’utilisation et le cadre de service.", en: "Read terms of use and the service framework." } },
  { key: "useful_sitemap", label: { fr: "Plan du site", en: "Sitemap" }, href: "/plan-du-site", description: { fr: "Retrouver l’ensemble des accès publics en une seule page.", en: "Find all public entry points on a single page." } },
  { key: "useful_accessibility", label: { fr: "Accessibilité", en: "Accessibility" }, href: "/accessibilite", description: { fr: "Adapter l’affichage et les préférences d’interaction.", en: "Adjust display and interaction preferences." } },
  { key: "useful_status", label: { fr: "État du service", en: "Service status" }, href: "/etat-du-service", description: { fr: "Consulter la disponibilité publique et les maintenances annoncées.", en: "Check public availability and announced maintenance." } },
  { key: "useful_digital", label: { fr: "Service 3M Solutions", en: "3M Solutions service" }, href: "/3m-solutions", description: { fr: "Découvrir les services numériques complémentaires de 3M.", en: "Discover 3M’s complementary digital services." } },
  { key: "useful_sources", label: { fr: "Sources officielles", en: "Official sources" }, href: "/sources-officielles", description: { fr: "Consulter les liens institutionnels par destination.", en: "View institutional links by destination." } },
];

const MINI_SITE_MAP: FooterLink[] = [
  { key: "mini_assessment", label: { fr: "Évaluation gratuite", en: "Free assessment" }, href: "/?project=travail#evaluation-multi", description: { fr: "Découvrir l’évaluation gratuite, puis créer un compte et déposer un CV avant la soumission.", en: "Explore the free assessment, then create an account and submit a CV before sending it." } },
  { key: "mini_booking", label: { fr: "3M Booking", en: "3M Booking" }, href: "/flights", description: { fr: "Rechercher des options de voyage et de réservation.", en: "Search travel and booking options." } },
  { key: "mini_procedures", label: { fr: "Procédures", en: "Procedures" }, href: "/procedures", description: { fr: "Comparer les démarches et destinations proposées.", en: "Compare available procedures and destinations." } },
  { key: "mini_evisas", label: { fr: "e-Visas", en: "e-Visas" }, href: "/evisas", description: { fr: "Préparer une demande de visa électronique adaptée.", en: "Prepare a suitable electronic visa application." } },
  { key: "mini_pricing", label: { fr: "Tarifs", en: "Pricing" }, href: "/tarifs", description: { fr: "Comprendre les honoraires, frais tiers et modalités.", en: "Understand fees, third-party costs and terms." } },
  { key: "mini_sources", label: { fr: "Sources officielles", en: "Official sources" }, href: "/sources-officielles", description: { fr: "Vérifier les ressources gouvernementales par destination.", en: "Check government resources by destination." } },
];

const NAVIGATION_LINKS: FooterLink[] = [
  { key: "nav_home", label: { fr: "Accueil", en: "Home" }, href: "/", description: { fr: "Revenir à la page principale et à l’évaluation gratuite.", en: "Return to the main page and free assessment." } },
  { key: "nav_flights", label: { fr: "Recherche de vols", en: "Flight search" }, href: "/flights", description: { fr: "Rechercher des vols selon votre itinéraire et vos dates.", en: "Search flights by route and travel dates." } },
  { key: "nav_procedures", label: { fr: "Procédures & destinations", en: "Procedures & destinations" }, href: "/procedures", description: { fr: "Comparer les démarches de mobilité internationale.", en: "Compare international mobility procedures." } },
  { key: "nav_register", label: { fr: "Inscription", en: "Sign up" }, href: "/register", description: { fr: "Créer un espace personnel pour suivre vos demandes.", en: "Create a personal space to follow your requests." } },
  { key: "nav_login", label: { fr: "Espace candidat", en: "Candidate space" }, href: "/login", description: { fr: "Accéder à votre espace et à vos dossiers existants.", en: "Access your space and existing cases." } },
];

const DESTINATION_LINKS: FooterLink[] = [
  ["canada", "Canada", "/canada"], ["france", "France", "/procedures/france"], ["germany", "Allemagne", "/procedures/allemagne-formation"], ["luxembourg", "Luxembourg", "/procedures/luxembourg"], ["uk", "Royaume-Uni", "/procedures/royaume-uni"], ["australia", "Australie", "/procedures/australie"],
].map(([key, frenchLabel, href]) => ({ key: `destination_${key}`, href, label: { fr: frenchLabel, en: frenchLabel === "Allemagne" ? "Germany" : frenchLabel === "Royaume-Uni" ? "United Kingdom" : frenchLabel === "Australie" ? "Australia" : frenchLabel }, description: { fr: `Explorer les informations de procédure disponibles pour ${frenchLabel}.`, en: `Explore available procedure information for ${frenchLabel === "Allemagne" ? "Germany" : frenchLabel === "Royaume-Uni" ? "the United Kingdom" : frenchLabel === "Australie" ? "Australia" : frenchLabel}.` } }));

const FOOTER_SHORTCUT_CLASS = "group inline-flex min-h-8 items-center rounded-md px-1 py-1 outline-none transition-[color,transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:translate-x-1 hover:bg-white/10 hover:text-blue-100 focus-visible:translate-x-1 focus-visible:bg-white/10 focus-visible:text-blue-100 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f2460] motion-reduce:transform-none motion-reduce:transition-none";

type FooterShortcutProps = { link: FooterLink; language: Language; onTrack: (link: FooterLink) => void };

function NewsletterSignup({ language }: { language: Language }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [feedback, setFeedback] = useState<"success" | "already" | "error" | null>(null);
  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: (result) => {
      setFeedback(result.alreadySubscribed ? "already" : "success");
      if (!result.alreadySubscribed) {
        setEmail("");
        setConsent(false);
      }
    },
    onError: () => setFeedback("error"),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    subscribe.mutate({ email, language, consentGiven: true });
  };
  const copy = (value: Copy) => value[language];
  return (
    <section aria-labelledby="newsletter-title" data-testid="footer-newsletter" className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:p-5">
      <h2 id="newsletter-title" className="text-sm font-bold text-white">{copy(footerCopy.newsletterTitle)}</h2>
      <p className="mt-1 text-xs leading-snug text-slate-300">{copy(footerCopy.newsletterText)}</p>
      <form className="mt-3 space-y-2.5" onSubmit={submit}>
        <label htmlFor="newsletter-email" className="sr-only">{copy(footerCopy.newsletterEmail)}</label>
        <input
          id="newsletter-email"
          type="email"
          required
          maxLength={320}
          autoComplete="email"
          value={email}
          onChange={(event) => { setEmail(event.target.value); setFeedback(null); }}
          placeholder={copy(footerCopy.newsletterEmail)}
          className="min-h-11 w-full rounded-xl border border-white/25 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-amber-300"
        />
        <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400" />
          <span>{copy(footerCopy.newsletterConsent)}</span>
        </label>
        <button
          type="submit"
          disabled={subscribe.isPending || !consent}
          className="touch-target inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-amber-300 px-3 py-2 text-sm font-bold text-[#061a36] transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {subscribe.isPending ? "…" : copy(footerCopy.newsletterSubmit)}
        </button>
        <p role="status" aria-live="polite" className="min-h-5 text-xs text-amber-200">
          {feedback === "success" ? copy(footerCopy.newsletterSuccess) : feedback === "already" ? copy(footerCopy.newsletterAlready) : feedback === "error" ? copy(footerCopy.newsletterError) : ""}
        </p>
      </form>
    </section>
  );
}

function FooterShortcut({ link, language, onTrack }: FooterShortcutProps) {
  const descriptionId = `footer-shortcut-${link.key}`;
  return (
    <Link
      href={link.href}
      aria-label={link.label[language]}
      aria-describedby={descriptionId}
      onClick={() => onTrack(link)}
      className={FOOTER_SHORTCUT_CLASS}
    >
      <span>{link.label[language]}</span>
      <span id={descriptionId} role="tooltip" className="sr-only">{link.description[language]}</span>
      <span aria-hidden="true" className="ml-1 text-blue-100 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">↗</span>
    </Link>
  );
}

function LinkColumn({ title, links, language, onTrack }: { title: string; links: FooterLink[]; language: Language; onTrack: (link: FooterLink) => void }) {
  return (
    <div>
      <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-200">{title}</h2>
      <ul className="space-y-1 text-sm text-slate-200">
        {links.map((link) => (
          <li key={link.key}>
            <FooterShortcut link={link} language={language} onTrack={onTrack} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const prefersReducedMotion = useReducedMotion();
  const { animationsEnabled } = useAnimationPreferences();
  const { language } = useLanguage();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isDesktopFooter, setIsDesktopFooter] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktopFooter(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const recordEngagement = trpc.footerEngagement.record.useMutation();
  const enableSocialMotion = animationsEnabled && !prefersReducedMotion;
  const copy = (value: Copy) => value[language];
  const trackShortcut = (link: FooterLink) => recordEngagement.mutate({ surface: "footer_shortcut", targetKey: link.key, href: link.href, language });
  const trackSocial = (link: SocialLink) => recordEngagement.mutate({ surface: "footer_social", targetKey: link.key, href: link.href, language });

  return (
    <footer
      className="relative mt-auto overflow-hidden bg-[#061a36] text-slate-100"
      aria-label="Informations et contacts 3M TRAVEL AGENCY"
      data-testid="site-footer"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(37,99,235,0.18),_transparent_55%),linear-gradient(180deg,#061a36_0%,#0a2450_100%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        {/* Marque + CTA */}
        <div className="grid gap-6 border-b border-white/15 pb-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <img src="/logo-3m.webp" alt="Logo 3M TRAVEL AGENCY" className="h-12 w-auto shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="text-lg font-black tracking-tight text-white sm:text-xl">{COMPANY_PROFILE.publicName}</p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-300">{copy(footerCopy.agencySummary)}</p>
              <p className="mt-3 max-w-xl text-xs leading-relaxed text-slate-400">{copy(footerCopy.aboutText)}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <p className="text-xs font-semibold text-slate-300 sm:text-right">{copy(footerCopy.question)}</p>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Link
                href="/contact"
                className="touch-target inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#0a2b5c] transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                {copy(footerCopy.contact)}
              </Link>
              <a
                href={COMPANY_CONTACTS.yaounde.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="touch-target inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {copy(footerCopy.whatsapp)}
              </a>
            </div>
          </div>
        </div>

        {/* Anti-fraude */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-300/25 bg-amber-400/5 px-4 py-3 text-xs leading-relaxed text-slate-200" data-testid="footer-fraud-notice">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
          <p>
            <strong className="text-white">{copy(footerCopy.fraudLabel)}</strong> {copy(footerCopy.fraudText)}
          </p>
        </div>

        {/* Bureaux */}
        <section aria-labelledby="footer-offices-title" className="mt-8" data-testid="footer-offices">
          <div className="mb-4">
            <h2 id="footer-offices-title" className="text-base font-black text-white">{copy(footerCopy.officesTitle)}</h2>
            <p className="mt-1 text-xs text-slate-400">{copy(footerCopy.officesIntro)}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-200">{language === "fr" ? "Bureau de Yaoundé" : "Yaoundé office"}</p>
              <div className="mt-3 space-y-2.5 text-sm text-slate-200">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" />
                  <span>Yaoundé : {COMPANY_CONTACTS.yaounde.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                  <a href={COMPANY_CONTACTS.yaounde.whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-100 underline-offset-2 hover:underline">
                    {copy(footerCopy.yaoundeWhatsapp)} : {COMPANY_CONTACTS.yaounde.whatsappNumber}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" />
                  <a href={`tel:${COMPANY_CONTACTS.yaounde.phone.replace(/\s/g, "")}`} className="font-semibold hover:text-white">
                    {copy(footerCopy.yaoundePhone)} : {COMPANY_CONTACTS.yaounde.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" />
                  <a href={`mailto:${COMPANY_CONTACTS.yaounde.email}`} className="hover:text-white">{COMPANY_CONTACTS.yaounde.email}</a>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-blue-200">{language === "fr" ? "Bureau d’Ottawa" : "Ottawa office"}</p>
              <div className="mt-3 space-y-2.5 text-sm text-slate-200">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" />
                  <span>Ottawa : {COMPANY_CONTACTS.ottawa.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" />
                  <a href={`tel:+${OFFICE_CONTACTS.ottawa.whatsappNumber}`} className="font-semibold hover:text-white">
                    {copy(footerCopy.ottawaOffice)} : {OFFICE_CONTACTS.ottawa.whatsappDisplay}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" />
                  <a href={`mailto:${COMPANY_CONTACTS.ottawa.email}`} className="hover:text-white">{COMPANY_CONTACTS.ottawa.email}</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Liens + newsletter */}
        <details className="group mt-8 lg:contents" open={isDesktopFooter}>
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white lg:hidden">
            {language === "fr" ? "Liens, destinations et informations" : "Links, destinations and information"}
            <span className="text-lg text-blue-200 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true">⌄</span>
          </summary>
          <div className="mt-6 grid gap-8 border-t border-white/10 pt-8 lg:mt-10 lg:grid-cols-[1.6fr_1fr] lg:gap-10 lg:border-t lg:pt-10">
            <div>
              <h2 className="mb-5 text-sm font-black text-white">{copy(footerCopy.exploreTitle)}</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 xl:grid-cols-5">
                <div className="sr-only">
                  <h2>{copy(footerCopy.aboutTitle)}</h2>
                  <p>{copy(footerCopy.aboutText)}</p>
                </div>
                <LinkColumn title={copy(footerCopy.navigation)} links={NAVIGATION_LINKS} language={language} onTrack={trackShortcut} />
                <LinkColumn title={copy(footerCopy.destinations)} links={DESTINATION_LINKS} language={language} onTrack={trackShortcut} />
                <nav aria-label={copy(footerCopy.sitemap)}>
                  <LinkColumn title={copy(footerCopy.sitemap)} links={MINI_SITE_MAP} language={language} onTrack={trackShortcut} />
                </nav>
                <LinkColumn title={copy(footerCopy.useful)} links={USEFUL_LINKS} language={language} onTrack={trackShortcut} />
                <div>
                  <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-blue-200">{copy(footerCopy.contacts)}</h2>
                  <p className="mb-2 text-xs leading-relaxed text-slate-400">{copy(footerCopy.officialPage)}</p>
                  <a
                    href={SOCIAL_LINKS[0].href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-100 underline-offset-2 hover:text-white hover:underline"
                  >
                    {SOCIAL_LINKS[0].label[language]}
                  </a>
                </div>
              </div>
            </div>
            <NewsletterSignup language={language} />
          </div>
        </details>

        {/* Bas de page */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => {
              const Icon = social.icon;
              const descriptionId = `footer-social-${social.key}`;
              return (
                <span key={social.key} className="group relative inline-flex">
                  <motion.a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-describedby={descriptionId}
                    aria-label={`${language === "fr" ? "Ouvrir" : "Open"} ${social.label[language]}`}
                    onClick={() => trackSocial(social)}
                    initial={false}
                    whileHover={enableSocialMotion ? { y: -3, scale: 1.12 } : undefined}
                    whileTap={enableSocialMotion ? { scale: 0.95 } : undefined}
                    transition={{ type: "spring", stiffness: 480, damping: 20, mass: 0.35 }}
                    className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/10 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f2460] motion-reduce:transform-none motion-reduce:transition-none ${social.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.a>
                  <span id={descriptionId} className="sr-only">{social.description[language]}</span>
                </span>
              );
            })}
          </div>
          <div className="max-w-2xl text-xs leading-relaxed text-slate-400 sm:text-right">
            <p>
              <span className="font-medium text-slate-200">{COMPANY_PROFILE.legalName}</span>
              {" — "}RC : {COMPANY_PROFILE.legalIdentifiers.registration} | NIU : {COMPANY_PROFILE.legalIdentifiers.taxpayerId}
            </p>
            <p className="mt-1">{copy(footerCopy.legalNotice)}</p>
            <p className="mt-1">© {new Date().getFullYear()} {COMPANY_PROFILE.legalName}. {language === "fr" ? "Tous droits réservés." : "All rights reserved."}</p>
          </div>
        </div>
      </div>

      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-[#123665]/95 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-[#1a4a86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 motion-reduce:scroll-auto motion-reduce:transition-none md:bottom-6 md:left-6"
          aria-label={language === "fr" ? "Revenir en haut de la page" : "Back to top"}
          data-testid="footer-back-to-top"
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{language === "fr" ? "Haut" : "Top"}</span>
        </button>
      )}
    </footer>
  );
}
