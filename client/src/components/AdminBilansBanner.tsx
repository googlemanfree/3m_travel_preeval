import { getAdminSessionToken } from "@/lib/adminSession";
import { trpc } from "@/lib/trpc";

/** Bandeau du tableau de bord : n'apparaît que si le bilan automatisé est activé ; pastille = bilans prêts à valider. */
export default function AdminBilansBanner() {
  const sessionToken = getAdminSessionToken();
  const query = trpc.adminBilanAuto.list.useQuery({ sessionToken, filter: "pret" }, { enabled: Boolean(sessionToken), retry: false, staleTime: 60_000, refetchInterval: 120_000 });
  if (!query.data || !query.data.enabled) return null;
  const counts = query.data.counts as Record<string, number>;
  const ready = counts.pret ?? 0;
  const incidents = counts.incident ?? 0;
  return (
    <div className="mb-4 flex flex-col justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center" data-testid="bilans-banner">
      <div>
        <p className="font-black text-emerald-950">Bilans automatisés</p>
        <p className="text-sm text-emerald-800">{ready > 0 ? `${ready} bilan(s) prêt(s) à valider avant publication.` : "Aucun bilan en attente de validation."}{incidents > 0 ? ` ${incidents} incident(s) à reprendre.` : ""}</p>
      </div>
      <a href="/admin/bilans" className="relative inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-black text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
        Ouvrir la supervision
        {ready > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-black text-amber-950">{ready}</span>}
      </a>
    </div>
  );
}
