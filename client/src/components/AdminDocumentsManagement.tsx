import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileText, CheckCircle2, Clock, XCircle, Download, Eye, ArrowUpDown, Sparkles, Layers3, ShieldCheck, RotateCcw, Filter, Upload, GitCompareArrows, CalendarDays, X } from "lucide-react";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Document {
  id: number;
  source: "client" | "candidate";
  candidateId?: number | null;
  candidateEmail?: string | null;
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
  replacesId?: number | null;
}

export function AdminDocumentsManagement() {
  const sessionToken = typeof window !== "undefined" ? sessionStorage.getItem("adminSessionToken") || "" : "";
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "client" | "candidate">("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [dossierFilter, setDossierFilter] = useState("all");
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
  const [selectedDocumentKeys, setSelectedDocumentKeys] = useState<string[]>([]);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [uploadCandidateId, setUploadCandidateId] = useState("");
  const [uploadDocumentType, setUploadDocumentType] = useState("autre");
  const [comparisonDocuments, setComparisonDocuments] = useState<{ previous: Document; current: Document } | null>(null);
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const approveDocumentMutation = trpc.admin.approveDocument.useMutation();
  const rejectDocumentMutation = trpc.admin.rejectDocument.useMutation();
  const approveCandidateFileMutation = trpc.admin.approveCandidateFile.useMutation();
  const rejectCandidateFileMutation = trpc.admin.rejectCandidateFile.useMutation();
  const updateDocumentStatusMutation = trpc.admin.updateDocumentStatus.useMutation();
  const saveMarkerAnnotationsMutation = trpc.admin.savePassportMarkerAnnotations.useMutation();
  const uploadDocumentForCandidateMutation = trpc.admin.uploadDocumentForCandidate.useMutation();

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
    candidateId: doc.candidateId ?? null,
    candidateEmail: doc.candidateEmail ?? null,
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
    replacesId: doc.replacesId ?? null,
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
    const matchesSource = sourceFilter === "all" || d.source === sourceFilter;
    const matchesType = documentTypeFilter === "all" || d.documentType === documentTypeFilter;
    const matchesDossier = dossierFilter === "all" || d.dossierNumber === dossierFilter;

    return matchesSearch && matchesStatus && matchesClassification && matchesSource && matchesType && matchesDossier;
  });

  const documentTypes = Array.from(new Set(documents.map((document) => document.documentType).filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr"));
  const uploadTargets = Array.from(new Map(documents.filter((document) => document.candidateId).map((document) => [document.candidateId as number, { id: document.candidateId as number, label: `${document.candidateName} · ${document.dossierNumber}` }])).values()).sort((left, right) => left.label.localeCompare(right.label, "fr"));
  const dossierSummaries = Array.from(documents.reduce((summary, document) => {
    const key = document.dossierNumber || "N/A";
    const current = summary.get(key) || { dossierNumber: key, candidateName: document.candidateName, total: 0, approved: 0, pending: 0, rejected: 0 };
    current.total += 1;
    current.approved += document.verificationStatus === "approved" ? 1 : 0;
    current.pending += document.verificationStatus === "pending" ? 1 : 0;
    current.rejected += document.verificationStatus === "rejected" ? 1 : 0;
    summary.set(key, current);
    return summary;
  }, new Map<string, { dossierNumber: string; candidateName: string; total: number; approved: number; pending: number; rejected: number }>()).values()).sort((left, right) => right.pending - left.pending || left.dossierNumber.localeCompare(right.dossierNumber, "fr"));
  const selectedDocuments = filteredDocuments.filter((document) => selectedDocumentKeys.includes(`${document.source}:${document.id}`));

  const toggleDocumentSelection = (document: Document) => {
    const key = `${document.source}:${document.id}`;
    setSelectedDocumentKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };

  const handleBulkStatus = async (status: "approved" | "pending") => {
    if (!selectedDocuments.length) return;
    const label = status === "approved" ? "approuver" : "remettre en attente";
    if (!window.confirm(`Confirmer l’action « ${label} » sur ${selectedDocuments.length} document(s) ? Chaque candidat concerné sera notifié.`)) return;
    setIsLoading(true);
    try {
      await Promise.all(selectedDocuments.map((document) => updateDocumentStatusMutation.mutateAsync({ sessionToken, documentId: document.id, source: document.source, status, comment: status === "pending" ? "Document remis en attente de vérification par l’administration." : undefined })));
      setSelectedDocumentKeys([]);
      await refetch();
      toast.success(`${selectedDocuments.length} document(s) mis à jour`, { description: "Les statuts et notifications ont été synchronisés." });
    } catch (error) {
      toast.error("Action groupée incomplète", { description: error instanceof Error ? error.message : "Veuillez vérifier les documents concernés." });
    } finally {
      setIsLoading(false);
    }
  };

  const acceptDroppedFiles = (incoming: FileList | File[]) => {
    const supportedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
    const valid = Array.from(incoming).filter((file) => supportedTypes.has(file.type) && file.size <= 10 * 1024 * 1024);
    const rejected = Array.from(incoming).length - valid.length;
    if (rejected) toast.error(`${rejected} fichier(s) ignoré(s)`, { description: "Seuls les PDF, images et documents Word de 10 Mo maximum sont acceptés." });
    setDroppedFiles((current) => [...current, ...valid].slice(0, 10));
  };

  const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

  const handleAdminDropUpload = async () => {
    const candidateId = Number(uploadCandidateId);
    if (!candidateId || !droppedFiles.length) {
      toast.error("Sélectionnez un dossier et au moins un fichier.");
      return;
    }
    setIsLoading(true);
    try {
      for (const file of droppedFiles) {
        await uploadDocumentForCandidateMutation.mutateAsync({
          sessionToken,
          candidateId,
          fileType: uploadDocumentType as "cv" | "passeport" | "diplome" | "releve_notes" | "photo" | "justificatif_domicile" | "extrait_naissance" | "casier_judiciaire" | "justificatif_paiement" | "autre",
          fileName: file.name,
          mimeType: file.type as "application/pdf" | "image/jpeg" | "image/png" | "image/webp" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          sizeBytes: file.size,
          dataUrl: await toDataUrl(file),
        });
      }
      toast.success(`${droppedFiles.length} document(s) déposé(s)`, { description: "Ils apparaissent dans le dossier et sont prêts à être vérifiés." });
      setDroppedFiles([]);
      await refetch();
    } catch (error) {
      toast.error("Dépôt incomplet", { description: error instanceof Error ? error.message : "Vérifiez le dossier et les fichiers sélectionnés." });
    } finally {
      setIsLoading(false);
    }
  };

  const openVersionComparison = (document: Document) => {
    if (!document.replacesId) return;
    const previous = documents.find((candidate) => candidate.source === document.source && candidate.id === document.replacesId);
    if (!previous) {
      toast.error("Version précédente indisponible", { description: "La version remplacée n’est pas visible dans le périmètre chargé." });
      return;
    }
    setComparisonDocuments({ previous, current: document });
  };

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
  const completeDossiers = dossierSummaries.filter((dossier) => dossier.total > 0 && dossier.pending === 0 && dossier.rejected === 0).length;
  const monthlyDocuments = documents.filter((document) => document.submittedAt.toISOString().slice(0, 7) === reportMonth);
  const monthlyDossiers = Array.from(monthlyDocuments.reduce((summary, document) => {
    const current = summary.get(document.dossierNumber) || { dossierNumber: document.dossierNumber, candidateName: document.candidateName, total: 0, approved: 0, pending: 0, rejected: 0 };
    current.total += 1;
    current.approved += document.verificationStatus === "approved" ? 1 : 0;
    current.pending += document.verificationStatus === "pending" ? 1 : 0;
    current.rejected += document.verificationStatus === "rejected" ? 1 : 0;
    summary.set(document.dossierNumber, current);
    return summary;
  }, new Map<string, { dossierNumber: string; candidateName: string; total: number; approved: number; pending: number; rejected: number }>()).values());
  const monthlyCompletionRate = monthlyDocuments.length ? Math.round((monthlyDocuments.filter((document) => document.verificationStatus === "approved").length / monthlyDocuments.length) * 100) : 0;

  return (
    <>
      <div className="space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
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
          <Card className="border-sky-100 bg-sky-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Dossiers complets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-700">{completeDossiers}/{dossierSummaries.length}</div>
              <p className="text-xs text-slate-500 mt-1">sans pièce en attente</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-dashed border-2 border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Upload className="h-4 w-4 text-blue-700" />Dépôt rapide administrateur</CardTitle><CardDescription>Glissez des pièces reçues en agence, choisissez le dossier, puis envoyez-les dans la file documentaire.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div onDragOver={(event) => { event.preventDefault(); setIsDraggingFiles(true); }} onDragLeave={() => setIsDraggingFiles(false)} onDrop={(event) => { event.preventDefault(); setIsDraggingFiles(false); acceptDroppedFiles(event.dataTransfer.files); }} className={`rounded-xl border-2 border-dashed p-5 text-center transition ${isDraggingFiles ? "border-blue-600 bg-blue-100" : "border-blue-200 bg-white"}`}>
                <Upload className="mx-auto h-7 w-7 text-blue-600" />
                <p className="mt-2 text-sm font-semibold text-slate-900">Déposez vos fichiers ici</p><p className="text-xs text-slate-500">PDF, images ou Word · 10 Mo maximum par fichier</p>
                <label className="mt-3 inline-flex cursor-pointer items-center rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50">Sélectionner des fichiers<input type="file" multiple className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(event) => event.currentTarget.files && acceptDroppedFiles(event.currentTarget.files)} /></label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2"><select value={uploadCandidateId} onChange={(event) => setUploadCandidateId(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">Choisir le dossier destinataire</option>{uploadTargets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}</select><select value={uploadDocumentType} onChange={(event) => setUploadDocumentType(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"><option value="autre">Autre document</option><option value="cv">CV</option><option value="passeport">Passeport</option><option value="diplome">Diplôme</option><option value="justificatif_domicile">Justificatif de domicile</option><option value="justificatif_paiement">Justificatif de paiement</option></select></div>
              {droppedFiles.length > 0 && <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-2">{droppedFiles.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-xs"><span className="truncate">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} Mo</span><button type="button" onClick={() => setDroppedFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))} aria-label={`Retirer ${file.name}`} className="text-slate-500 hover:text-red-600"><X className="h-3.5 w-3.5" /></button></div>)}</div>}
              <Button type="button" onClick={handleAdminDropUpload} disabled={isLoading || !uploadCandidateId || !droppedFiles.length} className="w-full gap-2"><Upload className="h-4 w-4" />Déposer dans le dossier</Button>
            </CardContent>
          </Card>
          <Card className="border-violet-100 bg-violet-50/30">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-violet-700" />Rapport mensuel</CardTitle><CardDescription>Complétude calculée à partir des statuts réels des documents.</CardDescription></CardHeader>
            <CardContent className="space-y-3"><Input type="month" value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} aria-label="Mois du rapport documentaire" /><div className="grid grid-cols-2 gap-2"><div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Documents reçus</p><p className="text-xl font-bold text-slate-900">{monthlyDocuments.length}</p></div><div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Validés</p><p className="text-xl font-bold text-emerald-700">{monthlyCompletionRate}%</p></div></div><div className="space-y-1.5">{monthlyDossiers.slice(0, 5).map((dossier) => { const rate = dossier.total ? Math.round((dossier.approved / dossier.total) * 100) : 0; return <div key={dossier.dossierNumber} className="rounded-md bg-white px-2 py-1.5"><div className="flex justify-between gap-2 text-xs"><span className="truncate font-medium">{dossier.dossierNumber}</span><span>{rate}%</span></div><div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${rate}%` }} /></div></div>; })}{monthlyDossiers.length === 0 && <p className="text-sm text-slate-500">Aucune pièce déposée sur cette période.</p>}</div></CardContent>
          </Card>
        </div>

        {dossierSummaries.length > 0 && <Card className="border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Layers3 className="h-4 w-4 text-blue-600" />Vue dossiers et complétude</CardTitle><CardDescription>Sélectionnez un dossier pour concentrer le contrôle documentaire.</CardDescription></CardHeader>
          <CardContent className="flex gap-3 overflow-x-auto pb-2">
            {dossierSummaries.slice(0, 12).map((dossier) => {
              const progress = dossier.total ? Math.round((dossier.approved / dossier.total) * 100) : 0;
              return <button key={dossier.dossierNumber} type="button" onClick={() => setDossierFilter((current) => current === dossier.dossierNumber ? "all" : dossier.dossierNumber)} className={`min-w-52 rounded-xl border p-3 text-left transition ${dossierFilter === dossier.dossierNumber ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-300"}`}>
                <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-semibold text-blue-700">{dossier.dossierNumber}</span><span className="text-xs text-slate-500">{progress}%</span></div>
                <p className="mt-1 truncate text-sm font-medium text-slate-900">{dossier.candidateName}</p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} /></div>
                <p className="mt-2 text-xs text-slate-500"><span className="text-emerald-700">{dossier.approved} validé(s)</span> · <span className="text-amber-700">{dossier.pending} attente</span>{dossier.rejected ? <span className="text-red-700"> · {dossier.rejected} rejeté(s)</span> : null}</p>
              </button>;
            })}
          </CardContent>
        </Card>}

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
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" aria-label="Filtrer par origine">
                <option value="all">Toutes les origines</option><option value="client">Dépôt dossier</option><option value="candidate">Espace candidat</option>
              </select>
              <select value={documentTypeFilter} onChange={(e) => setDocumentTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" aria-label="Filtrer par type de document">
                <option value="all">Tous les types</option>{documentTypes.map((type) => <option key={type} value={type}>{getDocumentTypeLabel(type)}</option>)}
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
              <Filter className="w-3.5 h-3.5 text-violet-500" />
              <span>{filteredDocuments.length} document(s) affiché(s) avec classification IA, source, type et statut recherchables.</span>
            </div>
            {selectedDocuments.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3"><div className="flex items-center gap-2 text-sm text-blue-950"><ShieldCheck className="h-4 w-4" /><strong>{selectedDocuments.length}</strong> document(s) sélectionné(s)</div><div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setSelectedDocumentKeys([])}>Désélectionner</Button><Button type="button" size="sm" onClick={() => handleBulkStatus("pending")} disabled={isLoading} className="gap-1 bg-amber-600 hover:bg-amber-700"><RotateCcw className="h-3.5 w-3.5" />En attente</Button><Button type="button" size="sm" onClick={() => handleBulkStatus("approved")} disabled={isLoading} className="gap-1 bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Tout valider</Button></div></div>}

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
                      <th className="w-10 py-3 px-2"><input type="checkbox" aria-label="Sélectionner tous les documents affichés" checked={filteredDocuments.length > 0 && selectedDocuments.length === filteredDocuments.length} onChange={(event) => setSelectedDocumentKeys(event.target.checked ? filteredDocuments.map((document) => `${document.source}:${document.id}`) : [])} /></th>
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
                        <td className="py-3 px-2"><input type="checkbox" aria-label={`Sélectionner ${doc.documentName}`} checked={selectedDocumentKeys.includes(`${doc.source}:${doc.id}`)} onChange={() => toggleDocumentSelection(doc)} /></td>
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
                        <td className="py-3 px-4 text-gray-600 max-w-xs"><p className="truncate">{doc.documentName}</p>{doc.replacesId ? <span className="mt-1 inline-flex rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">Correction de la version #{doc.replacesId}</span> : null}</td>
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
                            <Button onClick={() => handleDownloadDocument(doc.documentUrl, doc.documentName)} variant="ghost" size="sm" title="Télécharger" className="text-slate-600 hover:text-slate-900 bg-slate-50"><Download className="w-4 h-4" /></Button>
                            {doc.replacesId ? <Button onClick={() => openVersionComparison(doc)} variant="ghost" size="sm" title="Comparer avec la version remplacée" className="text-violet-700 hover:text-violet-800 bg-violet-50"><GitCompareArrows className="w-4 h-4" /></Button> : null}
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

        <Dialog open={comparisonDocuments !== null} onOpenChange={(open) => !open && setComparisonDocuments(null)}>
          <DialogContent className="max-w-6xl">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><GitCompareArrows className="h-5 w-5 text-violet-700" />Comparer les versions du document</DialogTitle><DialogDescription>La nouvelle version apparaît à droite. Vérifiez la lisibilité, les données et le contenu avant validation.</DialogDescription></DialogHeader>
            {comparisonDocuments && <div className="grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-orange-200 bg-orange-50/40 p-3"><p className="mb-2 text-sm font-semibold text-orange-900">Version remplacée · {comparisonDocuments.previous.documentName}</p><div className="h-[52vh] overflow-hidden rounded-lg border bg-white">{comparisonDocuments.previous.documentUrl.match(/\.(png|jpe?g|webp)(\?|$)/i) ? <img src={comparisonDocuments.previous.documentUrl} alt="Version remplacée" className="h-full w-full object-contain" /> : <iframe title="Version remplacée" src={comparisonDocuments.previous.documentUrl} className="h-full w-full" />}</div></div><div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3"><p className="mb-2 text-sm font-semibold text-emerald-900">Nouvelle version · {comparisonDocuments.current.documentName}</p><div className="h-[52vh] overflow-hidden rounded-lg border bg-white">{comparisonDocuments.current.documentUrl.match(/\.(png|jpe?g|webp)(\?|$)/i) ? <img src={comparisonDocuments.current.documentUrl} alt="Nouvelle version" className="h-full w-full object-contain" /> : <iframe title="Nouvelle version" src={comparisonDocuments.current.documentUrl} className="h-full w-full" />}</div></div></div>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setComparisonDocuments(null)}>Fermer la comparaison</Button></DialogFooter>
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
