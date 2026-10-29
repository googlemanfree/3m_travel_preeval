import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { inspectBilan, renderBilanStandalone, toBilanHtml } from "@shared/bilanContent";
import { bilanVariablesFrom, resolveBilanVariables } from "@shared/bilanVariables";
import { reviewBilan } from "@shared/bilanReview";
import { proposedOpeningFee } from "@shared/openingFee";
import { EVALUATION_KIND_LABELS, resolveBilanProjectKind } from "@shared/evaluationBilanTemplates";

type Props = {
  sessionToken: string;
  sourceRecordId: number;
  sourceType?: "application" | "candidate" | "agency";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
};

const DESTINATIONS = ["canada", "luxembourg", "europe"] as const;
type Destination = (typeof DESTINATIONS)[number];
const normalizeDestination = (value: string | null | undefined): Destination => {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("canada")) return "canada";
  if (normalized.includes("luxembourg")) return "luxembourg";
  return "europe";
};

/** Note globale lue dans le texte du bilan (« 61/100 » dans les 600 premiers caractères) ; absente si le texte n'en donne pas. */
export function scoreFromBilanText(text: string): number | null {
  const match = text.slice(0, 600).match(/(\d{1,3})\s*\/\s*100\b/);
  if (!match) return null;
  const score = Number(match[1]);
  return score >= 0 && score <= 100 ? score : null;
}

const DEFAULT_SUBJECT = "Votre bilan d'évaluation 3M TRAVEL AGENCY";
const PLACEHOLDER = "Saisissez ou collez le bilan ici (depuis Word, Google Docs, un e-mail ou un texte).\n\nL'aperçu à droite se met à jour pendant la frappe : c'est exactement ce que le candidat recevra.\n\nTitres : une ligne commençant par « ## ».  Listes : « - » ou « ✓ » en début de ligne.\nVariables remplacées par les données du dossier : {{nom}}, {{montant}}, {{destination}}, {{reference}}.";

/**
 * Bilan d'évaluation : un champ de saisie, l'aperçu en direct, et trois actions — enregistrer, valider, envoyer (espace client et e-mail).
 * Valider relit le texte (promesse de résultat, donnée sensible, zone à compléter, nom du candidat) et attribue le numéro de dossier ;
 * envoyer valide d'abord si nécessaire, puis publie dans l'espace client et envoie l'e-mail avec le PDF.
 */
