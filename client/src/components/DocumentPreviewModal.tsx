import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, X } from "lucide-react";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentUrl: string;
  fileType?: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  documentTitle,
  documentUrl,
  fileType = "",
}) => {
  const isPdf = documentUrl.toLowerCase().endsWith(".pdf") || fileType.includes("pdf");
  const isImage = /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(documentUrl) || fileType.includes("image");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900 truncate">
            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="truncate">{documentTitle || "Aperçu du document"}</span>
          </DialogTitle>
          <div className="flex items-center gap-2">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium transition"
            >
              <ExternalLink className="w-4 h-4" /> Ouvrir
            </a>
            <a
              href={documentUrl}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-800 rounded-md text-sm font-medium transition"
            >
              <Download className="w-4 h-4" /> Télécharger
            </a>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-[60vh] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative mt-4">
          {isImage ? (
            <img
              src={documentUrl}
              alt={documentTitle}
              className="max-h-[70vh] max-w-full object-contain rounded shadow"
            />
          ) : isPdf ? (
            <iframe
              src={`${documentUrl}#toolbar=0`}
              title={documentTitle}
              className="w-full h-[70vh] border-0 rounded bg-white shadow"
            />
          ) : (
            <div className="text-center p-8">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-2">Aperçu direct non disponible pour ce format.</p>
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4" /> Ouvrir le document dans un nouvel onglet
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
