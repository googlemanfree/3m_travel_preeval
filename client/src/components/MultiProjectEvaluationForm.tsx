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
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";

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
      toast.success("✅ Évaluation soumise ! Vérifiez votre email pour le bilan.");
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
      toast.error(error.message || "❌ Erreur lors de la soumission");
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
    if (!formData.fullName || !formData.email || !formData.whatsappPhone || !formData.nationality) {
      toast.error("⚠️ Veuillez remplir tous les champs obligatoires");
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

  return (
    <motion.div
      className="w-full max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-8 bg-gradient-to-br from-white to-slate-50 shadow-xl border-0 rounded-2xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">
            Auto-Évaluation
          </h2>
          <p className="text-slate-600 text-sm font-medium">
            Étape {step} de 2 • {step === 1 ? "Informations de base" : "Détails de votre projet"}
          </p>
        </div>

        {/* Barre de progression fluide */}
        <div className="mb-10">
          <div className="flex gap-2">
            {[1, 2].map((s) => (
              <motion.div
                key={s}
                className={`flex-1 h-2.5 rounded-full transition-all duration-500 ${
                  s <= step
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg"
                    : "bg-slate-200"
                }`}
                layoutId={`progress-${s}`}
              />
            ))}
          </div>
        </div>

        {/* Contenu des étapes avec animations fluides */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-700 font-semibold text-sm">
                    Nom & Prénom *
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Jean Dupont"
                    className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-semibold text-sm">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="jean@example.com"
                    className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappPhone" className="text-slate-700 font-semibold text-sm">
                    WhatsApp *
                  </Label>
                  <Input
                    id="whatsappPhone"
                    name="whatsappPhone"
                    value={formData.whatsappPhone}
                    onChange={handleInputChange}
                    placeholder="+237 6XX XXX XXX"
                    className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality" className="text-slate-700 font-semibold text-sm">
                    Nationalité *
                  </Label>
                  <Input
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    placeholder="Camerounais"
                    className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentCity" className="text-slate-700 font-semibold text-sm">
                    Ville actuelle
                  </Label>
                  <Input
                    id="currentCity"
                    name="currentCity"
                    value={formData.currentCity}
                    onChange={handleInputChange}
                    placeholder="Yaoundé"
                    className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectType" className="text-slate-700 font-semibold text-sm">
                    Type de projet *
                  </Label>
                  <Select
                    value={formData.projectType}
                    onValueChange={(value) => handleSelectChange("projectType", value)}
                  >
                    <SelectTrigger className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="travail">💼 Visa Travail</SelectItem>
                      <SelectItem value="etudes">🎓 Visa Études</SelectItem>
                      <SelectItem value="tourisme">✈️ Visa Tourisme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 font-medium">
                  {formData.projectType === "travail" && "📋 Détails - Visa Travail"}
                  {formData.projectType === "etudes" && "📚 Détails - Visa Études"}
                  {formData.projectType === "tourisme" && "🌍 Détails - Visa Tourisme"}
                </p>
              </div>

              {/* VISA TRAVAIL */}
              {formData.projectType === "travail" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="sector" className="text-slate-700 font-semibold text-sm">
                      Secteur d'activité
                    </Label>
                    <Input
                      id="sector"
                      name="sector"
                      value={formData.sector || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: Informatique, Santé, Construction"
                      className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="yearsOfExperience" className="text-slate-700 font-semibold text-sm">
                        Années d'expérience
                      </Label>
                      <Input
                        id="yearsOfExperience"
                        name="yearsOfExperience"
                        type="number"
                        value={formData.yearsOfExperience || ""}
                        onChange={handleInputChange}
                        placeholder="5"
                        className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="educationLevel" className="text-slate-700 font-semibold text-sm">
                        Niveau d'études
                      </Label>
                      <Select
                        value={formData.educationLevel || ""}
                        onValueChange={(value) => handleSelectChange("educationLevel", value)}
                      >
                        <SelectTrigger className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all">
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

                  <div className="space-y-2">
                    <Label htmlFor="languages" className="text-slate-700 font-semibold text-sm">
                      Langues parlées
                    </Label>
                    <Input
                      id="languages"
                      name="languages"
                      value={formData.languages || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: Français (courant), Anglais (intermédiaire)"
                      className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      id="cvAvailable"
                      checked={formData.cvAvailable || false}
                      onCheckedChange={(checked) => handleCheckboxChange("cvAvailable", checked as boolean)}
                    />
                    <Label htmlFor="cvAvailable" className="text-slate-700 cursor-pointer text-sm">
                      J'ai un CV à jour
                    </Label>
                  </div>
                </div>
              )}

              {/* VISA ÉTUDES */}
              {formData.projectType === "etudes" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="diplomaLevel" className="text-slate-700 font-semibold text-sm">
                      Dernier diplôme obtenu
                    </Label>
                    <Select
                      value={formData.diplomaLevel || ""}
                      onValueChange={(value) => handleSelectChange("diplomaLevel", value)}
                    >
                      <SelectTrigger className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="averageGrade" className="text-slate-700 font-semibold text-sm">
                        Moyenne générale
                      </Label>
                      <Input
                        id="averageGrade"
                        name="averageGrade"
                        value={formData.averageGrade || ""}
                        onChange={handleInputChange}
                        placeholder="Ex: 15/20"
                        className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="financialGuarantee" className="text-slate-700 font-semibold text-sm">
                        Garant financier
                      </Label>
                      <Input
                        id="financialGuarantee"
                        name="financialGuarantee"
                        value={formData.financialGuarantee || ""}
                        onChange={handleInputChange}
                        placeholder="Ex: Parent, Sponsor"
                        className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      id="admissionLetter"
                      checked={formData.admissionLetter || false}
                      onCheckedChange={(checked) => handleCheckboxChange("admissionLetter", checked as boolean)}
                    />
                    <Label htmlFor="admissionLetter" className="text-slate-700 cursor-pointer text-sm">
                      J'ai une lettre d'admission
                    </Label>
                  </div>
                </div>
              )}

              {/* VISA TOURISME */}
              {formData.projectType === "tourisme" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="visitReason" className="text-slate-700 font-semibold text-sm">
                      Raison du voyage
                    </Label>
                    <Input
                      id="visitReason"
                      name="visitReason"
                      value={formData.visitReason || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: Visite familiale, Tourisme"
                      className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="travelHistory" className="text-slate-700 font-semibold text-sm">
                      Historique de voyage
                    </Label>
                    <Input
                      id="travelHistory"
                      name="travelHistory"
                      value={formData.travelHistory || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: Visas antérieurs, pays visités"
                      className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="socialTies" className="text-slate-700 font-semibold text-sm">
                      Attaches socio-économiques
                    </Label>
                    <Input
                      id="socialTies"
                      name="socialTies"
                      value={formData.socialTies || ""}
                      onChange={handleInputChange}
                      placeholder="Ex: Emploi, Propriété, Famille"
                      className="rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      id="previousRefusal"
                      checked={formData.previousRefusal || false}
                      onCheckedChange={(checked) => handleCheckboxChange("previousRefusal", checked as boolean)}
                    />
                    <Label htmlFor="previousRefusal" className="text-slate-700 cursor-pointer text-sm">
                      J'ai un historique de refus de visa
                    </Label>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boutons de navigation */}
        <div className="mt-10 flex gap-3 justify-between">
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 border-slate-300 hover:bg-slate-50 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </Button>
            </motion.div>
          )}

          {step === 1 ? (
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                Continuer
                <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              className="flex-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold py-3 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "⏳ Envoi en cours..." : "✓ Soumettre mon évaluation"}
                {!isSubmitting && <CheckCircle2 className="w-4 h-4" />}
              </Button>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
