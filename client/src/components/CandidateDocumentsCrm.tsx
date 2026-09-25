import React, { useMemo, useState } from "react";
import { CheckCircle2, Download, FileUp, Plus, RotateCcw, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
};

type Dialogs = { kind: "deposit" | "reject" | "add" | null; requirement?: CrmRequirement };

/** Pièces du dossier : une ligne par pièce, une action principale par état. */
export default function CandidateDocumentsCrm({ sessionToken, candidateId, requirements, documents, onChanged, onRemind, reminding }: Props) {
  const [filter, setFilter] = useState<CrmFilter>("all");
  const [dialog, setDialog] = useState<Dialogs>({ kind: null });
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
          {summary.awaitingCandidate > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={onRemind} disabled={reminding}><Send className="mr-1.5 h-4 w-4" aria-hidden="true" />{reminding ? "Envoi…" : `Relancer (${summary.awaitingCandidate})`}</Button>
          )}
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
            return (
              <li key={requirement.id} className="space-y-2.5 p-4" data-testid={`crm-row-${requirement.id}`} data-status={status}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{requirement.documentType}</p>
                    {requirement.adminComment && <p className="mt-0.5 text-xs text-slate-500">{requirement.adminComment}</p>}
                    {due && <p className={`mt-0.5 text-xs font-semibold ${due.overdue ? "text-rose-700" : "text-slate-500"}`}>{due.text}</p>}
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
    </section>
  );
}

function DepositDialog({ open, requirement, busy, onClose, onSubmit }: { open: boolean; requirement?: CrmRequirement; busy: boolean; onClose: () => void; onSubmit: (values: { file: File; receivedAt: string; note: string; validate: boolean; documentType: string }) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [receivedAt, setReceivedAt] = useState(today());
  const [note, setNote] = useState("");
  const [validate, setValidate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    if (!file) return setError("Choisissez le fichier scanné ou photographié.");
    if (file.size > MAX_FILE_BYTES) return setError("Le fichier ne doit pas dépasser 8 Mo.");
    setError(null);
    onSubmit({ file, receivedAt, note, validate, documentType: requirement?.documentType ?? "" });
  };
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) { setFile(null); setNote(""); setValidate(false); setError(null); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Déposer un document reçu en agence</DialogTitle>
          <DialogDescription>{requirement ? `Pièce : ${requirement.documentType}. ` : ""}Le fichier sera visible dans l’espace du candidat, qui en est averti.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
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
