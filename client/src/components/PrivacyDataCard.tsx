import { useState } from "react";
import { toast } from "sonner";
import { Download, ShieldQuestion, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

/**
 * Mes données personnelles : exporter ses propres données (portabilité) et demander la suppression du compte.
 * La demande de suppression ne supprime rien elle-même : un conseiller vérifie d'abord les dossiers en cours et les
 * obligations de conservation avant toute suppression réelle, et revient vers le candidat pour confirmer.
 */
export default function PrivacyDataCard() {
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const utils = trpc.useUtils();
  const [exporting, setExporting] = useState(false);
  const requestDeletion = trpc.candidatePrivacy.requestDeletion.useMutation({
    onSuccess: (result) => { setConfirmingDeletion(false); toast.success(result.alreadyPending ? "Une demande était déjà en cours : un conseiller vous répond au plus vite." : "Demande envoyée. Un conseiller vous recontacte pour confirmer."); },
    onError: (error) => toast.error(error.message),
  });

  const download = async () => {
    setExporting(true);
    try {
      const data = await utils.candidatePrivacy.myDataExport.fetch();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mes-donnees-3m-travel-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Téléchargement lancé.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Téléchargement impossible.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="border-slate-200 p-5" data-testid="privacy-data-card">
      <h2 className="flex items-center gap-2 text-base font-black text-slate-950"><ShieldQuestion className="h-4 w-4 text-blue-700" aria-hidden="true" />Mes données personnelles</h2>
      <p className="mt-1 text-sm text-slate-600">Téléchargez les données que nous conservons vous concernant, ou demandez la suppression de votre compte.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={exporting} onClick={download} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-60" data-testid="download-my-data">
          <Download className="h-4 w-4" aria-hidden="true" />{exporting ? "Préparation…" : "Télécharger mes données"}
        </button>
        {!confirmingDeletion ? (
          <button type="button" onClick={() => setConfirmingDeletion(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-black text-rose-700 hover:bg-rose-50" data-testid="ask-deletion">
            <Trash2 className="h-4 w-4" aria-hidden="true" />Demander la suppression de mon compte
          </button>
        ) : (
          <div className="w-full rounded-xl border border-rose-200 bg-rose-50 p-3" data-testid="deletion-confirm">
            <p className="text-sm text-rose-900">Un conseiller vérifiera d'abord vos dossiers en cours avant toute suppression. Confirmez-vous votre demande ?</p>
            <div className="mt-2 flex gap-2">
              <button type="button" disabled={requestDeletion.isPending} onClick={() => requestDeletion.mutate()} className="min-h-10 rounded-lg bg-rose-700 px-3 text-xs font-black text-white disabled:opacity-60" data-testid="confirm-deletion">{requestDeletion.isPending ? "Envoi…" : "Confirmer la demande"}</button>
              <button type="button" onClick={() => setConfirmingDeletion(false)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-black text-slate-800" data-testid="cancel-deletion">Annuler</button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
