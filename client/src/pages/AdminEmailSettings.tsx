import { Link } from "wouter";
import { ArrowLeft, Settings2 } from "lucide-react";
import AdminEmailDeliveryManagement from "@/components/AdminEmailDeliveryManagement";

export default function AdminEmailSettings() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col justify-between gap-4 rounded-2xl bg-slate-950 p-6 text-white sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-200"><Settings2 className="h-4 w-4" /> Supervision des remises</div>
            <h1 className="mt-2 text-2xl font-bold">Paramètres d’alertes e-mail</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">Configurez les seuils par conseiller et suivez les incidents de remise sans exposer les informations sensibles.</p>
          </div>
          <Link href="/admin/emails" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"><ArrowLeft className="h-4 w-4" /> Centre e-mail</Link>
        </div>
        <AdminEmailDeliveryManagement />
      </div>
    </main>
  );
}
