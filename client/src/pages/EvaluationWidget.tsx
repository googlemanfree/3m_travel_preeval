import { useState } from "react";
import { ChevronRight, MessageCircle, Loader } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Profil {
  nom: string;
  email: string;
  whatsapp: string;
  niveau: string;
  langue: string;
  budget: string;
  objectif: string;
}

interface Destination {
  id: string;
  nom: string;
  url: string;
  conditions: (p: Profil) => boolean;
}

const DESTINATIONS: Destination[] = [
  {
    id: "ALLEMAGNE",
    nom: "Allemagne (Scolarité Gratuite)",
    url: "/destinations?country=allemagne",
    conditions: (p) => p.langue === "Allemand",
  },
  {
    id: "CANADA",
    nom: "Canada (Permis d'Études & Résidence)",
    url: "/destinations?country=canada",
    conditions: (p) => p.objectif === "Immigration" || (p.budget !== "Faible" && p.langue !== "Allemand"),
  },
  {
    id: "USA_UK",
    nom: "USA / Royaume-Uni / Australie",
    url: "/destinations?country=usa-uk",
    conditions: (p) => p.budget === "Élevé" && (p.langue === "Anglais" || p.langue === "Bilingue"),
  },
  {
    id: "FRANCE_BELGIQUE",
    nom: "France / Belgique (Campus France & Public)",
    url: "/destinations?country=france-belgique",
    conditions: (p) => p.langue === "Français",
  },
];

const DEFAULT_DESTINATION = {
  nom: "Assistance Visa & Orientation Générale",
  url: "/destinations",
};

export default function EvaluationWidget() {
  const [formData, setFormData] = useState<Profil>({
    nom: "",
    email: "",
    whatsapp: "",
    niveau: "",
    langue: "",
    budget: "",
    objectif: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recommendedDestination, setRecommendedDestination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Trouver la destination correspondante
    const destination = DESTINATIONS.find((dest) => dest.conditions(formData)) || DEFAULT_DESTINATION;
    setRecommendedDestination(destination);

    // Simuler un délai de traitement
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
    }, 1500);
  };

  const handleWhatsApp = () => {
    const whatsappAgence = "237698104832"; // Numéro 3M Travel
    const textWA = encodeURIComponent(
      `*NOUVELLE ÉVALUATION 3M TRAVEL*\n\n` +
        `👤 *Nom:* ${formData.nom}\n` +
        `📞 *WhatsApp:* ${formData.whatsapp}\n` +
        `🎓 *Niveau:* ${formData.niveau}\n` +
        `🗣️ *Langue:* ${formData.langue}\n` +
        `💰 *Budget:* ${formData.budget}\n` +
        `🎯 *Objectif:* ${formData.objectif}\n\n` +
        `📍 *Destination Recommandée:* ${recommendedDestination?.nom || "À déterminer"}`
    );
    window.open(`https://wa.me/${whatsappAgence}?text=${textWA}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3">Évaluation d'Éligibilité</h1>
          <p className="text-lg text-blue-100">Découvrez votre meilleure option d'immigration en 2 minutes</p>
        </div>
      </section>

      {/* Formulaire */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {!isSubmitted ? (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Niveau d'études */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Niveau d'études / Profil actuel *
                  </label>
                  <select
                    id="niveau"
                    value={formData.niveau}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">-- Sélectionnez votre niveau --</option>
                    <option value="Baccalauréat">Baccalauréat / Secondary School</option>
                    <option value="Licence">Licence / Bachelor (Bac+3)</option>
                    <option value="Master">Master / Doctorat (Bac+5 et plus)</option>
                    <option value="Professionnel">Professionnel / Demandeur d'emploi</option>
                  </select>
                </div>

                {/* Langue */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Langue principale maîtrisée *
                  </label>
                  <select
                    id="langue"
                    value={formData.langue}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">-- Sélectionnez la langue --</option>
                    <option value="Français">Français uniquement</option>
                    <option value="Anglais">Anglais (B2/C1, IELTS, TOEFL)</option>
                    <option value="Allemand">Allemand (B1/B2/C1)</option>
                    <option value="Bilingue">Bilingue (Français & Anglais)</option>
                  </select>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Budget annuel estimé (Scolarité + Vie) *
                  </label>
                  <select
                    id="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">-- Sélectionnez votre budget --</option>
                    <option value="Faible">Moins de 4 000 € / an (~2.5 M FCFA)</option>
                    <option value="Moyen">4 000 € à 10 000 € / an (2.5 M à 6.5 M FCFA)</option>
                    <option value="Élevé">Plus de 10 000 € / an (&gt; 6.5 M FCFA)</option>
                  </select>
                </div>

                {/* Objectif */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Objectif principal *
                  </label>
                  <select
                    id="objectif"
                    value={formData.objectif}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">-- Sélectionnez votre objectif --</option>
                    <option value="Diplôme">Obtenir un diplôme international</option>
                    <option value="Travail">Travailler pendant/après les études</option>
                    <option value="Immigration">Immigration durable / Résidence permanente</option>
                    <option value="Assistance">Assistance Visa & Billetterie rapide</option>
                  </select>
                </div>

                <hr className="my-6" />

                {/* Nom */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Nom complet *</label>
                  <input
                    type="text"
                    id="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder="Ex: Jean Dupont"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Email et WhatsApp */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Adresse E-mail *</label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="exemple@email.com"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Numéro WhatsApp *</label>
                    <input
                      type="tel"
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      placeholder="+237 6XXXXXXXX"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Bouton Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      Lancer l'Évaluation
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            // Écran de résultat
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mb-6">
                <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Analyse Complète !</h2>
                <p className="text-gray-600">Voici votre meilleure option d'immigration</p>
              </div>

              {/* Badge destination */}
              <div className="inline-block px-6 py-3 bg-blue-100 text-blue-700 rounded-full font-bold text-lg mb-8">
                📍 {recommendedDestination?.nom}
              </div>

              {/* Boutons d'action */}
              <div className="space-y-3">
                <a
                  href={recommendedDestination?.url}
                  className="block w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Voir les détails de cette destination
                </a>
                <button
                  onClick={handleWhatsApp}
                  className="w-full py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contacter un conseiller sur WhatsApp
                </button>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({
                      nom: "",
                      email: "",
                      whatsapp: "",
                      niveau: "",
                      langue: "",
                      budget: "",
                      objectif: "",
                    });
                  }}
                  className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Nouvelle évaluation
                </button>
              </div>

              {/* Info légale */}
              <p className="text-xs text-gray-500 mt-6">
                Vos données sont sécurisées et utilisées uniquement pour votre évaluation d'éligibilité.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
