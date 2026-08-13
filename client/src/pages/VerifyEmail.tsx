import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg";

export default function VerifyEmail() {
  const [location, navigate] = useLocation();
  const { login } = useCandidateAuth();
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const candidateId = parseInt(params.get("id") ?? "0");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown pour renvoyer le code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const verifyMutation = trpc.candidate.verifyEmail.useMutation({
    onSuccess: (data) => {
      setVerified(true);
      if (data.token) {
        // Récupérer les infos depuis le localStorage temporaire si disponible
        let pending = {};
        try {
          const stored = localStorage.getItem("pendingCandidate");
          if (stored) {
            pending = JSON.parse(stored);
            localStorage.removeItem("pendingCandidate");
          }
        } catch (e) {
          console.warn("localStorage unavailable", e);
        }
        login(data.token, {
          id: candidateId,
          fullName: (pending as any).fullName ?? "Candidat",
          email: (pending as any).email ?? "",
          destination: (pending as any).destination ?? "autre",
          dossierStatus: "nouveau",
          emailVerified: true,
        });
      }
      toast.success("Email vérifié ! Bienvenue dans votre espace 3M Travel.");
      setTimeout(() => navigate("/dashboard"), 2000);
    },
    onError: (err) => {
      toast.error(err.message);
      // Vider les champs en cas d'erreur
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
  });

  const resendMutation = trpc.candidate.resendOtp.useMutation({
    onSuccess: () => {
      toast.success("Nouveau code envoyé à votre adresse email.");
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return; // Chiffres uniquement
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Un seul chiffre
    setOtp(newOtp);

    // Avancer au champ suivant
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Soumettre automatiquement si tous les champs sont remplis
    if (newOtp.every(d => d !== "") && newOtp.join("").length === 6) {
      verifyMutation.mutate({ candidateId, otp: newOtp.join("") });
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      verifyMutation.mutate({ candidateId, otp: pasted });
    }
  }

  if (!candidateId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 100%)" }}>
        <div className="text-white text-center">
          <p className="text-xl mb-4">Lien invalide.</p>
          <Button onClick={() => navigate("/register")} variant="outline" className="text-white border-white">
            Inscription
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)" }}>
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
            {verified ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-gray-900">Email vérifié !</h1>
                <p className="text-gray-500 mt-2">Redirection vers votre espace...</p>
              </motion.div>
            ) : (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Vérifiez votre email</h1>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                  Nous avons envoyé un code à 6 chiffres à votre adresse email.<br />
                  Entrez-le ci-dessous pour activer votre compte.
                </p>
              </>
            )}
          </div>

          {!verified && (
            <div className="px-8 py-6">
              {/* Champs OTP */}
              <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all
                      ${digit ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-900"}
                      focus:border-blue-500 focus:bg-blue-50`}
                    disabled={verifyMutation.isPending}
                  />
                ))}
              </div>

              {/* Bouton de vérification */}
              <Button
                onClick={() => {
                  const code = otp.join("");
                  if (code.length !== 6) { toast.error("Entrez les 6 chiffres du code."); return; }
                  verifyMutation.mutate({ candidateId, otp: code });
                }}
                disabled={otp.join("").length !== 6 || verifyMutation.isPending}
                className="w-full h-12 text-base font-semibold mb-4"
                style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
              >
                {verifyMutation.isPending ? "Vérification..." : "Confirmer mon email"}
              </Button>

              {/* Renvoyer le code */}
              <div className="text-center">
                {canResend ? (
                  <button
                    onClick={() => resendMutation.mutate({ candidateId })}
                    disabled={resendMutation.isPending}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mx-auto transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${resendMutation.isPending ? "animate-spin" : ""}`} />
                    {resendMutation.isPending ? "Envoi en cours..." : "Renvoyer le code"}
                  </button>
                ) : (
                  <p className="text-gray-400 text-sm">
                    Renvoyer le code dans <span className="font-semibold text-gray-600">{countdown}s</span>
                  </p>
                )}
              </div>

              {/* Lien retour */}
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
        </div>

        {/* Note de sécurité */}
        <p className="text-center text-blue-200 text-xs mt-4">
          🔒 Ce code expire dans 15 minutes. Ne le partagez avec personne.
        </p>
      </motion.div>
    </div>
  );
}
