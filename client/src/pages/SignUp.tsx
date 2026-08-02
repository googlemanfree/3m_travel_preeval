import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const signUpMutation = trpc.signup.register.useMutation();

  // Calculer la force du mot de passe
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return strength;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setFormData({ ...formData, password: pwd });
    setPasswordStrength(calculatePasswordStrength(pwd));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError("Le nom complet est requis");
      return false;
    }
    if (!formData.email.includes("@")) {
      setError("Email invalide");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signUpMutation.mutateAsync({
        fullName: formData.fullName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      setSuccess(true);
      
      // Redirection après 2 secondes
      setTimeout(() => {
        setLocation("/verify-email-signup");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-gray-300";
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inscription réussie !</h2>
          <p className="text-gray-600 mb-4">
            Un email de confirmation a été envoyé à <strong>{formData.email}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Redirection en cours...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
          <p className="text-gray-600">Rejoignez 3M Travel Agency</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nom complet */}
          <div>
            <Label htmlFor="fullName" className="text-gray-700 font-medium mb-2 block">
              Nom complet *
            </Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Jean Dupont"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-gray-700 font-medium mb-2 block">
              Email *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jean@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <Label htmlFor="password" className="text-gray-700 font-medium mb-2 block">
              Mot de passe * (8 caractères minimum)
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handlePasswordChange}
                disabled={isLoading}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Indicateur de force */}
            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < passwordStrength ? getPasswordStrengthColor() : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {passwordStrength === 0 && "Très faible"}
                  {passwordStrength === 1 && "Faible"}
                  {passwordStrength === 2 && "Moyen"}
                  {passwordStrength === 3 && "Bon"}
                  {passwordStrength === 4 && "Très bon"}
                  {passwordStrength === 5 && "Excellent"}
                </p>
              </div>
            )}
          </div>

          {/* Confirmation mot de passe */}
          <div>
            <Label htmlFor="confirmPassword" className="text-gray-700 font-medium mb-2 block">
              Confirmer le mot de passe *
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Bouton d'inscription */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Inscription en cours...
              </>
            ) : (
              "Créer mon compte"
            )}
          </Button>
        </form>

        {/* Lien de connexion */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Vous avez déjà un compte ?{" "}
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Se connecter
          </a>
        </p>
      </Card>
    </div>
  );
}
