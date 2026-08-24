import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertCircle, Facebook, Instagram, Linkedin, Twitter, MapPin, MessageCircle, Phone, Mail } from "lucide-react";
import FacebookQRCodeWidget from "./FacebookQRCodeWidget";
import { COMPANY_CONTACTS, COMPANY_PROFILE } from "@/lib/companyContacts";
import { OFFICE_CONTACTS } from "@/lib/officeContacts";

const SOCIAL_LINKS = [
  { icon: Facebook, href: "https://www.facebook.com/3mtravelcm", label: "Facebook officiel", color: "hover:text-blue-300" },
  { icon: Instagram, href: "https://instagram.com/3mtravelagency", label: "Instagram", color: "hover:text-pink-300" },
  { icon: Linkedin, href: "https://linkedin.com/company/3mtravelagency", label: "LinkedIn", color: "hover:text-blue-300" },
  { icon: Twitter, href: "https://twitter.com/3mtravelagency", label: "Twitter", color: "hover:text-sky-300" },
];

const USEFUL_LINKS = [
  { label: "Destinations populaires", href: "/procedures" },
  { label: "Contact", href: "/contact" },
  { label: "Mentions légales", href: "/conditions-utilisation" },
  { label: "Plan du site", href: "/plan-du-site" },
  { label: "Accessibilité", href: "/accessibilite" },
  { label: "Service 3M Digital", href: "/3m-digital" },
  { label: "Sources officielles", href: "/sources-officielles" },
];

const MINI_SITE_MAP = [
  { label: "Évaluation gratuite", href: "/?project=travail#evaluation-multi" },
  { label: "3M Booking", href: "/billets" },
  { label: "Procédures", href: "/procedures" },
  { label: "e-Visas", href: "/evisas" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Sources officielles", href: "/sources-officielles" },
];

const FOOTER_SHORTCUT_CLASS = "group inline-flex min-h-8 items-center rounded-md px-1 py-1 outline-none transition-[color,transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:translate-x-1 hover:bg-white/10 hover:text-blue-100 focus-visible:translate-x-1 focus-visible:bg-white/10 focus-visible:text-blue-100 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f2460] motion-reduce:transform-none motion-reduce:transition-none";

export default function Footer() {
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
              <li><Link href="/" className={FOOTER_SHORTCUT_CLASS}>Accueil</Link></li>
              <li><Link href="/flights" className={FOOTER_SHORTCUT_CLASS}>Recherche de vols</Link></li>
              <li><Link href="/procedures" className={FOOTER_SHORTCUT_CLASS}>Procédures &amp; destinations</Link></li>
              <li><Link href="/register" className={FOOTER_SHORTCUT_CLASS}>Inscription</Link></li>
              <li><Link href="/login" className={FOOTER_SHORTCUT_CLASS}>Espace candidat</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold text-white">Destinations</h2>
            <ul className="space-y-2 text-sm">
              {["Canada", "France", "Allemagne", "Luxembourg", "Royaume-Uni", "Australie"].map((destination) => (
                <li key={destination}><Link href="/procedures" className={FOOTER_SHORTCUT_CLASS}>{destination}</Link></li>
              ))}
            </ul>
          </div>

          <nav aria-label="Mini-plan du site">
            <h2 className="mb-3 text-sm font-bold text-white">Mini-plan du site</h2>
            <ul className="space-y-2 text-sm">
              {MINI_SITE_MAP.map((link) => <li key={link.label}><Link href={link.href} className={FOOTER_SHORTCUT_CLASS}>{link.label}</Link></li>)}
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
              {USEFUL_LINKS.map((link) => <li key={link.label}><Link href={link.href} className={FOOTER_SHORTCUT_CLASS}>{link.label}</Link></li>)}
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
              return <motion.a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.96 }} className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ${social.color}`} aria-label={`Ouvrir ${social.label}`}><Icon className="h-4 w-4" /></motion.a>;
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
