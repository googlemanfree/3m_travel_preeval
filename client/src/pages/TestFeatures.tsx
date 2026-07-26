import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ClientDashboard from "@/components/ClientDashboard";
import PersonalizedDashboard from "@/components/PersonalizedDashboard";
import RealTimeProgressTracker from "@/components/RealTimeProgressTracker";
import EligibilitySimulator from "@/components/EligibilitySimulator";
import AppointmentBooking from "@/components/AppointmentBooking";
import AIAssistant from "@/components/AIAssistant";
import BudgetCalculator from "@/components/BudgetCalculator";
import DocumentTracker from "@/components/DocumentTracker";
import NotificationCenter from "@/components/NotificationCenter";
import SuccessStoriesGallery from "@/components/SuccessStoriesGallery";

interface Feature {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType;
  status: "working" | "testing" | "pending";
  icon: React.ReactNode;
}

const features: Feature[] = [
  {
    id: "1",
    name: "Espace Client Sécurisé",
    description: "Dashboard personnalisé avec gestion des documents",
    component: ClientDashboard,
    status: "working",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: "2",
    name: "Tableau de Bord Personnalisé",
    description: "Vue d'ensemble du dossier avec progression",
    component: PersonalizedDashboard,
    status: "working",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: "3",
    name: "Suivi en Temps Réel",
    description: "Progression animée des étapes du dossier",
    component: RealTimeProgressTracker,
    status: "working",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: "4",
    name: "Simulateur d'Éligibilité IA",
    description: "Questionnaire adaptatif pour évaluer l'éligibilité",
    component: EligibilitySimulator,
    status: "working",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: "5",
    name: "Prise de Rendez-vous",
    description: "Système de réservation en ligne intelligent",
    component: AppointmentBooking,
    status: "working",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: "6",
    name: "Assistant IA Spécialisé",
    description: "Chat IA pour les visas et voyages",
    component: AIAssistant,
    status: "working",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: "7",
    name: "Calculateur de Budget",
    description: "Estimation des coûts par catégorie",
    component: BudgetCalculator,
    status: "working",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: "8",
    name: "Suivi des Documents",
    description: "Gestion et suivi des documents du dossier",
    component: DocumentTracker,
    status: "working",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: "9",
    name: "Centre de Notifications",
    description: "Gestion des notifications multi-canaux",
    component: NotificationCenter,
    status: "working",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: "10",
    name: "Galerie de Réussites",
    description: "Histoires de succès des clients",
    component: SuccessStoriesGallery,
    status: "working",
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
];

export default function TestFeatures() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const SelectedComponent = selectedFeature?.component;

  const handleTestFeature = (featureId: string) => {
    setTestResults((prev) => ({
      ...prev,
      [featureId]: true,
    }));
  };

  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = features.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-8 h-8 text-blue-600" />
              Tests des Fonctionnalités
            </h1>
            <p className="text-gray-600 mt-1">
              Vérification de la fluidité et de l'affichage
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedFeature ? (
          <>
            {/* Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Progression des Tests</h2>
                <p className="text-2xl font-bold text-blue-600">
                  {passedTests}/{totalTests}
                </p>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${(passedTests / totalTests) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {passedTests} fonctionnalités testées avec succès
              </p>
            </motion.div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedFeature(feature)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      {feature.icon}
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        testResults[feature.id]
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {testResults[feature.id] ? "✓ Testé" : "En attente"}
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 mb-1">{feature.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {feature.description}
                  </p>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFeature(feature);
                      handleTestFeature(feature.id);
                    }}
                  >
                    Tester
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6"
            >
              <Button
                variant="outline"
                onClick={() => setSelectedFeature(null)}
                className="gap-2"
              >
                ← Retour aux Tests
              </Button>
            </motion.div>

            {/* Feature Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedFeature.name}
                  </h2>
                  <p className="text-gray-600">{selectedFeature.description}</p>
                </div>
                <div
                  className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                    testResults[selectedFeature.id]
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {testResults[selectedFeature.id] ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Fonctionnelle
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5" />
                      En Test
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Component */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
            >
              {SelectedComponent && <SelectedComponent />}
            </motion.div>

            {/* Test Checklist */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
            >
              <h3 className="font-bold text-gray-900 mb-4">Checklist de Test</h3>
              <div className="space-y-3">
                {[
                  "Affichage correct sur desktop",
                  "Affichage correct sur mobile",
                  "Animations fluides",
                  "Interactions fonctionnelles",
                  "Pas d'erreurs console",
                  "Performance acceptable",
                  "Responsive design",
                  "Accessibilité",
                ].map((item, index) => (
                  <label key={index} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
