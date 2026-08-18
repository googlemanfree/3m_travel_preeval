import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator, Award, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";

export default function CanadaScoreSimulator() {
  const { language } = useLanguage();
  const [age, setAge] = useState<string>("26-35");
  const [education, setEducation] = useState<string>("master");
  const [experience, setExperience] = useState<string>("3-plus");
  const [french, setFrench] = useState<string>("advanced");
  const [english, setEnglish] = useState<string>("intermediate");

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
  const isEligible = scores.total >= 420;

  const getWhatsappMessage = () => {
    const text = language === 'fr'
      ? `Bonjour 3M Travel, j’ai évalué mon profil pour le Canada. Mon score estimé est de ${scores.total} points (Éligible: ${isEligible ? 'Oui' : 'Non'}). Je souhaite être accompagné par un conseiller.`
      : `Hello 3M Travel, I have evaluated my profile for Canada. My estimated score is ${scores.total} points (Eligible: ${isEligible ? 'Yes' : 'No'}). I would like to get advisor support.`;
    return encodeURIComponent(text);
  };

  return (
    <Card className="border-2 border-blue-100 shadow-xl bg-white overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6">
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
                ? 'Évaluez vos points pour l’Entrée Express et déverrouillez les programmes d’immigration.'
                : 'Evaluate your Express Entry points and unlock immigration pathways.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

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
                href="#canadian-pathways"
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

        {/* Barres de progression par critère et infobulles */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
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
                    <p className="text-xs text-gray-500 cursor-help underline decoration-dotted">Conseil d’amélioration &gt;</p>
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
                    <p className="text-xs text-gray-500 cursor-help underline decoration-dotted">Conseil d’amélioration &gt;</p>
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
                    <p className="text-xs text-gray-500 cursor-help underline decoration-dotted">Conseil d’amélioration &gt;</p>
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
                    <p className="text-xs text-gray-500 cursor-help underline decoration-dotted">Conseil d’amélioration &gt;</p>
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
