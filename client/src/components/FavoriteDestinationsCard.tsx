import React, { useEffect, useState } from "react";
import { Heart, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import CountryFlag from "@/components/CountryFlag";
import {
  CANDIDATE_DESTINATION_OPTIONS,
  MAX_PREFERRED_DESTINATIONS,
  coarseCategoryForPreferredDestinations,
  type CoarseDestinationCategory,
} from "@shared/candidateDestinationOptions";

const destinationsByRegion = CANDIDATE_DESTINATION_OPTIONS.reduce<Record<string, typeof CANDIDATE_DESTINATION_OPTIONS>>((acc, option) => {
  if (!acc[option.region]) acc[option.region] = [];
  acc[option.region].push(option);
  return acc;
}, {});

type FavoriteDestinationsCardProps = {
  saved: string[];
  onSaved?: (destination: CoarseDestinationCategory) => void;
};

export default function FavoriteDestinationsCard({ saved, onSaved }: FavoriteDestinationsCardProps) {
  const utils = trpc.useUtils();
  const savedKey = saved.join("|");
  const [selected, setSelected] = useState<string[]>(saved);
  const [baselineKey, setBaselineKey] = useState(savedKey);

  useEffect(() => {
    setSelected(savedKey ? savedKey.split("|") : []);
    setBaselineKey(savedKey);
  }, [savedKey]);

  const isDirty = selected.join("|") !== baselineKey;

  const saveMutation = trpc.candidate.updateProfile.useMutation({
    onSuccess: async (_data, variables) => {
      const savedList = (variables ? variables.preferredDestinations : undefined) ?? [];
      setBaselineKey(savedList.join("|"));
      onSaved?.(coarseCategoryForPreferredDestinations(savedList));
      await utils.candidate.getClientDashboardSummary.invalidate();
      toast.success("Vos destinations favorites ont été enregistrées.");
    },
    onError: (error) => toast.error(error.message || "Impossible d’enregistrer vos destinations pour le moment."),
  });

  const toggle = (name: string) =>
    setSelected((current) => {
      if (current.includes(name)) return current.filter((item) => item !== name);
      if (current.length >= MAX_PREFERRED_DESTINATIONS) return current;
      return [...current, name];
    });

  return (
    <section className="mt-8 border-t border-slate-100 pt-6" aria-labelledby="favorite-destinations-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="favorite-destinations-title" className="flex items-center gap-2 text-base font-black text-slate-900">
            <Heart className="h-4 w-4 text-rose-500" aria-hidden="true" /> Mes destinations favorites
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Choisissez jusqu’à {MAX_PREFERRED_DESTINATIONS} pays. Le premier choisi est votre destination principale : c’est lui qui sert à préparer la liste de documents de votre dossier.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-600" aria-live="polite">{selected.length}/{MAX_PREFERRED_DESTINATIONS} choisies</span>
      </div>

      <div className="mt-4 space-y-4">
        {Object.entries(destinationsByRegion).map(([region, options]) => (
          <div key={region} role="group" aria-label={region}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{region}</p>
            <div className="flex flex-wrap gap-2">
              {options.map((option) => {
                const rank = selected.indexOf(option.name);
                const isSelected = rank !== -1;
                const isLocked = !isSelected && selected.length >= MAX_PREFERRED_DESTINATIONS;
                const tone = isSelected
                  ? "border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100"
                  : isLocked
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-60"
                    : "border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50/60";
                return (
                  <button
                    key={option.name}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={isLocked}
                    onClick={() => toggle(option.name)}
                    className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${tone}`}
                  >
                    <CountryFlag flag={option.flag} />
                    {option.name}
                    {isSelected && (
                      <>
                        {" "}
                        <span className="rounded-full bg-rose-600 px-1.5 text-[10px] font-black uppercase leading-4 text-white">
                          {rank === 0 ? "Principale" : <><span className="sr-only">Choix </span>{rank + 1}</>}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

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
