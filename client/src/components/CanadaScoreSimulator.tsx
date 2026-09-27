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
import { toast } from "sonner";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { CEC_SIX_MONTH_CRS_HISTORY, CRS_HISTORY_SOURCE } from "@/data/crsHistoricalRounds";
import { SafeResponsiveChart } from "@/components/SafeResponsiveChart";
import { computeCrsScore, CRS_SOURCE, type CanadianEducationLevel, type CrsProfile, type EducationLevel, type ExperienceYears, type MaritalStatus } from "@shared/crsScore";

const EDUCATION_OPTIONS: Array<{ value: EducationLevel; label: string }> = [
  { value: "less_than_secondary", label: "Aucun diplôme / inférieur au secondaire" },
  { value: "secondary", label: "Diplôme d'études secondaires (Bac)" },
  { value: "one_year_postsecondary", label: "Programme postsecondaire d'un an (BTS, DUT 1re année…)" },
  { value: "two_year_postsecondary", label: "Programme postsecondaire de deux ans" },
  { value: "bachelor_or_three_year", label: "Licence / programme de trois ans ou plus" },
  { value: "two_or_more_credentials", label: "Deux diplômes ou plus (dont un de trois ans ou plus)" },
  { value: "master_or_professional", label: "Master / diplôme professionnel" },
  { value: "doctoral", label: "Doctorat (Ph. D.)" },
];

/** Paliers exacts de la grille officielle (0 = aucun test / sous CLB 4). */
const CLB_OPTIONS = [
  { value: 0, label: "Aucun test / sous le CLB 4" },
  { value: 4, label: "CLB 4-5" },
  { value: 6, label: "CLB 6" },
  { value: 7, label: "CLB 7" },
  { value: 8, label: "CLB 8" },
  { value: 9, label: "CLB 9" },
  { value: 10, label: "CLB 10 et plus" },
];

const EXPERIENCE_OPTIONS: Array<{ value: ExperienceYears; label: string }> = [
  { value: 0, label: "Aucune, ou moins d'un an" },
  { value: 1, label: "1 an" },
  { value: 2, label: "2 ans" },
  { value: 3, label: "3 ans" },
  { value: 4, label: "4 ans" },
  { value: 5, label: "5 ans ou plus" },
];

