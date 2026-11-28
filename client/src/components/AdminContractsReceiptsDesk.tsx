import React from "react";
import { Bell, Copy, FilePenLine, FileText, KeyRound, Loader2, Printer, RefreshCw, Send, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminReceiptProtocolEditor } from "@/components/AdminReceiptProtocolEditor";

const STAGE_LABELS = {
  receipt_pending: { label: "Reçu à préparer", className: "border-amber-200 bg-amber-50 text-amber-900" },
  protocol_pending: { label: "Protocole à signer", className: "border-blue-200 bg-blue-50 text-blue-900" },
  complete: { label: "Complet", className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
} as const;

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function whatsappToastSuffix(result: { whatsappSent?: boolean; whatsappSkippedReason?: string | null }) {
  if (result.whatsappSent) return " · WhatsApp envoyé au client";
  if (result.whatsappSkippedReason) return ` · WhatsApp non envoyé (${result.whatsappSkippedReason})`;
  return "";
}

type Props = {
  sessionToken: string;
  /** Ouvre la fiche 360 / détail candidat sans modifier le dossier. */
  onOpenCandidate?: (candidateId: string) => void;
};

export default function AdminContractsReceiptsDesk({ sessionToken, onOpenCandidate }: Props) {
  const utils = trpc.useUtils();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deskFilter, setDeskFilter] = React.useState<"all" | "prepare" | "unsigned">("all");
  const copyProtocolLink = async (candidateId: string) => {
    try {
      const { url } = await utils.adminDocumentDrafts.protocolLink.fetch({ sessionToken, candidateId });
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        const input = document.createElement("textarea");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      toast.success("Lien du protocole copié", { description: "Collez-le dans WhatsApp, un SMS ou un e-mail : le candidat télécharge son protocole directement." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lien du protocole indisponible.");
    }
  };
  const daysSince = (iso: string | null | undefined) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)) : null);
  const query = trpc.adminCandidateManagement.contractsReceiptsDesk.useQuery(
    { sessionToken },
    { enabled: Boolean(sessionToken), refetchInterval: 45_000 },
  );

  const approveMutation = trpc.adminCandidateManagement.approvePaymentReceipt.useMutation({
    onSuccess: (result) => {
      toast.success(`Reçu signé pour ${result.dossierNumber}${whatsappToastSuffix(result)}`);
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

  const accessMutation = trpc.adminCandidateManagement.resendClientAccessLink.useMutation({
    onSuccess: (result) => {
      toast.success(`Lien d’accès envoyé à ${result.email}${whatsappToastSuffix(result)}`);
      void query.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const remindMutation = trpc.adminCandidateManagement.resendAgreementSignatureReminder.useMutation({
    onSuccess: (result) => {
      toast.success(`Relance protocole envoyée à ${result.email}${whatsappToastSuffix(result)}`);
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
  const approveCandidateId = approveMutation.variables && typeof approveMutation.variables === "object"
    ? String(approveMutation.variables.candidateId ?? "")
    : "";
  const sendCandidateId = sendMutation.variables && typeof sendMutation.variables === "object"
    ? String(sendMutation.variables.candidateId ?? "")
    : "";
  const accessCandidateId = accessMutation.variables && typeof accessMutation.variables === "object"
    ? String(accessMutation.variables.candidateId ?? "")
    : "";
  const remindCandidateId = remindMutation.variables && typeof remindMutation.variables === "object"
    ? String(remindMutation.variables.candidateId ?? "")
    : "";
  const busyId = approveMutation.isPending
    ? approveCandidateId
    : sendMutation.isPending
      ? sendCandidateId
      : accessMutation.isPending
        ? accessCandidateId
        : remindMutation.isPending
          ? remindCandidateId
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
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer le bureau reçus et protocoles" data-testid="desk-filter">
              {([["all", "Tous"], ["prepare", `Reçus à préparer (${data?.counts.receiptPending ?? 0})`], ["unsigned", `Protocoles non signés (${data?.counts.protocolPending ?? 0})`]] as const).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={deskFilter === value} onClick={() => setDeskFilter(value)} className={`h-9 rounded-md border px-3 text-sm font-semibold ${deskFilter === value ? "border-[#0B2A52] bg-[#0B2A52] text-white" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"}`}>{label}</button>
              ))}
            </div>
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
                  {(data?.pipeline ?? []).filter((row) => deskFilter === "all" || (deskFilter === "prepare" ? row.stage === "receipt_pending" : row.stage === "protocol_pending")).map((row) => {
                    const stage = STAGE_LABELS[row.stage];
                    const rowBusy = busyId === row.candidateId;
                    return (
                      <tr key={row.candidateId} className="hover:bg-slate-50/80" data-testid={`receipts-row-${row.candidateId}`}>
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs font-semibold text-blue-900">{row.workingReference}</p>
                          {(row as { procedureLabel?: string | null }).procedureLabel && (
                            <p className="mt-1 text-[11px] text-slate-600" data-testid={`row-procedure-${row.candidateId}`}>Procédure : {(row as { procedureLabel?: string | null }).procedureLabel}</p>
                          )}
                          {(row as { procedureRefreshNeeded?: boolean }).procedureRefreshNeeded && (
                            <p className="mt-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900" data-testid={`row-procedure-refresh-${row.candidateId}`}>
                              Envoyé avant l'adaptation à la procédure : ouvrez « Modifier reçu &amp; protocole », vérifiez puis renvoyez.
                            </p>
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
                          {(() => {
                            const days = daysSince((row as { packageSentAt?: string | null }).packageSentAt);
                            if (days === null) return row.protocolSigned ? null : <p className="mt-0.5 text-[11px] text-slate-500" data-testid={`protocol-not-sent-${row.candidateId}`}>Pas encore envoyé</p>;
                            return <p className={`mt-0.5 text-[11px] ${!row.protocolSigned && days >= 3 ? "font-semibold text-amber-800" : "text-slate-500"}`} data-testid={`protocol-sent-${row.candidateId}`}>{`Envoyé il y a ${days} j`}{!row.protocolSigned && days >= 3 ? " — non signé" : ""}</p>;
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {onOpenCandidate ? (
                              <Button type="button" size="sm" variant="outline" className="h-8 gap-1 px-2 text-xs" onClick={() => onOpenCandidate(row.candidateId)}>
                                <UserRound className="h-3.5 w-3.5" /> Fiche
                              </Button>
                            ) : null}
                            {/^(online|agency)_\d+$/.test(row.candidateId) && (row as { packageSentAt?: string | null }).packageSentAt ? (
                              <Button type="button" size="sm" variant="outline" className="h-8 gap-1 px-2 text-xs" onClick={() => void copyProtocolLink(row.candidateId)} data-testid={`protocol-copy-link-${row.candidateId}`} title="Copier le lien de téléchargement du protocole (PDF)">
                                <Copy className="h-3.5 w-3.5" /> Lien protocole
                              </Button>
                            ) : null}
                            {/^(online|agency)_\d+$/.test(row.candidateId) ? (
                              <Button type="button" size="sm" className="h-8 gap-1 bg-indigo-700 px-2 text-xs text-white hover:bg-indigo-800" onClick={() => setEditingId(row.candidateId)} data-testid={`receipt-edit-${row.candidateId}`} title="Modifier le reçu et le protocole d'accord, puis les envoyer">
                                <FilePenLine className="h-3.5 w-3.5" /> Modifier reçu & protocole
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
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 border-slate-200 px-2 text-xs text-slate-800 hover:bg-slate-50"
                              disabled={rowBusy || !sessionToken}
                              onClick={() => accessMutation.mutate({ sessionToken, candidateId: row.candidateId })}
                              data-testid={`client-access-resend-${row.candidateId}`}
                              title="Renvoyer le lien d’accès espace client (e-mail + WhatsApp)"
                            >
                              {rowBusy && accessMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                              Accès
                            </Button>
                            {row.stage === "protocol_pending" && !row.protocolSigned && /^(online|agency)_\d+$/.test(row.candidateId) ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 border-indigo-200 px-2 text-xs text-indigo-800 hover:bg-indigo-50"
                                disabled={rowBusy || !sessionToken}
                                onClick={() => remindMutation.mutate({ sessionToken, candidateId: row.candidateId })}
                                data-testid={`protocol-remind-${row.candidateId}`}
                                title="Relancer la signature du protocole (e-mail + WhatsApp)"
                              >
                                {rowBusy && remindMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                                Relancer
                              </Button>
                            ) : null}
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
        <AdminReceiptProtocolEditor
          sessionToken={sessionToken}
          candidateId={editingId}
          open={editingId !== null}
          onOpenChange={(next) => { if (!next) setEditingId(null); }}
          onChanged={() => void query.refetch()}
        />
      </CardContent>
    </Card>
  );
}
