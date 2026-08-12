/**
 * Gestion des documents du candidat
 * Upload, téléchargement, traçabilité des documents
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileUp,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface Document {
  id: number;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  status: 'pending' | 'verified' | 'rejected';
  source: 'online' | 'agency_scan';
  url?: string;
}

interface DocumentManagementProps {
  dossierNumber: string;
  documents?: Document[];
}

export function DocumentManagement({
  dossierNumber,
  documents = [],
}: DocumentManagementProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [localDocuments, setLocalDocuments] = useState<Document[]>(documents);
  const submitDocumentsMutation = trpc.documentSubmission.submitDocuments.useMutation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      const documentsUrls: Array<{ type: string; url: string; name: string }> = [];
      const uploaded: Document[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', 'other');
        const response = await fetch('/api/candidate/upload-public', { method: 'POST', body: formData });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.fileUrl) throw new Error(payload.error || `Impossible d'envoyer ${file.name}`);
        const fileName = payload.fileName || file.name;
        documentsUrls.push({ type: file.type || 'other', url: payload.fileUrl, name: fileName });
        uploaded.push({
          id: Date.now() + uploaded.length,
          name: fileName,
          type: 'other',
          size: payload.fileSizeBytes ?? file.size,
          uploadedAt: new Date(),
          status: 'pending',
          source: 'online',
          url: payload.fileUrl,
        });
      }
      await submitDocumentsMutation.mutateAsync({
        dossierNumber,
        submissionMethod: 'en_ligne',
        documentsUrls,
        notes: 'Dépôt depuis la gestion documentaire.',
      });
      setLocalDocuments((previous) => [...uploaded, ...previous]);
      toast.success(`${uploaded.length} document(s) uploadé(s) avec succès`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'upload du document');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Vérifié</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zone d'upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
          <FileUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-2">Ajouter des documents</h3>
          <p className="text-sm text-gray-600 mb-4">
            Glissez-déposez vos fichiers ou cliquez pour parcourir
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button
              asChild
              disabled={isUploading}
              className="cursor-pointer"
            >
              <span>
                {isUploading ? 'Upload en cours...' : 'Sélectionner des fichiers'}
              </span>
            </Button>
          </label>
          <p className="text-xs text-gray-500 mt-3">
            Formats acceptés: PDF, JPG, PNG | Taille max: 10 MB
          </p>
        </div>

        {/* Avertissement */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-1">Important :</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Tous les documents doivent être en français ou traduits</li>
              <li>Les documents scannés doivent être clairs et lisibles</li>
              <li>Vérifiez que tous les documents requis sont fournis</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Liste des documents */}
        {localDocuments.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700">Documents uploadés</h3>
            {localDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(doc.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-600">
                      {formatFileSize(doc.size)} • {doc.source === 'online' ? 'Upload en ligne' : 'Scan agence'} •{' '}
                      {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-2">
                  {getStatusBadge(doc.status)}
                  {doc.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {doc.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = doc.url!;
                        a.download = doc.name;
                        a.click();
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.info('Suppression non disponible pour les documents vérifiés')}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Aucun document uploadé pour le moment</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
