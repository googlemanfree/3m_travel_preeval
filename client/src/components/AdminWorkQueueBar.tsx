import { trpc } from "@/lib/trpc";

type Props = {
  sessionToken: string;
  /** Ouvre la section de l'administration où traiter ce compteur. */
  onGo: (tab: string) => void;
};

/**
 * Poste de travail du jour : ce qui attend un administrateur, en un coup d'œil, avec un clic vers la section concernée.
 * Les compteurs se mettent à jour d'eux-mêmes (toutes les minutes, onglet visible).
 */
export function AdminWorkQueueBar({ sessionToken, onGo }: Props) {
  const enabled = Boolean(sessionToken);
  const queue = trpc.adminOps.adminWorkQueue.useQuery({ sessionToken }, { enabled, retry: false, refetchInterval: 60_000, refetchIntervalInBackground: false });
  const desk = trpc.adminCandidateManagement.contractsReceiptsDesk.useQuery({ sessionToken }, { enabled, retry: false, staleTime: 60_000, refetchInterval: 120_000, refetchIntervalInBackground: false });

  const items = [
    { id: "late-bilans", label: "Bilans à faire depuis plus de 24 h", count: queue.data?.lateBilans, tab: "evaluation-review" },
    { id: "unseen-bilans", label: "Bilans non consultés (plus de 24 h)", count: queue.data?.unseenBilans, tab: "evaluation-reminders" },
    { id: "payments", label: "Paiements à confirmer", count: queue.data?.paymentsToConfirm, tab: "payments" },
    { id: "receipts", label: "Reçus à préparer", count: desk.data?.counts.receiptPending, tab: "payments" },
    { id: "protocols", label: "Protocoles à signer", count: desk.data?.counts.protocolPending, tab: "payments" },
  ];
  const loaded = items.filter((item) => typeof item.count === "number");
  const total = loaded.reduce((sum, item) => sum + (item.count ?? 0), 0);

  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="Poste de travail du jour" data-testid="work-queue">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-black text-slate-950">Poste de travail du jour</h2>
        <p className="text-xs text-slate-500" role="status">
          {queue.isError ? "Compteurs indisponibles pour le moment." : loaded.length === 0 ? "Chargement…" : total === 0 ? "Tout est à jour." : `${total} élément(s) en attente`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const count = item.count;
          const pending = typeof count === "number" && count > 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onGo(item.tab)}
              data-testid={`work-queue-${item.id}`}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${pending ? "border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100" : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"}`}
            >
              <span className={`min-w-[1.75rem] rounded-full px-2 py-0.5 text-center text-xs font-black ${pending ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"}`}>{typeof count === "number" ? count : "…"}</span>
              {item.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
