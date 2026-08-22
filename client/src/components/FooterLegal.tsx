import { Mail, Phone, MapPin, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export function FooterLegal() {
  return (
    <footer className="bg-gradient-to-b from-blue-900 to-blue-950 text-white">
      {/* Warning Banner */}
      <div className="bg-red-600/90 backdrop-blur-sm border-b-2 border-red-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              ⚠️ <strong>Avertissement Anti-Fraude :</strong> Tous les règlements d'ouverture de dossier (65 000 FCFA) s'effectuent <strong>UNIQUEMENT</strong> sur notre guichet officiel sécurisé ou en agence avec reçu officiel. Méfiez-vous des intermédiaires non autorisés.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">3M Travel Agency SARL</h3>
            <div className="space-y-3 text-sm text-blue-100">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Siège : Yaoundé, Biyem-Assi, Montée chapelle Obili (10 m de EHS), Cameroun. Bureau secondaire : Douala.</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+237698104832" className="hover:text-white transition">
                  +237 698 104 832
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-4 h-4" />
                <span>Bureau Ottawa, Canada : +1 672 897 2999</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:hello@3mtravelagency.com" className="hover:text-white transition">
                  hello@3mtravelagency.com
                </a>
              </div>
            </div>
          </div>

          {/* Legal Info */}
          <div>
            <h4 className="font-bold mb-4">Informations Légales</h4>
            <div className="space-y-2 text-sm text-blue-100">
              <p><strong>RC :</strong> RC/YAO/2019/A/2567</p>
              <p><strong>NIU :</strong> M112417203369H</p>
              <p><strong>Horaires :</strong> Lundi à vendredi, 8h–17h</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Liens Rapides</h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>
                <Link href="/evaluation" className="hover:text-white transition">
                  Évaluation Gratuite
                </Link>
              </li>
              <li>
                <Link href="/procedures" className="hover:text-white transition">
                  Procédures
                </Link>
              </li>
              <li>
                <Link href="/mon-espace" className="hover:text-white transition">
                  Mon Espace
                </Link>
              </li>
              <li>
                <Link href="/conditions-utilisation" className="hover:text-white transition">
                  Conditions Générales
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold mb-4">Nos Services</h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>🛂 Visa & Immigration</li>
              <li>✈️ Billets d'Avion</li>
              <li>🏨 Hôtels & Tourisme</li>
              <li>🛡️ Assurance Voyage</li>
              <li>📄 Traduction certifiée</li>
              <li>📋 Procédures & Guides</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-blue-700 pt-8 mb-8">
          {/* Compliance Section */}
          <div className="bg-blue-900/50 rounded-lg p-4 mb-6">
            <h4 className="font-bold text-sm mb-2">Conformité & Sécurité</h4>
            <p className="text-xs text-blue-100">
              3M Travel Agency SARL accompagne la préparation technique des dossiers et leur suivi administratif. Elle ne délivre pas elle-même de visa ou de permis : ces décisions relèvent exclusivement des autorités compétentes.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-700 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-blue-200">
          <p>&copy; 2026 3M Travel Agency SARL. Tous droits réservés.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/politique-confidentialite" className="hover:text-white transition">
              Politique de Confidentialité
            </Link>
            <Link href="/conditions-utilisation" className="hover:text-white transition">
              Conditions d'Utilisation
            </Link>
            <Link href="/contact" className="hover:text-white transition">
              Contact
            </Link>
            <Link href="/plan-du-site" className="hover:text-white transition">
              Plan du site
            </Link>
            <Link href="/accessibilite" className="hover:text-white transition">
              Accessibilité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
