import { useRef, useState } from "react";
import { CheckCircle2, Check, Download, FileText, Loader2, MessageSquare, ScanLine, Send, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import DocumentReceiptButton from "@/components/DocumentReceiptButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DOCUMENT_TYPES = [
  ["passport", "Passeport"],
  ["cv", "CV"],
  ["diploma", "Diplôme"],
  ["birth_certificate", "Acte de naissance"],
  ["employment_contract", "Contrat de travail"],
  ["bank_statement", "Relevé bancaire"],
  ["proof_of_residence", "Justificatif de résidence"],
  ["insurance", "Assurance"],
  ["photo", "Photo d’identité"],
  ["other", "Autre"],
] as const;

function statusClass(status: string): string {
  if (status === "verified") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
}

export default function AgencyDossierDocumentCenter({ dossierId }: { dossierId: number }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState("passport");
  const [isUploading, setIsUploading] = useState(false);
  const [activeAnnotationDocumentId, setActiveAnnotationDocumentId] = useState<number | null>(null);
  const [annotationMessage, setAnnotationMessage] = useState("");
  const [annotationArea, setAnnotationArea] = useState("");
  const utils = trpc.useUtils();
  const documentsQuery = trpc.agencyDossierDocuments.listForAdmin.useQuery({ dossierId });
  const statusMutation = trpc.agencyDossierDocuments.updateVerificationStatus.useMutation({
    onSuccess: async () => {
      await utils.agencyDossierDocuments.listForAdmin.invalidate({ dossierId });
      toast.success("Statut du document mis à jour.");
    },
    onError: (error) => toast.error(error.message || "Impossible de mettre à jour le document."),
  });
  const annotationMutation = trpc.agencyDossierDocuments.addCorrectionAnnotation.useMutation({
    onSuccess: async () => {
      await utils.agencyDossierDocuments.listForAdmin.invalidate({ dossierId });
      setActiveAnnotationDocumentId(null);
      setAnnotationMessage("");
      setAnnotationArea("");
      toast.success("Correction ajoutée au document refusé.");
    },
    onError: (error) => toast.error(error.message || "Impossible d’ajouter la correction."),
  });

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Sélectionnez un fichier avant de continuer.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    setIsUploading(true);
    try {
      const response = await fetch(`/api/admin/agency-dossiers/${dossierId}/documents`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Le dépôt du document a échoué.");
      if (fileRef.current) fileRef.current.value = "";
      await utils.agencyDossierDocuments.listForAdmin.invalidate({ dossierId });
      toast.success("Document ajouté au dossier et synchronisé avec l’espace candidat.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Le dépôt du document a échoué.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-900/60 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanLine className="h-5 w-5 text-blue-400" />
          Centre documentaire du dossier
        </CardTitle>
        <p className="text-xs text-slate-400">Les fichiers ajoutés ici sont privés, historisés et visibles par le candidat propriétaire.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
          <label className="space-y-1 text-sm text-slate-300">
            <span>Type de pièce</span>
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              className="flex h-12 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DOCUMENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            className="h-12 max-w-full rounded-xl border border-slate-600 bg-slate-800 px-2 py-3 text-xs text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-600 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white"
            aria-label="Sélectionner un document à ajouter au dossier"
          />
          <Button type="button" onClick={handleUpload} disabled={isUploading} className="h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isUploading ? "Dépôt..." : "Ajouter"}
          </Button>
        </div>

        {documentsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Chargement des documents...</div>
        ) : documentsQuery.isError ? (
          <p className="text-sm text-red-300">Impossible de charger les documents de ce dossier.</p>
        ) : documentsQuery.data?.documents.length ? (
          <div className="space-y-2">
            {documentsQuery.data.documents.map((document) => (
              <div key={document.id} className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800/80 p-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-blue-300" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{document.documentName}</p>
                    <p className="text-xs text-slate-400">{document.documentType.replaceAll("_", " ")} · {document.uploadedBy}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(document.verificationStatus)}`}>
                    {document.verificationStatus === "verified" ? "Validé" : document.verificationStatus === "rejected" ? "Rejeté" : "En attente"}
                  </span>
                  <a href={document.documentUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-600 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700" aria-label={`Ouvrir ${document.documentName}`}>
                    <Download className="h-4 w-4" /> Ouvrir
                  </a>
                  <DocumentReceiptButton
                    document={{
                      id: document.id ?? 0,
                      documentName: document.documentName ?? "Document",
                      documentType: document.documentType ?? "other",
                      createdAt: document.createdAt ?? new Date().toISOString(),
                    }}
                    candidateName="Candidat du dossier"
                    candidateEmail={document.uploadedBy ?? ""}
                    dossierNumber={`DOS-${dossierId}`}
                  />
                  <Button type="button" variant="outline" onClick={() => statusMutation.mutate({ documentId: document.id, verificationStatus: "verified" })} disabled={statusMutation.isPending} className="h-10 rounded-xl border-emerald-700 text-emerald-300 hover:bg-emerald-950">
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Valider
                  </Button>
                  <Button type="button" variant="outline" onClick={() => statusMutation.mutate({ documentId: document.id, verificationStatus: "rejected", verificationComment: "Merci de remplacer ce document par une copie lisible." })} disabled={statusMutation.isPending} className="h-10 rounded-xl border-red-700 text-red-300 hover:bg-red-950">
                    <XCircle className="mr-1 h-4 w-4" /> Rejeter
                  </Button>
                </div>
                {document.verificationStatus === "rejected" && (
                  <div className="w-full rounded-xl border border-red-900/60 bg-red-950/20 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-xs font-semibold text-red-200"><MessageSquare className="h-4 w-4" /> Corrections demandées</p>
                      {activeAnnotationDocumentId !== document.id && (
                        <Button type="button" variant="outline" onClick={() => setActiveAnnotationDocumentId(document.id)} className="h-9 rounded-xl border-red-700 text-red-200 hover:bg-red-950">
                          <Send className="mr-1 h-3.5 w-3.5" /> Ajouter une annotation
                        </Button>
                      )}
                    </div>
                    {document.annotations?.filter((annotation) => annotation.status === "open").map((annotation) => (
                      <div key={annotation.id} className="mb-2 rounded-lg border border-red-900/60 bg-slate-950/50 p-2 text-xs text-red-100">
                        <span className="font-semibold">{annotation.areaLabel ? `${annotation.areaLabel} : ` : ""}</span>{annotation.message}
                      </div>
                    ))}
                    {activeAnnotationDocumentId === document.id && (
                      <div className="grid gap-2 md:grid-cols-[180px_minmax(0,1fr)_auto]">
                        <input value={annotationArea} onChange={(event) => setAnnotationArea(event.target.value)} placeholder="Zone : photo, MRZ..." className="h-10 rounded-xl border border-red-800 bg-slate-950 px-3 text-xs text-white placeholder:text-slate-500" aria-label="Zone concernée par la correction" />
                        <textarea value={annotationMessage} onChange={(event) => setAnnotationMessage(event.target.value)} placeholder="Décrivez précisément la correction à effectuer..." className="min-h-10 rounded-xl border border-red-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder:text-slate-500" aria-label="Description de la correction" />
                        <div className="flex gap-2">
                          <Button type="button" onClick={() => annotationMutation.mutate({ documentId: document.id, message: annotationMessage, areaLabel: annotationArea || undefined })} disabled={annotationMutation.isPending || annotationMessage.trim().length < 3} className="h-10 rounded-xl bg-red-700 text-white hover:bg-red-800"><Check className="mr-1 h-3.5 w-3.5" /> Enregistrer</Button>
                          <Button type="button" variant="ghost" onClick={() => setActiveAnnotationDocumentId(null)} className="h-10 rounded-xl text-slate-300">Annuler</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">Aucun document centralisé dans ce dossier.</div>
        )}
      </CardContent>
    </Card>
  );
}
