import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";

export default function AdminDashboard() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="p-8 text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">Accès Réservé</h1>
            <p className="text-gray-600 mb-6">Vous devez être administrateur pour accéder à cette page.</p>
            <Link href="/">
              <Button className="w-full">Retour à l'accueil</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Tableau de Bord Admin</h1>
          <p className="text-gray-600">Bienvenue, {user?.name}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">📊 Évaluations</h3>
            <p className="text-gray-600 mb-4">Gérer les évaluations des candidats</p>
            <Link href="/admin/evaluations">
              <Button className="w-full">Accéder</Button>
            </Link>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">👥 Accompagnement</h3>
            <p className="text-gray-600 mb-4">Gérer l'accompagnement des dossiers</p>
            <Link href="/admin/accompaniment">
              <Button className="w-full">Accéder</Button>
            </Link>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">📋 Procédures</h3>
            <p className="text-gray-600 mb-4">Gérer les procédures d'immigration</p>
            <Link href="/procedures">
              <Button className="w-full">Accéder</Button>
            </Link>
          </Card>
        </div>

        <div className="mt-8">
          <Button onClick={logout} variant="outline">
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
}
