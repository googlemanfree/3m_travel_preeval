import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator, Award, ArrowRight, ArrowLeft, ChevronRight, CheckCircle2, AlertCircle, BarChart3, Filter, HelpCircle, TrendingUp, TrendingDown, Download, Printer, Lightbulb, Check, Copy, Eye, ListChecks, Lock, Link2, Mail, Phone, Share2, UserRound, CalendarDays } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";
import { toast } from "sonner";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { CEC_SIX_MONTH_CRS_HISTORY, CRS_HISTORY_SOURCE, LATEST_INVITATION_ROUNDS, LATEST_ROUNDS_VERIFIED_AT } from "@/data/crsHistoricalRounds";
import { SafeResponsiveChart } from "@/components/SafeResponsiveChart";
import { computeCrsScore, CRS_SOURCE, type CanadianEducationLevel, type CrsProfile, type EducationLevel, type ExperienceYears, type LanguageAbilities, type MaritalStatus } from "@shared/crsScore";
import { useCandidateAuth } from "@/hooks/useCandidateAuth";
import { useLocation } from "wouter";
import { convertLanguageScores, isSupportedTestForLanguage, LANGUAGE_TEST_OPTIONS, LANGUAGE_TEST_SOURCE, type LanguageScores, type LanguageTestType } from "@shared/languageTests";

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

const LANGUAGE_ABILITIES: Array<{ key: keyof LanguageAbilities; label: string }> = [
  { key: "reading", label: "Lecture" },
  { key: "writing", label: "Écriture" },
  { key: "listening", label: "Écoute" },
  { key: "speaking", label: "Expression orale" },
];

const EXPERIENCE_OPTIONS: Array<{ value: ExperienceYears; label: string }> = [
  { value: 0, label: "Aucune, ou moins d'un an" },
  { value: 1, label: "1 an" },
  { value: 2, label: "2 ans" },
  { value: 3, label: "3 ans" },
  { value: 4, label: "4 ans" },
  { value: 5, label: "5 ans ou plus" },
];

type CanadaProgram = "express_entry" | "pnp" | "atlantic" | "rural_francophone" | "family" | "study" | "work" | "visitor" | "business";

const CANADA_PROGRAMS: Array<{ value: CanadaProgram; label: string; description: string; streams: Array<{ value: string; label: string }> }> = [
  { value: "express_entry", label: "Entrée express — résidence permanente", description: "CEC, travailleurs qualifiés fédéraux et métiers spécialisés. Le calcul CRS ci-dessous est pertinent pour cette voie.", streams: [{ value: "cec", label: "Catégorie de l’expérience canadienne (CEC)" }, { value: "fswp", label: "Programme des travailleurs qualifiés (fédéral)" }, { value: "fstp", label: "Programme des travailleurs de métiers spécialisés" }] },
  { value: "pnp", label: "Programme des candidats des provinces (PNP)", description: "Une province ou un territoire sélectionne les candidats selon ses propres volets et critères.", streams: [{ value: "express_linked", label: "Volet lié à Entrée express" }, { value: "base", label: "Volet de base hors Entrée express" }] },
  { value: "atlantic", label: "Programme d’immigration au Canada atlantique", description: "Parcours avec employeur désigné dans une province atlantique et exigences propres au programme.", streams: [{ value: "skilled", label: "Travailleur qualifié" }, { value: "intermediate", label: "Travailleur intermédiaire" }, { value: "international_graduate", label: "Diplômé international" }] },
  { value: "rural_francophone", label: "Pilotes communautaires et francophones", description: "Voies dépendant d’une communauté participante, d’un emploi admissible et d’une recommandation lorsqu’elle est requise.", streams: [{ value: "rural", label: "Pilote d’immigration dans les communautés rurales" }, { value: "francophone", label: "Pilote d’immigration dans les communautés francophones" }] },
  { value: "family", label: "Regroupement familial", description: "Parrainage d’un membre de la famille admissible par un citoyen ou résident permanent.", streams: [{ value: "spouse", label: "Époux, conjoint ou partenaire" }, { value: "child", label: "Enfant à charge" }, { value: "parents_grandparents", label: "Parents ou grands-parents" }, { value: "other_family", label: "Autre membre admissible de la famille" }] },
  { value: "study", label: "Permis d’études", description: "Projet d’études temporaire : établissement, lettre d’acceptation, ressources et conditions du permis à confirmer.", streams: [{ value: "college", label: "Collège / formation technique" }, { value: "university", label: "Université" }, { value: "secondary", label: "Études secondaires" }, { value: "language", label: "Programme de langue" }] },
  { value: "work", label: "Permis de travail", description: "Travail temporaire selon l’employeur, l’offre, l’EIMT ou une exemption applicable.", streams: [{ value: "employer_specific", label: "Permis lié à un employeur" }, { value: "open", label: "Permis de travail ouvert" }, { value: "post_graduation", label: "Permis postdiplôme" }, { value: "intra_company", label: "Transfert intra-entreprise" }] },
  { value: "visitor", label: "Visa de visiteur ou AVE/eTA", description: "Séjour temporaire pour tourisme, affaires ou visite familiale ; aucune installation ou autorisation de travail n’est présumée.", streams: [{ value: "tourism", label: "Tourisme" }, { value: "family_visit", label: "Visite familiale" }, { value: "business_visit", label: "Affaires" }] },
  { value: "business", label: "Entrepreneuriat et affaires", description: "Voie à confirmer selon le programme fédéral, provincial ou territorial et les critères en vigueur.", streams: [{ value: "startup", label: "Programme de visa pour démarrage d’entreprise" }, { value: "self_employed", label: "Travailleur autonome" }, { value: "provincial_business", label: "Programme provincial d’affaires" }] },
];

