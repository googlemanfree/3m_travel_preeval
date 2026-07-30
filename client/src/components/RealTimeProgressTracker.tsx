import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  TrendingUp,
  Calendar,
  MapPin,
  FileText,
  Users,
  Shield,
  ArrowRight,
  Bell,
  Share2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProgressStep {
  id: string;
  name: string;
  description: string;
  status: "completed" | "current" | "pending";
  estimatedDate: string;
  actualDate?: string;
  percentage: number;
  icon: React.ReactNode;
  details: string[];
  notifications: {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
}

interface RealTimeUpdate {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "alert";
  icon: React.ReactNode;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { duration: 2, repeat: Infinity },
};

// ─── Composant : Barre de Progression Circulaire ───
const CircularProgress = ({ percentage }: { percentage: number }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="4"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="4"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
          <p className="text-xs text-gray-600">Complété</p>
        </div>
      </div>
    </div>
  );
};

// ─── Composant : Étape avec Détails ───
const StepCard = ({ step, index }: { step: ProgressStep; index: number }) => {
  const [expanded, setExpanded] = useState(step.status === "current");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-300";
      case "current":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "pending":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "current":
        return "bg-blue-50 border-blue-200";
      case "pending":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      variants={fadeInUp}
      custom={index}
      viewport={{ once: true }}
      className={`border-2 rounded-lg p-6 transition-all cursor-pointer ${getStatusBadgeColor(
        step.status
      )}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <motion.div
            animate={step.status === "current" ? pulseAnimation : {}}
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(
              step.status
            )}`}
          >
            {step.status === "completed" ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : step.status === "current" ? (
              <Clock className="w-6 h-6" />
            ) : (
              <span className="font-bold">{index + 1}</span>
            )}
          </motion.div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{step.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Estimé : {step.estimatedDate}
              </span>
              {step.actualDate && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Complété : {step.actualDate}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-blue-600">{step.percentage}%</div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-gray-400 mt-2"
          >
            <ArrowRight className="w-5 h-5" />
          </motion.div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 pt-6 border-t border-gray-300"
          >
            {/* Details List */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Détails de l'étape</h4>
              <ul className="space-y-2">
                {step.details.map((detail, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications pour cette étape
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={step.notifications.email}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Notification Email</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={step.notifications.whatsapp}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Notification WhatsApp</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={step.notifications.sms}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Notification SMS</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Composant : Feed des Mises à Jour en Temps Réel ───
const RealTimeUpdatesFeed = ({ updates }: { updates: RealTimeUpdate[] }) => {
  const getUpdateColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-700";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      case "alert":
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-blue-50 border-blue-200 text-blue-700";
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      variants={fadeInUp}
      viewport={{ once: true }}
      className="space-y-3"
    >
      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <Zap className="w-5 h-5 text-blue-600" />
        Mises à Jour en Temps Réel
      </h3>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {updates.map((update, index) => (
          <motion.div
            key={update.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border-2 flex items-start gap-3 ${getUpdateColor(
              update.type
            )}`}
          >
            <div className="flex-shrink-0 mt-0.5">{update.icon}</div>
            <div className="flex-1">
              <p className="font-semibold">{update.title}</p>
              <p className="text-sm mt-1 opacity-90">{update.message}</p>
              <p className="text-xs mt-2 opacity-75">{update.timestamp}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Composant Principal : RealTimeProgressTracker ───
export default function RealTimeProgressTracker() {
  const [steps, setSteps] = useState<ProgressStep[]>([
    {
      id: "1",
      name: "Évaluation d'Éligibilité",
      description: "Analyse complète de votre profil et de votre éligibilité",
      status: "completed",
      estimatedDate: "01 juillet 2026",
      actualDate: "01 juillet 2026",
      percentage: 100,
      icon: <CheckCircle2 className="w-6 h-6" />,
      details: [
        "Questionnaire d'évaluation complété",
        "Analyse du profil académique",
        "Évaluation des compétences linguistiques",
        "Résultats d'éligibilité communiqués",
      ],
      notifications: { email: true, whatsapp: true, sms: false },
    },
    {
      id: "2",
      name: "Préparation du Bilan",
      description: "Création de votre bilan personnalisé",
      status: "completed",
      estimatedDate: "08 juillet 2026",
      actualDate: "08 juillet 2026",
      percentage: 100,
      icon: <FileText className="w-6 h-6" />,
      details: [
        "Analyse détaillée de votre dossier",
        "Recommandations personnalisées",
        "Stratégie de candidature optimisée",
        "Bilan envoyé par email",
      ],
      notifications: { email: true, whatsapp: true, sms: true },
    },
    {
      id: "3",
      name: "Préparation des Documents",
      description: "Collecte et préparation de tous les documents requis",
      status: "current",
      estimatedDate: "25 juillet 2026",
      percentage: 60,
      icon: <Clock className="w-6 h-6" />,
      details: [
        "Passeport uploadé ✓",
        "CV uploadé ✓",
        "Diplômes en attente",
        "Lettres de recommandation en attente",
        "Certificat de langue en attente",
      ],
      notifications: { email: true, whatsapp: true, sms: false },
    },
    {
      id: "4",
      name: "Traduction & Légalisation",
      description: "Traduction officielle et légalisation des documents",
      status: "pending",
      estimatedDate: "01 août 2026",
      percentage: 0,
      icon: <Shield className="w-6 h-6" />,
      details: [
        "Traduction en anglais/français",
        "Légalisation auprès des autorités",
        "Certification des copies",
        "Vérification finale",
      ],
      notifications: { email: true, whatsapp: false, sms: false },
    },
    {
      id: "5",
      name: "Soumission au Consulat",
      description: "Soumission officielle de votre dossier",
      status: "pending",
      estimatedDate: "10 août 2026",
      percentage: 0,
      icon: <MapPin className="w-6 h-6" />,
      details: [
        "Dossier complet préparé",
        "Vérification finale",
        "Soumission au consulat",
        "Numéro de suivi reçu",
      ],
      notifications: { email: true, whatsapp: true, sms: true },
    },
    {
      id: "6",
      name: "Décision Visa",
      description: "Attente et réception de la décision",
      status: "pending",
      estimatedDate: "15 septembre 2026",
      percentage: 0,
      icon: <TrendingUp className="w-6 h-6" />,
      details: [
        "Suivi du traitement",
        "Entretien consulaire (si requis)",
        "Décision communiquée",
        "Visa émis",
      ],
      notifications: { email: true, whatsapp: true, sms: true },
    },
  ]);

  const updates: RealTimeUpdate[] = [
    {
      id: "1",
      timestamp: "Aujourd'hui à 10:30",
      title: "✓ Documents Vérifiés",
      message: "Votre passeport et CV ont été vérifiés avec succès",
      type: "success",
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      id: "2",
      timestamp: "Aujourd'hui à 09:15",
      title: "⚠️ Documents Manquants",
      message: "Veuillez uploader vos diplômes avant le 15 juillet",
      type: "warning",
      icon: <AlertCircle className="w-5 h-5" />,
    },
    {
      id: "3",
      timestamp: "Hier à 16:45",
      title: "ℹ️ Mise à Jour de Statut",
      message: "Votre dossier est passé à l'étape 'Préparation des Documents'",
      type: "info",
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: "4",
      timestamp: "Il y a 2 jours",
      title: "✓ Bilan Reçu",
      message: "Votre bilan personnalisé a été envoyé à votre email",
      type: "success",
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
  ];

  const overallProgress = Math.round(
    steps.reduce((sum, step) => sum + step.percentage, 0) / steps.length
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900">
              Suivi en Temps Réel de Votre Dossier
            </h1>
            <p className="text-gray-600 mt-1">
              Dossier 3M-2026-0042 • Canada • Résidence Permanente
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={0}
            className="md:col-span-1 flex justify-center"
          >
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <CircularProgress percentage={overallProgress} />
              <p className="text-center text-sm text-gray-600 mt-4">
                Progression globale
              </p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={1}
            className="md:col-span-2 bg-white rounded-xl p-8 shadow-sm border border-gray-200"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Résumé de Votre Parcours
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">Étapes Complétées</span>
                <span className="font-bold text-green-600">2 / 6</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-700">Étape Actuelle</span>
                <span className="font-bold text-blue-600">Préparation des Documents</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-gray-700">Étapes Restantes</span>
                <span className="font-bold text-yellow-600">4 / 6</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-700">Délai Estimé</span>
                <span className="font-bold text-purple-600">50 jours</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Steps Timeline */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={2}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Étapes de Votre Dossier
          </h2>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <StepCard key={step.id} step={step} index={index} />
            ))}
          </div>
        </motion.div>

        {/* Real-time Updates */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <RealTimeUpdatesFeed updates={updates} />
          </div>

          {/* Quick Actions */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={fadeInUp}
            viewport={{ once: true }}
            custom={3}
            className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 text-white"
          >
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Actions Rapides
            </h3>
            <div className="space-y-3">
              <Button className="w-full bg-white text-blue-600 hover:bg-gray-100 justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Uploader Documents
              </Button>
              <Button className="w-full bg-white text-blue-600 hover:bg-gray-100 justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Prendre RDV
              </Button>
              <Button className="w-full bg-white text-blue-600 hover:bg-gray-100 justify-start">
                <Users className="w-4 h-4 mr-2" />
                Contacter Support
              </Button>
              <Button className="w-full bg-white text-blue-600 hover:bg-gray-100 justify-start">
                <Share2 className="w-4 h-4 mr-2" />
                Partager Dossier
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
