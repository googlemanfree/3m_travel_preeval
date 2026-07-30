/**
 * Composant : Statistiques du Dashboard
 * Affiche les cartes de résumé avec les informations clés du dossier
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, MapPin, Briefcase, DollarSign, Clock } from "lucide-react";

interface DashboardStatsProps {
  dossierNumber: string;
  destination: string;
  visaType: string;
  createdAt: Date;
  paymentStatus: string;
  dossierStatus: string;
  documentsCount: number;
  completionPercentage: number;
}

export function DashboardStats({
  dossierNumber,
  destination,
  visaType,
  createdAt,
  paymentStatus,
  dossierStatus,
  documentsCount,
  completionPercentage,
}: DashboardStatsProps) {
  const getStatusColor = (status: string) => {
    if (status === "SUCCESS") return "text-green-600 bg-green-50";
    if (status === "FAILED") return "text-red-600 bg-red-50";
    if (status === "PENDING") return "text-yellow-600 bg-yellow-50";
    return "text-blue-600 bg-blue-50";
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      SUCCESS: "Payé",
      PENDING: "En attente",
      FAILED: "Échoué",
      CANCELLED: "Annulé",
    };
    return map[status] || status;
  };

  const getDossierStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      nouveau: "Nouveau",
      en_evaluation: "En évaluation",
      bilan_envoye: "Bilan envoyé",
      en_attente_paiement: "En attente paiement",
      paye: "Payé",
      en_attente_documents: "Documents requis",
      documents_recus: "Documents reçus",
      soumis_agences: "Soumis",
      en_cours_recrutement: "Recrutement",
      contrat_obtenu: "Contrat obtenu",
      visa_approuve: "Visa approuvé",
      refuse: "Rejeté",
    };
    return map[status] || status;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Numéro de Dossier */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Numéro de Dossier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-gray-900">{dossierNumber}</p>
          <p className="text-xs text-gray-500 mt-1">Créé le {createdAt.toLocaleDateString("fr-FR")}</p>
        </CardContent>
      </Card>

      {/* Destination */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" />
            Destination
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-gray-900 capitalize">{destination}</p>
          <p className="text-xs text-gray-500 mt-1">Visa : {visaType}</p>
        </CardContent>
      </Card>

      {/* Statut du Paiement */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            Paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(paymentStatus)}`}>
            {getStatusLabel(paymentStatus)}
          </div>
          <p className="text-xs text-gray-500 mt-2">65 000 FCFA</p>
        </CardContent>
      </Card>

      {/* Statut du Dossier */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-600" />
            Statut
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-bold text-gray-900">{getDossierStatusLabel(dossierStatus)}</p>
          <p className="text-xs text-gray-500 mt-1">Étape {completionPercentage}%</p>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-600" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-gray-900">{documentsCount}</p>
          <p className="text-xs text-gray-500 mt-1">fichiers téléchargés</p>
        </CardContent>
      </Card>

      {/* Progression Globale */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900 whitespace-nowrap">{completionPercentage}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
