import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileUploadFieldProps {
  onFileSelect: (file: File | null) => void;
  onUploadProgress?: (progress: number) => void;
  acceptedFormats?: string[];
  maxFileSize?: number; // en bytes
  label?: string;
  description?: string;
}

export function FileUploadField({
  onFileSelect,
  onUploadProgress,
  acceptedFormats = ['application/pdf', 'image/jpeg', 'image/png'],
  maxFileSize = 5 * 1024 * 1024, // 5 MB par défaut
  label = 'Télécharger votre passeport',
  description = 'Formats acceptés: PDF, JPG, PNG (Max 5 MB)',
}: FileUploadFieldProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Vérifier le type de fichier
    if (!acceptedFormats.includes(file.type)) {
      return `Format de fichier non accepté. Formats autorisés: PDF, JPG, PNG`;
    }

    // Vérifier la taille du fichier
    if (file.size > maxFileSize) {
      return `La taille du fichier dépasse la limite de ${formatFileSize(maxFileSize)}`;
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setSelectedFile(null);
      setError(null);
      onFileSelect(null);
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <p className="text-xs text-gray-600 mb-3">{description}</p>
      </div>

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-1">
            Cliquez pour télécharger ou glissez-déposez votre fichier
          </p>
          <p className="text-sm text-gray-600">
            Formats acceptés: PDF, JPG, PNG (Max 5 MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Télécharger un fichier"
          />
        </div>
      ) : (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {getFileExtension(selectedFile.name)}
                </span>
                <span className="text-xs text-gray-600">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isUploading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-sm text-blue-700">Téléchargement en cours...</p>
        </div>
      )}
    </div>
  );
}
