import { Phone, Mail, MapPin, MessageCircle, Facebook, Instagram, Linkedin, Twitter, Send, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";

const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://facebook.com/3mtravelagency', label: 'Facebook', color: 'hover:text-blue-600' },
  { icon: Instagram, href: 'https://instagram.com/3mtravelagency', label: 'Instagram', color: 'hover:text-pink-600' },
  { icon: Linkedin, href: 'https://linkedin.com/company/3mtravelagency', label: 'LinkedIn', color: 'hover:text-blue-700' },
  { icon: Twitter, href: 'https://twitter.com/3mtravelagency', label: 'Twitter', color: 'hover:text-blue-400' },
];

const USEFUL_LINKS = [
  { label: 'Destinations populaires', href: '/procedures' },
  { label: 'Contact', href: '/contact' },
  { label: 'Mentions legales', href: '#' },
  { label: 'Plan du site', href: '#' },
  { label: 'Accessibilite', href: '#' },
  { label: 'Sitemap', href: '#' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Veuillez entrer une adresse email');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowSuccess(true);
      setEmail('');
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="bg-[#0f2460] text-gray-300 mt-auto">
      {/* Newsletter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-blue-600 to-blue-800 py-8 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
              Restez informé de nos meilleures offres
            </h3>
            <p className="text-blue-100 text-sm">Inscrivez-vous à notre newsletter pour recevoir les dernières actualités</p>
          </div>
          
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Votre adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white text-gray-900 placeholder-gray-500 text-sm"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold whitespace-nowrap text-sm"
            >
              {isLoading ? 'Inscription...' : <span className="flex items-center gap-1"><Send className="w-4 h-4" />S'inscrire</span>}
            </Button>
          </form>
          
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="mt-6 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-4 text-center max-w-md mx-auto"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="inline-block mb-2"
              >
                <CheckCircle2 className="w-8 h-8 text-green-300" />
              </motion.div>
              <p className="text-white font-semibold text-lg">Inscription reussie !</p>
              <p className="text-blue-100 text-sm mt-1">Verifiez votre email pour confirmer votre inscription</p>
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 5, ease: 'linear' }}
                className="h-1 bg-green-300 rounded-full mt-3 origin-left"
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">

          {/* Colonne 1 — Identité */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src="/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg"
                alt="3M Travel & Services"
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
              <li><Link href="/register" className="hover:text-blue-300 transition-colors">Créer un compte</Link></li>
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
                <span>Yaoundé Biyem-Assi, Montée chapelle Obili (10m de EHS)</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a href="tel:+237620996045" className="hover:text-blue-300 transition-colors">+237 620-996-045</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a href="tel:+237698104832" className="hover:text-blue-300 transition-colors">+237 698-104-832</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <a href="mailto:hello@3mtravelagency.com" className="hover:text-blue-300 transition-colors">hello@3mtravelagency.com</a>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <a href="https://wa.me/237698104832" target="_blank" rel="noopener noreferrer" className="hover:text-green-300 transition-colors">WhatsApp</a>
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

        {/* Social Media Section */}
        <div className="flex justify-center gap-4 py-6 border-t border-gray-700 mt-8">
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
              >
                <Icon className="w-5 h-5" />
              </motion.a>
            );
          })}
        </div>

        {/* Contact Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 rounded-lg p-6 my-8 border border-blue-700/50"
        >
          <h3 className="text-white font-bold text-lg mb-4 text-center">Nous Contacter</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="https://maps.google.com/?q=Yaound%C3%A9+Biyem-Assi+Mont%C3%A9e+chapelle+Obili" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 text-center hover:opacity-80 transition-opacity cursor-pointer">
              <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-1">Adresse</p>
                <p className="text-sm text-white font-medium hover:text-blue-300 transition-colors">Yaoundé Biyem-Assi<br />Montée chapelle Obili</p>
              </div>
            </a>
            <a href="tel:+237620996045" className="flex items-center justify-center gap-3 text-center hover:opacity-80 transition-opacity cursor-pointer">
              <Phone className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-1">Téléphone</p>
                <p className="text-sm text-white font-medium hover:text-blue-300 transition-colors">
                  <span>+237 620-996-045</span><br />
                  <span className="text-xs text-gray-300">ou +237 698-104-832</span>
                </p>
              </div>
            </a>
            <a href="mailto:hello@3mtravelagency.com" className="flex items-center justify-center gap-3 text-center hover:opacity-80 transition-opacity cursor-pointer">
              <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-1">Email</p>
                <p className="text-sm text-white font-medium hover:text-blue-300 transition-colors">
                  hello@3mtravelagency.com
                </p>
              </div>
            </a>
          </div>
        </motion.div>

        {/* Barre légale */}
        <div className="border-t border-gray-700 pt-6 text-xs text-gray-500 text-center space-y-1">
          <p>
            <span className="text-gray-400 font-medium">3M Travel & Services SARL</span> — RC/YAO/2019/A/2567 | NIU : M112417203369H
          </p>
          <p>
            Rôle de conseil et d'accompagnement. Les décisions d'octroi de visa appartiennent exclusivement aux autorités consulaires.
          </p>
          <p className="mt-2">© {new Date().getFullYear()} 3M Travel & Services. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