function LanguageCriterionHint({ language, kind }: { language: "fr" | "en"; kind: "french" | "english" }) {
  const isFrench = language === "fr";
  const title = kind === "french"
    ? (isFrench ? "Français : TEF Canada ou TCF Canada" : "French: TEF Canada or TCF Canada")
    : (isFrench ? "Anglais : IELTS General Training ou CELPIP-General" : "English: IELTS General Training or CELPIP-General");
  const description = kind === "french"
    ? (isFrench
      ? "Sélectionnez le niveau NCLC correspondant à vos quatre compétences (compréhension orale, expression orale, compréhension écrite et expression écrite). Le résultat exact dépend de la conversion officielle IRCC de vos notes TEF/TCF."
      : "Select the NCLC level corresponding to your four abilities (listening, speaking, reading and writing). The exact result depends on IRCC’s official conversion of your TEF/TCF scores.")
    : (isFrench
      ? "Sélectionnez le niveau CLB correspondant à vos quatre compétences. Le résultat exact dépend de la conversion officielle IRCC de vos notes IELTS General Training ou CELPIP-General."
      : "Select the CLB level corresponding to your four abilities. The exact result depends on IRCC’s official conversion of your IELTS General Training or CELPIP-General scores.");

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={isFrench ? `Expliquer le critère ${title}` : `Explain the ${title} criterion`}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          <p className="font-semibold">{title}</p>
          <p>{description}</p>
          <p className="mt-1 text-muted-foreground">
            {isFrench ? "Le simulateur utilise une estimation par palier; vérifiez toujours vos notes sur le résultat officiel." : "This simulator uses a band estimate; always verify your scores against the official result."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function FieldHint({ label, text }: { label: string; text: string }) {
  return <TooltipProvider delayDuration={150}><Tooltip><TooltipTrigger asChild><button type="button" aria-label={`Expliquer le champ ${label}`} className="inline-flex h-5 w-5 items-center justify-center rounded-full text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><HelpCircle className="h-3.5 w-3.5" aria-hidden="true" /></button></TooltipTrigger><TooltipContent side="top" className="max-w-xs text-xs leading-relaxed"><p className="font-semibold">{label}</p><p>{text}</p></TooltipContent></Tooltip></TooltipProvider>;
}

export default function CanadaScoreSimulator() {
  const { language } = useLanguage();
  const { isAuthenticated } = useCandidateAuth();
  const [, setLocation] = useLocation();
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
  const [wizardStep, setWizardStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [residenceCountry, setResidenceCountry] = useState("");
  const [targetProvince, setTargetProvince] = useState("");
  const [occupation, setOccupation] = useState("");
  const [hasJobOffer, setHasJobOffer] = useState(false);
  const [languageTestDate, setLanguageTestDate] = useState("");
  const [firstOfficialLanguage, setFirstOfficialLanguage] = useState<"english" | "french">("english");
  const [firstLanguageAbilities, setFirstLanguageAbilities] = useState<LanguageAbilities>({ reading: 9, writing: 9, listening: 9, speaking: 9 });
  const [secondLanguageAbilities, setSecondLanguageAbilities] = useState<LanguageAbilities>({ reading: 0, writing: 0, listening: 0, speaking: 0 });
  const [firstLanguageTest, setFirstLanguageTest] = useState<LanguageTestType>("ielts_general");
  const [secondLanguageTest, setSecondLanguageTest] = useState<LanguageTestType>("tef_canada");
  const [firstRawScores, setFirstRawScores] = useState<LanguageScores>({ reading: "", writing: "", listening: "", speaking: "" });
  const [secondRawScores, setSecondRawScores] = useState<LanguageScores>({ reading: "", writing: "", listening: "", speaking: "" });
  const [selectedProgram, setSelectedProgram] = useState<CanadaProgram>("express_entry");
  const [programStream, setProgramStream] = useState("cec");
  const [programDetails, setProgramDetails] = useState("");
  const [languageScores, setLanguageScores] = useState({ frenchReading: "", frenchWriting: "", frenchListening: "", frenchSpeaking: "", englishReading: "", englishWriting: "", englishListening: "", englishSpeaking: "" });
  const [shareLink, setShareLink] = useState("");
  const [isEmailingPdf, setIsEmailingPdf] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const draftStorageKey = "3m-crs-simulator-draft-v2";
  const [completedRecommendations, setCompletedRecommendations] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("3m-crs-recommendation-checklist") ?? "{}");
    } catch {
      return {};
    }
  });

  // Rondes d'invitation IRCC Express Entry réellement vérifiées sur la page officielle IRCC
  // (voir CRS_HISTORY_SOURCE / LATEST_ROUNDS_VERIFIED_AT dans data/crsHistoricalRounds.ts).
  // IRCC ne tient plus de rondes "Général / toutes catégories" depuis fin 2023 : seules les
  // catégories CEC, PNP et Santé ont des rondes récentes, d'où l'absence du filtre "Général".
  const allRounds = LATEST_INVITATION_ROUNDS;
  const selectedProgramData = CANADA_PROGRAMS.find((program) => program.value === selectedProgram) ?? CANADA_PROGRAMS[0];
  const isCrsProgram = selectedProgram === "express_entry" || selectedProgram === "pnp";

  const categoryExplanations: Record<string, string> = {
    all: "Affichage par défaut des 3 dernières rondes toutes catégories confondues (CEC, PNP, Santé) pour avoir une vue d'ensemble du marché.",
    cec: "Classe de l'expérience canadienne (CEC) : Destiné aux candidats ayant déjà travaillé au Canada (seuils compétitifs).",
    provincial: "Programme des candidats des provinces (PNP) : Inclut 600 points bonus de nomination provinciale.",
    sante: "Tirage catégoriel Professions de la santé et des services sociaux : Destiné aux profils médicaux et paramédicaux recherchés en priorité."
  };

  const filteredRounds = selectedCategory === "all"
    ? allRounds.slice(0, 3)
    : allRounds.filter(r => r.category === selectedCategory);

  const latestThreshold = filteredRounds.length > 0 ? filteredRounds[0].minScore : 500;

  const firstLanguageClb = Math.min(...Object.values(firstLanguageAbilities));
  const secondLanguageClb = Math.min(...Object.values(secondLanguageAbilities));
  const firstHasRawScores = Object.values(firstRawScores).every((value) => value.trim() !== "");
  const secondHasRawScores = Object.values(secondRawScores).every((value) => value.trim() !== "");
  const firstHasPartialRawScores = Object.values(firstRawScores).some((value) => value.trim() !== "") && !firstHasRawScores;
  const secondHasPartialRawScores = Object.values(secondRawScores).some((value) => value.trim() !== "") && !secondHasRawScores;
  const effectiveFirstLanguageAbilities = firstHasRawScores ? convertLanguageScores(firstLanguageTest, firstRawScores) : firstLanguageAbilities;
  const effectiveSecondLanguageAbilities = secondHasRawScores ? convertLanguageScores(secondLanguageTest, secondRawScores) : secondLanguageAbilities;
  const effectiveFirstLanguageClb = Math.min(...Object.values(effectiveFirstLanguageAbilities));
  const effectiveSecondLanguageClb = Math.min(...Object.values(effectiveSecondLanguageAbilities));
  const frenchClbForScore = firstOfficialLanguage === "french" ? effectiveFirstLanguageClb : effectiveSecondLanguageClb;
  const englishClbForScore = firstOfficialLanguage === "english" ? effectiveFirstLanguageClb : effectiveSecondLanguageClb;

  // Calcul CRS réel (shared/crsScore.ts) : rien n'est arrondi ni estimé, chaque sous-score vient de la grille officielle IRCC.
  const crsProfile: CrsProfile = {
    age, maritalStatus, education, frenchClb: frenchClbForScore, englishClb: englishClbForScore,
    firstOfficialLanguage, firstLanguageAbilities: effectiveFirstLanguageAbilities, secondLanguageAbilities: effectiveSecondLanguageAbilities,
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
    const bestClb = Math.max(frenchClbForScore, englishClbForScore);
    if (frenchClbForScore < 7) {
      recs.push({ title: "Faire reconnaître un niveau de français NCLC 7+", desc: "Un français d'au moins NCLC 7 (TEF/TCF) déclenche un bonus de 25 à 50 points, en plus des points de langue habituels." });
    }
    if (englishClbForScore < 9) {
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
  const pdfRecommendations = recommendations.length > 0
    ? recommendations
    : [{ title: "Maintenir votre profil et vérifier les documents", desc: "Votre simulation ne fait pas ressortir de faiblesse prioritaire. Vérifiez vos résultats officiels, votre admissibilité au programme visé et la validité de vos pièces avant toute démarche." }];

  useEffect(() => {
    localStorage.setItem("3m-crs-recommendation-checklist", JSON.stringify(completedRecommendations));
  }, [completedRecommendations]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(draftStorageKey) ?? "null") as Partial<{
        age: number; education: EducationLevel; canadianExperienceYears: ExperienceYears; foreignExperienceYears: ExperienceYears;
        frenchClb: number; englishClb: number; maritalStatus: MaritalStatus; spouseEducation: EducationLevel; spouseClb: number;
        spouseExperienceYears: ExperienceYears; hasTradeCertificate: boolean; canadianEducation: CanadianEducationLevel;
        hasSiblingInCanada: boolean; hasProvincialNomination: boolean; selectedCategory: string; wizardStep: number;
        fullName: string; email: string; phone: string; residenceCountry: string; targetProvince: string; occupation: string;
        hasJobOffer: boolean; languageTestDate: string; firstOfficialLanguage: "english" | "french"; firstLanguageTest: LanguageTestType; secondLanguageTest: LanguageTestType; firstRawScores: LanguageScores; secondRawScores: LanguageScores; firstLanguageAbilities: LanguageAbilities; secondLanguageAbilities: LanguageAbilities; selectedProgram: CanadaProgram; programStream: string; programDetails: string; languageScores: typeof languageScores;
      }> | null;
      if (saved) {
        if (typeof saved.age === "number") setAge(saved.age);
        if (saved.education) setEducation(saved.education);
        if (typeof saved.canadianExperienceYears === "number") setCanadianExperienceYears(saved.canadianExperienceYears);
        if (typeof saved.foreignExperienceYears === "number") setForeignExperienceYears(saved.foreignExperienceYears);
        if (typeof saved.frenchClb === "number") setFrenchClb(saved.frenchClb);
        if (typeof saved.englishClb === "number") setEnglishClb(saved.englishClb);
        if (saved.maritalStatus) setMaritalStatus(saved.maritalStatus);
        if (saved.spouseEducation) setSpouseEducation(saved.spouseEducation);
        if (typeof saved.spouseClb === "number") setSpouseClb(saved.spouseClb);
        if (typeof saved.spouseExperienceYears === "number") setSpouseExperienceYears(saved.spouseExperienceYears);
        if (typeof saved.hasTradeCertificate === "boolean") setHasTradeCertificate(saved.hasTradeCertificate);
        if (saved.canadianEducation) setCanadianEducation(saved.canadianEducation);
        if (typeof saved.hasSiblingInCanada === "boolean") setHasSiblingInCanada(saved.hasSiblingInCanada);
        if (typeof saved.hasProvincialNomination === "boolean") setHasProvincialNomination(saved.hasProvincialNomination);
        if (typeof saved.selectedCategory === "string") setSelectedCategory(saved.selectedCategory);
        if (typeof saved.wizardStep === "number" && saved.wizardStep >= 1 && saved.wizardStep <= 4) setWizardStep(saved.wizardStep);
        if (typeof saved.fullName === "string") setFullName(saved.fullName);
        if (typeof saved.email === "string") setEmail(saved.email);
        if (typeof saved.phone === "string") setPhone(saved.phone);
        if (typeof saved.residenceCountry === "string") setResidenceCountry(saved.residenceCountry);
        if (typeof saved.targetProvince === "string") setTargetProvince(saved.targetProvince);
        if (typeof saved.occupation === "string") setOccupation(saved.occupation);
        if (typeof saved.hasJobOffer === "boolean") setHasJobOffer(saved.hasJobOffer);
        if (typeof saved.languageTestDate === "string") setLanguageTestDate(saved.languageTestDate);
        if (saved.firstOfficialLanguage) setFirstOfficialLanguage(saved.firstOfficialLanguage);
        if (saved.firstLanguageTest && isSupportedTestForLanguage(saved.firstLanguageTest, saved.firstOfficialLanguage === "english" ? "english" : "french")) setFirstLanguageTest(saved.firstLanguageTest);
        if (saved.secondLanguageTest && isSupportedTestForLanguage(saved.secondLanguageTest, saved.firstOfficialLanguage === "english" ? "french" : "english")) setSecondLanguageTest(saved.secondLanguageTest);
        if (saved.firstRawScores) setFirstRawScores(saved.firstRawScores);
        if (saved.secondRawScores) setSecondRawScores(saved.secondRawScores);
        if (saved.firstLanguageAbilities) setFirstLanguageAbilities(saved.firstLanguageAbilities);
        if (saved.secondLanguageAbilities) setSecondLanguageAbilities(saved.secondLanguageAbilities);
        if (saved.selectedProgram) setSelectedProgram(saved.selectedProgram);
        if (typeof saved.programStream === "string") setProgramStream(saved.programStream);
        if (typeof saved.programDetails === "string") setProgramDetails(saved.programDetails);
        if (saved.languageScores) setLanguageScores(saved.languageScores);
        toast.success("Votre dernière simulation a été restaurée.");
      }
    } catch {
      // Ignore a malformed local draft and start with the default form.
    } finally {
      setIsDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isDraftLoaded) return;
    localStorage.setItem(draftStorageKey, JSON.stringify({
      age, education, canadianExperienceYears, foreignExperienceYears, frenchClb, englishClb, maritalStatus,
      spouseEducation, spouseClb, spouseExperienceYears, hasTradeCertificate, canadianEducation, hasSiblingInCanada,
      hasProvincialNomination, selectedCategory, wizardStep, fullName, email, phone, residenceCountry, targetProvince,
      occupation, hasJobOffer, languageTestDate, firstOfficialLanguage, firstLanguageTest, secondLanguageTest, firstRawScores, secondRawScores, firstLanguageAbilities, secondLanguageAbilities, selectedProgram, programStream, programDetails, languageScores,
    }));
  }, [isDraftLoaded, age, education, canadianExperienceYears, foreignExperienceYears, frenchClb, englishClb, maritalStatus, spouseEducation, spouseClb, spouseExperienceYears, hasTradeCertificate, canadianEducation, hasSiblingInCanada, hasProvincialNomination, selectedCategory, wizardStep, fullName, email, phone, residenceCountry, targetProvince, occupation, hasJobOffer, languageTestDate, firstOfficialLanguage, firstLanguageTest, secondLanguageTest, firstRawScores, secondRawScores, firstLanguageAbilities, secondLanguageAbilities, selectedProgram, programStream, programDetails, languageScores]);

  const toggleRecommendation = (title: string) => {
    setCompletedRecommendations((current) => ({ ...current, [title]: !current[title] }));
  };

  const completedRecommendationCount = recommendations.filter((recommendation) => completedRecommendations[recommendation.title]).length;

  const loadSharedProfile = (encoded: string) => {
    try {
      const parsed = JSON.parse(decodeURIComponent(escape(atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))))) as Partial<{
        fullName: string; age: number; education: EducationLevel; frenchClb: number; englishClb: number; firstOfficialLanguage: "english" | "french"; firstLanguageTest: LanguageTestType; secondLanguageTest: LanguageTestType; firstRawScores: LanguageScores; secondRawScores: LanguageScores; firstLanguageAbilities: LanguageAbilities; secondLanguageAbilities: LanguageAbilities;
        maritalStatus: MaritalStatus; canadianExperienceYears: ExperienceYears; foreignExperienceYears: ExperienceYears; selectedProgram: CanadaProgram; programStream: string;
        canadianEducation: CanadianEducationLevel; hasTradeCertificate: boolean; hasSiblingInCanada: boolean; hasProvincialNomination: boolean;
      }>;
      if (typeof parsed.fullName === "string") setFullName(parsed.fullName);
      if (typeof parsed.age === "number") setAge(parsed.age);
      if (parsed.education) setEducation(parsed.education);
      if (typeof parsed.frenchClb === "number") setFrenchClb(parsed.frenchClb);
      if (typeof parsed.englishClb === "number") setEnglishClb(parsed.englishClb);
      if (parsed.firstOfficialLanguage) setFirstOfficialLanguage(parsed.firstOfficialLanguage);
      if (parsed.firstLanguageTest) setFirstLanguageTest(parsed.firstLanguageTest);
      if (parsed.secondLanguageTest) setSecondLanguageTest(parsed.secondLanguageTest);
      if (parsed.firstRawScores) setFirstRawScores(parsed.firstRawScores);
      if (parsed.secondRawScores) setSecondRawScores(parsed.secondRawScores);
      if (parsed.firstLanguageAbilities) setFirstLanguageAbilities(parsed.firstLanguageAbilities);
      if (parsed.secondLanguageAbilities) setSecondLanguageAbilities(parsed.secondLanguageAbilities);
      if (parsed.maritalStatus) setMaritalStatus(parsed.maritalStatus);
      if (typeof parsed.canadianExperienceYears === "number") setCanadianExperienceYears(parsed.canadianExperienceYears);
      if (typeof parsed.foreignExperienceYears === "number") setForeignExperienceYears(parsed.foreignExperienceYears);
      if (parsed.canadianEducation) setCanadianEducation(parsed.canadianEducation);
      if (typeof parsed.hasTradeCertificate === "boolean") setHasTradeCertificate(parsed.hasTradeCertificate);
      if (typeof parsed.hasSiblingInCanada === "boolean") setHasSiblingInCanada(parsed.hasSiblingInCanada);
      if (typeof parsed.hasProvincialNomination === "boolean") setHasProvincialNomination(parsed.hasProvincialNomination);
      if (parsed.selectedProgram) setSelectedProgram(parsed.selectedProgram);
      if (typeof parsed.programStream === "string") setProgramStream(parsed.programStream);
      setWizardStep(3);
    } catch {
      // Ignore malformed or expired shared links and keep the default form.
    }
  };

  useEffect(() => {
    const encoded = new URLSearchParams(window.location.search).get("crs");
    if (encoded) loadSharedProfile(encoded);
  }, []);

  const shareProfile = () => {
    const payload = {
      fullName: fullName.trim(), age, education, frenchClb: frenchClbForScore, englishClb: englishClbForScore, firstOfficialLanguage, firstLanguageTest, secondLanguageTest, firstRawScores, secondRawScores, firstLanguageAbilities: effectiveFirstLanguageAbilities, secondLanguageAbilities: effectiveSecondLanguageAbilities, maritalStatus, selectedProgram, programStream,
      canadianExperienceYears, foreignExperienceYears, canadianEducation, hasTradeCertificate,
      hasSiblingInCanada, hasProvincialNomination,
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const link = `${window.location.origin}${window.location.pathname}?crs=${encoded}`;
    setShareLink(link);
    return link;
  };

  const handleShareWhatsApp = () => {
    const link = shareLink || shareProfile();
    const message = `Bonjour, voici mon simulateur CRS Canada 3M Travel Agency à compléter ou vérifier : ${link}`;
    window.open(`https://wa.me/237698104832?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const appointmentPath = "/consultation?source=crs-simulator";
  const appointmentUrl = typeof window !== "undefined"
    ? new URL(appointmentPath, window.location.origin).toString()
    : appointmentPath;

  // Les bibliothèques PDF (~120 Ko compressés) ne sont chargées qu'au moment d'un aperçu ou d'un téléchargement,
  // pas avec la page d'accueil qui embarque ce simulateur.
  const loadImageAsDataUrl = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Logo unavailable");
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  };

  const createPdfDocument = async () => {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const generatedAt = new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      doc.setFillColor(15, 45, 91);
      doc.rect(0, 0, 210, 38, "F");
      doc.setFillColor(212, 160, 23);
      doc.rect(0, 35, 210, 3, "F");
      try {
        const logo = await loadImageAsDataUrl("/manus-storage/pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg");
        doc.addImage(logo, "JPEG", 15, 5, 22, 22);
      } catch {
        // The report remains usable if the remote logo is temporarily unavailable.
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text("3M TRAVEL AGENCY", 43, 14);
      doc.setFontSize(11);
      doc.text("Synthèse de simulation CRS — Canada", 43, 22);
      doc.setFontSize(8);
      doc.text("Yaoundé · Ottawa  |  +237 698 104 832  |  3mtravelagency.com", 43, 29);

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(10);
      doc.text(`Candidat : ${fullName || "Non renseigné"}`, 15, 48);
      doc.text(`Programme visé : ${selectedProgramData.label}`, 15, 53);
      doc.text(`Volet : ${selectedProgramData.streams.find((stream) => stream.value === programStream)?.label ?? programStream}`, 15, 58, { maxWidth: 180 });
      doc.text(`Document généré le ${generatedAt}. Résultats indicatifs, sans garantie d'invitation.`, 15, 63, { maxWidth: 180 });

      doc.setFillColor(isThresholdMet ? 236 : 254, isThresholdMet ? 253 : 242, isThresholdMet ? 245 : 242);
      doc.roundedRect(15, 71, 180, 29, 3, 3, "F");
      doc.setTextColor(isThresholdMet ? 6 : 153, isThresholdMet ? 95 : 27, isThresholdMet ? 70 : 27);
      doc.setFontSize(11);
      doc.text(isCrsProgram ? "Score CRS simulé" : "Score CRS de référence", 21, 82);
      doc.setFontSize(20);
      doc.text(`${scores.total} pts`, 21, 93);
      doc.setFontSize(11);
      doc.text(`Dernier seuil comparé : ${latestThreshold} pts`, 105, 82);
      doc.setFontSize(16);
      doc.text(`Écart : ${scoreDiff >= 0 ? "+" : ""}${scoreDiff} pts`, 105, 93);

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(13);
      doc.text("Répartition détaillée du score CRS", 15, 113);
      autoTable(doc, {
        startY: 118,
        head: [["Composante", "Points obtenus", "Maximum officiel"]],
        body: [
          ["Âge", `${scores.age} pts`, "100-110 pts"],
          ["Études", `${scores.education} pts`, "140-150 pts"],
          [`Langue — première (${firstOfficialLanguage === "english" ? "anglais" : "français"})`, `${scores.firstLanguage} pts`, "128-136 pts"],
          ["  · Test et notes brutes", LANGUAGE_TEST_OPTIONS.find((option) => option.value === firstLanguageTest)?.label ?? firstLanguageTest, `${Object.values(firstRawScores).join(" / ") || "non saisies"}`],
          ...LANGUAGE_ABILITIES.map(({ key, label }) => [`  · ${label}`, `${effectiveFirstLanguageAbilities[key]} CLB/NCLC`, "par compétence"]),
          [`Langue — seconde (${firstOfficialLanguage === "english" ? "français" : "anglais"})`, `${scores.secondLanguage} pts`, "22-24 pts"],
          ["  · Test et notes brutes", LANGUAGE_TEST_OPTIONS.find((option) => option.value === secondLanguageTest)?.label ?? secondLanguageTest, `${Object.values(secondRawScores).join(" / ") || "non saisies"}`],
          ...LANGUAGE_ABILITIES.map(({ key, label }) => [`  · ${label}`, `${effectiveSecondLanguageAbilities[key]} CLB/NCLC`, "par compétence"]),
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
      doc.setFontSize(9);
      doc.text(`rondes relevées le ${new Date(LATEST_ROUNDS_VERIFIED_AT).toLocaleDateString("fr-FR")} — source : ${CRS_HISTORY_SOURCE.organization}`, 15, afterScoreTable + 19);
      autoTable(doc, {
        startY: afterScoreTable + 24,
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
      doc.addPage();
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(13);
      doc.text("Recommandations personnalisées", 15, 22);
      doc.setFontSize(9);
      doc.text("Ces pistes ciblent les composantes les plus faibles de la simulation et ne remplacent pas les règles officielles IRCC.", 15, 29, { maxWidth: 180 });
      autoTable(doc, {
        startY: 36,
        head: [["Point à travailler", "Recommandation personnalisée"]],
        body: pdfRecommendations.map((recommendation) => [recommendation.title, recommendation.desc]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [180, 83, 9] },
        columnStyles: { 0: { cellWidth: 58 }, 1: { cellWidth: 122 } },
      });

      const afterRecommendations = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 92;
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(147, 197, 253);
      doc.roundedRect(15, afterRecommendations + 12, 180, 28, 3, 3, "FD");
      doc.setTextColor(15, 45, 91);
      doc.setFontSize(11);
      doc.text("Besoin d’un accompagnement personnalisé ?", 21, afterRecommendations + 22);
      doc.setFontSize(10);
      doc.textWithLink("Prendre rendez-vous en ligne avec 3M Travel", 21, afterRecommendations + 32, { url: appointmentUrl });

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
    if (!isAuthenticated) {
      setIsPreviewOpen(false);
      toast.info("Créez votre compte gratuit pour télécharger votre score en PDF.", {
        description: "La prévisualisation reste libre ; le téléchargement est réservé aux candidats inscrits.",
      });
      setLocation(`/register?from=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`);
      return;
    }
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

  const handleEmailPdf = async () => {
    const recipient = email.trim();
    if (!recipient || !/^\S+@\S+\.\S+$/.test(recipient)) {
      toast.error("Ajoutez une adresse e-mail valide à l’étape Profil avant l’envoi.");
      setWizardStep(1);
      return;
    }
    setIsEmailingPdf(true);
    try {
      const blob = (await createPdfDocument()).output("blob");
      const filename = `simulation-crs-canada-${new Date().toISOString().slice(0, 10)}.pdf`;
      const file = new File([blob], filename, { type: "application/pdf" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: "Simulation CRS Canada — 3M Travel Agency", text: `Bonjour ${fullName || ""}, voici votre simulation CRS Canada.`, files: [file] });
        toast.success("Le PDF est prêt à être envoyé par e-mail depuis le menu de partage.");
      } else {
        const downloadUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(downloadUrl);
        const subject = encodeURIComponent("Votre simulation CRS Canada — 3M Travel Agency");
        const body = encodeURIComponent(`Bonjour ${fullName || ""},\n\nVotre PDF de simulation CRS vient d’être téléchargé. Joignez-le à ce courriel avant l’envoi.\n\nScore indicatif : ${scores.total}/1200 points.`);
        window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${subject}&body=${body}`;
        toast.success("Le PDF a été téléchargé et votre messagerie a été ouverte pour l’envoyer.");
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") toast.error("L’envoi du PDF a été interrompu. Vous pouvez utiliser WhatsApp ou le téléchargement.");
    } finally {
      setIsEmailingPdf(false);
    }
  };

  const handlePrintResults = () => {
    if (wizardStep !== 3) setWizardStep(3);
    window.setTimeout(() => window.print(), 120);
  };

  const handleCopyResults = async () => {
    setIsCopying(true);
      const summary = [
      "Simulation CRS Canada — 3M Travel & Services",
      `Programme visé : ${selectedProgramData.label}`,
      `Volet : ${selectedProgramData.streams.find((stream) => stream.value === programStream)?.label ?? programStream}`,
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
              {!isAuthenticated && " Le téléchargement du PDF est réservé aux candidats inscrits (compte gratuit)."}
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
              {exportSuccess ? <Check className="w-4 h-4" /> : !isAuthenticated ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              {exportSuccess
                ? "Téléchargement lancé"
                : isExporting
                  ? "Préparation…"
                  : !isAuthenticated
                    ? "Créer un compte pour télécharger"
                    : "Télécharger le PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CardContent className="p-6 md:p-8 space-y-8">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-slate-50 to-blue-50 p-4 md:p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Évaluation guidée 3M Travel</p>
              <p className="text-sm text-slate-600 mt-1">Répondez à chaque bloc pour obtenir une synthèse plus utile à votre conseiller.</p>
            </div>
            <span className="text-sm font-extrabold text-blue-900">Étape {wizardStep}/4</span>
          </div>
          <div className="grid grid-cols-4 gap-2" aria-label="Progression du simulateur">
            {["Profil", "Critères CRS", "Résultat", "Partager"].map((label, index) => {
              const step = index + 1;
              return (
                <button key={label} type="button" onClick={() => step <= wizardStep && setWizardStep(step)} className="text-left group" aria-label={`Aller à l'étape ${step} : ${label}`}>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: step <= wizardStep ? "100%" : "0%" }} transition={{ duration: 0.45, ease: "easeOut" }} className="h-full rounded-full bg-blue-600" /></div>
                  <span className={`mt-2 block text-[11px] font-semibold ${step === wizardStep ? "text-blue-800" : "text-slate-500"}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {wizardStep === 1 && (
          <motion.div key="profile-step" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-100 p-2 text-blue-700"><UserRound className="h-5 w-5" /></div>
              <div><h3 className="font-bold text-slate-900">1. Votre profil et votre projet</h3><p className="text-sm text-slate-600">Ces informations permettent de personnaliser le rapport et le suivi, sans modifier le barème officiel.</p></div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 md:p-5 space-y-4">
              <div><p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Parcours canadien</p><p className="mt-1 text-sm text-slate-600">Choisissez d’abord le programme visé : les questions suivantes s’adapteront à votre projet. Les critères définitifs doivent être confirmés sur les sources officielles.</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="crs-program">Programme ou voie envisagée</Label><Select value={selectedProgram} onValueChange={(value) => { const next = value as CanadaProgram; setSelectedProgram(next); const nextProgram = CANADA_PROGRAMS.find((program) => program.value === next); setProgramStream(nextProgram?.streams[0]?.value ?? ""); }}><SelectTrigger id="crs-program" className="bg-white"><SelectValue /></SelectTrigger><SelectContent>{CANADA_PROGRAMS.map((program) => <SelectItem key={program.value} value={program.value}>{program.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label htmlFor="crs-program-stream">Volet ou type de demande</Label><Select value={programStream} onValueChange={setProgramStream}><SelectTrigger id="crs-program-stream" className="bg-white"><SelectValue /></SelectTrigger><SelectContent>{selectedProgramData.streams.map((stream) => <SelectItem key={stream.value} value={stream.value}>{stream.label}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="rounded-xl border border-amber-100 bg-white/80 p-3 text-xs leading-5 text-slate-700"><span className="font-bold text-amber-900">À savoir :</span> {selectedProgramData.description} <span className="font-semibold">Le simulateur CRS est surtout conçu pour Entrée express et les volets PNP liés à Entrée express.</span></div>
              <div className="space-y-2"><Label htmlFor="crs-program-details">Informations propres à ce programme</Label><textarea id="crs-program-details" value={programDetails} onChange={(event) => setProgramDetails(event.target.value)} rows={3} placeholder={selectedProgram === "family" ? "Ex. époux/conjointe, statut du répondant, enfant à charge…" : selectedProgram === "study" ? "Ex. établissement, programme, niveau, lettre d’acceptation…" : selectedProgram === "work" ? "Ex. employeur, poste, CNP/FEER, EIMT ou exemption…" : selectedProgram === "visitor" ? "Ex. motif, durée prévue, hébergement, liens au pays de résidence…" : selectedProgram === "business" ? "Ex. projet, expérience de gestion, investissement, province ciblée…" : "Ex. employeur, communauté, volet, CNP/FEER et province ciblée…"} className="flex min-h-20 w-full rounded-md border border-input bg-white px-3 py-2 text-sm" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><div className="flex items-center gap-1"><Label htmlFor="crs-full-name">Nom complet</Label><FieldHint label="Nom complet" text="Utilisé pour personnaliser le rapport PDF et le lien partagé; cela ne change aucun point CRS." /></div><input id="crs-full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ex. Marie Ngo" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></div>
              <div className="space-y-2"><Label htmlFor="crs-email">E-mail</Label><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input id="crs-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm" /></div></div>
              <div className="space-y-2"><Label htmlFor="crs-phone">WhatsApp / téléphone</Label><div className="relative"><Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input id="crs-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 ..." className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm" /></div></div>
              <div className="space-y-2"><div className="flex items-center gap-1"><Label htmlFor="crs-residence">Pays de résidence</Label><FieldHint label="Pays de résidence" text="Indiquez le pays où vous vivez actuellement. Cette donnée sert à l’orientation et ne donne pas directement de points CRS." /></div><input id="crs-residence" value={residenceCountry} onChange={(e) => setResidenceCountry(e.target.value)} placeholder="Cameroun" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></div>
              <div className="space-y-2"><div className="flex items-center gap-1"><Label htmlFor="crs-province">Province ou ville ciblée au Canada</Label><FieldHint label="Province ciblée" text="Le choix de province peut être important pour certains programmes; il ne remplace pas une nomination provinciale officielle (+600 points CRS)." /></div><input id="crs-province" value={targetProvince} onChange={(e) => setTargetProvince(e.target.value)} placeholder="Ontario, Québec…" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></div>
              <div className="space-y-2"><Label htmlFor="crs-occupation">Profession / domaine</Label><input id="crs-occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Informatique, santé…" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></div>
              <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2"><Checkbox checked={hasJobOffer} onCheckedChange={(checked) => setHasJobOffer(checked === true)} /> J’ai déjà une offre d’emploi canadienne vérifiable</label>
              <div className="space-y-2"><div className="flex items-center gap-1"><Label htmlFor="crs-test-date">Date du dernier test de langue</Label><FieldHint label="Validité du test" text="IRCC exige généralement des résultats de moins de 2 ans au moment de la création du profil et de la demande de résidence permanente. Vérifiez la date sur votre relevé." /></div><input id="crs-test-date" type="date" value={languageTestDate} onChange={(e) => setLanguageTestDate(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" /></div>
            </div>
          </motion.div>
        )}

        <motion.div key="criteria-step" initial={{ opacity: 0, x: 18 }} animate={{ opacity: wizardStep === 2 ? 1 : 0, x: wizardStep === 2 ? 0 : 18 }} transition={{ duration: 0.25 }} className={wizardStep === 2 ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "hidden"}>
          <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-5">
            <div><p className="font-bold text-indigo-950">Langues officielles — comme dans la calculatrice IRCC</p><p className="text-xs leading-5 text-indigo-900/75">Sélectionnez la première langue officielle, puis le niveau CLB/NCLC de chacune des quatre compétences. Le score est calculé compétence par compétence, et non avec une moyenne.</p></div>
            <div className="max-w-md space-y-2"><div className="flex items-center gap-1"><Label htmlFor="crs-first-language">Quelle est votre première langue officielle ?</Label><FieldHint label="Première langue officielle" text="Dans le CRS, la première langue officielle est celle pour laquelle vous déclarez votre résultat principal. Chaque compétence est notée séparément." /></div><Select value={firstOfficialLanguage} onValueChange={(value) => { const next = value as "english" | "french"; setFirstOfficialLanguage(next); setFirstLanguageTest(next === "english" ? "ielts_general" : "tef_canada"); setSecondLanguageTest(next === "english" ? "tef_canada" : "ielts_general"); }}><SelectTrigger id="crs-first-language" className="bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="english">Anglais</SelectItem><SelectItem value="french">Français</SelectItem></SelectContent></Select></div>
            <div className="grid gap-4 lg:grid-cols-2">
              {[{ title: `Première langue officielle : ${firstOfficialLanguage === "english" ? "anglais" : "français"}`, test: firstLanguageTest, setTest: setFirstLanguageTest, raw: firstRawScores, setRaw: setFirstRawScores, converted: effectiveFirstLanguageAbilities, partial: firstHasPartialRawScores, hintKind: firstOfficialLanguage === "english" ? "english" : "french" }, { title: `Deuxième langue officielle : ${firstOfficialLanguage === "english" ? "français" : "anglais"}`, test: secondLanguageTest, setTest: setSecondLanguageTest, raw: secondRawScores, setRaw: setSecondRawScores, converted: effectiveSecondLanguageAbilities, partial: secondHasPartialRawScores, hintKind: firstOfficialLanguage === "english" ? "french" : "english" }].map((languageBlock) => { const targetLanguage = languageBlock.hintKind === "english" ? "english" : "french"; const availableTests = LANGUAGE_TEST_OPTIONS.filter((option) => option.language === targetLanguage); return <div key={languageBlock.title} className="rounded-xl border border-indigo-100 bg-white p-4"><div className="mb-3 flex items-center gap-1"><p className="text-sm font-bold text-indigo-950">{languageBlock.title}</p><LanguageCriterionHint language={language} kind={languageBlock.hintKind as "french" | "english"} /></div><div className="mb-3 space-y-1"><div className="flex items-center gap-1"><Label className="text-[11px]">Test reconnu par IRCC</Label><FieldHint label="Test reconnu" text="Choisissez le test réellement passé. IELTS doit être General Training, CELPIP doit être General et PTE doit être PTE Core. Pour le français, utilisez TEF Canada ou TCF Canada." /></div><Select value={languageBlock.test} onValueChange={(value) => languageBlock.setTest(value as LanguageTestType)}><SelectTrigger className="h-9 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent>{availableTests.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-3">{LANGUAGE_ABILITIES.map(({ key, label }) => <div key={key} className="space-y-1"><div className="flex items-center gap-1"><Label className="text-[11px]">{label}</Label><FieldHint label={label} text="Saisissez la note brute exactement comme elle figure sur votre relevé. La conversion CLB/NCLC est faite séparément pour cette compétence selon le tableau IRCC." /></div><input aria-label={`${languageBlock.title} — ${label}`} inputMode="decimal" value={languageBlock.raw[key]} onChange={(event) => languageBlock.setRaw((current) => ({ ...current, [key]: event.target.value }))} placeholder="Note" className="flex h-9 w-full rounded-md border border-input bg-white px-2 text-sm" /></div>)}</div>{languageBlock.partial && <p className="mt-2 text-xs font-semibold text-amber-700">Complétez les quatre notes de ce test pour activer la conversion automatique CLB/NCLC.</p>}<div className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-950"><strong>Niveau calculé :</strong> Lecture {languageBlock.converted.reading} · Écriture {languageBlock.converted.writing} · Écoute {languageBlock.converted.listening} · Oral {languageBlock.converted.speaking}</div></div>; })}
            </div>
            <p className="text-[11px] leading-5 text-slate-500">Référence : <a href={LANGUAGE_TEST_SOURCE} target="_blank" rel="noreferrer" className="font-semibold underline hover:text-blue-700">Tableaux officiels IRCC des tests de langue</a>. Les notes doivent être saisies dans la colonne compatible avec le test et la version officielle indiquées sur votre relevé.</p>
          </div>
          {/* Âge */}
          <div className="space-y-2">
            <div className="flex items-center gap-1"><Label className="font-semibold text-gray-800" htmlFor="crs-age">Âge</Label><FieldHint label="Âge" text="IRCC attribue le maximum de points entre 20 et 29 ans. L’âge pris en compte dépend de la date utilisée dans votre profil officiel." /></div>
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
            <div className="flex items-center gap-1"><Label className="font-semibold text-gray-800">Niveau d’études (le plus élevé obtenu, évalué comme équivalent canadien si acquis à l’étranger)</Label><FieldHint label="Études" text="Sélectionnez le plus haut diplôme complété. Un diplôme étranger doit généralement être accompagné d’une évaluation des diplômes d’études (EDE) pour Entrée express." /></div>
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
            <div className="flex items-center gap-1"><Label className="font-semibold text-gray-800">Situation familiale</Label><FieldHint label="Situation familiale" text="Choisissez avec conjoint seulement si votre conjoint ou partenaire vous accompagne dans le profil; sinon le barème sans conjoint peut s’appliquer." /></div>
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

          {/* Expérience canadienne */}
          <div className="space-y-2">
            <div className="flex items-center gap-1"><Label className="font-semibold text-gray-800">Expérience de travail qualifiée AU CANADA</Label><FieldHint label="Expérience canadienne" text="Comptez l’expérience de travail qualifiée acquise au Canada selon les exigences du programme et de la CNP/FEER. Les années étrangères ne se mettent pas ici." /></div>
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
            <div className="flex items-center gap-1"><Label className="font-semibold text-gray-800">Expérience de travail qualifiée HORS DU CANADA</Label><FieldHint label="Expérience étrangère" text="Cette donnée intervient surtout dans la transférabilité des compétences; elle ne remplace pas l’expérience canadienne exigée par certains programmes." /></div>
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
        </motion.div>

        {wizardStep === 3 && (
          <motion.div key="review-step" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 md:p-6 space-y-4">
            <div className="flex items-start gap-3"><div className="rounded-xl bg-amber-100 p-2 text-amber-700"><ListChecks className="h-5 w-5" /></div><div><h3 className="font-bold text-amber-950">Vérifiez vos réponses avant le rapport</h3><p className="text-sm text-amber-900/80">Modifiez un bloc si nécessaire, puis passez à l’étape suivante pour partager ou générer le PDF.</p></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white border border-amber-100 p-3"><p className="font-semibold text-slate-900">Profil et programme</p><p className="text-slate-600">{selectedProgramData.label}</p><p className="text-slate-600">Volet : {selectedProgramData.streams.find((stream) => stream.value === programStream)?.label ?? programStream}</p><p className="text-slate-600">{fullName || "Nom non renseigné"} · {age} ans · {residenceCountry || "Pays non renseigné"}</p><p className="text-slate-600">{occupation || "Profession non renseignée"} · cible : {targetProvince || "non renseignée"}</p><Button type="button" variant="link" className="px-0 h-auto text-blue-700" onClick={() => setWizardStep(1)}>Modifier le profil</Button></div>
              <div className="rounded-xl bg-white border border-amber-100 p-3"><p className="font-semibold text-slate-900">Critères CRS</p><p className="text-slate-600">Études : {EDUCATION_OPTIONS.find((option) => option.value === education)?.label ?? education}</p><p className="text-slate-600">1re langue : {firstLanguageClb} · 2e langue : {secondLanguageClb} · Canada : {canadianExperienceYears} an(s)</p><p className="text-xs text-slate-500">Lecture, écriture, écoute et expression orale calculées séparément.</p><Button type="button" variant="link" className="px-0 h-auto text-blue-700" onClick={() => setWizardStep(2)}>Modifier les critères</Button></div>
            </div>
            <div className="rounded-xl bg-white border border-amber-100 p-3 text-sm"><span className="font-semibold">Résultat calculé :</span> {scores.total} points · écart de {scoreDiff >= 0 ? "+" : ""}{scoreDiff} points par rapport au dernier seuil comparé. {!isCrsProgram && <span className="text-slate-600"> Pour cette voie, le CRS est un repère complémentaire et ne remplace pas les critères du programme.</span>}</div>
            <div className="rounded-xl bg-white border border-amber-100 p-3 text-sm"><p className="font-semibold text-slate-900">Détail des langues</p><p className="mt-1 text-xs text-slate-500">{LANGUAGE_TEST_OPTIONS.find((option) => option.value === firstLanguageTest)?.label} / {LANGUAGE_TEST_OPTIONS.find((option) => option.value === secondLanguageTest)?.label}</p><div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">{LANGUAGE_ABILITIES.map(({ key, label }) => <span key={`first-${key}`}>1re {label.toLowerCase()} : <strong className="text-slate-900">{effectiveFirstLanguageAbilities[key]}</strong></span>)}{LANGUAGE_ABILITIES.map(({ key, label }) => <span key={`second-${key}`}>2e {label.toLowerCase()} : <strong className="text-slate-900">{effectiveSecondLanguageAbilities[key]}</strong></span>)}</div></div>
          </motion.div>
        )}

        {/* Résultat et Score */}
        <div className={wizardStep === 3 ? "mt-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6" : "hidden"}>
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
          className={wizardStep === 3 ? `p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${isThresholdMet ? 'text-emerald-950' : 'text-red-950'}` : "hidden"}
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
          <div className={wizardStep === 3 ? "p-6 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4" : "hidden"}>
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
        <div className={wizardStep === 3 ? "space-y-4 pt-4 border-t border-gray-100" : "hidden"}>
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
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintResults}
                className="gap-2 border-blue-200 text-blue-800 hover:bg-blue-50"
              >
                <Printer className="w-4 h-4" /> Imprimer / enregistrer
              </Button>
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
              Source : <a className="underline hover:text-blue-700" href={CRS_HISTORY_SOURCE.url} target="_blank" rel="noreferrer">{CRS_HISTORY_SOURCE.organization}</a> — rondes relevées le {new Date(LATEST_ROUNDS_VERIFIED_AT).toLocaleDateString("fr-FR")}. Les seuils peuvent varier à chaque ronde.
            </p>
          </div>
        </div>

        {/* Barres de progression par critère et infobulles */}
        <div className={wizardStep === 3 ? "space-y-4 pt-6 border-t border-gray-100" : "hidden"}>
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <a href={appointmentPath} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                <CalendarDays className="h-4 w-4" />
                Prendre rendez-vous en ligne
              </a>
              <a href={`https://wa.me/237698104832?text=${getWhatsappMessage()}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1.5">
                <span>Ou écrire à un conseiller sur WhatsApp &gt;</span>
              </a>
            </div>
          </div>
        </div>

        {wizardStep === 4 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 md:p-6 space-y-5">
            <div className="flex items-start gap-3"><div className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><Share2 className="h-5 w-5" /></div><div><h3 className="font-bold text-emerald-950">4. Partager votre évaluation</h3><p className="text-sm text-emerald-900/80">Créez un lien de reprise contenant uniquement les réponses du simulateur, puis envoyez-le à votre conseiller sur WhatsApp.</p></div></div>
            <div className="flex flex-col sm:flex-row gap-3"><Button type="button" onClick={handleShareWhatsApp} className="gap-2 bg-emerald-600 hover:bg-emerald-700"><Share2 className="h-4 w-4" /> Partager via WhatsApp</Button><Button type="button" variant="outline" onClick={() => { const link = shareLink || shareProfile(); navigator.clipboard?.writeText(link); toast.success("Lien de partage copié"); }} className="gap-2"><Link2 className="h-4 w-4" /> Copier le lien</Button><Button type="button" onClick={handleEmailPdf} disabled={isEmailingPdf} variant="outline" className="gap-2"><Mail className="h-4 w-4" /> {isEmailingPdf ? "Préparation du PDF…" : "Envoyer le PDF par e-mail"}</Button><Button asChild type="button" className="gap-2 bg-blue-700 hover:bg-blue-800"><a href={appointmentPath}><CalendarDays className="h-4 w-4" /> Prendre rendez-vous</a></Button><Button type="button" onClick={handlePreviewPDF} variant="outline" className="gap-2"><Eye className="h-4 w-4" /> Prévisualiser le PDF</Button></div>
            {shareLink && <div className="rounded-xl bg-white border border-emerald-200 p-3 text-xs text-slate-700 break-all"><span className="font-semibold block mb-1">Lien généré</span>{shareLink}</div>}
            <p className="text-xs text-emerald-900/70">Le PDF comporte l’en-tête 3M TRAVEL AGENCY, les coordonnées Yaoundé–Ottawa, le score, les sous-scores, les rondes comparées et les réserves officielles.</p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <Button type="button" variant="outline" onClick={() => setWizardStep((step) => Math.max(1, step - 1))} disabled={wizardStep === 1} className="gap-2"><ArrowLeft className="h-4 w-4" /> Précédent</Button>
          {wizardStep < 4 ? <Button type="button" onClick={() => setWizardStep((step) => Math.min(4, step + 1))} disabled={wizardStep === 1 && !fullName.trim()} className="gap-2 bg-blue-700 hover:bg-blue-800">{wizardStep === 1 ? "Continuer vers les critères" : wizardStep === 2 ? "Voir mon résultat" : "Partager et télécharger"}<ChevronRight className="h-4 w-4" /></Button> : <Button type="button" onClick={() => setWizardStep(3)} variant="outline">Modifier mes réponses</Button>}
        </div>
      </CardContent>
    </Card>
  );
}
