import { Shield, MapPin, Phone, Mail, CheckCircle2 } from "lucide-react";

export function CredibilityBadge() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Colonne gauche : Informations légales */}
        <div>
          <div className="flex items-start gap-3 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">3M Travel & Services SARL</h3>
              <p className="text-sm text-blue-700 font-semibold">Agence officielle enregistrée</p>
            </div>
          </div>

          {/* Numéros d'enregistrement */}
          <div className="space-y-3 mb-6 bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-600">Numéro RC (Registre du Commerce)</p>
                <p className="font-mono font-bold text-gray-900">RC/YAO/2019/A/2567</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-600">Numéro NIU (Numéro d'Identification Unique)</p>
                <p className="font-mono font-bold text-gray-900">M112417203369H</p>
              </div>
            </div>
          </div>

          {/* Charte de Transparence */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-amber-900 mb-2">📋 Charte de Transparence</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Notre rôle est d'accompagner la recherche d'employeur, la préparation technique du dossier et le suivi administratif. Nous ne délivrons pas nous-mêmes de visa ou de permis de travail — cette décision appartient exclusivement aux autorités compétentes de chaque pays d'accueil.
            </p>
          </div>
        </div>

        {/* Colonne droite : Coordonnées */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4 text-sm">Nous Contacter</h4>
          <div className="space-y-4">
            {/* Adresse */}
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-600">Adresse Physique</p>
                <p className="text-sm font-medium text-gray-900">
                  Yaoundé, Biyem-Assi<br />
                  Montée chapelle Obili (10m de EHS)<br />
                  <span className="text-xs text-gray-600">Cameroun</span>
                </p>
              </div>
            </div>

            {/* Téléphones */}
            <div className="flex gap-3">
              <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-600">Téléphone & WhatsApp</p>
                <div className="space-y-1">
                  <a href="tel:+237620996045" className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors block">
                    📞 +237 620-996-045
                  </a>
                  <a href="tel:+237698104832" className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors block">
                    📞 +237 698 104 832
                  </a>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex gap-3">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-600">Email</p>
                <a href="mailto:hello@3mtravelagency.com" className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors">
                  hello@3mtravelagency.com
                </a>
              </div>
            </div>
          </div>

          {/* Horaires */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">Disponibilité</p>
            <p className="text-sm text-gray-700">
              Lundi - Vendredi : 8h - 17h<br />
              Samedi : 9h - 13h<br />
              <span className="text-xs text-gray-600">Dimanche : Fermé</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
