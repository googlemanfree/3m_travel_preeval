import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Trash2,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  FileCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Document {
  id: string;
  name: string;
  type: string;
  status: "pending" | "uploaded" | "verified" | "rejected";
  uploadedDate?: string;
  verifiedDate?: string;
  expiryDate?: string;
  fileSize?: number;
  fileUrl?: string;
  notes?: string;
  priority: "high" | "medium" | "low";
}

interface DocumentCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  documents: Document[];
  completionPercentage: number;
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

// ─── Composant : Badge de Statut ───
const StatusBadge = ({ status }: { status: Document["status"] }) => {
  const statusConfig = {
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      icon: <Clock className="w-4 h-4" />,
      label: "En attente",
    },
    uploaded: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: <Upload className="w-4 h-4" />,
      label: "Uploadé",
    },
    verified: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: "Vérifié",
    },
    rejected: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: <XCircle className="w-4 h-4" />,
      label: "Rejeté",
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.bg} ${config.text} px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold w-fit`}>
      {config.icon}
      {config.label}
    </div>
  );
};

// ─── Composant : Ligne de Document ───
const DocumentRow = ({
  document,
  onUpload,
  onDelete,
  onView,
  index,
}: {
  document: Document;
  onUpload: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  index: number;
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-red-500";
      case "medium":
        return "border-l-4 border-yellow-500";
      case "low":
        return "border-l-4 border-green-500";
      default:
        return "border-l-4 border-gray-500";
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideIn}
      custom={index}
      className={`p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow ${getPriorityColor(
        document.priority
      )}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{document.name}</h4>
            <p className="text-xs text-gray-600 mt-1">{document.type}</p>
            {document.notes && (
              <p className="text-xs text-orange-600 mt-2 bg-orange-50 p-2 rounded">
                📝 {document.notes}
              </p>
            )}
          </div>
        </div>

        {/* Middle */}
        <div className="flex items-center gap-2">
          <StatusBadge status={document.status} />
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {document.status === "pending" && (
            <Button
              size="sm"
              onClick={() => onUpload(document.id)}
              className="gap-1"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          )}
          {document.status === "uploaded" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(document.id)}
              className="gap-1"
            >
              <Eye className="w-4 h-4" />
              Voir
            </Button>
          )}
          {document.status === "verified" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(document.id)}
              className="gap-1"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </Button>
          )}
          <button
            onClick={() => onDelete(document.id)}
            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Composant : Catégorie de Documents ───
