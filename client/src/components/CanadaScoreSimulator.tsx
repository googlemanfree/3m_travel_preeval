import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator, Award, ArrowRight, CheckCircle2, AlertCircle, BarChart3, Filter, HelpCircle, TrendingUp, TrendingDown, Download, Lightbulb, Check, Copy, Eye, ListChecks } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { CEC_SIX_MONTH_CRS_HISTORY, CRS_HISTORY_SOURCE } from "@/data/crsHistoricalRounds";
import { SafeResponsiveChart } from "@/components/SafeResponsiveChart";

export default function CanadaScoreSimulator() {
  const { language } = useLanguage();
  const [age, setAge] = useState<string>("26-35");
  const [education, setEducation] = useState<string>("master");
  const [experience, setExperience] = useState<string>("3-plus");
  const [french, setFrench] = useState<string>("advanced");
  const [english, setEnglish] = useState<string>("intermediate");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewError, setPdfPreviewError] = useState<string | null>(null);
  const [completedRecommendations, setCompletedRecommendations] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("3m-crs-recommendation-checklist") ?? "{}");
    } catch {
      return {};
    }
  });

  // Données officielles enrichies des rondes d'invitation IRCC Express Entry (Août 2026) avec descriptions détaillées
  const allRounds = [
    {
      roundNum: "Ronde #435",
      category: "cec",
      type: "Canadian Experience Class (CEC)",
      date: "7 août 2026",
      minScore: 470,
      invitations: 300,
      description: "Réservée aux candidats justifiant d'une première expérience de travail qualifiée acquise au Canada."
    },
    {
      roundNum: "Ronde #434",
      category: "sante",
      type: "Catégoriel (Professions en santé)",
      date: "24 juillet 2026",
      minScore: 485,
      invitations: 1500,
      description: "Ciblage prioritaire des professionnels de la santé qualifiés pour combler les pénuries de main-d'œuvre."
    },
    {
      roundNum: "Ronde #433",
      category: "general",
      type: "Général / Toutes catégories",
      date: "10 juillet 2026",
      minScore: 512,
      invitations: 3200,
      description: "Tirage toutes catégories confondues ouvert à l'ensemble du bassin Entrée Express sans restriction de secteur."
    },
    {
      roundNum: "Ronde #432",
      category: "provincial",
      type: "Candidats des Provinces (PNP)",
      date: "28 juin 2026",
      minScore: 720,
      invitations: 950,
      description: "Inclut automatiquement un bonus de 600 points accordé suite à une nomination par une province canadienne."
    },
    {
      roundNum: "Ronde #431",
      category: "cec",
      type: "Canadian Experience Class (CEC)",
      date: "15 juin 2026",
      minScore: 478,
      invitations: 1200,
      description: "Second tirage ciblé sur l'expérience canadienne avec un volume d'invitations soutenu."
    },
    {
      roundNum: "Ronde #430",
      category: "general",
      type: "Général / Toutes catégories",
      date: "2 juin 2026",
      minScore: 518,
      invitations: 3000,
      description: "Tirage général de référence pour les candidats FSW, CEC et FST."
    }
  ];

  const categoryExplanations: Record<string, string> = {
    all: "Affichage par défaut des 3 dernières rondes de tous programmes confondus pour avoir une vue d'ensemble du marché.",
    cec: "Classe de l'expérience canadienne (CEC) : Destiné aux candidats ayant déjà travaillé au Canada (seuils compétitifs).",
    provincial: "Programme des candidats des provinces (PNP) : Inclut 600 points bonus de nomination provinciale.",
    sante: "Tirage ciblé Professions en santé : Destiné aux profils médicaux et paramédicaux recherchés en priorité.",
    general: "Tirages tous programmes (Général) : Concerne l'ensemble des bassins FSW, CEC et Métiers spécialisés."
  };

  const filteredRounds = selectedCategory === "all"
    ? allRounds.slice(0, 3)
    : allRounds.filter(r => r.category === selectedCategory);

  const latestThreshold = filteredRounds.length > 0 ? filteredRounds[0].minScore : 500;

  // Calcul indicatif CRS
  const getSubScores = () => {
    let agePts = 110;
    if (age === "20-29") agePts = 110;
    else if (age === "30" || age === "18-19" || age === "31-35") agePts = 95;
    else if (age === "36-40") agePts = 70;
    else agePts = 30;

    let eduPts = 120;
    if (education === "phd") eduPts = 140;
    else if (education === "master") eduPts = 135;
    else if (education === "bachelor") eduPts = 120;
    else eduPts = 90;

    let expPts = 70;
    if (experience === "3-plus") expPts = 70;
    else if (experience === "2") expPts = 53;
    else expPts = 35;

    let langPts = 0;
    if (french === "advanced") langPts += 60;
    else if (french === "intermediate") langPts += 30;
    if (english === "advanced") langPts += 50;
    else if (english === "intermediate") langPts += 30;

    const bonusPts = 45;
    const total = Math.min(600, agePts + eduPts + expPts + langPts + bonusPts);

    return {
      agePts, maxAge: 110,
      eduPts, maxEdu: 140,
      expPts, maxExp: 70,
      langPts, maxLang: 110,
      total
    };
  };

  const scores = getSubScores();
  const scoreDiff = scores.total - latestThreshold;
  const isThresholdMet = scoreDiff >= 0;
  const isEligible = scores.total >= 420;

  // Recommandations personnalisées si l'écart est négatif
  const getRecommendations = () => {
    const recs = [];
    if (french !== "advanced") {
      recs.push({
        title: "Améliorer votre score en Français (TEF/TCF)",
        desc: "Passer à un niveau avancé (NCLC 7+) peut vous apporter jusqu'à 60 points bonus décisifs."
      });
    }
    if (english !== "advanced") {
      recs.push({
        title: "Optimiser votre test d'Anglais (IELTS Général)",
        desc: "Atteindre le niveau CLB 9 (IELTS 8.0 en écoute, 7.0 ailleurs) consolidera votre dossier."
      });
    }
    if (education === "bachelor" || education === "diploma") {
      recs.push({
        title: "Poursuivre ou évaluer un Master",
        desc: "Un diplôme supérieur ou une évaluation comparative des diplômes (ECA) additionnelle peut accroître vos points."
      });
    }
    if (experience !== "3-plus") {
      recs.push({
        title: "Valoriser l'expérience professionnelle qualifiée",
        desc: "Cumuler 3 années pleines d'expérience à temps plein (NOC TEER 0, 1, 2 ou 3) maximisera votre volet professionnel."
      });
    }
    if (recs.length === 0) {
      recs.push({
        title: "Obtenir une nomination provinciale (PNP)",
        desc: "Votre profil est très solide. Explorez les volets provinciaux pour décrocher 600 points bonus."
      });
    }
    return recs;
  };

  const recommendations = getRecommendations();

  useEffect(() => {
    localStorage.setItem("3m-crs-recommendation-checklist", JSON.stringify(completedRecommendations));
  }, [completedRecommendations]);

  const toggleRecommendation = (title: string) => {
    setCompletedRecommendations((current) => ({ ...current, [title]: !current[title] }));
  };

  const completedRecommendationCount = recommendations.filter((recommendation) => completedRecommendations[recommendation.title]).length;

  const createPdfDocument = () => {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const generatedAt = new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      doc.setFillColor(15, 45, 91);
      doc.rect(0, 0, 210, 32, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("3M Travel & Services", 15, 14);
      doc.setFontSize(11);
      doc.text("Synthèse de simulation CRS — Canada", 15, 22);

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(10);
      doc.text(`Document généré le ${generatedAt}. Les résultats sont indicatifs et ne constituent pas une garantie d'invitation.`, 15, 42, { maxWidth: 180 });

      doc.setFillColor(isThresholdMet ? 236 : 254, isThresholdMet ? 253 : 242, isThresholdMet ? 245 : 242);
      doc.roundedRect(15, 51, 180, 29, 3, 3, "F");
      doc.setTextColor(isThresholdMet ? 6 : 153, isThresholdMet ? 95 : 27, isThresholdMet ? 70 : 27);
      doc.setFontSize(11);
      doc.text("Score CRS simulé", 21, 62);
      doc.setFontSize(20);
      doc.text(`${scores.total} pts`, 21, 73);
      doc.setFontSize(11);
      doc.text(`Dernier seuil comparé : ${latestThreshold} pts`, 105, 62);
      doc.setFontSize(16);
      doc.text(`Écart : ${scoreDiff >= 0 ? "+" : ""}${scoreDiff} pts`, 105, 73);

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(13);
      doc.text("Répartition détaillée du score CRS", 15, 93);
      autoTable(doc, {
        startY: 98,
        head: [["Composante", "Points obtenus", "Maximum indicatif"]],
        body: [
          ["Âge", `${scores.agePts} pts`, `${scores.maxAge} pts`],
          ["Études", `${scores.eduPts} pts`, `${scores.maxEdu} pts`],
          ["Expérience professionnelle", `${scores.expPts} pts`, `${scores.maxExp} pts`],
          ["Compétences linguistiques", `${scores.langPts} pts`, `${scores.maxLang} pts`],
          ["Total simulé", `${scores.total} pts`, "600 pts"],
        ],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [30, 64, 175] },
        alternateRowStyles: { fillColor: [239, 246, 255] },
      });

      const afterScoreTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 145;
      doc.setFontSize(13);
      doc.text("Rondes IRCC comparées", 15, afterScoreTable + 14);
      autoTable(doc, {
        startY: afterScoreTable + 19,
        head: [["Ronde", "Catégorie", "Date", "Seuil CRS", "Invitations"]],
        body: filteredRounds.map((round) => [
          round.roundNum,
          round.type,
          round.date,
          `${round.minScore} pts`,
          String(round.invitations),
        ]),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [15, 45, 91] },
        columnStyles: { 1: { cellWidth: 65 } },
      });

      const afterRoundsTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200;
      if (!isThresholdMet) {
        doc.setFontSize(13);
        doc.text("Pistes d'amélioration personnalisées", 15, afterRoundsTable + 14);
        autoTable(doc, {
          startY: afterRoundsTable + 19,
          head: [["Action recommandée", "Détail"]],
          body: recommendations.map((recommendation) => [recommendation.title, recommendation.desc]),
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: [180, 83, 9] },
          columnStyles: { 0: { cellWidth: 58 }, 1: { cellWidth: 122 } },
        });
      }

      return doc;
  };

  const handlePreviewPDF = () => {
    setPdfPreviewError(null);
    setIsPreviewOpen(true);
    try {
      if (pdfPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfPreviewUrl);
      const previewBlob = createPdfDocument().output("blob");
      setPdfPreviewUrl(URL.createObjectURL(previewBlob));
    } catch {
      setPdfPreviewUrl(null);
      setPdfPreviewError("La prévisualisation n’a pas pu être générée. Vous pouvez réessayer ou télécharger le rapport directement.");
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      createPdfDocument().save(`simulation-crs-canada-${new Date().toISOString().slice(0, 10)}.pdf`);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyResults = async () => {
    setIsCopying(true);
    const summary = [
      "Simulation CRS Canada — 3M Travel & Services",
      `Score estimé : ${scores.total} / 600 points`,
      `Catégorie comparée : ${selectedCategory === "all" ? "3 dernières rondes (global)" : categoryExplanations[selectedCategory]}`,
      `Dernier seuil : ${latestThreshold} points`,
      `Écart : ${scoreDiff >= 0 ? "+" : ""}${scoreDiff} points`,
      "Rondes comparées :",
      ...filteredRounds.map((round) => `${round.roundNum} — ${round.type} — ${round.minScore} pts (${round.date})`),
      "Résultat indicatif : à confirmer avec un conseiller 3M Travel.",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = summary;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    } finally {
      setCopySuccess(true);
      setIsCopying(false);
      setTimeout(() => setCopySuccess(false), 3500);
    }
  };

  const getWhatsappMessage = () => {
    const text = language === 'fr'
      ? `Bonjour 3M Travel, j’ai évalué mon profil pour le Canada. Mon score estimé est de ${scores.total} points (Écart vs dernier seuil ${latestThreshold} pts: ${scoreDiff >= 0 ? '+' + scoreDiff : scoreDiff}). Je souhaite être accompagné par un conseiller.`
      : `Hello 3M Travel, I have evaluated my profile for Canada. My estimated score is ${scores.total} points (Diff vs threshold ${latestThreshold}: ${scoreDiff >= 0 ? '+' + scoreDiff : scoreDiff}). I would like to get advisor support.`;
    return encodeURIComponent(text);
  };

  return (
    <Card className="border-2 border-blue-100 shadow-xl bg-white overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/30 rounded-xl">
              <Calculator className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {language === 'fr' ? 'Simulateur d’Éligibilité & Score CRS Canada' : 'Canada CRS Score & Eligibility Simulator'}
              </CardTitle>
              <CardDescription className="text-blue-200 mt-1">
                {language === 'fr'
                  ? 'Évaluez vos points pour l’Entrée Express et comparez avec les rondes d’invitation IRCC.'
                  : 'Evaluate your Express Entry points and compare with IRCC invitation rounds.'}
              </CardDescription>
            </div>
          </div>

          <Button
            onClick={handlePreviewPDF}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 gap-2 font-medium"
          >
            <Eye className="w-4 h-4" />
            <span>Prévisualiser le rapport PDF</span>
          </Button>
        </div>
      </CardHeader>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl h-[88vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-3 border-b">
            <DialogTitle>Prévisualisation du rapport de simulation CRS</DialogTitle>
            <DialogDescription>
              Vérifiez les sous-scores, le seuil, l’écart et les rondes comparées avant de télécharger votre document.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 p-3 min-h-0">
            {pdfPreviewUrl ? (
              <iframe title="Prévisualisation du rapport CRS" src={pdfPreviewUrl} className="w-full h-full bg-white rounded-md border" />
            ) : pdfPreviewError ? (
              <div className="h-full flex items-center justify-center text-sm text-red-700 text-center px-8">{pdfPreviewError}</div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Préparation de la prévisualisation…</div>
            )}
          </div>
          <DialogFooter className="p-4 border-t bg-white flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Fermer</Button>
            <Button onClick={handleExportPDF} disabled={isExporting} className="gap-2">
              {exportSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              {exportSuccess ? "Téléchargement lancé" : isExporting ? "Préparation…" : "Télécharger le PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CardContent className="p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Âge */}
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800">
              {language === 'fr' ? 'Tranche d’âge' : 'Age Group'}
            </Label>
            <Select value={age} onValueChange={setAge}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner l'âge" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="18-19">18 - 19 ans</SelectItem>
                <SelectItem value="20-29">20 - 29 ans (Optimal)</SelectItem>
                <SelectItem value="30">30 ans</SelectItem>
                <SelectItem value="31-35">31 - 35 ans</SelectItem>
                <SelectItem value="36-40">36 - 40 ans</SelectItem>
                <SelectItem value="41-plus">41 ans et plus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Niveau d'études */}
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800">
              {language === 'fr' ? 'Niveau d’études' : 'Education Level'}
            </Label>
            <Select value={education} onValueChange={setEducation}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner le diplôme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phd">Doctorat / PhD</SelectItem>
                <SelectItem value="master">Master / Bac+5</SelectItem>
                <SelectItem value="bachelor">Licence / Bac+3</SelectItem>
                <SelectItem value="diploma">BTS / DUT / Diplôme collégial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expérience */}
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800">
              {language === 'fr' ? 'Expérience professionnelle' : 'Work Experience'}
            </Label>
            <Select value={experience} onValueChange={setExperience}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Années d'expérience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3-plus">3 ans ou plus</SelectItem>
                <SelectItem value="2">2 ans</SelectItem>
                <SelectItem value="1">1 an</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Français */}
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800">
              {language === 'fr' ? 'Maîtrise du Français (TEF/TCF)' : 'French Proficiency'}
            </Label>
            <Select value={french} onValueChange={setFrench}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Niveau de français" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="advanced">Avancé (NCLC 7+)</SelectItem>
                <SelectItem value="intermediate">Intermédiaire (NCLC 5-6)</SelectItem>
                <SelectItem value="beginner">Débutant ou Aucun</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Anglais */}
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800">
              {language === 'fr' ? 'Maîtrise de l’Anglais (IELTS/CELPIP)' : 'English Proficiency'}
            </Label>
            <Select value={english} onValueChange={setEnglish}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Niveau d'anglais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="advanced">Avancé (CLB 9+)</SelectItem>
                <SelectItem value="intermediate">Intermédiaire (CLB 7-8)</SelectItem>
                <SelectItem value="beginner">Débutant ou Aucun</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Résultat et Score */}
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              <Award className="w-4 h-4" /> Score CRS Indicatif
            </span>
            <div className="text-4xl md:text-5xl font-extrabold text-blue-900">
              {scores.total} <span className="text-lg font-normal text-gray-600">/ 600 pts</span>
            </div>
            <p className="text-sm text-gray-600 max-w-md">
              {isEligible
                ? 'Félicitations ! Votre profil atteint le seuil compétitif estimé pour l’accès prioritaire aux programmes.'
                : 'Votre score est perfectible. Suivez nos recommandations ci-dessous pour booster votre dossier.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {isEligible ? (
              <a
                  href="#voies-canada"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all"
              >
                <span>Découvrir les programmes</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <a
                href={`https://wa.me/237698104832?text=${getWhatsappMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-all"
              >
                <span>Consulter un conseiller (WhatsApp)</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Indicateur visuel d'écart dynamique (Vert si suffisant, Rouge si insuffisant) */}
        <motion.div
          initial={false}
          animate={{
            backgroundColor: isThresholdMet ? "rgba(236, 253, 245, 0.9)" : "rgba(254, 242, 242, 0.9)",
            borderColor: isThresholdMet ? "rgb(110, 231, 183)" : "rgb(252, 165, 165)",
          }}
          transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${isThresholdMet ? 'text-emerald-950' : 'text-red-950'}`}
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl text-white ${isThresholdMet ? 'bg-emerald-600' : 'bg-red-600'}`}>
              {isThresholdMet ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            </div>
            <div>
              <h5 className="font-bold text-sm">
                {isThresholdMet ? 'Objectif de score atteint avec succès !' : 'Score inférieur au dernier seuil de la catégorie'}
              </h5>
              <p className="text-xs opacity-90">
                {isThresholdMet
                  ? `Votre score dépasse de +${scoreDiff} points le seuil de référence (${latestThreshold} pts).`
                  : `Il vous manque ${Math.abs(scoreDiff)} points pour égaler le dernier seuil de cette catégorie (${latestThreshold} pts).`}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl shadow-xs border text-center shrink-0 font-extrabold text-base bg-white ${isThresholdMet ? 'text-emerald-700 border-emerald-200' : 'text-red-700 border-red-200'}`}>
            {scoreDiff >= 0 ? `+${scoreDiff} pts` : `${scoreDiff} pts`}
          </div>
        </motion.div>

        {/* Section de recommandations personnalisées (affichée si l'écart est négatif) */}
        {!isThresholdMet && (
          <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-amber-900 font-bold text-base">
              <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <h4>Recommandations personnalisées pour combler l'écart ({Math.abs(scoreDiff)} pts)</h4>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                <ListChecks className="w-3.5 h-3.5" /> {completedRecommendationCount}/{recommendations.length} action{recommendations.length > 1 ? "s" : ""} suivie{completedRecommendationCount > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-amber-800">
              Cochez les actions que vous avez prévues ou commencées. Votre suivi est conservé sur cet appareil.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {recommendations.map((rec, i) => (
                <label key={i} className={`p-4 bg-white rounded-xl border shadow-xs space-y-2 cursor-pointer transition-colors ${completedRecommendations[rec.title] ? "border-emerald-300 bg-emerald-50/50" : "border-amber-100 hover:border-amber-300"}`}>
                  <span className="flex items-start gap-2.5">
                    <Checkbox
                      checked={Boolean(completedRecommendations[rec.title])}
                      onCheckedChange={() => toggleRecommendation(rec.title)}
                      aria-label={`Marquer comme suivie : ${rec.title}`}
                      className="mt-0.5"
                    />
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      {completedRecommendations[rec.title] ? <Check className="w-4 h-4 text-emerald-600" /> : <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                      {rec.title}
                    </span>
                  </span>
                  <p className="text-xs text-gray-600 pl-6">{rec.desc}</p>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Graphique comparatif avec filtre par catégorie et infobulles explicatives */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-gray-900 text-lg">Comparatif des rondes d’invitation IRCC</h4>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[210px] bg-white text-sm">
                  <SelectValue placeholder="Filtrer par programme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">3 Dernières (Global)</SelectItem>
                  <SelectItem value="cec">Canadian Exp. (CEC)</SelectItem>
                  <SelectItem value="provincial">Provincial (PNP)</SelectItem>
                  <SelectItem value="sante">Santé (Catégoriel)</SelectItem>
                  <SelectItem value="general">Général (Toutes cat.)</SelectItem>
                </SelectContent>
              </Select>

              {/* Infobulle globale sur les critères de catégorie */}
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" aria-label="Aide sur les catégories">
                      <HelpCircle className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm text-xs p-3 space-y-1.5">
                    <p className="font-bold text-blue-900">Critères des catégories IRCC :</p>
                    <p>• <b>CEC</b> : Expérience canadienne requise.</p>
                    <p>• <b>PNP</b> : Nomination provinciale (+600 pts).</p>
                    <p>• <b>Santé</b> : Professions ciblées par le gouvernement.</p>
                    <p>• <b>Général</b> : Bassin global Entrée Express.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyResults}
              disabled={isCopying}
              className="gap-2 border-blue-200 text-blue-800 hover:bg-blue-50"
            >
              {copySuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copySuccess ? "Résultats copiés" : isCopying ? "Copie..." : "Copier les résultats"}
            </Button>
          </div>

          {/* Encart explicatif de la catégorie active */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm text-blue-900">
              <span className="font-semibold block mb-0.5">Règle de sélection :</span>
              {categoryExplanations[selectedCategory] || categoryExplanations.all}
            </div>
          </div>

          {filteredRounds.length === 0 ? (
            <div className="p-8 rounded-2xl bg-gray-50 border border-dashed border-gray-300 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm font-medium text-gray-700">Aucune ronde enregistrée pour cette catégorie dans la période récente.</p>
              <Button variant="outline" size="sm" onClick={() => setSelectedCategory("all")}>
                Réinitialiser le filtre
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {filteredRounds.map((round, idx) => {
                const diff = scores.total - round.minScore;
                const isAbove = diff >= 0;
                return (
                  <div key={idx} className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-bl-xl border-l border-b border-blue-100">
                      {round.roundNum}
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 font-medium">{round.date}</span>
                      <h5 className="font-semibold text-gray-900 text-sm leading-snug">{round.type}</h5>
                      <p className="text-xs text-gray-600 pt-1">{round.description}</p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-500">Seuil CRS minimal :</span>
                        <span className="text-xl font-extrabold text-blue-900">{round.minScore} pts</span>
                      </div>

                      {/* Barre comparative visuelle */}
                      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (round.minScore / 600) * 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-gray-500">{round.invitations} invitations</span>
                        <span className={`font-semibold px-2 py-0.5 rounded ${isAbove ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {isAbove ? `+${diff} pts au-dessus` : `${diff} pts requis`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-3 mt-2 border-t border-blue-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <h5 className="font-bold text-gray-900">Évolution des seuils CRS CEC sur six mois</h5>
                <p className="text-xs text-gray-600">Une série homogène Canadian Experience Class pour suivre la tendance mensuelle sans mélanger les catégories de tirage.</p>
              </div>
              <span className="text-xs font-semibold text-blue-800 bg-blue-50 rounded-full px-2.5 py-1">Mars → Août 2026</span>
            </div>
            <SafeResponsiveChart className="h-[280px] w-full" label="Graphique de l'évolution des seuils CRS CEC de mars à août 2026">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...CEC_SIX_MONTH_CRS_HISTORY]} margin={{ top: 15, right: 18, left: -14, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#475569" }} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
                  <YAxis domain={[500, 530]} tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} width={42} />
                  <RechartsTooltip
                    formatter={(value: number) => [`${value} points`, "Seuil CRS"]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload ? `${payload[0].payload.date} · ${payload[0].payload.round}` : ""}
                    contentStyle={{ borderRadius: 12, borderColor: "#bfdbfe", fontSize: 12 }}
                  />
                  <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="minScore" name="Seuil CRS CEC" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </SafeResponsiveChart>
            <p className="text-[11px] text-slate-500">
              Source : <a className="underline hover:text-blue-700" href={CRS_HISTORY_SOURCE.url} target="_blank" rel="noreferrer">{CRS_HISTORY_SOURCE.organization}</a> — données vérifiées le {new Date(CRS_HISTORY_SOURCE.verifiedAt).toLocaleDateString("fr-FR")}. Les seuils peuvent varier à chaque ronde.
            </p>
          </div>
        </div>

        {/* Barres de progression par critère et infobulles */}
        <div className="space-y-4 pt-6 border-t border-gray-100">
          <h4 className="font-bold text-gray-900 text-lg">Analyse détaillée par sous-critères</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Âge */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-700">Âge</span>
                <span className="text-blue-700 font-bold">{scores.agePts} / {scores.maxAge} pts</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(scores.agePts / scores.maxAge) * 100}%` }} />
              </div>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-left text-xs text-gray-500 underline decoration-dotted outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Conseil d’amélioration &gt;</button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p>Le capital points d’âge est maximal entre 20 et 29 ans. Pensez à déposer rapidement votre dossier.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Diplômes */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-700">Diplômes / Études</span>
                <span className="text-blue-700 font-bold">{scores.eduPts} / {scores.maxEdu} pts</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(scores.eduPts / scores.maxEdu) * 100}%` }} />
              </div>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-left text-xs text-gray-500 underline decoration-dotted outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Conseil d’amélioration &gt;</button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p>Un Master ou un Doctorat ou une double diplomation augmente significativement votre score académique.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Expérience */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-700">Expérience Pro</span>
                <span className="text-blue-700 font-bold">{scores.expPts} / {scores.maxExp} pts</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(scores.expPts / scores.maxExp) * 100}%` }} />
              </div>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-left text-xs text-gray-500 underline decoration-dotted outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Conseil d’amélioration &gt;</button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p>Justifier de 3 ans ou plus d’expérience qualifiée (NOC TEER 0, 1, 2 ou 3) maximise ce volet.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Langues */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-700">Compétences Linguistiques</span>
                <span className="text-blue-700 font-bold">{scores.langPts} / {scores.maxLang} pts</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(scores.langPts / scores.maxLang) * 100}%` }} />
              </div>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-left text-xs text-gray-500 underline decoration-dotted outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Conseil d’amélioration &gt;</button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p>Le bilinguisme (Français NCLC 7 + Anglais CLB 9) est le moyen le plus rapide de gagner jusqu'à 60 points bonus.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <a
              href={`https://wa.me/237698104832?text=${getWhatsappMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1.5"
            >
              <span>Réserver une consultation conseiller &gt;</span>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
