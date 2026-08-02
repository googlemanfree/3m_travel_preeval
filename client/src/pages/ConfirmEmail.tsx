import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Mail, Loader } from "lucide-react";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PAGE DE CONFIRMATION D'EMAIL
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export default function ConfirmEmail() {
  const [location, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [showResendForm, setShowResendForm] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Extraire le token de l'URL
  const token = new URLSearchParams(location.split("?")[1] || "").get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de vérification manquant. Veuillez vérifier le lien.");
      return;
    }

    // Vérifier l'email automatiquement
    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/trpc/simpleAuth.verifyEmail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setMessage(data.error?.message || "Erreur lors de la vérification");
          return;
        }

        setStatus("success");
        setMessage(data.result?.message || "Email vérifié avec succès!");

        // Rediriger vers la connexion après 3 secondes
        setTimeout(() => {
          setLocation("/login");
        }, 3000);
      } catch (error: any) {
        setStatus("error");
        setMessage(error?.message || "Erreur lors de la vérification de l'email");
      }
    };

    verifyEmail();
  }, [token, setLocation]);

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resendEmail.trim()) {
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch("/api/trpc/simpleAuth.resendVerificationEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error?.message || "Erreur lors du renvoi de l'email");
        setIsResending(false);
        return;
      }

      setMessage(
        "✅ Un nouvel email de vérification a été envoyé. Vérifiez votre boîte de réception."
      );
      setResendEmail("");
      setShowResendForm(false);
    } catch (error: any) {
      setMessage(error?.message || "Erreur lors du renvoi de l'email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          {/* En-tête */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Vérification d'email
            </h1>
            <p className="text-gray-600">
              Confirmez votre adresse email
            </p>
          </div>

          {/* Contenu selon le statut */}
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-gray-600 text-center">
                Vérification de votre email en cours...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-green-700 font-semibold">{message}</p>
                <p className="text-gray-600 text-sm">
                  Vous allez être redirigé vers la page de connexion...
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Prochaines étapes:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Email vérifié avec succès</li>
                  <li>→ Connectez-vous avec vos identifiants</li>
                  <li>→ Accédez à votre espace personnel</li>
                </ul>
              </div>

              <Button
                onClick={() => setLocation("/login")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
              >
                Aller à la connexion
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-red-700 font-semibold">{message}</p>
                <p className="text-gray-600 text-sm">
                  Le lien de vérification peut être expiré ou invalide.
                </p>
              </div>

              {/* Formulaire de renvoi d'email */}
              {!showResendForm ? (
                <Button
                  onClick={() => setShowResendForm(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Renvoyer l'email de vérification
                </Button>
              ) : (
                <form onSubmit={handleResendEmail} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Votre adresse email:
                    </label>
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="jean@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isResending}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
                    >
                      {isResending ? "Envoi..." : "Renvoyer"}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowResendForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              )}

              <Button
                onClick={() => setLocation("/simple-signup")}
                variant="outline"
                className="w-full"
              >
                Retour à l'inscription
              </Button>
            </div>
          )}

          {/* Lien vers connexion */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Vous avez déjà un compte?{" "}
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
