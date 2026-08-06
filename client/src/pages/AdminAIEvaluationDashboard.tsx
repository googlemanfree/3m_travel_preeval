import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader, Sparkles, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  evaluation: "📋 Pré-évaluation",
  luxembourg: "🇱🇺 Luxembourg",
  etudes: "🎓 Visa Études",
  consultation: "💬 Consultation + CV",
};

const PRIORITY_STYLES: Record<string, { badge: string; border: string }> = {
  haute: { badge: "bg-red-100 text-red-800", border: "border-l-4 border-red-500" },
  moyenne: { badge: "bg-amber-100 text-amber-800", border: "border-l-4 border-amber-400" },
  basse: { badge: "bg-gray-100 text-gray-600", border: "border-l-4 border-gray-200" },
};

export default function AdminAIEvaluationDashboard() {
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") || "" : "";

  const { data, isLoading, refetch } = trpc.aiEvaluationManagement.getUnifiedDashboard.useQuery(
    { sessionToken, limit: 100 },
    { enabled: !!sessionToken, refetchInterval: 30000 }
  );

  const items = data?.items ?? [];
  const summary = data?.summary;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Gestion IA des évaluations</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Toutes vos évaluations (pré-évaluations, Luxembourg, visa études, consultations) réunies en une seule liste, triée automatiquement par priorité de suivi.
        </p>

        {!sessionToken && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-amber-800 text-sm">
            Session admin introuvable — reconnectez-vous sur /admin/login.
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            <Card className="p-4"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold text-gray-900">{summary.total}</p></Card>
            <Card className="p-4 border-l-4 border-red-500"><p className="text-xs text-gray-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Priorité haute</p><p className="text-2xl font-bold text-red-600">{summary.haute}</p></Card>
            <Card className="p-4 border-l-4 border-amber-400"><p className="text-xs text-gray-500">Priorité moyenne</p><p className="text-2xl font-bold text-amber-600">{summary.moyenne}</p></Card>
            <Card className="p-4"><p className="text-xs text-gray-500">Priorité basse</p><p className="text-2xl font-bold text-gray-500">{summary.basse}</p></Card>
            <Card className="p-4 border-l-4 border-green-500"><p className="text-xs text-gray-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Convertis</p><p className="text-2xl font-bold text-green-600">{summary.converted}</p></Card>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500 py-16">Aucune évaluation pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${PRIORITY_STYLES[item.priority].border}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-900">{item.fullName}</p>
                    <Badge className={PRIORITY_STYLES[item.priority].badge}>{item.priority === "haute" ? "🔴 Priorité haute" : item.priority === "moyenne" ? "🟡 Priorité moyenne" : "⚪ Priorité basse"}</Badge>
                    <span className="text-xs text-gray-400">{TYPE_LABELS[item.type]}</span>
                    {item.hasConverted && <Badge className="bg-green-100 text-green-800">✓ Converti</Badge>}
                  </div>
                  <p className="text-xs text-gray-500">{item.email} — {new Date(item.createdAt).toLocaleDateString("fr-FR")}</p>
                  <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-blue-500 flex-shrink-0" /> {item.suggestedAction}
                  </p>
                </div>
                {item.score !== null && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-blue-600">{item.score}<span className="text-sm text-gray-400">/100</span></p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
