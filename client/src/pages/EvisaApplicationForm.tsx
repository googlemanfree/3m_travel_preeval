/**
 * Formulaire de création de dossier e-visa
 * Permet aux candidats de créer une demande d'e-visa
 */

import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, FileUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function EvisaApplicationForm() {
  const [, setLocation] = useLocation();
  const params = useParams<{ countryCode: string }>();
  const countryCode = params?.countryCode || '';

  const [formData, setFormData] = useState({
    dossierNumber: '',
    documents: {} as Record<string, string>,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer les détails du pays
  const { data: evisaData, isLoading: loadingEvisa } = trpc.evisa.getEvisaByCountry.useQuery(
    { countryCode: countryCode || '' },
    { enabled: !!countryCode }
  );

  // Récupérer les dossiers du candidat
  const { data: dossierData } = trpc.application.getMyApplications.useQuery({ candidateId: 0 });

  // Créer la demande d'e-visa
  const createApplicationMutation = trpc.evisa.createEvisaApplication.useMutation({
    onSuccess: (data: any) => {
      toast.success('Demande d\'e-visa créée avec succès !');
      setIsSubmitting(false);
      // Rediriger vers la page de paiement
      setLocation(`/payment/${formData.dossierNumber}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la création de la demande');
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.dossierNumber) {
      toast.error('Veuillez sélectionner un dossier');
      return;
    }

    setIsSubmitting(true);
    createApplicationMutation.mutate({
      dossierNumber: formData.dossierNumber,
      countryCode,
      documents: formData.documents,
    });
  };

  const evisa = evisaData?.data;
  const dossiers = (Array.isArray(dossierData) ? dossierData : []) || [];

  if (loadingEvisa) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!evisa) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>E-visa non trouvé. Veuillez sélectionner un pays valide.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Demande d'E-Visa</h1>
        <p className="text-blue-100">
          Créer une demande d'e-visa pour {evisa.countryName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Formulaire de Demande</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sélection du dossier */}
                <div className="space-y-2">
                  <Label htmlFor="dossier">Sélectionner un dossier *</Label>
                  <select
                    id="dossier"
                    value={formData.dossierNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, dossierNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Sélectionner un dossier --</option>
                    {(dossiers as any[])?.map((dossier: any) => (
                      <option key={dossier.id} value={dossier.dossierNumber}>
                        {dossier.dossierNumber} - {dossier.applicantName}
                      </option>
                    ))}
                  </select>
                  {dossiers.length === 0 && (
                    <p className="text-sm text-gray-600">
                      Vous n'avez pas de dossier. Veuillez{' '}
                      <a href="/open-dossier" className="text-blue-600 hover:underline">
                        en créer un
                      </a>
                      .
                    </p>
                  )}
                </div>

                {/* Documents requis */}
                {evisa.documents && (
                  <div className="space-y-2">
                    <Label>Documents requis</Label>
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                      <p className="text-sm text-gray-700">{evisa.documents}</p>
                    </div>
                  </div>
                )}

                {/* Exigences */}
                {evisa.requirements && (
                  <div className="space-y-2">
                    <Label>Exigences</Label>
                    <div className="bg-orange-50 p-4 rounded-md border border-orange-200">
                      <p className="text-sm text-gray-700">{evisa.requirements}</p>
                    </div>
                  </div>
                )}

                {/* Notes supplémentaires */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes supplémentaires</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ajoutez des informations supplémentaires si nécessaire..."
                    value={formData.documents.notes || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        documents: { ...formData.documents, notes: e.target.value },
                      })
                    }
                    className="min-h-24"
                  />
                </div>

                {/* Bouton de soumission */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.dossierNumber}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Créer la demande d'e-visa
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Résumé du pays */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{evisa.countryName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Badge région */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Région</p>
                <Badge variant="outline">{evisa.region}</Badge>
              </div>

              {/* Prix */}
              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-semibold">Prix</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {evisa.price?.toLocaleString('fr-FR')} XOF
                </p>
              </div>

              {/* Délai de traitement */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Délai de traitement</p>
                <p className="font-semibold">{evisa.processingTime}</p>
              </div>

              {/* Validité */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Validité</p>
                <p className="font-semibold">{evisa.validityDays} jours</p>
              </div>

              {/* Description */}
              {evisa.description && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-sm text-gray-700">{evisa.description}</p>
                </div>
              )}

              {/* Lien d'application */}
              {evisa.applicationUrl && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(evisa.applicationUrl, '_blank')}
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  Lien d'application officiel
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Informations importantes */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Important :</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Vérifiez que votre dossier est complet</li>
                <li>Préparez les documents requis</li>
                <li>Le paiement sera effectué à l'étape suivante</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
