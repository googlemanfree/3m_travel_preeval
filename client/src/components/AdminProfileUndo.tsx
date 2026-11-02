import React, { useState } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { MIN_REASON_LENGTH, RESET_CONFIRMATION, type UndoAction } from "@shared/profileUndo";
import { Button } from "@/components/ui/button";

/**
 * Annuler une étape ou réinitialiser un profil. Seules les annulations réellement possibles pour ce compte sont proposées ; chacune demande un motif,
 * la réinitialisation demande en plus de taper REINITIALISER (super administrateur). Le bilan envoyé, les pièces, les messages et les paiements sont conservés.
 */
export function AdminProfileUndo({ sessionToken, candidateId }: { sessionToken: string; candidateId: number }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<UndoAction | null>(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const query = trpc.profileUndo.options.useQuery({ sessionToken, candidateId }, { enabled: open && candidateId > 0, retry: false, refetchOnWindowFocus: false });
  const run = trpc.profileUndo.run.useMutation({
    onSuccess: (result) => {
      toast.success(result.message);
      setSelected(null); setReason(""); setConfirmation("");
      void query.refetch();
      void utils.admin.getCandidateDetails.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  if (candidateId <= 0 || Number.isNaN(candidateId)) return null;
  const options = query.data?.options ?? [];
  const chosen = options.find((option) => option.action === selected) ?? null;
  const ready = Boolean(chosen) && reason.trim().length >= MIN_REASON_LENGTH && (selected !== "reset_profile" || confirmation.trim() === RESET_CONFIRMATION);
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3" data-testid="profile-undo">
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen((value) => !value)} aria-expanded={open} data-testid="profile-undo-toggle"><Undo2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Annuler une étape / Réinitialiser</Button>
      {open && (
        <div className="mt-3 space-y-2">
          {query.isLoading && <p className="text-sm text-slate-500">Chargement…</p>}
          {query.error && <p className="text-sm text-rose-700" role="alert">{query.error.message}</p>}
          {options.map((option) => (
            <div key={option.action} className={`rounded-lg border p-2 ${selected === option.action ? "border-blue-400 bg-blue-50" : "border-slate-200"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">{option.label}{option.superAdminOnly ? " (super administrateur)" : ""}</p><p className="text-xs text-slate-600">{option.description}</p></div>
                <Button type="button" size="sm" variant={option.danger ? "destructive" : "outline"} onClick={() => setSelected(selected === option.action ? null : option.action)} data-testid={`undo-pick-${option.action}`}>{selected === option.action ? "Fermer" : option.action === "reset_profile" ? <><RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Réinitialiser</> : "Annuler"}</Button>
              </div>
            </div>
          ))}
          {chosen && (
            <div className="space-y-2 rounded-lg border border-slate-300 bg-slate-50 p-3" data-testid="undo-form">
              <label className="block text-xs font-semibold text-slate-700">Motif (obligatoire, {MIN_REASON_LENGTH} caractères au moins)
                <textarea className="mt-1 min-h-16 w-full rounded-md border border-slate-300 p-2 text-sm" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} data-testid="undo-reason" />
              </label>
              {selected === "reset_profile" && (
                <label className="block text-xs font-semibold text-slate-700">Pour confirmer, tapez {RESET_CONFIRMATION}
                  <input className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-sm" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} data-testid="undo-confirmation" autoComplete="off" />
                </label>
              )}
              <Button type="button" size="sm" disabled={!ready || run.isPending} onClick={() => selected && run.mutate({ sessionToken, candidateId, action: selected, reason: reason.trim(), confirmation: confirmation.trim() || null })} data-testid="undo-confirm">{run.isPending ? "En cours…" : `Confirmer : ${chosen.label}`}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
