import { Link, useLocation } from "wouter";
import { ArrowLeft, Clock3, RotateCcw, Settings2, ShieldOff } from "lucide-react";
import AdminEmailDeliveryManagement from "@/components/AdminEmailDeliveryManagement";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

export default function AdminEmailSettings() {
  const [, navigate] = useLocation();
  const sessionToken = typeof window !== "undefined"
    ? sessionStorage.getItem("adminSessionToken") || localStorage.getItem("adminSessionToken") || undefined
    : undefined;
  const history = trpc.adminAuth.getSessionHistory.useQuery({ sessionToken: sessionToken ?? "" }, { enabled: Boolean(sessionToken), retry: false });
  const revokeAll = trpc.adminAuth.revokeAllSessions.useMutation({
    onSuccess: () => {
      sessionStorage.removeItem("adminSessionToken");
      localStorage.removeItem("adminSessionToken");
      navigate("/admin/login");
    },
  });

  const eventLabel: Record<string, string> = { login: "Connexion", renewed: "Session renouvelée", revoked_all: "Sessions révoquées" };

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
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Clock3 className="h-4 w-4 text-blue-700" /> Continuité de session</div>
              <p className="mt-1 text-sm text-slate-500">Historique des connexions et renouvellements de votre compte. Les jetons ne sont jamais affichés.</p>
            </div>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
              disabled={revokeAll.isPending || !sessionToken}
              onClick={() => {
                if (window.confirm("Révoquer toutes vos sessions actives ? Vous devrez vous reconnecter.")) revokeAll.mutate({ sessionToken: sessionToken! });
              }}
            >
              <ShieldOff className="mr-2 h-4 w-4" /> {revokeAll.isPending ? "Révocation…" : "Révoquer toutes mes sessions"}
            </Button>
          </div>
          {revokeAll.error && <p className="mt-3 text-sm text-red-700">{revokeAll.error.message}</p>}
          <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {history.isLoading ? <p className="p-4 text-sm text-slate-500">Chargement de l’historique…</p> : (history.data ?? []).length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Aucun événement de session récent.</p>
            ) : (history.data ?? []).map(event => (
              <div key={event.id} className="flex items-center justify-between gap-4 p-3 text-sm">
                <span className="font-medium text-slate-800">{eventLabel[event.eventType] ?? event.eventType}</span>
                <span className="text-right text-slate-500">{new Date(event.createdAt).toLocaleString("fr-FR")}{event.expiresAt ? ` · expiration ${new Date(event.expiresAt).toLocaleString("fr-FR")}` : ""}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><RotateCcw className="h-3.5 w-3.5" /> La révocation ferme toutes vos sessions, y compris celle en cours.</p>
        </section>
        <AdminEmailDeliveryManagement />
      </div>
    </main>
  );
}
