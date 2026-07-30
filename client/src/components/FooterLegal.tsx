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
            <h3 className="text-lg font-bold mb-4">3M Travel & Services SARL</h3>
            <div className="space-y-3 text-sm text-blue-100">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Avenue Marché Biyem-Assi, Montée Chapelle Obili, Yaoundé, Cameroun</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+237698104832" className="hover:text-white transition">
                  +237 698 104 832
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:hello@3mtravelagency.click" className="hover:text-white transition">
                  hello@3mtravelagency.click
                </a>
              </div>
            </div>
          </div>

          {/* Legal Info */}
          <div>
            <h4 className="font-bold mb-4">Informations Légales</h4>
            <div className="space-y-2 text-sm text-blue-100">
              <p><strong>RCCM :</strong> CM/CM/2023/XXXX</p>
              <p><strong>NIU :</strong> 3012345678901</p>
              <p><strong>Registre du Commerce :</strong> Yaoundé</p>
              <p><strong>Gérant :</strong> Aureol DONFACK</p>
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
                <a href="#" className="hover:text-white transition">
                  Conditions Générales
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold mb-4">Nos Services</h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li>🛂 Visa & Immigration</li>
              <li>✈️ Billets d'Avion</li>
              <li>🏨 Hébergement</li>
              <li>🛡️ Assurance Voyage</li>
              <li>📄 Traduction Certifiée</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-blue-700 pt-8 mb-8">
          {/* Compliance Section */}
          <div className="bg-blue-900/50 rounded-lg p-4 mb-6">
            <h4 className="font-bold text-sm mb-2">Conformité & Sécurité</h4>
            <p className="text-xs text-blue-100">
              3M Travel & Services SARL est une agence de voyage agréée opérant en conformité avec la législation camerounaise. 
              Tous les paiements sont sécurisés via CinetPay. Vos données personnelles sont protégées selon nos politiques de confidentialité.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-blue-700 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-blue-200">
          <p>&copy; 2026 3M Travel & Services SARL. Tous droits réservés.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition">
              Politique de Confidentialité
            </a>
            <a href="#" className="hover:text-white transition">
              Conditions d'Utilisation
            </a>
            <a href="#" className="hover:text-white transition">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
