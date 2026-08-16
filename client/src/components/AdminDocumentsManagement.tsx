import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileText, CheckCircle2, Clock, XCircle, Download, Eye, ArrowUpDown, Sparkles } from "lucide-react";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Document {
  id: number;
  source: "client" | "candidate";
  dossierNumber: string;
  candidateName: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  status: "pending" | "verified" | "rejected";
  verificationStatus: "pending" | "approved" | "rejected";
  submittedAt: Date;
  verifiedAt?: Date;
  verifiedByAdmin?: string | null;
  humanVerified?: boolean;
  rejectionReason?: string;
  aiClassification: unknown;
  aiClassificationConfidence?: number | null;
  suggestedFolder?: string | null;
  readabilityScore?: number | null;
  readabilityIssues?: any | null;
}

export function AdminDocumentsManagement() {
  const sessionToken = typeof window !== "undefined" ? sessionStorage.getItem("adminSessionToken") || "" : "";
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [classificationFilter, setClassificationFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"uploadedAt" | "documentName" | "verificationStatus" | "aiClassification">("uploadedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [rejectingDocId, setRejectingDocId] = useState<number | null>(null);
  const [rejectingDocSource, setRejectingDocSource] = useState<"client" | "candidate">("client");
  const [rejectionReason, setRejectionReason] = useState("");
  const [previewingDoc, setPreviewingDoc] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [markerAnnotations, setMarkerAnnotations] = useState<Record<string, string>>({});
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  const approveDocumentMutation = trpc.admin.approveDocument.useMutation();
  const rejectDocumentMutation = trpc.admin.rejectDocument.useMutation();
  const approveCandidateFileMutation = trpc.admin.approveCandidateFile.useMutation();
  const rejectCandidateFileMutation = trpc.admin.rejectCandidateFile.useMutation();
  const updateDocumentStatusMutation = trpc.admin.updateDocumentStatus.useMutation();
  const saveMarkerAnnotationsMutation = trpc.admin.savePassportMarkerAnnotations.useMutation();

  // Récupérer les documents via tRPC
  const { data: documentsData, isLoading: isLoadingDocs, refetch } = trpc.admin.listDocuments.useQuery(
    { 
      sessionToken,
      search: searchTerm, 
      verificationStatus: filterStatus === "all" ? undefined : (filterStatus as any),
      aiClassification: classificationFilter === "all" ? undefined : classificationFilter,
      sortBy,
      sortDirection,
      limit: 100,
      offset: 0
    },
    { enabled: !!sessionToken }
  );

  const handleApproveDocument = async (doc: Document) => {
    setIsLoading(true);
    try {
      await updateDocumentStatusMutation.mutateAsync({
        sessionToken,
        documentId: doc.id,
        source: doc.source === "candidate" ? "candidate" : "client",
        status: "approved",
      });
      toast.success("✓ Document approuvé", {
        description: "Le statut a été mis à jour et une notification a été envoyée au candidat.",
        duration: 4000,
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error("✗ Erreur lors de l'approbation", {
        description: errorMessage,
        duration: 4000,
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPendingDocument = async (doc: Document) => {
    setIsLoading(true);
    try {
      await updateDocumentStatusMutation.mutateAsync({
        sessionToken,
        documentId: doc.id,
        source: doc.source === "candidate" ? "candidate" : "client",
        status: "pending",
        comment: "Document replacé en attente de vérification par l'administration.",
      });
      toast.success("⏳ Document remis en attente", {
        description: "Le statut a été mis à jour.",
        duration: 4000,
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error("✗ Erreur", { description: errorMessage, duration: 4000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectDocument = (doc: Document) => {
    setRejectingDocId(doc.id);
    setRejectingDocSource(doc.source);
    setRejectionReason("");
  };

  const submitRejection = async () => {
    if (!rejectingDocId || !rejectionReason.trim()) {
      toast.error("Raison manquante", {
        description: "Veuillez fournir une raison pour le rejet du document",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateDocumentStatusMutation.mutateAsync({
        sessionToken,
        documentId: rejectingDocId,
        source: rejectingDocSource === "candidate" ? "candidate" : "client",
        status: "rejected",
        comment: rejectionReason,
      });
      toast.success("✓ Document rejeté", {
        description: "Le candidat a été notifié par e-mail de la décision de rejet.",
        duration: 4000,
      });
      setRejectingDocId(null);
      setRejectionReason("");
      await new Promise(resolve => setTimeout(resolve, 500));
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
      toast.error("✗ Erreur lors du rejet", {
        description: errorMessage,
        duration: 4000,
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Utiliser les documents récupérés via tRPC
  const documents: Document[] = documentsData?.map((doc: any) => ({
    id: doc.id,
    source: doc.source === "candidate" ? "candidate" : "client",
    dossierNumber: doc.dossierNumber || "N/A",
    candidateName: doc.candidateName || "N/A",
    documentType: doc.documentType || "unknown",
    documentName: doc.documentName,
    documentUrl: doc.documentUrl,
    status: doc.verificationStatus === "approved" ? "verified" : doc.verificationStatus === "rejected" ? "rejected" : "pending",
    verificationStatus: doc.verificationStatus,
    submittedAt: new Date(doc.submittedAt),
    verifiedAt: doc.verifiedAt ? new Date(doc.verifiedAt) : undefined,
    rejectionReason: doc.verificationComment,
    aiClassification: doc.aiClassification ?? null,
    aiClassificationConfidence: doc.aiClassificationConfidence ?? null,
    suggestedFolder: doc.suggestedFolder ?? null,
    readabilityScore: doc.readabilityScore ?? null,
    readabilityIssues: doc.readabilityIssues ?? null,
  })) || [];

  const getClassificationLabel = (classification: unknown) => {
    if (!classification) return "Non classifié";
    if (typeof classification === "string") {
      try {
        const parsed = JSON.parse(classification) as { documentType?: string; suggestedFolder?: string };
        return parsed.documentType || parsed.suggestedFolder || classification;
      } catch {
        return classification;
      }
    }
    if (typeof classification === "object") {
      const value = classification as { documentType?: string; suggestedFolder?: string };
      return value.documentType || value.suggestedFolder || "Classifié";
    }
    return "Classifié";
  };

  const classificationOptions = Array.from(new Set(
    documents.map((document) => getClassificationLabel(document.aiClassification)).filter((value) => value !== "Non classifié")
  )).sort((a, b) => a.localeCompare(b, "fr"));

  const filteredDocuments = documents.filter((d) => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const classificationLabel = getClassificationLabel(d.aiClassification);
    const matchesSearch = !normalizedSearch ||
      d.dossierNumber.toLowerCase().includes(normalizedSearch) ||
      d.candidateName.toLowerCase().includes(normalizedSearch) ||
      d.documentName.toLowerCase().includes(normalizedSearch) ||
      classificationLabel.toLowerCase().includes(normalizedSearch) ||
      (d.suggestedFolder || "").toLowerCase().includes(normalizedSearch);

    const matchesStatus = filterStatus === "all" || d.verificationStatus === filterStatus;
    const matchesClassification = classificationFilter === "all" || classificationLabel === classificationFilter;

    return matchesSearch && matchesStatus && matchesClassification;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      passport: "Passeport",
      diplomas: "Diplômes",
      birth_certificate: "Acte de Naissance",
      cv: "CV",
      employment_letter: "Lettre d'Emploi",
      other: "Autre",
    };
    return labels[type] || type;
  };

  const handleViewDocument = (doc: Document) => {
    try {
      const analysis = typeof doc.readabilityIssues === "string"
        ? JSON.parse(doc.readabilityIssues)
        : doc.readabilityIssues;
      setMarkerAnnotations(analysis?.adminAnnotations ?? {});
    } catch {
      setMarkerAnnotations({});
    }
    setActiveMarkerId(null);
    setPreviewingDoc(doc);
  };

  const handleSaveMarkerAnnotations = async () => {
    if (!previewingDoc) return;
    setIsLoading(true);
    try {
      await saveMarkerAnnotationsMutation.mutateAsync({
        sessionToken,
        documentId: previewingDoc.id,
        annotations: markerAnnotations,
      });
      toast.success("Annotations enregistrées", {
        description: "Elles seront jointes au document si celui-ci doit être renvoyé au candidat.",
      });
      await refetch();
    } catch (error) {
      toast.error("Impossible d’enregistrer les annotations", {
        description: error instanceof Error ? error.message : "Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPreviewedDocument = () => {
    if (!previewingDoc) return;
    try {
      const link = document.createElement("a");
      link.href = previewingDoc.documentUrl;
      link.download = previewingDoc.documentName;
      link.click();
      toast.success("✓ Téléchargement en cours", {
        description: previewingDoc.documentName,
        duration: 3000,
      });
    } catch (error) {
      toast.error("✗ Erreur lors du téléchargement", {
        description: "Impossible de télécharger le document",
        duration: 3000,
      });
    }
  };

  const handleDownloadDocument = (url: string, docName: string) => {
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = docName;
      link.click();
      toast.success("✓ Téléchargement en cours", {
        description: docName,
        duration: 3000,
      });
    } catch (error) {
      toast.error("✗ Erreur lors du téléchargement", {
        description: "Impossible de télécharger le document",
        duration: 3000,
      });
    }
  };

  const handleExportDocuments = () => {
    try {
      // Créer un CSV avec les documents filtrés
      const headers = ["ID", "Dossier", "Candidat", "Type", "Document", "Statut", "Date"];
      const rows = filteredDocuments.map((d) => [
        d.id,
        d.dossierNumber,
        d.candidateName,
        getDocumentTypeLabel(d.documentType),
        d.documentName,
        d.verificationStatus,
        new Date(d.submittedAt).toLocaleDateString("fr-FR"),
      ]);

      const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `documents_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      toast.success("✓ Export réussi", {
        description: `${filteredDocuments.length} document(s) exporté(s)`,
        duration: 3000,
      });
    } catch (error) {
      toast.error("✗ Erreur lors de l'export", {
        description: "Impossible de générer le fichier CSV",
        duration: 3000,
      });
    }
  };

  // Statistiques
  const totalDocuments = documents.length;
  const approvedDocuments = documents.filter((d) => d.verificationStatus === "approved").length;
  const pendingDocuments = documents.filter((d) => d.verificationStatus === "pending").length;
  const rejectedDocuments = documents.filter((d) => d.verificationStatus === "rejected").length;

  return (
    <>
      <div className="space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Reçus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDocuments}</div>
              <p className="text-xs text-gray-500 mt-1">documents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Approuvés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedDocuments}</div>
              <p className="text-xs text-gray-500 mt-1">validés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">En Attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingDocuments}</div>
              <p className="text-xs text-gray-500 mt-1">à vérifier</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Rejetés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedDocuments}</div>
              <p className="text-xs text-gray-500 mt-1">non conformes</p>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des documents */}
        <Card>
          <DocumentPreviewModal
            isOpen={Boolean(previewingDoc)}
            onClose={() => setPreviewingDoc(null)}
            documentTitle={previewingDoc?.documentName || ""}
            documentUrl={previewingDoc?.documentUrl || ""}
          />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Gestion des Documents
                </CardTitle>
                <CardDescription>Vérification et validation des pièces justificatives</CardDescription>
              </div>
              <Button onClick={handleExportDocuments} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filtres et tri */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <Input
                placeholder="Chercher par dossier, candidat, document ou IA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="xl:col-span-2"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="approved">Approuvés</option>
                <option value="pending">En attente</option>
                <option value="rejected">Rejetés</option>
              </select>
              <select
                value={classificationFilter}
                onChange={(e) => setClassificationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                aria-label="Filtrer par classification IA"
              >
                <option value="all">Toutes les classifications IA</option>
                {classificationOptions.map((classification) => (
                  <option key={classification} value={classification}>{classification}</option>
                ))}
              </select>
              <div className="flex gap-2 md:col-span-2 xl:col-span-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  aria-label="Trier les documents par"
                >
                  <option value="uploadedAt">Trier par date d’envoi</option>
                  <option value="documentName">Trier par nom</option>
                  <option value="verificationStatus">Trier par statut</option>
                  <option value="aiClassification">Trier par classification IA</option>
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSortDirection((direction) => direction === "asc" ? "desc" : "asc")}
                  className="gap-2 whitespace-nowrap"
                  title={`Ordre ${sortDirection === "asc" ? "croissant" : "décroissant"}`}
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {sortDirection === "asc" ? "Croissant" : "Décroissant"}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              <span>{filteredDocuments.length} document(s) affiché(s) avec classification IA recherchable.</span>
            </div>

            {/* Tableau */}
            {isLoadingDocs ? (
              <div className="text-center py-8 text-gray-500">
                <p>Chargement des documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun document trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Dossier</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Candidat</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Miniature</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom du Document</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Classification IA</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Statut</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-blue-600">{doc.dossierNumber}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{doc.candidateName}</td>
                        <td className="py-3 px-4">
                          <div 
                            onClick={() => setPreviewingDoc(doc)} 
                            className="w-10 h-10 rounded border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
                            title="Cliquer pour agrandir la miniature"
                          >
                            {doc.documentUrl && (doc.documentUrl.endsWith(".png") || doc.documentUrl.endsWith(".jpg") || doc.documentUrl.endsWith(".jpeg") || doc.documentUrl.includes("image")) ? (
                              <img src={doc.documentUrl} alt={doc.documentName} className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{getDocumentTypeLabel(doc.documentType)}</td>
                        <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{doc.documentName}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <Badge variant="outline" className="border-violet-200 text-violet-700 bg-violet-50 gap-1">
                              <Sparkles className="w-3 h-3" />
                              {getClassificationLabel(doc.aiClassification)}
                            </Badge>
                            {doc.aiClassificationConfidence !== null && doc.aiClassificationConfidence !== undefined && (
                              <span className="text-[11px] text-gray-500">Confiance : {doc.aiClassificationConfidence}%</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge className={`flex items-center gap-1 w-fit mx-auto ${getStatusColor(doc.verificationStatus)}`}>
                              {getStatusIcon(doc.verificationStatus)}
                              {doc.verificationStatus === "approved" && "Approuvé"}
                              {doc.verificationStatus === "pending" && "En attente"}
                              {doc.verificationStatus === "rejected" && "Rejeté"}
                            </Badge>
                            {doc.humanVerified ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700" title={`Vérifié par ${doc.verifiedByAdmin || "un administrateur"}`}>
                                <CheckCircle2 className="w-3 h-3" /> Vérification humaine
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700" title="Ce document doit être vérifié manuellement par un administrateur">
                                <Clock className="w-3 h-3" /> Contrôle humain requis
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(doc.submittedAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => setPreviewingDoc(doc)}
                              variant="ghost"
                              size="sm"
                              title="Aperçu rapide"
                              className="text-blue-600 hover:text-blue-700 bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <div className="flex items-center gap-1">
                              {doc.verificationStatus !== "approved" && (
                                <Button
                                  onClick={() => handleApproveDocument(doc)}
                                  variant="ghost"
                                  size="sm"
                                  title="Valider / Approuver"
                                  className="text-green-600 hover:text-green-700"
                                  disabled={isLoading}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              )}
                              {doc.verificationStatus !== "pending" && (
                                <Button
                                  onClick={() => handleSetPendingDocument(doc)}
                                  variant="ghost"
                                  size="sm"
                                  title="Remettre en attente"
                                  className="text-amber-600 hover:text-amber-700"
                                  disabled={isLoading}
                                >
                                  <Clock className="w-4 h-4" />
                                </Button>
                              )}
                              {doc.verificationStatus !== "rejected" && (
                                <Button
                                  onClick={() => handleRejectDocument(doc)}
                                  variant="ghost"
                                  size="sm"
                                  title="Rejeter"
                                  className="text-red-600 hover:text-red-700"
                                  disabled={isLoading}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modale de prévisualisation */}
        <Dialog open={previewingDoc !== null} onOpenChange={(open) => !open && setPreviewingDoc(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{previewingDoc?.documentName}</DialogTitle>
              <DialogDescription>
                {previewingDoc?.candidateName} - {getDocumentTypeLabel(previewingDoc?.documentType || "")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-auto">
                {previewingDoc && (
                  <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${previewingDoc.humanVerified ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                    {previewingDoc.humanVerified ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    <span>{previewingDoc.humanVerified ? `Vérification humaine effectuée${previewingDoc.verifiedByAdmin ? ` par ${previewingDoc.verifiedByAdmin}` : ""}.` : "Vérification humaine obligatoire avant toute approbation."}</span>
                  </div>
                )}
                {previewingDoc?.readabilityScore !== null && previewingDoc?.readabilityScore !== undefined && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-950 text-sm">Rapport d'analyse automatique de lisibilité</span>
                    <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-xs font-black">
                      Score : {previewingDoc.readabilityScore}%
                    </span>
                  </div>
                  {previewingDoc.readabilityIssues && (
                    <div className="relative w-full h-44 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:14px_14px]"></div>
                      <div className="absolute text-center text-gray-400 text-xs px-4">
                        📄 Analyse radiographique des zones (Transmission sécurisée)
                      </div>
                      {(typeof previewingDoc.readabilityIssues === 'string' ? JSON.parse(previewingDoc.readabilityIssues) : previewingDoc.readabilityIssues).annotatedZones?.map((zone: any) => {
                        const borderColor = zone.severity === 'success' ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200' : zone.severity === 'warning' ? 'border-amber-400 bg-amber-500/10 text-amber-200' : 'border-rose-400 bg-rose-500/10 text-rose-200';
                        return (
                          <div
                            key={zone.id}
                            style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
                            onClick={() => setActiveMarkerId(zone.id)}
                            className={`absolute border-2 rounded-md p-1 flex flex-col justify-between backdrop-blur-[1px] cursor-pointer transition-transform hover:scale-[1.02] ${borderColor}`}
                            title={zone.description}
                          >
                            <span className="text-[9px] font-bold px-1 bg-black/70 rounded text-white truncate inline-block">
                              {zone.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {previewingDoc.readabilityIssues && (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-bold text-blue-950">Commentaires sur les marqueurs</p>
                      {(typeof previewingDoc.readabilityIssues === 'string' ? JSON.parse(previewingDoc.readabilityIssues) : previewingDoc.readabilityIssues).annotatedZones?.map((zone: any) => (
                        <button
                          type="button"
                          key={`marker-comment-${zone.id}`}
                          onClick={() => setActiveMarkerId(zone.id)}
                          className={`w-full text-left rounded-lg border p-2 text-xs transition-colors ${activeMarkerId === zone.id ? 'border-blue-500 bg-blue-100' : 'border-blue-100 bg-white hover:bg-blue-50'}`}
                        >
                          <strong className="text-gray-900">{zone.label}</strong>
                          <span className="ml-1 text-gray-500">— {markerAnnotations[zone.id] ? 'Commentaire ajouté' : 'Ajouter un commentaire'}</span>
                        </button>
                      ))}
                      {activeMarkerId && (
                        <div className="rounded-lg border border-blue-200 bg-white p-3 space-y-2">
                          <label className="text-xs font-semibold text-blue-950" htmlFor="marker-annotation">
                            Commentaire destiné au candidat
                          </label>
                          <Textarea
                            id="marker-annotation"
                            value={markerAnnotations[activeMarkerId] ?? ""}
                            onChange={(event) => setMarkerAnnotations((current) => ({ ...current, [activeMarkerId]: event.target.value }))}
                            placeholder="Expliquez précisément ce qui doit être corrigé sur cette zone…"
                            className="min-h-20 text-sm"
                          />
                          <Button size="sm" type="button" onClick={handleSaveMarkerAnnotations} disabled={isLoading}>
                            Enregistrer ce commentaire
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {previewingDoc?.documentUrl && (
                <>
                  {previewingDoc.documentUrl.toLowerCase().endsWith(".pdf") ? (
                    <iframe
                      src={previewingDoc.documentUrl}
                      className="w-full h-96 border border-gray-300 rounded-lg"
                      title="Document preview"
                    />
                  ) : previewingDoc.documentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={previewingDoc.documentUrl}
                      alt={previewingDoc.documentName}
                      className="w-full max-h-96 object-contain border border-gray-300 rounded-lg"
                    />
                  ) : (
                    <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600">
                      <p>Format non prévisualisable</p>
                      <p className="text-sm mt-2">Cliquez sur "Télécharger" pour consulter le document</p>
                    </div>
                  )}
                </>
              )}
              {previewingDoc?.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-800">Raison du rejet :</p>
                  <p className="text-sm text-red-700 mt-1">{previewingDoc.rejectionReason}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleDownloadPreviewedDocument}>
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
              {previewingDoc?.verificationStatus === "pending" && (
                <>
                  <Button
                    onClick={() => {
                      if (previewingDoc) handleApproveDocument(previewingDoc);
                      setPreviewingDoc(null);
                    }}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? "Approbation..." : "Approuver"}
                  </Button>
                  <Button
                    onClick={() => {
                      if (previewingDoc) handleRejectDocument(previewingDoc);
                      setPreviewingDoc(null);
                    }}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Renvoyer avec annotations
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modale de rejet */}
        <Dialog open={rejectingDocId !== null} onOpenChange={(open) => !open && setRejectingDocId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renvoyer le document avec annotations</DialogTitle>
              <DialogDescription>
                Le candidat recevra immédiatement par e-mail votre commentaire ainsi que les annotations enregistrées sur les marqueurs visuels.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Raison du rejet (ex: Document illisible, informations manquantes, etc.)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-24"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectingDocId(null)} disabled={isLoading}>
                Annuler
              </Button>
              <Button onClick={submitRejection} disabled={isLoading || !rejectionReason.trim()} className="bg-red-600 hover:bg-red-700">
                {isLoading ? "Envoi en cours..." : "Renvoyer au candidat"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
