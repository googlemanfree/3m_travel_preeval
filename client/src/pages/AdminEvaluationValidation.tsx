import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AIEvaluation {
  id: number;
  candidateName: string;
  email: string;
  destination: string;
  visaType: string;
  aiScore: number;
  aiReport: string;
  cvFileName: string;
  submittedAt: string;
  status: 'pending' | 'validated' | 'rejected';
  adminNotes: string;
}

const mockEvaluations: AIEvaluation[] = [
  {
    id: 1,
    candidateName: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    destination: 'Canada',
    visaType: 'Travail',
    aiScore: 85,
    aiReport: `Profil très favorable pour le Canada. Expérience solide en technologie (8 ans), niveau d'anglais excellent (C1), formation master en informatique. Critères de sélection du Canada bien alignés. Recommandation: Excellent candidat pour le programme Express Entry.`,
    cvFileName: 'jean_dupont_cv.pdf',
    submittedAt: '2026-08-06',
    status: 'pending',
    adminNotes: '',
  },
  {
    id: 2,
    candidateName: 'Marie Martin',
    email: 'marie.martin@example.com',
    destination: 'Luxembourg',
    visaType: 'Études',
    aiScore: 78,
    aiReport: `Profil favorable pour Luxembourg. Licence en gestion, niveau français B2, admission confirmée dans université reconnue. Financement partiel assuré. Critères d'éligibilité satisfaits.`,
    cvFileName: 'marie_martin_cv.pdf',
    submittedAt: '2026-08-05',
    status: 'pending',
    adminNotes: '',
  },
  {
    id: 3,
    candidateName: 'Pierre Bernard',
    email: 'pierre.bernard@example.com',
    destination: 'France',
    visaType: 'Travail',
    aiScore: 72,
    aiReport: `Profil modérément favorable. 5 ans d'expérience en finance, niveau d'anglais B1, licence en économie. Certains critères à renforcer pour améliorer les chances.`,
    cvFileName: 'pierre_bernard_cv.pdf',
    submittedAt: '2026-08-04',
    status: 'validated',
    adminNotes: 'Évaluation validée. Candidat peut procéder au paiement.',
  },
];

