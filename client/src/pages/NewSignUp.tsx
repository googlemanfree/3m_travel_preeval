import { useState } from "react";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NOUVEAU FORMULAIRE D'INSCRIPTION INDÉPENDANT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Page complètement séparée pour les inscriptions utilisateurs.
 * Formulaire simplifié : nom, email, mot de passe, confirmation.
 */

export function NewSignUp() {
  const [, navigate] = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  const registerMutation = trpc.newSignup.register.useMutation();
  const isLoading = registerMutation.isPending;

  // Calculer la force du mot de passe
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    const levels = [
      { score: 0, label: "", color: "" },
      { score: 1, label: "Très faible", color: "text-red-500" },
      { score: 2, label: "Faible", color: "text-orange-500" },
      { score: 3, label: "Moyen", color: "text-yellow-500" },
      { score: 4, label: "Fort", color: "text-lime-500" },
      { score: 5, label: "Très fort", color: "text-green-500" },
    ];

    return levels[score];
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Le nom complet est requis";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Le nom doit contenir au moins 2 caractères";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "La confirmation du mot de passe est requise";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await registerMutation.mutateAsync({
        fullName: formData.fullName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setSuccessMessage(
        "✅ Compte créé avec succès! Vérifiez votre email pour confirmer votre inscription."
      );
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error?.message || "Une erreur est survenue lors de l'inscription";
      setErrors({ submit: errorMessage });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          {/* En-tête */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Créer un compte
            </h1>
            <p className="text-gray-600">
              Rejoignez 3M Travel & Services pour commencer votre voyage
            </p>
          </div>

          {/* Message de succès */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Erreur générale */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom complet */}
            <div>
              <Label htmlFor="fullName" className="text-gray-700 font-medium">
                Nom complet
              </Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Jean Dupont"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={isLoading}
                className={errors.fullName ? "border-red-500" : ""}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Adresse email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jean@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={errors.password ? "border-red-500" : "pr-10"}
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
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength.color === "text-red-500"
                            ? "bg-red-500 w-1/5"
                            : passwordStrength.color === "text-orange-500"
                              ? "bg-orange-500 w-2/5"
                              : passwordStrength.color === "text-yellow-500"
                                ? "bg-yellow-500 w-3/5"
                                : passwordStrength.color === "text-lime-500"
                                  ? "bg-lime-500 w-4/5"
                                  : "bg-green-500 w-full"
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <Label
                htmlFor="confirmPassword"
                className="text-gray-700 font-medium"
              >
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={errors.confirmPassword ? "border-red-500" : "pr-10"}
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
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Bouton d'inscription */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-all"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  Création en cours...
                </div>
              ) : (
                "Créer mon compte"
              )}
            </Button>
          </form>

          {/* Lien vers connexion */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Vous avez déjà un compte?{" "}
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Se connecter
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
