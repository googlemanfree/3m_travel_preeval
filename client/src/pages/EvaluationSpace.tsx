import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Share2,
  Loader2,
  ChevronRight,
  TrendingUp,
  FileText,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { CommentsSection } from "@/components/CommentsSection";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { exportBilanToPDF } from "@/lib/bilanPdfExporter";
import { DocumentUploader } from "@/components/DocumentUploader";
import { DocumentProgressBar } from "@/components/DocumentProgressBar";
import { AIScoreGauge } from "@/components/AIScoreGauge";
import ClientSpaceNavigation from "@/components/ClientSpaceNavigation";
import CandidateAvatar from "@/components/CandidateAvatar";
import DossierProgressTimeline from "@/components/DossierProgressTimeline";

export default function EvaluationSpace() {
  const [, setLocation] = useLocation();
  const { candidate, isAuthenticated } = useCandidateAuth();
  const [dossierNumber, setDossierNumber] = useState<string | null>(null);
  const [searchCode, setSearchCode] = useState<string>('');
  const [userDossierLoading, setUserDossierLoading] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState(0);
  const [requiredDocuments, setRequiredDocuments] = useState(5);

  // Fonction pour télécharger le bilan en PDF
  const handleDownloadBilanPDF = async () => {
    if (!bilanData) return;
    
    setIsExportingPDF(true);
    try {
      await exportBilanToPDF({
        dossierNumber: bilanData.dossierNumber || dossierNumber || '',
        fullName: bilanData.fullName,
        score: bilanData.score || 0,
        verdict: bilanData.verdict || '',
        strengths: bilanData.strengths,
        weaknesses: bilanData.weaknesses,
        recommendations: bilanData.recommendations,
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Récupérer le numéro de dossier depuis les paramètres d'URL ou depuis l'utilisateur connecté
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dossier = params.get("dossier");
    
    if (dossier) {
      setDossierNumber(dossier);
      setUserDossierLoading(false);
    } else if (isAuthenticated) {
      // Charger le dossier du candidat connecté (résolu depuis son JWT,
      // jamais depuis un email fourni côté client)
      setUserDossierLoading(false); // la vraie recherche se fait via la query dédiée ci-dessous
    } else {
      setUserDossierLoading(false);
    }
  }, [isAuthenticated, candidate]);

  // Récupérer le dossier réel du candidat connecté (authentifié via son JWT)
  const { data: myDossierData } = trpc.candidate.getMyDossierData.useQuery(undefined, {
    enabled: isAuthenticated && !dossierNumber,
  });

  useEffect(() => {
    if (!dossierNumber && myDossierData?.success && myDossierData.data?.application?.dossierNumber) {
      setDossierNumber(myDossierData.data.application.dossierNumber);
    }
  }, [myDossierData, dossierNumber]);

  // Récupérer le bilan
  const { data: bilanData, isLoading, error } = trpc.evaluationAI.getBilan.useQuery(
    { dossierNumber: dossierNumber || "" },
    { enabled: !!dossierNumber }
  );

  // Récupérer l'historique des évaluations Luxembourg du candidat connecté
  const { data: myEvaluations } = trpc.luxembourgEvaluation.getMyEvaluations.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Récupérer l'historique des pré-évaluations générales (avec rapport IA)
  const { data: myGeneralEvaluations } = trpc.evaluation.getMyEvaluations.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Récupérer l'historique des demandes de consultation (avec CV)
  const { data: myConsultations } = trpc.consultationRequest.getMyConsultations.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (userDossierLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto py-12">
          <Card className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chargement de votre espace...</h2>
            <p className="text-gray-600">Veuillez patienter</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!dossierNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto py-12">
          <ClientSpaceNavigation />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  !
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Dossier non trouvé</h2>
                <p className="text-gray-600 text-sm">
                  Veuillez vérifier votre numéro de dossier ou effectuer une recherche ci-dessous.
                </p>
              </div>

              {/* Évaluations Luxembourg du candidat connecté */}
              {myEvaluations && myEvaluations.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 mb-3">🌍 Vos évaluations Luxembourg</h3>
                  <div className="space-y-3">
                    {myEvaluations.map((ev) => (
                      <div key={ev.id} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div>
                          <p className="font-semibold text-gray-900">{ev.jobTitle}</p>
                          <p className="text-xs text-gray-500">{new Date(ev.createdAt).toLocaleDateString("fr-FR")}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600">{ev.scoreTotal}/100</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pré-évaluations générales, avec statut de l'analyse IA */}
              {myGeneralEvaluations && myGeneralEvaluations.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 mb-3">📋 Vos pré-évaluations</h3>
                  <div className="space-y-3">
                    {myGeneralEvaluations.map((ev) => (
                      <div key={ev.id} className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900">{ev.destinationCountry || ev.destinationCategory}</p>
                          <span className="text-xs text-gray-500">{new Date(ev.createdAt).toLocaleDateString("fr-FR")}</span>
                        </div>
                        {ev.aiReportContent ? (
                          <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-4">{ev.aiReportContent}</p>
                        ) : ev.aiProcessingError ? (
                          <p className="text-sm text-amber-600">Analyse IA en attente — notre équipe l'examinera manuellement.</p>
                        ) : ev.cvFileUrl ? (
                          <p className="text-sm text-blue-600 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Analyse IA en cours...
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">Dossier en attente d'analyse par notre équipe.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Demandes de consultation (validées par un admin uniquement) */}
              {myConsultations && myConsultations.filter((c) => c.status === "validated_sent").length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 mb-3">💬 Vos consultations</h3>
                  <div className="space-y-3">
                    {myConsultations.filter((c) => c.status === "validated_sent").map((c) => (
                      <div key={c.id} className="bg-green-50 border border-green-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-gray-900">{c.targetCountry || "Consultation générale"}</p>
                          <span className="text-xs text-gray-500">{c.sentToClientAt ? new Date(c.sentToClientAt).toLocaleDateString("fr-FR") : ""}</span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{c.finalReportContent}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {myConsultations && myConsultations.some((c) => c.status !== "validated_sent") && (
                <p className="text-sm text-gray-500 mb-8">
                  ⏳ Une ou plusieurs demandes de consultation sont en cours d'examen par notre équipe.
                </p>
              )}

              {/* Champ de recherche manuel */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchCode.trim()) {
                    setLocation(`/mon-espace?dossier=${encodeURIComponent(searchCode)}`);
                  }
                }}
                className="flex gap-2 mb-6"
              >
                <input
                  type="text"
                  placeholder="Ex: #3M-20260730-1234"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  Rechercher
                </Button>
              </form>

              {/* Boutons d'action */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setLocation("/evaluation")}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition"
                >
                  ⭐ Déposer une nouvelle évaluation
                </Button>
                <Button
                  onClick={() => setLocation("/")}
                  variant="outline"
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition"
                >
                  Retour à l'accueil
                </Button>
                <a
                  href="https://wa.me/237698104832?text=Bonjour%2C%20j'ai%20besoin%20d'aide%20pour%20accéder%20à%20mon%20dossier"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition text-center"
                >
                  💬 Support WhatsApp
                </a>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto py-12">
          <Card className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chargement...</h2>
            <p className="text-gray-600">Récupération de votre bilan</p>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto py-12">
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{error.message}</p>
            <Button onClick={() => setLocation("/")} className="bg-blue-600 hover:bg-blue-700">
              Retour à l'accueil
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!bilanData?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto py-12">
          {myDossierData?.data?.candidate && (
            <div className="flex items-center gap-4 mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <CandidateAvatar
                fullName={myDossierData.data.candidate.fullName || "Candidat"}
                avatarUrl={myDossierData.data.candidate.avatarUrl}
                size="md"
                editable
              />
              <div>
                <p className="font-bold text-gray-900">{myDossierData.data.candidate.fullName}</p>
                <p className="text-sm text-gray-500">{myDossierData.data.candidate.email}</p>
              </div>
            </div>
          )}
          {myDossierData?.data?.dossierStatus && (
            <div className="mb-6">
              <DossierProgressTimeline dossierStatus={myDossierData.data.dossierStatus} />
            </div>
          )}
          <Card className="p-8">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Bilan en cours de traitement
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Votre bilan sera disponible dans <strong>{bilanData?.remainingHours} heures</strong>
            </p>

            {/* Timeline */}
            <div className="space-y-4 my-8">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">✅ CV reçu</p>
                  <p className="text-sm text-gray-600">Votre dossier est enregistré</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Clock className="w-6 h-6 text-blue-500 flex-shrink-0 animate-spin" />
                <div>
                  <p className="font-semibold text-gray-900">⏳ Analyse en cours</p>
                  <p className="text-sm text-gray-600">
                    Nos experts analysent votre profil
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 opacity-50">
                <FileText className="w-6 h-6 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">📋 Bilan disponible</p>
                  <p className="text-sm text-gray-600">
                    Sera débloqué dans {bilanData?.remainingHours} heures
                  </p>
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Temps restant</p>
              <p className="text-3xl font-bold text-blue-600">
                {bilanData?.remainingHours}h
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Vous recevrez un email dès que votre bilan sera prêt
              </p>
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.reload()}
              >
                <Clock className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/")}
              >
                Retour à l'accueil
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Bilan disponible
  if (bilanData.bilanAvailable) {
    const score = bilanData.score || 0;
    const verdict = bilanData.verdict || "";
    const scoreColor =
      score >= 80 ? "text-green-600" : score >= 60 ? "text-orange-600" : "text-red-600";
    const scoreBg =
      score >= 80 ? "bg-green-50" : score >= 60 ? "bg-orange-50" : "bg-red-50";

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <ClientSpaceNavigation />

          {/* Profil du candidat */}
          {myDossierData?.data?.candidate && (
            <div className="flex items-center gap-4 mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <CandidateAvatar
                fullName={myDossierData.data.candidate.fullName || "Candidat"}
                avatarUrl={myDossierData.data.candidate.avatarUrl}
                size="md"
                editable
              />
              <div>
                <p className="font-bold text-gray-900">{myDossierData.data.candidate.fullName}</p>
                <p className="text-sm text-gray-500">{myDossierData.data.candidate.email}</p>
              </div>
            </div>
          )}

          {/* Suivi réel du dossier */}
          {myDossierData?.data?.dossierStatus && (
            <div className="mb-6">
              <DossierProgressTimeline dossierStatus={myDossierData.data.dossierStatus} />
            </div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Votre Bilan d'Admissibilité
              </h1>
            </div>
            <p className="text-gray-600">
              Dossier <strong>#{bilanData.dossierNumber}</strong>
            </p>
          </motion.div>

          {/* Document Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <DocumentProgressBar
              requiredDocuments={requiredDocuments}
              uploadedDocuments={uploadedDocuments}
              pendingDocuments={requiredDocuments - uploadedDocuments}
            />
          </motion.div>

          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`${scoreBg} p-8 mb-8 border-2 ${scoreColor.replace("text", "border")}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    SCORE D'ADMISSIBILITÉ
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-black ${scoreColor}`}>
                      {score}
                    </span>
                    <span className="text-2xl text-gray-400">/100</span>
                  </div>
                  <div className="mt-5 max-w-sm">
                    <AIScoreGauge score={score} label="Progression du score IA" />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">VERDICT</p>
                  <p className={`text-2xl font-bold ${scoreColor}`}>{verdict}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {score >= 80
                      ? "Profil très favorable pour votre projet"
                      : score >= 60
                        ? "Profil favorable, quelques points à renforcer"
                        : "Profil à renforcer avant soumission"}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Strengths */}
          {bilanData.strengths && bilanData.strengths.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <Card className="p-6 border-l-4 border-l-green-500">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-900">Points Forts</h3>
                </div>
                <ul className="space-y-2">
                  {bilanData.strengths.map((strength: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          )}

          {/* Weaknesses */}
          {bilanData.weaknesses && bilanData.weaknesses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <Card className="p-6 border-l-4 border-l-orange-500">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-bold text-gray-900">Points à Améliorer</h3>
                </div>
                <ul className="space-y-2">
                  {bilanData.weaknesses.map((weakness: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <ChevronRight className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          )}

          {/* Recommendations */}
          {bilanData.recommendations && bilanData.recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8"
            >
              <Card className="p-6 border-l-4 border-l-blue-500 bg-blue-50">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Recommandations</h3>
                </div>
                <ul className="space-y-2">
                  {bilanData.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          )}

          {/* Document Uploader */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-8"
          >
            <DocumentUploader
              dossierNumber={dossierNumber || ""}
              onUploadSuccess={() => {
                // Optionally refresh the page or show a success message
                console.log("Documents uploaded successfully");
              }}
            />
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownloadBilanPDF}
              disabled={isExportingPDF}
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger PDF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const text = `Découvrez mon bilan d'admissibilité: ${window.location.href}`;
                navigator.share?.({ title: "Mon Bilan 3M", text });
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => setLocation("/")}
            >
              Retour à l'accueil
            </Button>
          </motion.div>

          {/* Section des commentaires */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <CommentsSection
              dossierNumber={dossierNumber || ""}
              email={""}
              fullName={""}
              isAdmin={false}
            />
          </motion.div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <Card className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <h3 className="text-lg font-bold mb-2">Prêt à passer à l'étape suivante?</h3>
              <p className="mb-4">
                Contactez nos experts pour discuter de votre dossier et des prochaines étapes
              </p>
              <div className="flex gap-3">
                <a
                  href="https://wa.me/237698104832"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  💬 WhatsApp
                </a>
                <a
                  href="mailto:contact@3mtravelagency.click"
                  className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition"
                >
                  📧 Email
                </a>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
}
