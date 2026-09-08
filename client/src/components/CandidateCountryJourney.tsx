import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Download, ExternalLink, Eye, FileCheck2, MapPinned, ListChecks, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";
import { getCandidateJourney, journeyStepIndex, type CandidateJourney, type JourneyDocument } from "@shared/candidateJourneyCatalog";
import { procedures107Complete } from "@/data/procedures107Complete";
import { OFFICIAL_SOURCE_CATALOG } from "@shared/officialSourceCatalog";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  destination?: string | null;
  visaType?: string | null;
  procedureLabel?: string | null;
  dossierStatus?: string | null;
  evaluationStatus?: string | null;
  evaluationClientConfirmed?: boolean;
  activationRequested?: boolean;
  paymentConfirmed?: boolean;
  documents?: Array<{ documentName?: string | null; documentType?: string | null; documentUrl?: string | null; verificationStatus?: string | null }>;
};

export function CandidateCountryJourney({ destination, visaType, procedureLabel, dossierStatus, evaluationStatus, evaluationClientConfirmed, activationRequested, paymentConfirmed, documents = [] }: Props) {
  const [previewDocument, setPreviewDocument] = useState<{ title: string; url: string; fileType: string } | null>(null);
  const { toast } = useToast();
  const checklistQuery = trpc.candidate.getProcedureChecklist.useQuery(undefined, { retry: false });
  const trpcUtils = trpc.useUtils();
  const checklistMutation = trpc.candidate.updateProcedureChecklist.useMutation({
    onSuccess: async (result) => {
      toast({ title: "Checklist sauvegardée", description: result.message });
      await checklistQuery.refetch();
      await trpcUtils.candidate.getMyDossierData.invalidate();
    },
    onError: (error) => toast({ title: "Checklist non sauvegardée", description: error.message, variant: "destructive" }),
  });
  const baseJourney = getCandidateJourney(destination, visaType, procedureLabel);
  const normalize = (value: string | null | undefined) => (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const destinationKey = normalize(destination);
  const officialRecord = OFFICIAL_SOURCE_CATALOG[destinationKey];
  const visaKey = normalize(`${visaType || ""} ${procedureLabel || ""}`);
  const procedureKind = visaKey.includes("travail") || visaKey.includes("worker") || visaKey.includes("emploi") ? "travail" : visaKey.includes("etud") || visaKey.includes("study") ? "etudes" : "visiteur";
  const catalogueProcedure = officialRecord?.verificationStatus === "verified" ? procedures107Complete.find((item) => normalize(item.name) === destinationKey && item.visaType === procedureKind) : undefined;
  const journey: CandidateJourney = catalogueProcedure ? {
    ...baseJourney,
    title: `${catalogueProcedure.name} · ${catalogueProcedure.visaType === "travail" ? "Travail" : catalogueProcedure.visaType === "etudes" ? "Études" : "Visiteur"}`,
    steps: catalogueProcedure.steps.map((label, index) => ({ id: `${catalogueProcedure.id}-${index + 1}`, label, description: "Étape de préparation issue du guide de procédure associé. Vérifiez toujours la version et les exigences du portail institutionnel.", requiredInputs: catalogueProcedure.requiredDocuments.flatMap((group) => group.documents).slice(index === 0 ? 0 : Math.max(0, index - 1) * 2, index === catalogueProcedure.steps.length - 1 ? undefined : index * 2 + 2), documents: catalogueProcedure.requiredDocuments.flatMap((group) => group.documents).slice(index === 0 ? 0 : Math.max(0, index - 1) * 2, index === catalogueProcedure.steps.length - 1 ? undefined : index * 2 + 2).map((input, documentIndex) => ({ id: `${catalogueProcedure.id}-${index + 1}-document-${documentIndex + 1}`, label: input, kind: "to_prepare" as const, sourceUrl: baseJourney.officialSources[0] ?? "" })), sourceUrl: baseJourney.officialSources[0] ?? "" })),
  } : baseJourney;
  const currentIndex = journeyStepIndex(journey, dossierStatus, evaluationStatus, { evaluationClientConfirmed, activationRequested, paymentConfirmed });
  const normalizedDocument = (value: string | null | undefined) => normalize(value).replace(/document|piece|justificatif/g, "").trim();
  const documentsForStep = (stepDocuments: JourneyDocument[]) => documents.filter((document) => stepDocuments.some((expected) => {
    const expectedKey = normalizedDocument(expected.label);
    const actualKey = normalizedDocument(`${document.documentName || ""} ${document.documentType || ""}`);
    return expectedKey && (actualKey.includes(expectedKey) || expectedKey.includes(actualKey));
  }));
  const persistedStepIds = useMemo(() => new Set(checklistQuery.data?.data?.completedStepIds ?? []), [checklistQuery.data?.data?.completedStepIds]);
  const checklistCurrentIndex = checklistQuery.data?.data?.currentIndex ?? currentIndex;
  const completedIndex = Math.max(-1, currentIndex - 1);
  const checklistCompletedCount = Array.from(persistedStepIds).filter((stepId) => /^checklist-\d+$/.test(stepId)).length;
  const officialCompletedCount = Math.max(0, currentIndex);
  const completedStepCount = Math.min(journey.steps.length, Math.max(officialCompletedCount, checklistCompletedCount));
  const progress = journey.steps.length ? Math.round((completedStepCount / journey.steps.length) * 100) : 0;

  return (
    <Card className="border-blue-100 bg-white shadow-sm" aria-labelledby="candidate-country-journey-title">
      <DocumentPreviewModal
        isOpen={Boolean(previewDocument)}
        onClose={() => setPreviewDocument(null)}
        documentTitle={previewDocument?.title || ""}
        documentUrl={previewDocument?.url || ""}
        fileType={previewDocument?.fileType || ""}
      />
      <CardHeader className="border-b border-blue-50 bg-gradient-to-r from-blue-950 to-blue-800 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-200"><MapPinned className="h-4 w-4" aria-hidden="true" />Parcours synchronisé</p>
            <CardTitle id="candidate-country-journey-title" className="mt-2 text-xl text-white">{journey.title}</CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Les étapes affichées correspondent à la destination et au type de visa enregistrés dans votre dossier.</p>
          </div>
          <Badge className="bg-white/15 text-white hover:bg-white/15">{progress}% préparé</Badge>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-label="Avancement du parcours" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-amber-300" style={{ width: `${progress}%` }} /></div>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-4" aria-labelledby="procedure-checklist-title">
          <div className="mb-4 rounded-lg border border-blue-200 bg-white/80 p-3" aria-labelledby="checklist-progress-title">
            <div className="flex flex-wrap items-center justify-between gap-2"><p id="checklist-progress-title" className="text-xs font-black uppercase tracking-[0.12em] text-blue-950">Progression du parcours</p><p className="text-sm font-black text-blue-900">{progress}% <span className="font-medium text-slate-600">({completedStepCount}/{journey.steps.length} étapes)</span></p></div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-blue-100" role="progressbar" aria-label={`Pourcentage d’accomplissement du parcours : ${progress}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-blue-700 transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
            <p className="mt-2 text-xs leading-5 text-slate-600">Le pourcentage combine l’avancement officiel du dossier et les étapes que vous avez cochées dans votre checklist.</p>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2"><ListChecks className="mt-0.5 h-5 w-5 text-blue-800" aria-hidden="true" /><div><h3 id="procedure-checklist-title" className="font-bold text-blue-950">Ma checklist de procédure</h3><p className="mt-1 text-sm leading-5 text-blue-900">Cochez uniquement les actions que vous avez personnellement vérifiées. Les étapes à venir restent verrouillées jusqu’à la validation du dossier.</p></div></div>
            {checklistQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-blue-700" aria-label="Mise à jour de la checklist" />}
          </div>
          {checklistQuery.isError && <p className="mt-3 text-xs font-semibold text-amber-800">Le suivi personnel n’est pas disponible pour le moment ; la progression officielle du dossier reste affichée.</p>}
        </section>
        <ol className="space-y-3" aria-label={`Étapes ${journey.title}`}>
          {journey.steps.map((item, index) => {
            const isComplete = index < completedIndex;
            const isCurrent = index === currentIndex;
            const checklistStepId = `checklist-${index}`;
            const isChecklistComplete = persistedStepIds.has(checklistStepId);
            const canCheck = index <= checklistCurrentIndex;
            return <li key={item.id} title={isComplete ? "Cette étape est validée." : isCurrent ? "Cette étape est en cours : suivez l’action et les documents indiqués." : "Cette étape sera disponible après validation des étapes précédentes."} aria-label={`${index + 1}. ${item.label}. ${isComplete ? "Étape validée" : isCurrent ? "Action à réaliser maintenant" : "Étape à venir"}`} className={`rounded-xl border p-4 ${isCurrent ? "border-amber-300 bg-amber-50" : isComplete ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50/60"}`}>
              <div className="flex items-start gap-3">
                {isComplete ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-label="Étape validée" /> : isCurrent ? <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-label="Étape en cours" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-label="Étape à venir" />}
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-950">{index + 1}. {item.label}</h3><div className="flex flex-wrap items-center gap-2">{isCurrent && <Badge className="bg-amber-600 text-white">Étape actuelle</Badge>}{isComplete && <Badge className="bg-emerald-600 text-white">Validée</Badge>}{canCheck && <label className="inline-flex min-h-8 items-center gap-2 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-blue-900 ring-1 ring-blue-200"><input type="checkbox" checked={isChecklistComplete} disabled={checklistMutation.isPending || checklistQuery.isError} onChange={(event) => checklistMutation.mutate({ stepId: checklistStepId, checked: event.target.checked })} className="h-4 w-4 rounded border-blue-300 text-blue-700 focus:ring-blue-500" aria-label={`${isChecklistComplete ? "Retirer" : "Cocher"} ${item.label} dans ma checklist`} />{isChecklistComplete ? "Fait" : "Je l’ai vérifiée"}</label>}</div></div><p className="mt-1 text-sm leading-6 text-slate-700">{item.description}</p><div className="mt-2 flex flex-wrap gap-1.5">{item.requiredInputs.map((input) => <span key={input} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">{input}</span>)}</div><div className="mt-3 rounded-lg border border-slate-200 bg-white/80 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-600">Documents de cette étape</p><div className="mt-2 space-y-1.5">{item.documents.map((document) => { const uploaded = documentsForStep(item.documents).find((candidate) => normalizedDocument(`${candidate.documentName || ""} ${candidate.documentType || ""}`).includes(normalizedDocument(document.label))); return <div key={document.id} className="flex items-center justify-between gap-2 text-xs"><span className="font-medium text-slate-700">{document.label}</span>{uploaded?.documentUrl ? <span className="inline-flex items-center gap-1"><button type="button" onClick={() => setPreviewDocument({ title: uploaded.documentName || document.label, url: uploaded.documentUrl!, fileType: uploaded.documentType || "" })} className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 py-1 font-semibold text-blue-700 underline underline-offset-2 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" title={`Prévisualiser ${uploaded.documentName || document.label}`} aria-label={`Prévisualiser ${uploaded.documentName || document.label}`}><Eye className="h-3.5 w-3.5" aria-hidden="true" />Aperçu</button><a href={uploaded.documentUrl} download={uploaded.documentName || document.label} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 py-1 font-semibold text-emerald-700 underline underline-offset-2 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" title={`Télécharger ${uploaded.documentName || document.label}`} aria-label={`Télécharger ${uploaded.documentName || document.label}`}><Download className="h-3.5 w-3.5" aria-hidden="true" />Télécharger</a></span> : <span className="text-amber-700" title={`Document requis : ${document.label}. À préparer avant cette étape.`}>À préparer</span>}</div>; })}</div></div>{officialRecord?.sources.length ? <div className="mt-3 space-y-1.5"><p className="text-xs font-semibold text-slate-600">Sources institutionnelles ({officialRecord.verificationStatus === "verified" ? "vérifiées" : "à contrôler"})</p>{officialRecord.sources.slice(0, 4).map((source) => <a key={source.url} className="flex items-start gap-1.5 text-xs font-semibold text-blue-700 underline underline-offset-2" href={source.url} target="_blank" rel="noreferrer"><span className="min-w-0 flex-1">{source.label}</span><ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /></a>)}</div> : item.sourceUrl ? <a className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 underline underline-offset-2" href={item.sourceUrl} target="_blank" rel="noreferrer">Source officielle à consulter <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a> : <p className="mt-3 text-xs font-semibold text-amber-800">Source institutionnelle à vérifier avant toute démarche.</p>}</div>
              </div>
            </li>;
          })}
        </ol>
        <p className="border-t border-slate-200 pt-4 text-xs leading-5 text-slate-600">{journey.disclaimer}</p>
      </CardContent>
    </Card>
  );
}
