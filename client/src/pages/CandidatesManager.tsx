import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Mail,
  MessageSquare,
  Send,
  Plus,
  MoreVertical,
  RefreshCw,
  Bookmark,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AISummary } from "@/components/AISummary";
import { InterviewQuestions } from "@/components/InterviewQuestions";
import { PDFExporter } from "@/components/PDFExporter";
import AdminPortraitReviewPanel from "@/components/AdminPortraitReviewPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  CANDIDATE_PAGE_SIZES,
  type CandidatePageSize,
  getPageTokens,
  parseCandidateListUrl,
  serializeCandidateListUrl,
} from "@/lib/adminCandidatePagination";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Candidate {
  id: string | number;
  applicationNumber: string;
  fullName: string;
  email: string;
  phone: string;
  destination: string;
  visaType: string;
  scoringTotal: number;
  scoringBadge: "excellent" | "bon" | "moyen" | "faible";
  status: string;
  paymentStatus: string;
  createdAt: string;
  adminNotes?: string;
  documentsCount?: number;
  source?: "web" | "agence";
  avatarUrl?: string | null;
  avatarVerificationStatus: "missing" | "pending" | "verified" | "rejected";
  avatarVerificationReason?: string | null;
  avatarFaceCount: number;
}

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const mockCandidates: Candidate[] = [
  {
    id: 1,
    applicationNumber: "3M-APP-2026-0001",
    fullName: "Jean Dupont",
    email: "jean@example.com",
    phone: "+237698104832",
    destination: "Canada",
    visaType: "Études",
    scoringTotal: 85,
    scoringBadge: "excellent",
    status: "nouveau",
    paymentStatus: "non_paye",
    createdAt: "2026-07-25",
    documentsCount: 0,
    avatarUrl: null,
    avatarVerificationStatus: "missing",
    avatarVerificationReason: null,
    avatarFaceCount: 0,
  },
  {
    id: 2,
    applicationNumber: "3M-APP-2026-0002",
    fullName: "Marie Martin",
    email: "marie@example.com",
    phone: "+237698104833",
    destination: "France",
    visaType: "Travail",
    scoringTotal: 72,
    scoringBadge: "bon",
    status: "en_evaluation",
    paymentStatus: "paye",
    createdAt: "2026-07-24",
    documentsCount: 3,
    avatarUrl: null,
    avatarVerificationStatus: "pending",
    avatarVerificationReason: null,
    avatarFaceCount: 0,
  },
  {
    id: 3,
    applicationNumber: "3M-APP-2026-0003",
    fullName: "Pierre Bernard",
    email: "pierre@example.com",
    phone: "+237698104834",
    destination: "Allemagne",
    visaType: "Études",
    scoringTotal: 45,
    scoringBadge: "moyen",
    status: "documents_requis",
    paymentStatus: "en_attente",
    createdAt: "2026-07-23",
    documentsCount: 1,
    avatarUrl: null,
    avatarVerificationStatus: "rejected",
    avatarVerificationReason: "Photo à reprendre",
    avatarFaceCount: 2,
  },
];

// ─── HELPER FUNCTIONS ───────────────────────────────────────────────────────

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    nouveau: "bg-blue-100 text-blue-800",
    en_evaluation: "bg-purple-100 text-purple-800",
    documents_requis: "bg-yellow-100 text-yellow-800",
    en_attente: "bg-orange-100 text-orange-800",
    approuve: "bg-green-100 text-green-800",
    refuse: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const getScoreColor = (badge: string) => {
  const colors: Record<string, string> = {
    excellent: "text-green-600 bg-green-50 border-green-200",
    bon: "text-blue-600 bg-blue-50 border-blue-200",
    moyen: "text-yellow-600 bg-yellow-50 border-yellow-200",
    faible: "text-red-600 bg-red-50 border-red-200",
  };
  return colors[badge] || "text-gray-600 bg-gray-50 border-gray-200";
};

// ─── CANDIDATE DETAIL MODAL ──────────────────────────────────────────────────

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
}

