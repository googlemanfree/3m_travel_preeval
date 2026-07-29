import { useMemo, useState } from 'react';
import { motion } from "framer-motion";
import {
  FileText,
  Clock,
  DollarSign,
  Upload,
  CheckCircle2,
  Briefcase,
  Award,
  AlertCircle,
} from "lucide-react";
import { PaymentModal } from "./PaymentModal";
import { SecureDocumentUpload } from "./SecureDocumentUpload";

export interface DossierProgressBarProps {
  status:
    | "nouveau"
    | "en_evaluation"
    | "bilan_envoye"
    | "en_attente_paiement"
    | "paye"
    | "en_attente_documents"
    | "documents_recus"
    | "soumis_agences"
    | "en_cours_recrutement"
    | "contrat_obtenu"
    | "visa_approuve"
    | "refuse";
  createdAt?: Date;
  evaluationCompletedAt?: Date;
  documentsReceivedAt?: Date;
  submittedToAgenciesAt?: Date;
  dossierNumber?: string;
  email?: string;
  onPaymentSuccess?: () => void;
}

const STEPS = [
  {
    id: "nouveau",
    label: "Dossier Créé",
    description: "Votre compte est actif",
    icon: FileText,
    color: "bg-blue-100 text-blue-600",
    borderColor: "border-blue-300",
  },
  {
    id: "en_evaluation",
    label: "En Évaluation",
    description: "Analyse de votre profil",
    icon: Clock,
    color: "bg-purple-100 text-purple-600",
    borderColor: "border-purple-300",
  },
  {
    id: "bilan_envoye",
    label: "Bilan Reçu",
    description: "Résultats dans votre email",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-600",
    borderColor: "border-green-300",
  },
  {
    id: "en_attente_paiement",
    label: "En Attente Paiement",
    description: "Finalisez votre candidature",
    icon: DollarSign,
    color: "bg-yellow-100 text-yellow-600",
    borderColor: "border-yellow-300",
  },
  {
    id: "paye",
    label: "Paiement Confirmé",
    description: "65 000 XAF reçu",
    icon: CheckCircle2,
    color: "bg-emerald-100 text-emerald-600",
    borderColor: "border-emerald-300",
  },
  {
    id: "en_attente_documents",
    label: "Documents Attendus",
    description: "Déposez vos documents",
    icon: Upload,
    color: "bg-orange-100 text-orange-600",
    borderColor: "border-orange-300",
  },
  {
    id: "documents_recus",
    label: "Documents Reçus",
    description: "Vérification en cours",
    icon: CheckCircle2,
    color: "bg-teal-100 text-teal-600",
    borderColor: "border-teal-300",
  },
  {
    id: "soumis_agences",
    label: "Soumis aux Agences",
    description: "Recherche d'opportunités",
    icon: Briefcase,
    color: "bg-indigo-100 text-indigo-600",
    borderColor: "border-indigo-300",
  },
  {
    id: "en_cours_recrutement",
    label: "Recrutement en Cours",
    description: "Entretiens en cours",
    icon: Briefcase,
    color: "bg-pink-100 text-pink-600",
    borderColor: "border-pink-300",
  },
  {
    id: "contrat_obtenu",
    label: "Contrat Obtenu",
    description: "Offre d'emploi reçue",
    icon: Award,
    color: "bg-cyan-100 text-cyan-600",
    borderColor: "border-cyan-300",
  },
  {
    id: "visa_approuve",
    label: "Visa Approuvé",
    description: "Félicitations !",
    icon: Award,
    color: "bg-green-100 text-green-600",
    borderColor: "border-green-300",
  },
  {
    id: "refuse",
    label: "Dossier Refusé",
    description: "Contactez-nous",
    icon: AlertCircle,
    color: "bg-red-100 text-red-600",
    borderColor: "border-red-300",
  },
];

