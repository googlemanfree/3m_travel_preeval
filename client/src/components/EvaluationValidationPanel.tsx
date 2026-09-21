import React, { useEffect, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { AlertTriangle, CheckCircle2, FileText, Loader2, Mail, MailQuestion, RefreshCw, Save, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import EvaluationReportView from "@/components/EvaluationReportView";
import EvaluationVersionForm from "@/components/EvaluationVersionForm";
import { availabilityFor, describeValue, linesToList, sameVersion } from "@/lib/evaluationValidationForm";
import { CV_MISSING_FOR_PUBLICATION } from "@shared/evaluationCv";
import { ADMIN_DRAFT_BADGE, AI_DRAFT_LABEL, NOTIFICATION_PORTAL_PLACEHOLDER, PUBLICATION_CHECKLIST, ROUTE_LABELS, SCORE_CRITERIA, SUGGESTED_STATUS_LABELS, WORKFLOW_STATUS_LABELS, missingChecklistItems, type AdminEvaluationVersion } from "@shared/evaluationValidation";
import type { AppRouter } from "../../../server/routers";

type CaseView = NonNullable<inferRouterOutputs<AppRouter>["evaluationValidation"]["getCase"]["view"]>;

const EXTRACTED_LABELS: Record<string, string> = {
  fullName: "Nom",
  ageOrBirthDate: "Âge / naissance",
  nationality: "Nationalité",
  residenceCountry: "Résidence",
  passportAvailable: "Passeport disponible",
  profession: "Profession",
  professionalLevel: "Niveau professionnel",
  diplomas: "Diplômes",
  verifiableExperienceYears: "Années d’expérience déclarées",
  skills: "Compétences",
  languages: "Langues",
  budget: "Budget",
  documentsAvailable: "Documents disponibles",
  documentsMissing: "Documents manquants",
};

function errorMessage(error: unknown): string {
  const message = error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : "";
  if (!message) return "Action impossible pour le moment.";
  // une validation de formulaire côté serveur arrive sous forme de liste JSON d'anomalies : on en tire la première, lisible
  if (message.trim().startsWith("[")) {
    try {
      const issues = JSON.parse(message) as Array<{ path?: Array<string | number>; message?: string }>;
      const first = issues[0];
      if (first?.message) return `Champ « ${(first.path ?? []).join(".") || "formulaire"} » invalide : ${first.message}`;
    } catch {
      // message non JSON : affiché tel quel
    }
  }
  return message;
}

function formatExtracted(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Non renseigné";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (Array.isArray(value)) return value.length ? value.join(" · ") : "Non renseigné";
  return String(value);
}

function AiDraftZone({ view }: { view: CaseView }) {
  const draft = view.case.aiDraft;
  if (!draft) {
    return <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Aucun brouillon IA pour cette version{view.case.aiDraftError ? " : la génération a échoué, saisissez la version administrateur à la main." : "."}</p>;
  }
  return (
    <div className="space-y-4">
      <Badge className="bg-violet-100 text-violet-900">{AI_DRAFT_LABEL}</Badge>
      <p className="text-xs text-slate-500">Lecture seule : ce brouillon n’est jamais visible du candidat et n’est jamais modifié après sa génération{view.case.aiDraftModel ? ` (${view.case.aiDraftModel})` : ""}.</p>
      {view.aiScore && (
        <Card className="p-4">
          <p className="text-sm">
            Score proposé par l’IA : <strong>{view.aiScore.effectiveTotal}/100</strong> — statut suggéré : {SUGGESTED_STATUS_LABELS[view.aiScore.suggestedStatus]}
          </p>
          <ul className="mt-2 grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
            {SCORE_CRITERIA.map((criterion) => (
              <li key={criterion.key} className="flex justify-between gap-2">
                <span>{criterion.label}</span>
                <span className="font-semibold">
                  {draft.scores[criterion.key]}/{criterion.max}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card className="p-4 text-sm">
        <p>
          Voie principale : <strong>{draft.route} — {ROUTE_LABELS[draft.route]}</strong> · risque : {draft.riskLevel}
        </p>
        {draft.alternativeCountries.length > 0 && <p className="mt-1 text-slate-700">Pays alternatifs (internes) : {draft.alternativeCountries.map((alternative) => `${alternative.country} — ${alternative.rationale}`).join(" · ")}</p>}
        {draft.profileSummary && <p className="mt-2 whitespace-pre-line text-slate-700">{draft.profileSummary}</p>}
      </Card>
      <div className="grid gap-3 md:grid-cols-3">
        {([
          ["Lacunes bloquantes", draft.gaps.blocking, "border-rose-200 bg-rose-50"],
          ["Lacunes renforçables", draft.gaps.reinforceable, "border-amber-200 bg-amber-50"],
          ["Lacunes non bloquantes", draft.gaps.nonBlocking, "border-slate-200 bg-slate-50"],
        ] as const).map(([title, gaps, tone]) => (
          <div key={title} className={`rounded-md border p-3 text-xs ${tone}`}>
            <p className="font-bold text-slate-900">{title}</p>
            {gaps.length === 0 ? <p className="mt-1 text-slate-500">Aucune</p> : <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-800">{gaps.map((gap, index) => <li key={index}>{gap.label}{gap.detail ? ` — ${gap.detail}` : ""}</li>)}</ul>}
          </div>
        ))}
      </div>
      <Card className="p-4">
        <p className="text-sm font-bold text-slate-950">Informations extraites du formulaire</p>
        <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
          {Object.entries(draft.extracted).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-2 border-b border-slate-100 py-1">
              <dt className="text-slate-500">{EXTRACTED_LABELS[key] ?? key}</dt>
              <dd className="text-right font-medium text-slate-900">{formatExtracted(value)}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}

export type EvaluationValidationPanelProps = { evaluationId: number; sessionToken: string };

export default function EvaluationValidationPanel({ evaluationId, sessionToken }: EvaluationValidationPanelProps) {
  const utils = trpc.useUtils();
  const caseQuery = trpc.evaluationValidation.getCase.useQuery({ sessionToken, evaluationId }, { refetchOnWindowFocus: false, retry: false });
  const view = (caseQuery.data?.view ?? null) as CaseView | null;

  const [draft, setDraft] = useState<AdminEvaluationVersion | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "info"; text: string } | null>(null);
  const [publishMode, setPublishMode] = useState<null | "silent" | "notify">(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [infoItems, setInfoItems] = useState("");
  const [reevaluationOpen, setReevaluationOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [resendOpen, setResendOpen] = useState(false);
  const [resendReviewed, setResendReviewed] = useState(false);

  useEffect(() => {
    setDraft(view?.case.adminVersion ?? null);
  }, [view?.case.id, view?.case.versionStamp]);

  const refresh = async () => {
    await caseQuery.refetch();
    void utils.evaluationValidation.listStatuses.invalidate();
  };
  const fail = (error: unknown) => toast.error(errorMessage(error));

  const openCase = trpc.evaluationValidation.openCase.useMutation({ onSuccess: refresh, onError: fail });
  const generate = trpc.evaluationValidation.generateAiDraft.useMutation({ onSuccess: refresh, onError: fail });
  const save = trpc.evaluationValidation.saveDraft.useMutation({
    onSuccess: async (result: { changedFields?: string[]; view?: { case?: { adminVersion?: AdminEvaluationVersion | null } } }) => {
      if (result.view?.case?.adminVersion) setDraft(result.view.case.adminVersion);
      setNotice({ tone: "success", text: (result.changedFields ?? []).length ? `Brouillon enregistré (${(result.changedFields ?? []).length} champ(s) modifié(s), historique mis à jour).` : "Aucune modification à enregistrer." });
      await refresh();
    },
    onError: fail,
  });
  const requestInfo = trpc.evaluationValidation.requestInfo.useMutation({
    onSuccess: async () => {
      setInfoOpen(false);
      setInfoMessage("");
      setInfoItems("");
      setNotice({ tone: "info", text: "Demande envoyée : le candidat la voit dans son espace. Le dossier attend sa réponse." });
      await refresh();
    },
    onError: (error: unknown) => setDialogError(errorMessage(error)),
  });
  const publish = trpc.evaluationValidation.publish.useMutation({
    onSuccess: async (result: { outcome?: string; emailAttempted?: boolean; emailSent?: boolean; emailError?: string | null; firstValidatedBy?: string | null }) => {
      setPublishMode(null);
      setChecked({});
      setDialogError(null);
      if (result.outcome === "awaiting_second_validation") setNotice({ tone: "info", text: `Première validation enregistrée (${result.firstValidatedBy}). Ce résultat exige un second administrateur, différent du premier, avant publication.` });
      else if (result.emailAttempted && !result.emailSent) setNotice({ tone: "warning", text: `Évaluation publiée dans l’espace du candidat, mais l’e-mail n’a pas pu être envoyé : ${result.emailError ?? "erreur inconnue"}. Vous pouvez le renvoyer.` });
      else if (result.emailSent) setNotice({ tone: "success", text: "Évaluation publiée, puis candidat notifié par e-mail." });
      else setNotice({ tone: "success", text: "Évaluation publiée dans l’espace du candidat. Aucun e-mail n’a été envoyé." });
      await refresh();
    },
    onError: (error: unknown) => setDialogError(errorMessage(error)),
  });
  const resend = trpc.evaluationValidation.resendEmail.useMutation({
    onSuccess: async (result: { emailSent: boolean; emailError: string | null }) => {
      setNotice(result.emailSent ? { tone: "success", text: "E-mail de notification envoyé." } : { tone: "warning", text: `L’e-mail n’a pas pu être envoyé : ${result.emailError ?? "erreur inconnue"}.` });
      await refresh();
    },
    onError: fail,
  });
  const reevaluate = trpc.evaluationValidation.startReevaluation.useMutation({
    onSuccess: async () => {
      setReevaluationOpen(false);
      setReason("");
      setNotice({ tone: "info", text: "Nouvelle version ouverte. Le candidat continue de voir le dernier rapport publié jusqu’à la publication de la suivante." });
      await refresh();
    },
    onError: (error: unknown) => setDialogError(errorMessage(error)),
  });

  if (caseQuery.isLoading) return <p className="flex items-center gap-2 py-4 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" /> Chargement de la validation structurée…</p>;
  if (caseQuery.error) return <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{errorMessage(caseQuery.error)}</p>;

  if (!view) {
    return (
      <Card className="space-y-3 border-violet-200 bg-violet-50/60 p-4" data-testid="validation-not-opened">
        <p className="text-sm font-semibold text-violet-950">Cette évaluation n’a pas encore été ouverte dans la validation structurée.</p>
        <p className="text-xs text-slate-600">Le brouillon IA (interne, soumis au consentement du candidat) est préparé pour vous ; vous validez, modifiez puis publiez. Rien n’est visible du candidat ni envoyé avant votre publication.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" className="gap-1 bg-violet-700 hover:bg-violet-800" onClick={() => generate.mutate({ sessionToken, evaluationId })} disabled={generate.isPending || openCase.isPending}>
            <Sparkles className="h-3.5 w-3.5" /> Générer le brouillon IA
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => openCase.mutate({ sessionToken, evaluationId })} disabled={generate.isPending || openCase.isPending}>
            Saisir manuellement
          </Button>
        </div>
      </Card>
    );
  }

  const status = view.case.workflowStatus;
  const availability = availabilityFor(status);
  const dirty = Boolean(draft && view.case.adminVersion && !sameVersion(draft, view.case.adminVersion));
  const published = status === "validee_publiee" || status === "validee_publiee_notifiee";
  const blockers: string[] = [];
  if (!availability.canPublish) blockers.push(published ? "Cette évaluation est déjà publiée." : "Publication impossible dans ce statut.");
  else {
    if (dirty) blockers.push("Enregistrez d’abord vos modifications : la publication porte sur la version enregistrée.");
    if (view.incompleteFields.length > 0) blockers.push(`À compléter avant publication : ${view.incompleteFields.join(", ")}.`);
    if (view.previewError) blockers.push(view.previewError);
    if (!view.evaluation.cvOnFile) blockers.push(CV_MISSING_FOR_PUBLICATION);
  }
  const cvLink = view.evaluation.cvFileUrl && /^https?:\/\//i.test(view.evaluation.cvFileUrl) ? view.evaluation.cvFileUrl : null;
  const canPublishNow = availability.canPublish && blockers.length === 0 && !save.isPending;
  const sendEmail = publishMode === "notify";
  const missing = publishMode ? missingChecklistItems(checked, { sendEmail }) : [];
  const busy = save.isPending || publish.isPending || generate.isPending || resend.isPending || reevaluate.isPending || requestInfo.isPending;

  const openPublish = (mode: "silent" | "notify") => {
    setChecked({});
    setDialogError(null);
    setPublishMode(mode);
  };

  return (
    <div className="mt-4 space-y-4 rounded-lg border-2 border-violet-200 bg-white p-4" data-testid="validation-panel">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-indigo-100 text-indigo-900" data-testid="workflow-status">{view.labels.workflow}</Badge>
        <span className="text-xs text-slate-500">Version {view.case.versionNumber}</span>
        {!published && <Badge className="bg-violet-100 text-violet-900">{ADMIN_DRAFT_BADGE}</Badge>}
        {view.needsSecondValidation && !published && <Badge className="bg-amber-100 text-amber-900">Seconde validation requise</Badge>}
      </div>
      <p className="text-xs text-slate-600">Rien n’est visible du candidat ni envoyé tant que vous n’avez pas publié. Le candidat ne voit que l’avis « dossier reçu » jusqu’à votre validation.</p>
      {view.evaluation.cvOnFile ? (
        <p className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" data-testid="cv-status">
          <FileText className="h-4 w-4" aria-hidden="true" />
          <span className="font-semibold">CV au dossier</span>
          {cvLink ? (
            <a href={cvLink} target="_blank" rel="noopener noreferrer" className="font-medium underline">
              {view.evaluation.cvFileName || "Ouvrir le CV"}
            </a>
          ) : (
            <span>{view.evaluation.cvFileName}</span>
          )}
        </p>
      ) : (
        !published && (
          <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900" data-testid="cv-status">
            <AlertTriangle className="mr-1 inline h-4 w-4" aria-hidden="true" />
            <strong>CV manquant.</strong> {CV_MISSING_FOR_PUBLICATION}
          </p>
        )
      )}

      {notice && <p role="status" className={`rounded-md border p-3 text-sm ${notice.tone === "warning" ? "border-amber-300 bg-amber-50 text-amber-900" : notice.tone === "success" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-blue-200 bg-blue-50 text-blue-900"}`}>{notice.text}</p>}
      {view.case.aiDraftError && <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="mr-1 inline h-4 w-4" />Le brouillon IA n’a pas pu être généré ({view.case.aiDraftError}). La version administrateur est vierge : saisissez-la à la main ou relancez la génération.</p>}
      {view.case.aiDraftWarnings.length > 0 && (
        <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-bold">Points signalés dans le brouillon IA</p>
          <ul className="mt-1 list-disc pl-4">{view.case.aiDraftWarnings.map((warning, index) => <li key={index}><strong>{warning.field}</strong> : {warning.message}</li>)}</ul>
        </div>
      )}
      {status === "validee_publiee" && view.case.emailError && <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">L’évaluation est publiée mais l’e-mail n’a pas été envoyé : {view.case.emailError}</p>}
      {view.case.firstValidatedBy && !published && <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">Première validation par {view.case.firstValidatedBy}. Un second administrateur doit publier.</p>}
      {view.case.infoRequest && status === "informations_complementaires" && <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">En attente de la réponse du candidat à la demande du {new Date(view.case.infoRequest.requestedAt).toLocaleDateString("fr-FR")}.</p>}
      {view.case.infoRequest?.response && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900"><p className="font-bold">Réponse du candidat</p>{view.case.infoRequest.response.answers.map((entry) => <p key={entry.id} className="mt-1 whitespace-pre-line">{view.case.infoRequest?.items.find((item) => item.id === entry.id)?.label} : {entry.answer}</p>)}{view.case.infoRequest.response.note && <p className="mt-1 whitespace-pre-line">{view.case.infoRequest.response.note}</p>}</div>}

      <Tabs defaultValue="admin">
        <TabsList>
          <TabsTrigger value="ai">Brouillon IA</TabsTrigger>
          <TabsTrigger value="admin">Version administrateur</TabsTrigger>
          <TabsTrigger value="preview">Aperçu client</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-3">
          <AiDraftZone view={view} />
          {!view.case.aiDraft && availability.canEdit && (
            <Button type="button" size="sm" variant="outline" className="mt-3 gap-1" onClick={() => generate.mutate({ sessionToken, evaluationId })} disabled={busy}>
              <RefreshCw className={`h-3.5 w-3.5 ${generate.isPending ? "animate-spin" : ""}`} /> Générer le brouillon IA
            </Button>
          )}
        </TabsContent>

        <TabsContent value="admin" className="mt-3">
          {draft ? (
            <EvaluationVersionForm value={draft} onChange={setDraft} readOnly={!availability.canEdit} candidateCountry={view.evaluation.candidateCountry} />
          ) : (
            <p className="text-sm text-slate-600">Aucune version administrateur : générez le brouillon IA ou ouvrez le dossier pour saisir à la main.</p>
          )}
        </TabsContent>

        <TabsContent value="preview" className="mt-3 space-y-4">
          <p className="text-xs text-slate-600">Aperçu exact de ce que verra le candidat, généré depuis la dernière version <strong>enregistrée</strong>{dirty ? " (vous avez des modifications non enregistrées)" : ""}.</p>
          {view.previewError && <p role="alert" className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">{view.previewError}</p>}
          {view.clientPreview && <EvaluationReportView report={view.clientPreview} headingId={`preview-title-${evaluationId}`} />}
          {view.case.adminVersion && (
            <Card className="p-4">
              <p className="text-sm font-bold text-slate-950">Aperçu de l’e-mail de notification</p>
              <p className="mt-1 text-xs text-slate-500">À : {view.evaluation.candidateEmail}</p>
              <p className="mt-2 text-sm font-semibold">{view.case.adminVersion.emailSubject}</p>
              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-800">{view.case.adminVersion.emailBody.split(NOTIFICATION_PORTAL_PLACEHOLDER).join("[lien sécurisé vers votre espace]")}</pre>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-3 space-y-3">
          <div className="text-xs text-slate-700">
            <p className="font-bold">Versions</p>
            <ul className="mt-1 space-y-1">{view.versions.map((entry) => <li key={entry.versionNumber}>Version {entry.versionNumber} — {WORKFLOW_STATUS_LABELS[entry.workflowStatus]}{entry.publishedAt ? ` · publiée le ${new Date(entry.publishedAt).toLocaleString("fr-FR")} par ${entry.publishedBy}` : ""}</li>)}</ul>
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-700">Modifications champ par champ</p>
            {view.changes.length === 0 ? <p className="mt-1 text-slate-500">Aucune modification enregistrée.</p> : (
              <ul className="mt-1 space-y-1">
                {[...view.changes].reverse().slice(0, 100).map((change, index) => (
                  <li key={index} className="rounded-md bg-slate-50 p-2">
                    <span className="font-semibold text-slate-900">{change.field}</span> : <span className="text-slate-500">{describeValue(change.oldValue)}</span> → <span className="text-slate-900">{describeValue(change.newValue)}</span>
                    <span className="block text-slate-500">{change.adminEmail} · {new Date(change.createdAt).toLocaleString("fr-FR")} · version {change.versionNumber}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-2 border-t border-slate-200 pt-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" className="gap-1" onClick={() => draft && save.mutate({ sessionToken, evaluationId, version: draft })} disabled={!availability.canEdit || !dirty || busy || !draft}>
            <Save className="h-3.5 w-3.5" /> Enregistrer le brouillon
          </Button>
          <Button type="button" size="sm" variant="outline" className="gap-1 border-amber-400 text-amber-900 hover:bg-amber-50" onClick={() => { setDialogError(null); setInfoOpen(true); }} disabled={!availability.canRequestInfo || busy}>
            <MailQuestion className="h-3.5 w-3.5" /> Demander des informations complémentaires
          </Button>
          <Button type="button" size="sm" variant="outline" className="gap-1 border-emerald-400 text-emerald-900 hover:bg-emerald-50" onClick={() => openPublish("silent")} disabled={!canPublishNow || busy}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Publier sans email
          </Button>
          <Button type="button" size="sm" className="gap-1 bg-emerald-700 hover:bg-emerald-800" onClick={() => openPublish("notify")} disabled={!canPublishNow || busy}>
            <Send className="h-3.5 w-3.5" /> Publier et envoyer l’email
          </Button>
          {availability.canResendEmail && (
            <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => (view.case.emailReviewed ? resend.mutate({ sessionToken, evaluationId }) : (setResendReviewed(false), setResendOpen(true)))} disabled={busy}>
              <Mail className="h-3.5 w-3.5" /> {view.case.emailError ? "Renvoyer l’e-mail" : "Envoyer l’e-mail de notification"}
            </Button>
          )}
          {availability.canReevaluate && (
            <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => { setDialogError(null); setReevaluationOpen(true); }} disabled={busy}>
              <RefreshCw className="h-3.5 w-3.5" /> Réévaluer
            </Button>
          )}
        </div>
        {blockers.length > 0 && !published && <ul className="space-y-0.5 text-xs text-amber-800">{blockers.map((text) => <li key={text}>{text}</li>)}</ul>}
        {view.needsSecondValidation && availability.canPublish && <p className="text-xs text-amber-800">Ce résultat (« Préparation recommandée ») exige deux administrateurs : votre publication sera enregistrée comme première validation.</p>}
      </div>

      <Dialog open={publishMode !== null} onOpenChange={(open) => { if (!open && !publish.isPending) setPublishMode(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{sendEmail ? "Publier et envoyer l’email" : "Publier sans email"}</DialogTitle>
            <DialogDescription>
              {view.clientPreview ? `${view.clientPreview.candidateName} · ${view.clientPreview.priorityCountry} · score validé ${view.clientPreview.score}/${view.clientPreview.scoreMax} (${view.clientPreview.statusLabel})` : "Vérifiez l’aperçu client avant de publier."}
            </DialogDescription>
          </DialogHeader>
          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-slate-950">Checklist obligatoire avant publication</legend>
            {PUBLICATION_CHECKLIST.filter((item) => sendEmail || !item.onlyWhenEmail).map((item) => (
              <label key={item.key} className="flex items-start gap-2 text-sm text-slate-800">
                <input type="checkbox" className="mt-1" checked={checked[item.key] === true} onChange={(event) => setChecked((current) => ({ ...current, [item.key]: event.target.checked }))} />
                <span>{item.label}</span>
              </label>
            ))}
          </fieldset>
          {sendEmail ? (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
              Cette action va <strong>publier l’évaluation dans l’espace du candidat</strong>, puis <strong>envoyer un e-mail de notification à {view.evaluation.candidateEmail}</strong>. L’e-mail n’est envoyé qu’après la publication ; s’il échoue, l’évaluation reste publiée. Confirmer la publication et l’envoi ?
            </p>
          ) : (
            <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">L’évaluation sera publiée dans l’espace du candidat. Aucun e-mail ne sera envoyé.</p>
          )}
          {view.needsSecondValidation && <p className="text-xs text-amber-800">Résultat « Préparation recommandée » : cette validation sera enregistrée comme première validation ; un second administrateur devra publier.</p>}
          {dialogError && <p role="alert" className="text-sm font-semibold text-rose-700">{dialogError}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setPublishMode(null)} disabled={publish.isPending}>Annuler</Button>
            <Button
              type="button"
              className="bg-emerald-700 hover:bg-emerald-800"
              disabled={missing.length > 0 || publish.isPending || !view.case.versionStamp}
              onClick={() => view.case.versionStamp && publish.mutate({ sessionToken, evaluationId, checklist: checked, sendEmail, reviewedVersionStamp: view.case.versionStamp })}
            >
              {publish.isPending ? "Publication…" : sendEmail ? "Confirmer : publier et envoyer" : "Confirmer la publication"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resendOpen} onOpenChange={(open) => { if (!resend.isPending) setResendOpen(open); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Envoyer l’e-mail de notification</DialogTitle>
            <DialogDescription>L’évaluation est déjà publiée. Relisez l’e-mail ci-dessous : il part à {view.evaluation.candidateEmail}.</DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-800">
            <p className="font-semibold">{view.case.adminVersion?.emailSubject}</p>
            <pre className="mt-2 whitespace-pre-wrap">{view.case.adminVersion?.emailBody.split(NOTIFICATION_PORTAL_PLACEHOLDER).join("[lien sécurisé vers votre espace]")}</pre>
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input type="checkbox" className="mt-1" checked={resendReviewed} onChange={(event) => setResendReviewed(event.target.checked)} />
            <span>J’ai relu l’email de notification.</span>
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setResendOpen(false)}>Annuler</Button>
            <Button type="button" disabled={!resendReviewed || resend.isPending} onClick={() => { resend.mutate({ sessionToken, evaluationId, emailReviewed: true }); setResendOpen(false); }}>Envoyer l’e-mail</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={infoOpen} onOpenChange={(open) => { if (!requestInfo.isPending) setInfoOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Demander des informations complémentaires</DialogTitle>
            <DialogDescription>Le candidat voit cette demande dans son espace ; aucun brouillon ni score ne lui est montré. Aucune promesse, aucune donnée sensible.</DialogDescription>
          </DialogHeader>
          <label className="block text-xs font-medium text-slate-700">
            Message au candidat
            <Textarea value={infoMessage} onChange={(event) => setInfoMessage(event.target.value)} rows={3} maxLength={2000} className="mt-1 bg-white" />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Éléments demandés <span className="font-normal text-slate-500">— un par ligne</span>
            <Textarea value={infoItems} onChange={(event) => setInfoItems(event.target.value)} rows={4} className="mt-1 bg-white" />
          </label>
          {dialogError && <p role="alert" className="text-sm font-semibold text-rose-700">{dialogError}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setInfoOpen(false)}>Annuler</Button>
            <Button type="button" disabled={requestInfo.isPending || (linesToList(infoItems).length === 0 && !infoMessage.trim())} onClick={() => requestInfo.mutate({ sessionToken, evaluationId, message: infoMessage.trim(), items: linesToList(infoItems) })}>
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reevaluationOpen} onOpenChange={(open) => { if (!reevaluate.isPending) setReevaluationOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réévaluer</DialogTitle>
            <DialogDescription>Une nouvelle version est ouverte à partir de la dernière. L’historique est conservé et le candidat continue de voir le dernier rapport publié jusqu’à la publication de la suivante.</DialogDescription>
          </DialogHeader>
          <label className="block text-xs font-medium text-slate-700">
            Motif de la réévaluation
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={500} className="mt-1 bg-white" />
          </label>
          {dialogError && <p role="alert" className="text-sm font-semibold text-rose-700">{dialogError}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setReevaluationOpen(false)}>Annuler</Button>
            <Button type="button" disabled={reevaluate.isPending || reason.trim().length < 3} onClick={() => reevaluate.mutate({ sessionToken, evaluationId, reason: reason.trim() })}>Ouvrir une nouvelle version</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
