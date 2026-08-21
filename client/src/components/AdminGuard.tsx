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
  const [queryTimedOut, setQueryTimedOut] = useState(false);
  const sessionToken = typeof window !== "undefined"
    ? sessionStorage.getItem("adminSessionToken") || localStorage.getItem("adminSessionToken") || undefined
    : undefined;
  const adminSession = trpc.adminAuth.me.useQuery(sessionToken ? { sessionToken } : undefined, { retry: false, refetchOnWindowFocus: true });
  const isChecking = adminSession.isLoading && !queryTimedOut;
  const sessionTemporarilyUnavailable = Boolean(sessionToken) && (adminSession.isError || queryTimedOut);
  const isAuthorized = isChecking ? null : adminSession.data?.authenticated === true;
  const requiresPasswordChange = adminSession.data?.authenticated === true && adminSession.data.requiresPasswordChange === true;

  useEffect(() => {
    if (!adminSession.isLoading) {
      setQueryTimedOut(false);
      return;
    }
    const timeout = window.setTimeout(() => setQueryTimedOut(true), 5_000);
    return () => window.clearTimeout(timeout);
  }, [adminSession.isLoading]);

  useEffect(() => {
    if (requiresPasswordChange && location !== "/admin/change-password") {
      navigate("/admin/change-password");
    }
  }, [location, navigate, requiresPasswordChange]);

  if (isAuthorized === null || requiresPasswordChange) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">
            {requiresPasswordChange ? "Redirection vers la création de votre nouveau mot de passe..." : "Vérification de l'accès..."}
          </p>
        </div>
      </div>
    );
  }

  if (sessionTemporarilyUnavailable) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-600" />
          <h1 className="text-xl font-bold text-gray-900">Vérification de session en cours</h1>
          <p className="mt-2 text-sm text-gray-600">Votre session administrateur est conservée. La vérification du serveur met simplement plus de temps que prévu.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" onClick={() => { setQueryTimedOut(false); void adminSession.refetch(); }}>Réessayer</Button>
            <Button className="flex-1" variant="outline" onClick={() => navigate("/admin")}>Rester dans l’espace admin</Button>
          </div>
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
