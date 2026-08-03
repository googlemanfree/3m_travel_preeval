import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminDocumentVerification() {
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Pour l'instant, on utilise une liste vide - à intégrer avec l'admin dashboard
  const applicationsQuery = {
    data: [],
    isLoading: false,
    refetch: () => {},
  };

  const verifyMutation = trpc.documentSubmission.verifyDocuments.useMutation({
    onSuccess: () => {
      setSelectedApplicationId(null);
      setVerificationNotes("");
      applicationsQuery.refetch();
    },
  });

  const handleVerify = async (applicationId: number, verified: boolean) => {
    setIsVerifying(true);
    try {
      await verifyMutation.mutateAsync({
        applicationId,
        verified,
        notes: verificationNotes,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (false) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des dossiers...</p>
        </Card>
      </div>
    );
  }

  const applications = applicationsQuery.data || [];
  
  // TODO: Intégrer avec le dashboard admin pour afficher les dossiers en attente de verification

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Verification des documents</h1>

      {applications.length === 0 ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Aucun dossier en attente de verification des documents.</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {applications.map((app: any) => (
            <Card key={app.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{app.fullName}</h3>
                  <p className="text-sm text-gray-600">Dossier: {app.dossierNumber}</p>
                  <p className="text-sm text-gray-600">Destination: {app.destination}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">
                      Documents recus le {new Date(app.documentsReceivedAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Methode: {app.documentsSubmissionMethod === "en_ligne" ? "Scan en ligne" : "Depot en agence"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedApplicationId(selectedApplicationId === app.id ? null : app.id)}
                >
                  {selectedApplicationId === app.id ? "Fermer" : "Verifier"}
                </Button>
              </div>

              {selectedApplicationId === app.id && (
                <div className="mt-6 pt-6 border-t space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Notes de verification
                    </label>
                    <textarea
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Entrez vos observations sur les documents..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleVerify(app.id, true)}
                      disabled={isVerifying}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isVerifying ? "Traitement..." : "Approuver et soumettre aux agences"}
                    </Button>
                    <Button
                      onClick={() => handleVerify(app.id, false)}
                      disabled={isVerifying}
                      variant="destructive"
                      className="flex-1"
                    >
                      Rejeter
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
