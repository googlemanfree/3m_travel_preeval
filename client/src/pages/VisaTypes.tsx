import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VISA_TYPES } from "@shared/visaData";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function VisaTypes() {
  const [, navigate] = useLocation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const visaArray = Object.values(VISA_TYPES);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />

      {/* En-tête */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Types de Visa</h1>
          <p className="text-lg text-blue-100 max-w-2xl">
            Explorez les 6 catégories principales de visas et trouvez celle qui correspond à votre projet
            de mobilité internationale.
          </p>
        </div>
      </section>

      {/* Grille de cartes */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visaArray.map((visa) => (
            <Card
              key={visa.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-0"
              onClick={() => toggleExpand(visa.id)}
            >
              {/* En-tête de la carte */}
              <div
                className="p-6 text-white"
                style={{ backgroundColor: visa.color }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-4xl">{visa.icon}</span>
                  <ChevronDown
                    size={24}
                    className={`transition-transform ${
                      expandedId === visa.id ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">{visa.name}</h3>
                <p className="text-sm opacity-90">{visa.description}</p>
              </div>

              {/* Contenu détaillé (expandable) */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  expandedId === visa.id ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="p-6 space-y-4 bg-white">
                  {/* Délai et coût */}
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Délai</p>
                      <p className="text-sm font-semibold text-gray-900">{visa.processingTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Coût</p>
                      <p className="text-sm font-semibold text-gray-900">{visa.cost}</p>
                    </div>
                  </div>

                  {/* Conditions d'éligibilité */}
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Conditions</p>
                    <ul className="text-sm space-y-1">
                      {visa.eligibility.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-500 font-bold">✓</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Avantages */}
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Avantages</p>
                    <ul className="text-sm space-y-1">
                      {visa.advantages.slice(0, 2).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-500 font-bold">★</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bouton CTA */}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/open-dossier");
                    }}
                    className="w-full mt-4"
                    style={{ backgroundColor: visa.color }}
                  >
                    Commencer l'évaluation
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section d'information supplémentaire */}
      <section className="bg-white py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Comment choisir votre visa ?</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Le choix du type de visa dépend de plusieurs facteurs : votre objectif principal (études,
                travail, visite), votre situation personnelle, vos qualifications professionnelles et votre
                destination souhaitée.
              </p>
              <p>
                Chaque type de visa a ses propres critères d'admissibilité, délais de traitement et coûts.
                Notre équipe d'experts peut vous aider à déterminer le visa le plus approprié pour votre
                situation.
              </p>
              <p>
                Cliquez sur chaque type de visa pour voir plus de détails, ou consultez notre page{" "}
                <button
                  onClick={() => navigate("/guide")}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Guide complet
                </button>{" "}
                pour les procédures étape par étape.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
