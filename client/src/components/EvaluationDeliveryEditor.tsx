import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { BilanDocumentActions } from "@/components/BilanDocumentActions";
import { hasStructure, htmlToStructuredText, insertAtSelection, locatePassage } from "@/lib/bilanPaste";
import { bilanSkeleton, type SkeletonKind } from "@shared/bilanSkeleton";
import { useToast } from "@/components/ui/use-toast";
import { bilanIdentityFrom, inspectBilan, renderBilanStandalone, toBilanHtml } from "@shared/bilanContent";
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
  // Informations choisies à la main : frais d'ouverture (XAF), date limite, conseiller, et le mot d'accompagnement de l'e-mail.
  const [fee, setFee] = useState("");
  const [deadline, setDeadline] = useState("");
  const [advisor, setAdvisor] = useState("");
  const [note, setNote] = useState("");
  const metaKey = JSON.stringify([fee, deadline, advisor, note]);
  const [metaBaseline, setMetaBaseline] = useState(metaKey);
  const [tab, setTab] = useState<"input" | "preview">("input");
  const [restored, setRestored] = useState(false);
  // Envoi : un seul à la fois (double clic) et plus jamais après un envoi réussi, même si les données de l'écran ne sont pas encore rafraîchies.
  const [sentHere, setSentHere] = useState(false);
  const sending = useRef(false);
  useEffect(() => {
    if (!data?.draft) return;
    const draft = data.draft as { bilanSource?: string; bilanHtml?: string };
    const stored = draft.bilanSource || draft.bilanHtml || "";
    setText((current) => (current === baseline ? stored : current));
    setBaseline(stored);
    const extra = data.draft as { openingFeeXaf?: number | null; openingDeadline?: string; advisorName?: string; message?: string };
    const storedMeta = [extra.openingFeeXaf ? String(extra.openingFeeXaf) : "", extra.openingDeadline ?? "", extra.advisorName ?? "", (extra.message ?? "").replace(/<\s*br\s*\/?>/gi, "\n").replace(/<\/p>\s*<p[^>]*>/gi, "\n\n").replace(/<[^>]+>/g, "").trim()];
    if (metaKey === metaBaseline) { setFee(storedMeta[0]); setDeadline(storedMeta[1]); setAdvisor(storedMeta[2]); setNote(storedMeta[3]); }
    setMetaBaseline(JSON.stringify(storedMeta));
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = text !== baseline || metaKey !== metaBaseline;
  const textareaId = "bilan-input";

  // Copie locale du brouillon non enregistré : une fermeture accidentelle ou une coupure n'efface jamais la saisie.
  const backupKey = "bilan-draft:" + sourceRecordId;
  const wroteBackup = useRef(false);
  useEffect(() => {
    if (!open) return;
    try {
      if (text !== baseline) { localStorage.setItem(backupKey, JSON.stringify({ text, at: Date.now() })); wroteBackup.current = true; }
      else if (wroteBackup.current) { localStorage.removeItem(backupKey); wroteBackup.current = false; }
    } catch { /* stockage indisponible : la copie locale est facultative */ }
  }, [open, text, baseline, backupKey]);
  useEffect(() => {
    if (!data?.draft || restored) return;
    try {
      const saved = JSON.parse(localStorage.getItem(backupKey) ?? "null") as { text?: string } | null;
      const stored = (data.draft as { bilanSource?: string; bilanHtml?: string }).bilanSource || (data.draft as { bilanHtml?: string }).bilanHtml || "";
      if (saved?.text && saved.text !== stored) { setText(saved.text); setRestored(true); }
    } catch { /* copie illisible : ignorée */ }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const application = data?.application as { fullName: string; dossierNumber: string; destination?: string | null; visaType?: string | null; paymentAmount?: number | null; evaluationDeliveryStatus?: string; evaluationApprovalStatus?: string; evaluationRequiresSecondApproval?: boolean } | undefined;
  const draft = data?.draft;
  const projectKind = resolveBilanProjectKind((draft as { projectType?: string | null } | undefined)?.projectType, application?.visaType);
  const projectLabel = EVALUATION_KIND_LABELS[projectKind];
  const variables = application ? bilanVariablesFrom({ fullName: application.fullName, dossierNumber: application.dossierNumber, destination: application.destination ?? null, visaLabel: projectLabel, paymentAmount: Number(fee) > 0 ? Number(fee) : application.paymentAmount ?? null, score: scoreFromBilanText(text), openingDeadline: deadline, advisorName: advisor }) : {};
  const resolved = resolveBilanVariables(text, variables);
  const inspection = useMemo(() => inspectBilan(toBilanHtml(resolved)), [resolved]);
  const review = useMemo(() => (application && text.trim() ? reviewBilan(resolved, { fullName: application.fullName, destinations: [application.destination ?? null], expectedAmount: Number(fee) > 0 ? Number(fee) : (application.paymentAmount ?? 0) > 0 ? application.paymentAmount : proposedOpeningFee(application.visaType ?? projectLabel) }) : []), [resolved, application, projectLabel, text, fee]);

  const deferredResolved = useDeferredValue(resolved);
  const previewDocument = useMemo(() => {
    if (!application || !deferredResolved.trim()) return "";
    const score = scoreFromBilanText(deferredResolved);
    return renderBilanStandalone({ html: toBilanHtml(deferredResolved), title: `Évaluation professionnelle — ${projectLabel}`, candidateName: application.fullName, reference: (application as { displayReference?: string | null }).displayReference ?? null, projectLabel, destination: application.destination ?? null, score, identity: bilanIdentityFrom({ candidateId: (application as { candidateId?: number | null }).candidateId, email: (application as { email?: string }).email, phone: (application as { whatsappNumber?: string | null }).whatsappNumber, advisor: advisor.trim() || (application as { adminAssignedTo?: string | null }).adminAssignedTo }) });
  }, [deferredResolved, application, projectLabel, advisor]);

  const alreadySent = application?.evaluationDeliveryStatus === "sent" || sentHere;
  const offlineValidated = (data as { offlineEvaluation?: { validated?: boolean } } | undefined)?.offlineEvaluation?.validated === true;
  const locked = alreadySent || offlineValidated;
  const needsSecondApproval = Boolean(draft?.requiresSecondApproval) && application?.evaluationApprovalStatus !== "approved";
  const validated = Boolean(draft?.advisorValidated) && !dirty;

  /** Ce qui empêche encore de valider ou d'envoyer, dit en clair. */
  const blockers: string[] = [];
  const needles: Record<string, string> = {};
  const block = (message: string, needle?: string) => { blockers.push(message); if (needle) needles[message] = needle; };
  if (!text.trim() || inspection.empty) block("Saisissez le bilan (quelques lignes au moins).");
  for (const term of inspection.forbiddenTerms) block(`Formulation à revoir (promesse de résultat) : ${term}.`, term);
  for (const item of inspection.sensitiveData) block(`Donnée sensible à retirer : ${item}.`, item);
  for (const item of inspection.placeholders) block(`Zone à compléter : ${item}.`, item);
  if (fee.trim() && !(Number(fee) >= 1000)) block("Frais d'ouverture : indiquez un montant en XAF (1 000 au minimum) ou laissez le champ vide.");
  const locate = (needle: string) => {
    const field = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    const spot = locatePassage(text, needle);
    if (!field || !spot) return;
    setTab("input");
    field.focus();
    field.setSelectionRange(spot.start, spot.end);
  };
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
      // Le mot d'accompagnement n'est réécrit que s'il a été modifié ; sinon le message déjà enregistré est conservé tel quel.
      message: note !== JSON.parse(metaBaseline)[3] ? (note.trim() ? note.trim() : undefined) : stored.message?.trim() ? stored.message : undefined,
      bilanHtml: text,
      bilanSource: text,
      openingFeeXaf: Number(fee) >= 1000 ? Math.round(Number(fee)) : undefined,
      openingDeadline: deadline,
      advisorName: advisor.trim(),
      requiresSecondApproval: Boolean(stored.requiresSecondApproval),
      language: stored.language === "en" ? ("en" as const) : ("fr" as const),
    };
  };

  /** Enregistre le texte tel quel (aucun e-mail, aucune publication) ; renvoie vrai si le serveur l'a accepté. */
  const persist = async (): Promise<boolean> => {
    try {
      await saveDraft.mutateAsync(payload());
      setBaseline(text);
      setMetaBaseline(metaKey);
      setRestored(false);
      try { localStorage.removeItem(backupKey); } catch { /* stockage indisponible */ }
      wroteBackup.current = false;
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
    if (sending.current || alreadySent) return;
    sending.current = true;
    try {
      await sendOnce();
    } finally {
      sending.current = false;
    }
  };
  const sendOnce = async () => {
    if (needsSecondApproval) { toast({ title: "Seconde approbation requise", description: "Un autre administrateur doit d'abord approuver ce bilan sensible.", variant: "destructive" }); return; }
    if (!window.confirm(`Envoyer ce bilan à ${application?.fullName ?? "ce candidat"} dans son espace client et par e-mail ?`)) return;
    if (!validated && !(await validateNow())) return;
    try {
      const result = await sendNow.mutateAsync({ sessionToken, sourceRecordId: recordId, previewConfirmed: true as const, attachments: [] });
      setSentHere(true);
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

  // E-mail de test : le vrai message, envoyé à l'administrateur connecté seulement (jamais au candidat), à partir du brouillon enregistré.
  const sendTest = trpc.bilanFollowUp.sendTest.useMutation();
  const handleTest = async () => {
    if (dirty && !(await persist())) return;
    try {
      const result = await sendTest.mutateAsync({ sessionToken, sourceRecordId: recordId });
      toast({ title: "Test envoyé à votre adresse", description: result.message });
    } catch (caught) {
      fail("Test non envoyé", caught);
    }
  };
  const requestClose = (next: boolean) => {
    if (!next && dirty && !locked && !window.confirm("Fermer sans enregistrer ? Vos modifications seront perdues (une copie reste sur cet appareil).")) return;
    onOpenChange(next);
  };
  const onPasteBilan = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = event.clipboardData.getData("text/html");
    if (!html || !hasStructure(html)) return;
    const structured = htmlToStructuredText(html);
    if (!structured) return;
    event.preventDefault();
    const field = event.currentTarget;
    const inserted = insertAtSelection(text, field.selectionStart, field.selectionEnd, structured);
    setText(inserted.value);
    toast({ title: "Collage mis en forme", description: "Titres, listes, gras et tableaux sont conservés ; styles parasites et images retirés." });
  };
  const pickSkeleton = (kind: SkeletonKind) => { setText(bilanSkeleton(kind)); };
  const history = trpc.unifiedRequests.listEvaluationDeliveryHistory.useQuery({ sessionToken, sourceRecordId: recordId }, { enabled: open && Boolean(sessionToken) && alreadySent, refetchOnWindowFocus: false });
  const resend = trpc.unifiedRequests.resendEvaluationHistory.useMutation();
  const lastSent = (history.data as Array<{ id: number; status: string }> | undefined)?.find((item) => item.status === "sent");
  const handleResend = async () => {
    if (!lastSent || !window.confirm("Renvoyer l'e-mail du bilan au candidat ?")) return;
    try {
      const result = await resend.mutateAsync({ sessionToken, emailId: lastSent.id });
      toast({ title: "E-mail renvoyé", description: result.message });
    } catch (caught) {
      fail("Renvoi impossible", caught);
    }
  };

  const status = alreadySent ? "Envoyé au candidat" : validated ? "Validé — prêt à envoyer" : dirty ? "Modifications non enregistrées" : text.trim() ? "Enregistré — à valider" : "Aucun bilan saisi";

  const centered = (content: React.ReactNode, tone: "info" | "error" = "info") => (
    <div role={tone === "error" ? "alert" : "status"} className={`mx-auto max-w-xl rounded-xl border p-6 text-center text-sm ${tone === "error" ? "border-rose-200 bg-rose-50 text-rose-950" : "border-slate-200 bg-white text-slate-600"}`}>{content}</div>
  );

  return (
    <Dialog open={open} onOpenChange={requestClose}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen !max-w-none flex-col gap-3 overflow-hidden rounded-none border-0 bg-slate-50 p-3 sm:h-[calc(100vh-1rem)] sm:w-[calc(100vw-1rem)] sm:rounded-2xl sm:p-5">
        <DialogHeader className="shrink-0 space-y-1 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <DialogTitle>Bilan d'évaluation{application ? ` — ${application.fullName}` : ""}</DialogTitle>
          <DialogDescription>
            {application ? `${(application as { displayReference?: string | null }).displayReference ? `Référence ${(application as { displayReference?: string | null }).displayReference}` : "Sans référence de compte"} · ${application.destination || "destination à préciser"} · ${projectLabel}` : "Saisissez le bilan, relisez l'aperçu, validez puis envoyez."}
          </DialogDescription>
        </DialogHeader>

        {!sessionToken ? centered(<><strong className="block text-base">Session administrateur introuvable</strong><p className="mt-2">Reconnectez-vous à l'espace admin puis rouvrez ce bilan.</p></>, "error")
          : sourceType === "candidate" && bootstrapError ? centered(<><strong className="block text-base">Ouverture du dossier impossible</strong><p className="mt-2">{bootstrapError}</p><Button className="mt-4" variant="outline" disabled={initialize.isPending} onClick={retryBootstrap}><RefreshCw className="mr-2 h-4 w-4" />Réessayer</Button></>, "error")
          : (sourceType === "candidate" && !ready) || isLoading ? centered(<><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-700" />Chargement du dossier…</>)
          : isError || !data || !application ? centered(<><strong className="block text-base">Le bilan n'a pas pu être chargé</strong><p className="mt-2">{error?.message || "Aucune donnée reçue du serveur."}</p><Button className="mt-4" variant="outline" onClick={() => void refetch()}><RefreshCw className="mr-2 h-4 w-4" />Réessayer</Button></>, "error")
          : (
            <>
              {locked && <p className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950" role="status" data-testid="bilan-locked">{alreadySent ? "Ce bilan a déjà été envoyé : il n'est plus modifiable." : "L'évaluation de ce candidat a déjà été validée hors ligne : aucune nouvelle préparation n'est possible ici."}{alreadySent && lastSent && <Button type="button" size="sm" variant="outline" className="ml-3" disabled={resend.isPending} onClick={() => void handleResend()} data-testid="bilan-resend">{resend.isPending ? "Renvoi…" : "Renvoyer l'e-mail au candidat"}</Button>}</p>}
              <div className="flex shrink-0 gap-1 lg:hidden" role="tablist" aria-label="Saisie ou aperçu">
                <Button type="button" size="sm" role="tab" aria-selected={tab === "input"} variant={tab === "input" ? "default" : "outline"} onClick={() => setTab("input")} data-testid="bilan-tab-input">Saisie</Button>
                <Button type="button" size="sm" role="tab" aria-selected={tab === "preview"} variant={tab === "preview" ? "default" : "outline"} onClick={() => setTab("preview")} data-testid="bilan-tab-preview">Aperçu</Button>
              </div>
              <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
                <div className={`${tab === "preview" ? "hidden lg:flex" : "flex"} min-h-[320px] flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 lg:min-h-0`}>
                  {restored && <p className="mb-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950" role="status" data-testid="bilan-restored">Votre dernière saisie non enregistrée a été restaurée depuis cet appareil.</p>}
                  <details open className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-2" data-testid="bilan-meta">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-900">Informations du dossier (à choisir par vous)</summary>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <label className="text-xs font-semibold text-slate-700">Frais d'ouverture (XAF)
                        <Input type="number" inputMode="numeric" min={1000} step={500} value={fee} disabled={locked} placeholder={String(proposedOpeningFee(application.visaType ?? projectLabel))} onChange={(event) => setFee(event.target.value)} data-testid="bilan-fee" className="mt-1 bg-white" />
                      </label>
                      <label className="text-xs font-semibold text-slate-700">Ouvrir le dossier avant le
                        <Input type="date" value={deadline} disabled={locked} onChange={(event) => setDeadline(event.target.value)} data-testid="bilan-deadline" className="mt-1 bg-white" />
                      </label>
                      <label className="text-xs font-semibold text-slate-700">Conseiller référent
                        <Input type="text" maxLength={120} value={advisor} disabled={locked} onChange={(event) => setAdvisor(event.target.value)} data-testid="bilan-advisor" className="mt-1 bg-white" />
                      </label>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Dans le texte : {"{{montant}}"}, {"{{date_limite}}"}, {"{{conseiller}}"}. Le montant devient le montant attendu au paiement d'ouverture (jamais modifié une fois le paiement confirmé).</p>
                    <label className="mt-2 block text-xs font-semibold text-slate-700">Mot d'accompagnement en tête de l'e-mail (facultatif)
                      <Textarea value={note} disabled={locked} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={1500} data-testid="bilan-note" className="mt-1 bg-white text-sm" />
                    </label>
                  </details>
                  {!text.trim() && !locked && (
                    <label className="mb-2 block text-xs font-semibold text-slate-700">Partir d'un modèle
                      <select className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-2 text-sm" value="" onChange={(event) => event.target.value && pickSkeleton(event.target.value as SkeletonKind)} data-testid="bilan-skeleton">
                        <option value="">Choisir un canevas (structure sans contenu inventé)…</option>
                        <option value="travail">Visa travail</option><option value="etudes">Visa études</option><option value="tourisme">Tourisme / visite</option><option value="autre">Autre projet</option>
                      </select>
                    </label>
                  )}
                  <Label htmlFor="bilan-input" className="mb-1 text-sm font-semibold text-slate-900">Bilan</Label>
                  <Textarea id="bilan-input" data-testid="bilan-input" value={text} onChange={(event) => setText(event.target.value)} placeholder={PLACEHOLDER} disabled={locked} spellCheck onPaste={onPasteBilan} className="min-h-0 flex-1 resize-none font-sans text-sm leading-6" />
                  <p className="mt-1 text-xs text-slate-500" data-testid="bilan-status" role="status" aria-live="polite">{status} · {inspection.words} mot{inspection.words > 1 ? "s" : ""}</p>
                </div>
                <div className={`${tab === "input" ? "hidden lg:flex" : "flex"} min-h-[420px] flex-col rounded-xl border border-slate-200 bg-white p-3 lg:min-h-0`}>
                  <p className="mb-1 text-sm font-semibold text-slate-900">Aperçu en direct — ce que le candidat recevra</p>
                  {previewDocument
                    ? <iframe title="Aperçu du bilan" data-testid="bilan-live-preview" sandbox="" srcDoc={previewDocument} className="min-h-0 w-full flex-1 rounded border bg-white" />
                    : <div className="flex flex-1 items-center justify-center rounded border border-dashed p-6 text-center text-sm text-slate-500" data-testid="bilan-live-preview-empty">L'aperçu apparaît ici dès les premiers mots saisis.</div>}
                  {previewDocument && application && (
                    <div className="mt-2" data-testid="bilan-print-zone">
                      <BilanDocumentActions getDocumentHtml={() => previewDocument} title={`Évaluation professionnelle — ${projectLabel}`} candidateName={application.fullName} reference={(application as { displayReference?: string | null }).displayReference ?? null} />
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-3" data-testid="bilan-actions">
                {blockers.length > 0
                  ? <ul className="mb-2 list-disc space-y-0.5 pl-5 text-xs text-rose-900" data-testid="bilan-blockers" aria-label="À corriger avant validation">{blockers.map((line) => <li key={line}>{needles[line] ? <button type="button" className="text-left underline decoration-dotted underline-offset-2" onClick={() => locate(needles[line])} data-testid="bilan-blocker-locate">{line}</button> : line}</li>)}</ul>
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
                  <Button type="button" variant="outline" disabled={locked || busy || sendTest.isPending || !text.trim()} onClick={() => void handleTest()} data-testid="bilan-test-email">{sendTest.isPending ? "Envoi du test…" : "M'envoyer un test"}</Button>
                  <Button type="button" className="bg-blue-700 hover:bg-blue-800" disabled={locked || busy || blockers.length > 0} onClick={() => void handleSend()} data-testid="bilan-validate-send">{alreadySent ? "Bilan déjà envoyé" : sendNow.isPending ? "Envoi…" : "Envoyer (espace client + e-mail)"}</Button>
                </div>
              </div>
            </>
          )}
      </DialogContent>
    </Dialog>
  );
}
