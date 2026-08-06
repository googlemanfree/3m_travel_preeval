import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Dossier {
  id: number;
  dossierNumber: string;
  clientName: string;
  email: string;
  destination: string;
  visaType: string;
  status: string;
  paymentStatus: string;
  aiScore: number;
  createdAt: string;
  adminNote: string;
}

const mockDossiers: Dossier[] = [
  {
    id: 1,
    dossierNumber: '3M-2026-0001',
    clientName: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    destination: 'Canada',
    visaType: 'Travail',
    status: 'en_attente_paiement',
    paymentStatus: 'PENDING',
    aiScore: 85,
    createdAt: '2026-08-06',
    adminNote: 'Profil excellent, à suivre',
  },
  {
    id: 2,
    dossierNumber: '3M-2026-0002',
    clientName: 'Marie Martin',
    email: 'marie.martin@example.com',
    destination: 'Luxembourg',
    visaType: 'Études',
    status: 'paye',
    paymentStatus: 'SUCCESS',
    aiScore: 78,
    createdAt: '2026-08-05',
    adminNote: 'Documents en attente',
  },
  {
    id: 3,
    dossierNumber: '3M-2026-0003',
    clientName: 'Pierre Bernard',
    email: 'pierre.bernard@example.com',
    destination: 'France',
    visaType: 'Travail',
    status: 'documents_recus',
    paymentStatus: 'SUCCESS',
    aiScore: 72,
    createdAt: '2026-08-04',
    adminNote: 'En cours de vérification',
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

export default function AdminDossierManagement() {
  const [dossiers, setDossiers] = useState<Dossier[]>(mockDossiers);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('tous');
  const [adminNoteText, setAdminNoteText] = useState<string>('');

  const filteredDossiers = dossiers.filter((d) => {
    if (filterStatus === 'tous') return true;
    return d.status === filterStatus;
  });

  const handleStatusChange = (dossierId: number, newStatus: string) => {
    setDossiers(
      dossiers.map((d) =>
        d.id === dossierId ? { ...d, status: newStatus } : d
      )
    );
  };

  const handleAddNote = (dossierId: number) => {
    if (!adminNoteText.trim()) return;
    setDossiers(
      dossiers.map((d) =>
        d.id === dossierId
          ? { ...d, adminNote: adminNoteText }
          : d
      )
    );
    setAdminNoteText('');
  };

  const handleSendNotification = (dossier: Dossier) => {
    alert(
      `Notification envoyée à ${dossier.clientName} (${dossier.email})\nMise à jour du statut: ${dossier.status}`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Gestion des Dossiers
          </h1>
          <p className="text-lg text-gray-600">
            Suivi et gestion des dossiers clients
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <h3 className="text-2xl font-bold">{dossiers.length}</h3>
            <p className="text-blue-100">Total dossiers</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <h3 className="text-2xl font-bold">
              {dossiers.filter((d) => d.paymentStatus === 'PENDING').length}
            </h3>
            <p className="text-yellow-100">En attente de paiement</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <h3 className="text-2xl font-bold">
              {dossiers.filter((d) => d.paymentStatus === 'SUCCESS').length}
            </h3>
            <p className="text-green-100">Payés</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <h3 className="text-2xl font-bold">
              {dossiers.filter((d) => d.status === 'approuve').length}
            </h3>
            <p className="text-purple-100">Approuvés</p>
          </Card>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des dossiers */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Dossiers
                </h2>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => setFilterStatus('tous')}
                    variant={filterStatus === 'tous' ? 'default' : 'outline'}
                  >
                    Tous ({dossiers.length})
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('en_attente_paiement')}
                    variant={
                      filterStatus === 'en_attente_paiement'
                        ? 'default'
                        : 'outline'
                    }
                  >
                    En attente paiement (
                    {dossiers.filter((d) => d.status === 'en_attente_paiement')
                      .length}
                    )
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('paye')}
                    variant={filterStatus === 'paye' ? 'default' : 'outline'}
                  >
                    Payés ({dossiers.filter((d) => d.status === 'paye').length})
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('documents_recus')}
                    variant={
                      filterStatus === 'documents_recus'
                        ? 'default'
                        : 'outline'
                    }
                  >
                    Documents reçus (
                    {dossiers.filter((d) => d.status === 'documents_recus')
                      .length}
                    )
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredDossiers.map((dossier) => (
                  <div
                    key={dossier.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedDossier?.id === dossier.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedDossier(dossier)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {dossier.dossierNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {dossier.clientName} - {dossier.email}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusLabels[dossier.status]?.color ||
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[dossier.status]?.label || dossier.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        {dossier.destination} - {dossier.visaType}
                      </span>
                      <span>Score: {dossier.aiScore}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Détails et actions */}
          <div>
            {selectedDossier ? (
              <Card className="p-6 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Détails du dossier
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Numéro</p>
                    <p className="font-bold text-gray-900">
                      {selectedDossier.dossierNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Client</p>
                    <p className="font-bold text-gray-900">
                      {selectedDossier.clientName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-bold text-gray-900">
                      {selectedDossier.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Destination</p>
                    <p className="font-bold text-gray-900">
                      {selectedDossier.destination} - {selectedDossier.visaType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Score IA</p>
                    <p className="font-bold text-gray-900">
                      {selectedDossier.aiScore}/100
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <p className="text-sm font-bold text-gray-900 mb-2">
                    Changer le statut
                  </p>
                  <select
                    value={selectedDossier.status}
                    onChange={(e) =>
                      handleStatusChange(selectedDossier.id, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {Object.entries(statusLabels).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <p className="text-sm font-bold text-gray-900 mb-2">
                    Note administrative
                  </p>
                  <textarea
                    value={adminNoteText || selectedDossier.adminNote}
                    onChange={(e) => setAdminNoteText(e.target.value)}
                    placeholder="Ajouter une note..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={3}
                  />
                  <Button
                    onClick={() => handleAddNote(selectedDossier.id)}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                  >
                    Ajouter la note
                  </Button>
                </div>

                <Button
                  onClick={() => handleSendNotification(selectedDossier)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Envoyer notification au client
                </Button>
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
