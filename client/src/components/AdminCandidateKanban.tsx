import { useMemo, useState } from "react";
import { CheckCircle, Clock, FileCheck, Globe, GripVertical, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type KanbanStatus = "PENDING_48H" | "PUBLISHED" | "DOCUMENTS_CHECK" | "SUBMITTED" | "APPROVED";
export interface KanbanCandidate { id: string; fullName: string; folderCode: string; destinationCountry: string; projectType: string; status: string; source: string; }

const columns: Array<{ status: KanbanStatus; label: string; tone: string; icon: typeof Clock }> = [
  { status: "PENDING_48H", label: "Évaluation 48h", tone: "border-amber-200 bg-amber-50/70", icon: Clock },
  { status: "PUBLISHED", label: "Bilan disponible", tone: "border-blue-200 bg-blue-50/70", icon: FileCheck },
  { status: "DOCUMENTS_CHECK", label: "Collecte documents", tone: "border-violet-200 bg-violet-50/70", icon: Send },
  { status: "SUBMITTED", label: "Soumission consulaire", tone: "border-indigo-200 bg-indigo-50/70", icon: Globe },
  { status: "APPROVED", label: "Visa accordé", tone: "border-emerald-200 bg-emerald-50/70", icon: CheckCircle },
];

export function AdminCandidateKanban({ candidates, onMove, onOpen }: { candidates: KanbanCandidate[]; onMove: (candidate: KanbanCandidate, status: KanbanStatus) => void; onOpen: (candidate: KanbanCandidate) => void }) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const grouped = useMemo(() => Object.fromEntries(columns.map((column) => [column.status, candidates.filter((candidate) => candidate.status === column.status)])) as Record<KanbanStatus, KanbanCandidate[]>, [candidates]);

  return (
    <section aria-labelledby="candidate-kanban-title" className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="candidate-kanban-title" className="text-xl font-black text-slate-950">Kanban des dossiers</h2><p className="text-sm text-slate-600">Déplacez un dossier vers une nouvelle étape. Chaque changement est soumis aux contrôles et à la traçabilité habituels.</p></div><Badge variant="outline" className="w-fit">{candidates.length} dossier(s) affiché(s)</Badge></div>
      <div className="grid gap-3 overflow-x-auto pb-2 xl:grid-cols-5">
        {columns.map(({ status, label, tone, icon: Icon }) => (
          <div key={status} className={`min-w-[245px] rounded-2xl border p-3 ${tone}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const candidate = candidates.find((item) => item.id === event.dataTransfer.getData("text/plain")); if (candidate && candidate.status !== status) onMove(candidate, status); setDraggedId(null); }}>
            <div className="mb-3 flex items-center justify-between gap-2"><h3 className="flex min-w-0 items-center gap-2 text-sm font-black text-slate-900"><Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">{label}</span></h3><Badge className="bg-white text-slate-700">{grouped[status].length}</Badge></div>
            <div className="space-y-3" aria-label={`Dossiers : ${label}`}>
              {grouped[status].map((candidate) => (
                <Card key={candidate.id} draggable onDragStart={(event) => { event.dataTransfer.setData("text/plain", candidate.id); event.dataTransfer.effectAllowed = "move"; setDraggedId(candidate.id); }} onDragEnd={() => setDraggedId(null)} className={`border-slate-200 bg-white shadow-sm ${draggedId === candidate.id ? "opacity-50" : ""}`}>
                  <CardHeader className="space-y-2 pb-2"><CardTitle className="flex items-start gap-2 text-sm"><GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /><button type="button" className="min-w-0 text-left font-bold text-blue-950 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700" onClick={() => onOpen(candidate)}>{candidate.fullName}</button></CardTitle><p className="pl-6 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{candidate.folderCode}</p></CardHeader>
                  <CardContent className="space-y-3 text-xs text-slate-600"><p>{candidate.destinationCountry || "Destination à confirmer"} · {candidate.projectType || "Procédure à qualifier"}</p><p className="text-[11px] text-slate-500">Origine : {candidate.source === "AGENCY_PHYSICAL" ? "Agence" : candidate.source === "ACCOUNT_ONLY" ? "Compte créé" : "En ligne"}</p><Select value={candidate.status} onValueChange={(value) => onMove(candidate, value as KanbanStatus)}><SelectTrigger className="h-8 bg-white text-xs" aria-label={`Déplacer ${candidate.fullName}`}><SelectValue placeholder="Déplacer vers…" /></SelectTrigger><SelectContent>{columns.map((option) => <SelectItem key={option.status} value={option.status}>{option.label}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="sm" className="w-full" onClick={() => onOpen(candidate)}>Ouvrir la fiche</Button></CardContent>
                </Card>
              ))}
              {grouped[status].length === 0 && <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-4 text-center text-xs text-slate-500">Aucun dossier dans cette étape.</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AdminCandidateKanban;
