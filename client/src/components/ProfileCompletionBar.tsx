import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, User, Mail, MapPin, Briefcase, BookOpen, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileCompletionBarProps {
  profile: any;
  onEditClick?: () => void;
}

export function ProfileCompletionBar({ profile, onEditClick }: ProfileCompletionBarProps) {
  // Calculer le pourcentage de complétion du profil
  const calculateCompletionPercentage = () => {
    if (!profile) return 0;

    const fields = [
      { key: "fullName", label: "Nom complet" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Téléphone" },
      { key: "nationality", label: "Nationalité" },
      { key: "dateOfBirth", label: "Date de naissance" },
      { key: "destination", label: "Destination" },
      { key: "educationLevel", label: "Niveau d'études" },
      { key: "employmentStatus", label: "Statut professionnel" },
      { key: "languageLevel", label: "Niveau de langue" },
    ];

    let completedCount = 0;
    fields.forEach((field) => {
      if (profile[field.key] && profile[field.key].toString().trim() !== "") {
        completedCount++;
      }
    });

    return Math.round((completedCount / fields.length) * 100);
  };

  // Obtenir les champs manquants
  const getMissingFields = () => {
    if (!profile) return [];

    const fields = [
      { key: "fullName", label: "Nom complet", icon: User },
      { key: "email", label: "Email", icon: Mail },
      { key: "phone", label: "Téléphone", icon: Phone },
      { key: "nationality", label: "Nationalité", icon: MapPin },
      { key: "dateOfBirth", label: "Date de naissance", icon: AlertCircle },
      { key: "destination", label: "Destination", icon: MapPin },
      { key: "educationLevel", label: "Niveau d'études", icon: BookOpen },
      { key: "employmentStatus", label: "Statut professionnel", icon: Briefcase },
      { key: "languageLevel", label: "Niveau de langue", icon: BookOpen },
    ];

    return fields.filter(
      (field) => !profile[field.key] || profile[field.key].toString().trim() === ""
    );
  };

  const completionPercentage = calculateCompletionPercentage();
  const missingFields = getMissingFields();
  const isComplete = completionPercentage === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl p-6 mb-6 border-2 ${
        isComplete
          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
          : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isComplete ? (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </motion.div>
          )}
          <div>
            <h3 className={`text-lg font-bold ${isComplete ? "text-green-900" : "text-blue-900"}`}>
              {isComplete ? "Profil Complet ✓" : "Complétez votre profil"}
            </h3>
            <p className={`text-sm ${isComplete ? "text-green-700" : "text-blue-700"}`}>
              {completionPercentage}% complété
            </p>
          </div>
        </div>
        {!isComplete && onEditClick && (
          <Button
            onClick={onEditClick}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
          >
            Compléter
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${
              isComplete
                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                : "bg-gradient-to-r from-blue-500 to-indigo-500"
            }`}
          />
        </div>
      </div>

      {/* Missing Fields */}
      {!isComplete && missingFields.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 rounded-lg p-4"
        >
          <p className="text-sm font-semibold text-gray-900 mb-3">
            Champs à compléter ({missingFields.length}) :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {missingFields.slice(0, 6).map((field) => (
              <div key={field.key} className="flex items-center gap-2 text-sm text-gray-700">
                <field.icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>{field.label}</span>
              </div>
            ))}
          </div>
          {missingFields.length > 6 && (
            <p className="text-xs text-gray-600 mt-2">
              +{missingFields.length - 6} autre(s) champ(s)
            </p>
          )}
        </motion.div>
      )}

      {/* Success Message */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/60 rounded-lg p-4 text-center"
        >
          <p className="text-green-900 font-semibold">
            Excellent ! Votre profil est à jour. Vous pouvez maintenant commencer votre demande de visa.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
