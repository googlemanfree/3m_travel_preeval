import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

export function Tarifs() {
  const plans = [
    {
      name: "Évaluation Gratuite",
      price: "0",
      description: "Commencez votre parcours",
      features: [
        "Évaluation d'éligibilité",
        "Rapport détaillé",
        "Recommandations personnalisées",
        "Valide 48h",
      ],
    },
    {
      name: "Dossier Complet",
      price: "65 000",
      currency: "XAF",
      description: "Traitement complet de votre dossier",
      features: [
        "Tout de l'évaluation gratuite",
        "Vérification des documents",
        "Soumission aux agences partenaires",
        "Suivi administratif complet",
        "Support prioritaire",
      ],
      highlighted: true,
    },
    {
      name: "Accompagnement Premium",
      price: "Sur devis",
      description: "Service personnalisé complet",
      features: [
        "Tout du dossier complet",
        "Coaching entretien visa",
        "Assistance juridique",
        "Suivi jusqu'à l'obtention du visa",
        "Garantie satisfaction",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Nos Tarifs</h1>
          <p className="text-xl text-gray-600">
            Des solutions adaptées à votre projet de mobilité internationale
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <Card
              key={idx}
              className={`relative p-8 transition-all ${
                plan.highlighted
                  ? "ring-2 ring-blue-500 shadow-xl scale-105"
                  : "hover:shadow-lg"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Populaire
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price}
                </span>
                {plan.currency && (
                  <span className="text-gray-600 ml-2">{plan.currency}</span>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, fidx) => (
                  <li key={fidx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                Choisir ce plan
              </button>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-lg p-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Questions Fréquentes
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Puis-je payer en plusieurs fois ?
              </h3>
              <p className="text-gray-600">
                Oui, nous proposons des plans de paiement flexibles. Contactez notre équipe pour discuter des options.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Y a-t-il des frais cachés ?
              </h3>
              <p className="text-gray-600">
                Non, tous nos tarifs sont transparents et incluent tous les frais. Aucun frais supplémentaire.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Que se passe-t-il si mon dossier est rejeté ?
              </h3>
              <p className="text-gray-600">
                Nous vous remboursons 50% des frais et vous aidons à améliorer votre dossier pour une nouvelle tentative.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
