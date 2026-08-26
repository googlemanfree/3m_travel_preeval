import { Activity, ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, FileCheck2, MailWarning, Plane, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminOperationsControlCenterProps {
  totalCandidates: number;
  pendingEvaluations: number;
  pendingPayments: number;
  pendingFlights: number;
  openDeadlines: number;
  smtpFailures: number;
  lastSyncedAt: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: typeof Users; tone: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{label}</span>
        <Icon className={`h-4 w-4 shrink-0 ${tone}`} aria-hidden="true" />
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

export function AdminOperationsControlCenter({ totalCandidates, pendingEvaluations, pendingPayments, pendingFlights, openDeadlines, smtpFailures, lastSyncedAt, isRefreshing, onRefresh, onNavigate }: AdminOperationsControlCenterProps) {
  const syncLabel = lastSyncedAt ? `Dernière synchronisation : ${lastSyncedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "Synchronisation en attente";

  return (
    <section aria-labelledby="admin-operations-control-title" className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-[#071b3d] via-[#0b2f6f] to-[#123c86] p-4 text-white shadow-[0_18px_50px_-28px_rgba(7,27,61,0.85)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-amber-200"><Activity className="h-4 w-4" aria-hidden="true" />Centre de pilotage synchronisé</div>
          <h2 id="admin-operations-control-title" className="mt-2 text-xl font-black tracking-tight sm:text-2xl">Une même lecture pour l’administration, le client et les partenaires</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">Les actions administratives restent la source de décision. Les statuts utiles sont répercutés vers l’espace client, tandis que les flux partenaires restent anonymisés, vérifiés et soumis à validation humaine.</p>
        </div>
        <Button type="button" variant="outline" onClick={onRefresh} disabled={isRefreshing} className="shrink-0 gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />{isRefreshing ? "Synchronisation…" : "Synchroniser"}
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="Indicateurs synchronisés">
        <Metric label="Dossiers visibles" value={totalCandidates} icon={Users} tone="text-cyan-200" />
        <Metric label="Bilans à traiter" value={pendingEvaluations} icon={FileCheck2} tone="text-amber-300" />
        <Metric label="Paiements à contrôler" value={pendingPayments} icon={CheckCircle2} tone="text-orange-300" />
        <Metric label="Vols à revoir" value={pendingFlights} icon={Plane} tone="text-sky-300" />
        <Metric label="Échéances ouvertes" value={openDeadlines} icon={Clock3} tone="text-violet-300" />
        <Metric label="Alertes e-mail" value={smtpFailures} icon={MailWarning} tone="text-rose-300" />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <Card className="border-white/15 bg-white/10 text-white shadow-none"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-cyan-200" />Espace client</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-xs leading-5 text-blue-100">Les changements de statut, notifications et prochaines actions sont alimentés par le dossier opérationnel.</p><Button type="button" size="sm" onClick={() => onNavigate("candidates")} className="w-full justify-between bg-white text-[#071b3d] hover:bg-blue-50">Ouvrir les dossiers <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button></CardContent></Card>
        <Card className="border-white/15 bg-white/10 text-white shadow-none"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><BriefcaseBusiness className="h-4 w-4 text-amber-200" />Flux partenaires</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-xs leading-5 text-blue-100">Préparez des profils anonymisés, vérifiez les organisations et examinez les retours avant toute suite de procédure.</p><Button type="button" size="sm" onClick={() => document.getElementById("admin-placement-pipeline")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="w-full justify-between bg-amber-300 text-[#071b3d] hover:bg-amber-200">Ouvrir le placement <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button></CardContent></Card>
        <Card className="border-white/15 bg-white/10 text-white shadow-none"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4 text-emerald-200" />Qualité opérationnelle</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex items-center justify-between gap-3 text-xs"><span className="text-blue-100">État de la file</span><Badge className="border border-emerald-200/40 bg-emerald-300/15 text-emerald-100">Suivi actif</Badge></div><p className="text-xs leading-5 text-blue-100">{syncLabel}. Les opérations sensibles demandent toujours une validation humaine.</p><Button type="button" size="sm" onClick={() => onNavigate("system-status")} className="w-full justify-between bg-white/15 text-white hover:bg-white/25">État du service <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button></CardContent></Card>
      </div>
    </section>
  );
}

export default AdminOperationsControlCenter;
