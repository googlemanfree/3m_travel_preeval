import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ZoomIn, ZoomOut, RotateCw, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentPreviewProps {
  file: File;
  fileName: string;
  fileType: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  onDelete?: () => void;
}

export function DocumentPreview({
  file,
  fileName,
  fileType,
  isOpen,
  onClose,
  onConfirm,
  onDelete,
}: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setZoom(100);
    setRotation(0);
    
    const reader = new FileReader();

    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setIsLoading(false);
    };

    reader.onerror = () => {
      setIsLoading(false);
    };

    reader.readAsDataURL(file);

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, isOpen]);

  const isImage = fileType.startsWith("image/");
  const isPdf = fileType === "application/pdf";

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-lg">{fileName}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formatFileSize(file.size)} • {fileType}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors ml-4 flex-shrink-0"
                aria-label="Fermer la prévisualisation"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-6">
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
                  <p className="text-gray-600 font-medium">Chargement de la prévisualisation...</p>
                </motion.div>
              ) : isImage ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center"
                >
                  <motion.img
                    src={previewUrl}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </motion.div>
              ) : isPdf ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-gray-900 font-medium mb-2">Document PDF</p>
                  <p className="text-sm text-gray-600">Aperçu PDF non disponible en prévisualisation</p>
                  <p className="text-xs text-gray-500 mt-2">Cliquez sur "Télécharger" pour consulter le document</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-900 font-medium mb-2">Prévisualisation non disponible</p>
                  <p className="text-sm text-gray-600">Type de fichier: {fileType}</p>
                </motion.div>
              )}
            </div>

            {/* Controls for Images */}
            {isImage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 p-4 border-t border-gray-200 bg-gray-50"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="gap-2"
                  aria-label="Réduire le zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                  Réduire
                </Button>
                <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 min-w-16 text-center">
                  {zoom}%
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className="gap-2"
                  aria-label="Agrandir le zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                  Agrandir
                </Button>
                <div className="w-px h-6 bg-gray-300" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  className="gap-2"
                  aria-label="Pivoter le document"
                >
                  <RotateCw className="w-4 h-4" />
                  Pivoter
                </Button>
              </motion.div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="gap-2"
                  aria-label="Télécharger le document"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </Button>
                {onDelete && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onDelete();
                      onClose();
                    }}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    aria-label="Supprimer le document"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="px-6"
                >
                  Annuler
                </Button>
                {onConfirm && (
                  <Button
                    onClick={onConfirm}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    Confirmer et soumettre
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
