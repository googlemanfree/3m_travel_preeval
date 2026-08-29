import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { startLogin } from '@/const';

interface Dossier {
  id: number;
  dossierNumber: string;
  destination: string;
  visaType: string;
  status: string;
  createdAt: string;
  paymentStatus: string;
  aiScore: number;
}

const mockDossiers: Dossier[] = [
  {
    id: 1,
    dossierNumber: '3M-2026-0001',
    destination: 'Canada',
    visaType: 'Travail',
    status: 'en_attente_paiement',
    createdAt: '2026-08-06',
    paymentStatus: 'PENDING',
    aiScore: 85,
  },
  {
    id: 2,
    dossierNumber: '3M-2026-0002',
    destination: 'Luxembourg',
    visaType: 'Études',
    status: 'paye',
    createdAt: '2026-08-05',
    paymentStatus: 'SUCCESS',
    aiScore: 78,
  },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  nouveau: { label: 'Nouveau', color: 'bg-blue-100 text-blue-800' },
  evaluation_complete: { label: 'Évaluation complète', color: 'bg-green-100 text-green-800' },
  en_attente_paiement: { label: 'En attente de paiement', color: 'bg-yellow-100 text-yellow-800' },
  paye: { label: 'Payé', color: 'bg-green-100 text-green-800' },
  en_attente_documents: { label: 'En attente de documents', color: 'bg-orange-100 text-orange-800' },
  documents_recus: { label: 'Documents reçus', color: 'bg-blue-100 text-blue-800' },
  en_cours_traitement: { label: 'En cours de traitement', color: 'bg-purple-100 text-purple-800' },
  approuve: { label: 'Approuvé', color: 'bg-green-100 text-green-800' },
  refuse: { label: 'Refusé', color: 'bg-red-100 text-red-800' },
};

export default function ClientSpace() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [dossiers, setDossiers] = useState<Dossier[]>(mockDossiers);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      startLogin();
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Authentification requise</h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder à votre espace.
          </p>
          <Button onClick={() => startLogin()} className="w-full">
            Se connecter
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mon Espace</h1>
          <p className="text-lg text-gray-600">
            Bienvenue {user?.name}, gérez vos dossiers d'immigration ici.
          </p>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <h3 className="text-2xl font-bold mb-2">{dossiers.length}</h3>
            <p className="text-blue-100">Dossiers actifs</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <h3 className="text-2xl font-bold mb-2">
              {dossiers.filter(d => d.paymentStatus === 'SUCCESS').length}
            </h3>
            <p className="text-green-100">Dossiers payés</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <Button
              onClick={() => setLocation('/evaluation')}
              className="w-full bg-white text-purple-600 hover:bg-gray-100"
            >
              Nouvelle évaluation
            </Button>
          </Card>
        </div>

        {/* Liste des dossiers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Liste des dossiers */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mes Dossiers</h2>
            <div className="space-y-4">
              {dossiers.map((dossier) => (
                <Card
                  key={dossier.id}
                  className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                    selectedDossier?.id === dossier.id
                      ? 'border-2 border-blue-500 bg-blue-50'
                      : 'border border-gray-200'
                  }`}
                  onClick={() => setSelectedDossier(dossier)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {dossier.dossierNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {dossier.destination} - Visa {dossier.visaType}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusLabels[dossier.status]?.color || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {statusLabels[dossier.status]?.label || dossier.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Score IA</p>
                      <p className="font-bold text-gray-900">{dossier.aiScore}/100</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Paiement</p>
                      <p className={`font-bold ${
                        dossier.paymentStatus === 'SUCCESS'
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      }`}>
                        {dossier.paymentStatus === 'SUCCESS' ? 'Payé' : 'En attente'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Créé le</p>
                      <p className="font-bold text-gray-900">
                        {new Date(dossier.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Colonne droite - Détails du dossier */}
          <div>
            {selectedDossier ? (
              <Card className="p-6 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Détails du dossier
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Numéro de dossier</p>
                    <p className="font-bold text-gray-900">{selectedDossier.dossierNumber}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Destination</p>
                    <p className="font-bold text-gray-900">{selectedDossier.destination}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Type de visa</p>
                    <p className="font-bold text-gray-900">{selectedDossier.visaType}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <p className={`font-bold ${
                      statusLabels[selectedDossier.status]?.color || 'text-gray-900'
                    }`}>
                      {statusLabels[selectedDossier.status]?.label || selectedDossier.status}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Score d'évaluation IA</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${selectedDossier.aiScore}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-gray-900">
                        {selectedDossier.aiScore}%
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 mb-2">
                      Voir les détails
                    </Button>
                    <Button variant="outline" className="w-full">
                      Télécharger les documents
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-600">
                  Sélectionnez un dossier pour voir les détails
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
