import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";

/**
 * Timeline de progression du dossier — reflète le vrai statut fixé par
 * l'équipe admin (applications.dossierStatus), jamais une valeur fictive.
 * Regroupe les statuts détaillés du backend en étapes visuelles claires
 * pour le candidat, avec un message professionnel adapté à chacune.
 */

const STAGE_GROUPS = [
  {
    key: "evaluation",
    label: "Évaluation",
    icon: "🔍",
    statuses: ["nouveau", "en_evaluation", "bilan_envoye"],
  },
  {
    key: "paiement",
    label: "Ouverture du dossier",
    icon: "💳",
    statuses: ["en_attente_paiement", "paye"],
  },
  {
    key: "documents",
    label: "Collecte des pièces",
    icon: "📄",
    statuses: ["en_attente_documents", "documents_recus"],
  },
  {
    key: "soumission",
    label: "Soumission",
    icon: "📮",
    statuses: ["soumis_agences", "en_cours_recrutement"],
  },
  {
    key: "decision",
    label: "Décision finale",
    icon: "✅",
    statuses: ["contrat_obtenu", "visa_approuve", "refuse"],
  },
];

const STAGE_MESSAGES: Record<string, string> = {
  nouveau: "Votre dossier vient d'être créé. Notre équipe va bientôt l'examiner.",
  en_evaluation: "Nos experts analysent votre profil pour identifier la meilleure stratégie.",
  bilan_envoye: "Votre bilan d'évaluation est disponible — consultez-le dans votre espace.",
  en_attente_paiement: "Votre dossier attend l'ouverture officielle — finalisez votre paiement pour continuer.",
  paye: "Paiement confirmé ! Votre dossier est officiellement ouvert.",
  en_attente_documents: "Il est temps de nous transmettre vos documents pour avancer.",
  documents_recus: "Vos documents ont bien été reçus et sont en cours de vérification.",
  soumis_agences: "Votre dossier a été transmis pour la suite des démarches.",
  en_cours_recrutement: "Votre profil est activement en cours de traitement auprès de nos partenaires.",
  contrat_obtenu: "Excellente nouvelle — un contrat a été obtenu pour vous !",
  visa_approuve: "🎉 Félicitations ! Votre visa a été approuvé.",
  refuse: "Votre dossier n'a pas abouti cette fois. Notre équipe reste à votre disposition pour étudier les prochaines options.",
};

function getStageIndex(status: string): number {
  const idx = STAGE_GROUPS.findIndex((g) => g.statuses.includes(status));
  return idx === -1 ? 0 : idx;
}

export default function DossierProgressTimeline({ dossierStatus }: { dossierStatus: string }) {
  const isRefused = dossierStatus === "refuse";
  const currentStageIndex = getStageIndex(dossierStatus);
  const message = STAGE_MESSAGES[dossierStatus] || "Votre dossier progresse — nous vous tiendrons informé à chaque étape.";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Suivi de votre dossier</h3>
      <p className="text-sm text-gray-500 mb-6">Mis à jour en temps réel par notre équipe</p>

      {/* Étapes */}
      <div className="flex items-start justify-between mb-6 relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" style={{ zIndex: 0 }} />
        <div
          className="absolute top-5 left-0 h-0.5 bg-blue-600 transition-all duration-500"
          style={{ width: `${(currentStageIndex / (STAGE_GROUPS.length - 1)) * 100}%`, zIndex: 0 }}
        />
        {STAGE_GROUPS.map((stage, i) => {
          const isDone = i < currentStageIndex;
          const isCurrent = i === currentStageIndex;
          return (
            <div key={stage.key} className="flex flex-col items-center gap-2 relative z-10 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                  isRefused && isCurrent
                    ? "bg-red-50 border-red-400"
                    : isDone
                    ? "bg-blue-600 border-blue-600 text-white"
                    : isCurrent
                    ? "bg-blue-50 border-blue-600"
                    : "bg-white border-gray-200"
                }`}
              >
                {isRefused && isCurrent ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : isDone ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isCurrent ? (
                  <Clock className="w-5 h-5 text-blue-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300" />
                )}
              </div>
              <span className={`text-xs text-center font-medium ${isCurrent ? "text-blue-700" : isDone ? "text-gray-700" : "text-gray-400"}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Message professionnel adapté à l'étape */}
      <div className={`rounded-xl p-4 text-sm ${isRefused ? "bg-red-50 text-red-800 border border-red-100" : "bg-blue-50 text-blue-800 border border-blue-100"}`}>
        {message}
      </div>
    </div>
  );
}
