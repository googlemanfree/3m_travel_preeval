import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-[#0f2460] text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

          {/* Colonne 1 — Identité */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src="/manus-storage/logo_3m_d0e23210.jpeg"
                alt="3M Travel"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-400/30"
              />
              <div>
                <div className="font-black text-white text-sm leading-tight">3M Travel & Services</div>
                <div className="text-xs text-blue-300">Votre mobilité, notre expertise</div>
              </div>
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
        </div>

        {/* Barre légale */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-xs text-gray-500 text-center space-y-1">
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
