import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AgencyDossierDocumentCenter from "@/components/AgencyDossierDocumentCenter";
import { AGENCY_DOSSIER_STATUS_VALUES, isLuxembourgEmploymentProcedure, type AgencyDossierStatus } from "@shared/agencyDossierStatus";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  RefreshCw,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Calendar,
  StickyNote,
  History,
  Bell,
  RotateCcw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DossierStatus = AgencyDossierStatus;

interface Dossier {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string | null;
  nationality?: string | null;
  destination: string;
  visaType: string;
  status: DossierStatus;
  createdByAdmin: string;
  assignedToAdmin?: string | null;
  adminNotes?: string | null;
  educationLevel?: string | null;
  employmentStatus?: string | null;
  monthlyIncome?: number | null;
  bankBalance?: number | null;
  lastStatusChangeAt?: string | null;
  lastStatusChangeBy?: string | null;
  createdAt: string;
  updatedAt: string;
  linkedCandidateId?: number | null;
  linkedCandidateEmail?: string | null;
  linkedCandidateName?: string | null;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DossierStatus, { label: string; color: string; icon: React.ReactNode }> = {
  nouveau:           { label: "Nouveau",            color: "bg-blue-500/20 text-blue-300 border-blue-500/30",    icon: <FileText className="w-3 h-3" /> },
  en_cours:          { label: "En cours",            color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", icon: <Clock className="w-3 h-3" /> },
  documents_requis:  { label: "Docs requis",         color: "bg-orange-500/20 text-orange-300 border-orange-500/30", icon: <MessageSquare className="w-3 h-3" /> },
  recherche_employeur: { label: "Recherche d’employeur", color: "bg-cyan-500/20 text-cyan-200 border-cyan-500/30", icon: <Search className="w-3 h-3" /> },
  validation_adem: { label: "Validation de l’ADEM", color: "bg-indigo-500/20 text-indigo-200 border-indigo-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  soumis:            { label: "Soumis",              color: "bg-purple-500/20 text-purple-300 border-purple-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  approuve:          { label: "Approuvé",            color: "bg-green-500/20 text-green-300 border-green-500/30",  icon: <CheckCircle2 className="w-3 h-3" /> },
  refuse:            { label: "Refusé",              color: "bg-red-500/20 text-red-300 border-red-500/30",       icon: <XCircle className="w-3 h-3" /> },
};

const DESTINATIONS = [
  "Canada", "France", "Allemagne", "Belgique", "Pays-Bas", "Espagne",
  "Portugal", "Italie", "Suisse", "Royaume-Uni", "États-Unis", "Australie",
  "Luxembourg", "Pologne", "Autre",
];

const VISA_TYPES = [
  "Visa Étudiant", "Visa Travail", "Visa Tourisme", "Résidence Permanente",
  "Regroupement Familial", "Visa Affaires", "Permis de Travail",
  "Visa Long Séjour", "Autre",
];

const EDUCATION_LEVELS = [
  "Baccalauréat", "BTS / DUT", "Licence", "Master", "Doctorat", "Autre",
];

const EMPLOYMENT_STATUSES = [
  "Salarié", "Fonctionnaire", "Entrepreneur", "Étudiant", "Sans emploi", "Retraité", "Autre",
];

// ─── Composant principal ───────────────────────────────────────────────────────

export default function AdminAgencyDossiers() {
  const [, navigate] = useLocation();

  // Filtres
  const [search, setSearch] = useState(() => typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("search") || "" : "");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDestination, setFilterDestination] = useState<string>("all");
  const [showTrash, setShowTrash] = useState(false);

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDossierId, setEditingDossierId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  // Formulaire d'ajout
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    nationality: "",
    destination: "",
    visaType: "",
    educationLevel: "",
    employmentStatus: "",
    monthlyIncome: "",
    bankBalance: "",
    adminNotes: "",
  });

  // Formulaire de changement de statut
  const [newStatus, setNewStatus] = useState<DossierStatus>("nouveau");
  const [statusNote, setStatusNote] = useState("");

  // Formulaire de notes
  const [noteText, setNoteText] = useState("");

