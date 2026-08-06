import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader, FileText, Send, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  pending_ai: "⏳ Analyse IA en cours",
  pending_review: "📋 À valider",
  validated_sent: "✅ Envoyé",
  rejected: "❌ Rejeté",
};
const STATUS_COLORS: Record<string, string> = {
  pending_ai: "bg-blue-100 text-blue-700",
  pending_review: "bg-amber-100 text-amber-800",
  validated_sent: "bg-green-100 text-green-800",
  rejected: "bg-gray-200 text-gray-600",
};

export default function AdminConsultationRequests() {
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") || "" : "";
  const [statusFilter, setStatusFilter] = useState<string>("pending_review");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editedReport, setEditedReport] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const { data, isLoading, refetch } = trpc.consultationRequest.listForAdmin.useQuery(
    { sessionToken, status: statusFilter !== "tous" ? (statusFilter as any) : undefined, limit: 50 },
    { enabled: !!sessionToken, refetchInterval: 20000 }
  );

  const validateMutation = trpc.consultationRequest.validateAndSend.useMutation({
    onSuccess: () => {
      toast.success("Réponse envoyée au candidat.");
      setSelectedId(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.consultationRequest.reject.useMutation({
    onSuccess: () => { toast.success("Demande rejetée."); setSelectedId(null); refetch(); },
  });

  const items = data?.items ?? [];
  const selected = items.find((i) => i.id === selectedId);

  const openReview = (item: typeof items[number]) => {
    setSelectedId(item.id);
    setEditedReport(item.aiReportContent || "");
    setAdminNotes("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 Demandes de consultation</h1>

        {!sessionToken && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-amber-800 text-sm">
            Session admin introuvable — reconnectez-vous sur /admin/login.
          </div>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {["pending_review", "pending_ai", "validated_sent", "rejected", "tous"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-700"}`}
            >
              {s === "tous" ? "Tous" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Liste */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : items.length === 0 ? (
              <p className="text-center text-gray-500 py-10">Aucune demande.</p>
            ) : (
              items.map((item) => (
                <Card
                  key={item.id}
                  onClick={() => openReview(item)}
                  className={`p-4 cursor-pointer transition-colors ${selectedId === item.id ? "border-blue-500 ring-2 ring-blue-100" : "hover:border-gray-300"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-900">{item.fullName}</p>
                    <Badge className={STATUS_COLORS[item.status]}>{STATUS_LABELS[item.status]}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">{item.email} — {item.targetCountry || "destination non précisée"}</p>
                  {item.cvFileUrl && (
                    <a href={item.cvFileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-blue-600 mt-2 hover:underline">
                      <FileText className="w-3 h-3" /> Voir le CV <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </Card>
              ))
            )}
          </div>

          {/* Détail / validation */}
          <div>
            {!selected ? (
              <Card className="p-8 text-center text-gray-400">Sélectionnez une demande pour la relire.</Card>
            ) : (
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-1">{selected.fullName}</h3>
                <p className="text-sm text-gray-500 mb-4">{selected.email} {selected.phone ? `— ${selected.phone}` : ""}</p>

                {selected.message && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700">
                    <p className="font-semibold text-xs text-gray-500 uppercase mb-1">Message du candidat</p>
                    {selected.message}
                  </div>
                )}

                {selected.status === "pending_ai" ? (
                  <p className="text-sm text-blue-600 flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" /> Analyse IA en cours...</p>
                ) : selected.status === "validated_sent" ? (
                  <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800 whitespace-pre-line">{selected.finalReportContent}</div>
                ) : (
                  <>
                    <Label>Rapport (analyse IA — modifiable avant envoi)</Label>
                    <Textarea
                      value={editedReport}
                      onChange={(e) => setEditedReport(e.target.value)}
                      rows={12}
                      className="mt-1 mb-4 text-sm"
                      placeholder={selected.aiProcessingError ? "L'analyse IA a échoué — rédigez le retour manuellement." : ""}
                    />
                    <Label>Note interne (optionnel, non envoyée au candidat)</Label>
                    <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} className="mt-1 mb-4 text-sm" />

                    <div className="flex gap-3">
                      <Button
                        onClick={() => validateMutation.mutate({ sessionToken, requestId: selected.id, finalReportContent: editedReport, adminNotes })}
                        disabled={validateMutation.isPending || editedReport.trim().length < 10}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Send className="w-4 h-4 mr-2" /> Valider et envoyer au candidat
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => rejectMutation.mutate({ sessionToken, requestId: selected.id, adminNotes })}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{children}</p>;
}
