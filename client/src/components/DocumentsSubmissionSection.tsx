import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, FileUp, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface DocumentsSubmissionSectionProps {
  dossierNumber: string;
  email: string;
  isPaid: boolean;
  onDocumentSubmitted?: () => void;
}

const REQUIRED_DOCUMENTS = [
  { id: "passport", label: "Scan du Passeport", required: true, maxSize: 5 },
  { id: "diplomas", label: "Diplômes & Relevés de Notes", required: true, maxSize: 5 },
  { id: "birth_certificate", label: "Acte de Naissance / Carte d'Identité", required: true, maxSize: 5 },
  { id: "cv", label: "CV & Attestations de travail", required: false, maxSize: 5 },
];

export function DocumentsSubmissionSection({
  dossierNumber,
  email,
  isPaid,
  onDocumentSubmitted,
}: DocumentsSubmissionSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Récupérer les documents soumis
  const { data: submittedDocs, isLoading: isLoadingDocs, refetch: refetchDocs } = trpc.payment.getSubmittedDocuments.useQuery(
    { dossierNumber },
    { staleTime: 0, enabled: isPaid }
  );

  // Soumettre un document
  const submitDocMutation = trpc.payment.submitDocument.useMutation({
    onSuccess: (data) => {
      toast.success("Document soumis avec succès");
      setSelectedFile(null);
      setSelectedDocType("");
      refetchDocs();
      onDocumentSubmitted?.();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la soumission du document");
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Le fichier ne doit pas dépasser 5 Mo");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmitDocument = async () => {
    if (!selectedFile || !selectedDocType) {
      toast.error("Veuillez sélectionner un type de document et un fichier");
      return;
    }

    setIsUploading(true);
    // TODO: Uploader le fichier vers S3 d'abord, puis soumettre l'URL
    // Pour le moment, on simule avec une URL
    const documentUrl = `https://example.com/documents/${selectedFile.name}`;

    submitDocMutation.mutate({
      dossierNumber,
      email,
      documentType: selectedDocType as any,
      documentName: selectedFile.name,
      documentUrl,
      fileSize: selectedFile.size,
    });
  };

  if (!isPaid) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-600" />
            <CardTitle>Dépôt de Pièces Justificatives</CardTitle>
          </div>
          <CardDescription>
            Cette section sera débloquée après le paiement des frais d'ouverture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
            <Lock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 font-semibold">Section verrouillée</p>
            <p className="text-sm text-gray-500 mt-2">
              Veuillez d'abord régler les frais d'ouverture de dossier pour accéder au dépôt de pièces.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingDocs) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-gray-600">Chargement des documents...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const documents = submittedDocs?.documents || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileUp className="w-5 h-5 text-blue-600" />
          <CardTitle>Dépôt de Pièces Justificatives</CardTitle>
        </div>
        <CardDescription>
          Téléversez les documents requis pour le traitement de votre dossier
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Liste des documents requis */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Documents à soumettre :</h3>
          {REQUIRED_DOCUMENTS.map((doc) => {
            const submitted = documents.find((d) => d.documentType === doc.id);
            return (
              <div
                key={doc.id}
                className={`rounded-lg p-4 border ${
                  submitted
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-700">{doc.label}</p>
                      {doc.required && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          Obligatoire
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">Max {doc.maxSize} Mo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {submitted ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-semibold">
                          {submitted.status === "pending" && "En attente"}
                          {submitted.status === "verified" && "Validé"}
                          {submitted.status === "rejected" && "Rejeté"}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline">Non soumis</Badge>
                    )}
                  </div>
                </div>
                {submitted && submitted.submittedAt && (
                  <div className="mt-2 text-xs text-gray-500">
                    Soumis le {new Date(submitted.submittedAt as any).toLocaleDateString("fr-FR")}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Formulaire de soumission */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-gray-700 mb-3">Soumettre un document</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de document *
              </label>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un document</option>
                {REQUIRED_DOCUMENTS.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fichier (PDF/JPG) *
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Fichier sélectionné : {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} Mo)
                </p>
              )}
            </div>

            <Button
              onClick={handleSubmitDocument}
              disabled={isUploading || !selectedFile || !selectedDocType}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Téléversement en cours...
                </>
              ) : (
                <>
                  <FileUp className="w-4 h-4 mr-2" />
                  Soumettre le document
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Message d'information */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700">Conseils pour la soumission :</p>
            <ul className="text-xs text-gray-600 mt-2 space-y-1">
              <li>• Assurez-vous que les documents sont lisibles et en bon état</li>
              <li>• Taille maximale par fichier : 5 Mo</li>
              <li>• Formats acceptés : PDF, JPG, PNG</li>
              <li>• Vous recevrez une notification après validation de chaque document</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
