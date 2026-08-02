import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowRight, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGoogleLogin } from '@react-oauth/google';
import { trpc } from "@/lib/trpc";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/pasted_file_nP22ud_logo3Mfull_b9e4b2c3.jpeg";

export default function Login() {
  const [location, navigate] = useLocation();
  const { login } = useCandidateAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendEmail, setResendEmail] = useState("");

  // Message d'avertissement si redirigé depuis une page protégée
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const redirected = params.get("redirect") === "1";
  const from = params.get("from") ?? "";

  const loginMutation = trpc.candidate.login.useMutation({
    onSuccess: (data) => {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("3m_candidate_token", data.token);
      const candidateData = data.candidate as typeof data.candidate & { emailVerified?: boolean };
      storage.setItem("3m_candidate_info", JSON.stringify({
        id: candidateData.id,
        fullName: candidateData.fullName,
        email: candidateData.email,
        emailVerified: candidateData.emailVerified ?? true,
      }));
      login(data.token, {
        id: candidateData.id,
        fullName: candidateData.fullName,
        email: candidateData.email,
        emailVerified: candidateData.emailVerified ?? true,
      });
      toast.success(`Bienvenue, ${data.candidate.fullName} !`);
      navigate(from ? decodeURIComponent(from) : "/dashboard");
    },
    onError: (err) => {
      // Si l'email n'est pas vérifié, proposer de renvoyer le code
      if (err.message.includes("valider votre adresse e-mail")) {
        toast.error(err.message, { duration: 6000 });
      } else {
        toast.error(err.message);
      }
    },
  });

  const resendVerificationMutation = trpc.candidate.resendVerificationEmail.useMutation({
    onSuccess: () => {
      toast.success("Email de vérification renvoyé ! Vérifiez votre boîte de réception.");
      setShowResendModal(false);
      setResendEmail("");
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de l'envoi de l'email.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Veuillez renseigner votre email et mot de passe.");
      return;
    }
    loginMutation.mutate({ email, password });
  }

  function handleResendVerification(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail) {
      toast.error("Veuillez renseigner votre adresse email.");
      return;
    }
    resendVerificationMutation.mutate({ email: resendEmail });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header coloré */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] p-8 text-center text-white">
          <img src={LOGO_URL} alt="3M Travel" className="w-16 h-16 rounded-xl mx-auto mb-4 shadow-lg object-cover" />
          <h1 className="text-2xl font-black">Mon Espace Candidat</h1>
          <p className="text-blue-200 text-sm mt-1">Connectez-vous pour accéder à votre dossier</p>
        </div>

        {/* Bandeau d'alerte si redirigé depuis une page protégée */}
        {redirected && (
          <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <span className="text-amber-500 text-lg leading-none mt-0.5">🔒</span>
            <div>
              <p className="text-amber-800 text-sm font-semibold">Accès réservé aux membres</p>
              <p className="text-amber-700 text-xs mt-0.5">
                Connectez-vous ou créez un compte gratuit pour accéder à ce contenu.
              </p>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Adresse email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Mot de passe</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E3A8A] text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> Se connecter <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Se souvenir de moi + Mot de passe oublié + Renvoyer email */}
          <div className="flex items-center justify-between mt-4 mb-2 flex-wrap gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <span className="text-sm text-gray-600">Se souvenir de moi</span>
            </label>
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => setShowResendModal(true)}
                className="text-[#2563EB] hover:underline font-medium transition-colors"
              >
                Renvoyer l'email
              </button>
              <span className="text-gray-300">•</span>
              <Link href="/forgot-password" className="text-[#2563EB] hover:underline font-medium">
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          {/* Sécurité */}
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 justify-center">
            <Shield className="w-3.5 h-3.5" />
            <span>Connexion sécurisée — vos données sont chiffrées</span>
          </div>

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OU</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Boutons OAuth */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => toast.info("Connexion Google - Bientôt disponible")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => toast.info("Connexion Facebook - Bientôt disponible")}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Pas encore de compte ?{" "}
              <Link href="/register" className="text-[#2563EB] font-semibold hover:underline">
                Créer mon compte
              </Link>
            </p>
            <p className="text-xs text-gray-400">
              <Link href="/" className="hover:underline">← Retour à l'accueil</Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Modale de renvoi d'email de vérification */}
      {showResendModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowResendModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Renvoyer l'email</h2>
                <p className="text-blue-200 text-sm mt-1">Nous vous enverrons un nouveau lien de vérification</p>
              </div>
              <button
                onClick={() => setShowResendModal(false)}
                className="text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <form onSubmit={handleResendVerification} className="space-y-4">
                <div>
                  <Label htmlFor="resend-email" className="text-sm font-semibold text-gray-700">
                    Adresse email
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="resend-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={resendEmail}
                      onChange={e => setResendEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Entrez l'adresse email associée à votre compte. Nous vous enverrons un nouveau lien de vérification valable 24 heures.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={resendVerificationMutation.isPending}
                  className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E3A8A] text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
                >
                  {resendVerificationMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Renvoyer l'email
                    </span>
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setShowResendModal(false)}
                  className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
