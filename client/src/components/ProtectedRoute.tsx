import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "user";
}

/**
 * Composant qui protège les routes en vérifiant l'authentification
 * Redirige vers /login si l'utilisateur n'est pas authentifié
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading, user } = useAuth();

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers la connexion si non authentifié
  if (!isAuthenticated) {
    setLocation(`/login?redirect=1&from=${encodeURIComponent(window.location.pathname)}`);
    return null;
  }

  // Vérifier le rôle requis si spécifié
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Accès refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // Afficher le contenu si authentifié
  return <>{children}</>;
}
