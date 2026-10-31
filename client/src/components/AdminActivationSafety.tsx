import { useEffect, useState } from "react";
import { RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ScanRows = inferRouterOutputs<AppRouter>["activationSafety"]["scan"]["rows"];
type SearchRows = inferRouterOutputs<AppRouter>["activationSafety"]["searchActive"];

const STATUS_LABELS: Record<string, string> = { documents: "Documents", traitement: "Traitement", soumis: "Soumis", approuve: "Approuvé", refuse: "Refusé" };

/**
 * Activations à contrôler : dossiers ouverts sans preuve de paiement, désactivation (le compte repasse en pré-compte, rien n'est
 * supprimé) et annulation d'une désactivation. Un dossier ne se rouvre que si la preuve de paiement existe.
 */
export function AdminActivationSafety({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const guardStatus = trpc.activationSafety.status.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false, refetchInterval: 30_000 });
  const scan = trpc.activationSafety.scan.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [reason, setReason] = useState("Activation sans preuve de paiement");
  const [confirmation, setConfirmation] = useState("");
  const [search, setSearch] = useState("");
  const [manualReason, setManualReason] = useState("");
  const rows = (scan.data?.rows ?? []) as ScanRows;
  const found = trpc.activationSafety.searchActive.useQuery({ sessionToken, search }, { enabled: Boolean(sessionToken) && search.trim().length >= 2, retry: false });
  const refresh = () => { void utils.activationSafety.scan.invalidate(); void utils.activationSafety.searchActive.invalidate(); void utils.activationSafety.status.invalidate(); };

  useEffect(() => {
    setSelected(new Set(rows.filter((row) => row.suggested).map((row) => row.candidateId)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan.data]);

  const bulk = trpc.activationSafety.deactivateMany.useMutation({
    onSuccess: (result) => { toast.success(`${result.deactivated} dossier(s) repassé(s) en pré-compte${result.skipped.length ? ` · ${result.skipped.length} ignoré(s)` : ""}`); setConfirmation(""); refresh(); },
    onError: (error) => toast.error(error.message || "Désactivation impossible."),
  });
  const one = trpc.activationSafety.deactivate.useMutation({
    onSuccess: (result) => { toast.success(result.pending ? "Demande envoyée au super administrateur pour validation" : "Dossier repassé en pré-compte"); setManualReason(""); void utils.activationSafety.requests.invalidate(); refresh(); },
    onError: (error) => toast.error(error.message || "Désactivation impossible."),
  });
  const requests = trpc.activationSafety.requests.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const decide = trpc.activationSafety.decideRequest.useMutation({
    onSuccess: (_result, variables) => { toast.success((variables as { decision?: string } | undefined)?.decision === "approve" ? "Désactivation approuvée et exécutée" : "Demande refusée"); void utils.activationSafety.requests.invalidate(); refresh(); },
    onError: (error) => toast.error(error.message || "Décision impossible."),
  });
  const undo = trpc.activationSafety.reactivate.useMutation({
    onSuccess: () => { toast.success("Désactivation annulée : dossier de nouveau actif"); refresh(); },
    onError: (error) => toast.error(error.message || "Réactivation impossible."),
  });

  const toggle = (id: number) => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const canBulk = selected.size > 0 && reason.trim().length >= 5 && confirmation === "DESACTIVER" && !bulk.isPending;
  const guardState = guardStatus.data?.state ?? (guardStatus.isLoading ? "not_run" : "unavailable");
  const guardStateLabel = {
    not_run: "En attente du premier contrôle",
    operational: "Opérationnel",
    degraded: "À surveiller",
    unavailable: "Connexion indisponible",
    disabled: "Désactivé par configuration",
  }[guardState];
  const guardStateClass = {
    not_run: "bg-slate-100 text-slate-700",
    operational: "bg-emerald-100 text-emerald-800",
    degraded: "bg-amber-100 text-amber-900",
    unavailable: "bg-rose-100 text-rose-800",
    disabled: "bg-slate-200 text-slate-700",
  }[guardState];

  return (
    <div className="space-y-6" data-testid="admin-activation-safety">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" data-testid="activation-guard-status">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Supervision automatique</p>
            <h2 className="mt-1 text-base font-black text-slate-950">Contrôle des activations sans preuve</h2>
            <p className="mt-1 text-sm text-slate-600">Le contrôle est lancé au démarrage puis régulièrement. Il remet un dossier en pré-compte seulement selon les règles de preuve existantes.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${guardStateClass}`}>{guardStateLabel}</span>
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Dernier passage</p><p className="mt-1 font-semibold text-slate-900">{guardStatus.data?.checkedAt ? new Date(guardStatus.data.checkedAt).toLocaleString("fr-FR") : "Pas encore exécuté"}</p></div>
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Comptes contrôlés</p><p className="mt-1 font-semibold text-slate-900">{guardStatus.data?.scanned ?? "—"}</p></div>
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">À vérifier</p><p className="mt-1 font-semibold text-amber-800">{guardStatus.data?.review ?? "—"}</p></div>
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Repassés en pré-compte</p><p className="mt-1 font-semibold text-slate-900">{guardStatus.data?.removed ?? "—"}</p></div>
        </div>
        {guardStatus.data?.lastError && <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">{guardStatus.data.lastError} Réessayez après le rétablissement de la connexion.</p>}
        {guardStatus.error && <p className="mt-3 text-sm text-rose-700" role="alert">Le statut de supervision est momentanément indisponible.</p>}
      </section>
      <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
        <h2 className="flex items-center gap-2 text-base font-black text-amber-950"><ShieldAlert className="h-5 w-5" aria-hidden="true" />Dossiers activés sans preuve de paiement</h2>
        <p className="mt-1 text-sm text-amber-950">
          Un dossier ne peut plus s'ouvrir sans preuve de paiement (photo ou vidéo de la facture, paiement en ligne validé ou paiement agence confirmé). Les comptes ci-dessous sont déjà
          activés mais aucune preuve n'a été retrouvée. Les désactiver les remet en pré-compte : rien n'est supprimé et chacun peut être rétabli.
        </p>
        {scan.isLoading && <p className="mt-3 text-sm text-slate-700">Contrôle en cours…</p>}
        {scan.error && <p className="mt-3 text-sm text-rose-700" role="alert">{scan.error.message}</p>}
        {scan.data && rows.length === 0 && <p className="mt-3 text-sm font-semibold text-emerald-800" data-testid="activation-safety-clean">Aucun dossier activé sans preuve ({scan.data.scanned} contrôlés).</p>}
        {rows.length > 0 && (
          <>
            <p className="mt-3 text-sm font-semibold text-slate-900">{rows.length} dossier(s) sans preuve sur {scan.data?.scanned} contrôlés · {selected.size} sélectionné(s)</p>
            <ul className="mt-2 divide-y divide-amber-200 rounded-lg border border-amber-200 bg-white">
              {rows.map((row) => (
                <li key={row.candidateId} className="flex items-start gap-3 p-3 text-sm" data-testid={`activation-row-${row.candidateId}`}>
                  <input type="checkbox" className="mt-1 h-5 w-5" checked={selected.has(row.candidateId)} onChange={() => toggle(row.candidateId)} aria-label={`Sélectionner ${row.fullName}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">{row.fullName} <span className="font-normal text-slate-500">· {row.email}</span></p>
                    <p className="text-xs text-slate-600">{row.activeDossierNumber ?? `COMPTE-${String(row.candidateId).padStart(5, "0")}`} · statut « {STATUS_LABELS[row.dossierStatus] ?? row.dossierStatus} »{row.activatedAt ? ` · activé le ${new Date(row.activatedAt).toLocaleDateString("fr-FR")}` : ""}</p>
                    <p className="mt-1 flex flex-wrap gap-1 text-[11px] font-semibold">
                      {row.autoActivated && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-800">Activation automatique</span>}
                      {row.evidence.agencyPaidWithoutLog && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">Marqué payé en agence, sans journal : à vérifier</span>}
                      {!row.suggested && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">Non coché d'office</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-800">Motif (enregistré dans l'historique)
                <Input className="mt-1" value={reason} onChange={(event) => setReason(event.target.value)} />
              </label>
              <label className="text-xs font-semibold text-slate-800">Tapez DESACTIVER pour confirmer
                <Input className="mt-1" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} data-testid="activation-confirmation" />
              </label>
            </div>
            <Button type="button" className="mt-3 h-11 bg-rose-700 text-white hover:bg-rose-800" disabled={!canBulk} data-testid="activation-deactivate-selected"
              onClick={() => bulk.mutate({ sessionToken, candidateIds: Array.from(selected), reason: reason.trim(), confirmation: "DESACTIVER" })}>
              Désactiver la sélection ({selected.size})
            </Button>
          </>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-black text-slate-950">Désactiver ou rétablir un dossier</h2>
        <p className="mt-1 text-sm text-slate-700">Cherchez un compte activé. « Désactiver » le remet en pré-compte ; « Annuler la désactivation » le rétablit (possible seulement si la preuve de paiement existe).</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom ou e-mail du candidat" aria-label="Rechercher un compte activé" data-testid="activation-search" />
          <Input value={manualReason} onChange={(event) => setManualReason(event.target.value)} placeholder="Motif de la désactivation (5 caractères min.)" aria-label="Motif" />
        </div>
        {found.error && <p className="mt-2 text-sm text-rose-700" role="alert">{found.error.message}</p>}
        <ul className="mt-3 space-y-2">
          {((found.data ?? []) as SearchRows).map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm" data-testid={`activation-found-${row.id}`}>
              <div>
                <p className="font-bold text-slate-900">{row.fullName} <span className="font-normal text-slate-500">· {row.email}</span></p>
                <p className="text-xs text-slate-600">{row.activeDossierNumber ?? `COMPTE-${String(row.id).padStart(5, "0")}`} · {row.evidenceOk ? "preuve de paiement trouvée" : "AUCUNE preuve de paiement"}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" disabled={manualReason.trim().length < 5 || one.isPending} onClick={() => one.mutate({ sessionToken, candidateId: row.id, reason: manualReason.trim() })}>Désactiver</Button>
              </div>
            </li>
          ))}
        </ul>
        {requests.data && requests.data.items.length > 0 && (
          <div className="mt-4 rounded-lg border border-slate-200 p-3" data-testid="activation-requests">
            <p className="text-sm font-semibold text-slate-900">Demandes de désactivation{requests.data.isSuper ? "" : " (vos demandes sont validées par le super administrateur)"}</p>
            <ul className="mt-2 space-y-2">
              {requests.data.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm" data-testid={`activation-request-${item.id}`}>
                  <span><strong>{item.candidateName}</strong> — {item.reason} <span className="text-xs text-slate-500">· {item.requestedBy} · {item.status === "pending" ? "en attente" : item.status === "approved" ? `approuvée par ${item.decidedBy}` : `refusée par ${item.decidedBy}`}</span></span>
                  {item.status === "pending" && requests.data.isSuper && (
                    <span className="flex gap-2">
                      <Button type="button" size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ sessionToken, id: item.id, decision: "approve", note: null })}>Approuver</Button>
                      <Button type="button" size="sm" variant="outline" disabled={decide.isPending} onClick={() => decide.mutate({ sessionToken, id: item.id, decision: "reject", note: null })}>Refuser</Button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <UndoList onUndo={(candidateId) => undo.mutate({ sessionToken, candidateId })} pending={undo.isPending} />
      </section>
    </div>
  );
}

/** Rétablir un compte désactivé : recherche parmi les comptes repassés en pré-compte. */
function UndoList({ onUndo, pending }: { onUndo: (candidateId: number) => void; pending: boolean }) {
  const [id, setId] = useState("");
  const candidateId = Number(id);
  return (
    <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><RotateCcw className="h-4 w-4" aria-hidden="true" />Annuler une désactivation</p>
      <p className="mt-1 text-xs text-slate-600">Entrez le numéro du compte (COMPTE-00012 → 12). Le dossier est rétabli tel qu'il était, si la preuve de paiement existe.</p>
      <div className="mt-2 flex gap-2">
        <Input value={id} onChange={(event) => setId(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Numéro du compte" aria-label="Numéro du compte à rétablir" data-testid="activation-undo-id" />
        <Button type="button" variant="outline" disabled={!Number.isInteger(candidateId) || candidateId <= 0 || pending} onClick={() => onUndo(candidateId)} data-testid="activation-undo">Rétablir</Button>
      </div>
    </div>
  );
}
