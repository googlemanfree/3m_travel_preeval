import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader, FileText, Send, XCircle, ExternalLink, Download, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { exportConsultationSummaryPdf } from "@/lib/consultationPdf";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingCvId, setLoadingCvId] = useState<number | null>(null);
  const [exportingPdfId, setExportingPdfId] = useState<number | null>(null);

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
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("fr-FR");
  const visibleItems = items.filter((item) => {
    if (!normalizedQuery) return true;
    return [item.fullName, item.email, item.targetCountry, item.cvFileName]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("fr-FR").includes(normalizedQuery));
  });

  const openReview = (item: typeof items[number]) => {
    setSelectedId(item.id);
    setEditedReport(item.aiReportContent || "");
    setAdminNotes("");
  };

  const openCv = (item: typeof items[number]) => {
    if (!item.cvFileUrl) return;
    setLoadingCvId(item.id);
    window.open(item.cvFileUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => setLoadingCvId((current) => current === item.id ? null : current), 900);
  };

  const downloadCv = (item: typeof items[number]) => {
    if (!item.cvFileUrl) return;
    setLoadingCvId(item.id);
    const link = document.createElement("a");
    link.href = item.cvFileUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = item.cvFileName || `cv_${item.fullName}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => setLoadingCvId((current) => current === item.id ? null : current), 900);
  };

  const exportPdf = async (item: typeof items[number]) => {
    setExportingPdfId(item.id);
    try {
      await exportConsultationSummaryPdf({
        candidateName: item.fullName,
        email: item.email,
        phone: item.phone,
        targetCountry: item.targetCountry,
        status: STATUS_LABELS[item.status] || item.status,
        report: item.finalReportContent || item.aiReportContent || "Aucun résumé disponible.",
        adminNotes: item.adminNotes,
        fileName: item.cvFileName,
      });
      toast.success("Résumé PDF téléchargé.");
    } catch (error) {
      console.error("Erreur lors de l’export du résumé CV", error);
      toast.error("Impossible de générer le résumé PDF.");
    } finally {
      setExportingPdfId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
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

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <label htmlFor="consultation-cv-search" className="sr-only">Rechercher un CV</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="consultation-cv-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher par nom, e-mail, pays ou fichier CV…"
              maxLength={120}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <p className="mt-2 px-1 text-xs text-slate-500">{visibleItems.length} demande(s) affichée(s) sur {items.length}.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Liste */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : visibleItems.length === 0 ? (
              <p className="text-center text-gray-500 py-10">Aucune demande.</p>
            ) : (
              visibleItems.map((item) => (
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
                    <div className="mt-2 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => openCv(item)} disabled={loadingCvId === item.id} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline disabled:opacity-60" aria-busy={loadingCvId === item.id}>
                        {loadingCvId === item.id ? <Loader className="h-3 w-3 animate-spin" /> : <Eye className="w-3 h-3" />} {loadingCvId === item.id ? "Ouverture…" : "Voir le CV"} <ExternalLink className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => downloadCv(item)} disabled={loadingCvId === item.id} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:underline disabled:opacity-60" aria-busy={loadingCvId === item.id}>
                        {loadingCvId === item.id ? <Loader className="h-3 w-3 animate-spin" /> : <Download className="w-3 h-3" />} Télécharger
                      </button>
                      <button type="button" onClick={() => exportPdf(item)} disabled={exportingPdfId === item.id} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline disabled:opacity-60" aria-busy={exportingPdfId === item.id}>
                        {exportingPdfId === item.id ? <Loader className="h-3 w-3 animate-spin" /> : <FileText className="w-3 h-3" />} {exportingPdfId === item.id ? "PDF…" : "Résumé PDF"}
                      </button>
                    </div>
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

                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3">
                  <Badge className={STATUS_COLORS[selected.status]}>{STATUS_LABELS[selected.status]}</Badge>
                  {selected.cvFileUrl && <Button type="button" size="sm" variant="outline" onClick={() => openCv(selected)} disabled={loadingCvId === selected.id} aria-busy={loadingCvId === selected.id}>
                    {loadingCvId === selected.id ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}{loadingCvId === selected.id ? "Ouverture…" : "Ouvrir le CV"}
                  </Button>}
                  <Button type="button" size="sm" variant="outline" onClick={() => exportPdf(selected)} disabled={exportingPdfId === selected.id} aria-busy={exportingPdfId === selected.id}>
                    {exportingPdfId === selected.id ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}{exportingPdfId === selected.id ? "Génération…" : "Exporter le résumé PDF"}
                  </Button>
                </div>

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
                      maxLength={10000}
                      className="mt-1 mb-4 text-sm"
                      placeholder={selected.aiProcessingError ? "L'analyse IA a échoué — rédigez le retour manuellement." : ""}
                    />
                    <Label>Note interne (optionnel, non envoyée au candidat)</Label>
                    <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} maxLength={2000} className="mt-1 mb-4 text-sm" />

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
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{children}</p>;
}
