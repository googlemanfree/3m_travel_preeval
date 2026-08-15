import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowRight, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg";

export default function Login() {
  const [location, navigate] = useLocation();
  const { login } = useCandidateAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [modalAnnouncement, setModalAnnouncement] = useState("");
  const passwordStrength = usePasswordStrength(password);
  const closeResendModal = () => {
    setShowResendModal(false);
    setModalAnnouncement("Fenêtre de renvoi d’email fermée.");
  };
  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setModalAnnouncement("Fenêtre de réinitialisation du mot de passe fermée.");
  };
  const resendDialogRef = useFocusTrap(showResendModal, closeResendModal);
  const forgotDialogRef = useFocusTrap(showForgotPasswordModal, closeForgotPasswordModal);

  // Message d'avertissement si redirigé depuis une page protégée
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const redirected = params.get("redirect") === "1";
  const from = params.get("from") ?? "";
  const googleOAuthCallback = params.get("oauth") === "google";
  const googleOAuthError = params.get("oauth_error") === "google" || params.get("oauth_error") === "google_unavailable";
  const googleOAuthConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

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
      const candidateWithPortrait = data.candidate as typeof data.candidate & { avatarVerificationStatus?: string };
      if (candidateWithPortrait.avatarVerificationStatus !== "verified") {
        localStorage.setItem("candidateId", String(candidateData.id));
        toast.info("Un portrait humain vérifié est nécessaire pour activer votre espace.");
        navigate(`/complete-profile?email=${encodeURIComponent(candidateData.email)}`);
        return;
      }
      toast.success(`Bienvenue, ${data.candidate.fullName} !`);
      navigate(from ? decodeURIComponent(from) : "/dashboard");
    },
    onError: (err) => {
      if (err.message === "EMAIL_VERIFICATION_REQUIRED") {
        setResendEmail(email);
        setShowResendModal(true);
        toast.error("Veuillez activer votre compte avec le lien reçu par e-mail avant de vous connecter.", { duration: 6000 });
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

  const consumeGoogleOAuthMutation = trpc.candidate.consumeGoogleOAuth.useMutation({
    onSuccess: (data) => {
      const storage = sessionStorage;
      storage.setItem("3m_candidate_token", data.token);
      storage.setItem("3m_candidate_info", JSON.stringify({
        id: data.candidate.id,
        fullName: data.candidate.fullName,
        email: data.candidate.email,
        emailVerified: true,
      }));
      login(data.token, {
        id: data.candidate.id,
        fullName: data.candidate.fullName,
        email: data.candidate.email,
        emailVerified: true,
      });
      if (data.candidate.requiresPortrait) {
        localStorage.setItem("candidateId", String(data.candidate.id));
        toast.info("Ajoutez maintenant votre portrait pour finaliser votre espace candidat.");
        navigate(`/complete-profile?email=${encodeURIComponent(data.candidate.email)}`);
        return;
      }
      toast.success(`Bienvenue, ${data.candidate.fullName} !`);
      navigate(from ? decodeURIComponent(from) : "/dashboard");
    },
    onError: () => {
      toast.error("La connexion Google a expiré. Veuillez réessayer.");
      navigate("/login", { replace: true });
    },
  });

  useEffect(() => {
    if (googleOAuthCallback && !consumeGoogleOAuthMutation.isPending && !consumeGoogleOAuthMutation.isSuccess) {
      consumeGoogleOAuthMutation.mutate();
    }
  }, [googleOAuthCallback, consumeGoogleOAuthMutation]);

  useEffect(() => {
    if (googleOAuthError) {
      toast.error("Connexion Google indisponible ou annulée. Réessayez dans quelques instants.");
    }
  }, [googleOAuthError]);

  function handleGoogleLogin() {
    if (!googleOAuthConfigured) {
      toast.info("La connexion Google sera disponible prochainement.");
      return;
    }
    window.location.assign("/api/auth/google/start");
  }

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
      <p className="sr-only" aria-live="polite" aria-atomic="true">{modalAnnouncement}</p>
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
        <div className="p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loginMutation.isPending}>
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
                  className="h-12 pl-10"
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
                  className="h-12 pl-10 pr-12"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  onClick={() => setShowPassword(v => !v)}
                  className="touch-target absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Indicateur de force du mot de passe */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Force du mot de passe</span>
                    <span className="text-xs font-bold">{passwordStrength.message}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className={`h-full ${passwordStrength.color} transition-all`}
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength.percentage}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  {passwordStrength.recommendations.length > 0 && (
                    <div className="text-xs text-gray-600 space-y-1">
                      {passwordStrength.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="h-12 w-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E3A8A] text-white font-bold rounded-xl transition-all active:scale-[0.98]"
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
          <div className="mt-4 mb-2 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <span className="text-sm text-gray-600">Se souvenir de moi</span>
            </label>
            <div className="flex flex-wrap gap-x-3 gap-y-2 text-sm">
              <button
                type="button"
                onClick={() => setShowResendModal(true)}
                className="text-[#2563EB] hover:underline font-medium transition-colors"
              >
                Renvoyer l'email
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-[#2563EB] hover:underline font-medium transition-colors"
              >
                Mot de passe oublié ?
              </button>
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
            <div className="group relative">
              <button
                type="button"
                disabled={!googleOAuthConfigured || consumeGoogleOAuthMutation.isPending}
                aria-describedby={!googleOAuthConfigured ? "google-coming-soon" : undefined}
                onClick={handleGoogleLogin}
                className={`h-11 w-full flex items-center justify-center gap-2 px-4 border rounded-lg text-sm font-medium transition-colors ${googleOAuthConfigured ? "border-gray-300 text-gray-700 hover:bg-gray-50" : "border-gray-200 text-gray-500 opacity-60 cursor-not-allowed"}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {consumeGoogleOAuthMutation.isPending ? "Connexion Google..." : "Google"}
              </button>
              {!googleOAuthConfigured && <span id="google-coming-soon" role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">Bientôt disponible</span>}
            </div>
            <div className="group relative">
              <button
                type="button"
                aria-disabled="true"
                aria-describedby="facebook-coming-soon"
                onClick={(event) => event.preventDefault()}
                className="h-11 w-full flex items-center justify-center gap-2 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 opacity-60 cursor-not-allowed"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
              <span id="facebook-coming-soon" role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">Bientôt disponible</span>
            </div>
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
          ref={resendDialogRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={closeResendModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="resend-title"
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
                <h2 id="resend-title" className="text-xl font-bold">Renvoyer l'email</h2>
                <p className="text-blue-200 text-sm mt-1">Nous vous enverrons un nouveau lien de vérification</p>
              </div>
              <button
                type="button"
                aria-label="Fermer la fenêtre de renvoi d’email"
                onClick={closeResendModal}
                className="touch-target text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <form onSubmit={handleResendVerification} className="space-y-4" aria-busy={resendVerificationMutation.isPending}>
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
                  onClick={closeResendModal}
                  className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modale pour réinitialiser le mot de passe */}
      {showForgotPasswordModal && (
        <motion.div
          ref={forgotDialogRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={closeForgotPasswordModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-title"
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
                <h2 id="forgot-title" className="text-xl font-bold">Mot de passe oublié</h2>
                <p className="text-blue-200 text-sm mt-1">Nous vous enverrons un lien de réinitialisation</p>
              </div>
              <button
                type="button"
                aria-label="Fermer la fenêtre de récupération"
                onClick={closeForgotPasswordModal}
                className="touch-target text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!forgotPasswordEmail) {
                    toast.error("Veuillez entrer votre adresse email");
                    return;
                  }
                  // Ouvrir la page d’envoi réelle en conservant l’adresse saisie.
                  navigate(`/forgot-password?email=${encodeURIComponent(forgotPasswordEmail.trim().toLowerCase())}`);
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="forgot-email" className="text-sm font-semibold text-gray-700">
                    Adresse email
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={forgotPasswordEmail}
                      onChange={e => setForgotPasswordEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Entrez l'adresse email associée à votre compte. Nous vous enverrons un lien de réinitialisation valable 1 heure.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E3A8A] text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Envoyer le lien
                  </span>
                </Button>

                <button
                  type="button"
                  onClick={closeForgotPasswordModal}
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
