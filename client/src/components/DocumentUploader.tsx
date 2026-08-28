import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2, ChevronDown, Edit2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DOCUMENT_CATEGORIES, getCategoryById, getCategoryIcon, getCategoryColor } from "@/data/documentCategories";
import { EditDocumentCategoryModal } from "./EditDocumentCategoryModal";
import { getCandidateToken } from "@/hooks/useCandidateAuth";

interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  category?: string;
  file?: File;
}

interface DocumentUploaderProps {
  dossierNumber: string;
  onUploadSuccess?: () => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
  clarificationRequestId?: number;
  clarificationDocumentLabel?: string;
  lockedCategory?: string;
  singleFile?: boolean;
}

export function DocumentUploader({
  dossierNumber,
  onUploadSuccess,
  maxFileSize = 10,
  acceptedFormats = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
  clarificationRequestId,
  clarificationDocumentLabel,
  lockedCategory = "other",
  singleFile = false,
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(clarificationRequestId ? lockedCategory : "other");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return {
        valid: false,
        error: `Fichier trop volumineux (max ${maxFileSize}MB)`,
      };
    }

    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      return {
        valid: false,
        error: `Format non accepté. Formats acceptés: ${acceptedFormats.join(", ")}`,
      };
    }

    return { valid: true };
  };

  const addFiles = (newFiles: File[]) => {
    const filesToAdd = singleFile ? newFiles.slice(0, 1) : newFiles;
    const validatedFiles: DocumentFile[] = filesToAdd
      .map((file) => {
        const validation = validateFile(file);
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          status: validation.valid ? ("pending" as const) : ("error" as const),
          progress: 0,
          error: validation.error,
          category: selectedCategory,
          file,
        };
      });

    setFiles((prev) => singleFile ? validatedFiles : [...prev, ...validatedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    addFiles(newFiles);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const newFiles = Array.from(e.dataTransfer.files || []);
    addFiles(newFiles);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileCategory = (id: string, category: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, category } : f))
    );
  };

  const handleEditCategory = (fileId: string) => {
    setEditingFileId(fileId);
    setShowEditModal(true);
  };

  const handleSaveCategory = (newCategory: string) => {
    if (editingFileId) {
      updateFileCategory(editingFileId, newCategory);
    }
    setShowEditModal(false);
    setEditingFileId(null);
  };

  const getEditingFile = () => {
    return files.find((f) => f.id === editingFileId);
  };

  const uploadFile = async (file: DocumentFile, fileObj: File) => {
    try {
      const token = getCandidateToken();
      if (!token) throw new Error("Votre session candidat a expiré. Veuillez vous reconnecter.");
      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, status: "uploading" as const, progress: 15 } : f));

      const formData = new FormData();
      formData.append("file", fileObj);
      formData.append("fileType", file.category || "other");
      if (clarificationRequestId) formData.append("clarificationRequestId", String(clarificationRequestId));
      const response = await fetch("/api/candidate/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        credentials: "include",
      });
      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, progress: 65 } : f));
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Erreur lors du dépôt du document.");

      setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, status: "success" as const, progress: 100 } : f));
      onUploadSuccess?.();
    } catch (error) {
      setFiles((prev) => prev.map((f) => f.id === file.id ? {
        ...f,
        status: "error" as const,
        error: error instanceof Error ? error.message : "Erreur lors du dépôt du document",
      } : f));
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    for (const file of pendingFiles) {
      if (file.file) await uploadFile(file, file.file);
    }
  };

  const selectedCategoryObj = getCategoryById(selectedCategory);
  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Téléverser vos documents
        </h3>
        <p className="text-gray-600 text-sm">
          {clarificationDocumentLabel ? <>Déposez la pièce demandée pour <strong>{clarificationDocumentLabel}</strong>. Elle sera enregistrée dans cette conversation puis vérifiée par l’agence.</> : "Déposez vos documents manquants pour accélérer le traitement de votre dossier"}
        </p>
      </div>

      {/* Category Selector */}
      {!clarificationRequestId && <div className="mb-6">
          <label id="document-category-label" className="block text-sm font-semibold text-gray-900 mb-2">
          Catégorie du document
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            aria-haspopup="listbox"
            aria-expanded={showCategoryDropdown}
            aria-labelledby="document-category-label"
            className="h-12 w-full flex items-center justify-between px-4 bg-white border border-gray-300 rounded-lg hover:border-blue-400 transition"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedCategoryObj?.icon}</span>
              <span className="text-gray-900 font-medium">{selectedCategoryObj?.label}</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition ${showCategoryDropdown ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showCategoryDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                role="listbox"
                aria-labelledby="document-category-label"
              >
                {DOCUMENT_CATEGORIES.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setShowCategoryDropdown(false);
                    }}
                    role="option"
                    aria-selected={selectedCategory === category.id}
                    className={`min-h-12 w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-blue-50 transition ${
                      selectedCategory === category.id ? "bg-blue-100" : ""
                    }`}
                  >
                    <span className="text-xl">{category.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{category.label}</p>
                      <p className="text-xs text-gray-600">{category.description}</p>
                    </div>
                    {selectedCategory === category.id && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>}

      {/* Upload Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-100"
            : "border-gray-300 bg-white hover:border-blue-400"
        }`}
        animate={{ scale: isDragging ? 1.02 : 1 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={!singleFile}
          onChange={handleFileSelect}
          className="hidden"
          accept={acceptedFormats.join(",")}
        />

        <div className="flex flex-col items-center gap-3">
          <Upload className="w-12 h-12 text-gray-400" />
          <div>
            <p className="font-semibold text-gray-900">
              Glissez-déposez vos documents ici
            </p>
            <p className="text-sm text-gray-600">
              ou cliquez pour sélectionner des fichiers
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 h-11"
          >
            Parcourir les fichiers
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Formats acceptés: {acceptedFormats.join(", ")} | Max {maxFileSize}MB par fichier
        </p>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">
                Fichiers ({files.length})
              </h4>
              <div className="flex gap-2 text-sm">
                {successCount > 0 && (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {successCount} réussi
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errorCount} erreur
                  </span>
                )}
              </div>
            </div>

            <div className="mobile-scroll-region space-y-2 max-h-96 overflow-y-auto">
              {files.map((file) => {
                const fileCategoryObj = getCategoryById(file.category || "other");
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex flex-col items-stretch gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition sm:flex-row sm:items-center"
                  >
                    <File className="w-5 h-5 text-gray-400 flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${fileCategoryObj?.color}`}>
                          <span>{fileCategoryObj?.icon}</span>
                          {fileCategoryObj?.label}
                        </span>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      {file.status === "uploading" && (
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                          <motion.div
                            className="bg-blue-600 h-1.5 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${file.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      )}

                      {file.error && (
                        <p className="text-xs text-red-600 mt-1" role="alert">{file.error}</p>
                      )}
                    </div>

                    {file.status === "success" && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                    {file.status === "error" && (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    {file.status === "uploading" && (
                      <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />
                    )}

                    {file.status === "pending" && (
                      <div className="flex gap-2 flex-shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEditCategory(file.id)}
                          type="button"
                          className="touch-target text-blue-600 hover:text-blue-700 transition p-1 rounded hover:bg-blue-50"
                          aria-label={`Modifier la catégorie de ${file.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => removeFile(file.id)}
                          type="button"
                          className="touch-target text-red-600 hover:text-red-700 transition p-1 rounded hover:bg-red-50"
                          aria-label={`Supprimer ${file.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {pendingCount > 0 && (
              <Button
                onClick={handleUploadAll}
                className="h-12 w-full mt-4 bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Téléverser {pendingCount} fichier{pendingCount > 1 ? "s" : ""}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <p className="text-sm text-blue-900">
          <strong>💡 Conseil :</strong> Sélectionnez la catégorie appropriée pour chaque document
          avant de téléverser. Cela nous aidera à traiter votre dossier plus rapidement.
        </p>
      </motion.div>

      {/* Edit Category Modal */}
      {editingFileId && (
        <EditDocumentCategoryModal
          isOpen={showEditModal}
          fileName={getEditingFile()?.name || ""}
          currentCategory={getEditingFile()?.category || "other"}
          onClose={() => {
            setShowEditModal(false);
            setEditingFileId(null);
          }}
          onSave={handleSaveCategory}
        />
      )}
    </Card>
  );
}
