import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  FileText,
  TrendingUp,
  Bell,
  ArrowRight,
  MapPin,
  Zap,
  Shield,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DossierData {
  dossierNumber: string;
  clientName: string;
  destination: string;
  visaType: string;
  status: string;
  progressPercentage: number;
  estimatedCompletionDate: string;
  currentStep: number;
  totalSteps: number;
}

interface DocumentChecklistItem {
  id: string;
  name: string;
  status: "required" | "optional";
  completed: boolean;
  uploadedDate?: string;
  verified: boolean;
  notes?: string;
}

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  status: "completed" | "current" | "upcoming";
  description: string;
  icon: React.ReactNode;
}

interface NextStep {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  action: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

// ─── Composant : Barre de Progression Animée ───
const ProgressBar = ({ percentage }: { percentage: number }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Progression du dossier</span>
        <span className="text-sm font-bold text-blue-600">{percentage}%</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// ─── Composant : Statut Visa en Temps Réel ───
const StatusCard = ({ dossier }: { dossier: DossierData }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approuve":
        return "bg-green-50 border-green-200";
      case "refuse":
        return "bg-red-50 border-red-200";
      case "en_cours":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-yellow-50 border-yellow-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approuve":
        return <CheckCircle2 className="w-8 h-8 text-green-600" />;
      case "refuse":
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      case "en_cours":
        return <Clock className="w-8 h-8 text-blue-600" />;
      default:
        return <Zap className="w-8 h-8 text-yellow-600" />;
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={scaleIn}
      custom={0}
      className={`rounded-xl p-6 border-2 ${getStatusColor(dossier.status)}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Statut du Dossier</h3>
          <p className="text-2xl font-bold text-gray-900 capitalize">
            {dossier.status.replace(/_/g, " ")}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Étape {dossier.currentStep} sur {dossier.totalSteps}
          </p>
        </div>
        {getStatusIcon(dossier.status)}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          Estimation de fin : <strong>{dossier.estimatedCompletionDate}</strong>
        </p>
      </div>
    </motion.div>
  );
};

// ─── Composant : Timeline Interactive ───
const DossierTimeline = ({ events }: { events: TimelineEvent[] }) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      variants={fadeInUp}
      viewport={{ once: true }}
      className="space-y-6"
    >
      <h3 className="text-lg font-bold text-gray-900">Historique du Dossier</h3>
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  event.status === "completed"
                    ? "bg-green-100 text-green-600"
                    : event.status === "current"
                    ? "bg-blue-100 text-blue-600 ring-2 ring-blue-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {event.icon}
              </motion.div>
              {index < events.length - 1 && (
                <div
                  className={`w-1 h-16 mt-2 ${
                    event.status === "completed" ? "bg-green-200" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{event.title}</h4>
                <span className="text-xs text-gray-500">{event.date}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Composant : Checklist Documents ───
const DocumentsChecklist = ({ documents }: { documents: DocumentChecklistItem[] }) => {
  const completedCount = documents.filter((d) => d.completed).length;
  const requiredCount = documents.filter((d) => d.status === "required").length;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      variants={fadeInUp}
      viewport={{ once: true }}
      custom={1}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Documents Requis</h3>
        <span className="text-sm font-semibold text-blue-600">
          {completedCount}/{requiredCount} complétés
        </span>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-3 rounded-lg border-2 flex items-center gap-3 ${
              doc.completed
                ? "bg-green-50 border-green-200"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex-shrink-0">
              {doc.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <FileText className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{doc.name}</p>
              {doc.uploadedDate && (
                <p className="text-xs text-gray-600">Uploadé : {doc.uploadedDate}</p>
              )}
              {doc.notes && <p className="text-xs text-yellow-600 mt-1">⚠️ {doc.notes}</p>}
            </div>
            {doc.verified && (
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Composant : Prochaines Étapes ───
const NextStepsCard = ({ steps }: { steps: NextStep[] }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      variants={fadeInUp}
      viewport={{ once: true }}
      custom={2}
      className="space-y-4"
    >
      <h3 className="text-lg font-bold text-gray-900">Prochaines Étapes</h3>
      <div className="space-y-3">
        {steps.map((step) => (
          <motion.div
            key={step.id}
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900">{step.title}</h4>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${getPriorityColor(step.priority)}`}>
                {step.priority.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{step.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                À faire avant : {step.dueDate}
              </span>
              <Button size="sm" variant="outline" className="gap-1">
                {step.action}
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Composant : Rappels Automatiques ───
const ReminderNotifications = () => {
  const [reminders, setReminders] = useState([
    {
      id: "1",
      type: "document",
      message: "Veuillez uploader votre passeport avant le 15 juillet",
      priority: "high",
      read: false,
    },
    {
      id: "2",
      type: "appointment",
      message: "Rendez-vous prévu demain à 14h00 avec votre conseiller",
      priority: "medium",
      read: false,
    },
    {
      id: "3",
      type: "update",
      message: "Votre dossier a été mis à jour. Consultez les détails.",
      priority: "low",
      read: true,
    },
  ]);

  const dismissReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      variants={fadeInUp}
      viewport={{ once: true }}
      custom={3}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Rappels</h3>
        {reminders.filter((r) => !r.read).length > 0 && (
          <span className="ml-auto text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">
            {reminders.filter((r) => !r.read).length} nouveau
          </span>
        )}
      </div>

      <div className="space-y-2">
        {reminders.map((reminder) => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-lg border-l-4 flex items-start justify-between ${
              reminder.priority === "high"
                ? "bg-red-50 border-red-500"
                : reminder.priority === "medium"
                ? "bg-yellow-50 border-yellow-500"
                : "bg-blue-50 border-blue-500"
            }`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{reminder.message}</p>
            </div>
            <button
              onClick={() => dismissReminder(reminder.id)}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Composant Principal : PersonalizedDashboard ───
export default function PersonalizedDashboard() {
  const dossier: DossierData = {
    dossierNumber: "3M-2026-0042",
    clientName: "Alain Fouda",
    destination: "Canada",
    visaType: "Résidence Permanente",
    status: "en_cours",
    progressPercentage: 45,
    estimatedCompletionDate: "15 septembre 2026",
    currentStep: 3,
    totalSteps: 5,
  };

  const timelineEvents: TimelineEvent[] = [
    {
      id: "1",
      title: "Évaluation Complétée",
      date: "01 juillet 2026",
      status: "completed",
      description: "Évaluation d'éligibilité approuvée",
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      id: "2",
      title: "Bilan Reçu",
      date: "08 juillet 2026",
      status: "completed",
      description: "Bilan personnalisé envoyé par email",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: "3",
      title: "Préparation Documents",
      date: "Aujourd'hui",
      status: "current",
      description: "En cours de préparation des documents",
      icon: <Clock className="w-5 h-5" />,
    },
    {
      id: "4",
      title: "Soumission Consulat",
      date: "25 juillet 2026",
      status: "upcoming",
      description: "Soumission prévue au consulat",
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      id: "5",
      title: "Décision Visa",
      date: "15 septembre 2026",
      status: "upcoming",
      description: "Réception de la décision",
      icon: <TrendingUp className="w-5 h-5" />,
    },
  ];

  const documents: DocumentChecklistItem[] = [
    {
      id: "1",
      name: "Passeport",
      status: "required",
      completed: true,
      uploadedDate: "05 juillet 2026",
      verified: true,
    },
    {
      id: "2",
      name: "CV",
      status: "required",
      completed: true,
      uploadedDate: "05 juillet 2026",
      verified: true,
    },
    {
      id: "3",
      name: "Diplômes",
      status: "required",
      completed: false,
      verified: false,
      notes: "À uploader avant le 15 juillet",
    },
    {
      id: "4",
      name: "Lettre de Motivation",
      status: "required",
      completed: false,
      verified: false,
    },
    {
      id: "5",
      name: "Références Professionnelles",
      status: "optional",
      completed: false,
      verified: false,
    },
  ];

  const nextSteps: NextStep[] = [
    {
      id: "1",
      title: "Uploader Diplômes",
      description: "Veuillez uploader vos diplômes et relevés de notes",
      dueDate: "15 juillet 2026",
      priority: "high",
      action: "Uploader",
    },
    {
      id: "2",
      title: "Confirmer Rendez-vous",
      description: "Confirmer votre rendez-vous de consultation",
      dueDate: "12 juillet 2026",
      priority: "medium",
      action: "Confirmer",
    },
    {
      id: "3",
      title: "Payer Frais Agence",
      description: "Effectuer le paiement des frais de service",
      dueDate: "20 juillet 2026",
      priority: "high",
      action: "Payer",
    },
  ];

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
              Bienvenue, {dossier.clientName}
            </h1>
            <p className="text-gray-600 mt-1">
              Dossier {dossier.dossierNumber} • {dossier.destination} • {dossier.visaType}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Section */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={0}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8"
        >
          <ProgressBar percentage={dossier.progressPercentage} />
        </motion.div>

        {/* Status & Timeline Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            <StatusCard dossier={dossier} />
          </div>
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <DossierTimeline events={timelineEvents} />
          </div>
        </div>

        {/* Documents & Next Steps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <DocumentsChecklist documents={documents} />
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <NextStepsCard steps={nextSteps} />
          </div>
        </div>

        {/* Reminders */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <ReminderNotifications />
        </div>

        {/* Support Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={fadeInUp}
          viewport={{ once: true }}
          custom={4}
          className="mt-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Besoin d'Aide ?</h3>
              <p className="text-blue-100">
                Notre équipe de support est disponible 24/7 pour répondre à vos questions
              </p>
            </div>
            <div className="flex gap-3">
              <Button className="bg-white text-blue-600 hover:bg-gray-100">
                <Users className="w-4 h-4 mr-2" />
                Chat Support
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
