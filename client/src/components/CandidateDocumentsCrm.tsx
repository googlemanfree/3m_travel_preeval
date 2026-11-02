import React, { useMemo, useState } from "react";
import { CheckCircle2, Download, FileUp, MessageSquarePlus, Plus, RotateCcw, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { buildDocumentBilan, documentBilanFileName } from "@/lib/documentBilan";
import { downloadDocumentBilanPdf } from "@/lib/documentBilanPdf";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CRM_FILTERS,
  CRM_FILTER_LABELS,
  REQUIREMENT_STATUS_LABELS,
  ROW_ACTION_LABELS,
  dueLabel,
  fileToBase64,
  filterRequirements,
  latestFileFor,
  normalizeStatus,
  originLabel,
  rowActions,
  summarizeRequirements,
  type CrmDocument,
  type CrmFilter,
  type CrmRequirement,
  type RequirementStatus,
  type RowAction,
} from "@/lib/requirementsCrm";

const STATUS_STYLES: Record<RequirementStatus, string> = {
  pending: "bg-amber-50 text-amber-900 border-amber-200",
  received: "bg-blue-50 text-blue-900 border-blue-200",
  approved: "bg-emerald-50 text-emerald-900 border-emerald-200",
  rejected: "bg-rose-50 text-rose-900 border-rose-200",
  waived: "bg-slate-100 text-slate-700 border-slate-200",
};

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const today = () => new Date().toISOString().slice(0, 10);

type Props = {
  sessionToken: string;
  candidateId: string;
  requirements: CrmRequirement[];
  documents: CrmDocument[];
  onChanged: () => void;
  onRemind: () => void;
  reminding?: boolean;
  /** Identité du dossier pour le bilan PDF ; sans elle, le bouton n'apparaît pas. */
  bilanContext?: { candidateName: string; reference: string; destination?: string | null; /** Identifiant numérique du compte candidat : active l'export ZIP. */ exportCandidateId?: number };
};

type Dialogs = { kind: "deposit" | "reject" | "add" | "request" | null; requirement?: CrmRequirement };

