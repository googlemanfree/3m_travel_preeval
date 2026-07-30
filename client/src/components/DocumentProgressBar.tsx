import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DocumentProgressBarProps {
  requiredDocuments: number;
  uploadedDocuments: number;
  pendingDocuments: number;
}

export function DocumentProgressBar({
  requiredDocuments,
  uploadedDocuments,
  pendingDocuments,
}: DocumentProgressBarProps) {
  const progressPercentage = requiredDocuments > 0 
    ? Math.round((uploadedDocuments / requiredDocuments) * 100)
    : 0;

  const remainingDocuments = requiredDocuments - uploadedDocuments;

  const getProgressColor = () => {
    if (progressPercentage === 100) return "from-green-500 to-emerald-600";
    if (progressPercentage >= 75) return "from-blue-500 to-indigo-600";
    if (progressPercentage >= 50) return "from-amber-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  const getStatusMessage = () => {
    if (progressPercentage === 100) {
      return "✨ Tous les documents requis ont été téléversés !";
    }
    if (remainingDocuments > 0) {
      return `📄 ${remainingDocuments} document${remainingDocuments > 1 ? "s" : ""} manquant${remainingDocuments > 1 ? "s" : ""}`;
    }
    return "En attente de documents...";
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Progression des Documents
          </h3>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-right"
          >
            <p className="text-3xl font-bold text-blue-600">{progressPercentage}%</p>
            <p className="text-xs text-gray-600">Complété</p>
          </motion.div>
        </div>
        <p className="text-sm text-gray-600">{getStatusMessage()}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full shadow-lg`}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        {/* Required */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-white rounded-lg border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <p className="text-xs font-semibold text-gray-600 uppercase">Requis</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{requiredDocuments}</p>
          <p className="text-xs text-gray-500 mt-1">documents</p>
        </motion.div>

        {/* Uploaded */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-white rounded-lg border border-green-200 bg-green-50"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-xs font-semibold text-green-600 uppercase">Téléversés</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{uploadedDocuments}</p>
          <p className="text-xs text-green-600 mt-1">documents</p>
        </motion.div>

        {/* Pending */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-4 bg-white rounded-lg border ${
            remainingDocuments > 0
              ? "border-amber-200 bg-amber-50"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className={`w-4 h-4 ${remainingDocuments > 0 ? "text-amber-600" : "text-gray-600"}`} />
            <p className={`text-xs font-semibold uppercase ${remainingDocuments > 0 ? "text-amber-600" : "text-gray-600"}`}>
              Manquants
            </p>
          </div>
          <p className={`text-2xl font-bold ${remainingDocuments > 0 ? "text-amber-600" : "text-gray-600"}`}>
            {remainingDocuments}
          </p>
          <p className={`text-xs mt-1 ${remainingDocuments > 0 ? "text-amber-600" : "text-gray-500"}`}>
            documents
          </p>
        </motion.div>
      </div>

      {/* Info Box */}
      {progressPercentage < 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <p className="text-sm text-blue-900">
            <strong>💡 Conseil :</strong> Téléversez les documents manquants pour accélérer le traitement de votre dossier.
            Plus votre dossier est complet, plus rapide sera notre évaluation.
          </p>
        </motion.div>
      )}

      {/* Success Message */}
      {progressPercentage === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <p className="text-sm text-green-900">
            <strong>✅ Excellent !</strong> Tous les documents requis ont été téléversés. Nous allons maintenant traiter votre dossier en priorité.
          </p>
        </motion.div>
      )}
    </Card>
  );
}
