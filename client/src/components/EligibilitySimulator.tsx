import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Question {
  id: string;
  question: string;
  type: "select" | "radio" | "text" | "number";
  options?: { value: string; label: string }[];
  category: string;
  weight: number;
}

interface EligibilityResult {
  score: number;
  badge: "eligible" | "admissible" | "faible";
  recommendation: string;
  details: {
    category: string;
    score: number;
    feedback: string;
  }[];
  estimatedCost: number;
  estimatedDuration: number;
  nextSteps: string[];
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

// ─── Composant : Barre de Progression du Questionnaire ───
const QuestionnaireProgress = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => {
  const percentage = (current / total) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Question {current} sur {total}
        </span>
        <span className="text-sm font-bold text-blue-600">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

// ─── Composant : Carte de Résultat ───
const ResultCard = ({ result }: { result: EligibilityResult }) => {
  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "eligible":
        return "bg-green-100 text-green-700 border-green-300";
      case "admissible":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "faible":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getBadgeLabel = (badge: string) => {
    switch (badge) {
      case "eligible":
        return "✓ Hautement Éligible";
      case "admissible":
        return "⚠️ Admissible";
      case "faible":
        return "✗ Faible Éligibilité";
      default:
        return "Évaluation";
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={scaleIn}
      className="space-y-6"
    >
      {/* Score Principal */}
      <div className={`rounded-xl p-8 border-2 ${getBadgeColor(result.badge)}`}>
        <div className="text-center">
          <p className="text-sm font-semibold opacity-75 mb-2">Votre Score d'Éligibilité</p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-6xl font-bold mb-4"
          >
            {result.score}
            <span className="text-2xl">/100</span>
          </motion.div>
          <p className="text-lg font-bold">{getBadgeLabel(result.badge)}</p>
        </div>
      </div>

      {/* Recommandation */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-900 mb-2">Recommandation</h3>
            <p className="text-blue-800">{result.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Détails par Catégorie */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900">Analyse Détaillée</h3>
        {result.details.map((detail, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">{detail.category}</span>
              <span className="text-lg font-bold text-blue-600">{detail.score}/100</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${detail.score}%` }}
                transition={{ delay: 0.3 + index * 0.1 }}
              />
            </div>
            <p className="text-sm text-gray-600">{detail.feedback}</p>
          </motion.div>
        ))}
      </div>

      {/* Informations Pratiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={0}
          className="p-4 bg-white rounded-lg border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Coût Estimé</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {result.estimatedCost.toLocaleString()} XAF
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={1}
          className="p-4 bg-white rounded-lg border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Délai Estimé</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {result.estimatedDuration} jours
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={2}
          className="p-4 bg-white rounded-lg border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">Taux de Succès</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {result.badge === "eligible" ? "98%" : result.badge === "admissible" ? "75%" : "45%"}
          </p>
        </motion.div>
      </div>

      {/* Prochaines Étapes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Prochaines Étapes</h3>
        <ol className="space-y-3">
          {result.nextSteps.map((step, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <span className="text-gray-700 pt-0.5">{step}</span>
            </motion.li>
          ))}
        </ol>
      </div>

      {/* CTA */}
      <div className="flex gap-3">
        <Button className="flex-1 gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Commencer Mon Dossier
        </Button>
        <Button variant="outline" className="flex-1 gap-2">
          <Calendar className="w-4 h-4" />
          Prendre RDV
        </Button>
      </div>
    </motion.div>
  );
};

// ─── Composant Principal : EligibilitySimulator ───
export default function EligibilitySimulator() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const questions: Question[] = [
    {
      id: "destination",
      question: "Quelle est votre destination souhaitée?",
      type: "select",
      options: [
        { value: "canada", label: "Canada" },
        { value: "france", label: "France" },
        { value: "allemagne", label: "Allemagne" },
        { value: "uk", label: "Royaume-Uni" },
        { value: "autre", label: "Autre" },
      ],
      category: "Destination",
      weight: 1,
    },
    {
      id: "visaType",
      question: "Quel type de visa vous intéresse?",
      type: "radio",
      options: [
        { value: "etude", label: "Études" },
        { value: "travail", label: "Travail" },
        { value: "tourisme", label: "Tourisme" },
        { value: "residence", label: "Résidence Permanente" },
      ],
      category: "Type de Visa",
      weight: 1,
    },
    {
      id: "education",
      question: "Quel est votre niveau d'études?",
      type: "select",
      options: [
        { value: "bac", label: "Baccalauréat" },
        { value: "licence", label: "Licence" },
        { value: "master", label: "Master" },
        { value: "doctorat", label: "Doctorat" },
      ],
      category: "Éducation",
      weight: 2,
    },
    {
      id: "experience",
      question: "Combien d'années d'expérience professionnelle avez-vous?",
      type: "number",
      category: "Expérience",
      weight: 2,
    },
    {
      id: "language",
      question: "Quel est votre niveau de langue (anglais/français)?",
      type: "select",
      options: [
        { value: "debutant", label: "Débutant" },
        { value: "intermediaire", label: "Intermédiaire" },
        { value: "avance", label: "Avancé" },
        { value: "bilingue", label: "Bilingue" },
      ],
      category: "Langue",
      weight: 2,
    },
    {
      id: "financial",
      question: "Disposez-vous de ressources financières suffisantes?",
      type: "radio",
      options: [
        { value: "oui", label: "Oui, j'ai les ressources" },
        { value: "partiellement", label: "Partiellement" },
        { value: "non", label: "Non" },
      ],
      category: "Ressources Financières",
      weight: 2,
    },
    {
      id: "urgency",
      question: "Quel est votre délai de départ souhaité?",
      type: "select",
      options: [
        { value: "urgent", label: "Moins de 3 mois" },
        { value: "moyen", label: "3-6 mois" },
        { value: "flexible", label: "Plus de 6 mois" },
      ],
      category: "Urgence",
      weight: 1,
    },
    {
      id: "documents",
      question: "Avez-vous déjà préparé vos documents?",
      type: "radio",
      options: [
        { value: "oui", label: "Oui, tout est prêt" },
        { value: "partiellement", label: "Partiellement" },
        { value: "non", label: "Non, j'ai besoin d'aide" },
      ],
      category: "Documents",
      weight: 1,
    },
  ];

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [questions[currentQuestion].id]: value };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateResults = (): EligibilityResult => {
    let totalScore = 0;
    let totalWeight = 0;
    const details = [];

    // Scoring logic
    const educationScore =
      answers.education === "doctorat"
        ? 100
        : answers.education === "master"
        ? 85
        : answers.education === "licence"
        ? 70
        : 50;

    const experienceScore = Math.min(
      100,
      (parseInt(answers.experience || "0") / 10) * 100
    );

    const languageScore =
      answers.language === "bilingue"
        ? 100
        : answers.language === "avance"
        ? 85
        : answers.language === "intermediaire"
        ? 60
        : 30;

    const financialScore =
      answers.financial === "oui" ? 100 : answers.financial === "partiellement" ? 60 : 20;

    const documentScore =
      answers.documents === "oui" ? 100 : answers.documents === "partiellement" ? 60 : 30;

    details.push({
      category: "Éducation",
      score: educationScore,
      feedback:
        educationScore >= 80
          ? "Excellent profil académique"
          : "Profil académique acceptable",
    });

    details.push({
      category: "Expérience",
      score: experienceScore,
      feedback:
        experienceScore >= 80
          ? "Expérience très solide"
          : "Expérience suffisante",
    });

    details.push({
      category: "Langue",
      score: languageScore,
      feedback:
        languageScore >= 80
          ? "Maîtrise excellente"
          : "Niveau acceptable",
    });

    details.push({
      category: "Ressources",
      score: financialScore,
      feedback:
        financialScore >= 80
          ? "Ressources suffisantes"
          : "Ressources limitées",
    });

    details.push({
      category: "Documents",
      score: documentScore,
      feedback:
        documentScore >= 80
          ? "Dossier bien préparé"
          : "Dossier à compléter",
    });

    const avgScore = Math.round(
      (educationScore + experienceScore + languageScore + financialScore + documentScore) / 5
    );

    const badge =
      avgScore >= 80 ? "eligible" : avgScore >= 60 ? "admissible" : "faible";

    return {
      score: avgScore,
      badge,
      recommendation:
        badge === "eligible"
          ? "Vous avez un excellent profil! Nous recommandons de commencer votre dossier immédiatement."
          : badge === "admissible"
          ? "Votre profil est admissible. Nous pouvons vous aider à renforcer certains aspects."
          : "Votre profil nécessite une préparation supplémentaire. Consultez-nous pour un plan d'action.",
      details,
      estimatedCost: 65000,
      estimatedDuration: 90,
      nextSteps: [
        "Prendre un rendez-vous de consultation",
        "Préparer vos documents officiels",
        "Effectuer le paiement des frais",
        "Soumettre votre dossier complet",
        "Suivre votre demande en temps réel",
      ],
    };
  };

  const result = calculateResults();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900">
              Simulateur d'Éligibilité
            </h1>
            <p className="text-gray-600 mt-1">
              Évaluez votre éligibilité en moins de 5 minutes
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="questionnaire"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-200"
            >
              <QuestionnaireProgress
                current={currentQuestion + 1}
                total={questions.length}
              />

              <motion.div
                key={questions[currentQuestion].id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {questions[currentQuestion].question}
                  </h2>
                  <p className="text-sm text-gray-600 mt-2">
                    {questions[currentQuestion].category}
                  </p>
                </div>

                <div className="space-y-3">
                  {questions[currentQuestion].type === "select" ||
                  questions[currentQuestion].type === "radio" ? (
                    questions[currentQuestion].options?.map((option) => (
                      <motion.button
                        key={option.value}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => handleAnswer(option.value)}
                        className="w-full p-4 text-left rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                      >
                        <span className="font-medium text-gray-900">
                          {option.label}
                        </span>
                      </motion.button>
                    ))
                  ) : (
                    <input
                      type="number"
                      placeholder="Entrez votre réponse"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAnswer(e.currentTarget.value);
                        }
                      }}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    disabled={currentQuestion === 0}
                    onClick={() => setCurrentQuestion(currentQuestion - 1)}
                  >
                    Précédent
                  </Button>
                  <Button
                    disabled={!answers[questions[currentQuestion].id]}
                    onClick={() =>
                      handleAnswer(
                        answers[questions[currentQuestion].id] || ""
                      )
                    }
                    className="flex-1 gap-2"
                  >
                    {currentQuestion === questions.length - 1
                      ? "Voir Résultats"
                      : "Suivant"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-200"
            >
              <ResultCard result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
