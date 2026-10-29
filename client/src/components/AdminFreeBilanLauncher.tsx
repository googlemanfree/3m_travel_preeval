import { lazy, Suspense, useState } from "react";
import { PenLine } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const EvaluationDeliveryEditor = lazy(() => import("@/components/EvaluationDeliveryEditor").then(({ EvaluationDeliveryEditor: Editor }) => ({ default: Editor })));

/**
 * Entrée directe vers l'éditeur du bilan saisi (ou collé) : validation et envoi à l'espace client et par e-mail.
 * Placé sur chaque évaluation de la liste « automatique » pour qu'un administrateur n'ait jamais à chercher où saisir SON bilan.
 */
export function AdminFreeBilanLauncher({ sessionToken, email, fullName }: { sessionToken: string; email: string; fullName?: string | null }) {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const launch = async () => {
    if (!sessionToken) { toast({ title: "Session administrateur introuvable", description: "Reconnectez-vous à l'espace admin puis réessayez.", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const found = await utils.adminOps.adminCandidateByEmail.fetch({ sessionToken, email });
      if (!found) {
        toast({ title: "Aucun compte candidat pour cette adresse", description: `${fullName ?? "Cette personne"} n'a pas de compte : le bilan se saisit depuis son pré-dossier agence, ou après la création de son compte.`, variant: "destructive" });
        return;
      }
      setCandidateId(found.id);
      setOpen(true);
    } catch (error) {
      toast({ title: "Ouverture impossible", description: error instanceof Error ? error.message : "Réessayez dans quelques instants.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button type="button" size="sm" className="gap-1 bg-emerald-700 text-white hover:bg-emerald-800" disabled={busy} onClick={() => { void launch(); }} data-testid="open-free-bilan">
        <PenLine className="h-3.5 w-3.5" aria-hidden="true" />{busy ? "Ouverture…" : "Saisir et envoyer mon bilan"}
      </Button>
      {candidateId !== null && (
        <Suspense fallback={null}>
          <EvaluationDeliveryEditor sessionToken={sessionToken} sourceRecordId={candidateId} sourceType="candidate" open={open} onOpenChange={setOpen} onCompleted={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