const DocumentCategory = ({
  category,
  onUpload,
  onDelete,
  onView,
  index,
}: {
  category: DocumentCategory;
  onUpload: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  index: number;
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      custom={index}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            {category.icon}
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900">{category.name}</h3>
            <p className="text-xs text-gray-600">
              {category.documents.filter((d) => d.status === "verified").length}/
              {category.documents.length} complétés
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${category.completionPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-sm font-bold text-gray-900 w-8">
            {category.completionPercentage}%
          </span>
        </div>
      </button>

      {/* Documents */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 p-4 space-y-3"
          >
            {category.documents.map((doc, i) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onUpload={onUpload}
                onDelete={onDelete}
                onView={onView}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Composant Principal : DocumentTracker ───
export default function DocumentTracker() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<Document["status"] | "all">("all");

  const categories: DocumentCategory[] = [
    {
      id: "identity",
      name: "Pièces d'Identité",
      icon: <User className="w-5 h-5" />,
      documents: [
        {
          id: "passport",
          name: "Passeport",
          type: "Pièce d'identité",
          status: "verified",
          uploadedDate: "2026-07-15",
          verifiedDate: "2026-07-16",
          expiryDate: "2031-07-15",
          fileSize: 2.5,
          priority: "high",
        },
        {
          id: "birth_cert",
          name: "Certificat de Naissance",
          type: "État civil",
          status: "uploaded",
          uploadedDate: "2026-07-18",
          fileSize: 1.8,
          priority: "high",
        },
        {
          id: "national_id",
          name: "Carte Nationale d'Identité",
          type: "Pièce d'identité",
          status: "pending",
          priority: "medium",
          notes: "Requis avant le 25 juillet",
        },
      ],
      completionPercentage: 67,
    },
    {
      id: "education",
      name: "Documents Éducatifs",
      icon: <FileCheck className="w-5 h-5" />,
      documents: [
        {
          id: "diploma",
          name: "Diplôme de Baccalauréat",
          type: "Diplôme",
          status: "verified",
          uploadedDate: "2026-07-10",
          verifiedDate: "2026-07-12",
          fileSize: 3.2,
          priority: "high",
        },
        {
          id: "transcript",
          name: "Relevé de Notes",
          type: "Académique",
          status: "verified",
          uploadedDate: "2026-07-10",
          verifiedDate: "2026-07-12",
          fileSize: 2.1,
          priority: "high",
        },
        {
          id: "language_cert",
          name: "Certificat de Langue",
          type: "Certification",
          status: "pending",
          priority: "high",
          notes: "TOEFL ou IELTS requis",
        },
      ],
      completionPercentage: 67,
    },
    {
      id: "financial",
      name: "Documents Financiers",
      icon: <FileText className="w-5 h-5" />,
      documents: [
        {
          id: "bank_statement",
          name: "Relevé Bancaire",
          type: "Financier",
          status: "pending",
          priority: "high",
          notes: "Derniers 3 mois requis",
        },
        {
          id: "sponsor_letter",
          name: "Lettre de Parrainage",
          type: "Financier",
          status: "pending",
          priority: "medium",
        },
        {
          id: "tax_return",
          name: "Déclaration d'Impôts",
          type: "Financier",
          status: "pending",
          priority: "low",
        },
      ],
      completionPercentage: 0,
    },
    {
      id: "medical",
      name: "Documents Médicaux",
      icon: <AlertCircle className="w-5 h-5" />,
      documents: [
        {
          id: "medical_exam",
          name: "Examen Médical",
          type: "Médical",
          status: "pending",
          priority: "high",
          notes: "À faire auprès du médecin agréé",
        },
        {
          id: "vaccination",
          name: "Carnet de Vaccination",
          type: "Médical",
          status: "pending",
          priority: "medium",
        },
      ],
      completionPercentage: 0,
    },
  ];

  const handleUpload = (id: string) => {
    alert(`Upload du document ${id}`);
  };

  const handleDelete = (id: string) => {
    alert(`Suppression du document ${id}`);
  };

  const handleView = (id: string) => {
    alert(`Affichage du document ${id}`);
  };

  const totalCompletion = Math.round(
    categories.reduce((sum, cat) => sum + cat.completionPercentage, 0) /
      categories.length
  );

  const totalDocuments = categories.reduce(
    (sum, cat) => sum + cat.documents.length,
    0
  );
  const verifiedDocuments = categories.reduce(
    (sum, cat) =>
      sum + cat.documents.filter((d) => d.status === "verified").length,
    0
  );
  const pendingDocuments = categories.reduce(
    (sum, cat) =>
      sum + cat.documents.filter((d) => d.status === "pending").length,
    0
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
              <FileText className="w-8 h-8 text-blue-600" />
              Suivi des Documents
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez et suivez tous vos documents de dossier
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={0}
            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
          >
            <p className="text-gray-600 text-sm mb-2">Progression Globale</p>
            <p className="text-3xl font-bold text-blue-600">{totalCompletion}%</p>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-3 overflow-hidden">
              <motion.div
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${totalCompletion}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={1}
            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
          >
            <p className="text-gray-600 text-sm mb-2">Documents Totaux</p>
            <p className="text-3xl font-bold text-gray-900">{totalDocuments}</p>
            <p className="text-xs text-gray-600 mt-2">À soumettre</p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={2}
            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
          >
            <p className="text-gray-600 text-sm mb-2">Vérifiés</p>
            <p className="text-3xl font-bold text-green-600">{verifiedDocuments}</p>
            <p className="text-xs text-gray-600 mt-2">Documents validés</p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={3}
            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
          >
            <p className="text-gray-600 text-sm mb-2">En Attente</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingDocuments}</p>
            <p className="text-xs text-gray-600 mt-2">À soumettre</p>
          </motion.div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "pending", "uploaded", "verified", "rejected"] as const).map(
              (status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className="capitalize"
                >
                  {status === "all" ? "Tous" : status}
                </Button>
              )
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {categories.map((category, index) => (
            <DocumentCategory
              key={category.id}
              category={category}
              onUpload={handleUpload}
              onDelete={handleDelete}
              onView={handleView}
              index={index}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={categories.length}
          className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-lg p-6 flex items-center justify-between"
        >
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Tous les documents sont prêts?</h3>
            <p className="text-sm text-gray-600">
              Soumettez votre dossier complet au consulat
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Soumettre le Dossier
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
