import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface InterviewQuestionsProps {
  candidate: {
    fullName: string;
    destination: string;
    visaType: string;
  };
  aiSummary?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    overallAssessment: string;
  };
}

interface Question {
  id: number;
  question: string;
  category: "strength" | "development" | "motivation";
  icon: string;
}

export function InterviewQuestions({ candidate, aiSummary }: InterviewQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const generateQuestions = async () => {
    setIsGenerating(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const generatedQuestions: Question[] = [
        {
          id: 1,
          question: `Parlez-nous de votre expérience avec ${aiSummary?.strengths[0] || "votre domaine de compétence"}. Comment avez-vous développé cette expertise et comment l'appliquerez-vous dans votre projet vers ${candidate.destination} ?`,
          category: "strength",
          icon: "⭐",
        },
        {
          id: 2,
          question: `Vous avez mentionné ${aiSummary?.weaknesses[0] || "un domaine"} comme point à améliorer. Quels sont vos plans concrets pour renforcer cette compétence avant de débuter votre ${candidate.visaType} ?`,
          category: "development",
          icon: "🎯",
        },
        {
          id: 3,
          question: `Qu'est-ce qui vous motive particulièrement à poursuivre votre projet vers ${candidate.destination} ? Comment voyez-vous cette opportunité contribuer à votre développement personnel et professionnel ?`,
          category: "motivation",
          icon: "🚀",
        },
      ];

      setQuestions(generatedQuestions);
    } catch (error) {
      console.error("Erreur lors de la génération des questions", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyQuestion = async (question: string, id: number) => {
    await navigator.clipboard.writeText(question);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categoryLabels = {
    strength: "Basée sur les forces",
    development: "Amélioration continue",
    motivation: "Motivation & Projet",
  };

  const categoryColors = {
    strength: "bg-green-50 border-green-200",
    development: "bg-blue-50 border-blue-200",
    motivation: "bg-purple-50 border-purple-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <Label className="text-lg font-semibold">Questions d'Entretien Générées par l'IA</Label>
        </div>
        <Button
          onClick={generateQuestions}
          disabled={isGenerating}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              {questions.length > 0 ? "Régénérer" : "Générer"}
            </>
          )}
        </Button>
      </div>

      {questions.length === 0 && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300"
        >
          <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">
            Cliquez sur "Générer" pour créer 3 questions d'entretien personnalisées
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Les questions seront basées sur le profil et les compétences du candidat
          </p>
        </motion.div>
      )}

      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 py-8"
        >
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Génération des questions en cours...</p>
        </motion.div>
      )}

      <motion.div
        layout
        className="space-y-3"
      >
        {questions.map((q, index) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`p-4 border-2 ${categoryColors[q.category]}`}>
              <div className="flex gap-3">
                <div className="text-2xl flex-shrink-0">{q.icon}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      q.category === "strength"
                        ? "bg-green-200 text-green-800"
                        : q.category === "development"
                          ? "bg-blue-200 text-blue-800"
                          : "bg-purple-200 text-purple-800"
                    }`}>
                      {categoryLabels[q.category]}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyQuestion(q.question, q.id)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedId === q.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed">{q.question}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800"
        >
          <p className="font-semibold mb-1">💡 Conseil pour l'entretien :</p>
          <p>
            Ces questions sont conçues pour explorer les points forts du candidat, identifier les domaines de
            développement et comprendre sa motivation. Adaptez-les selon le contexte de l'entretien.
          </p>
        </motion.div>
      )}
    </div>
  );
}
