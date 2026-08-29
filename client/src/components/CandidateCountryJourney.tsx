import { useState } from "react";
import { CheckCircle2, Circle, ExternalLink, Eye, FileCheck2, MapPinned } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";
import { getCandidateJourney, journeyStepIndex, type CandidateJourney, type JourneyDocument } from "@shared/candidateJourneyCatalog";
import { procedures107Complete } from "@/data/procedures107Complete";
import { OFFICIAL_SOURCE_CATALOG } from "@shared/officialSourceCatalog";

type Props = {
  destination?: string | null;
  visaType?: string | null;
  procedureLabel?: string | null;
  dossierStatus?: string | null;
  evaluationStatus?: string | null;
  documents?: Array<{ documentName?: string | null; documentType?: string | null; documentUrl?: string | null; verificationStatus?: string | null }>;
};

export function CandidateCountryJourney({ destination, visaType, procedureLabel, dossierStatus, evaluationStatus, documents = [] }: Props) {
  const [previewDocument, setPreviewDocument] = useState<{ title: string; url: string; fileType: string } | null>(null);
  const baseJourney = getCandidateJourney(destination, visaType, procedureLabel);
  const normalize = (value: string | null | undefined) => (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const destinationKey = normalize(destination);
  const officialRecord = OFFICIAL_SOURCE_CATALOG[destinationKey];
  const visaKey = normalize(`${visaType || ""} ${procedureLabel || ""}`);
  const procedureKind = visaKey.includes("travail") || visaKey.includes("worker") || visaKey.includes("emploi") ? "travail" : visaKey.includes("etud") || visaKey.includes("study") ? "etudes" : "visiteur";
  const catalogueProcedure = procedures107Complete.find((item) => normalize(item.name) === destinationKey && item.visaType === procedureKind);
  const journey: CandidateJourney = catalogueProcedure ? {
    ...baseJourney,
    title: `${catalogueProcedure.name} · ${catalogueProcedure.visaType === "travail" ? "Travail" : catalogueProcedure.visaType === "etudes" ? "Études" : "Visiteur"}`,
    steps: catalogueProcedure.steps.map((label, index) => ({ id: `${catalogueProcedure.id}-${index + 1}`, label, description: "Étape de préparation issue du guide de procédure associé. Vérifiez toujours la version et les exigences du portail institutionnel.", requiredInputs: catalogueProcedure.requiredDocuments.flatMap((group) => group.documents).slice(index === 0 ? 0 : Math.max(0, index - 1) * 2, index === catalogueProcedure.steps.length - 1 ? undefined : index * 2 + 2), documents: catalogueProcedure.requiredDocuments.flatMap((group) => group.documents).slice(index === 0 ? 0 : Math.max(0, index - 1) * 2, index === catalogueProcedure.steps.length - 1 ? undefined : index * 2 + 2).map((input, documentIndex) => ({ id: `${catalogueProcedure.id}-${index + 1}-document-${documentIndex + 1}`, label: input, kind: "to_prepare" as const, sourceUrl: baseJourney.officialSources[0] ?? "" })), sourceUrl: baseJourney.officialSources[0] ?? "" })),
  } : baseJourney;
  const currentIndex = journeyStepIndex(journey, dossierStatus, evaluationStatus);
  const normalizedDocument = (value: string | null | undefined) => normalize(value).replace(/document|piece|justificatif/g, "").trim();
  const documentsForStep = (stepDocuments: JourneyDocument[]) => documents.filter((document) => stepDocuments.some((expected) => {
    const expectedKey = normalizedDocument(expected.label);
    const actualKey = normalizedDocument(`${document.documentName || ""} ${document.documentType || ""}`);
    return expectedKey && (actualKey.includes(expectedKey) || expectedKey.includes(actualKey));
  }));
  const completedIndex = Math.max(-1, currentIndex - 1);
  const progress = Math.round(((completedIndex + 1) / journey.steps.length) * 100);

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
        <ol className="space-y-3" aria-label={`Étapes ${journey.title}`}>
          {journey.steps.map((item, index) => {
            const isComplete = index < completedIndex;
            const isCurrent = index === currentIndex;
            return <li key={item.id} className={`rounded-xl border p-4 ${isCurrent ? "border-amber-300 bg-amber-50" : isComplete ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50/60"}`}>
              <div className="flex items-start gap-3">
                {isComplete ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-label="Étape validée" /> : isCurrent ? <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-label="Étape en cours" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-label="Étape à venir" />}
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-950">{index + 1}. {item.label}</h3>{isCurrent && <Badge className="bg-amber-600 text-white">Étape actuelle</Badge>}{isComplete && <Badge className="bg-emerald-600 text-white">Validée</Badge>}</div><p className="mt-1 text-sm leading-6 text-slate-700">{item.description}</p><div className="mt-2 flex flex-wrap gap-1.5">{item.requiredInputs.map((input) => <span key={input} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">{input}</span>)}</div><div className="mt-3 rounded-lg border border-slate-200 bg-white/80 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-600">Documents de cette étape</p><div className="mt-2 space-y-1.5">{item.documents.map((document) => { const uploaded = documentsForStep(item.documents).find((candidate) => normalizedDocument(`${candidate.documentName || ""} ${candidate.documentType || ""}`).includes(normalizedDocument(document.label))); return <div key={document.id} className="flex items-center justify-between gap-2 text-xs"><span className="font-medium text-slate-700">{document.label}</span>{uploaded?.documentUrl ? <button type="button" onClick={() => setPreviewDocument({ title: uploaded.documentName || document.label, url: uploaded.documentUrl!, fileType: uploaded.documentType || "" })} className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 py-1 font-semibold text-blue-700 underline underline-offset-2 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><Eye className="h-3.5 w-3.5" aria-hidden="true" />Aperçu</button> : <span className="text-amber-700">À préparer</span>}</div>; })}</div></div>{officialRecord?.sources.length ? <div className="mt-3 space-y-1.5"><p className="text-xs font-semibold text-slate-600">Sources institutionnelles ({officialRecord.verificationStatus === "verified" ? "vérifiées" : "à contrôler"})</p>{officialRecord.sources.slice(0, 4).map((source) => <a key={source.url} className="flex items-start gap-1.5 text-xs font-semibold text-blue-700 underline underline-offset-2" href={source.url} target="_blank" rel="noreferrer"><span className="min-w-0 flex-1">{source.label}</span><ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /></a>)}</div> : item.sourceUrl ? <a className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 underline underline-offset-2" href={item.sourceUrl} target="_blank" rel="noreferrer">Source officielle à consulter <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a> : <p className="mt-3 text-xs font-semibold text-amber-800">Source institutionnelle à vérifier avant toute démarche.</p>}</div>
              </div>
            </li>;
          })}
        </ol>
        <p className="border-t border-slate-200 pt-4 text-xs leading-5 text-slate-600">{journey.disclaimer}</p>
      </CardContent>
    </Card>
  );
}
