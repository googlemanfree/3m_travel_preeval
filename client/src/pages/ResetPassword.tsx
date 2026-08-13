import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Très faible", color: "#ef4444" };
  if (score === 2) return { score, label: "Faible", color: "#f97316" };
  if (score === 3) return { score, label: "Moyen", color: "#eab308" };
  if (score === 4) return { score, label: "Fort", color: "#22c55e" };
  return { score, label: "Très fort", color: "#16a34a" };
}

export default function ResetPassword() {
  const [location, navigate] = useLocation();
  // Extraire le token de l'URL de manière robuste
  const queryString = typeof window !== 'undefined' ? window.location.search : location.split("?")[1] ?? "";
  const params = new URLSearchParams(queryString);
  const token = params.get("token")?.trim() ?? "";
  
  console.log("[ResetPassword] URL:", typeof window !== 'undefined' ? window.location.href : location);
  console.log("[ResetPassword] Token extrait:", token ? `${token.substring(0, 10)}...` : "VIDE");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(password);

  const resetMutation = trpc.candidate.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Mot de passe réinitialisé avec succès !");
      setTimeout(() => navigate("/login"), 3000);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { toast.error("Lien invalide. Veuillez refaire une demande."); return; }
    if (password.length < 8) { toast.error("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (!/[A-Z]/.test(password)) { toast.error("Le mot de passe doit contenir au moins une majuscule."); return; }
    if (!/[0-9]/.test(password)) { toast.error("Le mot de passe doit contenir au moins un chiffre."); return; }
    if (password !== confirm) { toast.error("Les mots de passe ne correspondent pas."); return; }
    resetMutation.mutate({ token, newPassword: password });
  }

  // Afficher le token pour debug
  if (!token) {
    console.warn("[ResetPassword] Aucun token trouvé dans l'URL");
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 100%)" }}>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-500 mb-6">Ce lien de réinitialisation est invalide ou a expiré.</p>
          <Button onClick={() => navigate("/forgot-password")}
            style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
            className="w-full">
            Faire une nouvelle demande
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
            <img src={LOGO_URL} alt="3M Travel" className="w-14 h-14 rounded-xl mx-auto mb-4 object-contain" />
            {success ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-gray-900">Mot de passe modifié !</h1>
                <p className="text-gray-500 mt-2 text-sm">Redirection vers la connexion dans 3 secondes...</p>
              </motion.div>
            ) : (
              <>
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
                <p className="text-gray-500 mt-2 text-sm">
                  Choisissez un mot de passe sécurisé pour votre compte 3M Travel.
                </p>
              </>
            )}
          </div>

          {!success && (
            <div className="px-8 py-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nouveau mot de passe */}
                <div>
                  <Label htmlFor="password" className="text-gray-700 font-medium">Nouveau mot de passe</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 8 caractères"
                      className="pl-10 pr-10 h-11"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Indicateur de force */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                            style={{ background: i <= strength.score ? strength.color : "#e5e7eb" }} />
                        ))}
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: strength.color }} className="font-medium">{strength.label}</span>
                        <span className="text-gray-400">8 car. min, 1 majuscule, 1 chiffre</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmation */}
                <div>
                  <Label htmlFor="confirm" className="text-gray-700 font-medium">Confirmer le mot de passe</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="confirm"
                      type={showPassword ? "text" : "password"}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      className={`pl-10 h-11 ${confirm && password !== confirm ? "border-red-400" : confirm && password === confirm ? "border-green-400" : ""}`}
                    />
                  </div>
                  {confirm && password !== confirm && (
                    <p className="text-red-500 text-xs mt-1">Les mots de passe ne correspondent pas.</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={resetMutation.isPending || password !== confirm || password.length < 8}
                  className="w-full h-12 text-base font-semibold mt-2"
                  style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
                >
                  {resetMutation.isPending ? "Modification en cours..." : "Modifier mon mot de passe"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