export default function CanadaScoreSimulator() {
  const { language } = useLanguage();
  // Score CRS réel (grille IRCC recoupée le 2026-09-27, voir shared/crsScore.ts) : chaque champ ci-dessous correspond
  // à une question précise de l'outil officiel, jamais à une simplification qui invente ou arrondit un barème.
  const [age, setAge] = useState<number>(30);
  const [education, setEducation] = useState<EducationLevel>("master_or_professional");
  const [canadianExperienceYears, setCanadianExperienceYears] = useState<ExperienceYears>(3);
  const [foreignExperienceYears, setForeignExperienceYears] = useState<ExperienceYears>(0);
  const [frenchClb, setFrenchClb] = useState<number>(4);
  const [englishClb, setEnglishClb] = useState<number>(9);
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>("without_spouse");
  const [spouseEducation, setSpouseEducation] = useState<EducationLevel>("bachelor_or_three_year");
  const [spouseClb, setSpouseClb] = useState<number>(0);
  const [spouseExperienceYears, setSpouseExperienceYears] = useState<ExperienceYears>(0);
  const [hasTradeCertificate, setHasTradeCertificate] = useState(false);
  const [canadianEducation, setCanadianEducation] = useState<CanadianEducationLevel>("none");
  const [hasSiblingInCanada, setHasSiblingInCanada] = useState(false);
  const [hasProvincialNomination, setHasProvincialNomination] = useState(false);
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

  // Calcul CRS réel (shared/crsScore.ts) : rien n'est arrondi ni estimé, chaque sous-score vient de la grille officielle IRCC.
  const crsProfile: CrsProfile = {
    age, maritalStatus, education, frenchClb, englishClb,
    canadianExperienceYears, foreignExperienceYears, hasTradeCertificate, canadianEducation,
    hasSiblingInCanada, hasProvincialNomination,
    spouse: maritalStatus === "with_spouse" ? { education: spouseEducation, firstLanguageClb: spouseClb, canadianExperienceYears: spouseExperienceYears } : null,
  };
  const scores = computeCrsScore(crsProfile);
  const scoreDiff = scores.total - latestThreshold;
  const isThresholdMet = scoreDiff >= 0;

  // Recommandations personnalisées : uniquement des leviers réels, absents ou incomplets dans le profil saisi.
  const getRecommendations = () => {
    const recs: Array<{ title: string; desc: string }> = [];
    const bestClb = Math.max(frenchClb, englishClb);
    if (frenchClb < 7) {
      recs.push({ title: "Faire reconnaître un niveau de français NCLC 7+", desc: "Un français d'au moins NCLC 7 (TEF/TCF) déclenche un bonus de 25 à 50 points, en plus des points de langue habituels." });
    }
    if (englishClb < 9) {
      recs.push({ title: "Viser le CLB 9 en anglais (IELTS/CELPIP)", desc: "Chaque palier de CLB gagné en langue rapporte des points, à la fois sur le volet langue et sur la transférabilité des compétences." });
    }
    if (scores.skillTransferability < 100) {
      recs.push({ title: "Combiner diplôme, expérience et langue", desc: "La transférabilité des compétences (jusqu'à 100 points) récompense un diplôme ou une expérience combinés à un bon niveau de langue : il reste de la marge sur ce volet." });
    }
    if (canadianExperienceYears < 1) {
      recs.push({ title: "Acquérir une expérience de travail au Canada", desc: "Même une première année d'expérience qualifiée au Canada rapporte des points sur deux volets à la fois (expérience et transférabilité)." });
    }
    if (canadianEducation === "none") {
      recs.push({ title: "Envisager un diplôme obtenu au Canada", desc: "Un diplôme canadien d'un an ou plus ajoute 15 à 30 points supplémentaires, en plus de faciliter l'expérience de travail locale." });
    }
    if (!hasProvincialNomination) {
      recs.push({ title: "Explorer une nomination provinciale (PNP)", desc: "Une nomination provinciale ajoute 600 points, largement de quoi dépasser n'importe quel seuil récent." });
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

  // Les bibliothèques PDF (~120 Ko compressés) ne sont chargées qu'au moment d'un aperçu ou d'un téléchargement,
  // pas avec la page d'accueil qui embarque ce simulateur.
  const createPdfDocument = async () => {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
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
        head: [["Composante", "Points obtenus", "Maximum officiel"]],
        body: [
          ["Âge", `${scores.age} pts`, "100-110 pts"],
          ["Études", `${scores.education} pts`, "140-150 pts"],
          ["Langue — première", `${scores.firstLanguage} pts`, "128-136 pts"],
          ["Langue — seconde", `${scores.secondLanguage} pts`, "22-24 pts"],
          ["Expérience canadienne", `${scores.canadianExperience} pts`, "70-80 pts"],
          ["Capital humain (sous-total)", `${scores.coreHumanCapital} pts`, `${scores.coreHumanCapitalMax} pts`],
          ...(maritalStatus === "with_spouse" ? [["Facteurs du conjoint", `${scores.spouseFactors} pts`, "40 pts"]] : []),
          ["Transférabilité des compétences", `${scores.skillTransferability} pts`, "100 pts"],
          ["Points additionnels (études canadiennes, français, fratrie, PNP)", `${scores.additionalPoints} pts`, "600 pts et plus"],
          ["Total simulé", `${scores.total} pts`, "1200 pts"],
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

  const handlePreviewPDF = async () => {
    setPdfPreviewError(null);
    setIsPreviewOpen(true);
    try {
      if (pdfPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfPreviewUrl);
      const previewBlob = (await createPdfDocument()).output("blob");
      setPdfPreviewUrl(URL.createObjectURL(previewBlob));
    } catch {
      setPdfPreviewUrl(null);
      setPdfPreviewError("La prévisualisation n’a pas pu être générée. Vous pouvez réessayer ou télécharger le rapport directement.");
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      (await createPdfDocument()).save(`simulation-crs-canada-${new Date().toISOString().slice(0, 10)}.pdf`);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch {
      toast.error("Le rapport PDF n’a pas pu être généré. Vérifiez votre connexion puis réessayez.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyResults = async () => {
    setIsCopying(true);
    const summary = [
      "Simulation CRS Canada — 3M Travel & Services",
      `Score estimé : ${scores.total} / 1200 points`,
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
            <Label className="font-semibold text-gray-800" htmlFor="crs-age">Âge</Label>
            <input
              id="crs-age"
              type="number"
              min={17}
              max={99}
              value={age}
              onChange={(event) => setAge(Math.max(0, Math.min(99, Number(event.target.value) || 0)))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>

          {/* Niveau d'études */}
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800">Niveau d’études (le plus élevé obtenu, évalué comme équivalent canadien si acquis à l’étranger)</Label>
            <Select value={education} onValueChange={(value) => setEducation(value as EducationLevel)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner le diplôme" />
              </SelectTrigger>
              <SelectContent>
                {EDUCATION_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Situation familiale */}
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800">Situation familiale</Label>
            <Select value={maritalStatus} onValueChange={(value) => setMaritalStatus(value as MaritalStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Situation familiale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="without_spouse">Sans conjoint(e), ou conjoint(e) qui ne vous accompagne pas</SelectItem>
                <SelectItem value="with_spouse">Avec conjoint(e) ou partenaire de fait qui vous accompagne</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Français */}
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800">Français (TEF/TCF) — niveau CLB/NCLC le plus proche</Label>
            <Select value={String(frenchClb)} onValueChange={(value) => setFrenchClb(Number(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Niveau de français" />
              </SelectTrigger>
              <SelectContent>
                {CLB_OPTIONS.map((option) => <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Anglais */}
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800">Anglais (IELTS/CELPIP) — niveau CLB le plus proche</Label>
            <Select value={String(englishClb)} onValueChange={(value) => setEnglishClb(Number(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Niveau d'anglais" />
              </SelectTrigger>
              <SelectContent>
                {CLB_OPTIONS.map((option) => <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Expérience canadienne */}
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800">Expérience de travail qualifiée AU CANADA</Label>
            <Select value={String(canadianExperienceYears)} onValueChange={(value) => setCanadianExperienceYears(Number(value) as ExperienceYears)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Années au Canada" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_OPTIONS.map((option) => <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Expérience étrangère */}
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800">Expérience de travail qualifiée HORS DU CANADA</Label>
            <Select value={String(foreignExperienceYears)} onValueChange={(value) => setForeignExperienceYears(Number(value) as ExperienceYears)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Années à l'étranger" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_OPTIONS.map((option) => <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Diplôme obtenu au Canada */}
          <div className="space-y-2">
            <Label className="font-semibold text-gray-800">Diplôme obtenu au Canada</Label>
            <Select value={canadianEducation} onValueChange={(value) => setCanadianEducation(value as CanadianEducationLevel)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Diplôme canadien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun diplôme obtenu au Canada</SelectItem>
                <SelectItem value="one_or_two_years">Programme d'un à deux ans</SelectItem>
                <SelectItem value="three_years_or_more">Programme de trois ans ou plus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cases à cocher : facteurs additionnels */}
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:col-span-2 lg:col-span-3">
            <p className="text-sm font-semibold text-gray-800">Autres facteurs à cocher s'ils s'appliquent</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                <Checkbox checked={hasTradeCertificate} onCheckedChange={(checked) => setHasTradeCertificate(checked === true)} className="mt-0.5" />
                Certificat de qualification dans un métier réglementé
              </label>
              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                <Checkbox checked={hasSiblingInCanada} onCheckedChange={(checked) => setHasSiblingInCanada(checked === true)} className="mt-0.5" />
                Frère ou sœur citoyen(ne) ou résident(e) permanent(e) au Canada
              </label>
              <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                <Checkbox checked={hasProvincialNomination} onCheckedChange={(checked) => setHasProvincialNomination(checked === true)} className="mt-0.5" />
                Nomination provinciale déjà obtenue (+600 pts)
              </label>
            </div>
          </div>

          {/* Facteurs du conjoint, uniquement si applicable */}
          {maritalStatus === "with_spouse" && (
            <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 md:col-span-2 lg:col-span-3">
              <p className="text-sm font-semibold text-indigo-900">Profil du conjoint ou de la conjointe qui vous accompagne</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-indigo-900">Niveau d'études du conjoint</Label>
                  <Select value={spouseEducation} onValueChange={(value) => setSpouseEducation(value as EducationLevel)}>
                    <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EDUCATION_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-indigo-900">Première langue officielle du conjoint (CLB)</Label>
                  <Select value={String(spouseClb)} onValueChange={(value) => setSpouseClb(Number(value))}>
                    <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CLB_OPTIONS.map((option) => <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-indigo-900">Expérience du conjoint au Canada</Label>
                  <Select value={String(spouseExperienceYears)} onValueChange={(value) => setSpouseExperienceYears(Number(value) as ExperienceYears)}>
                    <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_OPTIONS.map((option) => <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Résultat et Score */}
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              <Award className="w-4 h-4" /> Score CRS Indicatif
            </span>
            <div className="text-4xl md:text-5xl font-extrabold text-blue-900">
              {scores.total} <span className="text-lg font-normal text-gray-600">/ 1200 pts</span>
            </div>
            <p className="text-sm text-gray-600 max-w-md">
              {isThresholdMet
                ? 'Félicitations ! Votre profil atteint le dernier seuil comparé ci-dessous pour cette catégorie.'
                : 'Votre score est perfectible. Suivez nos recommandations ci-dessous pour booster votre dossier.'}
            </p>
            <p className="text-[11px] text-gray-500">
              Barème : <a className="underline hover:text-blue-700" href={CRS_SOURCE.url} target="_blank" rel="noreferrer">{CRS_SOURCE.organization}</a> — recoupé le {new Date(CRS_SOURCE.verifiedAt).toLocaleDateString("fr-FR")}. {CRS_SOURCE.note}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {isThresholdMet ? (
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
            {(() => {
              const bars: Array<{ key: string; label: string; value: number; max: number; tip: string }> = [
                { key: "age", label: "Âge", value: scores.age, max: scores.coreHumanCapitalMax === 460 ? 100 : 110, tip: "Le capital points d’âge est maximal entre 20 et 29 ans. Pensez à déposer rapidement votre dossier." },
                { key: "edu", label: "Diplômes / Études", value: scores.education, max: scores.coreHumanCapitalMax === 460 ? 140 : 150, tip: "Un Master ou un Doctorat, ou deux diplômes dont un de trois ans ou plus, augmente significativement ce volet." },
                { key: "lang1", label: "Langue — première langue officielle", value: scores.firstLanguage, max: scores.coreHumanCapitalMax === 460 ? 128 : 136, tip: "La langue avec le CLB le plus élevé est comptée comme première langue officielle : c'est ce qui rapporte le plus de points." },
                { key: "lang2", label: "Langue — seconde langue officielle", value: scores.secondLanguage, max: scores.coreHumanCapitalMax === 460 ? 22 : 24, tip: "Même un niveau modeste dans la seconde langue officielle rapporte quelques points supplémentaires." },
                { key: "exp", label: "Expérience canadienne", value: scores.canadianExperience, max: scores.coreHumanCapitalMax === 460 ? 70 : 80, tip: "Cumuler des années d'expérience qualifiée au Canada maximise ce volet et la transférabilité des compétences." },
                { key: "transfer", label: "Transférabilité des compétences", value: scores.skillTransferability, max: 100, tip: "Ce volet combine diplôme, expérience (canadienne ou étrangère) et niveau de langue : améliorer l'un des deux fait souvent gagner ici aussi." },
                { key: "additional", label: "Points additionnels (études canadiennes, français, fratrie, PNP)", value: scores.additionalPoints, max: Math.max(600, scores.additionalPoints), tip: "Dominé par la nomination provinciale (600 pts) : les autres bonus (français, études ou fratrie au Canada) restent modestes en comparaison." },
                ...(maritalStatus === "with_spouse" ? [{ key: "spouse", label: "Facteurs du conjoint", value: scores.spouseFactors, max: 40, tip: "Les études, la langue et l'expérience canadienne du conjoint comptent à part, jusqu'à 40 points au total." }] : []),
              ];
              return bars.map((bar) => (
                <div key={bar.key} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-700">{bar.label}</span>
                    <span className="text-blue-700 font-bold">{bar.value} / {bar.max} pts</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${Math.min(100, (bar.value / bar.max) * 100)}%` }} />
                  </div>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-left text-xs text-gray-500 underline decoration-dotted outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Conseil d’amélioration &gt;</button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-xs">
                        <p>{bar.tip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ));
            })()}
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
