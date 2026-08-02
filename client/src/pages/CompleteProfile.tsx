import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CompleteProfile() {
  const [location, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

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

  const handleContinue = () => {
    setIsLoading(true);
    // Attendre 1 seconde puis rediriger vers la page de connexion
    setTimeout(() => {
      toast.success("Veuillez vérifier votre email pour confirmer votre compte.");
      navigate("/login");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compte créé avec succès !</h1>
        <p className="text-gray-600 mb-6">
          Un email de confirmation a été envoyé à <span className="font-semibold">{email}</span>
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-2">Prochaines étapes :</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Vérifiez votre email et cliquez sur le lien de confirmation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Connectez-vous avec vos identifiants</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Complétez votre profil avec vos informations personnelles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Uploadez vos documents requis</span>
            </li>
          </ul>
        </div>

        <Button
          onClick={handleContinue}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Redirection...
            </>
          ) : (
            <>
              Aller à la connexion
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>

        <p className="text-sm text-gray-500 mt-6">
          Vous n'avez pas reçu l'email ? Vérifiez votre dossier spam ou{" "}
          <button
            onClick={() => {
              toast.info("Fonction de renvoi d'email disponible sur la page de connexion");
              navigate("/login");
            }}
            className="text-blue-600 hover:underline font-semibold"
          >
            demandez un renvoi
          </button>
        </p>
      </motion.div>
    </div>
  );
}
