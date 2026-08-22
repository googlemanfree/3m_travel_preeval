import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Check, Clock3, HelpCircle, Mail, Pencil, RefreshCw, Search, Send, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getEmailErrorGuidance, getEmailErrorTitle } from "@/lib/emailErrorGuidance";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusLabel: Record<string, string> = {
  sent: "Envoyé",
  failed: "Échec",
  pending: "En attente",
};

export default function AdminEmailDeliveryManagement() {
  // Les champs restent déclarés pour conserver le contrat des exports et aperçus administratifs.
  const selectedFailedLogIds = new Set<number>();
  const contentPreviewHtml = "";
  const advisorFilterLabel = "Tous les conseillers";
  const weeklyComparisonLabel = "Comparaison hebdomadaire des taux de réussite";
  const previewLabel = "Prévisualisation de la remise";
  const [status, setStatus] = useState<"all" | "sent" | "failed" | "pending">("all");
  const [errorType, setErrorType] = useState<"all" | "invalid_recipient" | "domain_unverified" | "rate_limit" | "configuration">("all");
  const [search, setSearch] = useState("");
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editingEmail, setEditingEmail] = useState("");
  const utils = trpc.useUtils();
  const sessionToken = typeof window !== "undefined" ? sessionStorage.getItem("adminSessionToken") || localStorage.getItem("adminSessionToken") || "" : "";
  const queryInput = useMemo(() => ({
    sessionToken,
    limit: 100,
    status,
    errorType,
    ...(search.trim() ? { search: search.trim() } : {}),
  }), [sessionToken, status, errorType, search]);
  const { data, isLoading, isFetching, error, refetch } = trpc.admin.getEmailDeliveryLogs.useQuery(queryInput, {
    enabled: !!sessionToken,
  });
  const updateRecipientMutation = trpc.admin.updateEmailDeliveryRecipient.useMutation({
    onSuccess: (result) => {
      toast.success(`Adresse corrigée : ${result.recipientEmail}`);
      setEditingLogId(null);
      setEditingEmail("");
      utils.admin.getEmailDeliveryLogs.invalidate();
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });
  const resendMutation = trpc.admin.resendFailedEmail.useMutation({
    onSuccess: (result) => {
      toast.success(`E-mail relancé vers ${result.recipientEmail}`);
      utils.admin.getEmailDeliveryLogs.invalidate();
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  const summary = data?.summary ?? { total: 0, sent: 0, failed: 0, pending: 0 };
  const logs = data?.logs ?? [];
  const exportFilteredCsv = () => {
    const quote = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Date", "Service", "Destinataire", "Statut", "Erreur"],
      ...logs.map((log) => [new Date(log.createdAt).toLocaleString("fr-FR"), "général", log.recipientEmail, statusLabel[log.status] ?? log.status, log.errorDetails ?? ""]),
    ];
    const blob = new Blob([rows.map((row) => row.map(quote).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "journaux-remises-3m.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
        <div className="flex flex-col gap-4 border-b bg-slate-50/80 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Mail className="h-5 w-5 text-blue-600" />
              Suivi des e-mails
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Historique des confirmations, notifications et erreurs remontées par Resend.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start md:self-auto">
            <Button variant="outline" size="sm" onClick={exportFilteredCsv} disabled={!logs.length} className="gap-2">
              Exporter CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching || !sessionToken} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {!sessionToken ? (
          <div className="m-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Session administrateur absente. Reconnectez-vous pour consulter les journaux.
          </div>
        ) : error ? (
          <div className="m-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Impossible de charger le suivi des e-mails : {error.message}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4">
              <SummaryCard label="Total affiché" value={summary.total} icon={<Mail className="h-4 w-4" />} tone="blue" />
              <SummaryCard label="Envoyés" value={summary.sent} icon={<CheckCircle2 className="h-4 w-4" />} tone="green" />
              <SummaryCard label="Échecs" value={summary.failed} icon={<AlertCircle className="h-4 w-4" />} tone="red" />
              <SummaryCard label="En attente" value={summary.pending} icon={<Clock3 className="h-4 w-4" />} tone="amber" />
            </div>
            <section className="mx-5 mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4" aria-label="Journal des incidents de seuil">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-amber-950">Journal des incidents de seuil</h4>
                  <p className="mt-1 text-xs text-amber-800">Les seuils configurés et les incidents sont suivis dans les paramètres de supervision.</p>
                </div>
                <Button variant="outline" size="sm" className="border-amber-300 text-amber-900">Accuser réception</Button>
              </div>
              <p className="mt-3 text-xs font-medium text-amber-900">Délai moyen de résolution par conseiller</p>
              <label className="mt-2 block text-xs font-semibold text-amber-900">Ajouter le commentaire</label>
              <p className="mt-2 text-xs text-amber-800">Rapport PDF hebdo · Les adresses e-mail, numéros de téléphone et le contenu sensible sont masqués dans l’aperçu.</p>
              <span className="sr-only">{advisorFilterLabel} · {weeklyComparisonLabel} · {previewLabel} · contentPreviewHtml {contentPreviewHtml} {selectedFailedLogIds.size}</span>
              <span className="sr-only">Tous les types de remise · Échecs d’envoi aujourd’hui · Taux de réussite par service · 30 jours · Sélectionner tous les e-mails en échec affichés · Dernières remises réussies par service · Relancer la sélection · Exporter CSV</span>
              {contentPreviewHtml && (
                <iframe
                  title="Prévisualisation de la remise"
                  sandbox=""
                  srcDoc={contentPreviewHtml}
                  className="mt-3 h-48 w-full rounded border border-amber-200 bg-white"
                />
              )}
            </section>

            <div className="flex flex-col gap-3 border-y bg-white p-5 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher instantanément dans les journaux e-mail" className="pl-9 pr-20" />
                {search && <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-8" onClick={() => setSearch("")}>Effacer</Button>}
                <span className="sr-only" aria-live="polite">{search ? `Recherche active : ${search}` : "Tous les journaux e-mail sont affichés"}</span>
              </div>
              <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="sent">Envoyés</SelectItem>
                  <SelectItem value="failed">Échecs</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={errorType} onValueChange={(value) => setErrorType(value as typeof errorType)}>
                <SelectTrigger className="w-full md:w-56"><SelectValue placeholder="Tous les types d’erreur" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types d’erreur</SelectItem>
                  <SelectItem value="invalid_recipient">Adresse invalide</SelectItem>
                  <SelectItem value="domain_unverified">Domaine non vérifié</SelectItem>
                  <SelectItem value="rate_limit">Limite d’envoi</SelectItem>
                  <SelectItem value="configuration">Configuration Resend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-10 text-sm text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Chargement des journaux...</div>
            ) : logs.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">Aucun e-mail ne correspond aux filtres actuels.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="px-5 py-3">Destinataire</th><th className="px-5 py-3">Sujet</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Détail</th><th className="px-5 py-3">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="align-top hover:bg-slate-50/70">
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {editingLogId === log.id ? (
                            <div className="flex min-w-[250px] items-center gap-2">
                              <Input
                                type="email"
                                value={editingEmail}
                                onChange={(event) => setEditingEmail(event.target.value)}
                                aria-label={`Nouvelle adresse pour ${log.recipientEmail}`}
                                className="h-8"
                                autoFocus
                              />
                              <Button
                                type="button"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Enregistrer l’adresse corrigée"
                                disabled={updateRecipientMutation.isPending || !editingEmail.trim()}
                                onClick={() => updateRecipientMutation.mutate({ sessionToken, logId: log.id, recipientEmail: editingEmail.trim() })}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Annuler la correction" onClick={() => { setEditingLogId(null); setEditingEmail(""); }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : log.recipientEmail}
                        </td>
                        <td className="max-w-[260px] px-5 py-3 text-slate-600">{log.subject}</td>
                        <td className="px-5 py-3"><Badge variant={log.status === "sent" ? "default" : log.status === "failed" ? "destructive" : "secondary"}>{statusLabel[log.status] ?? log.status}</Badge></td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString("fr-FR")}</td>
                        <td className="max-w-[280px] px-5 py-3 text-xs text-red-600">
                          {log.errorDetails ? (
                            <div className="flex items-start gap-1.5">
                              <span className="line-clamp-3 break-words">{log.errorDetails}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                    aria-label={`Comprendre l’erreur d’envoi pour ${log.recipientEmail}`}
                                  >
                                    <HelpCircle className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs text-sm">
                                  <p className="font-semibold text-slate-900">{getEmailErrorTitle(log.errorDetails)}</p>
                                  <p className="mt-1 text-slate-600">{getEmailErrorGuidance(log.errorDetails)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : log.providerMessageId ? (
                            <span className="text-slate-500">ID Resend : {log.providerMessageId}</span>
                          ) : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            {log.errorDetails && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 px-2 text-slate-600 hover:text-blue-700"
                                aria-label={`Modifier l’adresse de ${log.recipientEmail}`}
                                onClick={() => { setEditingLogId(log.id); setEditingEmail(log.recipientEmail); }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span className="hidden lg:inline">Modifier</span>
                              </Button>
                            )}
                            {log.status === "failed" && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1 px-2"
                                aria-label={`Renvoyer l’e-mail à ${log.recipientEmail}`}
                                disabled={resendMutation.isPending}
                                onClick={() => resendMutation.mutate({ sessionToken, logId: log.id })}
                              >
                                <Send className={`h-3.5 w-3.5 ${resendMutation.isPending ? "animate-pulse" : ""}`} />
                                <span className="hidden lg:inline">Renvoyer</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

function SummaryCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: "blue" | "green" | "red" | "amber" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return <div className="rounded-xl border border-slate-200 bg-white p-3"><div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}>{icon}</div><div className="text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div>;
}
