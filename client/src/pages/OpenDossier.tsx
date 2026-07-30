import Footer from "@/components/Footer";
import FullDossierForm from "@/components/FullDossierForm";
import type { VisaCategory } from "@/components/FullDossierForm";
import { useSearch } from "wouter";

export default function OpenDossier() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const visaType = params.get("visaType") as VisaCategory | null;
  const destination = params.get("destination") ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* En-tête de la page */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Constitution de dossier officiel
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Ouvrir mon dossier d'immigration
            </h1>
            <p className="text-gray-500 text-base max-w-lg mx-auto">
              Remplissez ce formulaire complet pour que nos experts puissent analyser votre profil
              et vous accompagner dans votre projet de mobilité internationale.
            </p>
          </div>

          {/* Formulaire complet */}
          <FullDossierForm
            initialVisaType={visaType ?? undefined}
            initialDestination={destination}
          />

          {/* Garanties */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: "🔒", label: "Données sécurisées", desc: "Chiffrement SSL" },
              { icon: "✅", label: "Dossier vérifié", desc: "Par nos experts" },
              { icon: "📧", label: "Confirmation email", desc: "Immédiate" },
            ].map(g => (
              <div key={g.label} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="text-2xl mb-1">{g.icon}</div>
                <div className="text-xs font-semibold text-gray-700">{g.label}</div>
                <div className="text-xs text-gray-400">{g.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
