import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, AlertCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/pasted_file_nP22ud_logo3Mfull_b9e4b2c3.jpeg";

type SignUpStep = "form" | "verification" | "error";

export default function SignUp() {
  // États du formulaire
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // États du flux
  const [step, setStep] = useState<SignUpStep>("form");
  const [errorMessage, setErrorMessage] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Mutation pour l'inscription
  const signUpMutation = trpc.simpleAuth.register.useMutation({
    onSuccess: () => {
      setRegisteredEmail(email);
      setStep("verification");
      toast.success("Inscription réussie ! Vérifiez votre email pour confirmer votre compte.");
    },
    onError: (err) => {
      setErrorMessage(err.message || "Une erreur s'est produite lors de l'inscription");
      setStep("error");
      toast.error(err.message || "Erreur lors de l'inscription");
    },
  });

  // Validation du formulaire
  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      toast.error("Veuillez entrer votre nom complet");
      return false;
    }

    if (!email.trim()) {
      toast.error("Veuillez entrer votre adresse email");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Veuillez entrer une adresse email valide");
      return false;
    }

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      toast.error("Le mot de passe doit contenir au moins une majuscule");
      return false;
    }

    if (!/[0-9]/.test(password)) {
      toast.error("Le mot de passe doit contenir au moins un chiffre");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return false;
    }

    if (!agreedToTerms) {
      toast.error("Veuillez accepter les conditions d'utilisation");
      return false;
    }

    return true;
  };

  // Gestion de la soumission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    signUpMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
    });
  };

  // Réinitialiser et recommencer
  const handleReset = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAgreedToTerms(false);
    setErrorMessage("");
    setStep("form");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header coloré */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] p-8 text-center text-white">
          <img
            src={LOGO_URL}
            alt="3M Travel"
            className="w-16 h-16 rounded-xl mx-auto mb-4 shadow-lg object-cover"
          />
          <h1 className="text-2xl font-black">Créer mon compte</h1>
          <p className="text-blue-200 text-sm mt-1">Rejoignez 3M Travel & Services</p>
        </div>

        {/* Contenu */}
        <div className="p-8">
          {step === "form" && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Nom complet */}
              <div>
                <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">
                  Nom complet
                </Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jean Dupont"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    autoComplete="name"
                    required
                    disabled={signUpMutation.isPending}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Adresse email
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                    required
                    disabled={signUpMutation.isPending}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Mot de passe
                </Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    required
                    disabled={signUpMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={signUpMutation.isPending}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Minimum 8 caractères, 1 majuscule, 1 chiffre
                </p>
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                  Confirmer le mot de passe
                </Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="new-password"
                    required
                    disabled={signUpMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={signUpMutation.isPending}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              {/* Conditions d'utilisation */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer mt-1"
                  disabled={signUpMutation.isPending}
                />
                <label htmlFor="terms" className="text-xs text-gray-600 cursor-pointer">
                  J'accepte les{" "}
                  <Link href="/conditions-utilisation" className="text-[#2563EB] hover:underline font-semibold">
                    conditions d'utilisation
                  </Link>{" "}
                  et la{" "}
                  <Link href="/politique-confidentialite" className="text-[#2563EB] hover:underline font-semibold">
                    politique de confidentialité
                  </Link>
                </label>
              </div>

              {/* Bouton d'inscription */}
              <Button
                type="submit"
                disabled={signUpMutation.isPending}
                className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E3A8A] text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
              >
                {signUpMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    Inscription en cours...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Créer mon compte <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              {/* Lien vers connexion */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Vous avez déjà un compte ?{" "}
                  <Link href="/login" className="text-[#2563EB] font-semibold hover:underline">
                    Se connecter
                  </Link>
                </p>
              </div>
            </motion.form>
          )}

          {step === "verification" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-center"
            >
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-10 h-10 text-blue-600" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">Vérifiez votre email</h2>
                <p className="text-gray-600 text-sm mt-2">
                  Un lien de confirmation a été envoyé à :
                </p>
                <p className="font-semibold text-gray-900 mt-2 break-all">{registeredEmail}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-2">Prochaines étapes :</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Vérifiez votre boîte de réception (et les spams)</li>
                      <li>Cliquez sur le lien de confirmation</li>
                      <li>Vous serez redirigé vers la page de connexion</li>
                      <li>Connectez-vous avec vos identifiants</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full text-[#2563EB] hover:text-[#1E3A8A] font-medium py-2 rounded-lg transition-colors"
              >
                Utiliser une autre adresse email
              </button>

              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E3A8A] text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]">
                  Aller à la connexion
                </Button>
              </Link>
            </motion.div>
          )}

          {step === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-center"
            >
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">Erreur d'inscription</h2>
                <p className="text-gray-600 text-sm mt-2">{errorMessage}</p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1E3A8A] text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
                >
                  Réessayer
                </button>

                <Link href="/login">
                  <button className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 rounded-lg transition-colors">
                    Retour à la connexion
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
