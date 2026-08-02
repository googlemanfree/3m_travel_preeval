import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

export interface QuickUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string;
  onUpload: (file: File, documentType: string) => Promise<void>;
  isLoading?: boolean;
}

export function QuickUploadModal({
  isOpen,
  onClose,
  documentType,
  onUpload,
  isLoading = false,
}: QuickUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('Le fichier ne doit pas dépasser 10 MB');
        setUploadStatus('error');
        return;
      }

      // Vérifier le type de fichier
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('Format de fichier non autorisé. Utilisez PDF, JPG, PNG ou DOC');
        setUploadStatus('error');
        return;
      }

      setSelectedFile(file);
      setUploadStatus('idle');
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Simuler la progression du téléversement
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await onUpload(selectedFile, documentType);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');

      // Fermer le modal après 2 secondes
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erreur lors du téléversement');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setErrorMessage('');
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const event = {
        target: { files: e.dataTransfer.files },
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Téléverser {documentType}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {uploadStatus === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-green-600 font-semibold">Document téléversé avec succès !</p>
              <p className="text-sm text-gray-600 mt-2">Votre document a été enregistré.</p>
            </div>
          ) : uploadStatus === 'uploading' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Téléversement en cours...</p>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 text-center">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              {/* Zone de dépôt */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Choisir ou déposer un document"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">
                  Cliquez pour sélectionner ou glissez-déposez
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, JPG, PNG ou DOC (max 10 MB)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />

              {/* Fichier sélectionné */}
              {selectedFile && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      type="button"
                      aria-label={`Retirer le fichier ${selectedFile.name}`}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Message d'erreur */}
              {uploadStatus === 'error' && errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Téléverser
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
