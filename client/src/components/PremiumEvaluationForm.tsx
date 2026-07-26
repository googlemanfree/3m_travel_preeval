import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import PremiumEvaluationFormSteps47 from "./PremiumEvaluationFormSteps47";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
type ProjectType = "student" | "visitor" | "worker" | "permanent_residence" | "family_reunification" | "other";

interface FormData {
  // Étape 1: Choix principal
  destination: string;
  projectType: ProjectType;
  currentCountry: string;
  communicationLanguage: "fr" | "en";

  // Étape 2: Identité, Passeport, Famille
  fullName: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  whatsappPhone: string;
  email: string;
  passportNumber: string;
  passportExpiryDate: string;
  passportCopyAvailable: string;
  maritalStatus: string;
  numberOfChildren: number;
  familyInDestination: string;

  // Étape 3: Études, Emploi, Finances
  educationLevel: string;
  fieldOfStudy: string;
  currentProfession: string;
  yearsOfExperience: number;
  monthlyIncome: string;
  bankBalance: string;
  sponsor: string;

  // Étape 4: Voyage & Admissibilité
  countriesVisited: string;
  visaRefusals: string;
  criminalRecord: string;

  // Étape 5: Sections conditionnelles
  desiredEducationLevel: string;
  admissionLetterAvailable: boolean;
  targetInstitution: string;
  intendedStartDate: string;
  studyBudget: number;
  academicProject: string;
  visitType: "tourism" | "family" | "business" | "event" | "other" | "";
  plannedStayDuration: string;
  estimatedTravelDate: string;
  tiesInHomeCountry: string;
  desiredPosition: string;
  targetCity: string;
  languageLevel: string;
  jobOfferAvailable: boolean;
  previousExperiences: string;
  targetCategory: string;
  age: number;
  experienceYears: number;
  provincialNomination: boolean;
  policeCertificatesAvailable: boolean;
  availableFunds: number;

  // Étape 6: Documents
  uploadedFiles: any[];

  // Autres
  [key: string]: any;
}

const DESTINATIONS = [
  "Canada",
  "France",
  "Allemagne",
  "Belgique",
  "États-Unis",
  "Royaume-Uni",
  "Italie",
  "Espagne",
  "Suisse",
  "Pays-Bas",
  "Dubaï / EAU",
  "Australie",
  "Autre",
];

const PROJECT_TYPES = [
  { value: "student", label: "Permis d'Études / Visa Étudiant" },
  { value: "visitor", label: "Visiteur / Tourisme / Affaires" },
  { value: "worker", label: "Permis de Travail / Emploi" },
  { value: "permanent_residence", label: "Résidence Permanente / Express Entry" },
  { value: "family_reunification", label: "Regroupement Familial / Parrainage" },
  { value: "other", label: "Autre projet" },
];

const EDUCATION_LEVELS = [
  "Baccalauréat / Secondaire",
  "BTS / DUT (Bac+2)",
  "Licence / Bachelor (Bac+3)",
  "Master (Bac+5)",
  "Doctorat",
];

const MARITAL_STATUS = [
  "Célibataire",
  "Marié(e)",
  "Divorcé(e)",
  "Veuf/Veuve",
  "Union civile",
];

