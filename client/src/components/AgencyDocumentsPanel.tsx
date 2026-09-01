import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DocumentReceiptButton from "@/components/DocumentReceiptButton";
import { DocumentPreviewModal } from "@/components/DocumentPreviewModal";
import { ShieldCheck, FileText, FileCheck2, Download, Eye, MessageSquare } from "lucide-react";

export type AgencyDocumentView = {
  id: number;
  documentType: string;
  documentName: string;
  documentUrl: string;
  fileSize?: number | null;
  source: "agency_scan" | "admin_upload" | "candidate_upload";
  uploadedBy?: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationComment?: string | null;
  createdAt: Date | string;
  annotations?: Array<{
    id: number;
    message: string;
    areaLabel?: string | null;
    status: "open" | "resolved";
    createdAt: Date | string;
  }>;
};

function statusLabel(status: AgencyDocumentView["verificationStatus"]): string {
  if (status === "verified") return "Validé";
  if (status === "rejected") return "À corriger";
  return "En vérification";
}

function statusClass(status: AgencyDocumentView["verificationStatus"]): string {
  if (status === "verified") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
}

export default function AgencyDocumentsPanel({
  documents,
  candidateName = "Candidat",
  candidateEmail = "",
  dossierNumber,
}: {
  documents: AgencyDocumentView[];
  candidateName?: string;
  candidateEmail?: string;
  dossierNumber?: string | null;
}) {
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);

  return (
    <Card className="mb-8 border-blue-100 bg-white shadow-sm">
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        documentTitle={previewDoc?.title || ""}
        documentUrl={previewDoc?.url || ""}
      />
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Documents centralisés par l’agence
          </CardTitle>
          <p className="mt-1 text-sm text-gray-600">
            Les pièces scannées ou ajoutées par l’agence sont visibles ici et restent liées à votre dossier.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {documents.length} pièce{documents.length === 1 ? "" : "s"}
        </span>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
            Aucune pièce déposée par l’agence pour le moment.
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div key={document.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{document.documentName}</p>
                    <p className="text-xs text-gray-500">{document.documentType.replaceAll("_", " ")}</p><p className="mt-1 text-[11px] text-gray-500">Reçu le {document.createdAt ? new Date(document.createdAt).toLocaleString("fr-FR") : "date non disponible"} · Origine : {document.source === "admin_upload" || document.source === "agency_scan" ? "remis en agence" : "dépôt candidat"}</p><p className="text-[11px] text-gray-500">Enregistré par : {document.uploadedBy || "agence"}</p>
                    {document.verificationComment && document.verificationStatus === "rejected" && (
                      <p className="mt-1 text-xs text-red-600">{document.verificationComment}</p>
                    )}
                    {document.verificationStatus === "rejected" && document.annotations?.filter((annotation) => annotation.status === "open").map((annotation) => (
                      <div key={annotation.id} className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                        <p className="flex items-center gap-1 font-semibold"><MessageSquare className="h-3.5 w-3.5" /> Correction demandée{annotation.areaLabel ? ` · ${annotation.areaLabel}` : ""}</p>
                        <p className="mt-1">{annotation.message}</p>
                        <p className="mt-1 font-medium">Après correction, téléversez une nouvelle version de cette pièce depuis votre espace.</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(document.verificationStatus)}`}>
                    {document.verificationStatus === "verified" && <FileCheck2 className="mr-1 inline h-3 w-3" />}
                    {statusLabel(document.verificationStatus)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewDoc({ title: document.documentName, url: document.documentUrl })}
                    className="inline-flex h-10 items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <Eye className="h-4 w-4" />
                    Aperçu
                  </button>
                  <a
                    href={document.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center gap-1 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={`Télécharger ${document.documentName}`}
                  >
                    <Download className="h-4 w-4" />
                    Ouvrir
                  </a>
                  <DocumentReceiptButton
                    document={document}
                    candidateName={candidateName}
                    candidateEmail={candidateEmail}
                    dossierNumber={dossierNumber}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
