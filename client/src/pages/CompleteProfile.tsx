import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Loader, Mail, User, MapPin, Briefcase, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const DESTINATIONS = [
  { value: "canada", label: "🇨🇦 Canada" },
  { value: "luxembourg", label: "🇱🇺 Luxembourg" },
  { value: "pologne", label: "🇵🇱 Pologne" },
  { value: "europe", label: "🇪🇺 Europe" },
  { value: "golfe", label: "🇦🇪 Golfe & Moyen-Orient" },
  { value: "autre", label: "Autre" },
];

const VISA_TYPES = [
  { value: "travail", label: "Visa de travail" },
  { value: "etudes", label: "Visa d'études" },
  { value: "residence", label: "Résidence permanente" },
  { value: "visiteur", label: "Visa de visiteur" },
  { value: "autre", label: "Autre" },
];

export default function CompleteProfile() {
  const [location, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    destination: "",
    visaType: "",
    occupation: "",
  });

  // Récupérer l'email depuis les paramètres d'URL
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const email = params.get("email") ?? "";

  useEffect(() => {
    // Vérifier que l'utilisateur vient de l'inscription
    const candidateId = localStorage.getItem("candidateId");
    if (!candidateId || !email) {
      navigate("/register");
    }
  }, [email, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsLoading(true);
    // Attendre 1 seconde puis rediriger vers la page de connexion
    setTimeout(() => {
      toast.success("Profil complété ! Veuillez vous connecter.");
      navigate("/login");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
      >
        {/* Indicateur de progression */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${
                s <= step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Étape 1: Destination */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Destination</h2>
              <p className="text-gray-600 text-sm">Quel est votre pays de destination ?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="destination" className="text-gray-700 font-semibold mb-2 block">
                  Sélectionnez une destination
                </Label>
                <Select value={formData.destination} onValueChange={(value) => handleSelectChange("destination", value)}>
                  <SelectTrigger id="destination" className="w-full">
                    <SelectValue placeholder="Choisir une destination..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DESTINATIONS.map((dest) => (
                      <SelectItem key={dest.value} value={dest.value}>
                        {dest.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleContinue}
              disabled={!formData.destination}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        )}

        {/* Étape 2: Type de visa */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Type de visa</h2>
              <p className="text-gray-600 text-sm">Quel type de visa recherchez-vous ?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="visaType" className="text-gray-700 font-semibold mb-2 block">
                  Type de visa
                </Label>
                <Select value={formData.visaType} onValueChange={(value) => handleSelectChange("visaType", value)}>
                  <SelectTrigger id="visaType" className="w-full">
                    <SelectValue placeholder="Choisir un type de visa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {VISA_TYPES.map((visa) => (
                      <SelectItem key={visa.value} value={visa.value}>
                        {visa.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 py-3 rounded-lg font-semibold"
              >
                Retour
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!formData.visaType}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Étape 3: Profession */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profession</h2>
              <p className="text-gray-600 text-sm">Quelle est votre profession actuelle ?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="occupation" className="text-gray-700 font-semibold mb-2 block">
                  Profession
                </Label>
                <Input
                  id="occupation"
                  name="occupation"
                  type="text"
                  placeholder="Ex: Ingénieur, Infirmier, etc."
                  value={formData.occupation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="flex-1 py-3 rounded-lg font-semibold"
              >
                Retour
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!formData.occupation || isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Finalisation...
                  </>
                ) : (
                  <>
                    Terminer
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Résumé */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Vous pourrez modifier ces informations dans votre profil après la connexion.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
