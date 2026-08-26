/**
 * AuthGuard — Protège les routes réservées aux candidats connectés.
 * Redirige vers /login avec un message d'avertissement si non authentifié.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { motion } from "framer-motion";
import { Lock, LogIn, UserPlus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOGO_URL = "/manus-storage/logo_3m_d0e23210.jpeg";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Message personnalisé affiché si non connecté */
  message?: string;
  /** Redirection automatique (true) ou affichage d'un écran d'accès refusé (false) */
  autoRedirect?: boolean;
}

function getRequestedInternalPath(location: string): string {
  if (typeof window === "undefined") return location;
  return `${window.location.pathname}${window.location.search}`;
}

export default function AuthGuard({
  children,
  message = "Vous devez disposer d’un compte ou vous connecter pour accéder aux outils de 3M Travel.",
  autoRedirect = false,
}: AuthGuardProps) {
  const { isAuthenticated } = useCandidateAuth();
  const [location, navigate] = useLocation();
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsRestoringSession(false));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isAuthenticated && autoRedirect) {
      const encodedFrom = encodeURIComponent(getRequestedInternalPath(location));
      navigate(`/login?redirect=1&from=${encodedFrom}`);
    }
  }, [isAuthenticated, autoRedirect, location, navigate]);

  if (isRestoringSession) {
    return (
      <div role="status" aria-live="polite" aria-label="Restauration de la session" className="min-h-screen bg-gradient-to-br from-[#07152f] via-[#102a5c] to-[#1d4ed8] px-4 py-12 text-white">
        <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col justify-center gap-8">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-white/15" />
          <div className="grid gap-5 md:grid-cols-3">
            {["w-full", "w-11/12", "w-10/12"].map((width, index) => (
              <div key={index} className={`h-32 ${width} animate-pulse rounded-2xl border border-white/10 bg-white/10`} />
            ))}
          </div>
          <p className="text-center text-sm font-semibold text-blue-100">Restauration sécurisée de votre espace…</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  if (autoRedirect) {
    // Afficher un écran de chargement pendant la redirection
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 100%)" }}>
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p>Redirection vers la connexion...</p>
        </div>
      </div>
    );
  }

  // Écran d'accès refusé avec CTA
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-8 py-6 text-center text-white">
            <img src={LOGO_URL} alt="Logo 3M Travel Agency" className="w-14 h-14 rounded-xl mx-auto mb-3 object-contain" />
            <h1 className="text-xl font-black">Accès Réservé aux Membres</h1>
          </div>

          {/* Corps */}
          <div className="px-8 py-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>

            <p className="text-gray-700 text-base leading-relaxed mb-6 font-medium">
              {message}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <Button
                onClick={() => navigate(`/login?redirect=1&from=${encodeURIComponent(getRequestedInternalPath(location))}`)}
                className="h-12 font-semibold"
                style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Se connecter
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => navigate("/register")}
                variant="outline"
                className="h-12 font-semibold border-2 border-[#1E3A8A] text-[#1E3A8A] hover:bg-blue-50"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Inscription
              </Button>
            </div>

            {/* Avantages */}
            <div className="bg-blue-50 rounded-xl p-4 text-left">
              <p className="text-sm font-semibold text-blue-800 mb-2">Avec votre compte 3M Travel :</p>
              <ul className="space-y-1.5 text-sm text-blue-700">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                  Recherche de vols en temps réel vers 30+ pays
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                  Suivi de votre dossier d'immigration en temps réel
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                  Upload sécurisé de vos documents (CV, passeport...)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                  Messagerie directe avec votre conseiller 3M
                </li>
              </ul>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              <button onClick={() => navigate("/")} className="hover:underline">← Retour à l'accueil</button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