export function DossierProgressBar({
  status,
  createdAt,
  evaluationCompletedAt,
  documentsReceivedAt,
  submittedToAgenciesAt,
  dossierNumber = "",
  email = "",
  onPaymentSuccess,
}: DossierProgressBarProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const currentStepIndex = useMemo(() => {
    return STEPS.findIndex((step) => step.id === status);
  }, [status]);

  const currentStep = STEPS[currentStepIndex];
  const progressPercentage = ((currentStepIndex + 1) / STEPS.length) * 100;

  const isRefused = status === "refuse";
  const isApproved = status === "visa_approuve";

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 border border-blue-200">
      {/* Titre et statut actuel */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Suivi de Votre Dossier</h2>
        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full ${
              isRefused
                ? "bg-red-600"
                : isApproved
                  ? "bg-green-600"
                  : "bg-blue-600 animate-pulse"
            }`}
          ></div>
          <p className="text-lg font-semibold text-gray-700">
            Étape actuelle : <span className="text-blue-600">{currentStep.label}</span>
          </p>
        </div>
      </div>

      {/* Barre de progression linéaire */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-600">Progression globale</span>
          <span className="text-sm font-bold text-blue-600">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              isRefused
                ? "bg-red-500"
                : isApproved
                  ? "bg-green-500"
                  : "bg-gradient-to-r from-blue-500 to-indigo-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Timeline horizontale des étapes */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 pb-4 min-w-max">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isUpcoming = index > currentStepIndex;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.5, ease: "easeOut" }}
                viewport={{ once: true }}
                className="flex flex-col items-center"
              >
                {/* Connecteur */}
                {index < STEPS.length - 1 && (
                  <motion.div
                    className={`absolute left-[calc(50%+32px)] top-8 w-8 h-1 transition-colors ${
                      isCompleted ? "bg-green-500" : "bg-gray-300"
                    }`}
                    style={{
                      marginLeft: "8px",
                    }}
                    animate={{
                      backgroundColor: isCompleted ? "#22c55e" : "#d1d5db",
                    }}
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* Cercle étape */}
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: isCurrent ? "0 0 20px rgba(59, 130, 246, 0.5)" : "0 0 0px rgba(0, 0, 0, 0)",
                  }}
                  transition={{ duration: 0.3 }}
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all cursor-pointer ${
                    isCompleted
                      ? "bg-green-100 border-green-500 text-green-600"
                      : isCurrent
                        ? `${step.color} ${step.borderColor} shadow-lg ring-4 ring-blue-200`
                        : "bg-gray-100 border-gray-300 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <Icon className="w-8 h-8" />
                  )}
                </motion.div>

                {/* Label et description */}
                <div className="mt-3 text-center">
                  <p
                    className={`text-xs font-semibold ${
                      isCurrent
                        ? "text-blue-600"
                        : isCompleted
                          ? "text-green-600"
                          : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Détails de l'étape actuelle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="mt-8 p-4 bg-white rounded-lg border border-blue-200"
      >
        <h3 className="font-semibold text-gray-900 mb-3">Détails de l'étape actuelle</h3>
        <div className="space-y-2 text-sm text-gray-600">
          {status === "nouveau" && (
            <>
              <p>✓ Votre compte est créé et actif</p>
              <p>⏳ Votre évaluation commencera sous peu</p>
              <p>📧 Vous recevrez les résultats par email dans 48 heures</p>
            </>
          )}
          {status === "en_evaluation" && (
            <>
              <p>✓ Votre profil est en cours d'analyse</p>
              <p>⏳ Nos experts évaluent votre éligibilité</p>
              <p>📧 Vous recevrez votre bilan dans 48 heures</p>
            </>
          )}
          {status === "bilan_envoye" && (
            <>
              <p>✓ Votre bilan d'éligibilité a été envoyé</p>
              <p>⏳ Veuillez consulter votre email</p>
              <p>💳 Procédez au paiement de 65 000 XAF pour finaliser</p>
            </>
          )}
          {status === "en_attente_paiement" && (
            <>
              <p>✓ Bilan reçu avec succès</p>
              <p>⏳ En attente de votre paiement</p>
              <p>💳 Montant à payer : 65 000 XAF</p>
            </>
          )}
          {status === "paye" && (
            <>
              <p>✓ Paiement confirmé</p>
              <p>⏳ Préparez vos documents</p>
              <p>📄 Déposez vos documents originaux ou scans pro</p>
            </>
          )}
          {status === "en_attente_documents" && (
            <>
              <p>✓ Paiement reçu</p>
              <p>⏳ En attente de vos documents</p>
              <p>📤 Déposez vos documents en agence ou en ligne</p>
            </>
          )}
          {status === "documents_recus" && (
            <>
              <p>✓ Documents reçus</p>
              <p>⏳ Vérification en cours</p>
              <p>✅ Nous vérifions vos documents</p>
            </>
          )}
          {status === "soumis_agences" && (
            <>
              <p>✓ Documents vérifiés</p>
              <p>⏳ Soumis aux agences partenaires</p>
              <p>🔍 Nos partenaires recherchent des opportunités</p>
            </>
          )}
          {status === "en_cours_recrutement" && (
            <>
              <p>✓ Dossier actif chez les agences</p>
              <p>⏳ Entretiens en cours</p>
              <p>📞 Nous vous contacterons avec les offres</p>
            </>
          )}
          {status === "contrat_obtenu" && (
            <>
              <p>✓ Contrat de travail obtenu</p>
              <p>⏳ Traitement du visa en cours</p>
              <p>🎉 Préparez-vous pour votre départ</p>
            </>
          )}
          {status === "visa_approuve" && (
            <>
              <p>✓ Visa approuvé !</p>
              <p>🎉 Félicitations !</p>
              <p>📞 Contactez-nous pour les dernières étapes</p>
            </>
          )}
          {status === "refuse" && (
            <>
              <p>❌ Votre dossier a été refusé</p>
              <p>📞 Contactez-nous pour discuter des options</p>
              <p>💡 Nous pouvons explorer d'autres solutions</p>
            </>
          )}
        </div>
      </motion.div>

      {/* Zone de téléchargement sécurisée */}
      {(status === "en_attente_documents" || status === "paye") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="mt-6"
        >
          <SecureDocumentUpload
            dossierNumber={dossierNumber}
            onUploadComplete={() => {
              // Recharger le dossier après upload
              if (onPaymentSuccess) {
                onPaymentSuccess();
              }
            }}
          />
        </motion.div>
      )}

      {/* CTA selon le statut */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        viewport={{ once: true }}
        className="mt-6 flex gap-3"
      >
        {status === "en_attente_paiement" && (
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <DollarSign className="w-5 h-5" />
            Payer 65 000 XAF
          </button>
        )}
        {status === "en_attente_documents" && (
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Déposer mes Documents
          </button>
        )}
        {(status === "refuse" || status === "visa_approuve") && (
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
            Contacter un Conseiller
          </button>
        )}
      </motion.div>

      {/* Modal de paiement */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        dossierNumber={dossierNumber}
        email={email}
        amount={65000}
        onPaymentSuccess={onPaymentSuccess}
      />
    </div>
  );
}
