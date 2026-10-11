import { FileText, Loader2, Printer, RefreshCw, Send, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STAGE_LABELS = {
  receipt_pending: { label: "Reçu à préparer", className: "border-amber-200 bg-amber-50 text-amber-900" },
  protocol_pending: { label: "Protocole à signer", className: "border-blue-200 bg-blue-50 text-blue-900" },
  complete: { label: "Complet", className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
} as const;

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

type Props = {
  sessionToken: string;
  /** Ouvre la fiche 360 / détail candidat sans modifier le dossier. */
  onOpenCandidate?: (candidateId: string) => void;
};

export default function AdminContractsReceiptsDesk({ sessionToken, onOpenCandidate }: Props) {
  const utils = trpc.useUtils();
  const query = trpc.adminCandidateManagement.contractsReceiptsDesk.useQuery(
    { sessionToken },
    { enabled: Boolean(sessionToken), refetchInterval: 45_000 },
  );

  const approveMutation = trpc.adminCandidateManagement.approvePaymentReceipt.useMutation({
    onSuccess: (result) => {
      toast.success(`Reçu signé pour ${result.dossierNumber}`);
      void query.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const sendMutation = trpc.adminCandidateManagement.sendPaymentReceiptForCandidate.useMutation({
    onSuccess: (result) => {
      toast.success(`Reçu PDF envoyé à ${result.email}`);
      void query.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const printA5 = async (candidateId: string) => {
    try {
      const result = await utils.adminCandidateManagement.getPaymentReceiptA5Html.fetch({ sessionToken, candidateId });
      const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
      if (!printWindow) {
        toast.error("Autorisez les pop-ups pour imprimer le reçu A5.");
        return;
      }
      printWindow.document.write(result.html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reçu A5 indisponible.");
    }
  };

  const data = query.data;
  const busyId = approveMutation.isPending
    ? String(approveMutation.variables?.candidateId ?? "")
    : sendMutation.isPending
      ? String(sendMutation.variables?.candidateId ?? "")
      : "";

  return (
    <Card className="overflow-hidden border-0 shadow-sm" data-testid="admin-contracts-receipts-desk">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <FileText className="h-5 w-5 text-indigo-700" />
              Bureau reçus & protocoles
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Paiement → reçu A5 / PDF → protocole. Actions locales uniquement — aucun rewrite de statut dossier.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => void query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border bg-amber-50 p-3">
            <p className="text-xs text-amber-800">Protocoles en attente</p>
            <p className="text-2xl font-bold text-amber-950">{data?.counts.awaitingProtocol ?? "—"}</p>
          </div>
          <div className="rounded-xl border bg-orange-50 p-3">
            <p className="text-xs text-orange-800">Reçus à préparer</p>
            <p className="text-2xl font-bold text-orange-950" data-testid="receipt-pending-count">{data?.counts.receiptPending ?? "—"}</p>
          </div>
          <div className="rounded-xl border bg-blue-50 p-3">
            <p className="text-xs text-blue-800">Protocoles à signer</p>
            <p className="text-2xl font-bold text-blue-950">{data?.counts.protocolPending ?? "—"}</p>
          </div>
          <div className="rounded-xl border bg-emerald-50 p-3">
            <p className="text-xs text-emerald-800">Chaîne complète</p>
            <p className="text-2xl font-bold text-emerald-950">{data?.counts.complete ?? "—"}</p>
          </div>
        </div>

        {query.isLoading ? (
          <p className="py-8 text-center text-sm text-slate-500">Chargement du bureau…</p>
        ) : query.isError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 py-6 text-center text-sm text-red-800">Impossible de charger le bureau contrats.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Référence</th>
                    <th className="px-4 py-3">Candidat</th>
                    <th className="px-4 py-3">Étape</th>
                    <th className="px-4 py-3">Reçu</th>
                    <th className="px-4 py-3">Protocole</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {(data?.pipeline ?? []).map((row) => {
                    const stage = STAGE_LABELS[row.stage];
                    const rowBusy = busyId === row.candidateId;
                    return (
                      <tr key={row.candidateId} className="hover:bg-slate-50/80" data-testid={`receipts-row-${row.candidateId}`}>
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs font-semibold text-blue-900">{row.workingReference}</p>
                          {row.formerAccountReference && (
                            <p className="mt-1 text-[11px] text-slate-500">Ancien compte : {row.formerAccountReference}</p>
                          )}
                          {row.dossierNumber !== row.workingReference && (
                            <p className="mt-1 text-[11px] text-slate-400">Dossier source : {row.dossierNumber}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{row.fullName}</p>
                          <p className="text-xs text-slate-500">{row.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={stage.className}>{stage.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {row.receiptAvailable ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Approuvé</span>
                          ) : (
                            <span className="text-amber-700">À préparer</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {row.protocolSigned ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Signé</span>
                          ) : (
                            <span className="text-blue-700">Signature attendue</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {onOpenCandidate ? (
                              <Button type="button" size="sm" variant="outline" className="h-8 gap-1 px-2 text-xs" onClick={() => onOpenCandidate(row.candidateId)}>
                                <UserRound className="h-3.5 w-3.5" /> Fiche
                              </Button>
                            ) : null}
                            <Button type="button" size="sm" variant="outline" className="h-8 gap-1 px-2 text-xs" onClick={() => void printA5(row.candidateId)} data-testid={`receipt-print-a5-${row.candidateId}`}>
                              <Printer className="h-3.5 w-3.5" /> A5
                            </Button>
                            {!row.receiptAvailable ? (
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 gap-1 bg-amber-700 px-2 text-xs text-white hover:bg-amber-800"
                                disabled={rowBusy}
                                onClick={() => approveMutation.mutate({ sessionToken, candidateId: row.candidateId })}
                                data-testid={`receipt-approve-${row.candidateId}`}
                              >
                                {rowBusy && approveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                                Signer
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 gap-1 bg-blue-800 px-2 text-xs text-white hover:bg-blue-900"
                                disabled={rowBusy}
                                onClick={() => sendMutation.mutate({ sessionToken, candidateId: row.candidateId, deliveryMode: "resend" })}
                                data-testid={`receipt-send-${row.candidateId}`}
                              >
                                {rowBusy && sendMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                PDF
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {Boolean(data?.recentAudit?.length) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Journal récent (reçus / protocoles / relances)</p>
                <ul className="mt-3 space-y-2">
                  {data!.recentAudit.slice(0, 8).map((entry) => (
                    <li key={entry.id} className="text-xs text-slate-700">
                      <span className="font-semibold">{entry.action}</span>
                      {" · "}
                      {entry.candidateEmail}
                      {" · "}
                      {entry.adminEmail || "système"}
                      {" · "}
                      {formatDate(entry.createdAt)}
                      {entry.details ? <span className="mt-0.5 block text-slate-500">{entry.details}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