export default function PremiumEvaluationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    destination: "",
    projectType: "student",
    currentCountry: "",
    communicationLanguage: "fr",
    fullName: "",
    gender: "",
    dateOfBirth: "",
    nationality: "",
    whatsappPhone: "",
    email: "",
    passportNumber: "",
    passportExpiryDate: "",
    passportCopyAvailable: "",
    maritalStatus: "",
    numberOfChildren: 0,
    familyInDestination: "",
    educationLevel: "",
    fieldOfStudy: "",
    currentProfession: "",
    yearsOfExperience: 0,
    monthlyIncome: "",
    bankBalance: "",
    sponsor: "",
    countriesVisited: "",
    visaRefusals: "",
    criminalRecord: "",
    desiredEducationLevel: "",
    admissionLetterAvailable: false,
    targetInstitution: "",
    intendedStartDate: "",
    studyBudget: 0,
    academicProject: "",
    visitType: "" as any,
    plannedStayDuration: "",
    estimatedTravelDate: "",
    tiesInHomeCountry: "",
    desiredPosition: "",
    targetCity: "",
    languageLevel: "",
    jobOfferAvailable: false,
    previousExperiences: "",
    targetCategory: "",
    age: 0,
    experienceYears: 0,
    provincialNomination: false,
    policeCertificatesAvailable: false,
    availableFunds: 0,
    uploadedFiles: [],
  });

  const submitMutation = trpc.profileEvaluation.submit.useMutation();

  const handleInputChange = (field: string, value: any) => {
    // Gestion spéciale pour la navigation vers une étape spécifique
    if (field === '_goToStep') {
      setCurrentStep(value);
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      return !!(formData.destination && formData.projectType && formData.currentCountry);
    }
    if (step === 2) {
      return !!(
        formData.fullName &&
        formData.gender &&
        formData.dateOfBirth &&
        formData.nationality &&
        formData.whatsappPhone &&
        formData.email &&
        formData.passportNumber &&
        formData.passportExpiryDate &&
        formData.maritalStatus
      );
    }
    if (step === 3) {
      return !!(
        formData.educationLevel &&
        formData.fieldOfStudy &&
        formData.currentProfession &&
        formData.yearsOfExperience >= 0 &&
        formData.monthlyIncome &&
        formData.bankBalance &&
        formData.sponsor
      );
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 7) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast.error("Veuillez remplir tous les champs obligatoires");
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const [, setLocation] = useLocation();

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitMutation.mutateAsync({
        destination: formData.destination,
        projectType: formData.projectType,
        currentCountry: formData.currentCountry,
        communicationLanguage: formData.communicationLanguage,
        fullName: formData.fullName,
        gender: (formData.gender === "Masculin" ? "homme" : formData.gender === "Féminin" ? "femme" : "autre") as any,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        whatsappPhone: formData.whatsappPhone,
        email: formData.email,
        passportNumber: formData.passportNumber,
        passportExpiryDate: formData.passportExpiryDate,
        passportCopyAvailable: formData.passportCopyAvailable === "Oui",
        maritalStatus: (formData.maritalStatus === "Célibataire" ? "single" : formData.maritalStatus === "Marié(e)" ? "married" : formData.maritalStatus === "Divorcé(e)" ? "divorced" : formData.maritalStatus === "Veuf/Veuve" ? "widowed" : "civil_union") as any,
        numberOfChildren: formData.numberOfChildren,
        familyInDestination: formData.familyInDestination === "Oui",
        educationLevel: formData.educationLevel,
        fieldOfStudy: formData.fieldOfStudy,
        currentProfession: formData.currentProfession,
              yearsOfExperience: formData.yearsOfExperience,
              monthlyIncome: parseInt(formData.monthlyIncome) || 0,
              bankBalance: parseInt(formData.bankBalance) || 0,
              hasSponsor: formData.sponsor !== "Auto-prise en charge",
              sponsorName: formData.sponsor,
              countriesVisited: formData.countriesVisited,
              visaRefusals: formData.visaRefusals === "Oui",
              criminalRecord: formData.criminalRecord === "Oui",
              desiredEducationLevel: formData.desiredEducationLevel,
              admissionLetterAvailable: formData.admissionLetterAvailable,
              targetInstitution: formData.targetInstitution,
              intendedStartDate: formData.intendedStartDate,
              studyBudget: formData.studyBudget,
              academicProject: formData.academicProject,
              visitType: (formData.visitType || "other") as any,
              plannedStayDuration: formData.plannedStayDuration,
              estimatedTravelDate: formData.estimatedTravelDate,
              tiesInHomeCountry: formData.tiesInHomeCountry,
              desiredPosition: formData.desiredPosition,
              targetCity: formData.targetCity,
              languageLevel: formData.languageLevel,
              jobOfferAvailable: formData.jobOfferAvailable,
              targetCategory: formData.targetCategory,
              age: formData.age,
              experienceYears: formData.experienceYears,
              provincialNomination: formData.provincialNomination,
              policeCertificatesAvailable: formData.policeCertificatesAvailable,
              availableFunds: formData.availableFunds,
      });
      setIsSuccess(true);
      toast.success("Formulaire soumis avec succès !");
      // Rediriger vers la page de résultat après 2 secondes
      setTimeout(() => {
        setLocation(`/evaluation-result?destination=${formData.destination}&projectType=${formData.projectType}`);
      }, 2000);
    } catch (error) {
      toast.error("Erreur lors de la soumission du formulaire");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / 7) * 100;

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20"
      >
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Formulaire soumis !</h2>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          Votre évaluation de profil a été reçue. Notre équipe analysera votre dossier et vous contactera sous 24 heures.
        </p>
        <Button
          onClick={() => {
            setIsSuccess(false);
            setCurrentStep(1);
            setFormData({
              destination: "",
              projectType: "student",
              currentCountry: "",
              communicationLanguage: "fr",
              fullName: "",
              gender: "",
              dateOfBirth: "",
              nationality: "",
              whatsappPhone: "",
              email: "",
              passportNumber: "",
              passportExpiryDate: "",
              passportCopyAvailable: "",
              maritalStatus: "",
              numberOfChildren: 0,
              familyInDestination: "",
              educationLevel: "",
              fieldOfStudy: "",
              currentProfession: "",
              yearsOfExperience: 0,
              monthlyIncome: "",
              bankBalance: "",
              sponsor: "",
              countriesVisited: "",
              visaRefusals: "",
              criminalRecord: "",
              desiredEducationLevel: "",
              admissionLetterAvailable: false,
              targetInstitution: "",
              intendedStartDate: "",
              studyBudget: 0,
              academicProject: "",
              visitType: "" as any,
              plannedStayDuration: "",
              estimatedTravelDate: "",
              tiesInHomeCountry: "",
              desiredPosition: "",
              targetCity: "",
              languageLevel: "",
              jobOfferAvailable: false,
              previousExperiences: "",
              targetCategory: "",
              age: 0,
              experienceYears: 0,
              provincialNomination: false,
              policeCertificatesAvailable: false,
              availableFunds: 0,
              uploadedFiles: [],
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Nouvelle évaluation
        </Button>
      </motion.div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto border-blue-100 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-10 text-white text-center">
        <h1 className="text-4xl font-bold mb-2">Évaluation de Profil</h1>
        <p className="text-blue-100 text-lg">
          Choisissez votre destination et votre projet pour une analyse personnalisée
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="text-sm text-gray-600 text-center">
          Étape {currentStep} sur 7
        </div>
      </div>

      {/* Form Body */}
      <div className="p-8">
        <AnimatePresence mode="wait">
          {/* ÉTAPE 1: Choix Principal */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Orientation & Projet</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Pays de destination visé <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.destination} onValueChange={(v) => handleInputChange("destination", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {DESTINATIONS.map((dest) => (
                        <SelectItem key={dest} value={dest}>
                          {dest}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Type de projet <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.projectType} onValueChange={(v) => handleInputChange("projectType", v as ProjectType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((pt) => (
                        <SelectItem key={pt.value} value={pt.value}>
                          {pt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label className="text-sm font-semibold mb-2 block">
                    Ville et Pays de résidence actuelle <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Ex: Douala, Cameroun"
                    value={formData.currentCountry}
                    onChange={(e) => handleInputChange("currentCountry", e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-sm font-semibold mb-2 block">
                    Langue de communication <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.communicationLanguage} onValueChange={(v) => handleInputChange("communicationLanguage", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">Anglais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 2: Identité, Passeport, Famille */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Identité, Passeport & Famille</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Nom complet <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Comme sur le passeport"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Sexe <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.gender} onValueChange={(v) => handleInputChange("gender", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculin">Masculin</SelectItem>
                      <SelectItem value="Féminin">Féminin</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Date de naissance <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Nationalité <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Ex: Camerounaise"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange("nationality", e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Téléphone WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="+237 6XXXXXXXX"
                    value={formData.whatsappPhone}
                    onChange={(e) => handleInputChange("whatsappPhone", e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Numéro de passeport <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Ex: AB123456"
                    value={formData.passportNumber}
                    onChange={(e) => handleInputChange("passportNumber", e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Date d'expiration passeport <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.passportExpiryDate}
                    onChange={(e) => handleInputChange("passportExpiryDate", e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Copie passeport disponible ? <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.passportCopyAvailable} onValueChange={(v) => handleInputChange("passportCopyAvailable", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Oui">Oui</SelectItem>
                      <SelectItem value="En cours">En cours</SelectItem>
                      <SelectItem value="Non">Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    État civil <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.maritalStatus} onValueChange={(v) => handleInputChange("maritalStatus", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARITAL_STATUS.map((ms) => (
                        <SelectItem key={ms} value={ms}>
                          {ms}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Nombre d'enfants / Personnes à charge
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.numberOfChildren}
                    onChange={(e) => handleInputChange("numberOfChildren", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Famille dans le pays cible ?
                  </Label>
                  <Select value={formData.familyInDestination} onValueChange={(v) => handleInputChange("familyInDestination", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Non">Non</SelectItem>
                      <SelectItem value="Oui">Oui - Citoyen / Résident</SelectItem>
                      <SelectItem value="Oui - Étudiant">Oui - Étudiant / Travailleur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 3: Études, Emploi, Finances */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Études, Emploi & Finances</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Niveau d'études <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.educationLevel} onValueChange={(v) => handleInputChange("educationLevel", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((el) => (
                        <SelectItem key={el} value={el}>
                          {el}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Domaine d'études <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Ex: Informatique, Droit"
                    value={formData.fieldOfStudy}
                    onChange={(e) => handleInputChange("fieldOfStudy", e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Profession actuelle <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Ex: Ingénieur, Enseignant"
                    value={formData.currentProfession}
                    onChange={(e) => handleInputChange("currentProfession", e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Années d'expérience <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.yearsOfExperience}
                    onChange={(e) => handleInputChange("yearsOfExperience", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Revenu mensuel estimé <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.monthlyIncome} onValueChange={(v) => handleInputChange("monthlyIncome", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Moins de 300 000 FCFA">Moins de 300 000 FCFA (&lt; 500 €)</SelectItem>
                      <SelectItem value="300 000 à 750 000 FCFA">300 000 à 750 000 FCFA (500 € - 1 150 €)</SelectItem>
                      <SelectItem value="Plus de 750 000 FCFA">Plus de 750 000 FCFA (&gt; 1 150 €)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    Épargne bancaire <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.bankBalance} onValueChange={(v) => handleInputChange("bankBalance", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Moins de 3 Millions FCFA">Moins de 3 M FCFA (&lt; 4 500 €)</SelectItem>
                      <SelectItem value="3M à 7M FCFA">3 M à 7 M FCFA (4 500 € - 10 000 €)</SelectItem>
                      <SelectItem value="7M à 15M FCFA">7 M à 15 M FCFA (10 000 € - 23 000 €)</SelectItem>
                      <SelectItem value="Plus de 15 Millions FCFA">Plus de 15 M FCFA (&gt; 23 000 €)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label className="text-sm font-semibold mb-2 block">
                    Garant / Sponsor financier <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.sponsor} onValueChange={(v) => handleInputChange("sponsor", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Auto-prise en charge">Auto-prise en charge</SelectItem>
                      <SelectItem value="Parents">Parents / Famille directe</SelectItem>
                      <SelectItem value="Tuteur Étranger">Tuteur à l'étranger</SelectItem>
                      <SelectItem value="Bourse">Bourse d'études accordée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 4-7: Sections conditionnelles et documents */}
          {currentStep > 3 && currentStep <= 7 && (
            <PremiumEvaluationFormSteps47
              formData={formData}
              onFormDataChange={handleInputChange}
              onNext={handleNext}
              onPrev={handlePrev}
              currentStep={currentStep}
            />
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </Button>

          {currentStep < 7 ? (
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              Suivant
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? "Envoi en cours..." : "Soumettre"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
