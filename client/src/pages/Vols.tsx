import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane, MapPin, Calendar, Users, MessageCircle, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Vols() {
  const [formData, setFormData] = useState({
    departure: "Yaoundé (NSI)",
    destination: "",
    date: "",
    passengers: "1",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [submitted, setSubmitted] = useState(false);

  // Validation des champs
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.departure.trim()) {
      newErrors.departure = "Le départ est requis";
    }
    if (!formData.destination.trim()) {
      newErrors.destination = "La destination est requise";
    }
    if (!formData.date) {
      newErrors.date = "La date est requise";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = "La date doit être dans le futur";
      }
    }
    if (!formData.passengers) {
      newErrors.passengers = "Le nombre de passagers est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    validateForm();
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Valider le champ en temps réel si touché
    if (touched[field]) {
      validateForm();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    if (!validateForm()) {
      return;
    }

    const msg = `Bonjour 3M Travel, je souhaite réserver un vol de ${formData.departure} vers ${formData.destination} pour le ${formData.date} (${formData.passengers} passager(s)).`;
    window.open(
      `https://wa.me/237620996045?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
    
    // Réinitialiser le formulaire après soumission
    setTimeout(() => {
      setFormData({
        departure: "Yaoundé (NSI)",
        destination: "",
        date: "",
        passengers: "1",
      });
      setErrors({});
      setTouched({});
      setSubmitted(false);
    }, 1000);
  };

  const isFormValid = 
    Object.keys(errors).length === 0 && 
    formData.destination.trim() !== "" && 
    formData.date !== "" && 
    formData.passengers !== "";

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
                      handleChange("departure", e.target.value)
                    }
                    onBlur={() => handleBlur("departure")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                      errors.departure && touched.departure
                        ? "border-red-500 focus:ring-red-500 bg-red-50"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    required
                  />
                  {errors.departure && touched.departure && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.departure}
                    </motion.p>
                  )}
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
                      handleChange("destination", e.target.value)
                    }
                    onBlur={() => handleBlur("destination")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                      errors.destination && touched.destination
                        ? "border-red-500 focus:ring-red-500 bg-red-50"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    required
                  />
                  {errors.destination && touched.destination && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.destination}
                    </motion.p>
                  )}
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
                      handleChange("date", e.target.value)
                    }
                    onBlur={() => handleBlur("date")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                      errors.date && touched.date
                        ? "border-red-500 focus:ring-red-500 bg-red-50"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    required
                  />
                  {errors.date && touched.date && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.date}
                    </motion.p>
                  )}
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
                      handleChange("passengers", e.target.value)
                    }
                    onBlur={() => handleBlur("passengers")}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                      errors.passengers && touched.passengers
                        ? "border-red-500 focus:ring-red-500 bg-red-50"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} passager{num > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                  {errors.passengers && touched.passengers && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.passengers}
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <motion.div
                  className="flex-1"
                  whileHover={isFormValid ? { scale: 1.02 } : {}}
                  whileTap={isFormValid ? { scale: 0.98 } : {}}
                >
                  <Button
                    type="submit"
                    disabled={!isFormValid}
                    className={`w-full font-bold py-3 px-6 rounded-lg shadow-lg transition transform ${
                      isFormValid
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white cursor-pointer"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <Plane className="w-5 h-5 mr-2 inline" />
                    {submitted ? "Redirection..." : "Obtenir un devis rapide"}
                  </Button>
                </motion.div>
              </div>

              {/* Validation Summary */}
              {submitted && !isFormValid && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-4"
                >
                  <p className="text-red-900 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Veuillez corriger les erreurs ci-dessus
                  </p>
                </motion.div>
              )}

              {/* Success Message */}
              {submitted && isFormValid && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4"
                >
                  <p className="text-green-900 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Redirection vers WhatsApp en cours...
                  </p>
                </motion.div>
              )}

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
