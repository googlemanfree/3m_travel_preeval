import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminNotificationBell from "@/components/AdminNotificationBell";

interface AdminGuardProps {
  children: React.ReactNode;
  message?: string;
}

export default function AdminGuard({ children, message = "Accès réservé aux administrateurs." }: AdminGuardProps) {
  const [, navigate] = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur a un token admin valide
    const adminToken = localStorage.getItem("adminSessionToken");
    
    if (!adminToken) {
      setIsAuthorized(false);
      return;
    }

    // Le token existe, considérer l'utilisateur comme autorisé
    setIsAuthorized(true);
  }, [navigate]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Vérification de l'accès...</p>
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
