import { ExternalLink, ReceiptText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { isProofFor } from "@shared/paymentProof";

/**
 * Preuves de paiement envoyées par le client pour cette référence (dossier ou réservation), à consulter avant de valider.
 * Une preuve n'est pas un paiement : l'administrateur vérifie la réception (relevé, Mobile Money, comptoir) puis valide lui-même.
 */
export default function AdminPaymentProofBadge({ sessionToken, reference }: { sessionToken: string; reference: string }) {
  const query = trpc.paymentProofs.listForAdmin.useQuery({ sessionToken }, { enabled: Boolean(sessionToken) && Boolean(reference), staleTime: 60_000, retry: 1 });
  const proofs = (query.data?.items ?? []).filter((item) => isProofFor(item.fileName, reference));
  if (query.isLoading) return null;
  if (proofs.length === 0) return <span className="mt-1 block text-[11px] text-slate-400" data-testid="proof-none">Aucune preuve reçue</span>;
  return (
    <span className="mt-1 flex flex-wrap gap-1.5" data-testid="proof-list">
      {proofs.map((proof) => (
        proof.url ? (
          <a key={proof.id} href={proof.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100" data-testid="proof-link" title={`Envoyée le ${new Date(proof.uploadedAt).toLocaleString("fr-FR")}`}>
            <ReceiptText className="h-3 w-3" aria-hidden="true" />Preuve reçue {new Date(proof.uploadedAt).toLocaleDateString("fr-FR")}<ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ) : (
          <span key={proof.id} className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600"><ReceiptText className="h-3 w-3" aria-hidden="true" />Preuve reçue (lien indisponible)</span>
        )
      ))}
    </span>
  );
}
