import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { motion } from "framer-motion";
import React from "react";
import { useLocation } from "wouter";

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
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const projectParam = searchParams.get("project") as ProjectType | null;
  const destinationParam = searchParams.get("destination") || "";

  const [formData, setFormData] = React.useState<FormData>({
    fullName: "",
    email: "",
    whatsappPhone: "",
    nationality: "",
    projectType: projectParam && ["travail", "etudes", "tourisme"].includes(projectParam) ? projectParam : (destinationParam ? "etudes" : "travail"),
    sector: destinationParam ? `Destination souhaitée : ${destinationParam}` : undefined,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [whatsappCopied, setWhatsappCopied] = React.useState(false);
  const [emailCopied, setEmailCopied] = React.useState(false);

  React.useEffect(() => {
    if (projectParam && ["travail", "etudes", "tourisme"].includes(projectParam)) {
      setFormData((prev) => ({ ...prev, projectType: projectParam }));
    }
    if (destinationParam) {
      setFormData((prev) => ({
        ...prev,
        projectType: "etudes",
        sector: prev.sector ? prev.sector : `Destination souhaitée : ${destinationParam}`,
      }));
    }
  }, [projectParam, destinationParam]);

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
                placeholder="Camerounaise"
                className="mt-2"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="projectType" className="text-gray-700 font-semibold">
                Type de projet *
              </Label>
              <Select
                value={formData.projectType}
                onValueChange={(value) => handleSelectChange("projectType", value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="travail">Visa Travail / Professionnel</SelectItem>
                  <SelectItem value="etudes">Visa Études</SelectItem>
                  <SelectItem value="tourisme">Visa Tourisme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.projectType === "travail" && (
              <>
                <div>
                  <Label htmlFor="sector" className="text-gray-700 font-semibold">
                    Secteur d'activité / Destination souhaitée
                  </Label>
                  <Input
                    id="sector"
                    name="sector"
                    value={formData.sector || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: Informatique ou Destination : Canada"
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
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bac">Baccalauréat</SelectItem>
                      <SelectItem value="licence">Licence</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sector" className="text-gray-700 font-semibold">
                    Destination souhaitée (ou filière)
                  </Label>
                  <Input
                    id="sector"
                    name="sector"
                    value={formData.sector || ""}
                    onChange={handleInputChange}
                    placeholder="Ex: Canada, France, Allemagne..."
                    className="mt-2"
                  />
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

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => {
                const text = `Bonjour 3M Travel, voici les détails de mon projet :\n- Nom : ${formData.fullName || "(Non renseigné)"}\n- Email : ${formData.email || "(Non renseigné)"}\n- WhatsApp : ${formData.whatsappPhone || "(Non renseigné)"}\n- Nationalité : ${formData.nationality || "(Non renseignée)"}\n- Type de projet : ${formData.projectType.toUpperCase()}\n- Précisions / Destination : ${formData.sector || "Non spécifié"}`;
                const encoded = encodeURIComponent(text);
                window.open(`https://wa.me/237698104832?text=${encoded}`, "_blank");
                setWhatsappCopied(true);
                setTimeout(() => setWhatsappCopied(false), 3500);
              }}
              className={`w-full inline-flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg transition-all shadow-sm ${
                whatsappCopied
                  ? "bg-emerald-700 text-white scale-[1.01] ring-2 ring-emerald-300"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              {whatsappCopied ? "✓ Redirection WhatsApp ouverte !" : "Envoyer les détails par WhatsApp au conseiller"}
            </button>

            <button
              type="button"
              onClick={() => {
                const subject = encodeURIComponent(`Nouvelle demande d’évaluation - ${formData.fullName || "Candidat 3M"}`);
                const body = encodeURIComponent(`Bonjour l'équipe 3M Travel & Services,\n\nVoici les détails de mon projet de mobilité :\n\n- Nom complet : ${formData.fullName || "(Non renseigné)"}\n- Adresse e-mail : ${formData.email || "(Non renseigné)"}\n- Téléphone WhatsApp : ${formData.whatsappPhone || "(Non renseigné)"}\n- Nationalité : ${formData.nationality || "(Non renseignée)"}\n- Type de projet : ${formData.projectType.toUpperCase()}\n- Précisions / Destination : ${formData.sector || "Non spécifié"}\n\nMerci de bien vouloir étudier mon dossier.`);
                window.location.href = `mailto:hello@3mtravelagency.com?subject=${subject}&body=${body}`;
                setEmailCopied(true);
                setTimeout(() => setEmailCopied(false), 3500);
              }}
              className={`w-full inline-flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg transition-all shadow-sm ${
                emailCopied
                  ? "bg-blue-700 text-white scale-[1.01] ring-2 ring-blue-300"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-6V6l8 5 8-2v2z"/>
              </svg>
              {emailCopied ? "✓ Application e-mail ouverte !" : "Envoyer les détails par e-mail au conseiller"}
            </button>
          </div>
        </form>

        <p className="text-sm text-gray-600 mt-4 text-center">
          ✓ Évaluation gratuite • ✓ Réponse en 24h • ✓ Confidentiel
        </p>
      </Card>
    </motion.div>
  );
}
