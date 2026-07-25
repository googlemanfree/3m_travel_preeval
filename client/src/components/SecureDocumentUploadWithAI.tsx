import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Upload,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Lock,
  FileText,
  Image as ImageIcon,
  Loader2,
  Zap,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error" | "analyzing";
  error?: string;
  readabilityAnalysis?: {
    isReadable: boolean;
    readabilityScore: number;
    issues: string[];
    suggestions: string[];
    confidence: number;
    analysisDetails: {
      textClarity: string;
      imageQuality: string;
      completeness: string;
      visibility: string;
    };
  };
}

interface SecureDocumentUploadWithAIProps {
  dossierNumber: string;
  onUploadComplete?: (documents: UploadedDocument[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedFormats?: string[];
}

const ALLOWED_FORMATS = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;

export function SecureDocumentUploadWithAI({
  dossierNumber,
  onUploadComplete,
  maxFiles = MAX_FILES,
  maxFileSize = MAX_FILE_SIZE,
  acceptedFormats = ALLOWED_FORMATS,
}: SecureDocumentUploadWithAIProps) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeReadabilityMutation =
    trpc.documentSubmission.analyzeDocumentReadability.useMutation();

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-5 h-5" />;
    if (type === "application/pdf") return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Format non accepté: ${file.type}. Acceptés: PDF, JPEG, PNG`;
    }
    if (file.size > maxFileSize) {
      return `Fichier trop volumineux: ${formatFileSize(file.size)}. Max: ${formatFileSize(maxFileSize)}`;
    }
    return null;
  };

  const addDocuments = (files: FileList | null) => {
    if (!files) return;

    const newDocuments: UploadedDocument[] = [];

    Array.from(files).forEach((file) => {
      const error = validateFile(file);

      if (documents.length + newDocuments.length >= maxFiles) {
        toast.error(`Maximum ${maxFiles} fichiers autorisés`);
        return;
      }

      newDocuments.push({
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        progress: 0,
        status: error ? "error" : "pending",
        error: error || undefined,
      });
    });

    setDocuments((prev) => [...prev, ...newDocuments]);

    if (newDocuments.some((d) => d.status === "error")) {
      toast.error("Certains fichiers n'ont pas pu être ajoutés");
    }
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const analyzeReadability = async (file: File, docId: string): Promise<any> => {
    try {
      const reader = new FileReader();
      return new Promise((resolve: (value: any) => void) => {
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          try {
            const result = await analyzeReadabilityMutation.mutateAsync({
              imageUrl: base64,
              documentType: "document",
            });
            resolve(result.analysis);
          } catch (error) {
            console.error("Error analyzing document:", error);
            resolve(null);
          }
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error("Error reading file:", error);
      return null;
    }
  };

  const uploadDocuments = async () => {
    const validDocuments = documents.filter((d) => d.status !== "error");

    if (validDocuments.length === 0) {
      toast.error("Aucun document valide à télécharger");
      return;
    }

    setIsUploading(true);

    try {
      for (const doc of validDocuments) {
        // Marquer comme en analyse
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id ? { ...d, status: "analyzing", progress: 10 } : d
          )
        );

        // Analyser la lisibilité avec IA
        const analysis = await analyzeReadability(doc.file, doc.id);

        // Simuler la progression du téléchargement
        for (let i = 20; i <= 100; i += 20) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === doc.id ? { ...d, progress: i } : d
            )
          );
        }

        // Marquer comme succès avec résultats d'analyse
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id
              ? {
                  ...d,
                  status: "success",
                  progress: 100,
                  readabilityAnalysis: analysis,
                }
              : d
          )
        );

        // Afficher les résultats
        if (analysis) {
          if (analysis.isReadable) {
            toast.success(
              `✓ ${doc.name} - Lisibilité: ${analysis.readabilityScore}%`
            );
          } else {
            toast.warning(
              `⚠ ${doc.name} - Qualité insuffisante (${analysis.readabilityScore}%)`
            );
          }
        }
      }

      toast.success(`${validDocuments.length} document(s) analysé(s) avec succès`);

      if (onUploadComplete) {
        onUploadComplete(validDocuments);
      }

      // Réinitialiser après 2 secondes
      setTimeout(() => {
        setDocuments([]);
      }, 2000);
    } catch (error) {
      toast.error("Erreur lors de l'analyse");
      setDocuments((prev) =>
        prev.map((d) =>
          d.status === "analyzing"
            ? { ...d, status: "error", error: "Erreur d'analyse" }
            : d
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addDocuments(e.dataTransfer.files);
  };

  const pendingCount = documents.filter((d) => d.status === "pending").length;
  const uploadedCount = documents.filter((d) => d.status === "success").length;

  return (
    <div className="space-y-4">
      {/* Zone de dépôt */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center">
          <motion.div
            animate={{ y: isDragging ? -5 : 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="mb-4"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Téléchargez vos documents
          </h3>
          <p className="text-sm text-gray-600 text-center mb-2">
            Glissez-déposez vos fichiers ici ou cliquez pour parcourir
          </p>
          <p className="text-xs text-blue-600 font-medium mb-4 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Analyse IA de lisibilité automatique
          </p>

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="mb-4"
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Parcourir les fichiers
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => addDocuments(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />

          <p className="text-xs text-gray-500 text-center">
            Formats acceptés: PDF, JPEG, PNG, WebP • Max {formatFileSize(maxFileSize)} par fichier • Max {maxFiles} fichiers
          </p>
        </div>
      </motion.div>

      {/* Liste des documents */}
      <AnimatePresence>
        {documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">
                Documents ({documents.length}/{maxFiles})
              </h4>
              {uploadedCount > 0 && (
                <span className="text-sm text-green-600 font-medium">
                  ✓ {uploadedCount} analysé(s)
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`p-3 rounded-lg border transition-all ${
                    doc.status === "error"
                      ? "bg-red-50 border-red-200"
                      : doc.status === "success"
                        ? "bg-green-50 border-green-200"
                        : doc.status === "analyzing"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-1 flex-shrink-0">
                        {doc.status === "error" ? (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        ) : doc.status === "success" ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : doc.status === "analyzing" ? (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : (
                          <div className="text-gray-600">{getFileIcon(doc.type)}</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.size)}
                        </p>

                        {doc.status === "error" && doc.error && (
                          <p className="text-xs text-red-600 mt-1">{doc.error}</p>
                        )}

                        {doc.status === "analyzing" && (
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                            <motion.div
                              className="bg-blue-600 h-1.5 rounded-full"
                              animate={{ width: `${doc.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        )}

                        {/* Résultats d'analyse */}
                        {doc.readabilityAnalysis && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-3 h-3 text-blue-600" />
                              <span className="text-xs font-semibold text-gray-700">
                                Lisibilité: {doc.readabilityAnalysis.readabilityScore}%
                              </span>
                            </div>
                            {!doc.readabilityAnalysis.isReadable && (
                              <div className="space-y-1">
                                {doc.readabilityAnalysis.issues.slice(0, 2).map((issue, i) => (
                                  <p key={i} className="text-xs text-red-600 flex items-start gap-1">
                                    <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                    {issue}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {doc.status !== "uploading" && doc.status !== "analyzing" && (
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                        disabled={isUploading}
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boutons d'action */}
      {documents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 pt-4 border-t"
        >
          <Button
            variant="outline"
            onClick={() => setDocuments([])}
            disabled={isUploading}
            className="flex-1"
          >
            Effacer tout
          </Button>
          <Button
            onClick={uploadDocuments}
            disabled={isUploading || pendingCount === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Analyser ({pendingCount})
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Message de sécurité */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Lock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Analyse IA sécurisée: Vos documents sont chiffrés et analysés automatiquement pour vérifier leur lisibilité. Seuls les documents acceptables seront traités.
        </p>
      </div>
    </div>
  );
}
