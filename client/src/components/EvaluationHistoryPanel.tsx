import { Download, FileClock, History, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OFFICIAL_CONSULAR_PORTALS } from "@/data/officialConsularPortals";
import { downloadOrientationSummaryPdf, type OrientationAlternativePdf } from "@/lib/orientationSummaryPdf";

type StoredDraft = { summary?: string; documentPriorities?: string[]; alternatives?: Array<{ country?: string; rationale?: string; checks?: string[] }>; disclaimer?: string };
const sourceKeys: Record<string, keyof typeof OFFICIAL_CONSULAR_PORTALS> = { Canada: "canada", France: "france", Belgique: "belgique", Allemagne: "allemagne", Luxembourg: "luxembourg", "Royaume-Uni": "royaume-uni" };

function parseJson<T>(value: unknown): T | null {
  if (typeof value !== "string") return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

function toLabel(projectType: string | undefined) {
  return projectType === "travail" ? "Travail" : projectType === "etudes" ? "Études" : projectType === "tourisme" ? "Tourisme" : "Projet";
}

export default function EvaluationHistoryPanel({ evaluations, candidateName, candidateEmail }: { evaluations: any[]; candidateName: string; candidateEmail: string }) {
  if (!evaluations.length) return <Card className="border-dashed border-slate-200 p-8 text-center"><History className="mx-auto h-9 w-9 text-slate-400" /><h3 className="mt-3 font-bold text-slate-950">Aucune évaluation enregistrée</h3><p className="mt-1 text-sm text-slate-600">Vos prochaines évaluations et comparaisons validées par le formulaire apparaîtront ici.</p></Card>;

  return <div className="space-y-4">{evaluations.map((evaluation) => {
    const project = parseJson<Record<string, unknown>>(evaluation.projectDetailsJson) ?? {};
    const draft = parseJson<StoredDraft>(evaluation.aiReportContent) ?? {};
    const alternatives: OrientationAlternativePdf[] = Array.isArray(draft.alternatives) ? draft.alternatives.filter((item) => typeof item?.country === "string" && typeof item?.rationale === "string").slice(0, 3).map((item) => ({ country: item.country!, rationale: item.rationale!, checks: Array.isArray(item.checks) ? item.checks.filter((check): check is string => typeof check === "string") : [], officialUrl: sourceKeys[item.country!] ? OFFICIAL_CONSULAR_PORTALS[sourceKeys[item.country!]].url : undefined })) : [];
    const destination = typeof project.destinationCountry === "string" ? project.destinationCountry : evaluation.destinationCountry || "Destination à confirmer";
    const projectType = typeof project.projectType === "string" ? project.projectType : evaluation.projectType;
    const hasDraft = Boolean(draft.summary || alternatives.length);
    return <Card key={evaluation.id} className="border-slate-200 p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-950">{toLabel(projectType)} — {destination}</h3><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800">{evaluation.status === "pending" ? "En attente de vérification" : evaluation.status}</span></div><p className="mt-1 text-xs text-slate-500">Soumise le {new Date(evaluation.createdAt).toLocaleDateString("fr-FR")}</p>{hasDraft ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{draft.summary || "Brouillon d’orientation disponible à vérifier."}</p> : <p className="mt-3 text-sm text-slate-600">Aucun brouillon comparatif n’a été demandé pour cette évaluation.</p>}</div><Button type="button" variant="outline" className="shrink-0 gap-2" onClick={() => downloadOrientationSummaryPdf({ candidateName, email: candidateEmail, destinationCountry: destination, projectType: toLabel(projectType), createdAt: evaluation.createdAt, summary: draft.summary, alternatives, documentPriorities: draft.documentPriorities, disclaimer: draft.disclaimer || "Ce récapitulatif est fondé sur les informations déclarées. Il ne vaut ni décision, ni avis juridique, ni confirmation d’éligibilité. Les sources officielles et un conseiller restent nécessaires." })}><Download className="h-4 w-4" />PDF</Button></div>{alternatives.length > 0 && <div className="mt-4 border-t border-slate-100 pt-4"><p className="flex items-center gap-2 text-sm font-black text-violet-950"><Sparkles className="h-4 w-4 text-violet-700" />Pistes comparées à vérifier</p><div className="mt-3 grid gap-3 md:grid-cols-3">{alternatives.map((alternative) => <div key={alternative.country} className="rounded-xl bg-slate-50 p-3"><p className="font-bold text-slate-950">{alternative.country}</p><p className="mt-1 text-xs leading-5 text-slate-700">{alternative.rationale}</p>{alternative.officialUrl && <a href={alternative.officialUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-bold text-blue-800 underline">Source gouvernementale ↗</a>}</div>)}</div></div>}</Card>;
  })}</div>;
}
