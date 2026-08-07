import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader } from 'lucide-react';
import { useLocation } from 'wouter';

interface UploadedDocument {
  id: string;
  name: string;
  type: 'passport' | 'diploma' | 'certificate' | 'other';
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

const DOCUMENT_TYPES = [
  { id: 'passport', label: '🛂 Passeport', description: 'Copie couleur lisible' },
  { id: 'diploma', label: '🎓 Diplômes', description: 'Diplôme(s) et relevés de notes' },
  { id: 'certificate', label: '📜 Certificats', description: 'Certificats professionnels ou de langue' },
  { id: 'other', label: '📄 Autres', description: 'Documents supplémentaires' },
];

export default function DocumentUploadPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Authentification requise</h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour soumettre vos documents.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

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
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const newDocs: UploadedDocument[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      type: 'other',
      file,
      progress: 0,
      status: 'pending',
    }));
    setUploadedDocs([...uploadedDocs, ...newDocs]);
  };

  const removeDocument = (id: string) => {
    setUploadedDocs(uploadedDocs.filter((doc) => doc.id !== id));
  };

  const updateDocumentType = (id: string, type: string) => {
    setUploadedDocs(
      uploadedDocs.map((doc) =>
        doc.id === id ? { ...doc, type: type as any } : doc
      )
    );
  };

  const simulateUpload = async (doc: UploadedDocument) => {
    setUploadedDocs((prev) =>
      prev.map((d) =>
        d.id === doc.id ? { ...d, status: 'uploading', progress: 0 } : d
      )
    );

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setUploadedDocs((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, progress: i } : d
        )
      );
    }

    setUploadedDocs((prev) =>
      prev.map((d) =>
        d.id === doc.id ? { ...d, status: 'completed', progress: 100 } : d
      )
    );
  };

  const handleSubmit = async () => {
    if (uploadedDocs.length === 0) {
      alert('Veuillez ajouter au moins un document');
      return;
    }

    setIsSubmitting(true);

    // Simuler l'upload de tous les documents
    for (const doc of uploadedDocs) {
      if (doc.status === 'pending') {
        await simulateUpload(doc);
      }
    }

    // Simuler la soumission au serveur
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setSubmitSuccess(true);

    // Redirection après 3 secondes
    setTimeout(() => {
      navigate('/mon-espace-v2');
    }, 3000);
  };

  if (submitSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className="mb-6 flex justify-center"
          >
            <CheckCircle2 className="w-20 h-20 text-green-600" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Documents soumis avec succès !
          </h2>
          <p className="text-gray-600 mb-6">
            Vos documents ont été reçus. Nos experts les examineront dans les 24h.
          </p>
          <p className="text-sm text-gray-500">
            Redirection vers votre espace en cours...
          </p>
        </motion.div>
      </div>
    );
  }

  const allUploaded = uploadedDocs.every((doc) => doc.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Soumettre vos documents
          </h1>
          <p className="text-lg text-gray-600">
            Complétez votre dossier en téléchargeant les documents requis
          </p>
        </motion.div>

        {/* Zone de dépôt */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-blue-400'
            }`}
          >
            <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Déposez vos documents ici
            </h3>
            <p className="text-gray-600 mb-4">
              ou cliquez pour parcourir votre ordinateur
            </p>
            <label className="inline-block">
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <Button className="bg-blue-600 hover:bg-blue-700">
                Sélectionner des fichiers
              </Button>
            </label>
            <p className="text-xs text-gray-500 mt-4">
              Formats acceptés : PDF, DOC, DOCX, JPG, PNG (Max 10MB par fichier)
            </p>
          </div>
        </motion.div>

        {/* Types de documents requis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {DOCUMENT_TYPES.map((docType) => (
            <Card key={docType.id} className="p-4 border-2 border-gray-200">
              <p className="text-lg font-bold text-gray-900">{docType.label}</p>
              <p className="text-sm text-gray-600">{docType.description}</p>
            </Card>
          ))}
        </motion.div>

        {/* Documents téléchargés */}
        {uploadedDocs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Documents à soumettre ({uploadedDocs.length})
            </h2>
            <div className="space-y-3">
              {uploadedDocs.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {doc.name}
                        </p>
                        <select
                          value={doc.type}
                          onChange={(e) =>
                            updateDocumentType(doc.id, e.target.value)
                          }
                          className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 mt-1"
                        >
                          {DOCUMENT_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.status === 'completed' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {doc.status === 'uploading' && (
                        <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                      {doc.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {doc.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="bg-blue-600 h-2"
                        initial={{ width: 0 }}
                        animate={{ width: `${doc.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bouton de soumission */}
        {uploadedDocs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4"
          >
            <Button
              onClick={() => navigate('/mon-espace-v2')}
              variant="outline"
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!allUploaded || isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Soumission en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Soumettre les documents
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
