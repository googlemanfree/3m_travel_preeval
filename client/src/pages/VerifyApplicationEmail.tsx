/**
 * Page de vérification email pour les dossiers d'immigration
 * L'utilisateur reçoit un OTP par email et doit le saisir pour continuer vers le paiement
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Loader2, Mail, Clock, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function VerifyApplicationEmail() {
  const [, navigate] = useLocation();
  const [dossierNumber, setDossierNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [isExpired, setIsExpired] = useState(false);

  const verifyOtp = trpc.application.verifyApplicationOtp.useMutation();

  // Parser le dossier number depuis l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dossier = params.get("dossier");
    if (dossier) {
      setDossierNumber(dossier);
    } else {
      navigate("/");
    }
  }, [navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-submit quand 6 chiffres sont entrés
  useEffect(() => {
    if (otp.length === 6 && !isExpired) {
      handleVerify();
    }
  }, [otp]);

  const handleVerify = async () => {
    if (!dossierNumber || otp.length !== 6) {
      setErrors({ otp: "Veuillez entrer un code à 6 chiffres" });
      return;
    }

    try {
      const result = await verifyOtp.mutateAsync({
        dossierNumber,
        otp,
      });

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        navigate(`/payment-success?dossier=${dossierNumber}&demo=1`);
      }
    } catch (err: any) {
      setErrors({ otp: err.message || "Erreur lors de la vérification" });
      setOtp("");
    }
  };

  const resendOtp = trpc.application.resendApplicationOtp.useMutation();

  const handleResend = async () => {
    if (!dossierNumber) return;
    try {
      await resendOtp.mutateAsync({ dossierNumber });
      setOtp("");
      setTimeLeft(900); // Réinitialiser le timer
      setIsExpired(false);
      setErrors({});
    } catch (err: any) {
      setErrors({ otp: err.message || "Erreur lors du renvoi" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Vérifiez votre email</h1>
          <p className="text-sm text-gray-600">
            Nous avons envoyé un code de vérification à votre adresse email
          </p>
        </div>

        {/* Carte principale */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            {/* Badge du dossier */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600">Dossier</span>
              <Badge variant="secondary">{dossierNumber}</Badge>
            </div>

            {/* Saisie OTP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code de vérification (6 chiffres)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(val);
                  setErrors({});
                }}
                placeholder="000000"
                className="text-center text-2xl font-bold tracking-widest"
                disabled={isExpired || verifyOtp.isPending}
              />
              {errors.otp && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.otp}
                </div>
              )}
            </div>

            {/* Timer */}
            <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
              isExpired ? "bg-red-50" : "bg-amber-50"
            }`}>
              <Clock className={`w-4 h-4 ${isExpired ? "text-red-600" : "text-amber-600"}`} />
              <span className={`text-sm font-medium ${isExpired ? "text-red-600" : "text-amber-600"}`}>
                {isExpired ? "Code expiré" : `Expire dans ${formatTime(timeLeft)}`}
              </span>
            </div>

            {/* Info sécurité */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                ✓ Ce code est valide pendant 15 minutes. Ne le partagez avec personne.
              </p>
            </div>
          </div>
        </Card>

        {/* Boutons */}
        <div className="space-y-3">
          <Button
            onClick={handleVerify}
            disabled={otp.length !== 6 || isExpired || verifyOtp.isPending}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl"
          >
            {verifyOtp.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Vérification en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Vérifier et continuer
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <Button
            onClick={handleResend}
            variant="outline"
            disabled={resendOtp.isPending}
            className="w-full"
          >
            {resendOtp.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Renvoyer le code"
            )}
          </Button>
        </div>

        {/* Lien de retour */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/procedures")}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Retour aux procédures
          </button>
        </div>
      </div>
    </div>
  );
}
