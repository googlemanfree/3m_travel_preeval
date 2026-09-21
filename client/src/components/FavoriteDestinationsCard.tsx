import React, { useEffect, useState } from "react";
import { Heart, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { DestinationPicker } from "@/components/CountryPicker";
import {
  MAX_PREFERRED_DESTINATIONS,
  coarseCategoryForPreferredDestinations,
  getCandidateDestinationOption,
  normalizeCandidateDestinations,
  type CoarseDestinationCategory,
} from "@shared/candidateDestinationOptions";

type FavoriteDestinationsCardProps = {
  saved: string[];
  onSaved?: (destination: CoarseDestinationCategory) => void;
};

export default function FavoriteDestinationsCard({ saved, onSaved }: FavoriteDestinationsCardProps) {
  const utils = trpc.useUtils();
  const savedList = normalizeCandidateDestinations(saved).destinations;
  const savedKey = savedList.join("|");
  const [selected, setSelected] = useState<string[]>(savedList);
  const [baselineKey, setBaselineKey] = useState(savedKey);

  useEffect(() => {
    setSelected(savedKey ? savedKey.split("|") : []);
    setBaselineKey(savedKey);
  }, [savedKey]);

  const isDirty = selected.join("|") !== baselineKey;
  const primary = selected[0] ? getCandidateDestinationOption(selected[0]) : undefined;

  const saveMutation = trpc.candidate.updateProfile.useMutation({
    onSuccess: async (_data, variables) => {
      const persisted = (variables ? variables.preferredDestinations : undefined) ?? [];
      setBaselineKey(persisted.join("|"));
      onSaved?.(coarseCategoryForPreferredDestinations(persisted));
      await utils.candidate.getClientDashboardSummary.invalidate();
      toast.success("Vos destinations favorites ont été enregistrées.");
    },
    onError: (error) => toast.error(error.message || "Impossible d’enregistrer vos destinations pour le moment."),
  });

  return (
    <section className="mt-8 border-t border-slate-100 pt-6" aria-labelledby="favorite-destinations-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="favorite-destinations-title" className="flex items-center gap-2 text-base font-black text-slate-900">
            <Heart className="h-4 w-4 text-rose-500" aria-hidden="true" /> Mes destinations favorites
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Choisissez jusqu’à {MAX_PREFERRED_DESTINATIONS} pays, parmi tous les pays du monde. Le premier choisi est votre destination principale : c’est lui qui sert à préparer la liste de documents de votre dossier.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-600" aria-live="polite">{selected.length}/{MAX_PREFERRED_DESTINATIONS} choisies</span>
      </div>

      <div className="mt-4 max-w-2xl">
        <DestinationPicker id="favorite-destinations" value={selected} onChange={setSelected} />
      </div>

      {primary && (
        <p className={`mt-3 max-w-2xl rounded-lg border px-3 py-2 text-xs leading-5 ${primary.hasGuide ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
          {primary.hasGuide
            ? `Guide 3M disponible pour ${primary.name} : liste de documents et étapes propres à ce pays.`
            : `Pas encore de guide détaillé pour ${primary.name} : un conseiller étudie votre projet avec vous et complète votre parcours.`}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => saveMutation.mutate({ preferredDestinations: selected })}
          disabled={!isDirty || selected.length === 0 || saveMutation.isPending}
          className="h-11 rounded-xl bg-rose-600 px-5 hover:bg-rose-700"
        >
          {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="mr-2 h-4 w-4" aria-hidden="true" />}
          {saveMutation.isPending ? "Enregistrement…" : "Enregistrer mes destinations"}
        </Button>
        {selected.length === 0 && <p className="text-xs font-medium text-rose-700">Choisissez au moins une destination.</p>}
        {isDirty && selected.length > 0 && <p className="text-xs text-slate-500">Modifications non enregistrées.</p>}
      </div>
    </section>
  );
}
