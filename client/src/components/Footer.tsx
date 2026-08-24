import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertCircle, Facebook, Instagram, Linkedin, Twitter, MapPin, MessageCircle, Phone, Mail } from "lucide-react";
import FacebookQRCodeWidget from "./FacebookQRCodeWidget";
import { COMPANY_CONTACTS, COMPANY_PROFILE } from "@/lib/companyContacts";
import { OFFICE_CONTACTS } from "@/lib/officeContacts";

const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://www.facebook.com/3mtravelcm', label: 'Facebook officiel', color: 'hover:text-blue-600' },
  { icon: Instagram, href: 'https://instagram.com/3mtravelagency', label: 'Instagram', color: 'hover:text-pink-600' },
  { icon: Linkedin, href: 'https://linkedin.com/company/3mtravelagency', label: 'LinkedIn', color: 'hover:text-blue-700' },
  { icon: Twitter, href: 'https://twitter.com/3mtravelagency', label: 'Twitter', color: 'hover:text-blue-400' },
];

const USEFUL_LINKS = [
  { label: 'Destinations populaires', href: '/procedures' },
  { label: 'Contact', href: '/contact' },
  { label: 'Mentions légales', href: '/conditions-utilisation' },
  { label: 'Plan du site', href: '/plan-du-site' },
  { label: 'Accessibilité', href: '/accessibilite' },
  { label: 'Service 3M Digital', href: '/3m-digital' },
  { label: 'Sources officielles', href: '/sources-officielles' },
];

export default function Footer() {
  return (
    <footer className="bg-[#0f2460] text-gray-300 mt-auto">
      <div className="border-b-2 border-red-700 bg-red-600/90 px-4 py-3 text-white">
        <div className="mx-auto flex max-w-7xl items-start gap-3 text-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p><strong>Avertissement anti-fraude :</strong> les règlements d’ouverture de dossier s’effectuent uniquement sur le guichet sécurisé officiel ou en agence avec reçu officiel. Méfiez-vous des intermédiaires non autorisés.</p>
        </div>
      </div>
      {/* Newsletter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-blue-600 to-blue-800 py-8 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
              Une question sur votre projet ?
            </h3>
            <p className="text-blue-100 text-sm">Contactez l’équipe 3M Travel pour une réponse adaptée à votre situation.</p>
          </div>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50">Ouvrir le formulaire de contact</a>
            <a href={COMPANY_CONTACTS.yaounde.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Écrire sur WhatsApp</a>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">

          {/* Colonne 1 — Identité */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src="/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg"
                alt="Logo 3M Travel Agency"
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Agence officielle d'accompagnement à l'immigration et à la mobilité internationale.
            </p>
          </div>

          {/* Colonne 2 — Navigation */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-blue-300 transition-colors">Accueil</Link></li>
              <li><Link href="/flights" className="hover:text-blue-300 transition-colors">Recherche de vols</Link></li>
              <li><Link href="/procedures" className="hover:text-blue-300 transition-colors">Procédures & Destinations</Link></li>
              <li><Link href="/register" className="hover:text-blue-300 transition-colors">Inscription</Link></li>
              <li><Link href="/login" className="hover:text-blue-300 transition-colors">Mon Espace Candidat</Link></li>
            </ul>
          </div>

          {/* Colonne 3 — Destinations */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Destinations</h4>
            <ul className="space-y-2 text-sm">
              {["🇨🇦 Canada", "🇫🇷 France", "🇩🇪 Allemagne", "🇱🇺 Luxembourg", "🇵🇱 Pologne", "🇬🇧 Royaume-Uni", "🇶🇦 Qatar", "🇦🇺 Australie"].map(d => (
                <li key={d}>
                  <Link href="/procedures" className="hover:text-blue-300 transition-colors">{d}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 4 — Contact */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Siège : {COMPANY_CONTACTS.yaounde.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Bureau d’information : {COMPANY_CONTACTS.ottawa.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <a href={COMPANY_CONTACTS.yaounde.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-green-300 transition-colors">WhatsApp Yaoundé (principal) : {COMPANY_CONTACTS.yaounde.whatsappNumber}</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a href={`tel:${COMPANY_CONTACTS.yaounde.phone.replace(/\s/g, "")}`} className="hover:text-blue-300 transition-colors">Fixe Yaoundé : {COMPANY_CONTACTS.yaounde.phone}</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a href={`tel:+${OFFICE_CONTACTS.ottawa.whatsappNumber}`} className="hover:text-blue-300 transition-colors">Bureau Ottawa : {OFFICE_CONTACTS.ottawa.whatsappDisplay}</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a href={`mailto:${COMPANY_CONTACTS.yaounde.email}`} className="hover:text-blue-300 transition-colors">{COMPANY_CONTACTS.yaounde.email}</a>
              </div>
            </div>
          </div>

          {/* Colonne 5 — Liens utiles */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Liens utiles</h4>
            <ul className="space-y-2 text-sm">
              {USEFUL_LINKS.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('/') ? (
                    <Link href={link.href} className="hover:text-blue-300 transition-colors">{link.label}</Link>
                  ) : (
                    <a href={link.href} className="hover:text-blue-300 transition-colors">{link.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* QR Code Facebook Widget */}
        <div className="py-6 border-t border-gray-700/80 mt-8 flex flex-col items-center">
          <p className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">Rejoignez-nous sur notre page officielle</p>
          <FacebookQRCodeWidget />
        </div>

        {/* Social Media Section */}
        <div className="flex justify-center gap-4 py-6 border-t border-gray-700 mt-4">
          {SOCIAL_LINKS.map((social) => {
            const Icon = social.icon;
            return (
              <motion.a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center transition duration-200 ${social.color}`}
                title={social.label}
                aria-label={`Ouvrir la page ${social.label} de 3M Travel Agency`}
              >
                <Icon className="w-5 h-5" />
              </motion.a>
            );
          })}
        </div>

        {/* Barre légale */}
        <div className="border-t border-gray-700 pt-6 text-xs text-gray-500 text-center space-y-1">
          <p>
            <span className="text-gray-400 font-medium">{COMPANY_PROFILE.legalName}</span> — RC : {COMPANY_PROFILE.legalIdentifiers.registration} | NIU : {COMPANY_PROFILE.legalIdentifiers.taxpayerId}
          </p>
          <p>
            Rôle de conseil et d'accompagnement. Les décisions d'octroi de visa appartiennent exclusivement aux autorités consulaires.
          </p>
          <p className="mt-2">© {new Date().getFullYear()} {COMPANY_PROFILE.legalName}. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
