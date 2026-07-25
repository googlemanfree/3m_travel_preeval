import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader,
  Zap,
  Brain,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Candidate {
  fullName: string;
  scoringTotal: number;
  scoringBadge: "excellent" | "bon" | "moyen" | "faible";
  destination: string;
  visaType: string;
  educationLevel?: string;
  experienceYears?: number;
  languageSkills?: string;
}

interface AISummaryProps {
  candidate: Candidate;
}

interface Summary {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overallAssessment: string;
  compatibilityScore: number;
}

export function AISummary({ candidate }: AISummaryProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateSummary();
  }, [candidate.fullName]);

  const generateSummary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simuler un appel API pour générer le résumé
      // En production, cela appellerait un endpoint tRPC
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockSummary: Summary = {
        strengths: [
          `Score académique excellent (${candidate.scoringTotal}/100)`,
          `Destination ${candidate.destination} bien adaptée au profil`,
          `Type de visa ${candidate.visaType} cohérent avec les objectifs`,
          `Niveau d'éducation: ${candidate.educationLevel || "Non spécifié"}`,
          `Expérience professionnelle: ${candidate.experienceYears || 0} ans`,
        ],
        weaknesses: [
          candidate.scoringTotal < 50
            ? "Score global à améliorer"
            : "Aucune faiblesse majeure détectée",
          candidate.languageSkills === "debutant"
            ? "Compétences linguistiques à développer"
            : "",
        ].filter(Boolean),
        recommendations: [
          "Préparer les documents de candidature selon les normes du pays",
          "Améliorer les compétences linguistiques si nécessaire",
          "Consulter les ressources spécifiques au pays de destination",
          "Planifier une évaluation approfondie avant soumission",
          "Préparer un budget estimé pour les frais officiels",
        ],
        overallAssessment: `${candidate.fullName} présente un profil ${candidate.scoringBadge === "excellent" ? "excellent" : candidate.scoringBadge === "bon" ? "solide" : candidate.scoringBadge === "moyen" ? "acceptable" : "à améliorer"} pour une candidature vers ${candidate.destination}. Le candidat devrait procéder avec confiance mais en veillant à respecter tous les critères spécifiques du pays.`,
        compatibilityScore: Math.min(
          100,
          candidate.scoringTotal +
            (candidate.experienceYears ? Math.min(20, candidate.experienceYears * 2) : 0)
        ),
      };

      setSummary(mockSummary);
    } catch (err) {
      setError("Erreur lors de la génération du résumé IA");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200"
      >
        <div className="flex items-center justify-center gap-3">
          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-blue-700 font-medium">
            Génération du résumé IA en cours...
          </p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-50 rounded-lg p-6 border border-red-200"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={generateSummary}
              className="mt-3"
            >
              Réessayer
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!summary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header avec IA Badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          <Sparkles className="w-4 h-4" />
          Résumé généré par IA
        </div>
      </div>

      {/* Évaluation générale */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">
              Évaluation générale
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {summary.overallAssessment}
            </p>
          </div>
        </div>
      </Card>

      {/* Score de compatibilité */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Score de compatibilité</h3>
            <Target className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${summary.compatibilityScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {summary.compatibilityScore}%
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Basé sur le score, l'expérience et le profil
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Classification</h3>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Profil</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  candidate.scoringBadge === "excellent"
                    ? "bg-green-100 text-green-800"
                    : candidate.scoringBadge === "bon"
                      ? "bg-blue-100 text-blue-800"
                      : candidate.scoringBadge === "moyen"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                }`}
              >
                {candidate.scoringBadge}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Destination</span>
              <span className="text-sm font-semibold text-gray-900">
                {candidate.destination}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Points forts */}
      <Card className="border-green-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Points forts</h3>
        </div>
        <ul className="space-y-2">
          {summary.strengths.map((strength, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start gap-3 text-gray-700"
            >
              <span className="text-green-600 font-bold mt-1">✓</span>
              <span>{strength}</span>
            </motion.li>
          ))}
        </ul>
      </Card>

      {/* Points à améliorer */}
      {summary.weaknesses.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-900">Points à améliorer</h3>
          </div>
          <ul className="space-y-2">
            {summary.weaknesses.map((weakness, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 text-gray-700"
              >
                <span className="text-yellow-600 font-bold mt-1">!</span>
                <span>{weakness}</span>
              </motion.li>
            ))}
          </ul>
        </Card>
      )}

      {/* Recommandations */}
      <Card className="border-blue-200 bg-blue-50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Recommandations</h3>
        </div>
        <ul className="space-y-2">
          {summary.recommendations.map((rec, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start gap-3 text-gray-700"
            >
              <span className="text-blue-600 font-bold mt-1">{idx + 1}.</span>
              <span>{rec}</span>
            </motion.li>
          ))}
        </ul>
      </Card>

      {/* Bouton de régénération */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={generateSummary}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Régénérer le résumé
        </Button>
      </div>
    </motion.div>
  );
}
