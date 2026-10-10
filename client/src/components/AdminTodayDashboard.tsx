import { AlertTriangle, ClipboardCheck, FileSignature, GitBranch, RefreshCw, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type TodayCandidate = {
  id: string;
  fullName: string;
  folderCode: string;
  destinationCountry?: string | null;
  journeySla?: { tone?: "ok" | "soon" | "overdue" | "unset"; label?: string } | null;
  paymentStatus?: string | null;
  agreementSigned?: boolean | null;
  secondProtocolReady?: boolean;
  secondProtocolSigned?: boolean;
  checklistPercent?: number | null;
  siblingCount?: number;
};

type TodayItem = { candidate: TodayCandidate; label: string; detail: string; tone: "rose" | "amber" | "blue" | "violet" };

const toneClasses: Record<TodayItem["tone"], string> = {
  rose: "border-rose-200 bg-rose-50 text-rose-950",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  blue: "border-blue-200 bg-blue-50 text-blue-950",
  violet: "border-violet-200 bg-violet-50 text-violet-950",
};

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" /></div><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>;
}

export function buildTodayItems(candidates: TodayCandidate[]): TodayItem[] {
  const items: TodayItem[] = [];
  for (const candidate of candidates) {
    if (candidate.journeySla?.tone === "overdue") items.push({ candidate, label: "SLA dépassé", detail: candidate.journeySla.label ?? "Échéance à traiter", tone: "rose" });
    else if (candidate.journeySla?.tone === "soon") items.push({ candidate, label: "SLA sous 24 h", detail: candidate.journeySla.label ?? "Échéance proche", tone: "amber" });
    if (candidate.paymentStatus === "SUCCESS" && candidate.agreementSigned === false) items.push({ candidate, label: "Protocole N°01 à signer", detail: "Paiement confirmé, signature client attendue", tone: "blue" });
    if (candidate.secondProtocolReady && !candidate.secondProtocolSigned) items.push({ candidate, label: "Protocole N°02 à signer", detail: "Sélection validée, signature client attendue", tone: "violet" });
    if (candidate.checklistPercent != null && candidate.checklistPercent < 80) items.push({ candidate, label: "Checklist sous 80 %", detail: `${candidate.checklistPercent}% des pièces requises complétées`, tone: "amber" });
    // siblingCount = total procédures du client (1 = seul). Multi = au moins 2.
    if ((candidate.siblingCount ?? 0) > 1) {
      items.push({
        candidate,
        label: "Traitement simultané multi-procédures",
        detail: `${candidate.siblingCount} procédures (ex. travail + études) à suivre en parallèle`,
        tone: "violet",
      });
    }
  }
  return items.slice(0, 12);
}

export default function AdminTodayDashboard({ candidates, isRefreshing, lastUpdatedAt, onRefresh, onOpen }: { candidates: TodayCandidate[]; isRefreshing: boolean; lastUpdatedAt?: Date | null; onRefresh: () => void; onOpen: (candidateId: string) => void }) {
  const items = buildTodayItems(candidates);
  const count = (predicate: (candidate: TodayCandidate) => boolean) => candidates.filter(predicate).length;
  const overdue = count((candidate) => candidate.journeySla?.tone === "overdue");
  const soon = count((candidate) => candidate.journeySla?.tone === "soon");
  const protocolOne = count((candidate) => candidate.paymentStatus === "SUCCESS" && candidate.agreementSigned === false);
  const protocolTwo = count((candidate) => Boolean(candidate.secondProtocolReady) && !candidate.secondProtocolSigned);
  const checklist = count((candidate) => candidate.checklistPercent != null && candidate.checklistPercent < 80);
  const siblings = count((candidate) => (candidate.siblingCount ?? 0) > 1);
  const syncLabel = lastUpdatedAt ? `Dernière actualisation : ${lastUpdatedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "Aucune actualisation depuis l’ouverture";

  return <Card data-testid="admin-today-dashboard" className="border-indigo-200 shadow-sm"><CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-xl text-slate-950"><Timer className="h-5 w-5 text-indigo-700" />Aujourd’hui</CardTitle><p className="mt-1 text-sm text-slate-600">Une vue unique des dossiers à arbitrer. Les données se mettent à jour uniquement à votre demande.</p><p className="mt-1 text-xs text-slate-500" aria-live="polite" data-testid="today-last-updated">{isRefreshing ? "Actualisation en cours…" : syncLabel}</p></div><Button type="button" variant="outline" onClick={onRefresh} disabled={isRefreshing} className="gap-2"><RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />{isRefreshing ? "Actualisation…" : "Actualiser"}</Button></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Compteurs Aujourd’hui"><Metric label="SLA dépassés" value={overdue} icon={AlertTriangle} tone="text-rose-700" /><Metric label="SLA sous 24 h" value={soon} icon={Timer} tone="text-amber-700" /><Metric label="Protocole N°01" value={protocolOne} icon={FileSignature} tone="text-blue-700" /><Metric label="Protocole N°02" value={protocolTwo} icon={FileSignature} tone="text-violet-700" /><Metric label="Checklist < 80 %" value={checklist} icon={ClipboardCheck} tone="text-amber-700" /><Metric label="Multi-procédures" value={siblings} icon={GitBranch} tone="text-violet-700" /></div>{items.length === 0 ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900" data-testid="today-empty">Aucune priorité critique dans la vue actuelle.</p> : <div className="space-y-2" data-testid="today-priority-list">{items.map((item, index) => <button key={`${item.candidate.id}-${item.label}-${index}`} type="button" onClick={() => onOpen(item.candidate.id)} className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition hover:shadow-sm ${toneClasses[item.tone]}`} data-testid="today-priority-item"><span className="min-w-0"><span className="block text-sm font-bold">{item.label}</span><span className="block truncate text-sm">{item.candidate.fullName} · {item.candidate.folderCode}</span><span className="block text-xs opacity-80">{item.detail}{item.candidate.destinationCountry ? ` · ${item.candidate.destinationCountry}` : ""}</span></span><Badge className="shrink-0 bg-white/80 text-slate-800">Ouvrir</Badge></button>)}</div>}</CardContent></Card>;
}
