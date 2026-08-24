import { Shield, MapPin, Phone, Mail, CheckCircle2 } from "lucide-react";
import { COMPANY_CONTACTS, COMPANY_PROFILE } from "@/lib/companyContacts";

export function CredibilityBadge() {
  const cameroon = COMPANY_PROFILE.offices.cameroon;
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
              <h3 className="font-bold text-lg text-gray-900">{COMPANY_PROFILE.legalName}</h3>
              <p className="text-sm text-blue-700 font-semibold">Agence officielle enregistrée</p>
            </div>
          </div>

          {/* Numéros d'enregistrement */}
          <div className="space-y-3 mb-6 bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-600">Numéro RC (Registre du Commerce)</p>
                <p className="font-mono font-bold text-gray-900">{COMPANY_PROFILE.legalIdentifiers.registration}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-600">Numéro NIU (Numéro d'Identification Unique)</p>
                <p className="font-mono font-bold text-gray-900">{COMPANY_PROFILE.legalIdentifiers.taxpayerId}</p>
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
                  {cameroon.addressLines.map((line) => <span key={line}>{line}<br /></span>)}
                </p>
              </div>
            </div>

            {/* Téléphones */}
            <div className="flex gap-3">
              <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-600">Téléphone & WhatsApp</p>
                <div className="space-y-1">
                  <a href={`tel:${cameroon.phoneDisplay?.replace(/\s/g, "")}`} className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors block">
                    📞 {cameroon.phoneDisplay}
                  </a>
                  <a href={`tel:+${cameroon.whatsappNumber}`} className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors block">
                    📞 {cameroon.whatsappDisplay}
                  </a>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex gap-3">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-600">Email</p>
                <a href={`mailto:${COMPANY_PROFILE.publicEmail}`} className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors">
                  {COMPANY_PROFILE.publicEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Horaires */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">Disponibilité</p>
            <p className="text-sm text-gray-700">
              {cameroon.openingHours.map((hours) => <span key={hours}>{hours}<br /></span>)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
