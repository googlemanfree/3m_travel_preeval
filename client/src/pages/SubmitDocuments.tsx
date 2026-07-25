import { useState } from "react";
import { useSearchParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, MapPin, Smartphone, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function SubmitDocuments() {
  const [searchParams] = useSearchParams();
  const dossierNumber = searchParams.get("dossier") || "";
  const [submissionMethod, setSubmissionMethod] = useState<"en_ligne" | "agence_physique" | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const statusQuery = trpc.documentSubmission.getDocumentSubmissionStatus.useQuery(
    { dossierNumber },
    { enabled: !!dossierNumber }
  );

  const submitMutation = trpc.documentSubmission.submitDocuments.useMutation({
    onSuccess: (data) => {
      setSuccessMessage(data.message);
      setUploadedFiles([]);
      setSubmissionMethod(null);
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!submissionMethod) {
      setErrorMessage("Veuillez choisir une methode de depot");
      return;
    }

    if (submissionMethod === "en_ligne" && uploadedFiles.length === 0) {
      setErrorMessage("Veuillez telecharger au moins un document");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const documentsUrls = uploadedFiles.map((file) => ({
        type: file.type,
        url: URL.createObjectURL(file),
        name: file.name,
      }));

      await submitMutation.mutateAsync({
        dossierNumber,
        submissionMethod,
        documentsUrls: submissionMethod === "en_ligne" ? documentsUrls : undefined,
        notes: `Depot ${submissionMethod === "en_ligne" ? "en ligne" : "en agence"}`,
      });
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!dossierNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Numero de dossier manquant. Veuillez revenir a votre espace client.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (statusQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement de votre dossier...</p>
          </Card>
        </div>
      </div>
    );
  }

  const status = statusQuery.data?.status;

  if (status && status !== "en_attente_documents" && status !== "en_attente_paiement") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Documents deja recus</h1>
            </div>
            <p className="text-gray-600 mb-6">
              Vos documents ont deja ete soumis. Nous les verifierons et vous contacterons sous peu.
            </p>
            <Button onClick={() => (window.location.href = "/candidate/dashboard")} className="w-full">
              Retour au tableau de bord
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Depot de vos documents</h1>
          <p className="text-gray-600">Dossier: <span className="font-semibold">{dossierNumber}</span></p>
        </div>

        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Choisissez votre methode de depot</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setSubmissionMethod("agence_physique")}
                className={`p-6 rounded-lg border-2 transition-all ${
                  submissionMethod === "agence_physique"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Depot en agence</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Deposez vos documents originaux directement a notre agence
                </p>
              </button>

              <button
                onClick={() => setSubmissionMethod("en_ligne")}
                className={`p-6 rounded-lg border-2 transition-all ${
                  submissionMethod === "en_ligne"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <Smartphone className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Scan professionnel</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Telecharger vos documents scannises en ligne
                </p>
              </button>
            </div>
          </Card>

          {submissionMethod === "en_ligne" && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Telecharger vos documents</h2>

              <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:bg-blue-50 transition-colors">
                <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 font-semibold hover:underline">Cliquez pour telecharger</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </label>
                <p className="text-sm text-gray-600 mt-2">
                  ou glissez-deposez vos fichiers ici (PDF, JPG, PNG, DOC, DOCX)
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-gray-900 mb-2">Fichiers selectionnes:</p>
                  <ul className="space-y-2">
                    {uploadedFiles.map((file, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {submissionMethod === "agence_physique" && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Adresse de notre agence</h2>
              <p className="text-gray-700 mb-4">
                Veuillez vous presenter a notre agence avec vos documents originaux:
              </p>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="font-semibold text-gray-900">3M Travel & Services</p>
                <p className="text-gray-600">Yaoundé, Cameroun</p>
                <p className="text-gray-600">Tel: +237 XXX XXX XXX</p>
              </div>
            </Card>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!submissionMethod || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
          >
            {isSubmitting ? "Traitement..." : "Confirmer le depot"}
          </Button>
        </div>
      </div>
    </div>
  );
}
