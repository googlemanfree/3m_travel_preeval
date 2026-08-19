import { ArrowLeftRight, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PUBLIC_DESTINATION_DETAILS } from "@/lib/publicDestinationCatalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SavedDestinationComparisonsPanel() {
  const utils = trpc.useUtils();
  const comparisonsQuery = trpc.candidate.listSavedDestinationComparisons.useQuery(undefined, { refetchOnWindowFocus: false });
  const removeMutation = trpc.candidate.removeSavedDestinationComparison.useMutation({
    onSuccess: async () => {
      await utils.candidate.listSavedDestinationComparisons.invalidate();
      toast.success("Comparaison supprimée");
    },
    onError: (error) => toast.error("Suppression impossible", { description: error.message }),
  });
  const detailsById = new Map(PUBLIC_DESTINATION_DETAILS.map((detail) => [detail.procedure.id, detail]));

  return (
    <Card className="border-blue-100 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-slate-900"><ArrowLeftRight className="h-5 w-5 text-blue-700" />Mes comparaisons de destinations</CardTitle>
        <p className="text-sm text-slate-600">Retrouvez les exigences et repères que vous avez choisi de comparer.</p>
      </CardHeader>
      <CardContent>
        {comparisonsQuery.isLoading ? <div className="flex items-center gap-2 py-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Chargement de vos comparaisons…</div> : null}
        {!comparisonsQuery.isLoading && (comparisonsQuery.data ?? []).length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">Aucune comparaison sauvegardée. Ouvrez une fiche destination pour comparer et enregistrer deux destinations.</p> : null}
        <div className="space-y-3">
          {(comparisonsQuery.data ?? []).map((comparison) => {
            const primary = detailsById.get(comparison.primaryDestinationId);
            const secondary = detailsById.get(comparison.secondaryDestinationId);
            if (!primary || !secondary) return null;
            return (
              <div key={comparison.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{primary.procedure.flag} {primary.procedure.name} <span className="mx-1 text-slate-400">vs</span> {secondary.procedure.flag} {secondary.procedure.name}</p>
                  <p className="mt-1 text-xs text-slate-500">Enregistrée le {new Date(comparison.updatedAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline"><a href={`/destinations/${primary.procedure.id}`}><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Voir</a></Button>
                  <Button size="sm" variant="outline" className="text-rose-700 hover:text-rose-800" onClick={() => removeMutation.mutate({ id: comparison.id })} disabled={removeMutation.isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