  // Récupérer les dossiers
  const { data, isLoading, refetch } = trpc.agencyDossier.getDossiers.useQuery({
    limit: 100,
    offset: 0,
    includeDeleted: showTrash,
    // Le filtrage local inclut l’identifiant numérique et garantit la recherche des dossiers legacy.
    // Le serveur reste protégé et limité à 100 lignes ; aucun statut n’est modifié par cette lecture.
    search: undefined,
  });

  const dossiers: Dossier[] = (data?.dossiers ?? []) as Dossier[];

  // Filtrage côté client
  const filtered = dossiers.filter((d) => {
    const matchSearch =
      !search ||
      d.fullName.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search) ||
      String(d.id).includes(search.trim()) ||
      `3m-agn-${String(d.id).padStart(4, "0")}`.includes(search.toLowerCase().trim());
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    const matchDest =
      filterDestination === "all" ||
      d.destination.toLowerCase().includes(filterDestination.toLowerCase());
    return matchSearch && matchStatus && matchDest;
  });

  // Statistiques
  const stats = {
    total: dossiers.length,
    nouveau: dossiers.filter((d) => d.status === "nouveau").length,
    en_cours: dossiers.filter((d) => d.status === "en_cours").length,
    approuve: dossiers.filter((d) => d.status === "approuve").length,
    refuse: dossiers.filter((d) => d.status === "refuse").length,
  };
  const exportMissingDocumentsCsv = () => {
    const rows = filtered.filter((dossier) => dossier.status === "documents_requis");
    const escape = (value: string | null | undefined) => `"${(value ?? "").replaceAll('"', '""')}"`;
    const csv = ["Nom;E-mail;Téléphone;Destination;Procédure;Statut;Dernière mise à jour", ...rows.map((dossier) => [dossier.fullName, dossier.email, dossier.phone, dossier.destination, dossier.visaType, STATUS_CONFIG[dossier.status].label, dossier.lastStatusChangeAt ? formatDate(dossier.lastStatusChangeAt) : ""].map((value) => escape(String(value))).join(";"))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "dossiers-documents-manquants.csv"; anchor.click(); URL.revokeObjectURL(url);
    toast.success(`${rows.length} dossier(s) exporté(s) sans données de document sensibles.`);
  };

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = trpc.agencyDossier.createDossier.useMutation({
    onSuccess: () => {
      toast.success("Dossier créé avec succès ! Un email de bienvenue a été envoyé.");
      setShowAddModal(false);
      resetForm();
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la création du dossier");
    },
  });

  const updateDossierMutation = trpc.agencyDossier.updateDossier.useMutation({
    onSuccess: () => {
      toast.success("Pré-dossier mis à jour avec succès.");
      setShowAddModal(false);
      setEditingDossierId(null);
      resetForm();
      refetch();
    },
    onError: (err) => toast.error(err.message || "Erreur lors de la modification du pré-dossier"),
  });

  const updateStatusMutation = trpc.agencyDossier.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut mis à jour avec succès !");
      setShowStatusModal(false);
      setStatusNote("");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la mise à jour du statut");
    },
  });

  const addNotesMutation = trpc.agencyDossier.addNotes.useMutation({
    onSuccess: () => {
      toast.success("Notes enregistrées !");
      setShowNotesModal(false);
      setNoteText("");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de l'enregistrement des notes");
    },
  });

  const deleteMutation = trpc.agencyDossier.deleteDossier.useMutation({
    onSuccess: () => {
      toast.success("Dossier supprimé.");
      setShowDeleteModal(false);
      setSelectedDossier(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la suppression");
    },
  });
  const restoreMutation = trpc.agencyDossier.restoreDossier.useMutation({
    onSuccess: () => { toast.success("Dossier restauré."); refetch(); },
    onError: (err) => toast.error(err.message || "Restauration impossible"),
  });
  const reminderMutation = trpc.agencyDossier.sendManualReminder.useMutation({
    onSuccess: () => toast.success("Relance envoyée au candidat."),
    onError: (err) => toast.error(err.message || "Relance non envoyée"),
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const resetForm = () =>
    setForm({
      fullName: "", email: "", phone: "", dateOfBirth: "", nationality: "",
      destination: "", visaType: "", educationLevel: "", employmentStatus: "",
      monthlyIncome: "", bankBalance: "", adminNotes: "",
    });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.phone || !form.destination || !form.visaType) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    const payload = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      dateOfBirth: form.dateOfBirth || undefined,
      nationality: form.nationality || undefined,
      destination: form.destination,
      visaType: form.visaType,
      educationLevel: form.educationLevel || undefined,
      employmentStatus: form.employmentStatus || undefined,
      monthlyIncome: form.monthlyIncome ? parseInt(form.monthlyIncome) : undefined,
      bankBalance: form.bankBalance ? parseInt(form.bankBalance) : undefined,
      adminNotes: form.adminNotes || undefined,
    };
    if (editingDossierId) {
      updateDossierMutation.mutate({ dossierId: editingDossierId, ...payload });
      return;
    }
    createMutation.mutate({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      dateOfBirth: form.dateOfBirth || undefined,
      nationality: form.nationality || undefined,
      destination: form.destination,
      visaType: form.visaType,
      educationLevel: form.educationLevel || undefined,
      employmentStatus: form.employmentStatus || undefined,
      monthlyIncome: form.monthlyIncome ? parseInt(form.monthlyIncome) : undefined,
      bankBalance: form.bankBalance ? parseInt(form.bankBalance) : undefined,
      adminNotes: form.adminNotes || undefined,
    });
  };

  const openEditModal = (dossier: Dossier) => {
    setEditingDossierId(dossier.id);
    setForm({
      fullName: dossier.fullName || "",
      email: dossier.email || "",
      phone: dossier.phone || "",
      dateOfBirth: dossier.dateOfBirth ? String(dossier.dateOfBirth).slice(0, 10) : "",
      nationality: dossier.nationality || "",
      destination: dossier.destination || "",
      visaType: dossier.visaType || "",
      educationLevel: dossier.educationLevel || "",
      employmentStatus: dossier.employmentStatus || "",
      monthlyIncome: dossier.monthlyIncome ? String(dossier.monthlyIncome) : "",
      bankBalance: dossier.bankBalance ? String(dossier.bankBalance) : "",
      adminNotes: dossier.adminNotes || "",
    });
    setShowAddModal(true);
  };

  const openStatusModal = (d: Dossier) => {
    setSelectedDossier(d);
    setNewStatus(d.status);
    setStatusNote("");
    setShowStatusModal(true);
  };

  const availableStatuses = (dossier: Dossier) => AGENCY_DOSSIER_STATUS_VALUES.filter((status) => {
    const requiresLuxembourgEmployment = status === "recherche_employeur" || status === "validation_adem";
    return !requiresLuxembourgEmployment || isLuxembourgEmploymentProcedure(dossier.destination, dossier.visaType);
  });

  const openNotesModal = (d: Dossier) => {
    setSelectedDossier(d);
    setNoteText(d.adminNotes || "");
    setShowNotesModal(true);
  };

  const openDeleteModal = (d: Dossier) => {
    setSelectedDossier(d);
    setShowDeleteModal(true);
  };

  const openDetailModal = (d: Dossier) => {
    setSelectedDossier(d);
    setShowDetailModal(true);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin")}
              className="text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6" />
                Dossiers en Agence
              </h1>
              <p className="text-blue-100 text-sm mt-0.5">
                Gestion des dossiers ajoutés manuellement
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="text-white border-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un Dossier
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── Cartes statistiques ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-white", icon: <Users className="w-8 h-8 text-blue-400 opacity-50" /> },
            { label: "Nouveaux", value: stats.nouveau, color: "text-blue-300", icon: <FileText className="w-8 h-8 text-blue-400 opacity-50" /> },
            { label: "En cours", value: stats.en_cours, color: "text-yellow-300", icon: <Clock className="w-8 h-8 text-yellow-400 opacity-50" /> },
            { label: "Approuvés", value: stats.approuve, color: "text-green-300", icon: <CheckCircle2 className="w-8 h-8 text-green-400 opacity-50" /> },
            { label: "Refusés", value: stats.refuse, color: "text-red-300", icon: <XCircle className="w-8 h-8 text-red-400 opacity-50" /> },
          ].map((s) => (
            <Card key={s.label} className="bg-slate-800 border-slate-700">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs">{s.label}</p>
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                  {s.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filtres ─────────────────────────────────────────────────────── */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Rechercher par n° dossier, nom, email ou téléphone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48 bg-slate-700 border-slate-600 text-white">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-white">Tous les statuts</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key} className="text-white">{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterDestination} onValueChange={setFilterDestination}>
                <SelectTrigger className="w-full md:w-48 bg-slate-700 border-slate-600 text-white">
                  <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Toutes destinations" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="all" className="text-white">Toutes destinations</SelectItem>
                  {DESTINATIONS.map((d) => (
                    <SelectItem key={d} value={d} className="text-white">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant={filterStatus === "documents_requis" ? "default" : "outline"} onClick={() => setFilterStatus(filterStatus === "documents_requis" ? "all" : "documents_requis")} className="border-orange-400/50 text-orange-200 hover:bg-orange-400/10 focus-visible:ring-2 focus-visible:ring-orange-300" aria-pressed={filterStatus === "documents_requis"}>
                <FileText className="mr-2 h-4 w-4" />Documents manquants
              </Button>
              <Button type="button" variant="outline" onClick={exportMissingDocumentsCsv} className="border-cyan-400/50 text-cyan-100 hover:bg-cyan-400/10 focus-visible:ring-2 focus-visible:ring-cyan-200">
                <FileText className="mr-2 h-4 w-4" />Exporter CSV
              </Button>
              <Button type="button" variant={showTrash ? "default" : "outline"} onClick={() => setShowTrash((value) => !value)} className="border-slate-500 text-slate-100 hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-white" aria-pressed={showTrash}>
                <Trash2 className="mr-2 h-4 w-4" />{showTrash ? "Dossiers actifs" : "Corbeille"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              {filtered.length} dossier{filtered.length !== 1 ? "s" : ""}
              {(search || filterStatus !== "all" || filterDestination !== "all") && (
                <span className="text-slate-400 text-sm font-normal">
                  (filtré{filtered.length !== 1 ? "s" : ""})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mr-3" />
                <p className="text-slate-400">Chargement des dossiers...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Aucun dossier trouvé</p>
                <p className="text-slate-500 text-sm mt-1">
                  {dossiers.length === 0
                    ? "Cliquez sur « Ajouter un Dossier » pour commencer."
                    : "Modifiez vos filtres pour voir d'autres résultats."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400">Candidat</TableHead>
                      <TableHead className="text-slate-400">Contact</TableHead>
                      <TableHead className="text-slate-400">Destination</TableHead>
                      <TableHead className="text-slate-400">Visa</TableHead>
                      <TableHead className="text-slate-400">Statut</TableHead>
                      <TableHead className="text-slate-400">Date</TableHead>
                      <TableHead className="text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filtered.map((d, i) => {
                        const cfg = STATUS_CONFIG[d.status];
                        return (
                          <motion.tr
                            key={d.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-slate-700 hover:bg-slate-700/50 transition-colors"
                          >
                            <TableCell>
                              <div>
                                <p className="text-white font-medium">{d.fullName}</p>
                                <p className="text-slate-400 text-xs font-mono">3M-AGN-{String(d.id).padStart(4, "0")}</p>
                                {d.nationality && (
                                  <p className="text-slate-400 text-xs">{d.nationality}</p>
                                )}
                                {d.linkedCandidateId ? (
                                  <Badge className="mt-1 border-emerald-400/30 bg-emerald-500/15 text-emerald-200 text-[11px]" aria-label="Compte candidat rattaché">
                                    <CheckCircle2 className="mr-1 h-3 w-3" /> Compte rattaché
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="mt-1 border-amber-400/30 text-amber-200 text-[11px]">Pré-dossier autonome</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                <p className="text-slate-300 text-sm flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-500" />
                                  {d.email}
                                </p>
                                <p className="text-slate-300 text-sm flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-500" />
                                  {d.phone}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-slate-200">{d.destination}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-slate-300 text-sm">{d.visaType}</span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${cfg.color} border text-xs flex items-center gap-1 w-fit`}
                              >
                                {cfg.icon}
                                {cfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-slate-400 text-sm">
                                {formatDate(d.createdAt)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openDetailModal(d)}
                                  className="w-8 h-8 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10"
                                  title="Voir le détail"
                                  aria-label={`Voir le dossier de ${d.fullName}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                  <Button size="icon" variant="ghost" onClick={() => openEditModal(d)} className="w-8 h-8 text-slate-400 hover:text-blue-300 hover:bg-blue-400/10" title="Modifier les informations" aria-label={`Modifier les informations du dossier de ${d.fullName}`}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openStatusModal(d)}
                                  className="w-8 h-8 text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10"
                                  title="Changer le statut"
                                  aria-label={`Modifier le statut du dossier de ${d.fullName}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openNotesModal(d)}
                                  className="w-8 h-8 text-slate-400 hover:text-green-400 hover:bg-green-400/10"
                                  title="Ajouter des notes"
                                  aria-label={`Modifier les notes du dossier de ${d.fullName}`}
                                >
                                  <StickyNote className="w-4 h-4" />
                                </Button>
                                {showTrash ? (
                                  <Button size="icon" variant="ghost" onClick={() => { const reason = window.prompt("Motif de restauration du dossier :"); if (reason?.trim()) restoreMutation.mutate({ dossierId: d.id, reason: reason.trim() }); }} className="w-8 h-8 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10" title="Restaurer" aria-label={`Restaurer le dossier de ${d.fullName}`}>
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button size="icon" variant="ghost" onClick={() => { const message = window.prompt("Message de relance au candidat :"); if (message?.trim()) reminderMutation.mutate({ dossierId: d.id, message: message.trim() }); }} className="w-8 h-8 text-slate-400 hover:text-cyan-300 hover:bg-cyan-400/10" title="Envoyer une relance" aria-label={`Envoyer une relance à ${d.fullName}`}>
                                    <Bell className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openDeleteModal(d)}
                                  className="w-8 h-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                                  title="Supprimer"
                                  aria-label={`Supprimer le dossier de ${d.fullName}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL — Ajouter un Dossier
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                {editingDossierId ? "Modifier le pré-dossier agence" : "Nouveau Dossier en Agence"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-6 mt-2">
            {/* Identité */}
            <div>
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Identité du Candidat
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">
                    Nom complet <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="Jean Dupont"
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Nationalité</Label>
                  <Input
                    value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    placeholder="Camerounaise"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">
                    Email <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jean@example.com"
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">
                    Téléphone <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+237 6XX XXX XXX"
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Date de naissance</Label>
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Destination & Visa */}
            <div>
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Destination & Visa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">
                    Destination <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={form.destination}
                    onValueChange={(v) => setForm({ ...form, destination: v })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Choisir un pays" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {DESTINATIONS.map((d) => (
                        <SelectItem key={d} value={d} className="text-white hover:bg-slate-700">{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">
                    Type de Visa <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={form.visaType}
                    onValueChange={(v) => setForm({ ...form, visaType: v })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Choisir le type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {VISA_TYPES.map((v) => (
                        <SelectItem key={v} value={v} className="text-white hover:bg-slate-700">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Profil */}
            <div>
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Profil (optionnel)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Niveau d'études</Label>
                  <Select
                    value={form.educationLevel}
                    onValueChange={(v) => setForm({ ...form, educationLevel: v })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {EDUCATION_LEVELS.map((e) => (
                        <SelectItem key={e} value={e} className="text-white hover:bg-slate-700">{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Situation professionnelle</Label>
                  <Select
                    value={form.employmentStatus}
                    onValueChange={(v) => setForm({ ...form, employmentStatus: v })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {EMPLOYMENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-white hover:bg-slate-700">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Revenu mensuel (FCFA)</Label>
                  <Input
                    type="number"
                    value={form.monthlyIncome}
                    onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
                    placeholder="150000"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Solde bancaire (FCFA)</Label>
                  <Input
                    type="number"
                    value={form.bankBalance}
                    onChange={(e) => setForm({ ...form, bankBalance: e.target.value })}
                    placeholder="500000"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Notes internes */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-blue-400" />
                Notes internes (visibles uniquement par les admins)
              </Label>
              <Textarea
                value={form.adminNotes}
                onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
                placeholder="Observations, remarques, points d'attention..."
                rows={3}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 resize-none"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowAddModal(false); setEditingDossierId(null); resetForm(); }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateDossierMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createMutation.isPending || updateDossierMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" /> {editingDossierId ? "Enregistrer les modifications" : "Créer le Dossier"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL — Détail du dossier
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              Détail du Dossier
            </DialogTitle>
          </DialogHeader>
          {selectedDossier && (
            <div className="space-y-4 mt-2">
              {/* Statut */}
              <div className="flex items-center gap-2">
                <Badge className={`${STATUS_CONFIG[selectedDossier.status].color} border flex items-center gap-1`}>
                  {STATUS_CONFIG[selectedDossier.status].icon}
                  {STATUS_CONFIG[selectedDossier.status].label}
                </Badge>
                <span className="text-slate-400 text-sm">
                  Créé le {formatDate(selectedDossier.createdAt)}
                </span>
              </div>

              {/* Identité */}
              <div className={`rounded-lg border p-4 ${selectedDossier.linkedCandidateId ? "border-emerald-400/30 bg-emerald-500/10" : "border-amber-400/30 bg-amber-500/10"}`} role="status" aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={`text-xs font-black uppercase tracking-wider ${selectedDossier.linkedCandidateId ? "text-emerald-300" : "text-amber-300"}`}>
                      {selectedDossier.linkedCandidateId ? "Compte candidat rattaché" : "Pré-dossier sans compte"}
                    </p>
                    <p className="mt-1 text-sm text-slate-200">N° 3M-AGN-{String(selectedDossier.id).padStart(4, "0")}</p>
                  </div>
                  {selectedDossier.linkedCandidateId && <Button asChild size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700"><a href={`/mon-espace?section=dossier&candidateId=${selectedDossier.linkedCandidateId}`} target="_blank" rel="noreferrer"><Eye className="mr-2 h-4 w-4" />Ouvrir l’espace client</a></Button>}
                </div>
                <p className="mt-2 text-xs text-slate-300">{selectedDossier.linkedCandidateId ? `Compte associé : ${selectedDossier.linkedCandidateName || selectedDossier.linkedCandidateEmail || "candidat"}.` : "Le rattachement sera proposé lors de l’inscription avec cet e-mail."}</p>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                <h4 className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">Identité</h4>
                <InfoRow icon={<Users className="w-4 h-4" />} label="Nom" value={selectedDossier.fullName} />
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={selectedDossier.email} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Téléphone" value={selectedDossier.phone} />
                {selectedDossier.nationality && <InfoRow icon={<MapPin className="w-4 h-4" />} label="Nationalité" value={selectedDossier.nationality} />}
                {selectedDossier.dateOfBirth && <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date de naissance" value={selectedDossier.dateOfBirth} />}
              </div>

              {/* Destination */}
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                <h4 className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">Destination & Visa</h4>
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Destination" value={selectedDossier.destination} />
                <InfoRow icon={<FileText className="w-4 h-4" />} label="Type de visa" value={selectedDossier.visaType} />
              </div>

              {/* Profil */}
              {(selectedDossier.educationLevel || selectedDossier.employmentStatus || selectedDossier.monthlyIncome || selectedDossier.bankBalance) && (
                <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                  <h4 className="text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">Profil</h4>
                  {selectedDossier.educationLevel && <InfoRow icon={<FileText className="w-4 h-4" />} label="Niveau d'études" value={selectedDossier.educationLevel} />}
                  {selectedDossier.employmentStatus && <InfoRow icon={<Users className="w-4 h-4" />} label="Situation pro." value={selectedDossier.employmentStatus} />}
                  {selectedDossier.monthlyIncome && <InfoRow icon={<FileText className="w-4 h-4" />} label="Revenu mensuel" value={`${selectedDossier.monthlyIncome.toLocaleString()} FCFA`} />}
                  {selectedDossier.bankBalance && <InfoRow icon={<FileText className="w-4 h-4" />} label="Solde bancaire" value={`${selectedDossier.bankBalance.toLocaleString()} FCFA`} />}
                </div>
              )}

              {/* Notes */}
              {selectedDossier.adminNotes && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                    <StickyNote className="w-3 h-3" /> Notes internes
                  </h4>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{selectedDossier.adminNotes}</p>
                </div>
              )}

              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-100">
                <p className="font-semibold">Documents remis en agence</p>
                <p className="mt-1 text-xs leading-5 text-blue-200">Ajoutez ici les scans des pièces déposées physiquement. Chaque dépôt est privé, horodaté et synchronisé avec l’espace client.</p>
              </div>
              <AgencyDossierDocumentCenter dossierId={selectedDossier.id} />

              {/* Créé par */}
              <p className="text-slate-500 text-xs">
                Créé par : {selectedDossier.createdByAdmin}
                {selectedDossier.lastStatusChangeBy && (
                  <> · Dernier changement par : {selectedDossier.lastStatusChangeBy}</>
                )}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDetailModal(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Fermer
            </Button>
            {selectedDossier && (
              <>
                <Button
                  onClick={() => { setShowDetailModal(false); openStatusModal(selectedDossier); }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" /> Changer Statut
                </Button>
                <Button
                  onClick={() => { setShowDetailModal(false); openNotesModal(selectedDossier); }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <StickyNote className="w-4 h-4 mr-2" /> Notes
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL — Changer le statut
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Edit className="w-5 h-5 text-yellow-400" />
              Changer le Statut
            </DialogTitle>
          </DialogHeader>
          {selectedDossier && (
            <div className="space-y-4 mt-2">
              <p className="text-slate-300 text-sm">
                Dossier de <strong className="text-white">{selectedDossier.fullName}</strong>
              </p>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Nouveau statut</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as DossierStatus)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {availableStatuses(selectedDossier).map((key) => {
                      const cfg = STATUS_CONFIG[key];
                      return (
                        <SelectItem key={key} value={key} className="text-white hover:bg-slate-700">
                          <span className="flex items-center gap-2">{cfg.icon} {cfg.label}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Message au candidat (optionnel)</Label>
                <Textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Précisions sur le changement de statut..."
                  rows={3}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                />
              </div>
              <p className="text-slate-500 text-xs">
                Un email de notification sera envoyé automatiquement au candidat.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowStatusModal(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Annuler
            </Button>
            <Button
              disabled={updateStatusMutation.isPending}
              onClick={() => {
                if (!selectedDossier) return;
                updateStatusMutation.mutate({
                  dossierId: selectedDossier.id,
                  newStatus,
                  notes: statusNote || undefined,
                });
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {updateStatusMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mise à jour...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Confirmer</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL — Notes internes
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-green-400" />
              Notes Internes
            </DialogTitle>
          </DialogHeader>
          {selectedDossier && (
            <div className="space-y-4 mt-2">
              <p className="text-slate-300 text-sm">
                Dossier de <strong className="text-white">{selectedDossier.fullName}</strong>
              </p>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Notes (visibles uniquement par les admins)</Label>
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Observations, remarques, points d'attention..."
                  rows={5}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowNotesModal(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Annuler
            </Button>
            <Button
              disabled={addNotesMutation.isPending || !noteText.trim()}
              onClick={() => {
                if (!selectedDossier || !noteText.trim()) return;
                addNotesMutation.mutate({ dossierId: selectedDossier.id, notes: noteText });
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {addNotesMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Enregistrer</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL — Confirmation de suppression
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              Supprimer le Dossier
            </DialogTitle>
          </DialogHeader>
          {selectedDossier && (
            <div className="mt-2 space-y-3">
              <p className="text-slate-300">
                Êtes-vous sûr de vouloir supprimer le dossier de{" "}
                <strong className="text-white">{selectedDossier.fullName}</strong> ?
              </p>
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/30 rounded-lg p-3">
                Cette action est irréversible. Le dossier sera définitivement supprimé.
              </p>
              <div className="space-y-2"><Label htmlFor="delete-reason">Motif de suppression</Label><Textarea id="delete-reason" value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} placeholder="Ex. doublon créé par erreur" className="border-slate-600 bg-slate-900 text-white" /></div>
              <div className="space-y-2"><Label htmlFor="delete-confirmation">Tapez SUPPRIMER pour confirmer</Label><Input id="delete-confirmation" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value.toUpperCase())} className="border-slate-600 bg-slate-900 text-white" /></div>
            </div>
          )}
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => { setShowDeleteModal(false); setDeleteConfirmation(""); setDeleteReason(""); }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Annuler
            </Button>
            <Button
              disabled={deleteMutation.isPending || deleteConfirmation !== "SUPPRIMER" || deleteReason.trim().length < 8}
              onClick={() => {
                if (!selectedDossier) return;
                deleteMutation.mutate({ dossierId: selectedDossier.id, confirmation: "SUPPRIMER", reason: deleteReason.trim() });
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Suppression...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> Supprimer</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Composant utilitaire ─────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 mt-0.5 shrink-0">{icon}</span>
      <span className="text-slate-400 text-sm w-32 shrink-0">{label}</span>
      <span className="text-white text-sm">{value}</span>
    </div>
  );
}