export function EvaluationDeliveryEditor({ sessionToken: providedSessionToken, sourceRecordId, sourceType = "application", open, onOpenChange, onCompleted }: Props) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const platformBootstrap = trpc.adminAuth.bootstrapPlatformSession.useQuery(undefined, { enabled: open && !providedSessionToken, retry: false, refetchOnWindowFocus: false });
  const restoredPlatformToken = (platformBootstrap.data as { sessionToken?: string } | undefined)?.sessionToken;
  const sessionToken = providedSessionToken || restoredPlatformToken || "";
  useEffect(() => {
    if (!restoredPlatformToken) return;
    sessionStorage.setItem("adminSessionToken", restoredPlatformToken);
    localStorage.setItem("adminSessionToken", restoredPlatformToken);
  }, [restoredPlatformToken]);

  // Depuis la fiche d'un compte candidat, le dossier d'évaluation est d'abord ouvert (ou retrouvé) côté serveur.
  const [ready, setReady] = useState(sourceType !== "candidate");
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const attempted = useRef("");
  const initialize = trpc.unifiedRequests.initializeEvaluationDelivery.useMutation({
    onSuccess: (result) => {
      if (typeof result.application?.id === "number") setApplicationId(result.application.id);
      setBootstrapError(null);
      setReady(true);
    },
    onError: (error) => { setReady(false); setBootstrapError(error.message); },
  });
  const bootstrapKey = `${sourceType}:${sourceRecordId}`;
  useEffect(() => {
    if (sourceType !== "candidate" || !open || !sessionToken || attempted.current === bootstrapKey) return;
    attempted.current = bootstrapKey;
    setApplicationId(null);
    setReady(false);
    setBootstrapError(null);
    initialize.mutate({ sessionToken, candidateId: sourceRecordId, sourceType: "candidate" });
  }, [bootstrapKey, initialize, open, sessionToken, sourceRecordId, sourceType]);
  useEffect(() => {
    if (open) return;
    attempted.current = "";
    if (sourceType === "candidate") { setApplicationId(null); setReady(false); setBootstrapError(null); }
  }, [open, sourceType]);
  const retryBootstrap = () => {
    attempted.current = bootstrapKey;
    setBootstrapError(null);
    setReady(false);
    initialize.mutate({ sessionToken, candidateId: sourceRecordId, sourceType: "candidate" });
  };

  const recordId = sourceType === "candidate" && applicationId !== null ? applicationId : sourceRecordId;
  const { data, isLoading, isError, error, refetch } = trpc.unifiedRequests.getEvaluationDelivery.useQuery(
    { sessionToken, sourceRecordId: recordId },
    { enabled: open && Boolean(sessionToken) && (sourceType !== "candidate" || ready), retry: 2, refetchOnWindowFocus: false },
  );

  // Texte saisi : jamais écrasé par un rechargement du serveur tant que l'administrateur a modifié quelque chose.
  const [text, setText] = useState("");
  const [baseline, setBaseline] = useState("");
  useEffect(() => {
    if (!data?.draft) return;
    const draft = data.draft as { bilanSource?: string; bilanHtml?: string };
    const stored = draft.bilanSource || draft.bilanHtml || "";
    setText((current) => (current === baseline ? stored : current));
    setBaseline(stored);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = text !== baseline;

  const application = data?.application as { fullName: string; dossierNumber: string; destination?: string | null; visaType?: string | null; paymentAmount?: number | null; evaluationDeliveryStatus?: string; evaluationApprovalStatus?: string; evaluationRequiresSecondApproval?: boolean } | undefined;
  const draft = data?.draft;
  const projectKind = resolveBilanProjectKind((draft as { projectType?: string | null } | undefined)?.projectType, application?.visaType);
  const projectLabel = EVALUATION_KIND_LABELS[projectKind];
  const variables = application ? bilanVariablesFrom({ fullName: application.fullName, dossierNumber: application.dossierNumber, destination: application.destination ?? null, visaLabel: projectLabel, paymentAmount: application.paymentAmount ?? null, score: scoreFromBilanText(text) }) : {};
  const resolved = resolveBilanVariables(text, variables);
  const inspection = useMemo(() => inspectBilan(toBilanHtml(resolved)), [resolved]);
  const review = useMemo(() => (application && text.trim() ? reviewBilan(resolved, { fullName: application.fullName, destinations: [application.destination ?? null], expectedAmount: (application.paymentAmount ?? 0) > 0 ? application.paymentAmount : proposedOpeningFee(application.visaType ?? projectLabel) }) : []), [resolved, application, projectLabel, text]);

  const deferredResolved = useDeferredValue(resolved);
  const previewDocument = useMemo(() => {
    if (!application || !deferredResolved.trim()) return "";
    const score = scoreFromBilanText(deferredResolved);
    return renderBilanStandalone({ html: toBilanHtml(deferredResolved), title: `Évaluation professionnelle — ${projectLabel}`, candidateName: application.fullName, reference: application.dossierNumber && !application.dossierNumber.startsWith("EVAL-DRAFT-") ? application.dossierNumber : null, projectLabel, destination: application.destination ?? null, score });
  }, [deferredResolved, application, projectLabel]);

  const alreadySent = application?.evaluationDeliveryStatus === "sent";
  const offlineValidated = (data as { offlineEvaluation?: { validated?: boolean } } | undefined)?.offlineEvaluation?.validated === true;
  const locked = alreadySent || offlineValidated;
  const needsSecondApproval = Boolean(draft?.requiresSecondApproval) && application?.evaluationApprovalStatus !== "approved";
  const validated = Boolean(draft?.advisorValidated) && !dirty;

  /** Ce qui empêche encore de valider ou d'envoyer, dit en clair. */
  const blockers: string[] = [];
  if (!text.trim() || inspection.empty) blockers.push("Saisissez le bilan (quelques lignes au moins).");
  if (inspection.forbiddenTerms.length > 0) blockers.push(`Formulation à revoir (promesse de résultat) : ${inspection.forbiddenTerms.join(", ")}.`);
  if (inspection.sensitiveData.length > 0) blockers.push(`Donnée sensible à retirer : ${inspection.sensitiveData.join(", ")}.`);
  if (inspection.placeholders.length > 0) blockers.push(`Zone à compléter : ${inspection.placeholders.join(", ")}.`);
  for (const issue of review) if (issue.level === "error") blockers.push(issue.message);
  const warnings = review.filter((issue) => issue.level !== "error").map((issue) => issue.message);

  const saveDraft = trpc.unifiedRequests.saveEvaluationDeliveryDraft.useMutation();
  const validateDraft = trpc.unifiedRequests.validateEvaluationDraft.useMutation();
  const sendNow = trpc.unifiedRequests.sendEvaluationNow.useMutation();
  const approve = trpc.unifiedRequests.approveSensitiveEvaluation.useMutation();
  const busy = saveDraft.isPending || validateDraft.isPending || sendNow.isPending;
  const fail = (title: string, caught: unknown) => toast({ title, description: caught instanceof Error ? caught.message : "Opération impossible pour le moment.", variant: "destructive" });
  const refresh = () => utils.unifiedRequests.getEvaluationDelivery.invalidate({ sessionToken, sourceRecordId: recordId });

  const payload = () => {
    const stored = (draft ?? {}) as { destination?: string; finalScore?: number; verdict?: string; strengths?: string[]; weaknesses?: string[]; recommendations?: string[]; subject?: string; message?: string; requiresSecondApproval?: boolean; language?: string };
    return {
      sessionToken,
      sourceRecordId: recordId,
      destination: normalizeDestination(stored.destination ?? application?.destination),
      finalScore: scoreFromBilanText(text) ?? Math.max(0, Math.min(100, Math.round(Number(stored.finalScore) || 0))),
      verdict: (stored.verdict ?? "").trim() || "Évaluation préliminaire à consulter",
      strengths: stored.strengths ?? [],
      weaknesses: stored.weaknesses ?? [],
      recommendations: stored.recommendations ?? [],
      subject: (stored.subject ?? "").trim().length >= 4 ? stored.subject!.trim() : DEFAULT_SUBJECT,
      message: stored.message?.trim() ? stored.message : undefined,
      bilanHtml: text,
      bilanSource: text,
      requiresSecondApproval: Boolean(stored.requiresSecondApproval),
      language: stored.language === "en" ? ("en" as const) : ("fr" as const),
    };
  };

  /** Enregistre le texte tel quel (aucun e-mail, aucune publication) ; renvoie vrai si le serveur l'a accepté. */
  const persist = async (): Promise<boolean> => {
    try {
      await saveDraft.mutateAsync(payload());
      setBaseline(text);
      await refresh();
      return true;
    } catch (caught) {
      fail("Bilan non enregistré", caught);
      return false;
    }
  };
  const handleSave = async () => {
    if (await persist()) toast({ title: "Bilan enregistré", description: "Rien n'est envoyé : le candidat ne voit encore rien." });
  };
  /** Enregistre puis valide ; renvoie vrai si le bilan est validé. */
  const validateNow = async (): Promise<boolean> => {
    if (!(await persist())) return false;
    try {
      const result = await validateDraft.mutateAsync({ sessionToken, sourceRecordId: recordId, validationComment: "Bilan relu et validé avant diffusion." });
      await refresh();
      toast({ title: "Bilan validé", description: result.message });
      return true;
    } catch (caught) {
      fail("Validation impossible", caught);
      return false;
    }
  };
  const handleSend = async () => {
    if (needsSecondApproval) { toast({ title: "Seconde approbation requise", description: "Un autre administrateur doit d'abord approuver ce bilan sensible.", variant: "destructive" }); return; }
    if (!window.confirm(`Envoyer ce bilan à ${application?.fullName ?? "ce candidat"} dans son espace client et par e-mail ?`)) return;
    if (!validated && !(await validateNow())) return;
    try {
      const result = await sendNow.mutateAsync({ sessionToken, sourceRecordId: recordId, previewConfirmed: true as const, attachments: [] });
      toast({ title: "Bilan envoyé (espace client + e-mail)", description: `${result.message} Dossier : ${result.dossierNumber ?? application?.dossierNumber ?? "—"}.` });
      onCompleted();
      onOpenChange(false);
    } catch (caught) {
      fail("Envoi impossible", caught);
    }
  };
  const handleApprove = async () => {
    try {
      const result = await approve.mutateAsync({ sessionToken, sourceRecordId: recordId, approvalComment: "Bilan contrôlé avant diffusion." });
      await refresh();
      toast({ title: "Bilan approuvé", description: result.message });
    } catch (caught) {
      fail("Approbation impossible", caught);
    }
  };

  const status = alreadySent ? "Envoyé au candidat" : validated ? "Validé — prêt à envoyer" : dirty ? "Modifications non enregistrées" : text.trim() ? "Enregistré — à valider" : "Aucun bilan saisi";

  const centered = (content: React.ReactNode, tone: "info" | "error" = "info") => (
    <div role={tone === "error" ? "alert" : "status"} className={`mx-auto max-w-xl rounded-xl border p-6 text-center text-sm ${tone === "error" ? "border-rose-200 bg-rose-50 text-rose-950" : "border-slate-200 bg-white text-slate-600"}`}>{content}</div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen !max-w-none flex-col gap-3 overflow-hidden rounded-none border-0 bg-slate-50 p-3 sm:h-[calc(100vh-1rem)] sm:w-[calc(100vw-1rem)] sm:rounded-2xl sm:p-5">
        <DialogHeader className="shrink-0 space-y-1 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <DialogTitle>Bilan d'évaluation{application ? ` — ${application.fullName}` : ""}</DialogTitle>
          <DialogDescription>
            {application ? `${application.dossierNumber.startsWith("EVAL-DRAFT-") ? "Numéro de dossier attribué à la validation" : `Dossier ${application.dossierNumber}`} · ${application.destination || "destination à préciser"} · ${projectLabel}` : "Saisissez le bilan, relisez l'aperçu, validez puis envoyez."}
          </DialogDescription>
        </DialogHeader>

        {!sessionToken ? centered(<><strong className="block text-base">Session administrateur introuvable</strong><p className="mt-2">Reconnectez-vous à l'espace admin puis rouvrez ce bilan.</p></>, "error")
          : sourceType === "candidate" && bootstrapError ? centered(<><strong className="block text-base">Ouverture du dossier impossible</strong><p className="mt-2">{bootstrapError}</p><Button className="mt-4" variant="outline" disabled={initialize.isPending} onClick={retryBootstrap}><RefreshCw className="mr-2 h-4 w-4" />Réessayer</Button></>, "error")
          : (sourceType === "candidate" && !ready) || isLoading ? centered(<><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-700" />Chargement du dossier…</>)
          : isError || !data || !application ? centered(<><strong className="block text-base">Le bilan n'a pas pu être chargé</strong><p className="mt-2">{error?.message || "Aucune donnée reçue du serveur."}</p><Button className="mt-4" variant="outline" onClick={() => void refetch()}><RefreshCw className="mr-2 h-4 w-4" />Réessayer</Button></>, "error")
          : (
            <>
              {locked && <p className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950" role="status" data-testid="bilan-locked">{alreadySent ? "Ce bilan a déjà été envoyé : il n'est plus modifiable." : "L'évaluation de ce candidat a déjà été validée hors ligne : aucune nouvelle préparation n'est possible ici."}</p>}
              <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
                <div className="flex min-h-[320px] flex-col rounded-xl border border-slate-200 bg-white p-3 lg:min-h-0">
                  <Label htmlFor="bilan-input" className="mb-1 text-sm font-semibold text-slate-900">Bilan</Label>
                  <Textarea id="bilan-input" data-testid="bilan-input" value={text} onChange={(event) => setText(event.target.value)} placeholder={PLACEHOLDER} disabled={locked} spellCheck className="min-h-0 flex-1 resize-none font-sans text-sm leading-6" />
                  <p className="mt-1 text-xs text-slate-500" data-testid="bilan-status" role="status" aria-live="polite">{status} · {inspection.words} mot{inspection.words > 1 ? "s" : ""}</p>
                </div>
                <div className="flex min-h-[420px] flex-col rounded-xl border border-slate-200 bg-white p-3 lg:min-h-0">
                  <p className="mb-1 text-sm font-semibold text-slate-900">Aperçu en direct — ce que le candidat recevra</p>
                  {previewDocument
                    ? <iframe title="Aperçu du bilan" data-testid="bilan-live-preview" sandbox="" srcDoc={previewDocument} className="min-h-0 w-full flex-1 rounded border bg-white" />
                    : <div className="flex flex-1 items-center justify-center rounded border border-dashed p-6 text-center text-sm text-slate-500" data-testid="bilan-live-preview-empty">L'aperçu apparaît ici dès les premiers mots saisis.</div>}
                </div>
              </div>

              <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-3" data-testid="bilan-actions">
                {blockers.length > 0
                  ? <ul className="mb-2 list-disc space-y-0.5 pl-5 text-xs text-rose-900" data-testid="bilan-blockers" aria-label="À corriger avant validation">{blockers.map((line) => <li key={line}>{line}</li>)}</ul>
                  : <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800" data-testid="bilan-ready"><CheckCircle2 className="h-4 w-4" />Aucun blocage : vous pouvez valider et envoyer.</p>}
                {warnings.length > 0 && <ul className="mb-2 list-disc space-y-0.5 pl-5 text-xs text-amber-900" data-testid="bilan-warnings" aria-label="À vérifier">{warnings.map((line) => <li key={line}>{line}</li>)}</ul>}
                {needsSecondApproval && (
                  <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 p-2 text-xs text-violet-950" data-testid="bilan-second-approval">
                    <ShieldCheck className="h-4 w-4" />Bilan sensible : l'approbation d'un autre administrateur est requise avant l'envoi.
                    {application.evaluationApprovalStatus === "pending" && <Button type="button" size="sm" variant="outline" disabled={approve.isPending} onClick={() => void handleApprove()} data-testid="bilan-approve">Approuver comme second administrateur</Button>}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={locked || busy || !text.trim() || !dirty} onClick={() => void handleSave()} data-testid="bilan-save-draft">{saveDraft.isPending && !validateDraft.isPending && !sendNow.isPending ? "Enregistrement…" : "Enregistrer"}</Button>
                  <Button type="button" variant="outline" className="border-amber-400 bg-amber-50 text-amber-950 hover:bg-amber-100" disabled={locked || busy || blockers.length > 0 || validated} onClick={() => void validateNow()} data-testid="bilan-validate">{validateDraft.isPending ? "Validation…" : validated ? "Validé" : "Valider"}</Button>
                  <Button type="button" className="bg-blue-700 hover:bg-blue-800" disabled={locked || busy || blockers.length > 0} onClick={() => void handleSend()} data-testid="bilan-validate-send">{sendNow.isPending ? "Envoi…" : "Envoyer (espace client + e-mail)"}</Button>
                </div>
              </div>
            </>
          )}
      </DialogContent>
    </Dialog>
  );
}
