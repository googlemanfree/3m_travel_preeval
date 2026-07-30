import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

interface DocumentUploaderProps {
  dossierNumber: string;
  onUploadSuccess?: () => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
}

export function DocumentUploader({
  dossierNumber,
  onUploadSuccess,
  maxFileSize = 10,
  acceptedFormats = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"],
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
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
    const validatedFiles: DocumentFile[] = newFiles
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
        };
      });

    setFiles((prev) => [...prev, ...validatedFiles]);
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

  const uploadFile = async (file: DocumentFile, fileObj: File) => {
    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "uploading" as const, progress: 0 } : f
        )
      );

      // Simulate upload with progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, progress: i } : f
          )
        );
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "success" as const, progress: 100 } : f
        )
      );

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? {
                ...f,
                status: "error" as const,
                error: "Erreur lors de l'upload",
              }
            : f
        )
      );
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    const fileElements = fileInputRef.current?.files;

    if (fileElements) {
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        const fileObj = fileElements[i];
        if (fileObj) {
          await uploadFile(file, fileObj);
        }
      }
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Téléverser vos documents
        </h3>
        <p className="text-gray-600 text-sm">
          Déposez vos documents manquants pour accélérer le traitement de votre dossier
        </p>
      </div>

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
          multiple
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
            className="mt-2"
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

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition"
                >
                  <File className="w-5 h-5 text-gray-400 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>

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
                      <p className="text-xs text-red-600 mt-1">{file.error}</p>
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
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-red-600 transition flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            {pendingCount > 0 && (
              <Button
                onClick={handleUploadAll}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
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
          <strong>💡 Conseil :</strong> Téléversez vos documents dès que possible pour
          accélérer le traitement de votre dossier. Une décharge sera générée
          automatiquement pour chaque document reçu.
        </p>
      </motion.div>
    </Card>
  );
}
