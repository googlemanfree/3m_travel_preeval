import { useState } from "react";
import { Briefcase, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  sessionToken: string;
  candidateId: string;
  existing?: { employerName?: string | null; positionTitle?: string | null } | null;
  onSaved?: () => void;
};

/**
 * Enregistre l’employeur hors statut dossier (agency_settings).
 * Ne modifie jamais le Kanban d’un dossier actif.
 */
export default function AdminEmployerSelectionPanel({ sessionToken, candidateId, existing, onSaved }: Props) {
  const [employerName, setEmployerName] = useState(existing?.employerName || "");
  const [positionTitle, setPositionTitle] = useState(existing?.positionTitle || "");
  const mutation = trpc.admin.recordEmployerSelection.useMutation({
    onSuccess: (result) => {
      toast.success("Employeur enregistré", { description: result.message });
      onSaved?.();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <section className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-4" data-testid="admin-employer-selection-panel">
      <div className="flex items-start gap-2">
        <Briefcase className="mt-0.5 h-4 w-4 text-cyan-800" />
        <div>
          <h4 className="font-semibold text-slate-950">Sous-étape placement — employeur / partenaire</h4>
          <p className="mt-1 text-sm text-slate-600">
            Enregistrement additif uniquement. Le statut Kanban du dossier actif n’est pas modifié.
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="employer-name">Employeur / partenaire</Label>
          <Input
            id="employer-name"
            className="mt-1 bg-white"
            value={employerName}
            onChange={(event) => setEmployerName(event.target.value)}
            maxLength={255}
            placeholder="Ex. Entreprise partenaire"
          />
        </div>
        <div>
          <Label htmlFor="position-title">Poste / projet retenu</Label>
          <Input
            id="position-title"
            className="mt-1 bg-white"
            value={positionTitle}
            onChange={(event) => setPositionTitle(event.target.value)}
            maxLength={255}
            placeholder="Ex. Aide-soignant"
          />
        </div>
      </div>
      <Button
        type="button"
        className="mt-3 bg-cyan-800 hover:bg-cyan-900"
        disabled={employerName.trim().length < 2 || positionTitle.trim().length < 2 || mutation.isPending}
        onClick={() => mutation.mutate({ sessionToken, candidateId, employerName: employerName.trim(), positionTitle: positionTitle.trim() })}
        data-testid="save-employer-selection"
      >
        {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : "Enregistrer la sélection (sans changer le statut)"}
      </Button>
    </section>
  );
}
