import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminNotificationBell from "@/components/AdminNotificationBell";
import { trpc } from "@/lib/trpc";

interface AdminGuardProps {
  children: React.ReactNode;
  message?: string;
}

export default function AdminGuard({ children, message = "Accès réservé aux administrateurs." }: AdminGuardProps) {
  const [location, navigate] = useLocation();
  const [sessionToken, setSessionToken] = useState(() => {
    if (typeof window === "undefined") return "";
    // Prefer the persistent 24-hour token when both stores exist. A stale
    // sessionStorage value must not hide a valid localStorage session after a
    // refresh or a browser restart.
    return localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken") || "";
  });
  const [queryTimedOut, setQueryTimedOut] = useState(false);
  const adminSession = trpc.adminAuth.me.useQuery(sessionToken ? { sessionToken } : undefined, { retry: false, refetchOnWindowFocus: true });
  const platformBootstrap = trpc.adminAuth.bootstrapPlatformSession.useQuery(undefined, {
    enabled: !sessionToken && adminSession.data?.authenticated === false,
    retry: false,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (!platformBootstrap.data?.authenticated) return;
    const { sessionToken: restoredToken, admin } = platformBootstrap.data;
    sessionStorage.setItem("adminSessionToken", restoredToken);
    localStorage.setItem("adminSessionToken", restoredToken);
    sessionStorage.setItem("adminName", admin.fullName);
    sessionStorage.setItem("adminEmail", admin.email);
    setSessionToken(restoredToken);
  }, [platformBootstrap.data]);
  useEffect(() => {
    if (!adminSession.isLoading) { setQueryTimedOut(false); return; }
    const timeout = window.setTimeout(() => setQueryTimedOut(true), 5_000);
    return () => window.clearTimeout(timeout);
  }, [adminSession.isLoading]);
  const isBootstrapping = !sessionToken && adminSession.data?.authenticated === false && platformBootstrap.isLoading;
  const isChecking = (adminSession.isLoading || isBootstrapping) && !queryTimedOut;
  const isAuthorized = isChecking ? null : adminSession.data?.authenticated === true;
  const sessionTemporarilyUnavailable = adminSession.isError && !/non authentifi|expir|invalid/i.test(adminSession.error?.message ?? "");
  const requiresPasswordChange = adminSession.data?.authenticated === true && adminSession.data.requiresPasswordChange === true;

  useEffect(() => {
    if (requiresPasswordChange && location !== "/admin/change-password") {
      navigate("/admin/change-password");
    }
  }, [location, navigate, requiresPasswordChange]);

  if (isChecking || requiresPasswordChange) {
    const loadingMessage = requiresPasswordChange ? "Préparation de votre espace sécurisé" : "Vérification de votre accès administrateur";
    const loadingDetail = requiresPasswordChange ? "Vous allez être redirigé vers la mise à jour de votre mot de passe." : "La session est vérifiée avant l’ouverture du tableau de bord.";
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#e8f1ff,transparent_52%),#f8fafc] px-4 py-10" aria-busy="true" aria-live="polite">
        <section className="w-full max-w-md rounded-3xl border border-blue-100 bg-white/95 p-7 text-center shadow-xl shadow-blue-950/10 backdrop-blur">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-800 ring-8 ring-blue-50/70">
            <Lock className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">3M Travel &amp; Services</p>
          <h1 className="mt-2 text-xl font-black text-slate-950">{loadingMessage}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{loadingDetail}</p>
          <div className="mt-6" role="progressbar" aria-label="Chargement de l’espace administrateur" aria-valuemin={0} aria-valuemax={100}>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><motion.div className="h-full w-2/5 rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-blue-700" animate={{ x: ["-120%", "280%"] }} transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }} /></div>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500"><span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" aria-hidden="true" />Connexion sécurisée en cours…</div>
          </div>
        </section>
      </main>
    );
  }

  if (sessionTemporarilyUnavailable) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-4 text-xl font-black text-slate-900">Vérification temporairement indisponible</h1>
          <p className="mt-2 text-sm text-slate-600">Votre session administrateur est conservée pendant la reprise de connexion.</p>
          <Button className="mt-5" onClick={() => void adminSession.refetch()}>Rester dans l’espace admin</Button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-block bg-red-100 rounded-full p-4 mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès Refusé</h1>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-semibold mb-1">Authentification requise</p>
                <p>Seuls les administrateurs autorisés peuvent accéder à cette zone.</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => navigate("/admin/login")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Se connecter en tant qu'Admin
              </Button>
              
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="w-full"
              >
                Retour à l'accueil
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              © 2026 3M Travel & Services - Tous droits réservés
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-3 right-4 z-[60] bg-white rounded-full shadow-md border border-gray-100">
        <AdminNotificationBell />
      </div>
      {children}
    </>
  );
}
