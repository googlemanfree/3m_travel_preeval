import { useState } from "react";
import { BookMarked } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { BILAN_TEMPLATE_PROFILES, BILAN_TEMPLATE_PROFILE_LABELS, type BilanTemplateProfile } from "@shared/adminOps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const guessProfile = (label: string): BilanTemplateProfile => {
  const value = label.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/travail|work|emploi/.test(value)) return "travail";
  if (/etude|study/.test(value)) return "etudes";
  if (/touris|visit|sejour/.test(value)) return "tourisme";
  if (/famil/.test(value)) return "famille";
  return "autre";
};

/**
 * Modèles de bilan versionnés : on enregistre son texte (avec les variables {{montant}}, {{nom}}…) une fois pour toutes, puis on le
 * charge pour chaque candidat. Chaque enregistrement crée une nouvelle version ; les anciennes restent chargeables.
 */
export function BilanTemplatesPanel({ sessionToken, projectKind, currentHtml, disabled = false, onLoad }: { sessionToken: string; projectKind: string; currentHtml: string; disabled?: boolean; onLoad: (html: string) => void }) {
  const utils = trpc.useUtils();
  const [profile, setProfile] = useState<BilanTemplateProfile>(guessProfile(projectKind));
  const [selected, setSelected] = useState<number | null>(null);
  const [name, setName] = useState("");
  const list = trpc.adminOps.adminBilanTemplates.useQuery({ sessionToken, profile }, { enabled: Boolean(sessionToken), retry: false });
  const save = trpc.adminOps.adminSaveBilanTemplate.useMutation({ onSuccess: (result) => { toast.success(`Modèle enregistré (version ${result.version})`); void utils.adminOps.adminBilanTemplates.invalidate(); }, onError: (error) => toast.error(error.message) });
  const archive = trpc.adminOps.adminArchiveBilanTemplate.useMutation({ onSuccess: () => { toast.success("Modèle archivé"); setSelected(null); void utils.adminOps.adminBilanTemplates.invalidate(); }, onError: (error) => toast.error(error.message) });

  const load = async () => {
    if (selected === null) return;
    if (currentHtml.trim() && !window.confirm("Remplacer le bilan en cours par ce modèle ?")) return;
    try {
      const template = await utils.adminOps.adminLoadBilanTemplate.fetch({ sessionToken, id: selected });
      onLoad(template.html);
      toast.success(`Modèle « ${template.name} » (version ${template.version}) chargé : complétez-le, les variables se remplissent seules.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible.");
    }
  };
  const rows = list.data ?? [];

  return (
    <details className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-2" data-testid="bilan-templates">
      <summary className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800"><BookMarked className="h-4 w-4" aria-hidden="true" />Modèles de bilan enregistrés</summary>
      <div className="mt-2 space-y-2">
        <div className="flex flex-wrap gap-2">
          <select className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm" aria-label="Type de projet du modèle" value={profile} onChange={(event) => { setProfile(event.target.value as BilanTemplateProfile); setSelected(null); }}>
            {BILAN_TEMPLATE_PROFILES.map((item) => <option key={item} value={item}>{BILAN_TEMPLATE_PROFILE_LABELS[item]}</option>)}
          </select>
          <select className="h-9 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm" aria-label="Modèle" value={selected ?? ""} onChange={(event) => setSelected(event.target.value ? Number(event.target.value) : null)}>
            <option value="">{rows.length ? "Choisir un modèle…" : "Aucun modèle enregistré pour ce projet"}</option>
            {rows.map((row) => <option key={row.id} value={row.id}>{row.name} — version {row.version} ({new Date(row.createdAt).toLocaleDateString("fr-FR")})</option>)}
          </select>
          <Button type="button" size="sm" disabled={disabled || selected === null} onClick={() => { void load(); }} data-testid="template-load">Charger</Button>
          <Button type="button" size="sm" variant="ghost" disabled={selected === null || archive.isPending} onClick={() => { if (selected !== null && window.confirm("Archiver ce modèle ? Il ne sera plus proposé.")) archive.mutate({ sessionToken, id: selected }); }}>Archiver</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input className="h-9 min-w-0 flex-1" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nom du modèle (ex. Préévaluation travail)" aria-label="Nom du nouveau modèle" />
          <Button type="button" size="sm" variant="outline" disabled={name.trim().length < 3 || currentHtml.trim().length < 20 || save.isPending} onClick={() => save.mutate({ sessionToken, profile, name: name.trim(), html: currentHtml })} data-testid="template-save">Enregistrer le bilan actuel comme modèle</Button>
        </div>
        <p className="text-[11px] text-slate-500">Enregistrer un nom déjà utilisé crée la version suivante ; les versions précédentes restent chargeables.</p>
      </div>
    </details>
  );
}
