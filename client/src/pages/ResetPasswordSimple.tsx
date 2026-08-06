import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PAGE DE RÉINITIALISATION DE MOT DE PASSE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Deux étapes:
 * 1. Demander l'email (mot de passe oublié)
 * 2. Réinitialiser le mot de passe avec le token
 */

export default function ResetPasswordSimple() {
  const [location, setLocation] = useLocation();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Extraire le token de l'URL
  const token = new URLSearchParams(location.split("?")[1] || "").get("token");

  // Si on a un token, on est à l'étape 2
  if (token && step === "request") {
    setStep("reset");
  }

  // Calculer la force du mot de passe
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "bg-gray-300", textColor: "" };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z\d]/.test(pwd)) score++;

    const levels = [
      { score: 0, label: "", color: "bg-gray-300", textColor: "" },
      { score: 1, label: "Très faible", color: "bg-red-500", textColor: "text-red-500" },
      { score: 2, label: "Faible", color: "bg-orange-500", textColor: "text-orange-500" },
      { score: 3, label: "Moyen", color: "bg-yellow-500", textColor: "text-yellow-500" },
      { score: 4, label: "Fort", color: "bg-lime-500", textColor: "text-lime-500" },
      { score: 5, label: "Très fort", color: "bg-green-500", textColor: "text-green-500" },
    ];

    return levels[score];
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordWidth = (passwordStrength.score / 5) * 100;

  // Étape 1: Demander l'email
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email invalide";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/trpc/simpleAuth.forgotPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ submit: data.error?.message || "Erreur lors de la demande" });
        setIsLoading(false);
        return;
      }

      setMessage(
        "✅ Si cet email existe, un lien de réinitialisation a été envoyé. Vérifiez votre boîte de réception."
      );
      setEmail("");
    } catch (error: any) {
      setErrors({ submit: error?.message || "Erreur lors de la demande" });
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 2: Réinitialiser le mot de passe
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "La confirmation est requise";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/trpc/simpleAuth.resetPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ submit: data.error?.message || "Erreur lors de la réinitialisation" });
        setIsLoading(false);
        return;
      }

      setMessage(
        "✅ Mot de passe réinitialisé avec succès! Redirection vers la connexion..."
      );
      setPassword("");
      setConfirmPassword("");

      // Rediriger vers la connexion après 2 secondes
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (error: any) {
      setErrors({ submit: error?.message || "Erreur lors de la réinitialisation" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          {/* En-tête */}
          <div className="mb-8 text-center">
            {step === "request" ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Mot de passe oublié?
                </h1>
                <p className="text-gray-600">
                  Entrez votre email pour recevoir un lien de réinitialisation
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Réinitialiser le mot de passe
                </h1>
                <p className="text-gray-600">
                  Entrez votre nouveau mot de passe
                </p>
              </>
            )}
          </div>

          {/* Message de succès */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-green-700 text-sm">{message}</p>
            </div>
          )}

          {/* Erreur générale */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Étape 1: Demander l'email */}
          {step === "request" && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Adresse email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  disabled={isLoading}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
              >
                {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
              </Button>
            </form>
          )}

          {/* Étape 2: Réinitialiser le mot de passe */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Nouveau mot de passe */}
              <div>
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Nouveau mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: "" });
                    }}
                    disabled={isLoading}
                    className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}

                {/* Indicateur de force */}
                {password && (
                  <div className="mt-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${passwordStrength.color}`}
                          style={{ width: `${passwordWidth}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium whitespace-nowrap ${passwordStrength.textColor}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors({ ...errors, confirmPassword: "" });
                    }}
                    disabled={isLoading}
                    className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
              >
                {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
              </Button>
            </form>
          )}

          {/* Lien vers connexion */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Vous avez un compte?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
