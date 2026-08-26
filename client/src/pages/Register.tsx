import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, UserPlus, Globe, Phone, Mail, User, Lock, ArrowRight, CheckCircle, Loader, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { PortraitCapture, PortraitCaptureResult } from "@/components/PortraitCapture";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg";

const DESTINATIONS = [
  { value: "canada",     label: "🇨🇦 Canada — Résidence Permanente" },
  { value: "luxembourg", label: "🇱🇺 Luxembourg — Travail qualifié" },
  { value: "pologne",    label: "🇵🇱 Pologne — Recrutement direct" },
  { value: "europe",     label: "🇪🇺 Europe Zone Schengen" },
  { value: "golfe",      label: "🇦🇪 Golfe & Moyen-Orient" },
  { value: "autre",      label: "Autre destination" },
];

function getPasswordStrength(password: string): { score: number; label: string; color: string; rules: { ok: boolean; text: string }[] } {
  const rules = [
    { ok: password.length >= 8,          text: "8 caractères minimum" },
    { ok: /[A-Z]/.test(password),         text: "1 lettre majuscule" },
    { ok: /[0-9]/.test(password),         text: "1 chiffre" },
    { ok: /[^A-Za-z0-9]/.test(password),  text: "1 caractère spécial" },
  ];
  const score = rules.filter(r => r.ok).length;
  const configs = [
    { label: "Très faible", color: "#ef4444" },
    { label: "Faible",      color: "#f97316" },
    { label: "Moyen",       color: "#eab308" },
    { label: "Fort",        color: "#22c55e" },
    { label: "Très fort",   color: "#16a34a" },
  ];
  return { score, ...configs[score], rules };
}

