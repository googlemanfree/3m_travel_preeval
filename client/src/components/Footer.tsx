import { Link } from "wouter";
import { useEffect, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Facebook, MapPin, MessageCircle, Phone, Mail } from "lucide-react";
import FacebookQRCodeWidget from "./FacebookQRCodeWidget";
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
  aboutTitle: { fr: "3M Travel", en: "3M Travel" },
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
  newsletterText: { fr: "Conseils, sources officielles et nouveautés 3M Travel, sans promesse commerciale excessive.", en: "Tips, official sources and 3M Travel updates, without excessive marketing promises." },
  newsletterEmail: { fr: "Votre adresse e-mail", en: "Your email address" },
  newsletterConsent: { fr: "J’accepte de recevoir la newsletter et peux me désinscrire à tout moment.", en: "I agree to receive the newsletter and can unsubscribe at any time." },
  newsletterSubmit: { fr: "S’inscrire", en: "Subscribe" },
  newsletterSuccess: { fr: "Votre inscription est enregistrée.", en: "Your subscription is recorded." },
  newsletterAlready: { fr: "Cette adresse est déjà inscrite.", en: "This address is already subscribed." },
  newsletterError: { fr: "Impossible d’enregistrer l’inscription pour le moment.", en: "The subscription could not be recorded right now." },
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
  { key: "useful_digital", label: { fr: "Service 3M Digital", en: "3M Digital service" }, href: "/3m-digital", description: { fr: "Découvrir les services numériques complémentaires de 3M.", en: "Discover 3M’s complementary digital services." } },
  { key: "useful_sources", label: { fr: "Sources officielles", en: "Official sources" }, href: "/sources-officielles", description: { fr: "Consulter les liens institutionnels par destination.", en: "View institutional links by destination." } },
];

const MINI_SITE_MAP: FooterLink[] = [
  { key: "mini_assessment", label: { fr: "Évaluation gratuite", en: "Free assessment" }, href: "/?project=travail#evaluation-multi", description: { fr: "Découvrir l’évaluation gratuite, puis créer un compte et déposer un CV avant la soumission.", en: "Explore the free assessment, then create an account and submit a CV before sending it." } },
  { key: "mini_booking", label: { fr: "3M Booking", en: "3M Booking" }, href: "/billets", description: { fr: "Rechercher des options de voyage et de réservation.", en: "Search travel and booking options." } },
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
  ["canada", "Canada"], ["france", "France"], ["germany", "Allemagne"], ["luxembourg", "Luxembourg"], ["uk", "Royaume-Uni"], ["australia", "Australie"],
].map(([key, frenchLabel]) => ({ key: `destination_${key}`, href: "/procedures", label: { fr: frenchLabel, en: frenchLabel === "Allemagne" ? "Germany" : frenchLabel === "Royaume-Uni" ? "United Kingdom" : frenchLabel === "Australie" ? "Australia" : frenchLabel }, description: { fr: `Explorer les informations de procédure disponibles pour ${frenchLabel}.`, en: `Explore available procedure information for ${frenchLabel === "Allemagne" ? "Germany" : frenchLabel === "Royaume-Uni" ? "the United Kingdom" : frenchLabel === "Australie" ? "Australia" : frenchLabel}.` } }));

const FOOTER_SHORTCUT_CLASS = "group inline-flex min-h-8 items-center rounded-md px-1 py-1 outline-none transition-[color,transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:translate-x-1 hover:bg-white/10 hover:text-blue-100 focus-visible:translate-x-1 focus-visible:bg-white/10 focus-visible:text-blue-100 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f2460] motion-reduce:transform-none motion-reduce:transition-none";
const FOOTER_TOOLTIP_CLASS = "pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-60 rounded-md border border-white/25 bg-slate-950 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg invisible translate-y-1 transition-[opacity,transform,visibility] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transform-none motion-reduce:transition-none";

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
  return <section aria-labelledby="newsletter-title" className="border-t border-white/20 pt-3">
    <h2 id="newsletter-title" className="text-sm font-bold text-white">{copy(footerCopy.newsletterTitle)}</h2>
    <p className="mt-1 text-xs leading-snug text-slate-200">{copy(footerCopy.newsletterText)}</p>
    <form className="mt-2 space-y-2" onSubmit={submit}>
      <label htmlFor="newsletter-email" className="sr-only">{copy(footerCopy.newsletterEmail)}</label>
      <input id="newsletter-email" type="email" required maxLength={320} autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setFeedback(null); }} placeholder={copy(footerCopy.newsletterEmail)} className="min-h-9 w-full rounded-lg border border-white/30 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-amber-300" />
      <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-200"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} required className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400" /> <span>{copy(footerCopy.newsletterConsent)}</span></label>
      <button type="submit" disabled={subscribe.isPending || !consent} className="inline-flex min-h-9 w-full items-center justify-center rounded-lg bg-amber-300 px-3 py-2 text-sm font-bold text-[#061a36] transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60">{subscribe.isPending ? "…" : copy(footerCopy.newsletterSubmit)}</button>
      <p role="status" aria-live="polite" className="min-h-5 text-xs text-amber-200">{feedback === "success" ? copy(footerCopy.newsletterSuccess) : feedback === "already" ? copy(footerCopy.newsletterAlready) : feedback === "error" ? copy(footerCopy.newsletterError) : ""}</p>
    </form>
  </section>; 
}

