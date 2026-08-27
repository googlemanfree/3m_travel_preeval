import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function VerifyEmailSent() {
  const [, setLocation] = useLocation();
  const [resendSuccess, setResendSuccess] = React.useState(false);
  const searchParams = new URLSearchParams(window.location.search);
  const email = searchParams.get("email") || localStorage.getItem("registrationEmail") || "";
  const from = searchParams.get("from");
  const requiresEvaluation = localStorage.getItem("registrationEvaluationDeclaration") !== "yes";
  const loginPath = `/login${from ? `?redirect=1&from=${encodeURIComponent(from)}` : ""}`;

  const resendMutation = trpc.candidate.resendVerificationEmail.useMutation({
    onSuccess: () => {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
      toast.success("Si le compte existe, un nouveau lien d’activation a été envoyé.");
    },
    onError: () => toast.error("Impossible de renvoyer le lien pour le moment. Réessayez plus tard."),
  });

  const handleResendEmail = () => {
    if (!email) {
      toast.error("Adresse e-mail introuvable. Veuillez recommencer l’inscription.");
      setLocation(`/register${from ? `?from=${encodeURIComponent(from)}` : ""}`);
      return;
    }
    resendMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 bg-white shadow-xl">
          {/* Icon */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex justify-center mb-6"
          >
            <div className="bg-blue-100 p-4 rounded-full">
              <Mail className="w-12 h-12 text-blue-600" />
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Vérifiez votre email
          </h1>

          {/* Description */}
          <p className="text-center text-gray-600 mb-6">
            Un email de confirmation vient de vous être envoyé. Veuillez cliquer sur le lien dans votre boîte de réception pour activer votre compte.
          </p>

          {/* Steps */}
          <div className="space-y-4 mb-8 bg-blue-50 p-6 rounded-lg">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                  1
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Ouvrez votre email</p>
                <p className="text-sm text-gray-600">Vérifiez votre boîte de réception</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                  2
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Cliquez sur le lien</p>
                <p className="text-sm text-gray-600">Confirmez votre adresse email</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                  3
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{requiresEvaluation ? "Commencez votre évaluation" : "Accédez à votre espace"}</p>
                <p className="text-sm text-gray-600">{requiresEvaluation ? "Le formulaire guidé adapté à votre projet s’ouvrira après l’activation." : "Votre déclaration d’évaluation sera visible puis vérifiée par l’équipe."}</p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {resendSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-green-900 font-semibold">Email renvoyé avec succès !</p>
            </motion.div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleResendEmail}
              disabled={resendMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendMutation.isPending ? "Envoi en cours..." : "Renvoyer l'email de confirmation"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation(loginPath)}
              className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
              Accéder à la connexion
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Info */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Le lien de confirmation est valable 24 heures.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
