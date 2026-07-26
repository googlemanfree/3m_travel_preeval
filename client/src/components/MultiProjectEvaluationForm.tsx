import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion } from "framer-motion";

type ProjectType = "travail" | "etudes" | "tourisme";

interface FormData {
  // Étape 1 : Infos générales
  fullName: string;
  email: string;
  whatsappPhone: string;
  currentCity: string;
  nationality: string;
  projectType: ProjectType;

  // Étape 2 : Champs conditionnels
  // TRAVAIL
  sector?: string;
  yearsOfExperience?: number;
  educationLevel?: string;
  languages?: string;
  cvAvailable?: boolean;

  // ÉTUDES
  diplomaLevel?: string;
  averageGrade?: string;
  admissionLetter?: boolean;
  financialGuarantee?: string;
  transcriptAvailable?: boolean;

  // TOURISME
  visitReason?: string;
  travelHistory?: string;
  previousRefusal?: boolean;
  socialTies?: string;
}

export function MultiProjectEvaluationForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    whatsappPhone: "",
    currentCity: "",
    nationality: "",
    projectType: "travail",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitEvaluation = trpc.evaluation.submitEvaluation.useMutation({
    onSuccess: () => {
      toast.success("Évaluation soumise avec succès ! Vérifiez votre email.");
      setStep(1);
      setFormData({
        fullName: "",
        email: "",
        whatsappPhone: "",
        currentCity: "",
        nationality: "",
        projectType: "travail",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la soumission");
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleNext = () => {
    // Validation étape 1
    if (!formData.fullName || !formData.email || !formData.whatsappPhone || !formData.nationality) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitEvaluation.mutateAsync(formData as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="p-8 bg-white shadow-lg border-0">
        {/* Indicateur de progression */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white transition-all ${
                step >= 1 ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              1
            </div>
            <div className={`flex-1 h-1 transition-all ${step >= 2 ? "bg-blue-600" : "bg-gray-300"}`} />
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white transition-all ${
                step >= 2 ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              2
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Informations générales</span>
            <span>Détails du projet</span>
          </div>
        </div>

        {/* ÉTAPE 1 : Infos générales */}
        {step === 1 && (
          <motion.div
            key="step1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations Générales</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className="text-gray-700 font-semibold">
                  Nom complet *
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Jean Dupont"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-700 font-semibold">
                  Email *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="jean@example.com"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="whatsappPhone" className="text-gray-700 font-semibold">
                  WhatsApp *
                </Label>
                <Input
                  id="whatsappPhone"
                  name="whatsappPhone"
                  value={formData.whatsappPhone}
                  onChange={handleInputChange}
                  placeholder="+237 6XX XXX XXX"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="nationality" className="text-gray-700 font-semibold">
                  Nationalité *
                </Label>
                <Input
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  placeholder="Camerounais"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="currentCity" className="text-gray-700 font-semibold">
                  Ville actuelle
                </Label>
                <Input
                  id="currentCity"
                  name="currentCity"
                  value={formData.currentCity}
                  onChange={handleInputChange}
                  placeholder="Yaoundé"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="projectType" className="text-gray-700 font-semibold">
                  Type de projet *
                </Label>
                <Select
                  value={formData.projectType}
                  onValueChange={(value) => handleSelectChange("projectType", value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="travail">Visa Travail</SelectItem>
                    <SelectItem value="etudes">Visa Études</SelectItem>
                    <SelectItem value="tourisme">Visa Tourisme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleNext}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              Continuer →
            </Button>
          </motion.div>
        )}

        {/* ÉTAPE 2 : Champs conditionnels */}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {formData.projectType === "travail" && "Détails - Visa Travail"}
              {formData.projectType === "etudes" && "Détails - Visa Études"}
              {formData.projectType === "tourisme" && "Détails - Visa Tourisme"}
            </h2>

            {/* VISA TRAVAIL */}
            {formData.projectType === "travail" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sector" className="text-gray-700 font-semibold">
                    Secteur d'activité
                  </Label>
                  <Input
                    id="sector"
                    name="sector"
                    value={formData.sector || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: Informatique, Santé, Construction"
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yearsOfExperience" className="text-gray-700 font-semibold">
                      Années d'expérience
                    </Label>
                    <Input
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      type="number"
                      value={formData.yearsOfExperience || ""}
                      onChange={handleInputChange}
                      placeholder="5"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="educationLevel" className="text-gray-700 font-semibold">
                      Niveau d'études
                    </Label>
                    <Select
                      value={formData.educationLevel || ""}
                      onValueChange={(value) => handleSelectChange("educationLevel", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bac">Baccalauréat</SelectItem>
                        <SelectItem value="licence">Licence</SelectItem>
                        <SelectItem value="master">Master</SelectItem>
                        <SelectItem value="doctorat">Doctorat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="languages" className="text-gray-700 font-semibold">
                    Langues parlées
                  </Label>
                  <Input
                    id="languages"
                    name="languages"
                    value={formData.languages || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: Français (courant), Anglais (intermédiaire)"
                    className="mt-2"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="cvAvailable"
                    checked={formData.cvAvailable || false}
                    onCheckedChange={(checked) => handleCheckboxChange("cvAvailable", checked as boolean)}
                  />
                  <Label htmlFor="cvAvailable" className="text-gray-700 cursor-pointer">
                    J'ai un CV à jour
                  </Label>
                </div>
              </div>
            )}

            {/* VISA ÉTUDES */}
            {formData.projectType === "etudes" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="diplomaLevel" className="text-gray-700 font-semibold">
                    Dernier diplôme obtenu
                  </Label>
                  <Select
                    value={formData.diplomaLevel || ""}
                    onValueChange={(value) => handleSelectChange("diplomaLevel", value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bac">Baccalauréat</SelectItem>
                      <SelectItem value="licence">Licence</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="averageGrade" className="text-gray-700 font-semibold">
                      Moyenne générale
                    </Label>
                    <Input
                      id="averageGrade"
                      name="averageGrade"
                      value={formData.averageGrade || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: 15/20"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="financialGuarantee" className="text-gray-700 font-semibold">
                      Garant financier
                    </Label>
                    <Input
                      id="financialGuarantee"
                      name="financialGuarantee"
                      value={formData.financialGuarantee || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: Parent, Sponsor"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="admissionLetter"
                    checked={formData.admissionLetter || false}
                    onCheckedChange={(checked) => handleCheckboxChange("admissionLetter", checked as boolean)}
                  />
                  <Label htmlFor="admissionLetter" className="text-gray-700 cursor-pointer">
                    J'ai une lettre d'admission
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="transcriptAvailable"
                    checked={formData.transcriptAvailable || false}
                    onCheckedChange={(checked) => handleCheckboxChange("transcriptAvailable", checked as boolean)}
                  />
                  <Label htmlFor="transcriptAvailable" className="text-gray-700 cursor-pointer">
                    J'ai mes relevés de notes
                  </Label>
                </div>
              </div>
            )}

            {/* VISA TOURISME */}
            {formData.projectType === "tourisme" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="visitReason" className="text-gray-700 font-semibold">
                    Motif de visite
                  </Label>
                  <Select
                    value={formData.visitReason || ""}
                    onValueChange={(value) => handleSelectChange("visitReason", value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tourisme">Tourisme</SelectItem>
                      <SelectItem value="famille">Visite famille</SelectItem>
                      <SelectItem value="affaires">Affaires</SelectItem>
                      <SelectItem value="conference">Conférence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="travelHistory" className="text-gray-700 font-semibold">
                    Historique de voyages
                  </Label>
                  <Textarea
                    id="travelHistory"
                    name="travelHistory"
                    value={formData.travelHistory || ""}
                    onChange={handleInputChange}
                    placeholder="Pays visités, dates, durées..."
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="previousRefusal"
                    checked={formData.previousRefusal || false}
                    onCheckedChange={(checked) => handleCheckboxChange("previousRefusal", checked as boolean)}
                  />
                  <Label htmlFor="previousRefusal" className="text-gray-700 cursor-pointer">
                    J'ai eu un refus de visa antérieur
                  </Label>
                </div>

                <div>
                  <Label htmlFor="socialTies" className="text-gray-700 font-semibold">
                    Attaches socio-économiques
                  </Label>
                  <Textarea
                    id="socialTies"
                    name="socialTies"
                    value={formData.socialTies || ""}
                    onChange={handleInputChange}
                    placeholder="Emploi, famille, propriété, etc."
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 py-3 rounded-lg border-gray-300"
              >
                ← Retour
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-all"
              >
                {isSubmitting ? "Envoi en cours..." : "Soumettre l'Évaluation"}
              </Button>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
