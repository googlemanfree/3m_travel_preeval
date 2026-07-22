import { useState } from "react";
import { motion } from "framer-motion";
import { X, ArrowRight } from "lucide-react";

export default function ResourcesFloatingWidget() {
  const [open, setOpen] = useState(false);

  const resources = [
    { icon: "💰", label: "Grille Tarifaire", href: "/tarifs", desc: "Tous nos tarifs par service" },
    { icon: "🏦", label: "AVI Bancaire", href: "/avi", desc: "Attestation de virement irrévocable" },
    { icon: "📚", label: "Blog & Conseils", href: "/blog", desc: "10 articles complets" },
    { icon: "📋", label: "Procédures", href: "/procedures", desc: "Étapes par destination" },
    { icon: "🗺️", label: "Destinations", href: "/destinations", desc: "Pays & opportunités" },
    { icon: "⭐", label: "Évaluation gratuite", href: "/evaluation-widget", desc: "Testez votre éligibilité" },
  ];

  return (
    <div className="fixed bottom-24 right-6 z-40">
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(!open)}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E3A8A] text-white shadow-2xl flex items-center justify-center font-bold text-2xl transition-all hover:scale-110 active:scale-95"
        title="Ressources"
      >
        📖
      </button>

      {/* Menu flottant */}
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-20 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Ressources</h3>
              <p className="text-xs opacity-90">Guides & Informations</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Liste des ressources */}
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {resources.map((res, i) => (
              <a
                key={i}
                href={res.href}
                className="p-4 hover:bg-blue-50 transition-colors flex items-start gap-3 group"
              >
                <span className="text-2xl flex-shrink-0">{res.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 group-hover:text-[#1E3A8A] transition-colors">
                    {res.label}
                  </p>
                  <p className="text-xs text-gray-500">{res.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#1E3A8A] flex-shrink-0 mt-1 transition-colors" />
              </a>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="bg-blue-50 p-4 border-t border-gray-100">
            <a
              href="https://wa.me/237698104832?text=Bonjour%203M%20Travel%2C%20j%27ai%20des%20questions%20sur%20vos%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-4 bg-gradient-to-r from-[#25d366] to-[#128c7e] text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all active:scale-95 block text-center"
              onClick={() => setOpen(false)}
            >
              💬 Parler à un conseiller
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}