export default function AdminEvaluationValidation() {
  const [evaluations, setEvaluations] = useState<AIEvaluation[]>(mockEvaluations);
  const [selectedEvaluation, setSelectedEvaluation] = useState<AIEvaluation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [adminNoteText, setAdminNoteText] = useState<string>('');

  const filteredEvaluations = evaluations.filter((e) => {
    if (filterStatus === 'all') return true;
    return e.status === filterStatus;
  });

  const handleValidateEvaluation = (evaluationId: number) => {
    setEvaluations(
      evaluations.map((e) =>
        e.id === evaluationId ? { ...e, status: 'validated' } : e
      )
    );
    if (selectedEvaluation?.id === evaluationId) {
      setSelectedEvaluation({
        ...selectedEvaluation,
        status: 'validated',
      });
    }
  };

  const handleRejectEvaluation = (evaluationId: number) => {
    setEvaluations(
      evaluations.map((e) =>
        e.id === evaluationId ? { ...e, status: 'rejected' } : e
      )
    );
    if (selectedEvaluation?.id === evaluationId) {
      setSelectedEvaluation({
        ...selectedEvaluation,
        status: 'rejected',
      });
    }
  };

  const handleAddNote = (evaluationId: number) => {
    if (!adminNoteText.trim()) return;
    setEvaluations(
      evaluations.map((e) =>
        e.id === evaluationId
          ? { ...e, adminNotes: adminNoteText }
          : e
      )
    );
    if (selectedEvaluation?.id === evaluationId) {
      setSelectedEvaluation({
        ...selectedEvaluation,
        adminNotes: adminNoteText,
      });
    }
    setAdminNoteText('');
  };

  const handleSendEmail = (evaluation: AIEvaluation) => {
    alert(
      `Email envoyé à ${evaluation.candidateName} (${evaluation.email})\nScore: ${evaluation.aiScore}/100\nStatut: ${evaluation.status === 'validated' ? 'Approuvé' : 'Rejeté'}`
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'validated':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'validated':
        return 'Validée';
      case 'rejected':
        return 'Rejetée';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Validation des Évaluations IA
          </h1>
          <p className="text-lg text-gray-600">
            Examinez et validez les évaluations générées par l'IA
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <h3 className="text-2xl font-bold">{evaluations.length}</h3>
            <p className="text-blue-100">Total évaluations</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <h3 className="text-2xl font-bold">
              {evaluations.filter((e) => e.status === 'pending').length}
            </h3>
            <p className="text-yellow-100">En attente</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <h3 className="text-2xl font-bold">
              {evaluations.filter((e) => e.status === 'validated').length}
            </h3>
            <p className="text-green-100">Validées</p>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-red-500 to-red-600 text-white">
            <h3 className="text-2xl font-bold">
              {evaluations.filter((e) => e.status === 'rejected').length}
            </h3>
            <p className="text-red-100">Rejetées</p>
          </Card>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des évaluations */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Évaluations
                </h2>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => setFilterStatus('all')}
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                  >
                    Toutes ({evaluations.length})
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('pending')}
                    variant={filterStatus === 'pending' ? 'default' : 'outline'}
                  >
                    En attente (
                    {evaluations.filter((e) => e.status === 'pending').length})
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('validated')}
                    variant={filterStatus === 'validated' ? 'default' : 'outline'}
                  >
                    Validées (
                    {evaluations.filter((e) => e.status === 'validated').length})
                  </Button>
                  <Button
                    onClick={() => setFilterStatus('rejected')}
                    variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                  >
                    Rejetées (
                    {evaluations.filter((e) => e.status === 'rejected').length})
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredEvaluations.map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedEvaluation?.id === evaluation.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedEvaluation(evaluation)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {evaluation.candidateName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {evaluation.email}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                          evaluation.status
                        )}`}
                      >
                        {getStatusLabel(evaluation.status)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        {evaluation.destination} - {evaluation.visaType}
                      </span>
                      <span className="font-bold text-gray-900">
                        Score: {evaluation.aiScore}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Détails et actions */}
          <div>
            {selectedEvaluation ? (
              <Card className="p-6 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Détails de l'évaluation
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Candidat</p>
                    <p className="font-bold text-gray-900">
                      {selectedEvaluation.candidateName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-bold text-gray-900">
                      {selectedEvaluation.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Destination</p>
                    <p className="font-bold text-gray-900">
                      {selectedEvaluation.destination} - {selectedEvaluation.visaType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Score IA</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${selectedEvaluation.aiScore}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-gray-900">
                        {selectedEvaluation.aiScore}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CV</p>
                    <p className="font-bold text-gray-900">
                      {selectedEvaluation.cvFileName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Soumis le</p>
                    <p className="font-bold text-gray-900">
                      {new Date(selectedEvaluation.submittedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <p className="text-sm font-bold text-gray-900 mb-2">
                    Rapport IA
                  </p>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 max-h-32 overflow-y-auto">
                    {selectedEvaluation.aiReport}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <p className="text-sm font-bold text-gray-900 mb-2">
                    Notes administratives
                  </p>
                  <textarea
                    value={adminNoteText || selectedEvaluation.adminNotes}
                    onChange={(e) => setAdminNoteText(e.target.value)}
                    placeholder="Ajouter une note..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={3}
                  />
                  <Button
                    onClick={() => handleAddNote(selectedEvaluation.id)}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                  >
                    Ajouter la note
                  </Button>
                </div>

                {selectedEvaluation.status === 'pending' && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleValidateEvaluation(selectedEvaluation.id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      ✓ Valider l'évaluation
                    </Button>
                    <Button
                      onClick={() => handleRejectEvaluation(selectedEvaluation.id)}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      ✗ Rejeter l'évaluation
                    </Button>
                  </div>
                )}

                {selectedEvaluation.status !== 'pending' && (
                  <Button
                    onClick={() => handleSendEmail(selectedEvaluation)}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Envoyer email au candidat
                  </Button>
                )}
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-gray-600">
                  Sélectionnez une évaluation pour voir les détails
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
