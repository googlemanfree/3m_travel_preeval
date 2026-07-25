import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, CheckCircle, AlertCircle, Loader } from "lucide-react";
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

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verifyMutation = trpc.candidate.verifyEmailLink.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage("Email vérifié avec succès !");
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
      setTimeout(() => navigate("/dashboard"), 2000);
    },
    onError: (err) => {
      setStatus("error");
      setMessage(err.message || "Erreur lors de la vérification du lien.");
      toast.error(err.message);
    },
  });

  useEffect(() => {
    if (token) {
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
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-gray-900">Email vérifié !</h1>
                <p className="text-gray-500 mt-2">Redirection vers votre espace...</p>
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
              >
                Créer un nouveau compte
              </Button>
            </div>
          )}

          {status === "success" && (
            <div className="px-8 py-6 text-center">
              <p className="text-gray-600 mb-4">Vous serez redirigé vers votre espace dans quelques secondes...</p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg"
              >
                Aller au dashboard
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
