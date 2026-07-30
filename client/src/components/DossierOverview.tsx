import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download } from "lucide-react";
import { useState } from "react";

interface DossierOverviewProps {
  dossierNumber: string;
}

export function DossierOverview({ dossierNumber }: DossierOverviewProps) {
  const { data, isLoading, error, refetch } = trpc.userDashboard.getDossierOverview.useQuery({
    dossierNumber,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const getScoringColor = (badge: string) => {
    switch (badge) {
      case "very_favorable":
        return "bg-green-100 text-green-800";
      case "admissible":
        return "bg-blue-100 text-blue-800";
      case "to_strengthen":
        return "bg-yellow-100 text-yellow-800";
      case "not_evaluated":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoringLabel = (badge: string) => {
    switch (badge) {
      case "very_favorable":
        return "Très favorable";
      case "admissible":
        return "Admissible";
      case "to_strengthen":
        return "À renforcer";
      case "not_evaluated":
        return "Non évalué";
      default:
        return "Non évalué";
    }
  };

  if (isLoading) return <div className="text-center py-8">Chargement...</div>;
  if (error) return <div className="text-red-500 py-8">Erreur: {error.message}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{data.fullName}</h2>
          <p className="text-gray-600">Dossier #{data.dossierNumber}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Infos principales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du Dossier</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Destination</p>
            <p className="font-semibold">{data.destination}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Formule choisie</p>
            <p className="font-semibold">{data.formulaChosen}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-semibold text-sm">{data.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date d'ouverture</p>
            <p className="font-semibold">{new Date(data.createdAt).toLocaleDateString("fr-FR")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Progression */}
      <Card>
        <CardHeader>
          <CardTitle>Progression du Dossier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold">{data.currentStep}</span>
              <span className="text-sm text-gray-600">{data.stepProgress}%</span>
            </div>
            <Progress value={data.stepProgress} className="h-3" />
          </div>

          {/* Timeline */}
          <div className="space-y-2 mt-4">
            <div className="flex gap-3">
              <div className={`w-3 h-3 rounded-full mt-1.5 ${data.stepProgress >= 25 ? "bg-blue-600" : "bg-gray-300"}`} />
              <div>
                <p className="font-semibold text-sm">Paiement</p>
                <p className="text-xs text-gray-600">Frais d'ouverture confirmés</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className={`w-3 h-3 rounded-full mt-1.5 ${data.stepProgress >= 50 ? "bg-blue-600" : "bg-gray-300"}`} />
              <div>
                <p className="font-semibold text-sm">Documents</p>
                <p className="text-xs text-gray-600">Soumission des pièces justificatives</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className={`w-3 h-3 rounded-full mt-1.5 ${data.stepProgress >= 75 ? "bg-blue-600" : "bg-gray-300"}`} />
              <div>
                <p className="font-semibold text-sm">Validation</p>
                <p className="text-xs text-gray-600">Vérification des documents</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className={`w-3 h-3 rounded-full mt-1.5 ${data.stepProgress >= 100 ? "bg-blue-600" : "bg-gray-300"}`} />
              <div>
                <p className="font-semibold text-sm">Bilan</p>
                <p className="text-xs text-gray-600">Rapport d'éligibilité disponible</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score d'éligibilité */}
      {data.scoringTotal !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Score d'Éligibilité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{data.scoringTotal}/100</p>
                <Badge className={getScoringColor(data.scoringBadge || "not_evaluated")}>
                  {getScoringLabel(data.scoringBadge || "not_evaluated")}
                </Badge>
              </div>
              <div className="text-right">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Rapport détaillé
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
