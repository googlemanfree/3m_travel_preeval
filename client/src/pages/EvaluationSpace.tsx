import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Download, Share2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface CVReport {
  score: number;
  verdict: string;
  cvAnalysis: {
    detectedDegree: string;
    totalExperienceYears: string;
    keySkills: string[];
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface Candidate {
  folderCode: string;
  fullName: string;
  projectType: string;
  destinationCountry: string;
  status: 'PENDING_48H' | 'PUBLISHED';
  submittedAt: string;
  report: CVReport | null;
}

const EVALUATION_API_URL = import.meta.env.VITE_EVALUATION_API_URL || 'https://evaluation-api.3mtravelagency.click';

export default function EvaluationSpace() {
  const [, setLocation] = useLocation();
  const [folderCode, setFolderCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');

  // Récupérer le code dossier depuis l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('dossier');
    if (code) {
      setFolderCode(code);
      fetchEvaluation(code);
    }
  }, []);

  // Récupérer l'évaluation depuis le serveur
  const fetchEvaluation = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${EVALUATION_API_URL}/api/candidates/my-space/${code}`);
      if (!response.ok) {
        throw new Error('Dossier non trouvé');
      }
      const data = await response.json();
      if (data.success) {
        setCandidate(data.candidate);
      } else {
        setError(data.message || 'Erreur lors de la récupération du dossier');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setFolderCode(searchInput.trim());
      fetchEvaluation(searchInput.trim());
    }
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict.includes('Très Favorable')) return 'bg-green-100 text-green-800';
    if (verdict.includes('Favorable')) return 'bg-blue-100 text-blue-800';
    return 'bg-orange-100 text-orange-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    return 'text-orange-600';
  };

  const downloadPDF = () => {
    if (!candidate?.report) return;
    
    const content = `
3M TRAVEL AGENCY - BILAN D'ADMISSIBILITÉ OFFICIEL
================================================

Numéro de Dossier: ${candidate.folderCode}
Candidat: ${candidate.fullName}
Type de Projet: ${candidate.projectType}
Destination: ${candidate.destinationCountry}
Date de Soumission: ${new Date(candidate.submittedAt).toLocaleDateString('fr-FR')}

RÉSULTATS DE L'ÉVALUATION
========================

Score d'Admissibilité: ${candidate.report.score}/100
Verdict: ${candidate.report.verdict}

ANALYSE DU CV
=============
Diplôme Détecté: ${candidate.report.cvAnalysis.detectedDegree}
Expérience: ${candidate.report.cvAnalysis.totalExperienceYears}
Compétences Clés: ${candidate.report.cvAnalysis.keySkills.join(', ')}

POINTS FORTS
============
${candidate.report.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

POINTS À AMÉLIORER
==================
${candidate.report.weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n')}

RECOMMANDATIONS STRATÉGIQUES
=============================
${candidate.report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---
Généré par 3M Travel Agency
www.3mtravelagency.click
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `Bilan_${candidate.folderCode}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Bilan téléchargé avec succès');
  };

  const shareResult = async () => {
    const url = `${window.location.origin}/evaluation-space?dossier=${folderCode}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Lien copié dans le presse-papiers');
    } catch {
      toast.error('Erreur lors de la copie du lien');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Espace Candidat</h1>
          <p className="text-gray-600">Consultez votre bilan d'admissibilité officiel</p>
        </div>

        {/* Recherche de dossier */}
        {!candidate && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle>Accéder à votre dossier</CardTitle>
              <CardDescription>
                Entrez votre numéro de dossier (format: #3M-YYYYMMDD-XXXX)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Ex: #3M-20260728-5432"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rechercher'}
                </Button>
              </form>
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Chargement */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Résultats */}
        {candidate && (
          <>
            {/* Infos Candidat */}
            <Card className="mb-8 shadow-lg border-l-4 border-l-blue-600">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{candidate.fullName}</CardTitle>
                    <CardDescription className="mt-2">
                      Dossier: <span className="font-mono font-bold text-blue-600">{candidate.folderCode}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg py-1 px-3">
                    {candidate.projectType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Destination</p>
                    <p className="font-semibold text-lg">{candidate.destinationCountry}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <div className="flex items-center gap-2 mt-1">
                      {candidate.status === 'PUBLISHED' ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-600">Bilan Disponible</span>
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
                          <span className="font-semibold text-orange-600">En cours d'analyse (48h)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bilan Disponible */}
            {candidate.status === 'PUBLISHED' && candidate.report ? (
              <>
                {/* Score Principal */}
                <Card className="mb-8 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <CardTitle>Résultats de l'Évaluation</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {/* Score */}
                      <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Score d'Admissibilité</p>
                        <p className={`text-5xl font-bold ${getScoreColor(candidate.report.score)}`}>
                          {candidate.report.score}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">sur 100</p>
                      </div>

                      {/* Verdict */}
                      <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Verdict du Comité</p>
                        <Badge className={`${getVerdictColor(candidate.report.verdict)} text-base py-2 px-4`}>
                          {candidate.report.verdict}
                        </Badge>
                      </div>

                      {/* Analyse CV */}
                      <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Expérience Détectée</p>
                        <p className="font-semibold text-lg">{candidate.report.cvAnalysis.totalExperienceYears}</p>
                        <p className="text-xs text-gray-500 mt-2">{candidate.report.cvAnalysis.detectedDegree}</p>
                      </div>
                    </div>

                    {/* Compétences Clés */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-lg mb-3">Compétences Clés Identifiées</h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.report.cvAnalysis.keySkills.map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-sm py-1 px-3">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs pour détails */}
                <Card className="shadow-lg">
                  <Tabs defaultValue="strengths" className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none bg-gray-50 p-0">
                      <TabsTrigger value="strengths" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                        Points Forts
                      </TabsTrigger>
                      <TabsTrigger value="weaknesses" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                        Points à Améliorer
                      </TabsTrigger>
                      <TabsTrigger value="recommendations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                        Recommandations
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="strengths" className="p-6">
                      <ul className="space-y-3">
                        {candidate.report.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>

                    <TabsContent value="weaknesses" className="p-6">
                      <ul className="space-y-3">
                        {candidate.report.weaknesses.map((weakness, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>

                    <TabsContent value="recommendations" className="p-6">
                      <ul className="space-y-3">
                        {candidate.report.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                              {idx + 1}
                            </div>
                            <span className="text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                  </Tabs>
                </Card>

                {/* Actions */}
                <div className="flex gap-4 mt-8 justify-center">
                  <Button onClick={downloadPDF} size="lg" className="gap-2">
                    <Download className="w-4 h-4" />
                    Télécharger le Bilan
                  </Button>
                  <Button onClick={shareResult} variant="outline" size="lg" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Partager
                  </Button>
                </div>
              </>
            ) : (
              /* En attente */
              <Card className="shadow-lg border-l-4 border-l-orange-600">
                <CardContent className="pt-8">
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 text-orange-600 animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyse en cours</h3>
                    <p className="text-gray-600 mb-4">
                      Votre bilan d'admissibilité sera disponible dans <strong>48 heures</strong>.
                    </p>
                    <p className="text-sm text-gray-500">
                      Vous recevrez un email de confirmation dès que le bilan sera prêt.
                    </p>
                    <Button 
                      onClick={() => {
                        setCandidate(null);
                        setSearchInput('');
                      }}
                      variant="outline"
                      className="mt-6"
                    >
                      Rechercher un autre dossier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
