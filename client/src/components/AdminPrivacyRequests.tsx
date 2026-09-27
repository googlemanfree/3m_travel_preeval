import { useState } from "react";
import { ChevronDown, ChevronRight, ShieldQuestion } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc";

/**
 * Demandes de suppression de compte en attente. Traiter une demande ici n'efface rien automatiquement : c'est à
 * l'administrateur de vérifier les dossiers en cours et les obligations de conservation, puis de supprimer réellement
 * ce qui doit l'être, avant de clore la demande avec une réponse pour le candidat.
 */
export default function AdminPrivacyRequests({ sessionToken }: { sessionToken: string }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const query = trpc.candidatePrivacy.listDeletionRequests.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const resolve = trpc.candidatePrivacy.resolveDeletionRequest.useMutation({
    onSuccess: (result) => { void utils.candidatePrivacy.listDeletionRequests.invalidate(); toast({ title: result.alreadyHandled ? "Déjà traitée" : "Demande traitée", description: result.notified ? "Le candidat a été prévenu par e-mail." : "Le candidat n’a pas pu être prévenu par e-mail : contactez-le." }); },
    onError: (error) => toast({ title: "Action impossible", description: error.message, variant: "destructive" }),
  });
  const requests = query.data ?? [];

  return (
    <Card className="border border-slate-200 bg-white p-5 shadow-sm" data-testid="admin-privacy-requests">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black text-slate-950"><ShieldQuestion className="h-4 w-4 text-blue-700" aria-hidden="true" />Demandes de suppression de compte</h2>
          <p className="mt-1 text-sm text-slate-600" data-testid="privacy-summary">{query.isLoading ? "Chargement…" : query.error ? "Liste indisponible pour le moment." : requests.length > 0 ? `${requests.length} demande${requests.length > 1 ? "s" : ""} en attente.` : "Aucune demande en attente."}</p>
        </div>
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />}
      </button>

      {open && (
        <ul className="mt-3 divide-y divide-slate-100">
          {requests.map((request) => (
            <li key={request.candidateId} className="py-3" data-testid="privacy-request-row">
              <p className="text-sm font-bold text-slate-900">{request.fullName} <span className="ml-2 font-normal text-slate-500">{request.email}</span></p>
              <p className="text-xs text-slate-500">Demandé le {new Date(request.requestedAt).toLocaleString("fr-FR")}</p>
              <button
                type="button"
                disabled={resolve.isPending}
                onClick={() => {
                  const note = window.prompt("Vérifiez d'abord les dossiers en cours, puis supprimez réellement ce qui doit l'être. Réponse à envoyer au candidat (laissez vide pour simplement clore) :") ?? null;
                  if (note !== null) resolve.mutate({ sessionToken, candidateId: request.candidateId, note });
                }}
                className="mt-2 min-h-10 rounded-lg bg-slate-900 px-3 text-xs font-black text-white disabled:opacity-60"
                data-testid="resolve-privacy-request"
              >
                Marquer comme traitée
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
