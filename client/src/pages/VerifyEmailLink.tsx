import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Loader, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/pasted_file_nP22ud_logo3Mfull_b9e4b2c3.jpeg";

export default function VerifyEmailLink() {
  const [location, navigate] = useLocation();
  const { login } = useCandidateAuth();
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const token = params.get("token") ?? "";
  const redirect = params.get("redirect") ?? "/login"; // Redirection par défaut vers /login

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [candidateData, setCandidateData] = useState<any>(null);
  const [countdown, setCountdown] = useState(3); // Compte à rebours de 3 secondes

  // Compte à rebours avant redirection
  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === "success" && countdown === 0) {
      navigate(decodeURIComponent(redirect));
    }
  }, [status, countdown, redirect, navigate]);

  const verifyMutation = trpc.candidate.verifyEmailLink.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage("Email vérifié avec succès !");
      setCandidateData(data);
      if (data.token) {
        login(data.token, {
          id: 0,
          fullName: "Candidat",
          email: "",
          destination: "autre",
          dossierStatus: "nouveau",
          emailVerified: true,
        });
      }
      toast.success("Bienvenue dans votre espace 3M Travel !");
      // Le compte à rebours démarre automatiquement via l'effet useEffect
    },
    onError: (err) => {
      setStatus("error");
      setMessage(err.message || "Erreur lors de la vérification du lien.");
      toast.error(err.message);
    },
  });

  useEffect(() => {
    if (token) {
      console.log(`[VerifyEmailLink] Verifying token: ${token.substring(0, 8)}...`);
      verifyMutation.mutate({ token });
    } else {
      setStatus("error");
      setMessage("Lien de vérification invalide.");
    }
  }, [token]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
            <img src={LOGO_URL} alt="3M Travel" className="w-16 h-16 rounded-xl mx-auto mb-4 object-contain" />

            {status === "loading" && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Vérification en cours...</h1>
                <p className="text-gray-500 mt-2 text-sm">Veuillez patienter pendant que nous confirmons votre email.</p>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                  className="inline-block"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                </motion.div>
                <motion.h1 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-gray-900"
                >
                  Compte Activé ! 🎉
                </motion.h1>
                <motion.p 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-500 mt-2 text-sm"
                >
                  Votre email a été confirmé avec succès
                </motion.p>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-gray-900">Lien invalide</h1>
                <p className="text-gray-500 mt-2 text-sm">{message}</p>
              </motion.div>
            )}
          </div>

          {/* Body */}
          {status === "error" && (
            <div className="px-8 py-6 text-center">
              <p className="text-gray-600 mb-6">
                Le lien de vérification est invalide ou a expiré. Veuillez créer un nouveau compte.
              </p>
              <Button
                onClick={() => navigate("/register")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                Créer un nouveau compte
              </Button>
            </div>
          )}

          {status === "success" && (
            <div className="px-8 py-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
              >
                <h3 className="text-green-900 font-semibold mb-2">✓ Email Confirmé</h3>
                <p className="text-green-700 text-sm">
                  Votre compte 3M Travel & Services est maintenant activé. Vous allez être redirigé vers la page de connexion pour accéder à votre espace.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                {/* Compte à rebours visuel */}
                <motion.div
                  className="flex justify-center items-center gap-4 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2">Redirection automatique dans</p>
                    <motion.div
                      key={countdown}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-5xl font-black text-green-600"
                    >
                      {countdown}s
                    </motion.div>
                  </div>
                </motion.div>

                <p className="text-gray-600 text-center mb-4 text-sm">
                  Vous allez être redirigé vers la page de connexion...
                </p>
                <Button
                  onClick={() => navigate(decodeURIComponent(redirect))}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
                >
                  Aller à la Connexion
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 pt-6 border-t border-gray-100 text-center"
              >
                <p className="text-gray-500 text-xs mb-3">Après connexion, vous pourrez :</p>
                <div className="flex justify-around text-center">
                  <div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1 text-blue-600 font-bold text-sm">1</div>
                    <p className="text-gray-600 text-xs">Compléter Profil</p>
                  </div>
                  <div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1 text-blue-600 font-bold text-sm">2</div>
                    <p className="text-gray-600 text-xs">Uploader Docs</p>
                  </div>
                  <div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1 text-blue-600 font-bold text-sm">3</div>
                    <p className="text-gray-600 text-xs">Suivi Dossier</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
