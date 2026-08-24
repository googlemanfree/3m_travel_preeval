import { Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Facebook, Instagram, Linkedin, Twitter, MapPin, MessageCircle, Phone, Mail } from "lucide-react";
import FacebookQRCodeWidget from "./FacebookQRCodeWidget";
import { COMPANY_CONTACTS, COMPANY_PROFILE } from "@/lib/companyContacts";
import { OFFICE_CONTACTS } from "@/lib/officeContacts";
import { useAnimationPreferences } from "@/contexts/AnimationPreferencesContext";

const SOCIAL_LINKS = [
  { icon: Facebook, href: "https://www.facebook.com/3mtravelcm", label: "Facebook officiel", description: "Ouvrir la page Facebook officielle dans un nouvel onglet.", color: "hover:text-blue-300" },
  { icon: Instagram, href: "https://instagram.com/3mtravelagency", label: "Instagram", description: "Ouvrir le compte Instagram dans un nouvel onglet.", color: "hover:text-pink-300" },
  { icon: Linkedin, href: "https://linkedin.com/company/3mtravelagency", label: "LinkedIn", description: "Ouvrir la page LinkedIn dans un nouvel onglet.", color: "hover:text-blue-300" },
  { icon: Twitter, href: "https://twitter.com/3mtravelagency", label: "Twitter", description: "Ouvrir le compte X dans un nouvel onglet.", color: "hover:text-sky-300" },
];

const USEFUL_LINKS = [
  { label: "Destinations populaires", href: "/procedures", description: "Explorer les procédures disponibles selon votre destination." },
  { label: "Contact", href: "/contact", description: "Consulter les coordonnées et envoyer une demande à l’agence." },
  { label: "Mentions légales", href: "/conditions-utilisation", description: "Lire les conditions d’utilisation et le cadre de service." },
  { label: "Plan du site", href: "/plan-du-site", description: "Retrouver l’ensemble des accès publics en une seule page." },
  { label: "Accessibilité", href: "/accessibilite", description: "Adapter l’affichage et les préférences d’interaction." },
  { label: "Service 3M Digital", href: "/3m-digital", description: "Découvrir les services numériques complémentaires de 3M." },
  { label: "Sources officielles", href: "/sources-officielles", description: "Consulter les liens institutionnels par destination." },
];

const MINI_SITE_MAP = [
  { label: "Évaluation gratuite", href: "/?project=travail#evaluation-multi", description: "Démarrer une orientation gratuite sans créer de compte." },
  { label: "3M Booking", href: "/billets", description: "Rechercher des options de voyage et de réservation." },
  { label: "Procédures", href: "/procedures", description: "Comparer les démarches et destinations proposées." },
  { label: "e-Visas", href: "/evisas", description: "Préparer une demande de visa électronique adaptée." },
  { label: "Tarifs", href: "/tarifs", description: "Comprendre les honoraires, frais tiers et modalités." },
  { label: "Sources officielles", href: "/sources-officielles", description: "Vérifier les ressources gouvernementales par destination." },
];

const NAVIGATION_LINKS = [
  { label: "Accueil", href: "/", description: "Revenir à la page principale et à l’évaluation gratuite." },
  { label: "Recherche de vols", href: "/flights", description: "Rechercher des vols selon votre itinéraire et vos dates." },
  { label: "Procédures & destinations", href: "/procedures", description: "Comparer les démarches de mobilité internationale." },
  { label: "Inscription", href: "/register", description: "Créer un espace personnel pour suivre vos demandes." },
  { label: "Espace candidat", href: "/login", description: "Accéder à votre espace et à vos dossiers existants." },
];

const DESTINATION_LINKS = ["Canada", "France", "Allemagne", "Luxembourg", "Royaume-Uni", "Australie"].map((label) => ({
  label,
  href: "/procedures",
  description: `Explorer les informations de procédure disponibles pour ${label}.`,
}));

const FOOTER_SHORTCUT_CLASS = "group inline-flex min-h-8 items-center rounded-md px-1 py-1 outline-none transition-[color,transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:translate-x-1 hover:bg-white/10 hover:text-blue-100 focus-visible:translate-x-1 focus-visible:bg-white/10 focus-visible:text-blue-100 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f2460] motion-reduce:transform-none motion-reduce:transition-none";
const FOOTER_TOOLTIP_CLASS = "pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-60 rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg invisible translate-y-1 transition-[opacity,transform,visibility] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transform-none motion-reduce:transition-none";

