import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, XCircle, Download, Eye, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getCandidateToken } from "@/hooks/useCandidateAuth";
import { getRejectedDocumentCount } from "@shared/documentStatus";

interface DocumentsStatusProps {
  dossierNumber: string;
}

export function DocumentsStatus({ dossierNumber }: DocumentsStatusProps) {
  const { data, isLoading, error } = trpc.userDashboard.getDocumentsStatus.useQuery({
    dossierNumber,
  });
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [reuploadDoc, setReuploadDoc] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reuploadComment, setReuploadComment] = useState("");
  const saveDocumentMutation = trpc.candidate.saveDocument.useMutation();
  const trpcUtils = trpc.useUtils();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800">Approuvé</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) return <div className="text-center py-8">Chargement...</div>;
  if (error) return <div className="text-red-500 py-8">Erreur: {error.message}</div>;
  if (!data) return null;

  const rejectedDocuments = data.documents.filter((document) => document.status === "rejected");
  const rejectedDocumentCount = getRejectedDocumentCount(data.documents);

  return (
    <div className="space-y-6">
      {rejectedDocuments.length > 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-semibold text-red-900">
                {rejectedDocumentCount === 1
                  ? "Un document nécessite votre correction"
                  : `${rejectedDocumentCount} documents nécessitent votre correction`}
              </p>
              <p className="mt-1 text-sm text-red-800">
                Consultez le motif du rejet, téléchargez le document concerné si nécessaire, puis envoyez une version corrigée avec le bouton « Réupload ».
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Résumé */}
      <Card>
        <CardHeader>
          <CardTitle>Statut des Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold">Progression</span>
              <span className="text-sm text-gray-600">{data.completionPercentage}%</span>
            </div>
            <Progress value={data.completionPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{data.verifiedCount}</p>
              <p className="text-xs text-gray-600">Approuvés</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{data.pendingCount}</p>
              <p className="text-xs text-gray-600">En attente</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{data.rejectedCount}</p>
              <p className="text-xs text-gray-600">Rejetés</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents */}
      {data.documents.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Documents Soumis ({data.totalDocuments})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                    doc.status === "rejected"
                      ? "border-red-200 bg-red-50/70 hover:bg-red-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div>{getStatusIcon(doc.status)}</div>
                    <div className="flex-1">
                      <p className="font-semibold">{doc.type}</p>
                      <p className="text-sm text-gray-600">{doc.name}</p>
                      {doc.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">Raison: {doc.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
                    {getStatusBadge(doc.status)}
                    {doc.url && (
                      <Button size="sm" variant="ghost" onClick={() => setSelectedDoc(doc)} aria-label={`Prévisualiser ${doc.name}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    {doc.status === "rejected" && doc.url && (
                      <a href={doc.url} download={doc.name} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">
                          <Download className="w-4 h-4 mr-1" />
                          Télécharger
                        </Button>
                      </a>
                    )}
                    {doc.status === "rejected" && (
                      <Button size="sm" onClick={() => setReuploadDoc(doc)}>
                        <Upload className="w-4 h-4 mr-1" />
                        Réupload
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Aucun document soumis pour le moment
          </CardContent>
        </Card>
      )}

      {/* Modal de prévisualisation */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle>{selectedDoc.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDoc.url?.endsWith(".pdf") ? (
                <iframe src={selectedDoc.url} className="w-full h-[500px]" />
              ) : (
                <img src={selectedDoc.url} alt={selectedDoc.name} className="w-full max-h-[500px] object-contain" />
              )}
              {selectedDoc.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-800">Raison du rejet :</p>
                  <p className="text-sm text-red-700 mt-1">{selectedDoc.rejectionReason}</p>
                </div>
              )}
              <div className="flex gap-2">
                <a href={selectedDoc.url} download className="flex-1">
                  <Button className="w-full" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                </a>
                {selectedDoc.status === "rejected" && (
                  <Button className="flex-1" onClick={() => {
                    setReuploadDoc(selectedDoc);
                    setSelectedDoc(null);
                  }}>
                    <Upload className="w-4 h-4 mr-2" />
                    Réupload
                  </Button>
                )}
                <Button className="flex-1" variant="outline" onClick={() => setSelectedDoc(null)}>
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de réupload */}
      {reuploadDoc && (
        <Dialog open={!!reuploadDoc} onOpenChange={() => setReuploadDoc(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Réupload du document</DialogTitle>
              <DialogDescription>
                Sélectionnez un nouveau fichier pour remplacer "{reuploadDoc.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {reuploadDoc.rejectionReason && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-800">Raison du rejet précédent :</p>
                  <p className="text-sm text-yellow-700 mt-1">{reuploadDoc.rejectionReason}</p>
                </div>
              )}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-700">Cliquez pour sélectionner un fichier</p>
                  <p className="text-xs text-gray-500 mt-1">ou glissez-déposez votre fichier</p>
                  {selectedFile && (
                    <p className="text-sm text-blue-600 mt-2 font-semibold">{selectedFile.name}</p>
                  )}
                </label>
              </div>
              <div>
                <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-2">
                  Commentaire (optionnel)
                </label>
                <Textarea
                  id="comment"
                  placeholder="Expliquez les modifications apportées au document ou toute autre information utile pour l'administrateur..."
                  value={reuploadComment}
                  onChange={(e) => setReuploadComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-gray-500 mt-1">{reuploadComment.length}/500 caractères</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setReuploadDoc(null);
                setSelectedFile(null);
                setReuploadComment("");
              }}>
                Annuler
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedFile) {
                    toast.error("Veuillez sélectionner un fichier");
                    return;
                  }
                  setIsUploading(true);
                  try {
                    const token = getCandidateToken();
                    if (!token) throw new Error("Votre session candidat a expiré.");
                    const allowedTypes = new Set(["cv", "passeport", "diplome", "releve_notes", "photo", "justificatif_domicile", "extrait_naissance", "casier_judiciaire", "autre"]);
                    const fileType = allowedTypes.has(reuploadDoc.type) ? reuploadDoc.type : "autre";
                    const formData = new FormData();
                    formData.append("file", selectedFile);
                    formData.append("fileType", fileType);
                    const response = await fetch("/api/candidate/upload", {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                      body: formData,
                    });
                    const payload = await response.json().catch(() => ({}));
                    if (!response.ok) throw new Error(payload.error || "Erreur lors du réupload");
                    await saveDocumentMutation.mutateAsync({
                      fileType,
                      fileName: payload.fileName || selectedFile.name,
                      fileUrl: payload.fileUrl,
                      fileKey: payload.fileKey,
                      fileSizeBytes: payload.fileSizeBytes ?? selectedFile.size,
                      mimeType: payload.mimeType || selectedFile.type,
                    });
                    await trpcUtils.userDashboard.getDocumentsStatus.invalidate({ dossierNumber });
                    toast.success("Document réuploadé avec succès!");
                    setReuploadDoc(null);
                    setSelectedFile(null);
                    setReuploadComment("");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Erreur lors du réupload");
                  } finally {
                    setIsUploading(false);
                  }
                }}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? "Réupload en cours..." : "Réupload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
