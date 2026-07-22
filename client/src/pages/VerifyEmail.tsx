import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, CheckCircle, XCircle, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/pasted_file_nP22ud_logo3Mfull_b9e4b2c3.jpeg";

export default function VerifyEmail() {
  const [location, navigate] = useLocation();
  const { login } = useCandidateAuth();
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const token = params.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error" | "waiting">(
    token ? "loading" : "waiting"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);

  const verifyMutation = trpc.candidate.verifyEmail.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      if (data.token) {
        const candidateInfo = {
          id: data.candidateId,
          fullName: "",
          email: "",
          destination: "autre",
          dossierStatus: "nouveau",
          emailVerified: true,
        };
        localStorage.setItem("3m_candidate_token", data.token);
        localStorage.setItem("3m_candidate_info", JSON.stringify(candidateInfo));
        login(data.token, candidateInfo);
        localStorage.removeItem("pendingCandidate");
      }
      toast.success("Compte activé ! Bienvenue dans votre espace 3M Travel.");
      setTimeout(() => navigate("/dashboard"), 2500);
    },
    onError: (err) => {
      setStatus("error");
      setErrorMsg(err.message);
    },
  });

  const resendMutation = trpc.candidate.resendConfirmationLink.useMutation({
    onSuccess: () => {
      setResendSent(true);
      toast.success("Nouveau lien envoyé à votre adresse email.");
    },
    onError: (err) => toast.error(err.message),
  });

  // Déclencher la vérification automatiquement si le token est dans l'URL
  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <img
              src={LOGO_URL}
              alt="3M Travel"
              className="w-16 h-16 rounded-xl mx-auto mb-4 object-contain"
            />

            {/* État : chargement */}
            {status === "loading" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Loader2 className="w-14 h-14 text-blue-600 mx-auto mb-3 animate-spin" />
                <h1 className="text-2xl font-bold text-gray-900">Activation en cours...</h1>
                <p className="text-gray-500 mt-2 text-sm">Vérification de votre lien de confirmation.</p>
              </motion.div>
            )}

            {/* État : succès */}
            {status === "success" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-gray-900">Compte activé !</h1>
                <p className="text-gray-500 mt-2 text-sm">
                  Votre compte est maintenant actif. Redirection vers votre espace...
                </p>
              </motion.div>
            )}

            {/* État : erreur */}
            {status === "error" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <XCircle className="w-14 h-14 text-red-500 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-gray-900">Lien invalide</h1>
                <p className="text-red-500 mt-2 text-sm">{errorMsg}</p>
              </motion.div>
            )}

            {/* État : en attente (pas de token) */}
            {status === "waiting" && (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Vérifiez votre email</h1>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  Un lien d'activation a été envoyé à votre adresse email.<br />
                  Cliquez sur le bouton dans l'email pour activer votre compte.
                </p>
              </>
            )}
          </div>

          {/* Corps : erreur → renvoyer le lien */}
          {(status === "error" || status === "waiting") && (
            <div className="px-8 py-6">
              {!resendSent ? (
                <>
                  <p className="text-sm text-gray-600 mb-3 text-center">
                    Vous n'avez pas reçu l'email ? Entrez votre adresse pour renvoyer le lien.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="votre@email.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        if (!resendEmail.includes("@")) {
                          toast.error("Entrez une adresse email valide.");
                          return;
                        }
                        resendMutation.mutate({ email: resendEmail });
                      }}
                      disabled={resendMutation.isPending}
                      className="shrink-0"
                      style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
                    >
                      {resendMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium text-sm">
                    Lien envoyé ! Vérifiez votre boîte email (et les spams).
                  </p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                <button
                  onClick={() => navigate("/register")}
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm mx-auto transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à l'inscription
                </button>
              </div>
            </div>
          )}

          {/* Corps : succès → bouton dashboard */}
          {status === "success" && (
            <div className="px-8 py-6 text-center">
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full h-12 text-base font-semibold"
                style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
              >
                Accéder à mon espace →
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-blue-200 text-xs mt-4">
          🔒 Le lien d'activation est valable 24 heures.
        </p>
      </motion.div>
    </div>
  );
}