const footerTooltipId = (prefix: string, value: string) => `${prefix}-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

type FooterShortcutProps = { label: string; href: string; description: string };

function FooterShortcut({ label, href, description }: FooterShortcutProps) {
  const descriptionId = footerTooltipId("footer-shortcut", href);
  return (
    <span className="group relative inline-flex max-w-full">
      <Link href={href} aria-describedby={descriptionId} className={FOOTER_SHORTCUT_CLASS}>
        <span>{label}</span>
        <span aria-hidden="true" className="ml-1 text-blue-200 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">↗</span>
      </Link>
      <span id={descriptionId} role="tooltip" className={FOOTER_TOOLTIP_CLASS}>
        {description}
      </span>
    </span>
  );
}

export default function Footer() {
  const prefersReducedMotion = useReducedMotion();
  const { animationsEnabled } = useAnimationPreferences();
  const enableSocialMotion = animationsEnabled && !prefersReducedMotion;

  return (
    <footer className="mt-auto bg-[#0f2460] text-gray-300" aria-label="Informations et contacts 3M Travel">
      <div className="mx-auto max-w-7xl px-4 py-9 sm:py-11">
        <div className="grid gap-6 border-b border-white/15 pb-8 lg:grid-cols-[1.05fr_1.95fr] lg:items-center">
          <div className="flex items-center gap-3">
            <img
              src="/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg"
              alt="Logo 3M Travel Agency"
              className="h-11 w-auto object-contain"
            />
            <div>
              <p className="text-sm font-bold text-white">3M Travel &amp; Services</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">Accompagnement documenté en mobilité internationale, voyage et services administratifs.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1.2fr_auto] sm:items-center">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200/25 bg-white/5 px-4 py-3 text-xs leading-relaxed text-slate-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              <p><strong className="text-white">Avertissement anti-fraude.</strong> Les règlements d’ouverture de dossier s’effectuent uniquement via le guichet sécurisé officiel ou en agence avec reçu officiel.</p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="text-xs text-slate-300">Une question sur votre projet ?</p>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Link href="/contact" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50">Nous contacter</Link>
                <a href={COMPANY_CONTACTS.yaounde.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/35 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">WhatsApp Yaoundé</a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 py-9 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <h2 className="mb-3 text-sm font-bold text-white">3M Travel</h2>
            <p className="text-xs leading-relaxed text-slate-300">Un accompagnement fondé sur vos documents, les sources institutionnelles disponibles et des validations humaines à chaque étape sensible.</p>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold text-white">Navigation</h2>
            <ul className="space-y-2 text-sm">
              {NAVIGATION_LINKS.map((link) => <li key={link.label}><FooterShortcut {...link} /></li>)}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold text-white">Destinations</h2>
            <ul className="space-y-2 text-sm">
              {DESTINATION_LINKS.map((link) => <li key={link.label}><FooterShortcut {...link} /></li>)}
            </ul>
          </div>

          <nav aria-label="Mini-plan du site">
            <h2 className="mb-3 text-sm font-bold text-white">Mini-plan du site</h2>
            <ul className="space-y-2 text-sm">
              {MINI_SITE_MAP.map((link) => <li key={link.label}><FooterShortcut {...link} /></li>)}
            </ul>
          </nav>

          <div>
            <h2 className="mb-3 text-sm font-bold text-white">Coordonnées</h2>
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" /><span>Yaoundé : {COMPANY_CONTACTS.yaounde.address}</span></div>
              <div className="flex items-center gap-2"><MessageCircle className="h-4 w-4 shrink-0 text-emerald-300" /><a href={COMPANY_CONTACTS.yaounde.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-200">WhatsApp Yaoundé (principal) : {COMPANY_CONTACTS.yaounde.whatsappNumber}</a></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-blue-300" /><a href={`tel:${COMPANY_CONTACTS.yaounde.phone.replace(/\s/g, "")}`} className="hover:text-blue-200">Fixe Yaoundé : {COMPANY_CONTACTS.yaounde.phone}</a></div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-blue-300" /><span>Ottawa : {COMPANY_CONTACTS.ottawa.address}</span></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-blue-300" /><a href={`tel:+${OFFICE_CONTACTS.ottawa.whatsappNumber}`} className="hover:text-blue-200">Bureau Ottawa : {OFFICE_CONTACTS.ottawa.whatsappDisplay}</a></div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-blue-300" /><a href={`mailto:${COMPANY_CONTACTS.yaounde.email}`} className="hover:text-blue-200">{COMPANY_CONTACTS.yaounde.email}</a></div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold text-white">Informations utiles</h2>
            <ul className="space-y-2 text-sm">
              {USEFUL_LINKS.map((link) => <li key={link.label}><FooterShortcut {...link} /></li>)}
            </ul>
            <div className="mt-5 border-t border-white/15 pt-4">
              <p className="mb-2 text-xs font-semibold text-blue-200">Page officielle</p>
              <FacebookQRCodeWidget />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-5 border-t border-white/15 pt-6 sm:flex-row">
          <div className="flex gap-3">
            {SOCIAL_LINKS.map((social) => {
              const Icon = social.icon;
              const descriptionId = footerTooltipId("footer-social", social.label);
              return (
                <span key={social.label} className="group relative inline-flex">
                    <motion.a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-describedby={descriptionId}
                      initial={false}
                      whileHover={enableSocialMotion ? { y: -3, scale: 1.12 } : undefined}
                      whileTap={enableSocialMotion ? { scale: 0.95 } : undefined}
                      transition={{ type: "spring", stiffness: 480, damping: 20, mass: 0.35 }}
                      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/10 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f2460] motion-reduce:transform-none motion-reduce:transition-none ${social.color}`}
                      aria-label={`Ouvrir ${social.label}`}
                    >
                      <Icon className="h-4 w-4" />
                    </motion.a>
                  <span id={descriptionId} role="tooltip" className={FOOTER_TOOLTIP_CLASS}>
                    {social.description}
                  </span>
                </span>
              );
            })}
          </div>
          <div className="max-w-2xl text-center text-xs leading-relaxed text-slate-400 sm:text-right">
            <p><span className="font-medium text-slate-300">{COMPANY_PROFILE.legalName}</span> — RC : {COMPANY_PROFILE.legalIdentifiers.registration} | NIU : {COMPANY_PROFILE.legalIdentifiers.taxpayerId}</p>
            <p className="mt-1">Rôle de conseil et d’accompagnement. Les décisions de visa appartiennent aux autorités consulaires.</p>
            <p className="mt-1">© {new Date().getFullYear()} {COMPANY_PROFILE.legalName}. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