const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  isOpen,
  onClose,
}) => {
  const [adminNotes, setAdminNotes] = useState(candidate?.adminNotes || "");
  const [status, setStatus] = useState(candidate?.status || "nouveau");
  const [fullName, setFullName] = useState(candidate?.fullName || "");
  const [email, setEmail] = useState(candidate?.email || "");
  const [phone, setPhone] = useState(candidate?.phone || "");
  const [destination, setDestination] = useState(candidate?.destination || "");
  const [visaType, setVisaType] = useState(candidate?.visaType || "");
  const [messageText, setMessageText] = useState("");
  const utils = trpc.useUtils();
  const candidateReference = candidate ? String(candidate.id) : "online_1";

  useEffect(() => {
    if (!candidate) return;
    setAdminNotes(candidate.adminNotes || "");
    setStatus(candidate.status || "nouveau");
    setFullName(candidate.fullName || "");
    setEmail(candidate.email || "");
    setPhone(candidate.phone || "");
    setDestination(candidate.destination || "");
    setVisaType(candidate.visaType || "");
  }, [candidate]);

  const messagesQuery = trpc.adminCandidateManagement.getMessages.useQuery(
    { candidateId: candidateReference },
    { enabled: isOpen && Boolean(candidate), retry: false },
  );
  const replyMutation = trpc.adminCandidateManagement.replyToCandidate.useMutation({
    onSuccess: async () => {
      setMessageText("");
      await utils.adminCandidateManagement.getMessages.invalidate({ candidateId: candidateReference });
      toast.success("Réponse envoyée au candidat.");
    },
    onError: (error) => toast.error(error.message || "Impossible d’envoyer la réponse."),
  });
  const updateCandidateMutation = trpc.adminCandidateManagement.updateCandidate.useMutation({
    onSuccess: () => {
      utils.adminCandidateManagement.list.invalidate();
      toast.success("Modifications enregistrées dans le dossier.");
      onClose();
    },
    onError: (error) => toast.error(error.message || "Impossible d’enregistrer les modifications."),
  });

  if (!candidate) return null;

  const handleSave = () => {
    const persistedStatus = candidate.source === "agence"
      ? status === "en_evaluation" || status === "en_attente" ? "en_cours" : status === "documents_requis" ? "documents_requis" : status
      : status === "documents_requis" ? "en_attente_documents" : status === "en_attente" ? "en_attente_paiement" : status;
    updateCandidateMutation.mutate({
      candidateId: String(candidate.id),
      status: persistedStatus,
      adminNotes,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      destination: destination.trim(),
      visaType: visaType.trim(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Détails du candidat</DialogTitle>
            <PDFExporter candidate={candidate} />
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="messages">Messagerie</TabsTrigger>
            <TabsTrigger value="ai-summary">Résumé IA</TabsTrigger>
            <TabsTrigger value="interview">Questions d'Entretien</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            {/* Informations personnelles */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Informations personnelles
              </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="admin-full-name" className="text-xs text-gray-600">Nom complet</Label>
                <Input id="admin-full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="admin-email" className="text-xs text-gray-600">Email</Label>
                <Input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="admin-phone" className="text-xs text-gray-600">Téléphone</Label>
                <Input id="admin-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Numéro de dossier</Label>
                <Input value={candidate.applicationNumber} readOnly className="mt-1 bg-gray-50" />
              </div>
            </div>
          </div>

          {/* Informations de candidature */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              Informations de candidature
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="admin-destination" className="text-xs text-gray-600">Destination</Label>
                <Input id="admin-destination" value={destination} onChange={(event) => setDestination(event.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="admin-visa-type" className="text-xs text-gray-600">Type de visa</Label>
                <Input id="admin-visa-type" value={visaType} onChange={(event) => setVisaType(event.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Date de création</Label>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {new Date(candidate.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Documents reçus</Label>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {candidate.documentsCount || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Score et Statut */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Score et Statut</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <Label className="text-xs text-gray-600">Score</Label>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {candidate.scoringTotal}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded border ${getScoreColor(candidate.scoringBadge)}`}
                  >
                    {candidate.scoringBadge}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <Label className="text-xs text-gray-600">Statut actuel</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nouveau">Nouveau</SelectItem>
                    <SelectItem value="en_evaluation">En évaluation</SelectItem>
                    <SelectItem value="documents_requis">
                      Documents requis
                    </SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="approuve">Approuvé</SelectItem>
                    <SelectItem value="refuse">Refusé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <Label className="text-xs text-gray-600">Paiement</Label>
                <p
                  className={`text-sm font-semibold mt-2 ${
                    candidate.paymentStatus === "paye"
                      ? "text-green-600"
                      : candidate.paymentStatus === "en_attente"
                        ? "text-orange-600"
                        : "text-red-600"
                  }`}
                >
                  {candidate.paymentStatus === "paye"
                    ? "✓ Payé"
                    : candidate.paymentStatus === "en_attente"
                      ? "⏳ En attente"
                      : "✗ Non payé"}
                </p>
              </div>
            </div>
          </div>

          {/* Notes administrateur */}
          <div>
            <Label htmlFor="admin-notes" className="font-semibold">
              Notes administrateur
            </Label>
            <Textarea
              id="admin-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Ajoutez vos notes ici..."
              className="mt-2"
              rows={4}
            />
          </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end border-t pt-6">
                <Button variant="outline" onClick={onClose}>
                  Fermer
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={updateCandidateMutation.isPending}>
                  {updateCandidateMutation.isPending ? "Enregistrement..." : "Sauvegarder les modifications"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-blue-950"><MessageSquare className="h-4 w-4" /> Conversation avec le candidat</h3>
                <p className="mt-1 text-xs text-blue-800">Les réponses envoyées ici apparaissent automatiquement dans son Espace client.</p>
              </div>
              <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border bg-white p-4" aria-live="polite">
                {messagesQuery.isLoading ? <p className="text-sm text-gray-500">Chargement des messages…</p> : messagesQuery.isError ? <p className="text-sm text-red-600">Impossible de charger les messages de ce dossier.</p> : messagesQuery.data?.length ? messagesQuery.data.map((message) => (
                  <div key={message.id} className={`rounded-xl p-3 text-sm ${message.senderRole === "advisor" ? "ml-8 bg-blue-50 text-blue-950" : "mr-8 bg-gray-50 text-gray-800"}`}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-wide text-gray-500"><span>{message.senderRole === "advisor" ? "Équipe 3M Travel" : "Candidat"}</span><span>{new Date(message.createdAt).toLocaleString("fr-FR")}</span></div>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                )) : <p className="text-sm text-gray-500">Aucun message pour ce dossier.</p>}
              </div>
              <form onSubmit={(event) => { event.preventDefault(); const text = messageText.trim(); if (text) replyMutation.mutate({ candidateId: candidateReference, content: text }); }} className="space-y-3">
                <Label htmlFor="admin-candidate-message">Répondre au candidat</Label>
                <Textarea id="admin-candidate-message" value={messageText} onChange={(event) => setMessageText(event.target.value.slice(0, 2000))} rows={4} placeholder="Écrire une réponse claire au candidat…" disabled={replyMutation.isPending} />
                <Button type="submit" disabled={!messageText.trim() || replyMutation.isPending} className="bg-blue-600 hover:bg-blue-700"><Send className="mr-2 h-4 w-4" />{replyMutation.isPending ? "Envoi…" : "Envoyer la réponse"}</Button>
              </form>
            </TabsContent>

            <TabsContent value="ai-summary" className="space-y-4">
              <AISummary candidate={candidate} />
            </TabsContent>

            <TabsContent value="interview" className="space-y-4">
              <InterviewQuestions candidate={candidate} />
            </TabsContent>
          </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function CandidatesManager() {
  const initialUrlState = React.useMemo(
    () => parseCandidateListUrl(typeof window === "undefined" ? "" : window.location.search),
    []
  );
  const [searchQuery, setSearchQuery] = useState(initialUrlState.searchQuery);
  const [statusFilter, setStatusFilter] = useState(initialUrlState.statusFilter);
  const [paymentFilter, setPaymentFilter] = useState(initialUrlState.paymentFilter);
  const [scoreFilter, setScoreFilter] = useState(initialUrlState.scoreFilter);
  const [destinationFilter, setDestinationFilter] = useState(initialUrlState.destinationFilter);
  const [sortBy, setSortBy] = useState(initialUrlState.sortBy);
  const [page, setPage] = useState(initialUrlState.page);
  const [pageSize, setPageSize] = useState<CandidatePageSize>(initialUrlState.pageSize);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [activeSavedViewId, setActiveSavedViewId] = useState<number | null>(null);

  const filterInput = React.useMemo(() => {
    const paymentStatus: "all" | "paye" | "en_attente" | "non_paye" = paymentFilter === "tous" ? "all" : paymentFilter === "paye" || paymentFilter === "en_attente" ? paymentFilter : "non_paye";
    const scoreBand: "all" | "excellent" | "bon" | "moyen" | "faible" = scoreFilter === "tous" ? "all" : scoreFilter === "excellent" || scoreFilter === "bon" || scoreFilter === "moyen" ? scoreFilter : "faible";
    return {
      search: searchQuery,
      status: statusFilter === "tous" ? "all" : statusFilter,
      paymentStatus,
      scoreBand,
      destination: destinationFilter === "tous" ? "all" : destinationFilter,
      portraitStatus: "all" as const,
      sortBy: sortBy as "createdAt" | "fullName" | "score",
      sortDirection: "desc" as const,
      page,
      pageSize,
    };
  }, [searchQuery, statusFilter, paymentFilter, scoreFilter, destinationFilter, sortBy, page]);
  const { data, isLoading, error } = trpc.adminCandidateManagement.list.useQuery(filterInput);
  const savedViewsQuery = trpc.adminSavedViews.list.useQuery();
  const utils = trpc.useUtils();
  const resendConfirmationMutation = trpc.adminCandidateManagement.resendConfirmation.useMutation({
    onSuccess: ({ recipientEmail }) => toast.success(`E-mail de confirmation renvoyé à ${recipientEmail}.`),
    onError: error => toast.error(error.message || "Impossible de renvoyer l’e-mail de confirmation."),
  });
  const exportMutation = trpc.adminCandidateManagement.exportCsv.useMutation({
    onSuccess: ({ csv, count }) => {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `candidats-3m-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`${count} candidat(s) exporté(s).`);
    },
    onError: exportError => toast.error(exportError.message || "Impossible d’exporter les candidats."),
  });
  const candidates = (data?.candidates ?? []).map(candidate => ({
    ...candidate,
    createdAt: new Date(candidate.createdAt).toISOString(),
  })) as Candidate[];
  const filteredCandidates = candidates;
  const destinations = React.useMemo(() => Array.from(new Set(candidates.map(candidate => candidate.destination))).sort((a, b) => a.localeCompare(b, "fr")), [candidates]);
  const totalPages = data?.totalPages ?? 1;
  const totalCandidates = data?.total ?? 0;
  const currentViewState = React.useMemo(() => ({
    searchQuery, statusFilter, paymentFilter, scoreFilter, destinationFilter,
    sortBy: sortBy as "createdAt" | "fullName" | "score", page, pageSize,
  }), [searchQuery, statusFilter, paymentFilter, scoreFilter, destinationFilter, sortBy, page, pageSize]);
  const saveViewMutation = trpc.adminSavedViews.save.useMutation({
    onSuccess: () => {
      utils.adminSavedViews.list.invalidate();
      toast.success("Vue favorite enregistrée.");
    },
    onError: saveError => toast.error(saveError.message || "Impossible d’enregistrer cette vue."),
  });
  const removeViewMutation = trpc.adminSavedViews.remove.useMutation({
    onSuccess: () => {
      setActiveSavedViewId(null);
      utils.adminSavedViews.list.invalidate();
      toast.success("Vue favorite supprimée.");
    },
    onError: removeError => toast.error(removeError.message || "Impossible de supprimer cette vue."),
  });
  const updateFromUrl = React.useCallback(() => {
    const next = parseCandidateListUrl(window.location.search);
    setSearchQuery(next.searchQuery);
    setStatusFilter(next.statusFilter);
    setPaymentFilter(next.paymentFilter);
    setScoreFilter(next.scoreFilter);
    setDestinationFilter(next.destinationFilter);
    setSortBy(next.sortBy);
    setPage(next.page);
    setPageSize(next.pageSize);
  }, []);

  React.useEffect(() => {
    const urlState = { searchQuery, statusFilter, paymentFilter, scoreFilter, destinationFilter, sortBy: sortBy as "createdAt" | "fullName" | "score", page, pageSize };
    const nextUrl = `${window.location.pathname}${serializeCandidateListUrl(urlState)}${window.location.hash}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [searchQuery, statusFilter, paymentFilter, scoreFilter, destinationFilter, sortBy, page, pageSize]);

  React.useEffect(() => {
    window.addEventListener("popstate", updateFromUrl);
    return () => window.removeEventListener("popstate", updateFromUrl);
  }, [updateFromUrl]);

  React.useEffect(() => {
    if (data?.page && data.page !== page) setPage(data.page);
  }, [data?.page, page]);

  const resetToFirstPage = () => setPage(1);

  const applySavedView = (viewId: string) => {
    if (viewId === "none") return;
    const selected = savedViewsQuery.data?.find(view => String(view.id) === viewId);
    if (!selected) return;
    const next = selected.state;
    setSearchQuery(next.searchQuery);
    setStatusFilter(next.statusFilter);
    setPaymentFilter(next.paymentFilter);
    setScoreFilter(next.scoreFilter);
    setDestinationFilter(next.destinationFilter);
    setSortBy(next.sortBy);
    setPage(next.page);
    setPageSize(next.pageSize as CandidatePageSize);
    setActiveSavedViewId(selected.id);
  };

  const saveCurrentView = () => {
    const name = window.prompt("Nom de cette vue favorite :");
    if (!name?.trim()) return;
    saveViewMutation.mutate({ name: name.trim(), state: currentViewState });
  };

  const copyCurrentUrl = async () => {
    const url = `${window.location.origin}${window.location.pathname}${serializeCandidateListUrl(currentViewState)}`;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        const input = document.createElement("textarea");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      toast.success("Lien des filtres copié.");
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  };

  const handleViewDetails = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Gestion des Candidatures
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez et suivez toutes les candidatures reçues
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle candidature
          </Button>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500"
          >
            <p className="text-gray-600 text-sm">Total candidatures</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {totalCandidates}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500"
          >
            <p className="text-gray-600 text-sm">En évaluation</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {candidates.filter((c) => c.status === "en_evaluation").length}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500"
          >
            <p className="text-gray-600 text-sm">Approuvées</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {candidates.filter((c) => c.status === "approuve").length}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500"
          >
            <p className="text-gray-600 text-sm">Payées</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {candidates.filter((c) => c.paymentStatus === "paye").length}
            </p>
          </motion.div>
        </div>

        <AdminPortraitReviewPanel candidates={candidates} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); resetToFirstPage(); }}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); resetToFirstPage(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="nouveau">Nouveau</SelectItem>
                <SelectItem value="en_evaluation">En évaluation</SelectItem>
                <SelectItem value="documents_requis">Documents requis</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="approuve">Approuvé</SelectItem>
                <SelectItem value="refuse">Refusé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={(value) => { setPaymentFilter(value); resetToFirstPage(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                <SelectItem value="paye">Payé</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="non_paye">Non payé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={scoreFilter} onValueChange={(value) => { setScoreFilter(value); resetToFirstPage(); }}>
              <SelectTrigger>
                <SelectValue placeholder="Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="bon">Bon</SelectItem>
                <SelectItem value="moyen">Moyen</SelectItem>
                <SelectItem value="faible">Faible</SelectItem>
              </SelectContent>
            </Select>

            <Select value={destinationFilter} onValueChange={(value) => { setDestinationFilter(value); resetToFirstPage(); }}>
              <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes destinations</SelectItem>
                {destinationFilter !== "tous" && !destinations.includes(destinationFilter) && <SelectItem value={destinationFilter}>{destinationFilter}</SelectItem>}
                {destinations.map(destination => <SelectItem key={destination} value={destination}>{destination}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => { setSortBy(value as "createdAt" | "fullName" | "score"); resetToFirstPage(); }}>
              <SelectTrigger><SelectValue placeholder="Trier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Plus récents</SelectItem>
                <SelectItem value="fullName">Nom du candidat</SelectItem>
                <SelectItem value="score">Score décroissant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between mt-4 text-sm">
            <p className="font-medium text-gray-700">
              {isLoading ? "Mise à jour du compteur..." : `${totalCandidates} dossier(s) correspondant aux filtres`}
            </p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Select value={activeSavedViewId ? String(activeSavedViewId) : "none"} onValueChange={applySavedView}>
                <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Vues favorites</SelectItem>
                  {(savedViewsQuery.data ?? []).map(view => <SelectItem key={view.id} value={String(view.id)}>{view.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={saveCurrentView} disabled={saveViewMutation.isPending}>
                <Bookmark className="w-4 h-4 mr-2" />Enregistrer
              </Button>
              {activeSavedViewId && <Button variant="ghost" size="sm" onClick={() => removeViewMutation.mutate({ id: activeSavedViewId })} disabled={removeViewMutation.isPending}>Supprimer la vue</Button>}
              <Button variant="outline" size="sm" onClick={copyCurrentUrl}>
                <Copy className="w-4 h-4 mr-2" />Copier le lien
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportMutation.mutate(filterInput)} disabled={exportMutation.isPending || isLoading}>
                <Download className="w-4 h-4 mr-2" />{exportMutation.isPending ? "Export en cours..." : "Exporter"}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Candidates Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Candidat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Paiement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate, idx) => (
                  <motion.tr
                    key={candidate.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {candidate.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {candidate.applicationNumber}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {candidate.destination}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getScoreColor(candidate.scoringBadge)}`}
                      >
                        {candidate.scoringTotal}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(candidate.status)}`}
                      >
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-semibold ${
                          candidate.paymentStatus === "paye"
                            ? "text-green-600"
                            : candidate.paymentStatus === "en_attente"
                              ? "text-orange-600"
                              : "text-red-600"
                        }`}
                      >
                        {candidate.paymentStatus === "paye"
                          ? "✓ Payé"
                          : candidate.paymentStatus === "en_attente"
                            ? "⏳ En attente"
                            : "✗ Non payé"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(candidate)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Renvoyer l’e-mail de confirmation"
                          aria-label={`Renvoyer l’e-mail de confirmation à ${candidate.fullName}`}
                          onClick={() => resendConfirmationMutation.mutate({ candidateId: String(candidate.id) })}
                          disabled={resendConfirmationMutation.isPending || !candidate.email}
                        >
                          {resendConfirmationMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Envoyer message
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <div className="px-6 py-4 text-sm text-red-600">Impossible de charger les candidats : {error.message}</div>}

          {filteredCandidates.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune candidature trouvée</p>
            </div>
          )}
          {totalCandidates > 0 && (
            <div className="flex flex-col gap-3 border-t px-6 py-4 text-sm text-gray-600 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-2">
                <span>Page {page} sur {totalPages}</span>
                <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value) as CandidatePageSize); resetToFirstPage(); }}>
                  <SelectTrigger className="h-8 w-[148px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CANDIDATE_PAGE_SIZES.map(size => <SelectItem key={size} value={String(size)}>{size} dossiers / page</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={page <= 1 || isLoading}>Précédent</Button>
                {getPageTokens(page, totalPages).map((token, index) => token === "ellipsis" ? (
                  <span key={`ellipsis-${index}`} className="px-1 text-gray-400">…</span>
                ) : (
                  <Button key={token} size="sm" variant={token === page ? "default" : "outline"} onClick={() => setPage(token)} disabled={token === page || isLoading}>{token}</Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setPage(current => Math.min(totalPages, current + 1))} disabled={page >= totalPages || isLoading}>Suivant</Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
