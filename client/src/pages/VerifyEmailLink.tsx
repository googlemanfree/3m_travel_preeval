import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Loader, ArrowRight, Mail, Shield, Zap } from "lucide-react";
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
  const redirect = params.get("redirect") ?? "/dashboard";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [candidateData, setCandidateData] = useState<any>(null);
  const [countdown, setCountdown] = useState(5);
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  // Compte à rebours avant redirection
  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === "success" && countdown === 0) {
      navigate("/login");
    }
  }, [status, countdown, redirect, navigate]);

  const verifyMutation = trpc.candidate.verifyEmailLink.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage("Email vérifié avec succès !");
      setCandidateData(data);
      toast.success("Email verifie ! Veuillez vous connecter avec vos identifiants.");
    },
    onError: (err) => {
      setStatus("error");
      setMessage(err.message || "Erreur lors de la vérification du lien.");
      toast.error(err.message);
    },
  });

  const resendMutation = trpc.candidate.resendVerificationEmail.useMutation({
    onSuccess: () => {
      setIsResending(false);
      toast.success("Si le compte existe, un nouveau lien d’activation a été envoyé.");
    },
    onError: () => {
      setIsResending(false);
      toast.error("Impossible de renvoyer le lien pour le moment.");
    },
  });

  const resendVerificationEmail = () => {
    if (!email.trim()) {
      toast.error("Veuillez entrer votre adresse email");
      return;
    }
    setIsResending(true);
    resendMutation.mutate({ email: email.toLowerCase().trim() });
  };

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    } else {
      setStatus("error");
      setMessage("Lien de vérification invalide.");
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <AnimatePresence mode="wait">
        {status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="px-8 pt-12 pb-8 text-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
                >
                  <Loader className="w-10 h-10 text-indigo-600 animate-spin" />
                </motion.div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Vérification en cours...</h1>
                <p className="text-gray-600 text-lg">Nous confirmons votre adresse email</p>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 flex justify-center gap-2"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                      className="w-2 h-2 bg-indigo-600 rounded-full"
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              {/* Success Header */}
              <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 px-8 pt-12 pb-8 text-center relative overflow-hidden">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"
                />
                
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="relative z-10"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                    className="inline-block"
                  >
                    <CheckCircle className="w-24 h-24 text-white mx-auto mb-4" />
                  </motion.div>
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-black text-white mb-2 relative z-10"
                >
                  Félicitations ! 🎉
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-green-50 text-lg relative z-10"
                >
                  Votre compte est maintenant activé
                </motion.p>
              </div>

              {/* Success Body */}
              <div className="px-8 py-10">
                {/* Confirmation Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Mail className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-green-900 mb-1">Email Confirmé</h3>
                      <p className="text-green-700">
                        Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant accéder à votre espace candidat.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Features */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
                >
                  {[
                    { icon: Shield, label: "Compte Sécurisé", desc: "Authentification vérifiée" },
                    { icon: Zap, label: "Prêt à Commencer", desc: "Accès immédiat" },
                    { icon: Mail, label: "Email Confirmé", desc: "Notifications actives" },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center border border-blue-100"
                    >
                      <feature.icon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900 text-sm">{feature.label}</p>
                      <p className="text-gray-600 text-xs mt-1">{feature.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Countdown */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-center mb-8"
                >
                  <p className="text-gray-600 mb-3">Redirection automatique dans</p>
                  <motion.div
                    key={countdown}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    {countdown}s
                  </motion.div>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Button
                    onClick={() => navigate(decodeURIComponent(redirect))}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all duration-200 hover:shadow-xl flex items-center justify-center gap-3 text-lg"
                  >
                    Accéder à Mon Tableau de Bord
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                </motion.div>

                {/* Next Steps */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-8 pt-8 border-t border-gray-200"
                >
                  <p className="text-gray-600 font-semibold mb-4 text-center">Prochaines étapes :</p>
                  <div className="space-y-3">
                    {[
                      { num: "1", title: "Complétez votre profil", desc: "Ajoutez vos informations personnelles" },
                      { num: "2", title: "Téléchargez vos documents", desc: "Passeport, diplômes, etc." },
                      { num: "3", title: "Suivez votre dossier", desc: "Recevez des mises à jour en temps réel" },
                    ].map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.1 + i * 0.1 }}
                        className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {step.num}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{step.title}</p>
                          <p className="text-gray-600 text-sm">{step.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-red-500 to-rose-500 px-8 pt-12 pb-8 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <AlertCircle className="w-24 h-24 text-white mx-auto mb-4" />
                </motion.div>
                <h1 className="text-3xl font-black text-white mb-2">Lien Invalide</h1>
                <p className="text-red-50 text-lg">{message}</p>
              </div>

              <div className="px-8 py-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6"
                >
                  <p className="text-red-900 font-semibold mb-2">Que s'est-il passé ?</p>
                  <ul className="text-red-700 text-sm space-y-2">
                    <li>• Le lien a expiré (valide 24 heures)</li>
                    <li>• Le lien a déjà été utilisé</li>
                    <li>• Le lien est incorrect ou corrompu</li>
                  </ul>
                </motion.div>

                {/* Resend Email Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6"
                >
                  <p className="text-blue-900 font-semibold mb-4">Renvoyer l'email de vérification</p>
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="Votre adresse email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white text-gray-900"
                    />
                    <Button
                      onClick={resendVerificationEmail}
                      disabled={isResending || resendMutation.isPending || !email.trim()}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2 rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResending ? "Envoi en cours..." : "Renvoyer l'email"}
                    </Button>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={() => navigate("/register")}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
                  >
                    Créer un Nouveau Compte
                  </Button>
                  <Button
                    onClick={() => navigate("/login")}
                    variant="outline"
                    className="w-full border-2 border-gray-300 text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-50"
                  >
                    Retourner à la Connexion
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
