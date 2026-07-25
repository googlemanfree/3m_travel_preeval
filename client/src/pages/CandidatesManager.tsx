import React, { useState } from "react";
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
  Plus,
  MoreVertical,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Candidate {
  id: number;
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

  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du candidat</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="ai-summary">Résumé IA</TabsTrigger>
            <TabsTrigger value="interview">Questions d'Entretien</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            {/* Informations personnelles */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Informations personnelles
              </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-600">Nom complet</Label>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {candidate.fullName}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Email</Label>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {candidate.email}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Téléphone</Label>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {candidate.phone}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Numéro de dossier</Label>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {candidate.applicationNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Informations de candidature */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              Informations de candidature
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-600">Destination</Label>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {candidate.destination}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Type de visa</Label>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {candidate.visaType}
                </p>
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
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Sauvegarder les modifications
                </Button>
              </div>
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
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(
    mockCandidates
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [paymentFilter, setPaymentFilter] = useState("tous");
  const [scoreFilter, setScoreFilter] = useState("tous");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Appliquer les filtres
  React.useEffect(() => {
    let filtered = candidates;

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.applicationNumber
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "tous") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (paymentFilter !== "tous") {
      filtered = filtered.filter((c) => c.paymentStatus === paymentFilter);
    }

    if (scoreFilter !== "tous") {
      filtered = filtered.filter((c) => c.scoringBadge === scoreFilter);
    }

    setFilteredCandidates(filtered);
  }, [candidates, searchQuery, statusFilter, paymentFilter, scoreFilter]);

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
              {candidates.length}
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
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

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
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

            <Select value={scoreFilter} onValueChange={setScoreFilter}>
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
          </div>
          <div className="flex items-center justify-between mt-4 text-sm">
            <p className="text-gray-600">
              {filteredCandidates.length} candidature(s) trouvée(s)
            </p>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
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
                        <Button size="sm" variant="ghost">
                          <Mail className="w-4 h-4" />
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

          {filteredCandidates.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune candidature trouvée</p>
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
