import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, CheckCircle2, Clock, XCircle, Download, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: number;
  dossierNumber: string;
  candidateName: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  status: "pending" | "verified" | "rejected";
  submittedAt: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export function AdminDocumentsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "verified" | "rejected">("all");

  // Récupérer les documents (à implémenter côté backend)
  const documents: Document[] = [];

  const filteredDocuments = documents.filter((d) => {
    const matchesSearch =
      d.dossierNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.documentName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || d.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
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
      case "verified":
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

  const handleApproveDocument = (docId: number) => {
    toast.success("Document approuvé");
  };

  const handleRejectDocument = (docId: number) => {
    toast.success("Document rejeté");
  };

  const handleExportDocuments = () => {
    toast.success("Export des documents en cours...");
  };

  // Statistiques
  const totalDocuments = documents.length;
  const verifiedDocuments = documents.filter((d) => d.status === "verified").length;
  const pendingDocuments = documents.filter((d) => d.status === "pending").length;
  const rejectedDocuments = documents.filter((d) => d.status === "rejected").length;

  return (
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
            <CardTitle className="text-sm font-medium text-gray-600">Validés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedDocuments}</div>
            <p className="text-xs text-gray-500 mt-1">approuvés</p>
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
              <option value="verified">Validés</option>
              <option value="pending">En attente</option>
              <option value="rejected">Rejetés</option>
            </select>
          </div>

          {/* Tableau */}
          {filteredDocuments.length === 0 ? (
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
                        <Badge className={`flex items-center gap-1 w-fit mx-auto ${getStatusColor(doc.status)}`}>
                          {getStatusIcon(doc.status)}
                          {doc.status === "verified" && "Validé"}
                          {doc.status === "pending" && "En attente"}
                          {doc.status === "rejected" && "Rejeté"}
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
                          {doc.status === "pending" && (
                            <>
                              <Button
                                onClick={() => handleApproveDocument(doc.id)}
                                variant="ghost"
                                size="sm"
                                title="Approuver"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleRejectDocument(doc.id)}
                                variant="ghost"
                                size="sm"
                                title="Rejeter"
                                className="text-red-600 hover:text-red-700"
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
    </div>
  );
}
