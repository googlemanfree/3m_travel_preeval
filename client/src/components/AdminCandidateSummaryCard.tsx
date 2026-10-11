import { useEffect, useState } from "react";
import { CheckCircle2, Download, FileText, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = { sessionToken: string; candidateId: number };
const labels: Record<string, string> = { draft: "Brouillon", approved: "Validée", rejected: "Refusée", needs_revalidation: "À revalider" };

export default function AdminCandidateSummaryCard({ sessionToken, candidateId }: Props) {
  const query = trpc.placementPortal.adminGetCandidateSummary.useQuery({ sessionToken, candidateId }, { enabled: candidateId > 0, retry: false });
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const review = trpc.placementPortal.adminReviewCandidateSummary.useMutation({
    onSuccess: (result) => { toast.success(result.status === "approved" ? "Fiche validée et PDF généré." : "Fiche refusée avec motif enregistré."); void query.refetch(); },
    onError: (error) => toast.error(error.message),
  });
  useEffect(() => { if (query.data?.draft) setDraft(JSON.stringify(query.data.draft, null, 2)); }, [query.data?.draft]);
  if (query.error) return null;
  if (query.isLoading || !query.data) return <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 text-sm text-indigo-900">Chargement de la fiche synthèse…</section>;
  const data = query.data;
  const status = data.status;
  const pdfUrl = (data as any).pdfUrl as string | undefined;
  return <section className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm" data-testid="admin-candidate-summary-card">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="flex items-center gap-2 font-semibold text-slate-950"><FileText className="h-4 w-4 text-indigo-700" />Fiche synthèse employeur / agence</h4><p className="mt-1 text-sm text-slate-600">Une page, identité externe anonymisée, pièces normalisées et contact via 3M uniquement.</p></div><Badge className={status === "approved" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : status === "needs_revalidation" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-700"}>{labels[status] || status}</Badge></div>
    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><p><strong>Consentement PDF :</strong> {data.pdfShareConsent ? "Oui" : "Non"}</p><p><strong>Consentement photo :</strong> {data.photoShareConsent ? "Oui" : "Non"}</p><p><strong>Soumissions :</strong> {data.submissionCount}</p><p><strong>Profil :</strong> {data.profileCode}</p></div>
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-2"><p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">Prévisualisation PDF avant validation</p><iframe title="Prévisualisation de la fiche synthèse PDF" src={(data as any).previewPdfDataUrl} className="mt-2 h-72 w-full rounded border bg-slate-50" /></div>
    <label className="mt-4 block text-sm font-semibold text-slate-800">Brouillon JSON éditable <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={12} className="mt-2 bg-white font-mono text-xs" /></label>
    <label className="mt-3 block text-sm font-semibold text-slate-800">Note de revue <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1500} rows={2} className="mt-2 bg-white" placeholder="Motif de correction ou décision admin…" /></label>
    <div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw className="mr-1 h-4 w-4" />Reconstruire les pièces</Button><Button type="button" className="bg-emerald-700 hover:bg-emerald-800" disabled={review.isPending || draft.trim().length < 50 || !data.pdfShareConsent} onClick={() => review.mutate({ sessionToken, profileId: data.profileId, action: "approve", draft, note: note.trim() || undefined })}><CheckCircle2 className="mr-1 h-4 w-4" />Valider et générer le PDF</Button><Button type="button" variant="outline" className="border-rose-300 text-rose-800 hover:bg-rose-50" disabled={review.isPending || draft.trim().length < 50} onClick={() => review.mutate({ sessionToken, profileId: data.profileId, action: "reject", draft, note: note.trim() || undefined })}><XCircle className="mr-1 h-4 w-4" />Refuser</Button>{pdfUrl && <a href={pdfUrl} download className="inline-flex h-9 items-center rounded-md border border-indigo-200 bg-white px-3 text-sm font-semibold text-indigo-800 hover:bg-indigo-50"><Download className="mr-1 h-4 w-4" />Télécharger / prévisualiser le PDF</a>}</div>
    <p className="mt-3 text-xs leading-5 text-slate-600">Le téléchargement partenaire reste bloqué tant que la fiche n’est pas validée, que le consentement PDF n’est pas actif et qu’une soumission contrôlée n’existe pas.</p>
  </section>;
}
