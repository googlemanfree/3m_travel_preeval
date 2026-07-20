/**
 * Gestionnaire d'évaluation automatique — Panneau admin
 * Permet de déclencher l'envoi des rapports d'évaluation à tous les candidats
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Loader2, Send, BarChart3 } from "lucide-react";

export default function EvaluationManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sendBulkReports = trpc.application.sendBulkEvaluationReports.useMutation();

  const handleSendBulkReports = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await sendBulkReports.mutateAsync({});
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi des rapports");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Gestion des Évaluations Automatiques
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Envoyez automatiquement les rapports d'évaluation à tous les candidats avec dossiers "nouveau"
        </p>
      </div>

      {/* Carte d'action principale */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-2">📧 Envoi en masse des rapports d'évaluation</h3>
            <p className="text-sm text-gray-700 mb-4">
              Cette action enverra un rapport d'évaluation personnalisé à tous les candidats ayant un dossier au statut "Nouveau". 
              Les rapports incluent :
            </p>
            <ul className="text-sm text-gray-700 space-y-1 mb-4">
              <li>✓ Scores par destination (Pologne, Canada, Allemagne, Luxembourg, UK, USA)</li>
              <li>✓ Analyse détaillée des critères (formation, expérience, langues, secteur)</li>
              <li>✓ Recommandation stratégique personnalisée</li>
              <li>✓ Lien de paiement direct pour l'ouverture de dossier</li>
            </ul>
          </div>
          <Button
            onClick={handleSendBulkReports}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg whitespace-nowrap ml-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Envoyer les rapports
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Résultat de succès */}
      {result && !error && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-bold text-green-900 mb-2">✓ Rapports envoyés avec succès</h4>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{result.successCount}</div>
                  <div className="text-xs text-gray-600 mt-1">Rapports envoyés</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{result.errorCount}</div>
                  <div className="text-xs text-gray-600 mt-1">Erreurs</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{result.totalProcessed}</div>
                  <div className="text-xs text-gray-600 mt-1">Total traité</div>
                </div>
              </div>
              <p className="text-sm text-green-800 mt-4">{result.message}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Erreur */}
      {error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-bold text-red-900 mb-1">Erreur lors de l'envoi</h4>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Informations */}
      <Card className="p-6 bg-amber-50 border-amber-200">
        <h4 className="font-bold text-amber-900 mb-3">ℹ️ Informations importantes</h4>
        <ul className="text-sm text-amber-900 space-y-2">
          <li>• Les rapports sont personnalisés selon le scoring automatique de chaque candidat</li>
          <li>• Les dossiers seront marqués comme "En cours" après l'envoi du rapport</li>
          <li>• Les candidats recevront un email avec leur rapport d'évaluation et un lien de paiement</li>
          <li>• Cette action est idéale à effectuer quotidiennement pour traiter les nouveaux dossiers</li>
          <li>• Les rapports incluent des recommandations stratégiques pour maximiser les chances d'acceptation</li>
        </ul>
      </Card>
    </div>
  );
}
