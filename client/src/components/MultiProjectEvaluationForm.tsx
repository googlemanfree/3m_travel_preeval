import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion } from "framer-motion";

type ProjectType = "travail" | "etudes" | "tourisme";

interface FormData {
  fullName: string;
  email: string;
  whatsappPhone: string;
  nationality: string;
  projectType: ProjectType;
  sector?: string;
  yearsOfExperience?: number;
  educationLevel?: string;
  languages?: string;
}

export function SimpleMultiProjectForm() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    whatsappPhone: "",
    nationality: "",
    projectType: "travail",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitEvaluation = trpc.evaluation.submitEvaluation.useMutation({
    onSuccess: () => {
      toast.success("Évaluation soumise avec succès ! Vérifiez votre email.");
      setFormData({
        fullName: "",
        email: "",
        whatsappPhone: "",
        nationality: "",
        projectType: "travail",
      });
    },
    onError: (error: any) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.whatsappPhone || !formData.nationality) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitEvaluation.mutateAsync(formData as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-8 bg-white shadow-lg border-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Évaluation Gratuite en 24h</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label htmlFor="projectType" className="text-gray-700 font-semibold">
                Type de projet *
              </Label>
              <Select
                value={formData.projectType}
                onValueChange={(value) => handleSelectChange("projectType", value)}
              >
                <SelectTrigger id="projectType" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travail">Visa Travail</SelectItem>
                  <SelectItem value="etudes">Visa Études</SelectItem>
                  <SelectItem value="tourisme">Visa Tourisme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.projectType === "travail" && (
              <>
                <div>
                  <Label htmlFor="sector" className="text-gray-700 font-semibold">
                    Secteur d'activité
                  </Label>
                  <Input
                    id="sector"
                    name="sector"
                    value={formData.sector || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: Informatique"
                    className="mt-2"
                  />
                </div>

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
              </>
            )}

            {formData.projectType === "etudes" && (
              <>
                <div>
                  <Label htmlFor="educationLevel" className="text-gray-700 font-semibold">
                    Niveau d'études
                  </Label>
                  <Select
                    value={formData.educationLevel || ""}
                    onValueChange={(value) => handleSelectChange("educationLevel", value)}
                  >
                    <SelectTrigger id="educationLevel" className="mt-2">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bac">Baccalauréat</SelectItem>
                      <SelectItem value="licence">Licence</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-all"
          >
            {isSubmitting ? "Envoi en cours..." : "Soumettre l'Évaluation"}
          </Button>
        </form>

        <p className="text-sm text-gray-600 mt-4 text-center">
          ✓ Évaluation gratuite • ✓ Réponse en 24h • ✓ Confidentiel
        </p>
      </Card>
    </motion.div>
  );
}
