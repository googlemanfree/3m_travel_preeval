import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, FileCheck, Globe, GripVertical, History, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type KanbanStatus = "PENDING_48H" | "PUBLISHED" | "DOCUMENTS_CHECK" | "SUBMITTED" | "APPROVED";
type HistoryEntry = { status: string; label: string; at?: Date | string | null };
export interface KanbanCandidate {
  id: string;
  fullName: string;
  folderCode: string;
  destinationCountry: string;
  projectType: string;
  status: string;
  source: string;
  advisorName?: string | null;
  dueAt?: Date | string | null;
  history?: HistoryEntry[];
}

const columns: Array<{ status: KanbanStatus; label: string; tone: string; icon: typeof Clock }> = [
  { status: "PENDING_48H", label: "Évaluation 48h", tone: "border-amber-200 bg-amber-50/70", icon: Clock },
  { status: "PUBLISHED", label: "Bilan disponible", tone: "border-blue-200 bg-blue-50/70", icon: FileCheck },
  { status: "DOCUMENTS_CHECK", label: "Collecte documents", tone: "border-violet-200 bg-violet-50/70", icon: Send },
  { status: "SUBMITTED", label: "Soumission consulaire", tone: "border-indigo-200 bg-indigo-50/70", icon: Globe },
  { status: "APPROVED", label: "Visa accordé", tone: "border-emerald-200 bg-emerald-50/70", icon: CheckCircle },
];

export function filterKanbanCandidates(candidates: KanbanCandidate[], destination: string, advisor: string) {
  return candidates.filter((candidate) => (destination === "ALL" || candidate.destinationCountry === destination) && (advisor === "ALL" || (candidate.advisorName || "Non attribué") === advisor));
}

export function getDeadlineLevel(dueAt?: Date | string | null, now = Date.now()) {
  if (!dueAt) return "unspecified" as const;
  const due = new Date(dueAt);
  if (!Number.isFinite(due.getTime())) return "invalid" as const;
  const remaining = due.getTime() - now;
  if (remaining < 0) return "overdue" as const;
  if (remaining <= 24 * 60 * 60 * 1000) return "soon" as const;
  return "on_track" as const;
}

function deadlineState(dueAt?: Date | string | null) {
  if (!dueAt) return { label: "Échéance à définir", className: "border-slate-200 bg-slate-50 text-slate-600", icon: Clock };
  const due = new Date(dueAt);
  const remaining = due.getTime() - Date.now();
  if (!Number.isFinite(due.getTime())) return { label: "Échéance à vérifier", className: "border-slate-200 bg-slate-50 text-slate-600", icon: Clock };
  if (remaining < 0) return { label: `Dépassée · ${due.toLocaleDateString("fr-FR")}`, className: "border-rose-200 bg-rose-50 text-rose-800", icon: AlertTriangle };
  if (remaining <= 24 * 60 * 60 * 1000) return { label: `Bientôt · ${due.toLocaleDateString("fr-FR")}`, className: "border-amber-200 bg-amber-50 text-amber-800", icon: AlertTriangle };
  return { label: `Avant le ${due.toLocaleDateString("fr-FR")}`, className: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: Clock };
}

