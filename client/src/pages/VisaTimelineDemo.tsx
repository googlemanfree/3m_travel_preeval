import React from 'react';
import VisaTimelineComponent from '@/components/VisaTimelineComponent';

const VisaTimelineDemo = () => {
  const luxembourgSteps = [
    {
      id: 1,
      title: 'Préparation du dossier',
      description: 'Collecte et préparation de tous les documents requis',
      duration: '5-7 jours',
      status: 'completed' as const,
      details: [
        'Vérifier les documents requis',
        'Préparer les copies certifiées',
        'Remplir les formulaires',
        'Obtenir les attestations',
      ],
    },
    {
      id: 2,
      title: 'Soumission de la demande',
      description: 'Envoi du dossier complet aux autorités',
      duration: '1-2 jours',
      status: 'completed' as const,
      details: [
        'Soumettre le dossier en ligne',
        'Payer les frais de traitement',
        'Recevoir la confirmation de réception',
      ],
    },
    {
      id: 3,
      title: 'Examen administratif',
      description: 'Vérification et validation de la demande',
      duration: '10-15 jours',
      status: 'current' as const,
      details: [
        'Vérification des documents',
        'Demandes de clarifications si nécessaire',
        'Validation préliminaire',
      ],
    },
    {
      id: 4,
      title: 'Entretien (si requis)',
      description: 'Entretien avec les autorités de l\'immigration',
      duration: '5-10 jours',
      status: 'pending' as const,
      details: [
        'Planification de l\'entretien',
        'Préparation des réponses',
        'Entretien en personne ou virtuel',
      ],
    },
    {
      id: 5,
      title: 'Décision finale',
      description: 'Notification de la décision d\'approbation ou de rejet',
      duration: '3-5 jours',
      status: 'pending' as const,
      details: [
        'Notification de la décision',
        'Émission du visa (si approuvé)',
        'Remise du passeport',
      ],
    },
  ];

  const canadaSteps = [
    {
      id: 1,
      title: 'Évaluation de l\'admissibilité',
      description: 'Vérification de votre admissibilité au programme',
      duration: '3-5 jours',
      status: 'completed' as const,
      details: [
        'Vérifier les critères d\'admissibilité',
        'Préparer le profil Express Entry',
        'Obtenir l\'évaluation des diplômes (ECA)',
      ],
    },
    {
      id: 2,
      title: 'Création du profil',
      description: 'Création du profil dans le système Express Entry',
      duration: '1 jour',
      status: 'completed' as const,
      details: [
        'Créer le compte IRCC',
        'Remplir le formulaire de profil',
        'Soumettre le profil',
      ],
    },
    {
      id: 3,
      title: 'Invitation à présenter une demande',
      description: 'Attendre une ITA (Invitation à présenter une demande)',
      duration: '30-60 jours',
      status: 'current' as const,
      details: [
        'Attendre le tirage au sort',
        'Recevoir l\'ITA',
        'Vérifier les conditions',
      ],
    },
    {
      id: 4,
      title: 'Soumission de la demande complète',
      description: 'Soumettre la demande complète dans les 60 jours',
      duration: '2-3 jours',
      status: 'pending' as const,
      details: [
        'Préparer tous les documents',
        'Payer les frais',
        'Soumettre la demande',
      ],
    },
    {
      id: 5,
      title: 'Traitement de la demande',
      description: 'Traitement et vérification de la demande',
      duration: '60-90 jours',
      status: 'pending' as const,
      details: [
        'Vérification des antécédents',
        'Vérification médicale',
        'Vérification de sécurité',
      ],
    },
    {
      id: 6,
      title: 'Décision et remise du permis',
      description: 'Notification de la décision et remise du permis',
      duration: '5-10 jours',
      status: 'pending' as const,
      details: [
        'Notification de la décision',
        'Remise du permis de travail/étudiant',
        'Préparation du voyage',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Frises Chronologiques des Procédures de Visa
          </h1>
          <p className="text-slate-300 text-lg">
            Visualisez clairement les étapes et délais de chaque procédure de visa
          </p>
        </div>

        {/* Luxembourg Timeline */}
        <div className="mb-16">
          <VisaTimelineComponent
            country="Luxembourg"
            steps={luxembourgSteps}
            totalDays={30}
          />
        </div>

        {/* Canada Timeline */}
        <div>
          <VisaTimelineComponent
            country="Canada"
            steps={canadaSteps}
            totalDays={180}
          />
        </div>
      </div>
    </div>
  );
};

export default VisaTimelineDemo;
