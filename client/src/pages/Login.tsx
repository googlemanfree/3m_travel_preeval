import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        destination: candidateData.destination,
        dossierStatus: candidateData.dossierStatus,
        emailVerified: candidateData.emailVerified ?? true,
      }));
      login(data.token, {
        id: candidateData.id,
        fullName: candidateData.fullName,
        email: candidateData.email,
        destination: candidateData.destination,
        dossierStatus: candidateData.dossierStatus,
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Veuillez renseigner votre email et mot de passe.");
      return;
    }
    loginMutation.mutate({ email, password });
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
          <h2 className="text-lg font-semibold text-blue-100 mt-2">Connexion Sécurisée - Suivi de Dossier Visa</h2>
          <p className="text-blue-200 text-sm mt-1">Connectez-vous pour accéder à votre dossier d'immigration et suivre votre demande de visa</p>
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
          <h2 className="text-xl font-bold text-gray-800 mb-6">Accédez à Votre Dossier d'Immigration</h2>
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

          {/* Se souvenir de moi + Mot de passe oublié */}
          <div className="flex items-center justify-between mt-1 mb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
              <span className="text-sm text-gray-600">Se souvenir de moi</span>
            </label>
            <Link href="/forgot-password" className="text-sm text-[#2563EB] hover:underline font-medium">
              Mot de passe oublié ?
            </Link>
          </div>

          {/* Sécurité */}
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 justify-center">
            <Shield className="w-3.5 h-3.5" />
            <span>Connexion sécurisée — vos données sont chiffrées</span>
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Pas encore de compte ?{" "}
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
    </div>
  );
}