function FooterShortcut({ link, language, onTrack }: FooterShortcutProps) {
  const descriptionId = `footer-shortcut-${link.key}`;
  return <span className="group relative inline-flex max-w-full"><Link href={link.href} aria-describedby={descriptionId} onClick={() => onTrack(link)} className={FOOTER_SHORTCUT_CLASS}><span>{link.label[language]}</span><span aria-hidden="true" className="ml-1 text-blue-100 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">↗</span></Link><span id={descriptionId} role="tooltip" className={FOOTER_TOOLTIP_CLASS}>{link.description[language]}</span></span>;
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

  return <footer className="mt-auto bg-[#061a36] text-slate-100" aria-label="Informations et contacts 3M Travel"><div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
    <div className="grid gap-4 border-b border-white/25 pb-5 lg:grid-cols-[1.05fr_1.95fr] lg:items-center"><div className="flex items-center gap-3"><img src="/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg" alt="Logo 3M Travel Agency" className="h-11 w-auto object-contain" /><div><p className="text-sm font-bold text-white">3M Travel &amp; Services</p><p className="mt-1 text-xs leading-relaxed text-slate-200">{copy(footerCopy.agencySummary)}</p></div></div><div className="grid gap-3 sm:grid-cols-[1.2fr_auto] sm:items-center"><div className="flex items-start gap-3 rounded-xl border border-amber-200/25 bg-white/5 px-4 py-3 text-xs leading-relaxed text-slate-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" /><p><strong className="text-white">{copy(footerCopy.fraudLabel)}</strong> {copy(footerCopy.fraudText)}</p></div><div className="flex flex-col gap-2 sm:items-end"><p className="text-xs text-slate-200">{copy(footerCopy.question)}</p><div className="flex flex-wrap gap-2 sm:justify-end"><Link href="/contact" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50">{copy(footerCopy.contact)}</Link><a href={COMPANY_CONTACTS.yaounde.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/35 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">{copy(footerCopy.whatsapp)}</a></div></div></div></div>
    <details className="group lg:contents" open={isDesktopFooter}>
      <summary className="flex cursor-pointer list-none items-center justify-between border-b border-white/20 py-3 text-sm font-semibold text-white lg:hidden">{language === "fr" ? "Liens, destinations et coordonnées" : "Links, destinations and contact details"}<span className="text-lg text-blue-200 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true">⌄</span></summary>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 py-5 sm:grid-cols-3 lg:grid-cols-6"><div><h2 className="mb-2 text-sm font-bold text-white">{copy(footerCopy.aboutTitle)}</h2><p className="text-xs leading-relaxed text-slate-200">{copy(footerCopy.aboutText)}</p></div><div><h2 className="mb-2 text-sm font-bold text-white">{copy(footerCopy.navigation)}</h2><ul className="space-y-1 text-sm">{NAVIGATION_LINKS.map((link) => <li key={link.key}><FooterShortcut link={link} language={language} onTrack={trackShortcut} /></li>)}</ul></div><div><h2 className="mb-2 text-sm font-bold text-white">{copy(footerCopy.destinations)}</h2><ul className="space-y-1 text-sm">{DESTINATION_LINKS.map((link) => <li key={link.key}><FooterShortcut link={link} language={language} onTrack={trackShortcut} /></li>)}</ul></div><nav aria-label={copy(footerCopy.sitemap)}><h2 className="mb-2 text-sm font-bold text-white">{copy(footerCopy.sitemap)}</h2><ul className="space-y-1 text-sm">{MINI_SITE_MAP.map((link) => <li key={link.key}><FooterShortcut link={link} language={language} onTrack={trackShortcut} /></li>)}</ul></nav><div><h2 className="mb-2 text-sm font-bold text-white">{copy(footerCopy.contacts)}</h2><div className="space-y-2 text-xs leading-relaxed"><div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" /><span>Yaoundé : {COMPANY_CONTACTS.yaounde.address}</span></div><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 shrink-0 text-emerald-300" /><a href={COMPANY_CONTACTS.yaounde.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-200">{copy(footerCopy.yaoundeWhatsapp)} : {COMPANY_CONTACTS.yaounde.whatsappNumber}</a></div><div className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-blue-300" /><a href={`tel:${COMPANY_CONTACTS.yaounde.phone.replace(/\s/g, "")}`} className="hover:text-blue-100">{copy(footerCopy.yaoundePhone)} : {COMPANY_CONTACTS.yaounde.phone}</a></div><div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-blue-300" /><span>Ottawa : {COMPANY_CONTACTS.ottawa.address}</span></div><div className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-blue-300" /><a href={`tel:+${OFFICE_CONTACTS.ottawa.whatsappNumber}`} className="hover:text-blue-100">{copy(footerCopy.ottawaOffice)} : {OFFICE_CONTACTS.ottawa.whatsappDisplay}</a></div><div className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-blue-300" /><a href={`mailto:${COMPANY_CONTACTS.yaounde.email}`} className="hover:text-blue-100">{COMPANY_CONTACTS.yaounde.email}</a></div></div></div><div><h2 className="mb-2 text-sm font-bold text-white">{copy(footerCopy.useful)}</h2><ul className="space-y-1 text-sm">{USEFUL_LINKS.map((link) => <li key={link.key}><FooterShortcut link={link} language={language} onTrack={trackShortcut} /></li>)}</ul><div className="mt-3 border-t border-white/25 pt-3"><p className="mb-2 text-xs font-semibold text-blue-100">{copy(footerCopy.officialPage)}</p><FacebookQRCodeWidget /></div><NewsletterSignup language={language} /></div>      </div>
    </details>
    <div className="flex flex-col items-center justify-between gap-3 border-t border-white/25 pt-4 sm:flex-row"><div className="flex gap-3">{SOCIAL_LINKS.map((social) => { const Icon = social.icon; const descriptionId = `footer-social-${social.key}`; return <span key={social.key} className="group relative inline-flex"><motion.a href={social.href} target="_blank" rel="noopener noreferrer" aria-describedby={descriptionId} aria-label={`${language === "fr" ? "Ouvrir" : "Open"} ${social.label[language]}`} onClick={() => trackSocial(social)} initial={false} whileHover={enableSocialMotion ? { y: -3, scale: 1.12 } : undefined} whileTap={enableSocialMotion ? { scale: 0.95 } : undefined} transition={{ type: "spring", stiffness: 480, damping: 20, mass: 0.35 }} className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/10 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f2460] motion-reduce:transform-none motion-reduce:transition-none ${social.color}`}><Icon className="h-4 w-4" /></motion.a><span id={descriptionId} role="tooltip" className={FOOTER_TOOLTIP_CLASS}>{social.description[language]}</span></span>; })}</div><div className="max-w-2xl text-center text-xs leading-relaxed text-slate-400 sm:text-right"><p><span className="font-medium text-slate-200">{COMPANY_PROFILE.legalName}</span> — RC : {COMPANY_PROFILE.legalIdentifiers.registration} | NIU : {COMPANY_PROFILE.legalIdentifiers.taxpayerId}</p><p className="mt-1">{copy(footerCopy.legalNotice)}</p><p className="mt-1">© {new Date().getFullYear()} {COMPANY_PROFILE.legalName}. {language === "fr" ? "Tous droits réservés." : "All rights reserved."}</p></div></div>
    {showBackToTop && <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-5 right-5 z-40 inline-flex min-h-9 items-center gap-2 rounded-full border border-white/25 bg-[#123665]/95 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-[#1a4a86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 motion-reduce:scroll-auto motion-reduce:transition-none" aria-label={language === "fr" ? "Revenir en haut de la page" : "Back to top"}>↑ <span className="hidden sm:inline">{language === "fr" ? "Haut" : "Top"}</span></button>}
  </div></footer>;
}