export function AdminCandidateKanban({ candidates, onMove, onOpen }: { candidates: KanbanCandidate[]; onMove: (candidate: KanbanCandidate, status: KanbanStatus) => void; onOpen: (candidate: KanbanCandidate) => void }) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [destinationFilter, setDestinationFilter] = useState("ALL");
  const [advisorFilter, setAdvisorFilter] = useState("ALL");
  const destinations = useMemo(() => Array.from(new Set(candidates.map((candidate) => candidate.destinationCountry).filter(Boolean))).sort(), [candidates]);
  const advisors = useMemo(() => Array.from(new Set(candidates.map((candidate) => candidate.advisorName || "Non attribué"))).sort(), [candidates]);
  const visibleCandidates = useMemo(() => filterKanbanCandidates(candidates, destinationFilter, advisorFilter), [advisorFilter, candidates, destinationFilter]);
  const grouped = useMemo(() => Object.fromEntries(columns.map((column) => [column.status, visibleCandidates.filter((candidate) => candidate.status === column.status)])) as Record<KanbanStatus, KanbanCandidate[]>, [visibleCandidates]);

  return (
    <section aria-labelledby="candidate-kanban-title" className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div><h2 id="candidate-kanban-title" className="text-xl font-black text-slate-950">Kanban des dossiers</h2><p className="text-sm text-slate-600">Déplacez un dossier vers une nouvelle étape. Chaque changement est soumis aux contrôles et à la traçabilité habituels.</p></div>
        <div className="flex flex-wrap items-center gap-2" aria-label="Filtres Kanban">
          <Select value={destinationFilter} onValueChange={setDestinationFilter}><SelectTrigger className="w-48 bg-white text-xs" aria-label="Filtrer par destination"><SelectValue placeholder="Toutes destinations" /></SelectTrigger><SelectContent><SelectItem value="ALL">Toutes destinations</SelectItem>{destinations.map((destination) => <SelectItem key={destination} value={destination}>{destination}</SelectItem>)}</SelectContent></Select>
          <Select value={advisorFilter} onValueChange={setAdvisorFilter}><SelectTrigger className="w-48 bg-white text-xs" aria-label="Filtrer par conseiller"><SelectValue placeholder="Tous les conseillers" /></SelectTrigger><SelectContent><SelectItem value="ALL">Tous les conseillers</SelectItem>{advisors.map((advisor) => <SelectItem key={advisor} value={advisor}>{advisor}</SelectItem>)}</SelectContent></Select>
          <Badge variant="outline" className="w-fit">{visibleCandidates.length} dossier(s)</Badge>
        </div>
      </div>
      <div className="grid gap-3 overflow-x-auto pb-2 xl:grid-cols-5">
        {columns.map(({ status, label, tone, icon: Icon }) => (
          <div key={status} className={`min-w-[270px] rounded-2xl border p-3 ${tone}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const candidate = candidates.find((item) => item.id === event.dataTransfer.getData("text/plain")); if (candidate && candidate.status !== status) onMove(candidate, status); setDraggedId(null); }}>
            <div className="mb-3 flex items-center justify-between gap-2"><h3 className="flex min-w-0 items-center gap-2 text-sm font-black text-slate-900"><Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{label}</span></h3><Badge className="bg-white text-slate-700">{grouped[status].length}</Badge></div>
            <div className="space-y-3" aria-label={`Dossiers : ${label}`}>
              {grouped[status].map((candidate) => {
                const deadline = deadlineState(candidate.dueAt);
                const DeadlineIcon = deadline.icon;
                return <Card key={candidate.id} draggable onDragStart={(event) => { event.dataTransfer.setData("text/plain", candidate.id); event.dataTransfer.effectAllowed = "move"; setDraggedId(candidate.id); }} onDragEnd={() => setDraggedId(null)} className={`border-slate-200 bg-white shadow-sm ${draggedId === candidate.id ? "opacity-50" : ""}`}>
                  <CardHeader className="space-y-2 pb-2"><CardTitle className="flex items-start gap-2 text-sm"><GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /><button type="button" className="min-w-0 text-left font-bold text-blue-950 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700" onClick={() => onOpen(candidate)}>{candidate.fullName}</button></CardTitle><p className="pl-6 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{candidate.folderCode}</p></CardHeader>
                  <CardContent className="space-y-3 text-xs text-slate-600"><p>{candidate.destinationCountry || "Destination à confirmer"} · {candidate.projectType || "Procédure à qualifier"}</p><p className="text-[11px] text-slate-500">Origine : {candidate.source === "AGENCY_PHYSICAL" ? "Agence" : candidate.source === "ACCOUNT_ONLY" ? "Compte créé" : "En ligne"} · Conseiller : {candidate.advisorName || "Non attribué"}</p><div className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-semibold ${deadline.className}`}><DeadlineIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>{deadline.label}</span></div><div className="rounded-md border border-slate-200 bg-slate-50/70 p-2"><p className="flex items-center gap-1 text-[11px] font-bold text-slate-700"><History className="h-3.5 w-3.5" aria-hidden="true" />Historique récent</p>{candidate.history?.length ? <ol className="mt-1.5 space-y-1 border-l border-slate-300 pl-2.5">{candidate.history.slice(0, 3).map((entry, index) => <li key={`${entry.status}-${index}`} className="text-[10px] text-slate-600"><span className="font-semibold text-slate-800">{entry.label}</span>{entry.at ? ` · ${new Date(entry.at).toLocaleDateString("fr-FR")}` : ""}</li>)}</ol> : <p className="mt-1 text-[10px] text-slate-500">Les changements apparaîtront ici.</p>}</div><Select value={candidate.status} onValueChange={(value) => onMove(candidate, value as KanbanStatus)}><SelectTrigger className="h-8 bg-white text-xs" aria-label={`Déplacer ${candidate.fullName}`}><SelectValue placeholder="Déplacer vers…" /></SelectTrigger><SelectContent>{columns.map((option) => <SelectItem key={option.status} value={option.status}>{option.label}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="sm" className="w-full" onClick={() => onOpen(candidate)}>Ouvrir la fiche</Button></CardContent>
                </Card>;
              })}
              {grouped[status].length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-4 text-center text-xs text-slate-500">Aucun dossier dans cette étape.</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AdminCandidateKanban;

