import { motion } from "framer-motion";
import {
  AlertCircle,
  FileText,
  CreditCard,
  Clock,
  CheckCircle2,
  ArrowRight,
  Upload,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export interface PendingAction {
  id: string;
  type: "payment" | "documents" | "evaluation" | "verification";
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  dueDate?: string;
  amount?: number;
  action: {
    label: string;
    href: string;
  };
}

interface PendingActionsCardsProps {
  actions: PendingAction[];
  isLoading?: boolean;
}

const urgencyConfig = {
  high: {
    bg: "bg-red-50 border-red-200",
    icon: "text-red-600",
    badge: "bg-red-100 text-red-800",
  },
  medium: {
    bg: "bg-amber-50 border-amber-200",
    icon: "text-amber-600",
    badge: "bg-amber-100 text-amber-800",
  },
  low: {
    bg: "bg-blue-50 border-blue-200",
    icon: "text-blue-600",
    badge: "bg-blue-100 text-blue-800",
  },
};

const typeIcons = {
  payment: CreditCard,
  documents: FileText,
  evaluation: Clock,
  verification: CheckCircle2,
};

const typeLabels = {
  payment: "Paiement en attente",
  documents: "Documents manquants",
  evaluation: "Évaluation en attente",
  verification: "Vérification requise",
};

export function PendingActionsCards({ actions, isLoading }: PendingActionsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune action en attente</h3>
        <p className="text-gray-600">Votre dossier est à jour. Continuez à suivre votre progression.</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {actions.map((action, index) => {
        const Icon = typeIcons[action.type];
        const config = urgencyConfig[action.urgency];

        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-2 ${config.bg} hover:shadow-lg transition-shadow`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${config.badge}`}>
                      <Icon className={`w-5 h-5 ${config.icon}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold">{action.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {typeLabels[action.type]}
                      </CardDescription>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${config.badge}`}>
                    {action.urgency === "high" ? "Urgent" : action.urgency === "medium" ? "Modéré" : "Normal"}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">{action.description}</p>

                {action.type === "payment" && action.amount && (
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Montant à payer:</span>
                      <span className="text-lg font-bold text-red-600 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {action.amount.toLocaleString("fr-FR")} XAF
                      </span>
                    </div>
                  </div>
                )}

                {action.dueDate && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>À faire avant: {new Date(action.dueDate).toLocaleDateString("fr-FR")}</span>
                  </div>
                )}

                <Link href={action.action.href}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    {action.action.label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
