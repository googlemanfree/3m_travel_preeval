import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Home,
  Utensils,
  Plane,
  BookOpen,
  Heart,
  ShoppingCart,
  Download,
  Share2,
  Calculator,
  AlertCircle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface BudgetItem {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  defaultAmount: number;
  description: string;
  currency: string;
}

interface BudgetSummary {
  total: number;
  byCategory: Record<string, number>;
  monthlyAmount: number;
  yearlyAmount: number;
  savings: number;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: i * 0.05 },
  }),
};

// ─── Composant : Carte de Catégorie ───
const BudgetCategoryCard = ({
  category,
  items,
  amounts,
  onAmountChange,
  index,
}: {
  category: string;
  items: BudgetItem[];
  amounts: Record<string, number>;
  onAmountChange: (id: string, amount: number) => void;
  index: number;
}) => {
  const categoryTotal = items.reduce((sum, item) => sum + (amounts[item.id] || item.defaultAmount), 0);

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      accommodation: "from-blue-500 to-blue-600",
      food: "from-orange-500 to-orange-600",
      transport: "from-green-500 to-green-600",
      education: "from-purple-500 to-purple-600",
      health: "from-red-500 to-red-600",
      shopping: "from-pink-500 to-pink-600",
      visa: "from-indigo-500 to-indigo-600",
    };
    return colors[cat] || "from-gray-500 to-gray-600";
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      custom={index}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${getCategoryColor(category)} text-white p-4`}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{category}</h3>
          <p className="text-2xl font-bold">{categoryTotal.toLocaleString()} XAF</p>
        </div>
      </div>

      {/* Items */}
      <div className="p-4 space-y-4">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial="hidden"
            animate="visible"
            variants={slideIn}
            custom={i}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
              <p className="text-xs text-gray-600">{item.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amounts[item.id] || item.defaultAmount}
                onChange={(e) => onAmountChange(item.id, parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600 w-8">XAF</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// ─── Composant : Résumé du Budget ───
const BudgetSummaryCard = ({ summary }: { summary: BudgetSummary }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl p-8 shadow-lg"
    >
      <div className="space-y-6">
        {/* Total */}
        <div>
          <p className="text-blue-100 text-sm font-semibold mb-2">Budget Total</p>
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold"
          >
            {summary.total.toLocaleString()}
            <span className="text-2xl ml-2">XAF</span>
          </motion.p>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-blue-100 text-xs mb-1">Par Mois</p>
            <p className="text-2xl font-bold">{summary.monthlyAmount.toLocaleString()}</p>
            <p className="text-xs text-blue-100 mt-1">XAF/mois</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-blue-100 text-xs mb-1">Par Année</p>
            <p className="text-2xl font-bold">{summary.yearlyAmount.toLocaleString()}</p>
            <p className="text-xs text-blue-100 mt-1">XAF/an</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-blue-100 text-xs mb-1">Épargne Requise</p>
            <p className="text-2xl font-bold">{summary.savings.toLocaleString()}</p>
            <p className="text-xs text-blue-100 mt-1">XAF</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button className="flex-1 gap-2 bg-white text-blue-600 hover:bg-gray-100">
            <Download className="w-4 h-4" />
            Télécharger PDF
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 border-white text-white hover:bg-white/10"
          >
            <Share2 className="w-4 h-4" />
            Partager
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Composant : Graphique de Répartition ───
const BudgetChart = ({ summary }: { summary: BudgetSummary }) => {
  const entries = Object.entries(summary.byCategory).sort(([, a], [, b]) => b - a);
  const maxAmount = Math.max(...entries.map(([, amount]) => amount));

  const categoryColors: Record<string, string> = {
    accommodation: "bg-blue-500",
    food: "bg-orange-500",
    transport: "bg-green-500",
    education: "bg-purple-500",
    health: "bg-red-500",
    shopping: "bg-pink-500",
    visa: "bg-indigo-500",
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
    >
      <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        Répartition du Budget
      </h3>

      <div className="space-y-4">
        {entries.map(([category, amount], index) => {
          const percentage = (amount / summary.total) * 100;

          return (
            <motion.div
              key={category}
              initial="hidden"
              animate="visible"
              variants={slideIn}
              custom={index}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900 capitalize">
                  {category}
                </span>
                <span className="text-sm font-bold text-gray-600">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${categoryColors[category] || "bg-gray-500"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {amount.toLocaleString()} XAF
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// ─── Composant Principal : BudgetCalculator ───
export default function BudgetCalculator() {
  const budgetItems: BudgetItem[] = [
    // Accommodation
    {
      id: "rent",
      name: "Loyer/Hébergement",
      category: "accommodation",
      icon: <Home className="w-5 h-5" />,
      defaultAmount: 150000,
      description: "Logement mensuel",
      currency: "XAF",
    },
    {
      id: "utilities",
      name: "Électricité & Eau",
      category: "accommodation",
      icon: <Home className="w-5 h-5" />,
      defaultAmount: 30000,
      description: "Services publics",
      currency: "XAF",
    },

    // Food
    {
      id: "groceries",
      name: "Épicerie",
      category: "food",
      icon: <ShoppingCart className="w-5 h-5" />,
      defaultAmount: 80000,
      description: "Courses alimentaires",
      currency: "XAF",
    },
    {
      id: "restaurants",
      name: "Restaurants",
      category: "food",
      icon: <Utensils className="w-5 h-5" />,
      defaultAmount: 50000,
      description: "Repas à l'extérieur",
      currency: "XAF",
    },

    // Transport
    {
      id: "transport",
      name: "Transport Local",
      category: "transport",
      icon: <Plane className="w-5 h-5" />,
      defaultAmount: 20000,
      description: "Bus, taxi, métro",
      currency: "XAF",
    },
    {
      id: "flights",
      name: "Vols Internationaux",
      category: "transport",
      icon: <Plane className="w-5 h-5" />,
      defaultAmount: 200000,
      description: "Billets d'avion",
      currency: "XAF",
    },

    // Education
    {
      id: "tuition",
      name: "Frais de Scolarité",
      category: "education",
      icon: <BookOpen className="w-5 h-5" />,
      defaultAmount: 500000,
      description: "Frais universitaires",
      currency: "XAF",
    },
    {
      id: "books",
      name: "Livres & Fournitures",
      category: "education",
      icon: <BookOpen className="w-5 h-5" />,
      defaultAmount: 50000,
      description: "Matériel scolaire",
      currency: "XAF",
    },

    // Health
    {
      id: "insurance",
      name: "Assurance Santé",
      category: "health",
      icon: <Heart className="w-5 h-5" />,
      defaultAmount: 30000,
      description: "Couverture médicale",
      currency: "XAF",
    },
    {
      id: "medical",
      name: "Soins Médicaux",
      category: "health",
      icon: <Heart className="w-5 h-5" />,
      defaultAmount: 20000,
      description: "Consultations, médicaments",
      currency: "XAF",
    },

    // Shopping
    {
      id: "clothing",
      name: "Vêtements",
      category: "shopping",
      icon: <ShoppingCart className="w-5 h-5" />,
      defaultAmount: 30000,
      description: "Habits et chaussures",
      currency: "XAF",
    },
    {
      id: "personal",
      name: "Articles Personnels",
      category: "shopping",
      icon: <ShoppingCart className="w-5 h-5" />,
      defaultAmount: 20000,
      description: "Hygiène, cosmétiques",
      currency: "XAF",
    },

    // Visa
    {
      id: "visa_fees",
      name: "Frais de Visa",
      category: "visa",
      icon: <DollarSign className="w-5 h-5" />,
      defaultAmount: 100000,
      description: "Frais consulaires",
      currency: "XAF",
    },
    {
      id: "agency_fees",
      name: "Frais Agence",
      category: "visa",
      icon: <DollarSign className="w-5 h-5" />,
      defaultAmount: 65000,
      description: "Services 3M Travel",
      currency: "XAF",
    },
  ];

  const [amounts, setAmounts] = useState<Record<string, number>>({});

  const handleAmountChange = (id: string, amount: number) => {
    setAmounts((prev) => ({ ...prev, [id]: amount }));
  };

  const summary = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let total = 0;

    budgetItems.forEach((item) => {
      const amount = amounts[item.id] || item.defaultAmount;
      total += amount;
      byCategory[item.category] = (byCategory[item.category] || 0) + amount;
    });

    return {
      total,
      byCategory,
      monthlyAmount: Math.round(total / 12),
      yearlyAmount: total,
      savings: Math.round(total * 1.2), // Add 20% buffer
    };
  }, [amounts]);

  const categories = Array.from(
    new Set(budgetItems.map((item) => item.category))
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="w-8 h-8 text-blue-600" />
              Calculateur de Budget
            </h1>
            <p className="text-gray-600 mt-1">
              Estimez le coût total de vos études ou de votre voyage
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget Items */}
          <div className="lg:col-span-2 space-y-6">
            {categories.map((category, index) => (
              <BudgetCategoryCard
                key={category}
                category={category}
                items={budgetItems.filter((item) => item.category === category)}
                amounts={amounts}
                onAmountChange={handleAmountChange}
                index={index}
              />
            ))}
          </div>

          {/* Summary & Chart */}
          <div className="space-y-6">
            <BudgetSummaryCard summary={summary} />
            <BudgetChart summary={summary} />

            {/* Tips */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-yellow-900 text-sm mb-2">
                    Conseil
                  </h4>
                  <p className="text-sm text-yellow-800">
                    Prévoyez une marge de 20% pour les dépenses imprévues et les
                    variations de change.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <Button className="w-full gap-2 h-12">
              <CheckCircle2 className="w-5 h-5" />
              Commencer Mon Dossier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
