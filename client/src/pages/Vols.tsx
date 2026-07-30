import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane, MapPin, Calendar, Users, MessageCircle } from "lucide-react";

export default function Vols() {
  const [formData, setFormData] = useState({
    departure: "Yaoundé (NSI)",
    destination: "",
    date: "",
    passengers: "1",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `Bonjour 3M Travel, je souhaite réserver un vol de ${formData.departure} vers ${formData.destination} pour le ${formData.date} (${formData.passengers} passager(s)).`;
    window.open(
      `https://wa.me/237620996045?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12"
      >
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Plane className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Réservation & Billetterie Aérienne</h1>
          </div>
          <p className="text-lg text-blue-100">
            Trouvez les meilleurs tarifs pour vos vols internationaux avec 3M Travel & Services
          </p>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <Card className="p-8 bg-white shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Departure */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Départ
                  </label>
                  <input
                    type="text"
                    value={formData.departure}
                    onChange={(e) =>
                      setFormData({ ...formData, departure: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Destination
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Paris (CDG), Montreal (YUL)"
                    value={formData.destination}
                    onChange={(e) =>
                      setFormData({ ...formData, destination: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date souhaitée
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Passengers */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Passagers
                  </label>
                  <select
                    value={formData.passengers}
                    onChange={(e) =>
                      setFormData({ ...formData, passengers: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} passager{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
                >
                  <Plane className="w-5 h-5 mr-2" />
                  Obtenir un devis rapide
                </Button>
              </div>

              {/* Info Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Cliquez sur "Obtenir un devis rapide" pour contacter notre équipe via WhatsApp et recevoir les meilleures offres.
              </div>
            </form>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="p-6 bg-white shadow-md hover:shadow-lg transition">
            <div className="text-3xl mb-4">✈️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Meilleurs Tarifs
            </h3>
            <p className="text-gray-600 text-sm">
              Accès aux meilleures offres de vols internationaux avec les compagnies aériennes partenaires.
            </p>
          </Card>

          <Card className="p-6 bg-white shadow-md hover:shadow-lg transition">
            <div className="text-3xl mb-4">🛡️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Assistance 24/7
            </h3>
            <p className="text-gray-600 text-sm">
              Notre équipe est disponible pour vous aider à chaque étape de votre réservation.
            </p>
          </Card>

          <Card className="p-6 bg-white shadow-md hover:shadow-lg transition">
            <div className="text-3xl mb-4">💳</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Paiement Sécurisé
            </h3>
            <p className="text-gray-600 text-sm">
              Paiement flexible et sécurisé avec plusieurs options disponibles.
            </p>
          </Card>
        </motion.div>

        {/* Popular Routes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Destinations Populaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { from: "Yaoundé", to: "Paris", flag: "🇫🇷" },
              { from: "Yaoundé", to: "Canada", flag: "🇨🇦" },
              { from: "Yaoundé", to: "Australie", flag: "🇦🇺" },
              { from: "Yaoundé", to: "Royaume-Uni", flag: "🇬🇧" },
            ].map((route, idx) => (
              <Card key={idx} className="p-4 bg-white shadow-sm hover:shadow-md transition cursor-pointer">
                <p className="text-2xl mb-2">{route.flag}</p>
                <p className="text-sm text-gray-600">
                  {route.from} → {route.to}
                </p>
                <p className="text-xs text-gray-400 mt-2">À partir de 500€</p>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
