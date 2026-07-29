import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Search,
  Download,
  Globe,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { startLogin } from "@/const";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "En attente de paiement", color: "bg-yellow-100 text-yellow-800" },
  pending_translation: { label: "À traduire", color: "bg-blue-100 text-blue-800" },
  in_progress: { label: "En cours", color: "bg-purple-100 text-purple-800" },
  completed: { label: "Terminée", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejetée", color: "bg-red-100 text-red-800" },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  birth_certificate: "Acte de naissance",
  diploma: "Diplôme",
  transcript: "Relevé de notes",
  criminal_record: "Casier judiciaire",
  marriage_certificate: "Acte de mariage",
  divorce_decree: "Jugement de divorce",
  employment_letter: "Lettre d'emploi",
  bank_statement: "Relevé bancaire",
  passport: "Passeport",
  driver_license: "Permis de conduire",
  medical_report: "Rapport médical",
  other: "Autre document",
};

interface TranslationRequest {
  id: number;
  documentType: string;
  sourceLanguageCode: string;
  targetLanguageCode: string;
  status: string;
  candidateName: string;
  candidateEmail: string;
  sourceDocumentUrl: string;
  sourceDocumentName: string;
  translatedDocumentUrl?: string | null;
  translatedDocumentName?: string | null;
  totalPrice: string;
  currency: string;
  numberOfPages: number;
  createdAt: Date;
  completionDate?: Date | null;
}

export default function TranslatorDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [uploadModal, setUploadModal] = useState<{ open: boolean; requestId: number | null }>({
    open: false,
    requestId: null,
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: requests, isLoading, refetch } = trpc.translation.getTranslationRequests.useQuery(
    { status: statusFilter !== "all" ? (statusFilter as any) : undefined },
    { enabled: isAuthenticated && (user?.role === "translator" || user?.role === "admin") }
  );

  const uploadMutation = trpc.translation.uploadTranslatedDocument.useMutation({
    onSuccess: () => {
      toast({ title: "✅ Document téléversé", description: "La traduction a été marquée comme terminée." });
      setUploadModal({ open: false, requestId: null });
      setUploadFile(null);
      refetch();
    },
    onError: (err) => {
      toast({ title: "❌ Erreur", description: err.message, variant: "destructive" });
    },
  });

  const handleUpload = async () => {
    if (!uploadFile || !uploadModal.requestId) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const res = await fetch("/api/candidate/upload-public", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.url) throw new Error("Upload failed");

      await uploadMutation.mutateAsync({
        requestId: uploadModal.requestId,
        translatedDocumentUrl: data.url,
        translatedDocumentName: uploadFile.name,
        translatedDocumentSize: uploadFile.size,
      });
    } catch (err: any) {
      toast({ title: "❌ Erreur upload", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const filtered = (requests as TranslationRequest[] | undefined)?.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.candidateName.toLowerCase().includes(q) ||
      r.candidateEmail.toLowerCase().includes(q) ||
      DOC_TYPE_LABELS[r.documentType]?.toLowerCase().includes(q)
    );
  }) ?? [];

  const stats = {
    total: (requests as TranslationRequest[] | undefined)?.length ?? 0,
    toTranslate: (requests as TranslationRequest[] | undefined)?.filter((r) => r.status === "pending_translation").length ?? 0,
    inProgress: (requests as TranslationRequest[] | undefined)?.filter((r) => r.status === "in_progress").length ?? 0,
    completed: (requests as TranslationRequest[] | undefined)?.filter((r) => r.status === "completed").length ?? 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-800">Accès restreint</h2>
        <p className="text-gray-600">Vous devez être connecté en tant que traducteur.</p>
        <Button onClick={() => startLogin()}>Se connecter</Button>
      </div>
    );
  }

  if (user?.role !== "translator" && user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-800">Accès non autorisé</h2>
        <p className="text-gray-600">Ce tableau de bord est réservé aux traducteurs.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Globe className="w-7 h-7 text-blue-600" />
                Dashboard Traducteur
              </h1>
              <p className="text-gray-500 mt-1">Bienvenue, {user?.name} — gérez vos traductions assignées</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
              {user?.role === "admin" ? "Administrateur" : "Traducteur"}
            </Badge>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, icon: FileText, color: "text-gray-600", bg: "bg-white" },
            { label: "À traduire", value: stats.toTranslate, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "En cours", value: stats.inProgress, icon: AlertCircle, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Terminées", value: stats.completed, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`${stat.bg} border-0 shadow-sm`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, email ou type de document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending_translation">À traduire</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="completed">Terminées</SelectItem>
              <SelectItem value="rejected">Rejetées</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Translation List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune traduction trouvée</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((req) => {
                const statusInfo = STATUS_LABELS[req.status] || { label: req.status, color: "bg-gray-100 text-gray-800" };
                const isExpanded = expandedId === req.id;

                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    layout
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        {/* Card Header Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {DOC_TYPE_LABELS[req.documentType] || req.documentType}
                              </p>
                              <p className="text-sm text-gray-500">
                                {req.sourceLanguageCode.toUpperCase()} → {req.targetLanguageCode.toUpperCase()}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <User className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{req.candidateName}</span>
                                <Calendar className="w-3 h-3 text-gray-400 ml-2" />
                                <span className="text-xs text-gray-500">
                                  {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : req.id)}
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-4 pt-4 border-t border-gray-100"
                            >
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm">
                                <div>
                                  <p className="text-gray-400 text-xs">Email client</p>
                                  <p className="text-gray-700 font-medium">{req.candidateEmail}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-xs">Pages</p>
                                  <p className="text-gray-700 font-medium">{req.numberOfPages} page(s)</p>
                                </div>
                                <div>
                                  <p className="text-gray-400 text-xs">Prix</p>
                                  <p className="text-gray-700 font-medium">{req.totalPrice} {req.currency}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {/* Download Source */}
                                <a
                                  href={req.sourceDocumentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Document original
                                </a>

                                {/* Upload Translation */}
                                {(req.status === "pending_translation" || req.status === "in_progress") && (
                                  <Button
                                    size="sm"
                                    onClick={() => setUploadModal({ open: true, requestId: req.id })}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                                    Téléverser la traduction
                                  </Button>
                                )}

                                {/* Download Translated */}
                                {req.status === "completed" && req.translatedDocumentUrl && (
                                  <a
                                    href={req.translatedDocumentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-sm rounded-lg transition-colors"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Voir la traduction
                                  </a>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={uploadModal.open} onOpenChange={(open) => !open && setUploadModal({ open: false, requestId: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Téléverser la traduction
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="translated-file">Document traduit (PDF, DOC, DOCX)</Label>
              <div
                className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => document.getElementById("translated-file")?.click()}
              >
                {uploadFile ? (
                  <div className="flex items-center gap-2 justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">{uploadFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Cliquez pour sélectionner un fichier</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX — max 10 Mo</p>
                  </>
                )}
                <input
                  id="translated-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setUploadModal({ open: false, requestId: null })}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!uploadFile || isUploading}
                onClick={handleUpload}
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Envoi...
                  </div>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Soumettre
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
