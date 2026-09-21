import React, { useState } from "react";
import { CheckCircle2, Circle, Clock, FileUp, Loader2, MailQuestion } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import EvaluationReportView from "@/components/EvaluationReportView";
import { CV_ACCEPT_ATTRIBUTE, CV_REQUIRED_MESSAGE, cvProblemForFile } from "@shared/evaluationCv";
import type { ClientReport } from "@shared/evaluationValidation";

export type CandidateEvaluationViewData = {
  stage: "not_started" | "pending" | "info_requested" | "published";
  pendingNotice: { title: string; body: string } | null;
  infoRequest: { message: string; items: Array<{ id: string; label: string }> } | null;
  report: ClientReport | null;
  publishedAt: string | null;
  /** CV au dossier : élément clé, l'évaluation ne peut pas être finalisée sans lui. */
  cv: { onFile: boolean; fileName: string | null };
};

/**
 * Ce que le candidat voit de son évaluation : l'avis d'attente tant que rien n'est validé, les demandes
 * de complément, puis le rapport PUBLIÉ. Aucun brouillon, score initial ou commentaire interne n'existe
 * dans les données reçues : le serveur ne les renvoie jamais.
 */
export default function CandidateEvaluationStatus({ evaluationId, view, onChanged }: { evaluationId: number; view: CandidateEvaluationViewData; onChanged?: () => void }) {
  const cvMissing = !view.cv?.onFile;
  if (view.stage === "not_started" && !cvMissing) return null;
  return (
    <div className="space-y-4" data-testid="candidate-evaluation-status">
      {cvMissing && view.stage !== "published" && <CvUploadCard evaluationId={evaluationId} onChanged={onChanged} />}
      {view.infoRequest && <InfoRequestForm evaluationId={evaluationId} request={view.infoRequest} onChanged={onChanged} />}
      {view.stage === "pending" && view.pendingNotice && (
        <Card className="border-2 border-blue-200 bg-blue-50/60 p-6" role="status" aria-labelledby="evaluation-pending-title">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-blue-700 p-3 text-white" aria-hidden="true">
              <Clock className="h-6 w-6" />
            </span>
            <div>
              <Badge className="bg-blue-100 text-blue-900">Analyse en cours</Badge>
              <h2 id="evaluation-pending-title" className="mt-2 text-xl font-black text-slate-950">
                {view.pendingNotice.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">{view.pendingNotice.body}</p>
            </div>
          </div>
          <PendingProgress cvOnFile={!cvMissing} />
        </Card>
      )}
      {view.report && <EvaluationReportView report={view.report} />}
    </div>
  );
}

type StepState = "done" | "active" | "todo";

/** Les quatre étapes de la finalisation ; sans CV, c'est lui qui est attendu et la vérification par l'équipe n'a pas commencé. */
function pendingSteps(cvOnFile: boolean): Array<{ label: string; state: StepState }> {
  return [
    { label: "Dossier reçu", state: "done" },
    { label: cvOnFile ? "CV joint" : "CV à ajouter", state: cvOnFile ? "done" : "active" },
    { label: "Vérification par notre équipe", state: cvOnFile ? "active" : "todo" },
    { label: "Évaluation publiée dans votre espace", state: "todo" },
  ];
}

/**
 * Avancement affiché tant que rien n'est publié : quatre étapes et un message de statut clair. Il ne dit rien du
 * contenu ni de la manière dont l'évaluation est préparée ; les animations s'arrêtent si l'appareil demande de
 * réduire les mouvements.
 */
function PendingProgress({ cvOnFile }: { cvOnFile: boolean }) {
  return (
    <div className="mt-5" data-testid="evaluation-progress">
      <ol aria-label="Avancement de votre évaluation" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {pendingSteps(cvOnFile).map((step) => (
          <li
            key={step.label}
            aria-current={step.state === "active" ? "step" : undefined}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${step.state === "active" ? "border-blue-300 bg-white font-semibold text-blue-950" : step.state === "done" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-slate-50 text-slate-500"}`}
          >
            {step.state === "done" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : step.state === "active" ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-700 motion-reduce:animate-none" aria-hidden="true" data-testid="evaluation-progress-spinner" />
            ) : (
              <Circle className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{step.label}</span>
          </li>
        ))}
      </ol>
      <div className="mt-3 h-1.5 overflow-hidden rounded bg-blue-100" aria-hidden="true">
        <div className="h-full w-1/2 animate-pulse rounded bg-blue-600 motion-reduce:animate-none" />
      </div>
      <p className="mt-3 text-sm font-medium text-blue-950">
        {cvOnFile
          ? "Statut : vérification en cours par notre équipe. Vous n’avez rien à faire pour le moment ; vous serez notifié dès la publication de votre évaluation."
          : "Statut : en attente de votre CV. Ajoutez-le ci-dessus : sans lui, votre évaluation ne peut pas être finalisée."}
      </p>
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });
}

/** Dépôt du CV depuis l'espace candidat : contrôlé ici (type, taille), puis re-contrôlé par le serveur sur le contenu du fichier. */
function CvUploadCard({ evaluationId, onChanged }: { evaluationId: number; onChanged?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const attach = trpc.evaluationValidation.attachCv.useMutation({
    onSuccess: () => {
      toast.success("Merci, votre CV a bien été ajouté à votre dossier.");
      setFile(null);
      onChanged?.();
    },
    onError: (error: { message?: string }) => setProblem(error.message || "Envoi du CV impossible pour le moment."),
  });

  const choose = (selected: File | null) => {
    setFile(null);
    setProblem(null);
    if (!selected) return;
    const found = cvProblemForFile(selected);
    if (found) {
      setProblem(found);
      return;
    }
    setFile(selected);
  };

  const send = async () => {
    if (!file || attach.isPending) return;
    setProblem(null);
    try {
      attach.mutate({ evaluationId, fileName: file.name, base64: await readAsDataUrl(file) });
    } catch {
      setProblem("Lecture du fichier impossible. Choisissez-le de nouveau.");
    }
  };

  return (
    <Card className="border-2 border-amber-300 bg-amber-50 p-6" role="region" aria-labelledby="evaluation-cv-title" data-testid="cv-upload-card">
      <div className="flex items-start gap-4">
        <span className="rounded-2xl bg-amber-600 p-3 text-white" aria-hidden="true">
          <FileUp className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Action requise</p>
          <h2 id="evaluation-cv-title" className="mt-1 text-xl font-black text-slate-950">
            Ajoutez votre CV pour finaliser votre évaluation
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-800">{CV_REQUIRED_MESSAGE} PDF, JPG ou PNG, 5 Mo maximum.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center rounded-md border border-amber-400 bg-white px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">
              {file ? "Choisir un autre fichier" : "Choisir mon CV"}
              <input type="file" accept={CV_ACCEPT_ATTRIBUTE} className="sr-only" aria-label="Fichier du CV" onChange={(event) => choose(event.target.files?.[0] ?? null)} />
            </label>
            {file && <span className="max-w-full truncate text-sm text-slate-800">{file.name}</span>}
            <Button type="button" disabled={!file || attach.isPending} onClick={send} className="bg-amber-700 text-white hover:bg-amber-800">
              {attach.isPending ? "Envoi…" : "Envoyer mon CV"}
            </Button>
          </div>
          {problem && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-700">
              {problem}
            </p>
          )}
          <p className="mt-3 text-xs text-amber-900">Votre CV n’est lu que par notre équipe pour préparer votre évaluation.</p>
        </div>
      </div>
    </Card>
  );
}

function InfoRequestForm({ evaluationId, request, onChanged }: { evaluationId: number; request: NonNullable<CandidateEvaluationViewData["infoRequest"]>; onChanged?: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const respond = trpc.evaluationValidation.respondToInfoRequest.useMutation({
    onSuccess: () => {
      toast.success("Merci, vos réponses ont été transmises à notre équipe.");
      onChanged?.();
    },
    onError: (error: { message?: string }) => toast.error(error.message || "Envoi impossible pour le moment."),
  });
  const filled = request.items.some((item) => (answers[item.id] ?? "").trim()) || note.trim().length > 0;

  return (
    <Card className="border-2 border-amber-300 bg-amber-50 p-6" role="region" aria-labelledby="evaluation-info-title">
      <div className="flex items-start gap-4">
        <span className="rounded-2xl bg-amber-600 p-3 text-white" aria-hidden="true">
          <MailQuestion className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Action requise</p>
          <h2 id="evaluation-info-title" className="mt-1 text-xl font-black text-slate-950">
            Informations complémentaires demandées
          </h2>
          {request.message && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-800">{request.message}</p>}
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!filled || respond.isPending) return;
              respond.mutate({ evaluationId, answers: request.items.map((item) => ({ id: item.id, answer: (answers[item.id] ?? "").trim() })).filter((entry) => entry.answer), note: note.trim() });
            }}
          >
            {request.items.map((item) => (
              <label key={item.id} className="block text-sm font-medium text-slate-800">
                {item.label}
                <Textarea value={answers[item.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={2000} rows={3} className="mt-1 bg-white" />
              </label>
            ))}
            <label className="block text-sm font-medium text-slate-800">
              Précisions (facultatif)
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={2} className="mt-1 bg-white" />
            </label>
            <p className="text-xs text-amber-900">N’écrivez ici ni numéro de passeport, ni coordonnées bancaires : les documents se déposent dans votre espace sécurisé.</p>
            <Button type="submit" disabled={!filled || respond.isPending} className="bg-amber-700 text-white hover:bg-amber-800">
              {respond.isPending ? "Envoi…" : "Envoyer mes réponses"}
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}
