import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Search, FileText, CheckCircle2, Clock, AlertCircle, 
  Download, Mail, Eye, Edit2, Trash2, Send, FolderOpen 
} from "lucide-react";
import Footer from "@/components/Footer";
import { toast } from "sonner";

export default function AdminEvaluations() {
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") || "" : "";
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewFilter, setViewFilter] = useState<"all" | "unviewed" | "viewed">("all");

  // Vérifier qu'une session admin existe
  useEffect(() => {
    if (!sessionToken) {
      setLocation("/admin/login");
    }
  }, [sessionToken, setLocation]);

  // Récupérer les bilans en attente
  const { data: bilansData, isLoading } = trpc.admin.getPendingBilans.useQuery(
    { sessionToken },
    { enabled: !!sessionToken }
  );

  // Récupérer toutes les applications
  const { data: applicationsData } = trpc.admin.getAllApplications.useQuery(
    { sessionToken },
    { enabled: !!sessionToken }
  );
  const bilanViewStatusesQuery = trpc.admin.getBilanViewStatuses.useQuery(
    { sessionToken },
    { enabled: !!sessionToken, refetchInterval: 30_000 }
  );
  const { data: bilanViewStatuses = [], isLoading: isLoadingViewStatuses } = bilanViewStatusesQuery;

  // Mutation pour publier le bilan
  const publishBilanMutation = trpc.admin.publishBilanToClient.useMutation({
    onSuccess: () => {
      toast.success("Bilan publié avec succès!");
      // Rafraîchir la liste
      window.location.reload();
    },
    onError: (err) => {
      toast.error("Erreur lors de la publication du bilan");
    },
  });

  const handlePublishBilan = (bilanId: number) => {
    if (confirm("Êtes-vous sûr de vouloir publier ce bilan?")) {
      publishBilanMutation.mutate({ sessionToken, bilanId });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des évaluations...</p>
        </div>
      </div>
    );
  }

  if (!sessionToken) {
    return null;
  }

  const bilans = bilansData || [];
  const applications = applicationsData || [];
  const viewedBilanCount = bilanViewStatuses.filter((item: any) => Boolean(item.viewedAt)).length;
  const unviewedBilanCount = bilanViewStatuses.length - viewedBilanCount;
  const recentlyViewedBilanCount = bilanViewStatuses.filter((item: any) => item.viewedAt && Date.now() - new Date(item.viewedAt).getTime() <= 7 * 24 * 60 * 60 * 1000).length;
  const reminderMutation = trpc.unifiedRequests.sendEvaluationReminder.useMutation({
    onSuccess: async (result) => { toast.success(result.message); await bilanViewStatusesQuery.refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const visibleBilanViewStatuses = bilanViewStatuses.filter((item: any) => viewFilter === "all" || (viewFilter === "unviewed" ? !item.viewedAt : Boolean(item.viewedAt)));

  const exportBilanStatusesCsv = () => {
    const escapeCsv = (value: unknown) => {
      const text = String(value ?? "").replace(/[\r\n]+/g, " ");
      const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safeText.replace(/"/g, '""')}"`;
    };
    const headers = ["Candidat", "Email", "N° dossier", "Statut du bilan", "Envoyé le", "Consulté le", "Dernière relance"];
    const rows = visibleBilanViewStatuses.map((item: any) => [
      item.candidateName || "Candidat",
      item.candidateEmail || "",
      item.dossierNumber || "",
      item.viewedAt ? "Consulté" : "Non consulté",
      item.sentAt ? new Date(item.sentAt).toLocaleString("fr-FR") : "",
      item.viewedAt ? new Date(item.viewedAt).toLocaleString("fr-FR") : "",
      item.reminderSentAt ? new Date(item.reminderSentAt).toLocaleString("fr-FR") : "",
    ].map(escapeCsv).join(";"));
    const csv = `\uFEFF${[headers.map(escapeCsv).join(";"), ...rows].join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `suivi-bilans-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(`${visibleBilanViewStatuses.length} candidat(s) exporté(s) au format CSV`);
  };

  // Filtrer les bilans
  const filteredBilans = (bilans as any[]).filter((bilan: any) => {
    const matchesSearch = 
      bilan.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bilan.candidateEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" || bilan.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
      draft: { label: "Brouillon", variant: "secondary", icon: <Clock className="w-4 h-4" /> },
      pending_validation: { label: "En attente", variant: "default", icon: <Clock className="w-4 h-4" /> },
      validated: { label: "Validé", variant: "default", icon: <CheckCircle2 className="w-4 h-4" /> },
      sent: { label: "Envoyé", variant: "default", icon: <Mail className="w-4 h-4" /> },
      rejected: { label: "Rejeté", variant: "destructive", icon: <AlertCircle className="w-4 h-4" /> },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "secondary", icon: <Clock className="w-4 h-4" /> };
    return (
      <Badge variant={statusInfo.variant as any} className="gap-2">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Accéder aux Évaluations</h1>
          <p className="text-blue-100">Gérez et validez les bilans d'évaluation des candidats</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Bilans</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{bilans.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">En Attente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {bilans.filter((b: any) => b.status === "pending_validation").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Validés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {bilans.filter((b: any) => b.status === "validated").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Envoyés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">
                {bilans.filter((b: any) => b.status === "sent").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 border-indigo-200 bg-indigo-50/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-indigo-950"><Eye className="h-5 w-5" />Suivi de consultation des bilans</CardTitle>
                <p className="mt-1 text-sm text-indigo-800">Vérifiez si le candidat a ouvert son bilan dans son espace personnel.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold"><Badge className="bg-emerald-100 text-emerald-800">{viewedBilanCount} consulté(s)</Badge><Badge className="bg-amber-100 text-amber-800">{unviewedBilanCount} non consulté(s)</Badge>{recentlyViewedBilanCount > 0 && <Badge className="bg-indigo-100 text-indigo-800"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-indigo-500" />{recentlyViewedBilanCount} récent(s)</Badge>}<Button size="sm" variant="outline" className="gap-1 border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-100" onClick={exportBilanStatusesCsv} disabled={visibleBilanViewStatuses.length === 0}><Download className="h-3.5 w-3.5" />Exporter CSV</Button></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-indigo-950">Afficher :</span><select aria-label="Filtrer les consultations de bilan" value={viewFilter} onChange={(event) => setViewFilter(event.target.value as typeof viewFilter)} className="rounded-md border border-indigo-200 bg-white px-3 py-1.5 text-sm text-slate-700"><option value="all">Tous les bilans</option><option value="unviewed">Non consultés uniquement</option><option value="viewed">Déjà consultés</option></select></div>
            {isLoadingViewStatuses ? <p className="text-sm text-indigo-700">Actualisation du suivi…</p> : visibleBilanViewStatuses.length === 0 ? <p className="text-sm text-indigo-700">Aucun bilan ne correspond à ce filtre.</p> : <div className="space-y-2">
              {visibleBilanViewStatuses.slice(0, 8).map((item: any) => <div key={item.applicationId} className={`flex flex-col gap-3 rounded-lg border bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between ${item.viewedAt && Date.now() - new Date(item.viewedAt).getTime() <= 7 * 24 * 60 * 60 * 1000 ? "border-indigo-300 ring-1 ring-indigo-100" : "border-indigo-100"}`}>
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{item.candidateName || "Candidat"} <span className="font-normal text-slate-500">· {item.dossierNumber}</span></p><p className="text-xs text-slate-500">Envoyé le {item.sentAt ? new Date(item.sentAt).toLocaleString("fr-FR") : "date inconnue"}</p></div>
                <div className="flex flex-wrap items-center gap-2">{item.viewedAt ? <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Consulté le {new Date(item.viewedAt).toLocaleString("fr-FR")}{Date.now() - new Date(item.viewedAt).getTime() <= 7 * 24 * 60 * 60 * 1000 && <span className="ml-1 rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] text-white">Nouveau</span>}</Badge> : <><Badge className="bg-amber-100 text-amber-800"><Clock className="mr-1 h-3.5 w-3.5" />Non consulté</Badge><Button size="sm" variant="outline" className="gap-1 border-amber-300 text-amber-800 hover:bg-amber-50" onClick={() => reminderMutation.mutate({ sessionToken, applicationId: item.applicationId })} disabled={reminderMutation.isPending}><Mail className="h-3.5 w-3.5" />{reminderMutation.isPending ? "Envoi…" : "Relancer"}</Button></>}<Button size="sm" variant="outline" className="gap-1 border-indigo-200 text-indigo-800 hover:bg-indigo-50" onClick={() => setLocation(`/admin/agency-dossiers?search=${encodeURIComponent(item.candidateEmail || item.dossierNumber)}`)}><FolderOpen className="h-3.5 w-3.5" />Ouvrir le dossier</Button></div>
              </div>)}
              {visibleBilanViewStatuses.length > 8 && <p className="pt-1 text-xs text-indigo-700">{visibleBilanViewStatuses.length - 8} autre(s) bilan(s) correspondant au filtre.</p>}
            </div>}
          </CardContent>
        </Card>

        {/* Recherche et Filtres */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Rechercher et Filtrer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  maxLength={200}
                  className="pl-10"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="pending_validation">En attente</option>
                <option value="validated">Validés</option>
                <option value="sent">Envoyés</option>
                <option value="rejected">Rejetés</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des Bilans */}
        <Card>
          <CardHeader>
            <CardTitle>Bilans d'Évaluation ({filteredBilans.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Candidat</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Score</th>
                    <th className="text-left py-3 px-4 font-semibold">Statut</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBilans.map((bilan: any) => (
                    <tr key={bilan.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{bilan.candidateName}</td>
                      <td className="py-3 px-4">{bilan.candidateEmail}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-green-600">{bilan.score}/100</span>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(bilan.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => setLocation(`/admin/evaluations/${bilan.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => setLocation(`/admin/evaluations/${bilan.id}/edit`)}
                          >
                            <Edit2 className="w-4 h-4" />
                            Éditer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 border-blue-200 text-blue-800 hover:bg-blue-50"
                            onClick={() => setLocation(`/admin/agency-dossiers?search=${encodeURIComponent(bilan.candidateEmail || bilan.candidateName || "")}`)}
                          >
                            <FolderOpen className="w-4 h-4" />
                            Ouvrir le dossier candidat
                          </Button>
                          {bilan.status === 'validated' && (
                            <Button
                              size="sm"
                              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handlePublishBilan(bilan.id)}
                              disabled={publishBilanMutation.isPending}
                            >
                              <Send className="w-4 h-4" />
                              {publishBilanMutation.isPending ? "Publication..." : "Publier"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredBilans.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucun bilan trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