export default function Register() {
  const [location, navigate] = useLocation();
  
  // Récupérer l'URL de redirection si elle existe
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const from = params.get("from") ?? "";
  const googleOAuthConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);
  const { login } = useCandidateAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [portrait, setPortrait] = useState<PortraitCaptureResult | null>(null);
  const [isUploadingPortrait, setIsUploadingPortrait] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    evaluationAlreadyCompleted: "no" as "yes" | "no",
  });
  const isFullNameInvalid = form.fullName.length > 0 && form.fullName.trim().length < 2;
  const isEmailInvalid = form.email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const passwordStrength = getPasswordStrength(form.password);
  const isPasswordInvalid = form.password.length > 0 && passwordStrength.score < 3;
  const isConfirmationInvalid = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  function handleGoogleRegister() {
    if (!googleOAuthConfigured) {
      toast.info("La connexion Google sera disponible prochainement.");
      return;
    }
    setIsGoogleRedirecting(true);
    toast.info("Redirection sécurisée vers Google…");
    window.setTimeout(() => window.location.assign("/api/auth/google/start"), 80);
  }

  // Valider le formulaire en temps réel
  useEffect(() => {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    const passwordValid = form.password.length >= 8 && /[A-Z]/.test(form.password) && /[0-9]/.test(form.password);
    const passwordMatch = form.password === form.confirmPassword;
    const isValid = form.fullName && form.email && emailValid && form.password && passwordValid && passwordMatch && Boolean(portrait);
    setIsFormValid(isValid as boolean);
  }, [form, portrait]);

  const registerMutation = trpc.candidate.register.useMutation({
    onSuccess: (data) => {
      // Afficher l'animation de succès
      setShowSuccessAnimation(true);
      // Conserver uniquement le nécessaire pour terminer le profil sécurisé.
      localStorage.setItem("registrationEmail", form.email);
      localStorage.setItem("candidateId", String(data.candidateId));
      // Aucun JWT candidat n’est créé avant la validation du lien d’activation.
      sessionStorage.removeItem("3m_candidate_token");
      // Attendre 2 secondes avant d’afficher l’écran d’activation
      setTimeout(() => {
        toast.success("Compte créé ! Un lien d’activation a été envoyé à votre adresse email.");
        navigate(`/verify-email-sent?email=${encodeURIComponent(form.email)}${from ? `&from=${encodeURIComponent(from)}` : ""}`);
      }, 2000);
    },
    onError: (err) => {
      // Améliorer la gestion des erreurs
      if (err.message.includes("existe déjà")) {
        toast.error("Un compte existe déjà avec cet email. Veuillez vous connecter ou utiliser un autre email.");
      } else {
        toast.error(err.message || "Erreur lors de la création du compte.");
      }
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      toast.error("Le mot de passe doit contenir au moins une lettre majuscule.");
      return;
    }
    if (!/[0-9]/.test(form.password)) {
      toast.error("Le mot de passe doit contenir au moins un chiffre.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!portrait) {
      toast.error("Un portrait humain vérifié est obligatoire pour finaliser l’inscription.");
      return;
    }

    setIsUploadingPortrait(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append("file", portrait.file);
      uploadForm.append("fileType", "photo_identite");
      uploadForm.append("email", form.email.trim().toLowerCase());
      uploadForm.append("captureMethod", portrait.method);
      const response = await fetch("/api/candidate/upload-public", { method: "POST", body: uploadForm });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || typeof result.portraitVerificationToken !== "string" || typeof result.fileUrl !== "string") {
        throw new Error(result.error || "La vérification sécurisée du portrait a échoué.");
      }
      sessionStorage.setItem("registrationAvatarUrl", result.fileUrl);
      registerMutation.mutate({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        portraitVerificationToken: result.portraitVerificationToken,
        evaluationAlreadyCompleted: form.evaluationAlreadyCompleted === "yes",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d’envoyer le portrait.");
    } finally {
      setIsUploadingPortrait(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)" }}>
      {/* Panneau gauche — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[#7cb9e8] blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <img src={LOGO_URL} alt="3M Travel" className="w-24 h-24 rounded-2xl mx-auto mb-6 shadow-2xl object-cover" />
          <h1 className="text-4xl font-black mb-4">Votre Espace Candidat</h1>
          <p className="text-blue-200 text-lg mb-8">Créez votre compte et suivez l'avancement de votre dossier d'immigration en temps réel.</p>
          <div className="space-y-4 text-left">
            {[
              { icon: CheckCircle, text: "Suivi en temps réel de votre dossier" },
              { icon: CheckCircle, text: "Upload sécurisé de vos documents" },
              { icon: CheckCircle, text: "Messagerie directe avec votre conseiller" },
              { icon: CheckCircle, text: "Notifications à chaque étape clé" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <item.icon className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-blue-100">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Panneau droit — Formulaire */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 sm:p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Inscription</h2>
            <p className="text-gray-500 text-sm mt-1">Rejoignez l'espace candidat 3M Travel</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-busy={registerMutation.isPending || isUploadingPortrait || showSuccessAnimation}>
            {/* Nom complet */}
            <div>
              <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">Nom complet *</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="fullName"
                  placeholder="Jean Dupont"
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  autoComplete="name"
                  aria-invalid={isFullNameInvalid}
                  aria-describedby={isFullNameInvalid ? "fullName-error" : undefined}
                  className={`h-12 pl-10 ${isFullNameInvalid ? "border-red-400 focus-visible:ring-red-500" : ""}`}
                  required
                  disabled={registerMutation.isPending || showSuccessAnimation}
                />
              </div>
              <AnimatePresence>
                {isFullNameInvalid && (
                  <motion.p id="fullName-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-1 text-xs text-red-700" role="alert">
                    Indiquez votre nom complet (au moins 2 caractères).
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="jean@exemple.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                  aria-invalid={isEmailInvalid}
                  aria-describedby={isEmailInvalid ? "email-error" : undefined}
                  className={`h-12 pl-10 ${isEmailInvalid ? "border-red-400 focus-visible:ring-red-500" : ""}`}
                  required
                  disabled={registerMutation.isPending || showSuccessAnimation}
                />
              </div>
              {/* Indicateur de validation email */}
              <AnimatePresence>
                {isEmailInvalid && (
                  <motion.div
                    id="email-error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-2 mt-1 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs"
                    role="alert"
                  >
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    Email invalide
                  </motion.div>
                )}
              </AnimatePresence>
            </div>



            {/* Mot de passe */}
            <div>
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Mot de passe * <span className="text-gray-400 font-normal">(8 car. min.)</span></Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                  aria-invalid={isPasswordInvalid}
                  aria-describedby={form.password ? "password-strength" : undefined}
                  className={`h-12 pl-10 pr-12 ${isPasswordInvalid ? "border-red-400 focus-visible:ring-red-500" : ""}`}
                  required
                  disabled={registerMutation.isPending || showSuccessAnimation}
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
              {form.password && (() => {
                const strength = passwordStrength;
                return (
                  <div id="password-strength" className="mt-2" role="status" aria-live="polite">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                          style={{ background: i <= strength.score ? strength.color : "#e5e7eb" }} aria-hidden="true" />
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold" style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                    {isPasswordInvalid && <p className="mt-1 text-xs text-red-700">Ajoutez une majuscule et un chiffre pour sécuriser votre mot de passe.</p>}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {strength.rules.map(rule => (
                        <span key={rule.text} className={`text-xs flex items-center gap-1 ${
                          rule.ok ? "text-green-600" : "text-gray-400"
                        }`}>
                          <CheckCircle className={`w-3 h-3 ${rule.ok ? "text-green-500" : "text-gray-300"}`} />
                          {rule.text}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Confirmation du mot de passe */}
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Confirmer le mot de passe *</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  autoComplete="new-password"
                  aria-invalid={isConfirmationInvalid}
                  aria-describedby={isConfirmationInvalid ? "confirmPassword-error" : undefined}
                  className={`h-12 pl-10 pr-12 ${isConfirmationInvalid ? "border-red-400 focus-visible:ring-red-500" : ""}`}
                  required
                  disabled={registerMutation.isPending || showSuccessAnimation}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Masquer la confirmation du mot de passe" : "Afficher la confirmation du mot de passe"}
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="touch-target absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Indicateur de correspondance */}
              <AnimatePresence>
                {isConfirmationInvalid && (
                  <motion.div
                    id="confirmPassword-error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 p-2 mt-1 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs"
                    role="alert"
                  >
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    Les mots de passe ne correspondent pas
                  </motion.div>
                )}
              </AnimatePresence>
            </div>



            {/* Portrait humain obligatoire */}
            <fieldset className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <legend className="px-1 text-sm font-bold text-slate-800">Évaluation déjà effectuée ?</legend>
              <p className="mt-1 text-xs leading-5 text-slate-600">Avez-vous déjà reçu une évaluation de 3M Travel par e-mail ou directement en agence ?</p>
              <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Évaluation déjà effectuée">
                {([
                  ["yes", "Oui, reçue"],
                  ["no", "Non, à effectuer"],
                ] as const).map(([value, label]) => {
                  const selected = form.evaluationAlreadyCompleted === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setForm((current) => ({ ...current, evaluationAlreadyCompleted: value }))}
                      disabled={registerMutation.isPending || isUploadingPortrait || showSuccessAnimation}
                      className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${selected ? "border-blue-700 bg-blue-700 text-white" : "border-blue-200 bg-white text-blue-800 hover:bg-blue-100"}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {form.evaluationAlreadyCompleted === "yes" && <p className="mt-3 text-xs font-medium text-amber-800">Votre évaluation sera déclarée dans votre espace, puis vérifiée manuellement par notre équipe avant toute mise à jour officielle du dossier.</p>}
            </fieldset>

            {/* Portrait humain obligatoire */}
            <PortraitCapture
              disabled={registerMutation.isPending || isUploadingPortrait || showSuccessAnimation}
              onVerified={setPortrait}
            />

            {/* Bouton */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: showSuccessAnimation ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                type="submit"
                disabled={registerMutation.isPending || isUploadingPortrait || !isFormValid || showSuccessAnimation}
                className="h-12 w-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E3A8A] text-white font-bold rounded-xl transition-all active:scale-[0.98] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registerMutation.isPending || isUploadingPortrait ? (
                  <span className="flex items-center justify-center gap-2" role="status" aria-live="polite">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      aria-hidden="true"
                    >
                      <Loader className="w-4 h-4" />
                    </motion.span>
                    <motion.span
                      animate={{ opacity: [0.55, 1, 0.55] }}
                      transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                    >{isUploadingPortrait ? "Vérification et envoi du portrait..." : "Création en cours..."}</motion.span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" /> Inscription <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
              <AnimatePresence initial={false}>
                {(registerMutation.isPending || isUploadingPortrait) && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0.7 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0.7 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 h-1 origin-left overflow-hidden rounded-full bg-blue-100"
                    role="progressbar"
                    aria-label="Création du compte en cours"
                  >
                    <motion.div
                      className="h-full w-2/5 rounded-full bg-gradient-to-r from-[#7CB9E8] via-[#2563EB] to-[#1E3A8A]"
                      animate={{ x: ["-120%", "280%"] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Séparateur */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">OU</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Boutons OAuth */}
            <div className="grid grid-cols-2 gap-3">
              <div className="group relative">
                <button
                  type="button"
                  disabled={!googleOAuthConfigured || isGoogleRedirecting}
                  aria-describedby={!googleOAuthConfigured ? "register-google-coming-soon" : undefined}
                  aria-busy={isGoogleRedirecting}
                  onClick={handleGoogleRegister}
                  className={`h-11 w-full flex items-center justify-center gap-2 px-4 border rounded-lg text-sm font-medium transition-colors ${googleOAuthConfigured ? "border-gray-300 text-gray-700 hover:bg-gray-50" : "border-gray-200 text-gray-500 opacity-60 cursor-not-allowed"}`}
                >
                  {isGoogleRedirecting ? <Loader className="w-4 h-4 animate-spin" aria-hidden="true" /> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>}
                  {isGoogleRedirecting ? "Redirection Google..." : "Continuer avec Google"}
                </button>
                {!googleOAuthConfigured && <span id="register-google-coming-soon" role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">Bientôt disponible</span>}
              </div>
              <div className="group relative">
                <button type="button" aria-disabled="true" aria-describedby="register-facebook-coming-soon" onClick={(event) => event.preventDefault()} className="h-11 w-full flex items-center justify-center gap-2 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 opacity-60 cursor-not-allowed">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
                <span id="register-facebook-coming-soon" role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">Bientôt disponible</span>
              </div>
            </div>
          </form>

          {/* Animation de succès */}
          <AnimatePresence>
            {showSuccessAnimation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
              >
                <motion.div
                  className="bg-white rounded-full p-8 shadow-2xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-[#2563EB] font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
            <p className="text-xs text-gray-400 mt-3">
              <Link href="/" className="hover:underline">← Retour à l'accueil</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