/** Pièces du dossier : une ligne par pièce, une action principale par état. */
export default function CandidateDocumentsCrm({ sessionToken, candidateId, requirements, documents, onChanged, onRemind, reminding, bilanContext }: Props) {
  const [filter, setFilter] = useState<CrmFilter>("all");
  const [bilanBusy, setBilanBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const exportZip = async () => {
    const exportId = bilanContext?.exportCandidateId;
    if (!exportId || exportId <= 0) return;
    setExportBusy(true);
    try {
      const response = await fetch("/api/admin/dossier-export", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ candidateId: exportId }),
      });
      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.error || "Export impossible.");
      }
      const skipped = Number(response.headers.get("X-Export-Skipped") || 0);
      const disposition = response.headers.get("Content-Disposition") || "";
      const name = /filename="([^"]+)"/.exec(disposition)?.[1] || "Dossier_pieces.zip";
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success(skipped > 0 ? `Export créé : ${skipped} pièce(s) non incluse(s), détail dans LISEZ-MOI.txt.` : "Export des pièces créé.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export impossible.");
    } finally {
      setExportBusy(false);
    }
  };
  const downloadBilan = async () => {
    if (!bilanContext) return;
    setBilanBusy(true);
    try {
      const bilan = buildDocumentBilan({ ...bilanContext, requirements, documents });
      await downloadDocumentBilanPdf(bilan, documentBilanFileName(bilanContext.reference));
    } catch {
      toast.error("Le bilan PDF n'a pas pu être créé.");
    } finally {
      setBilanBusy(false);
    }
  };
  const [dialog, setDialog] = useState<Dialogs>({ kind: null });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const summary = useMemo(() => summarizeRequirements(requirements), [requirements]);
  const rows = useMemo(() => filterRequirements(requirements, filter), [requirements, filter]);
  const now = Date.now();

  const done = (message: string) => {
    toast.success(message);
    setDialog({ kind: null });
    onChanged();
  };
  const failed = (error: { message?: string }) => toast.error(error.message || "L’action n’a pas pu être enregistrée.");

  const decide = trpc.adminCaseDesk.setRequirementStatus.useMutation({ onSuccess: (_result, variables) => { const status = (variables as { status?: string } | undefined)?.status; done(status === "approved" ? "Pièce validée : le candidat est prévenu." : status === "rejected" ? "Pièce à corriger : le candidat est prévenu." : status === "waived" ? "Pièce marquée non requise." : "Pièce rouverte."); }, onError: failed });
  const deposit = trpc.adminCaseDesk.depositDocument.useMutation({ onSuccess: (_result, variables) => done((variables as { validate?: boolean } | undefined)?.validate ? "Document déposé et validé : visible dans l’espace du candidat." : "Document déposé : visible dans l’espace du candidat, à vérifier."), onError: failed });
  const add = trpc.adminCaseDesk.addRequirement.useMutation({ onSuccess: () => done("Pièce ajoutée à la checklist."), onError: failed });
  const request = trpc.admin.requestCandidate360Document.useMutation({ onSuccess: () => done("Demande de pièce envoyée au candidat."), onError: failed });
  const bulkApprove = trpc.adminCaseDesk.approveRequirementsBulk.useMutation({ onSuccess: (result) => { setSelectedIds(new Set()); done(`${result.validatedCount} pièce${result.validatedCount > 1 ? "s" : ""} validée${result.validatedCount > 1 ? "s" : ""}.`); }, onError: failed });
  const selectableRows = rows.filter((requirement) => { const status = normalizeStatus(requirement.status); return status !== "approved" && status !== "waived"; });
  const allSelectableSelected = selectableRows.length > 0 && selectableRows.every((requirement) => selectedIds.has(requirement.id));
  const toggleAll = () => setSelectedIds((current) => {
    const next = new Set(current);
    if (allSelectableSelected) selectableRows.forEach((requirement) => next.delete(requirement.id));
    else selectableRows.forEach((requirement) => next.add(requirement.id));
    return next;
  });

  const act = (action: RowAction, requirement: CrmRequirement) => {
    if (action === "deposit") setDialog({ kind: "deposit", requirement });
    else if (action === "reject") setDialog({ kind: "reject", requirement });
    else if (action === "approve") decide.mutate({ sessionToken, candidateId, requirementId: requirement.id, status: "approved" });
    else if (action === "waive") decide.mutate({ sessionToken, candidateId, requirementId: requirement.id, status: "waived" });
    else decide.mutate({ sessionToken, candidateId, requirementId: requirement.id, status: "pending" });
  };

  return (
    <section className="rounded-xl border bg-white" aria-labelledby="crm-documents-title" data-testid="documents-crm">
      <header className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h4 id="crm-documents-title" className="font-semibold text-slate-900">Pièces du dossier</h4>
          <div className="mt-2 flex items-center gap-3" role="group" aria-label="Progression des pièces">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100" aria-hidden="true"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${summary.percent}%` }} /></div>
            <p className="text-sm text-slate-600" data-testid="crm-progress">{summary.total === 0 ? "Aucune pièce demandée" : `${summary.validated} sur ${summary.total} validée${summary.validated > 1 ? "s" : ""}`}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {bilanContext && (
            <Button type="button" variant="outline" size="sm" onClick={() => void downloadBilan()} disabled={bilanBusy} data-testid="documents-bilan-pdf">
              <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />{bilanBusy ? "Création…" : "Bilan PDF"}
            </Button>
          )}
          {bilanContext?.exportCandidateId ? (
            <Button type="button" variant="outline" size="sm" onClick={() => void exportZip()} disabled={exportBusy} data-testid="documents-export-zip">
              <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />{exportBusy ? "Export…" : "Exporter (ZIP)"}
            </Button>
          ) : null}
          {summary.awaitingCandidate > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={onRemind} disabled={reminding}><Send className="mr-1.5 h-4 w-4" aria-hidden="true" />{reminding ? "Envoi…" : `Relancer (${summary.awaitingCandidate})`}</Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => setDialog({ kind: "deposit" })} data-testid="crm-deposit-free"><FileUp className="mr-1.5 h-4 w-4" aria-hidden="true" />Déposer un document</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setDialog({ kind: "request" })}><MessageSquarePlus className="mr-1.5 h-4 w-4" aria-hidden="true" />Demander une pièce</Button>
          <Button type="button" size="sm" onClick={() => setDialog({ kind: "add" })}><Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />Ajouter une pièce</Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b px-4 py-3" role="tablist" aria-label="Filtrer les pièces">
        {CRM_FILTERS.map((item) => (
          <button key={item} type="button" role="tab" aria-selected={filter === item} onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${filter === item ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
            {CRM_FILTER_LABELS[item]} ({summary.counts[item]})
          </button>
        ))}
      </div>

      {selectableRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-4 py-3" data-testid="bulk-document-actions">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={allSelectableSelected} onChange={toggleAll} aria-label="Sélectionner toutes les pièces à valider" className="h-4 w-4 rounded border-slate-300" />Sélectionner les pièces à valider</label>
          <Button type="button" size="sm" disabled={selectedIds.size === 0 || bulkApprove.isPending} onClick={() => bulkApprove.mutate({ sessionToken, candidateId, requirementIds: Array.from(selectedIds) })}>{bulkApprove.isPending ? "Validation…" : `Valider la sélection (${selectedIds.size})`}</Button>
        </div>
      )}

      {requirements.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">Aucune pièce demandée pour l’instant. Ajoutez une pièce, ou créez la checklist de la procédure dans « Outils du dossier » plus bas.</p>
      ) : rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">Aucune pièce dans ce filtre.</p>
      ) : (
        <ul className="divide-y" data-testid="crm-rows">
          {rows.map((requirement) => {
            const status = normalizeStatus(requirement.status);
            const file = latestFileFor(requirement, documents);
            const due = dueLabel(requirement, now);
            const actions = rowActions(status);
            const selectable = status !== "approved" && status !== "waived";
            return (
              <li key={requirement.id} className="space-y-2.5 p-4" data-testid={`crm-row-${requirement.id}`} data-status={status}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    {selectable && <input type="checkbox" checked={selectedIds.has(requirement.id)} onChange={() => setSelectedIds((current) => { const next = new Set(current); if (next.has(requirement.id)) next.delete(requirement.id); else next.add(requirement.id); return next; })} aria-label={`Sélectionner ${requirement.documentType} pour validation`} className="mt-0.5 h-4 w-4 rounded border-slate-300" />}
                    <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{requirement.documentType}</p>
                    {requirement.adminComment && <p className="mt-0.5 text-xs text-slate-500">{requirement.adminComment}</p>}
                    {due && <p className={`mt-0.5 text-xs font-semibold ${due.overdue ? "text-rose-700" : "text-slate-500"}`}>{due.text}</p>}
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>{REQUIREMENT_STATUS_LABELS[status]}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 text-xs text-slate-600">
                  {file ? (
                    <>
                      <p className="truncate font-medium text-slate-800">{file.fileName}</p>
                      <p>{originLabel(file.origin)}{file.uploadedAt ? ` · ${new Date(file.uploadedAt).toLocaleDateString("fr-FR")}` : ""}</p>
                    </>
                  ) : <span className="text-slate-400">Aucun fichier</span>}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {file?.url && <a href={file.url} target="_blank" rel="noopener noreferrer" aria-label={`Télécharger ${file.fileName}`} className="inline-flex h-8 items-center rounded-md border border-slate-200 px-2 text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" aria-hidden="true" /></a>}
                  {actions.map((action, index) => (
                    <Button key={action} type="button" size="sm" variant={index === 0 && action !== "reopen" ? "default" : "outline"} className={`h-8 px-2.5 text-xs ${index === 0 && action === "approve" ? "bg-emerald-700 hover:bg-emerald-800" : ""}`} disabled={decide.isPending} onClick={() => act(action, requirement)} aria-label={`${ROW_ACTION_LABELS[action]} — ${requirement.documentType}`}>
                      {action === "deposit" && <FileUp className="mr-1 h-3.5 w-3.5" aria-hidden="true" />}
                      {action === "approve" && <CheckCircle2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />}
                      {action === "reject" && <XCircle className="mr-1 h-3.5 w-3.5" aria-hidden="true" />}
                      {action === "reopen" && <RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />}
                      {ROW_ACTION_LABELS[action]}
                    </Button>
                  ))}
                </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <DepositDialog open={dialog.kind === "deposit"} requirement={dialog.requirement} busy={deposit.isPending} onClose={() => setDialog({ kind: null })} onSubmit={async (values) => {
        try {
          const base64 = await fileToBase64(values.file);
          deposit.mutate({ sessionToken, candidateId, requirementId: dialog.requirement?.id, documentType: dialog.requirement ? undefined : values.documentType, fileName: values.file.name, base64, receivedAt: values.receivedAt, note: values.note || undefined, validate: values.validate });
        } catch (error) {
          failed(error as Error);
        }
      }} />
      <RejectDialog open={dialog.kind === "reject"} requirement={dialog.requirement} busy={decide.isPending} onClose={() => setDialog({ kind: null })} onSubmit={(comment) => dialog.requirement && decide.mutate({ sessionToken, candidateId, requirementId: dialog.requirement.id, status: "rejected", comment })} />
      <AddDialog open={dialog.kind === "add"} busy={add.isPending} onClose={() => setDialog({ kind: null })} onSubmit={(values) => add.mutate({ sessionToken, candidateId, documentType: values.documentType, comment: values.comment || undefined, dueAt: values.dueAt || undefined })} />
      <RequestDialog open={dialog.kind === "request"} busy={request.isPending} onClose={() => setDialog({ kind: null })} onSubmit={(values) => request.mutate({ sessionToken, candidateId, documentLabel: values.documentLabel, details: values.details || undefined })} />
    </section>
  );
}

const DEPOSIT_DOCUMENT_TYPES = [
  "CV",
  "Passeport",
  "Photo d’identité",
  "Diplôme",
  "Relevé de notes",
  "Lettre d’admission",
  "Justificatif de domicile",
  "Justificatif de ressources",
  "Itinéraire de voyage",
  "Preuves d’attaches",
  "Justificatif de paiement",
  "Casier judiciaire",
  "Acte de naissance",
  "Autre document",
] as const;

function DepositDialog({ open, requirement, busy, onClose, onSubmit }: { open: boolean; requirement?: CrmRequirement; busy: boolean; onClose: () => void; onSubmit: (values: { file: File; receivedAt: string; note: string; validate: boolean; documentType: string }) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [receivedAt, setReceivedAt] = useState(today());
  const [note, setNote] = useState("");
  const [validate, setValidate] = useState(false);
  const [documentType, setDocumentType] = useState(requirement?.documentType ?? "");
  const [customType, setCustomType] = useState("");
  const [error, setError] = useState<string | null>(null);
  React.useEffect(() => {
    if (!open) return;
    setDocumentType(requirement?.documentType ?? "");
    setCustomType("");
    setFile(null);
    setNote("");
    setValidate(false);
    setError(null);
    setReceivedAt(today());
  }, [open, requirement?.id, requirement?.documentType]);
  const lockedType = Boolean(requirement?.documentType);
  const resolvedType = lockedType ? (requirement?.documentType ?? "") : documentType === "Autre document" ? customType.trim() : documentType.trim();
  const submit = () => {
    if (!file) return setError("Choisissez le fichier scanné ou photographié.");
    if (file.size > MAX_FILE_BYTES) return setError("Le fichier ne doit pas dépasser 8 Mo.");
    if (resolvedType.trim().length < 2) return setError("Indiquez précisément quel document vous déposez (ex. CV, passeport, lettre d’admission).");
    setError(null);
    onSubmit({ file, receivedAt, note, validate, documentType: resolvedType.trim() });
  };
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) { setFile(null); setNote(""); setValidate(false); setDocumentType(requirement?.documentType ?? ""); setCustomType(""); setError(null); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Déposer un document reçu en agence</DialogTitle>
          <DialogDescription>
            {lockedType
              ? `Pièce concernée : ${requirement!.documentType}. Le fichier sera visible dans l’espace du candidat.`
              : "Choisissez d’abord le type de pièce, puis le fichier. Le candidat en est averti."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {lockedType ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-950" data-testid="deposit-document-type-locked">
              Document à téléverser : {requirement!.documentType}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="deposit-type">Quel document déposez-vous ?</Label>
              <select
                id="deposit-type"
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                data-testid="deposit-document-type"
                aria-required="true"
              >
                <option value="">Choisir le type de document…</option>
                {DEPOSIT_DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {documentType === "Autre document" ? (
                <Input
                  value={customType}
                  onChange={(event) => setCustomType(event.target.value)}
                  placeholder="Précisez le document (ex. Attestation d’hébergement)"
                  maxLength={100}
                  className="mt-1"
                  data-testid="deposit-document-type-custom"
                />
              ) : null}
            </div>
          )}
          <div><Label htmlFor="deposit-file">Fichier (PDF, JPG ou PNG, 8 Mo maximum)</Label><Input id="deposit-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-1" /></div>
          <div><Label htmlFor="deposit-date">Date de remise en agence</Label><Input id="deposit-date" type="date" max={today()} value={receivedAt} onChange={(event) => setReceivedAt(event.target.value)} className="mt-1" /></div>
          <div><Label htmlFor="deposit-note">Note (facultatif, visible par le candidat)</Label><Textarea id="deposit-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={2} className="mt-1" /></div>
          <label className="flex items-start gap-2 text-sm text-slate-800"><input type="checkbox" checked={validate} onChange={(event) => setValidate(event.target.checked)} className="mt-1 h-4 w-4" />J’ai contrôlé ce document sur place : le valider tout de suite.</label>
          {error && <p role="alert" className="text-sm font-semibold text-rose-700">{error}</p>}
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Annuler</Button><Button type="button" onClick={submit} disabled={busy}>{busy ? "Envoi…" : "Déposer le document"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ open, requirement, busy, onClose, onSubmit }: { open: boolean; requirement?: CrmRequirement; busy: boolean; onClose: () => void; onSubmit: (comment: string) => void }) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) { setComment(""); setError(null); onClose(); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Demander une correction</DialogTitle><DialogDescription>{requirement ? `Pièce : ${requirement.documentType}. ` : ""}Expliquez au candidat ce qui doit être corrigé : ce message lui est affiché.</DialogDescription></DialogHeader>
        <div><Label htmlFor="reject-comment">Ce qui doit être corrigé</Label><Textarea id="reject-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={3} className="mt-1" placeholder="Ex. la photo est floue : scannez les deux pages." />{error && <p role="alert" className="mt-1 text-sm font-semibold text-rose-700">{error}</p>}</div>
        <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Annuler</Button><Button type="button" className="bg-rose-700 hover:bg-rose-800" disabled={busy} onClick={() => { if (comment.trim().length < 5) return setError("Indiquez ce qu’il doit corriger (5 caractères minimum)."); setError(null); onSubmit(comment.trim()); }}>{busy ? "Envoi…" : "Demander la correction"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddDialog({ open, busy, onClose, onSubmit }: { open: boolean; busy: boolean; onClose: () => void; onSubmit: (values: { documentType: string; comment: string; dueAt: string }) => void }) {
  const [documentType, setDocumentType] = useState("");
  const [comment, setComment] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) { setDocumentType(""); setComment(""); setDueAt(""); setError(null); onClose(); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Ajouter une pièce à demander</DialogTitle><DialogDescription>La pièce apparaît dans le suivi du candidat, qui en est averti.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div><Label htmlFor="add-type">Pièce demandée</Label><Input id="add-type" value={documentType} onChange={(event) => setDocumentType(event.target.value)} maxLength={100} className="mt-1" placeholder="Ex. Attestation d’hébergement" /></div>
          <div><Label htmlFor="add-comment">Précision pour le candidat (facultatif)</Label><Textarea id="add-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} rows={2} className="mt-1" /></div>
          <div><Label htmlFor="add-due">À fournir avant le (facultatif)</Label><Input id="add-due" type="date" min={today()} value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-1" /></div>
          {error && <p role="alert" className="text-sm font-semibold text-rose-700">{error}</p>}
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Annuler</Button><Button type="button" disabled={busy} onClick={() => { if (documentType.trim().length < 2) return setError("Indiquez la pièce à demander."); setError(null); onSubmit({ documentType: documentType.trim(), comment: comment.trim(), dueAt }); }}>{busy ? "Ajout…" : "Ajouter"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestDialog({ open, busy, onClose, onSubmit }: { open: boolean; busy: boolean; onClose: () => void; onSubmit: (values: { documentLabel: string; details: string }) => void }) {
  const [documentLabel, setDocumentLabel] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const reset = () => { setDocumentLabel(""); setDetails(""); setError(null); };
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) { reset(); onClose(); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Demander une pièce précise</DialogTitle><DialogDescription>La demande sera enregistrée dans le dossier, affichée dans l’espace client et transmise au candidat par notification et e-mail.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div><Label htmlFor="request-document-label">Pièce demandée</Label><Input id="request-document-label" value={documentLabel} onChange={(event) => setDocumentLabel(event.target.value)} maxLength={180} placeholder="Ex. Attestation d’emploi signée" className="mt-1" /></div>
          <div><Label htmlFor="request-document-details">Consigne au candidat</Label><Textarea id="request-document-details" value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1500} rows={4} className="mt-1" placeholder="Précisez le format, la période ou les éléments à vérifier." /></div>
          {error && <p role="alert" className="text-sm font-semibold text-rose-700">{error}</p>}
        </div>
        <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Annuler</Button><Button type="button" disabled={busy} onClick={() => { if (documentLabel.trim().length < 2) return setError("Indiquez le nom de la pièce demandée."); setError(null); onSubmit({ documentLabel: documentLabel.trim(), details: details.trim() }); }}>{busy ? "Envoi…" : "Envoyer la demande"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
