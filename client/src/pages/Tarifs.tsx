import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Tarifs() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("canada");

  const categories = [
    {
      id: "canada",
      name: "🇨🇦 Canada",
      items: [
        { service: "Résidence Permanente (RP)", price: "500 000 FCFA", delay: "3-4 mois" },
        { service: "Étudiant", price: "300 000 FCFA", delay: "2-3 mois" },
        { service: "Travailleur temporaire", price: "250 000 FCFA", delay: "2-3 mois" },
      ],
    },
    {
      id: "europe",
      name: "🇪🇺 Europe & Schengen",
      items: [
        { service: "Visa Schengen (Étude)", price: "150 000 FCFA", delay: "2-3 mois" },
        { service: "Visa Schengen (Travail)", price: "200 000 FCFA", delay: "2-3 mois" },
        { service: "Visa Schengen (Tourisme)", price: "100 000 FCFA", delay: "1-2 mois" },
      ],
    },
    {
      id: "golfe",
      name: "🏜️ Golfe & Moyen-Orient",
      items: [
        { service: "Visa Dubaï/EAU", price: "95 000 FCFA", delay: "1-2 mois" },
        { service: "Visa Arabie Saoudite", price: "120 000 FCFA", delay: "2-3 mois" },
      ],
    },
    {
      id: "admin",
      name: "⚙️ Services Administratifs",
      items: [
        { service: "AVI — Attestation Bancaire", price: "50 000 FCFA", delay: "2-3 semaines" },
        { service: "Réservation Vol pour Visa", price: "5 000 FCFA", delay: "24-48h" },
        { service: "Traduction de documents", price: "15 000 FCFA", delay: "3-5 jours" },
      ],
    },
    {
      id: "tests",
      name: "🧪 Tests de Langue",
      items: [
        { service: "TCF (Test de Français)", price: "80 000 FCFA", delay: "1-2 semaines" },
        { service: "IELTS/TOEFL", price: "90 000 FCFA", delay: "1-2 semaines" },
        { service: "Préparation TCF", price: "120 000 FCFA", delay: "4 semaines" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Grille Tarifaire</h1>
          <p className="text-lg text-blue-100">Tous nos tarifs par service — Transparence totale, aucun frais caché</p>
        </div>
      </section>

      {/* Contenu */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                  className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                  <ChevronDown
                    className={`w-6 h-6 text-gray-600 transition-transform ${
                      expandedCategory === category.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {expandedCategory === category.id && (
                  <div className="p-6 space-y-4">
                    {category.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{item.service}</p>
                          <p className="text-sm text-gray-600">Délai : {item.delay}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Formules de paiement */}
          <div className="mt-16 pt-12 border-t-2 border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Formules de Paiement</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-2 border-blue-600 rounded-lg p-6 bg-blue-50">
                <h3 className="text-xl font-bold text-blue-900 mb-4">💰 Règlement Intégral</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Traitement prioritaire
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Réduction -5%
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Suivi personnalisé
                  </li>
                </ul>
              </div>

              <div className="border-2 border-yellow-400 rounded-lg p-6 bg-yellow-50">
                <h3 className="text-xl font-bold text-yellow-900 mb-4">📅 Échelonné (4-5 mois)</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Flexible selon budget
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Suivi régulier
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Le plus choisi
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <a
              href="https://wa.me/237698104832?text=Bonjour%203M%20Travel%2C%20j%27aimerais%20plus%20d%27informations%20sur%20vos%20tarifs."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              💬 Discuter avec un conseiller
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
