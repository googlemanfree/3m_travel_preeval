import { useState } from "react";
import { Building2, CheckCircle2, ChevronDown, ChevronRight, Clock, Download, Eye, FileText, Globe2, Upload, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approvalRate, isAgencyHandedDocument, type CandidateDocumentGroup, type GroupableDocument } from "@/lib/documentGroups";

type Props<T extends GroupableDocument & { documentName: string; documentUrl: string; replacesId?: number | null; humanVerified?: boolean }> = {
  groups: CandidateDocumentGroup<T>[];
  busy: boolean;
  typeLabel: (type: string) => string;
  onPreview: (document: T) => void;
  onDownload: (document: T) => void;
  onApprove: (document: T) => void;
  onSetPending: (document: T) => void;
  onReject: (document: T) => void;
  /** Ouvre le dépôt rapide déjà prérempli sur ce candidat, pour les pièces remises en agence. */
  onAddDocuments: (group: CandidateDocumentGroup<T>) => void;
};

const STATUS_LABEL = { approved: "Approuvé", pending: "En attente", rejected: "Rejeté" } as const;
const STATUS_STYLE = { approved: "bg-emerald-100 text-emerald-800", pending: "bg-amber-100 text-amber-900", rejected: "bg-red-100 text-red-800" } as const;

/** Une fiche par candidat ; ses pièces sont listées une à une, avec leur origine (en ligne ou remise en agence) et leurs actions. */
export default function AdminDocumentsByCandidate<T extends GroupableDocument & { documentName: string; documentUrl: string; replacesId?: number | null; humanVerified?: boolean }>({
  groups,
  busy,
  typeLabel,
  onPreview,
  onDownload,
  onApprove,
  onSetPending,
  onReject,
  onAddDocuments,
}: Props<T>) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const allOpen = groups.length > 0 && groups.every((group) => open[group.key]);
  const toggleAll = () => setOpen(allOpen ? {} : Object.fromEntries(groups.map((group) => [group.key, true])));

  if (groups.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500" data-testid="documents-by-candidate-empty">
        <FileText className="mx-auto mb-3 h-12 w-12 text-gray-300" aria-hidden="true" />
        <p>Aucun document trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="documents-by-candidate">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{groups.length} candidat(s) · les pièces à contrôler sont en tête</span>
        <button type="button" onClick={toggleAll} className="font-semibold text-blue-700 hover:underline">{allOpen ? "Tout replier" : "Tout déplier"}</button>
      </div>
      {groups.map((group) => {
        const expanded = Boolean(open[group.key]);
        const rate = approvalRate(group);
        return (
          <section key={group.key} className="rounded-2xl border border-slate-200 bg-white shadow-sm" data-testid="candidate-document-group" aria-label={`Documents de ${group.candidateName}`}>
            <div className="flex flex-wrap items-center gap-3 p-4">
              <button type="button" onClick={() => setOpen((current) => ({ ...current, [group.key]: !expanded }))} aria-expanded={expanded} aria-label={`${expanded ? "Replier" : "Déplier"} les documents de ${group.candidateName}`} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />}
                <span className="min-w-0">
                  <span className="block truncate font-bold text-slate-950">{group.candidateName}</span>
                  <span className="block truncate text-xs text-slate-500"><span className="font-mono text-blue-700">{group.dossierNumber}</span>{group.candidateEmail ? ` · ${group.candidateEmail}` : ""}</span>
                </span>
              </button>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">{group.total} pièce(s)</span>
                {group.pending > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900" data-testid="group-pending">{group.pending} à contrôler</span>}
                {group.rejected > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">{group.rejected} rejetée(s)</span>}
                {group.agencyCount > 0 && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-800">{group.agencyCount} remise(s) en agence</span>}
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">{rate}% validé</span>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => onAddDocuments(group)} className="gap-1.5" data-testid="add-agency-documents">
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />Ajouter une pièce remise en agence
              </Button>
            </div>
            {expanded && (
              <ul className="divide-y divide-slate-100 border-t border-slate-100" data-testid="candidate-document-list">
                {group.documents.map((document) => {
                  const fromAgency = isAgencyHandedDocument(document);
                  return (
                    <li key={`${document.source}:${document.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3" data-testid="candidate-document-row">
                      <FileText className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{typeLabel(document.documentType)}</p>
                        <p className="truncate text-xs text-slate-500">{document.documentName}</p>
                        {document.replacesId ? <span className="mt-0.5 inline-flex rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">Correction de la version #{document.replacesId}</span> : null}
                      </div>
                      <Badge variant="outline" className={`gap-1 ${fromAgency ? "border-violet-200 bg-violet-50 text-violet-800" : "border-slate-200 text-slate-600"}`}>
                        {fromAgency ? <Building2 className="h-3 w-3" aria-hidden="true" /> : <Globe2 className="h-3 w-3" aria-hidden="true" />}
                        {fromAgency ? "Remis en agence" : "Déposé en ligne"}
                      </Badge>
                      <Badge className={STATUS_STYLE[document.verificationStatus]}>{STATUS_LABEL[document.verificationStatus]}</Badge>
                      <span className="w-24 shrink-0 text-xs text-slate-500">{new Date(document.submittedAt).toLocaleDateString("fr-FR")}</span>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => onPreview(document)} title="Aperçu" aria-label={`Aperçu de ${document.documentName}`} className="bg-blue-50 text-blue-600"><Eye className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => onDownload(document)} title="Télécharger" aria-label={`Télécharger ${document.documentName}`} className="bg-slate-50 text-slate-600"><Download className="h-4 w-4" /></Button>
                        {document.verificationStatus !== "approved" && <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onApprove(document)} title="Valider" aria-label={`Valider ${document.documentName}`} className="text-green-600"><CheckCircle2 className="h-4 w-4" /></Button>}
                        {document.verificationStatus !== "pending" && <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onSetPending(document)} title="Remettre en attente" aria-label={`Remettre ${document.documentName} en attente`} className="text-amber-600"><Clock className="h-4 w-4" /></Button>}
                        {document.verificationStatus !== "rejected" && <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onReject(document)} title="Rejeter" aria-label={`Rejeter ${document.documentName}`} className="text-red-600"><XCircle className="h-4 w-4" /></Button>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
