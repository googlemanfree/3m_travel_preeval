import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCandidateAuth } from '@/hooks/useCandidateAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader } from 'lucide-react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';

interface UploadedDocument {
  id: string;
  name: string;
  type: 'passport' | 'diplome' | 'certificate' | 'other';
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  fileUrl?: string;
}

const DOCUMENT_TYPES = [
  { id: 'passport', label: '🛂 Passeport', description: 'Copie couleur lisible' },
  { id: 'diplome', label: '🎓 Diplômes', description: 'Diplôme(s) et relevés de notes' },
  { id: 'certificate', label: '📜 Certificats', description: 'Certificats professionnels ou de langue' },
  { id: 'other', label: '📄 Autres', description: 'Documents supplémentaires' },
];

// Correspondance avec les types acceptés par le serveur (server/routers/candidate.ts)
const SERVER_FILE_TYPE: Record<string, string> = {
  passport: 'passeport',
  diplome: 'diplome',
  certificate: 'autre',
  other: 'autre',
};

export default function DocumentUploadPage() {
  const { candidate, isAuthenticated } = useCandidateAuth();
  const [, navigate] = useLocation();
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const saveDocumentMutation = trpc.candidate.saveDocument.useMutation();
  const analyzePassportMutation = trpc.clientDocuments.analyzePassport.useMutation();
  const [passportAnalysis, setPassportAnalysis] = useState<any>(null);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connexion requise</h2>
          <p className="text-gray-600 mb-6 text-sm">Vous devez être connecté pour téléverser vos documents.</p>
          <Button onClick={() => navigate('/login')} className="w-full">Se connecter</Button>
        </Card>
      </div>
    );
  }

  /** Envoie réellement le fichier au serveur et met à jour son statut au fil de la progression. */
  const uploadFileToServer = async (doc: UploadedDocument) => {
    setUploadedDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: 'uploading', progress: 20 } : d)));

    try {
      const token = localStorage.getItem('3m_candidate_token') || sessionStorage.getItem('3m_candidate_token');
      const formData = new FormData();
      formData.append('file', doc.file);
      formData.append('fileType', SERVER_FILE_TYPE[doc.type] || 'autre');

      const res = await fetch('/api/candidate/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      setUploadedDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, progress: 70 } : d)));

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur d'envoi" }));
        throw new Error(err.error || "Erreur lors de l'envoi du fichier.");
      }
      const data = await res.json();

      // Enregistrer le document dans le dossier du candidat (base de données réelle)
      await saveDocumentMutation.mutateAsync({
        fileType: SERVER_FILE_TYPE[doc.type] as any,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileKey: data.fileKey,
        fileSizeBytes: data.fileSizeBytes,
        mimeType: data.mimeType,
      });

      setUploadedDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: 'completed', progress: 100, fileUrl: data.fileUrl } : d)));

      // Si c'est un passeport, lancer l'analyse automatique de lisibilité
      if (doc.type === 'passport') {
        try {
          const analysis = await analyzePassportMutation.mutateAsync({
            fileName: doc.file.name,
            fileUrl: data.fileUrl,
          });
          setPassportAnalysis(analysis);
        } catch (e) {
          console.error("Erreur analyse passeport", e);
        }
      }
    } catch (err: any) {
      setUploadedDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: 'error', error: err.message || 'Échec de l\'envoi' } : d)));
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
    setUploadedDocs((prev) => [...prev, ...newDocs]);
    // Envoi immédiat au serveur — pas d'attente d'un clic supplémentaire
    newDocs.forEach((doc) => uploadFileToServer(doc));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) handleFiles(Array.from(e.dataTransfer.files));
  };

  const removeDocument = (id: string) => {
    setUploadedDocs((prev) => prev.filter((doc) => doc.id !== id));
  };

  const updateDocumentType = (id: string, type: string) => {
    setUploadedDocs((prev) => prev.map((doc) => (doc.id === id ? { ...doc, type: type as any } : doc)));
  };

  const handleFinish = () => {
    if (uploadedDocs.length === 0) {
      setGlobalError('Veuillez ajouter au moins un document.');
      return;
    }
    if (uploadedDocs.some((d) => d.status === 'uploading')) {
      setGlobalError("Attendez la fin de l'envoi de tous les documents.");
      return;
    }
    setGlobalError('');
    setSubmitSuccess(true);
    setTimeout(() => navigate('/mon-espace'), 2500);
  };

  const hasCompletedDocs = uploadedDocs.some((d) => d.status === 'completed');
  const hasUploading = uploadedDocs.some((d) => d.status === 'uploading');

  if (submitSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center px-4">
          <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Documents envoyés avec succès !</h2>
          <p className="text-gray-600 mb-6">Vos documents sont bien enregistrés dans votre dossier. Nos experts les examineront sous 24h.</p>
          <p className="text-sm text-gray-500">Redirection vers votre espace en cours...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Téléverser mes documents</h1>
          <p className="text-gray-600">Bonjour {candidate?.fullName?.split(' ')[0]}, déposez vos documents ci-dessous.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-4 border-dashed rounded-2xl p-10 text-center mb-8 transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400'
          }`}
        >
          <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Déposez vos documents ici</h3>
          <p className="text-gray-600 mb-4">ou cliquez pour parcourir votre ordinateur</p>
          <label className="inline-block cursor-pointer">
            <input type="file" multiple onChange={handleFileInput} className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
            <span className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 px-4">
              Sélectionner des fichiers
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-4">Formats acceptés : PDF, DOC, DOCX, JPG, PNG (Max 10 Mo par fichier)</p>
        </motion.div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOCUMENT_TYPES.map((docType) => (
            <Card key={docType.id} className="p-4 border-2 border-gray-200">
              <p className="text-lg font-bold text-gray-900">{docType.label}</p>
              <p className="text-sm text-gray-600">{docType.description}</p>
            </Card>
          ))}
        </div>

        {/* Résultat de l'analyse automatique du passeport */}
        {passportAnalysis && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card className="p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold">
                  🛂
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-950">Rapport d'analyse automatique du Passeport</h3>
                  <p className="text-xs text-blue-700">Vérification instantanée de lisibilité et de conformité</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <p className="text-xs text-gray-500 font-medium">Score de lisibilité</p>
                  <p className="text-xl font-black text-emerald-600 mt-1">{passportAnalysis.readabilityScore}%</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <p className="text-xs text-gray-500 font-medium">Zone biographique</p>
                  <p className="text-sm font-bold text-gray-800 mt-1">{passportAnalysis.checks.hasBiographicZone ? 'Détectée ✓' : 'Non détectée ⚠'}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-blue-100">
                  <p className="text-xs text-gray-500 font-medium">Statut de validité</p>
                  <p className="text-sm font-bold text-emerald-700 mt-1">{passportAnalysis.extractedInfo?.estimatedValidityStatus || 'Conforme'}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-blue-100 text-xs text-gray-700 space-y-1">
                <p className="font-bold text-blue-900">Recommandation du système :</p>
                <p>{passportAnalysis.recommendation}</p>
              </div>

              {/* Aperçu visuel annoté du passeport */}
              {passportAnalysis.annotatedZones && passportAnalysis.annotatedZones.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-3">
                  <p className="font-bold text-blue-950 text-sm">Marqueurs visuels de lisibilité sur le document :</p>
                  <div className="relative w-full h-48 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="absolute text-center text-gray-400 text-xs px-4">
                      📄 Aperçu radiographique du scan analysé (Zone d'identification)
                    </div>
                    {passportAnalysis.annotatedZones.map((zone: any) => {
                      const borderColor = zone.severity === 'success' ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200' : zone.severity === 'warning' ? 'border-amber-400 bg-amber-500/10 text-amber-200' : 'border-rose-400 bg-rose-500/10 text-rose-200';
                      return (
                        <div
                          key={zone.id}
                          style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
                          className={`absolute border-2 rounded-md p-1 flex flex-col justify-between backdrop-blur-[1px] transition-all hover:scale-[1.02] cursor-pointer ${borderColor}`}
                          title={zone.description}
                        >
                          <span className="text-[10px] font-bold px-1 bg-black/60 rounded text-white truncate inline-block">
                            {zone.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {passportAnalysis.annotatedZones.map((zone: any) => (
                      <div key={`legend-${zone.id}`} className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${zone.severity === 'success' ? 'bg-emerald-500' : zone.severity === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                        <div>
                          <strong className="text-gray-900">{zone.label} :</strong> {zone.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {uploadedDocs.length > 0 && (
          <div className="mb-8 space-y-3">
            <h3 className="font-bold text-gray-900">Vos documents ({uploadedDocs.length})</h3>
            <AnimatePresence>
              {uploadedDocs.map((doc) => (
                <motion.div key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                        <select
                          value={doc.type}
                          onChange={(e) => updateDocumentType(doc.id, e.target.value)}
                          className="text-sm text-gray-500 mt-1 border border-gray-200 rounded px-2 py-1"
                          disabled={doc.status === 'uploading'}
                        >
                          {DOCUMENT_TYPES.map((t) => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                        {doc.status === 'uploading' && (
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                            <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${doc.progress}%` }} />
                          </div>
                        )}
                        {doc.status === 'error' && <p className="text-xs text-red-600 mt-1">{doc.error}</p>}
                      </div>
                      {doc.status === 'uploading' && <Loader className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />}
                      {doc.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />}
                      {doc.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                      <button onClick={() => removeDocument(doc.id)} aria-label="Retirer" className="text-gray-400 hover:text-red-600 flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {globalError && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {globalError}
          </div>
        )}

        <Button
          onClick={handleFinish}
          disabled={!hasCompletedDocs || hasUploading}
          className="w-full py-6 text-base bg-green-600 hover:bg-green-700"
        >
          {hasUploading ? 'Envoi en cours...' : 'Terminer et voir mon espace'}
        </Button>
      </div>
    </div>
  );
}
