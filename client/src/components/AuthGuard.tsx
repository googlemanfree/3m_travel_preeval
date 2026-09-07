/**
 * AuthGuard — Protège les routes réservées aux candidats connectés.
 * Redirige vers /login avec un message d'avertissement si non authentifié.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { motion } from "framer-motion";
import { Lock, LogIn, UserPlus, ArrowRight, Loader2, CircleHelp } from "lucide-react";
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
  const [pendingAction, setPendingAction] = useState<"login" | "register" | null>(null);

  useEffect(() => {
    let finished = false;
    const finishRestoration = () => {
      if (finished) return;
      finished = true;
      setIsRestoringSession(false);
    };
    const frame = window.requestAnimationFrame(finishRestoration);
    // Fallback déterministe : un navigateur ou une page en arrière-plan peut suspendre rAF.
    const timeout = window.setTimeout(finishRestoration, 750);
    return () => {
      finished = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
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
    <div className="min-h-screen flex items-center justify-center px-3 py-6 sm:px-4 sm:py-10"
      style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_-28px_rgba(0,0,0,0.55)] ring-1 ring-white/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-5 py-5 text-center text-white sm:px-8 sm:py-6">
            <img src={LOGO_URL} alt="Logo 3M Travel Agency" className="mx-auto mb-3 h-12 w-12 rounded-xl object-contain sm:h-14 sm:w-14" />
            <h1 className="text-lg font-black sm:text-xl">Accès Réservé aux Membres</h1>
          </div>

          {/* Corps */}
          <div className="px-5 py-6 text-center sm:px-8 sm:py-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 sm:h-16 sm:w-16">
              <Lock className="h-7 w-7 text-amber-500 sm:h-8 sm:w-8" />
            </div>

            <p className="mb-5 text-sm font-medium leading-relaxed text-gray-700 sm:mb-6 sm:text-base">
              {message}
            </p>

            <p className="mb-5 text-xs leading-relaxed text-slate-500 sm:text-sm">
              Votre dossier contient des informations personnelles et des documents confidentiels. Connectez-vous ou créez un compte pour que seul votre espace sécurisé puisse y accéder.
            </p>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-2">
              <Button
                disabled={pendingAction !== null}
                onClick={() => {
                  setPendingAction("login");
                  navigate(`/login?redirect=1&from=${encodeURIComponent(getRequestedInternalPath(location))}`);
                }}
                className="h-11 font-semibold sm:h-12"
                style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
              >
                {pendingAction === "login" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                {pendingAction === "login" ? "Ouverture…" : "Se connecter"}
                {pendingAction !== "login" && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              <Button
                disabled={pendingAction !== null}
                onClick={() => {
                  setPendingAction("register");
                  navigate(`/register?from=${encodeURIComponent(getRequestedInternalPath(location))}`);
                }}
                variant="outline"
                className="h-11 border-2 border-[#1E3A8A] font-semibold text-[#1E3A8A] hover:bg-blue-50 sm:h-12"
              >
                {pendingAction === "register" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                {pendingAction === "register" ? "Ouverture…" : "Inscription"}
              </Button>
            </div>

            <Button
              type="button"
              variant="link"
              onClick={() => navigate("/forgot-password")}
              className="mb-3 h-auto px-2 text-sm font-semibold text-[#1E3A8A] hover:text-[#2563EB]"
            >
              <CircleHelp className="mr-2 h-4 w-4" />
              Mot de passe oublié ? Besoin d’aide ?
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-5 w-full font-semibold text-[#1E3A8A] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:text-[#1E3A8A] hover:shadow-md active:translate-y-0 sm:mb-6"
            >
              ← Retour à l’accueil
            </Button>

            {/* Avantages */}
            <div className="rounded-xl bg-blue-50 p-3 text-left sm:p-4">
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

          </div>
        </div>
      </motion.div>
    </div>
  );
}
