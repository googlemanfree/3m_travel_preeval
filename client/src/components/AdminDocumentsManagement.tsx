import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileText, CheckCircle2, Clock, XCircle, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Document {
  id: number;
  dossierNumber: string;
  candidateName: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  status: "pending" | "verified" | "rejected";
  verificationStatus: "pending" | "approved" | "rejected";
  submittedAt: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export function AdminDocumentsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [rejectingDocId, setRejectingDocId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer les documents via tRPC
  const { data: documentsData, isLoading: isLoadingDocs, refetch } = trpc.admin.listDocuments.useQuery(
    { 
      search: searchTerm, 
      verificationStatus: filterStatus === "all" ? undefined : (filterStatus as any),
      limit: 100,
      offset: 0
    },
    { enabled: true }
  );

  const handleApproveDocument = async (docId: number) => {
    setIsLoading(true);
    try {
      // TODO: Appeler la procédure tRPC pour approuver le document
      // await trpc.admin.approveDocument.mutate({ documentId: docId });
      toast.success("Document approuvé avec succès");
      refetch();
    } catch (error) {
      toast.error("Erreur lors de l'approbation du document");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectDocument = (docId: number) => {
    setRejectingDocId(docId);
    setRejectionReason("");
  };

  const submitRejection = async () => {
    if (!rejectingDocId || !rejectionReason.trim()) {
      toast.error("Veuillez fournir une raison de rejet");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Appeler la procédure tRPC pour rejeter le document
      // await trpc.admin.rejectDocument.mutate({ documentId: rejectingDocId, reason: rejectionReason });
      toast.success("Document rejeté avec succès");
      setRejectingDocId(null);
      setRejectionReason("");
      refetch();
    } catch (error) {
      toast.error("Erreur lors du rejet du document");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Utiliser les documents récupérés via tRPC
  const documents: Document[] = documentsData?.map((doc: any) => ({
    id: doc.id,
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
  })) || [];

  const filteredDocuments = documents.filter((d) => {
    const matchesSearch =
      d.dossierNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.documentName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || d.verificationStatus === filterStatus;

    return matchesSearch && matchesStatus;
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

  const handleViewDocument = (url: string) => {
    window.open(url, "_blank");
  };

  const handleDownloadDocument = (url: string, docName: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = docName;
    link.click();
    toast.success("Téléchargement en cours...");
  };

  const handleExportDocuments = () => {
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
    toast.success("Export réussi");
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
            {/* Filtres */}
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="Chercher par dossier, candidat ou document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="approved">Approuvés</option>
                <option value="pending">En attente</option>
                <option value="rejected">Rejetés</option>
              </select>
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
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom du Document</th>
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
                        <td className="py-3 px-4 text-gray-600">{getDocumentTypeLabel(doc.documentType)}</td>
                        <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{doc.documentName}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={`flex items-center gap-1 w-fit mx-auto ${getStatusColor(doc.verificationStatus)}`}>
                            {getStatusIcon(doc.verificationStatus)}
                            {doc.verificationStatus === "approved" && "Approuvé"}
                            {doc.verificationStatus === "pending" && "En attente"}
                            {doc.verificationStatus === "rejected" && "Rejeté"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(doc.submittedAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleViewDocument(doc.documentUrl)}
                              variant="ghost"
                              size="sm"
                              title="Voir le document"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {doc.verificationStatus === "pending" && (
                              <>
                                <Button
                                  onClick={() => handleApproveDocument(doc.id)}
                                  variant="ghost"
                                  size="sm"
                                  title="Approuver"
                                  className="text-green-600 hover:text-green-700"
                                  disabled={isLoading}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => handleRejectDocument(doc.id)}
                                  variant="ghost"
                                  size="sm"
                                  title="Rejeter"
                                  className="text-red-600 hover:text-red-700"
                                  disabled={isLoading}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
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

        {/* Modale de rejet */}
        <Dialog open={rejectingDocId !== null} onOpenChange={(open) => !open && setRejectingDocId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeter le document</DialogTitle>
              <DialogDescription>
                Veuillez fournir une raison pour le rejet de ce document. Le candidat recevra cette raison par email.
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
                {isLoading ? "Rejet en cours..." : "Confirmer le rejet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
