import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, X } from 'lucide-react';
import { motion } from 'framer-motion';

// Configuration du worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName: string;
  downloadUrl: string;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  fileName,
  downloadUrl,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Erreur lors du chargement du PDF:', error);
    setIsLoading(false);
  };

  const handlePreviousPage = () => {
    setIsPageLoading(true);
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    setTimeout(() => setIsPageLoading(false), 300);
  };

  const handleNextPage = () => {
    setIsPageLoading(true);
    setCurrentPage((prev) => Math.min(prev + 1, numPages || 1));
    setTimeout(() => setIsPageLoading(false), 300);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="truncate">{fileName}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* Barre d'outils */}
        <div className="flex items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              Page {currentPage} {numPages && `/ ${numPages}`}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextPage}
              disabled={!numPages || currentPage === numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={scale >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <a
            href={downloadUrl}
            download={fileName}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </a>
        </div>

        {/* Visionneuse PDF */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 relative">
          {/* Skeleton Loading */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-50"
            >
              {/* Squelette du PDF */}
              <div className="w-64 h-96 bg-gray-200 rounded-lg animate-pulse" />
              
              {/* Indicateur de chargement */}
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="h-8 w-8 rounded-full border-4 border-gray-300 border-t-blue-600"
                />
                <p className="text-sm font-medium text-gray-600">Chargement du PDF...</p>
                <p className="text-xs text-gray-500">Veuillez patienter</p>
              </div>
            </motion.div>
          )}

          {/* Indicateur de chargement de page */}
          {isPageLoading && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-6 w-6 rounded-full border-3 border-gray-300 border-t-blue-600"
              />
            </motion.div>
          )}

          {/* Contenu PDF */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoading ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex items-center justify-center"
          >
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="text-center text-gray-500">Chargement...</div>}
              error={<div className="text-center text-red-500">Erreur lors du chargement du PDF</div>}
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
