import { useMemo, useState } from "react";
import { AlertTriangle, BellRing, Clock3, Eye, Mail, RefreshCw, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

function durationLabel(sentAt: Date | string | null) {
  if (!sentAt) return "Date d’envoi indisponible";
  const hours = Math.max(0, Math.floor((Date.now() - new Date(sentAt).getTime()) / 3_600_000));
  if (hours < 24) return `${hours} h sans consultation`;
  return `${Math.floor(hours / 24)} j sans consultation`;
}

export function BilanReminderDashboard({ sessionToken }: { sessionToken: string }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [language, setLanguage] = useState<"fr" | "en">("fr");
  const { data, isLoading, isFetching, refetch } = trpc.unifiedRequests.listUnviewedEvaluationReports.useQuery({ sessionToken }, { enabled: Boolean(sessionToken) });
  const sendReminder = trpc.unifiedRequests.sendEvaluationReminder.useMutation({
    onSuccess: (result) => {
      void utils.unifiedRequests.listUnviewedEvaluationReports.invalidate();
      void utils.unifiedRequests.list.invalidate();
      void utils.unifiedRequests.dashboard.invalidate();
      toast({ title: "Relance envoyée", description: result.message });
    },
    onError: (error) => toast({ title: "Relance non envoyée", description: error.message, variant: "destructive" }),
  });
  const rows = data?.rows ?? [];
  const metrics = useMemo(() => ({
    over72Hours: rows.filter((row: any) => row.hoursSinceSent >= 72).length,
    over7Days: rows.filter((row: any) => row.hoursSinceSent >= 168).length,
    alreadyReminded: rows.filter((row: any) => Boolean(row.evaluationReportReminderSentAt)).length,
  }), [rows]);

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><h2 className="flex items-center gap-2 text-xl font-bold text-slate-950"><BellRing className="h-6 w-6 text-amber-600" />Bilans à relancer</h2><p className="mt-1 max-w-3xl text-sm text-slate-600">Suivez les bilans envoyés mais non encore consultés, puis envoyez une relance e-mail individualisée. Une ouverture d’e-mail reste un indicateur technique : elle ne remplace pas l’échange avec le candidat.</p></div><div className="flex flex-wrap gap-2"><Select value={language} onValueChange={(value) => setLanguage(value as "fr" | "en")}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fr">Relance en français</SelectItem><SelectItem value="en">Reminder in English</SelectItem></SelectContent></Select><Button variant="outline" disabled={isFetching} onClick={() => void refetch()}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Actualiser</Button></div></div>

    <div className="grid gap-3 md:grid-cols-4"><Metric icon={<Mail className="h-5 w-5 text-blue-700" />} label="Bilans non consultés" value={rows.length} tone="blue" /><Metric icon={<Clock3 className="h-5 w-5 text-amber-700" />} label="Depuis plus de 72 h" value={metrics.over72Hours} tone="amber" /><Metric icon={<AlertTriangle className="h-5 w-5 text-red-700" />} label="Depuis plus de 7 jours" value={metrics.over7Days} tone="red" /><Metric icon={<Send className="h-5 w-5 text-violet-700" />} label="Déjà relancés" value={metrics.alreadyReminded} tone="violet" /></div>

    <Card className="border-amber-100"><CardHeader className="flex-row items-start justify-between gap-4 space-y-0"><div><CardTitle className="flex items-center gap-2 text-base text-slate-900"><Eye className="h-5 w-5 text-slate-600" />File de suivi</CardTitle><p className="mt-1 text-sm text-slate-600">Les relances sont limitées à une par 24 heures et journalisées dans le dossier. Elles n’altèrent ni le bilan ni le statut de la procédure.</p></div><Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">{rows.length} à suivre</Badge></CardHeader><CardContent>{isLoading ? <div className="py-12 text-center text-sm text-slate-500">Chargement des bilans à relancer…</div> : <div className="overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Dossier</th><th className="px-4 py-3">Candidat</th><th className="px-4 py-3">Envoyé</th><th className="px-4 py-3">Attente</th><th className="px-4 py-3">Dernière relance</th><th className="px-4 py-3">Conseiller</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.length === 0 ? <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">Tous les bilans envoyés ont été consultés ou aucune diffusion n’est enregistrée.</td></tr> : rows.map((row: any) => { const sendingThisRow = sendReminder.isPending && (sendReminder.variables as { applicationId?: number } | undefined)?.applicationId === row.id; return <tr key={row.id} className="hover:bg-amber-50/40"><td className="px-4 py-3"><p className="font-semibold text-slate-900">{row.dossierNumber}</p><p className="text-xs text-slate-500">{row.destination || "Mobilité internationale"}</p></td><td className="px-4 py-3"><p className="font-medium text-slate-800">{row.fullName}</p><p className="text-xs text-slate-500">{row.email}</p></td><td className="px-4 py-3 text-xs text-slate-600">{row.evaluationCompletedAt ? new Date(row.evaluationCompletedAt).toLocaleString("fr-FR") : "—"}</td><td className="px-4 py-3"><Badge className={row.hoursSinceSent >= 168 ? "bg-red-100 text-red-800" : row.hoursSinceSent >= 72 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}>{durationLabel(row.evaluationCompletedAt)}</Badge></td><td className="px-4 py-3 text-xs text-slate-600">{row.evaluationReportReminderSentAt ? new Date(row.evaluationReportReminderSentAt).toLocaleString("fr-FR") : "Pas encore relancé"}</td><td className="px-4 py-3 text-xs text-slate-600">{row.advisorName || "Non attribué"}</td><td className="px-4 py-3 text-right"><Button size="sm" disabled={sendingThisRow} onClick={() => sendReminder.mutate({ sessionToken, applicationId: row.id, language })}><Send className="mr-1 h-4 w-4" />{sendingThisRow ? "Envoi…" : language === "fr" ? "Relancer" : "Remind"}</Button></td></tr>; })}</tbody></table></div>}</CardContent></Card>
  </div>;
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "blue" | "amber" | "red" | "violet" }) {
  const tones = { blue: "border-blue-100 bg-blue-50/50", amber: "border-amber-100 bg-amber-50/50", red: "border-red-100 bg-red-50/50", violet: "border-violet-100 bg-violet-50/50" };
  return <Card className={tones[tone]}><CardContent className="flex items-center gap-3 p-4">{icon}<div><p className="text-xs text-slate-600">{label}</p><p className="text-2xl font-bold text-slate-900">{value}</p></div></CardContent></Card>;
}
