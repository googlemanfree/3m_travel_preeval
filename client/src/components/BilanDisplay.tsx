import { Download, AlertCircle, CheckCircle, TrendingUp, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Bilan {
  id: number;
  score: number;
  verdict: string;
  strengths: string;
  weaknesses: string;
  recommendations: string;
  status: string;
  createdAt: Date;
  sentAt?: Date;
  validatedAt?: Date;
  adminNotes?: string;
}

interface BilanDisplayProps {
  bilan: Bilan | null;
  isLoading?: boolean;
  onActionClick?: () => void;
  candidateEmail?: string;
  dossierNumber?: string;
}

export function BilanDisplay({ 
  bilan, 
  isLoading = false,
  onActionClick,
  candidateEmail,
  dossierNumber,
}: BilanDisplayProps) {
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'tres_favorable':
        return 'text-green-600 bg-green-50';
      case 'favorable_sous_reserve':
        return 'text-blue-600 bg-blue-50';
      case 'risque_non_admissible':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getVerdictLabel = (verdict: string) => {
    const labels: Record<string, string> = {
      tres_favorable: '✓ Très Favorable',
      favorable_sous_reserve: '⚠ Favorable sous réserve',
      risque_non_admissible: '✗ Risque non admissible',
    };
    return labels[verdict] || verdict;
  };

  const handleDownloadPDF = () => {
    if (!bilan) return;
    
    const content = `
      BILAN D'ADMISSIBILITÉ
      =====================
      
      Score: ${bilan.score}%
      Verdict: ${getVerdictLabel(bilan.verdict)}
      
      FORCES:
      ${bilan.strengths || 'Non spécifiées'}
      
      FAIBLESSES:
      ${bilan.weaknesses || 'Non spécifiées'}
      
      RECOMMANDATIONS:
      ${bilan.recommendations || 'Non spécifiées'}
      
      Généré le: ${new Date(bilan.createdAt).toLocaleDateString('fr-FR')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bilan-admissibilite-${bilan.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bilan d'Admissibilité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin">⏳</div>
            <span className="ml-2">Chargement du bilan...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bilan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bilan d'Admissibilité</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Votre bilan d'admissibilité sera disponible dans 48 heures après la soumission de votre dossier.
              Vous recevrez une notification par email dès qu'il sera prêt.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Bilan d'Admissibilité
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score et Verdict */}
        <div className={`p-6 rounded-lg ${getVerdictColor(bilan.verdict)}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Résultat de l'Analyse</h3>
            <Badge variant="outline">
              {bilan.status === 'sent' ? 'Envoyé' : 'Brouillon'}
            </Badge>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm opacity-75">Score d'Admissibilité</p>
              <p className="text-3xl font-bold">{bilan.score}%</p>
            </div>
            <div>
              <p className="text-sm opacity-75">Avis Général</p>
              <p className="text-lg font-semibold">{getVerdictLabel(bilan.verdict)}</p>
            </div>
          </div>
        </div>

        {/* Forces */}
        {bilan.strengths && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Vos Forces
            </h4>
            <div className="bg-green-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
              {bilan.strengths}
            </div>
          </div>
        )}

        {/* Faiblesses */}
        {bilan.weaknesses && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              Points à Améliorer
            </h4>
            <div className="bg-orange-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
              {bilan.weaknesses}
            </div>
          </div>
        )}

        {/* Recommandations */}
        {bilan.recommendations && (
          <div>
            <h4 className="font-semibold mb-2">Recommandations</h4>
            <div className="bg-blue-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
              {bilan.recommendations}
            </div>
          </div>
        )}

        {/* Notes Admin */}
        {bilan.adminNotes && (
          <div>
            <h4 className="font-semibold mb-2">Notes Additionnelles</h4>
            <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
              {bilan.adminNotes}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>Généré le: {new Date(bilan.createdAt).toLocaleDateString('fr-FR')}</p>
          {bilan.sentAt && (
            <p>Envoyé le: {new Date(bilan.sentAt).toLocaleDateString('fr-FR')}</p>
          )}
          {bilan.validatedAt && (
            <p>Validé le: {new Date(bilan.validatedAt).toLocaleDateString('fr-FR')}</p>
          )}
        </div>

        {/* Actions */}
        {bilan.status === 'sent' && onActionClick && (
          <div className="border-t pt-4 mt-4">
            <Button
              onClick={onActionClick}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              size="lg"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Poser une Question ou Demander un Rendez-vous
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Vous avez des questions? Nos experts sont là pour vous aider!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
