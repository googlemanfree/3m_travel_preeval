import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calculator, Award, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function CanadaScoreSimulator() {
  const { language } = useLanguage();
  const [age, setAge] = useState<string>("26-35");
  const [education, setEducation] = useState<string>("master");
  const [experience, setExperience] = useState<string>("3-plus");
  const [french, setFrench] = useState<string>("advanced");
  const [english, setEnglish] = useState<string>("intermediate");

  // Calcul indicatif CRS
  const calculateScore = () => {
    let score = 0;
    // Âge
    if (age === "20-29") score += 110;
    else if (age === "30" || age === "18-19" || age === "31-35") score += 95;
    else if (age === "36-40") score += 70;
    else score += 30;

    // Éducation
    if (education === "phd") score += 140;
    else if (education === "master") score += 135;
    else if (education === "bachelor") score += 120;
    else score += 90;

    // Expérience
    if (experience === "3-plus") score += 70;
    else if (experience === "2") score += 53;
    else score += 35;

    // Français & Anglais
    if (french === "advanced") score += 60;
    else if (french === "intermediate") score += 30;
    
    if (english === "advanced") score += 50;
    else if (english === "intermediate") score += 30;

    // Bonus francophonie / province
    score += 45;

    return Math.min(600, score);
  };

  const estimatedScore = calculateScore();
  const isCompetitive = estimatedScore >= 450;

  return (
    <section className="py-16 bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Calculator className="w-4 h-4 text-blue-600" />
            {language === "en" ? "Interactive Tool" : "Outil Interactif 3M Travel"}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-[#0a2540] tracking-tight">
            {language === "en" ? "Canada Immigration CRS Score Simulator" : "Simulateur Interactif de Score Canada (CRS)"}
          </h2>
          <p className="text-slate-600 mt-2 max-w-2xl mx-auto text-sm md:text-base font-medium">
            {language === "en"
              ? "Evaluate your estimated Express Entry score instantly and discover your eligibility for Canadian permanent residency."
              : "Estimez instantanément vos points Entrée Express et découvrez vos chances d'éligibilité pour la résidence permanente au Canada."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Formulaire de sélection */}
          <Card className="lg:col-span-7 bg-white/95 backdrop-blur shadow-xl border border-slate-200/80 rounded-2xl p-6 md:p-8">
            <CardHeader className="px-0 pt-0 pb-6">
              <CardTitle className="text-xl font-bold text-[#0a2540]">
                {language === "en" ? "Your Profile Criteria" : "Critères de Votre Profil"}
              </CardTitle>
              <CardDescription>
                {language === "en" ? "Select your background for a quick estimate" : "Sélectionnez vos caractéristiques principales pour une estimation rapide"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase">
                    {language === "en" ? "Age Range" : "Tranche d’âge"}
                  </Label>
                  <Select value={age} onValueChange={setAge}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
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

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase">
                    {language === "en" ? "Highest Education" : "Niveau d’études"}
                  </Label>
                  <Select value={education} onValueChange={setEducation}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phd">Doctorat / Ph.D.</SelectItem>
                      <SelectItem value="master">Master / Bac+5 ou plus</SelectItem>
                      <SelectItem value="bachelor">Licence / Bac+3</SelectItem>
                      <SelectItem value="diploma">BTS / DUT / Bac+2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase">
                    {language === "en" ? "Work Experience" : "Expérience professionnelle"}
                  </Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3-plus">3 ans et plus (Temps plein)</SelectItem>
                      <SelectItem value="2">2 ans</SelectItem>
                      <SelectItem value="1">1 an</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase">
                    {language === "en" ? "French Proficiency" : "Maîtrise du Français"}
                  </Label>
                  <Select value={french} onValueChange={setFrench}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advanced">Avancé (NCLC 7+ / B2-C2)</SelectItem>
                      <SelectItem value="intermediate">Intermédiaire</SelectItem>
                      <SelectItem value="none">Débutant / Aucun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase">
                  {language === "en" ? "English Proficiency" : "Maîtrise de l’Anglais (Optionnel)"}
                </Label>
                <Select value={english} onValueChange={setEnglish}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advanced">Courant (CLB 9+)</SelectItem>
                    <SelectItem value="intermediate">Intermédiaire (CLB 7-8)</SelectItem>
                    <SelectItem value="none">Basique / Aucun</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Résultat et appel à l’action */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#0a2540] to-[#1e3a8a] text-white rounded-3xl p-8 shadow-2xl border border-blue-400/30 relative overflow-hidden text-center"
            >
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-6 text-yellow-300 shadow-inner">
                <Award className="w-8 h-8" />
              </div>

              <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-1">
                {language === "en" ? "Estimated CRS Score" : "Score CRS Estimé"}
              </p>
              
              <div className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
                {estimatedScore} <span className="text-xl font-normal text-blue-200">/ 1200</span>
              </div>

              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 ${
                isCompetitive ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-amber-500/20 text-amber-300 border border-amber-400/40"
              }`}>
                <CheckCircle2 className="w-4 h-4" />
                {isCompetitive 
                  ? (language === "en" ? "Competitive Profile for Express Entry" : "Profil très compétitif pour Entrée Express")
                  : (language === "en" ? "Good Potential — Optimization Recommended" : "Bon potentiel — Voie provinciale conseillée")}
              </div>

              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                {language === "en"
                  ? "This simulation is indicative and provided by 3M Travel Agency. Official evaluation requires supporting document verification."
                  : "Cette simulation est purement indicative et non officielle. Pour une analyse approfondie et l'ouverture de votre dossier, réalisez votre évaluation complète en agence."}
              </p>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <Link href="/evaluation-primaire?destination=canada" className="inline-flex items-center justify-center gap-2">
                    <span>{language === "en" ? "Launch Official Evaluation" : "Lancer mon évaluation officielle"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Link>

                {!isCompetitive && (
                  <div className="rounded-xl bg-amber-950/60 border border-amber-500/30 p-4 text-left text-amber-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {language === "en" ? "Score Optimization Guidance" : "Orientation personnalisée (Score à renforcer)"}
                    </p>
                    <p className="text-xs leading-relaxed text-amber-100/90 mb-3">
                      {language === "en"
                        ? "Your current estimated score suggests that federal Express Entry might be challenging without improvements. However, provincial nomination programs (PNP), French-speaking pathways, or professional upskilling can significantly strengthen your profile. Do not give up: talk to our advisors."
                        : "Votre score estimé indique qu’Entrée express fédérale est exigeante en l’état. Pas de panique : les programmes des candidats des provinces (PCP), les volets francophones ou une optimisation des tests de langue et de l’expérience peuvent faire toute la différence. Échangez avec un conseiller 3M pour étudier vos meilleures alternatives."}
                    </p>
                    <a
                      href="https://wa.me/237698104832?text=Bonjour%203M%20Travel,%20j'ai%20réalisé%20ma%20simulation%20Canada%20et%20souhaite%20l'aide%20d'un%20conseiller%20pour%20optimiser%20mon%20profil."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 shadow transition-colors"
                    >
                      <span>{language === "en" ? "Consult a Canada Advisor on WhatsApp" : "Consulter un conseiller Canada sur WhatsApp"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
