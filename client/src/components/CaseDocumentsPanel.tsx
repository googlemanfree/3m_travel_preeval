import React from "react";
import { Building2, Download, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type ClientCaseDocument = {
  id: number;
  documentType: string;
  fileName: string;
  uploadedAt?: string | Date | null;
  uploadedByRole?: string | null;
  reviewStatus?: string | null;
  reviewNote?: string | null;
};

const STATUS_FR: Record<string, { label: string; tone: string }> = {
  received: { label: "Reçu — en cours de vérification", tone: "bg-blue-50 text-blue-900 border-blue-200" },
  pending: { label: "En attente de vérification", tone: "bg-amber-50 text-amber-900 border-amber-200" },
  approved: { label: "Validé", tone: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  rejected: { label: "À corriger", tone: "bg-rose-50 text-rose-900 border-rose-200" },
  correction_required: { label: "À corriger", tone: "bg-rose-50 text-rose-900 border-rose-200" },
};

/** Documents que l'équipe a enregistrés pour le candidat (pièces remises en agence) : visibles avec leur état. */
export function agencyDepositedDocuments(cases: unknown): ClientCaseDocument[] {
  const list = Array.isArray(cases) ? cases : [];
  return list
    .flatMap((item) => (Array.isArray((item as { documents?: unknown })?.documents) ? ((item as { documents: ClientCaseDocument[] }).documents) : []))
    .filter((document) => document && document.uploadedByRole && document.uploadedByRole !== "candidate")
    .sort((a, b) => new Date(String(b.uploadedAt ?? 0)).getTime() - new Date(String(a.uploadedAt ?? 0)).getTime());
}

export default function CaseDocumentsPanel({ documents, onDownload }: { documents: ClientCaseDocument[]; onDownload: (documentId: number) => void }) {
  if (documents.length === 0) return null;
  return (
    <Card className="border-blue-100 bg-white p-6 shadow-sm" aria-labelledby="agency-deposits-title" data-testid="agency-deposits">
      <h3 id="agency-deposits-title" className="flex items-center gap-2 text-lg font-bold text-gray-900"><Building2 className="h-5 w-5 text-blue-700" aria-hidden="true" /> Documents enregistrés par l’agence</h3>
      <p className="mt-1 text-sm text-slate-600">Ces documents ont été remis à l’agence puis ajoutés à votre dossier par un conseiller.</p>
      <ul className="mt-4 divide-y">
        {documents.map((document) => {
          const status = STATUS_FR[String(document.reviewStatus)] ?? STATUS_FR.received;
          return (
            <li key={document.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><FileText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" /><span className="truncate">{document.documentType}</span></p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{document.fileName}{document.uploadedAt ? ` · ${new Date(document.uploadedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}` : ""}</p>
                {String(document.reviewStatus).includes("reject") || document.reviewStatus === "correction_required" ? (document.reviewNote ? <p className="mt-1 text-xs font-medium text-rose-800">{document.reviewNote}</p> : null) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.tone}`}>{status.label}</span>
                <Button type="button" size="sm" variant="outline" onClick={() => onDownload(document.id)} aria-label={`Télécharger ${document.fileName}`}><Download className="h-4 w-4" aria-hidden="true" /></Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
