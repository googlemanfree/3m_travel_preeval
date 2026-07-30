import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface DocumentsStatusProps {
  dossierNumber: string;
}

export function DocumentsStatus({ dossierNumber }: DocumentsStatusProps) {
  const { data, isLoading, error } = trpc.userDashboard.getDocumentsStatus.useQuery({
    dossierNumber,
  });
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

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

  return (
    <div className="space-y-6">
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
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
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
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.status)}
                    {doc.url && (
                      <Button size="sm" variant="ghost" onClick={() => setSelectedDoc(doc)}>
                        <Eye className="w-4 h-4" />
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
              <div className="flex gap-2">
                <a href={selectedDoc.url} download className="flex-1">
                  <Button className="w-full" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                </a>
                <Button className="flex-1" variant="outline" onClick={() => setSelectedDoc(null)}>
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
