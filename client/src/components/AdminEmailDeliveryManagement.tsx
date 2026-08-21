import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Check, Clock3, Download, HelpCircle, Mail, Pencil, RefreshCw, Search, Send, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getEmailErrorGuidance, getEmailErrorTitle } from "@/lib/emailErrorGuidance";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { SafeResponsiveChart } from "@/components/SafeResponsiveChart";
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

const deliveryTypeLabel: Record<string, string> = {
  demonstration: "Démonstration",
  assurance: "Assurance",
  evisa: "e-Visa",
  billet: "Billet / PNR",
  evaluation: "Évaluation",
  other: "Autre",
};

export default function AdminEmailDeliveryManagement() {
  const [status, setStatus] = useState<"all" | "sent" | "failed" | "pending">("all");
  const [errorType, setErrorType] = useState<"all" | "invalid_recipient" | "domain_unverified" | "rate_limit" | "configuration">("all");
  const [deliveryType, setDeliveryType] = useState<"all" | "demonstration" | "assurance" | "evisa" | "billet" | "evaluation" | "other">("all");
  const [search, setSearch] = useState("");
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editingEmail, setEditingEmail] = useState("");
  const [selectedFailedLogIds, setSelectedFailedLogIds] = useState<Set<number>>(() => new Set());
  const [advisorEmail, setAdvisorEmail] = useState("all");
  const [previewLog, setPreviewLog] = useState<{ recipientEmail: string; subject: string; contentHtml: string | null; createdAt: Date | string; deliveryType: string } | null>(null);
  const utils = trpc.useUtils();
  // La connexion administrateur écrit le jeton dans sessionStorage. Le repli
  // localStorage conserve uniquement la compatibilité avec les anciennes sessions.
  const sessionToken = typeof window !== "undefined"
    ? sessionStorage.getItem("adminSessionToken") || localStorage.getItem("adminSessionToken") || ""
    : "";
  const queryInput = useMemo(() => ({
    sessionToken,
    limit: 100,
    status,
    errorType,
    deliveryType,
    ...(advisorEmail !== "all" ? { advisorEmail } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  }), [sessionToken, status, errorType, deliveryType, advisorEmail, search]);
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
  const bulkResendMutation = trpc.admin.resendFailedEmailsBulk.useMutation({
    onSuccess: (result) => {
      if (result.failed) toast.warning(`${result.sent} relance(s) envoyée(s) ; ${result.failed} échec(s) restent à vérifier.`);
      else toast.success(`${result.sent} relance(s) envoyée(s) avec succès.`);
      setSelectedFailedLogIds(new Set());
      utils.admin.getEmailDeliveryLogs.invalidate();
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  const summary = data?.summary ?? { total: 0, sent: 0, failed: 0, pending: 0 };
  const logs = data?.logs ?? [];
  const failedLogs = logs.filter((log) => log.status === "failed");
  const selectedFailedLogs = failedLogs.filter((log) => selectedFailedLogIds.has(log.id));
  const lastSuccessfulByType = data?.lastSuccessfulByType ?? [];
  const dailyFailures = data?.dailyFailures ?? [];
  const deliverySuccessRates30Days = data?.deliverySuccessRates30Days ?? [];
  const weeklySuccessRateComparison = data?.weeklySuccessRateComparison ?? [];
  const advisors = data?.advisors ?? [];
  const rateChartData = deliverySuccessRates30Days.map((metric) => ({
    service: deliveryTypeLabel[metric.deliveryType] ?? metric.deliveryType,
    taux: metric.successRate ?? 0,
    envoyes: metric.sent,
    echecs: metric.failed,
  }));

  const exportFilteredCsv = () => {
    const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Destinataire", "Sujet", "Type", "Statut", "Date", "Détail"],
      ...logs.map((log) => [log.recipientEmail, log.subject, deliveryTypeLabel[log.deliveryType] ?? "Autre", statusLabel[log.status] ?? log.status, new Date(log.createdAt).toLocaleString("fr-FR"), log.errorDetails ?? log.providerMessageId ?? ""]),
    ];
    const blob = new Blob([`\uFEFF${rows.map((row) => row.map(escapeCsv).join(";")).join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `journaux-email-3m-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé selon les filtres actifs.");
  };

  const toggleFailedLog = (logId: number, checked: boolean) => {
    setSelectedFailedLogIds((current) => {
      const next = new Set(current);
      if (checked) next.add(logId);
      else next.delete(logId);
      return next;
    });
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
            <Button variant="outline" size="sm" onClick={exportFilteredCsv} disabled={!sessionToken || logs.length === 0} className="gap-2">
              <Download className="h-4 w-4" />Exporter CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const selected = selectedFailedLogs.slice(0, 25);
              if (!selected.length || !window.confirm(`Relancer ${selected.length} e-mail(s) sélectionné(s) ? Les envois réels seront effectués et journalisés.`)) return;
              bulkResendMutation.mutate({ sessionToken, logIds: selected.map((log) => log.id), confirmed: true });
            }} disabled={!sessionToken || selectedFailedLogs.length === 0 || bulkResendMutation.isPending} className="gap-2 border-amber-300 text-amber-800 hover:bg-amber-50">
              <Send className={`h-4 w-4 ${bulkResendMutation.isPending ? "animate-pulse" : ""}`} />{bulkResendMutation.isPending ? "Relance en cours…" : `Relancer la sélection (${Math.min(selectedFailedLogs.length, 25)})`}
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching || !sessionToken} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Actualiser
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

            <div className="border-t bg-slate-50/50 px-5 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Dernières remises réussies par service</p>
              {lastSuccessfulByType.length ? (
                <div className="flex flex-wrap gap-2">
                  {lastSuccessfulByType.map((entry) => <Badge key={entry.deliveryType} variant="outline" className="gap-1.5 bg-white px-2.5 py-1 text-slate-700"><span>{deliveryTypeLabel[entry.deliveryType] ?? entry.deliveryType}</span><span className="text-slate-500">· {new Date(entry.createdAt).toLocaleString("fr-FR")}</span></Badge>)}
                </div>
              ) : <p className="text-sm text-slate-500">Aucune remise réussie n’est encore journalisée.</p>}
            </div>

            <div className="grid gap-4 border-t p-5 lg:grid-cols-[1.1fr_1.9fr]">
              <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Échecs d’envoi aujourd’hui</p>
                <p className="mt-1 text-3xl font-black text-rose-950">{dailyFailures.length}</p>
                {dailyFailures.length ? <ul className="mt-3 space-y-2 text-xs text-rose-900">{dailyFailures.slice(0, 4).map((log) => <li key={log.id} className="rounded-lg border border-rose-100 bg-white/80 p-2"><span className="font-semibold">{deliveryTypeLabel[log.deliveryType] ?? "Autre"}</span> · {log.recipientEmail}<br /><span className="text-rose-700">{log.errorDetails || "Échec sans détail fournisseur"}</span></li>)}</ul> : <p className="mt-3 text-sm text-emerald-800">Aucun échec journalisé aujourd’hui.</p>}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Taux de réussite par service · 30 jours</p>
                {rateChartData.length ? <SafeResponsiveChart className="h-[240px] w-full" label="Graphique du taux de réussite des e-mails par service sur 30 jours"><ResponsiveContainer width="100%" height="100%"><BarChart data={rateChartData} margin={{ top: 12, right: 10, left: -20, bottom: 28 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="service" angle={-20} textAnchor="end" interval={0} height={50} tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} /><RechartsTooltip formatter={(value: number, name) => [name === "taux" ? `${value}%` : value, name === "taux" ? "Réussite" : name]} /><Bar dataKey="taux" name="taux" fill="#2563eb" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></SafeResponsiveChart> : <p className="py-16 text-center text-sm text-slate-500">Les données de remise sur 30 jours apparaîtront après les premiers envois.</p>}
              </div>
            </div>

            <div className="border-t bg-slate-50/50 px-5 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Comparaison hebdomadaire des taux de réussite</p>
              {weeklySuccessRateComparison.length ? <div className="flex flex-wrap gap-2">{weeklySuccessRateComparison.map((metric) => <Badge key={metric.deliveryType} variant="outline" className="gap-1.5 bg-white px-2.5 py-1 text-slate-700"><span>{deliveryTypeLabel[metric.deliveryType] ?? metric.deliveryType}</span><span className="font-semibold">{metric.currentRate ?? "—"}%</span><span className={metric.change === null ? "text-slate-400" : metric.change >= 0 ? "text-emerald-700" : "text-rose-700"}>{metric.change === null ? "· sans comparatif" : `${metric.change >= 0 ? "+" : ""}${metric.change} pts`}</span></Badge>)}</div> : <p className="text-sm text-slate-500">Aucun volume suffisant pour une comparaison hebdomadaire.</p>}
            </div>

            <div className="flex flex-col gap-3 border-y bg-white p-5 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par destinataire ou sujet" aria-label="Rechercher instantanément dans les journaux e-mail" className="pl-9 pr-10" />
                {search && <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Effacer la recherche"><X className="h-4 w-4" /></button>}
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
              <Select value={deliveryType} onValueChange={(value) => setDeliveryType(value as typeof deliveryType)}>
                <SelectTrigger className="w-full md:w-52"><SelectValue placeholder="Tous les types de remise" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types de remise</SelectItem>
                  <SelectItem value="demonstration">Démonstration interne</SelectItem>
                  <SelectItem value="assurance">Assurance</SelectItem>
                  <SelectItem value="evisa">e-Visa</SelectItem>
                  <SelectItem value="billet">Billet / PNR</SelectItem>
                  <SelectItem value="evaluation">Évaluation / bilan</SelectItem>
                  <SelectItem value="other">Autres communications</SelectItem>
                </SelectContent>
              </Select>
              <Select value={advisorEmail} onValueChange={setAdvisorEmail}>
                <SelectTrigger className="w-full md:w-56"><SelectValue placeholder="Tous les conseillers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les conseillers</SelectItem>
                  {advisors.map((email) => <SelectItem key={email} value={email}>{email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <p className="px-5 pt-3 text-xs text-slate-500" aria-live="polite">
              {isFetching ? "Recherche en cours…" : `${logs.length} journal${logs.length > 1 ? "x" : ""} affiché${logs.length > 1 ? "s" : ""}${search ? ` pour « ${search} »` : ""}.`}
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center p-10 text-sm text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Chargement des journaux...</div>
            ) : logs.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">Aucun e-mail ne correspond aux filtres actuels.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="px-3 py-3"><input type="checkbox" aria-label="Sélectionner tous les e-mails en échec affichés" checked={failedLogs.length > 0 && failedLogs.every((log) => selectedFailedLogIds.has(log.id))} onChange={(event) => setSelectedFailedLogIds(event.target.checked ? new Set(failedLogs.map((log) => log.id)) : new Set())} /></th><th className="px-5 py-3">Destinataire</th><th className="px-5 py-3">Sujet</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Détail</th><th className="px-5 py-3">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <tr key={log.id} className="align-top hover:bg-slate-50/70">
                        <td className="px-3 py-3"><input type="checkbox" aria-label={`Sélectionner l’e-mail en échec à destination de ${log.recipientEmail}`} disabled={log.status !== "failed"} checked={log.status === "failed" && selectedFailedLogIds.has(log.id)} onChange={(event) => toggleFailedLog(log.id, event.target.checked)} /></td>
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
                        <td className="px-5 py-3"><Badge variant="outline">{deliveryTypeLabel[log.deliveryType] ?? "Autre"}</Badge></td>
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1 px-2 text-slate-600 hover:text-blue-700"
                              aria-label={`Prévisualiser l’e-mail à destination de ${log.recipientEmail}`}
                              onClick={() => setPreviewLog({ recipientEmail: log.recipientEmail, subject: log.subject, contentHtml: log.contentHtml ?? null, createdAt: log.createdAt, deliveryType: log.deliveryType })}
                            >
                              <Mail className="h-3.5 w-3.5" />
                              <span className="hidden lg:inline">Aperçu</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Dialog open={Boolean(previewLog)} onOpenChange={(open) => { if (!open) setPreviewLog(null); }}>
              <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Prévisualisation de la remise</DialogTitle>
                  <DialogDescription>{previewLog ? `${deliveryTypeLabel[previewLog.deliveryType] ?? "Remise"} · ${previewLog.recipientEmail} · ${new Date(previewLog.createdAt).toLocaleString("fr-FR")}` : ""}</DialogDescription>
                </DialogHeader>
                {previewLog ? <div className="space-y-3"><div className="rounded-lg border bg-slate-50 p-3"><p className="text-xs font-semibold uppercase text-slate-500">Objet</p><p className="mt-1 font-medium text-slate-900">{previewLog.subject}</p></div>{previewLog.contentHtml ? <iframe title="Aperçu du contenu e-mail" sandbox="" srcDoc={previewLog.contentHtml} className="h-[420px] w-full rounded-lg border bg-white" /> : <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Le contenu complet n’était pas encore journalisé lors de cette tentative. Les nouvelles remises conservent désormais une prévisualisation réservée aux administrateurs.</p>}</div> : null}
              </DialogContent>
            </Dialog>
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
