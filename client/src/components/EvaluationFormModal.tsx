import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const evaluationFormSchema = z.object({
  fullName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  whatsappNumber: z.string().min(10, "Numéro WhatsApp requis"),
  city: z.string().min(2, "Ville requise"),
  destinationCountry: z.string().min(2, "Destination requise"),
  projectType: z.enum(["etude", "travail", "tourisme", "residence"]),
  academicLevel: z.string().optional(),
  experienceYears: z.string().optional(),
});

type EvaluationFormData = z.infer<typeof evaluationFormSchema>;

interface EvaluationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EvaluationFormModal({ isOpen, onClose }: EvaluationFormModalProps) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDossier, setSuccessDossier] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationFormSchema),
  });

  const submitMutation = trpc.evaluationAI.submitEvaluation.useMutation({
    onSuccess: (data) => {
      toast.success(`Dossier ${data.dossierNumber} créé avec succès!`);
      setSuccessDossier(data.dossierNumber);
      reset();
      setCvFile(null);
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        window.location.href = `/mon-espace?dossier=${data.dossierNumber}`;
      }, 2000);
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: EvaluationFormData) => {
    setIsSubmitting(true);

    try {
      // Préparer les données pour la soumission
      const submitData = {
        ...data,
        experienceYears: data.experienceYears ? parseInt(data.experienceYears) : undefined,
        cvFileKey: cvFile ? `evaluations/${Date.now()}-${cvFile.name}` : undefined,
      };

      // Si un CV est fourni, l'uploader d'abord
      if (cvFile) {
        const formData = new FormData();
        formData.append("file", cvFile);

        try {
          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error("Erreur lors de l'upload du CV");
          }

          const uploadedData = await uploadResponse.json();
          submitData.cvFileKey = uploadedData.key;
        } catch (uploadError) {
          console.error("Erreur d'upload:", uploadError);
          toast.warning("CV non uploadé, l'évaluation continue sans CV");
        }
      }

      // Soumettre l'évaluation
      await submitMutation.mutateAsync(submitData);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast.error("Erreur lors de la soumission du formulaire");
      setIsSubmitting(false);
    }
  };

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Le fichier doit faire moins de 5 MB");
        return;
      }
      if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
        toast.error("Veuillez uploader un PDF ou un document Word");
        return;
      }
      setCvFile(file);
    }
  };

  if (successDossier) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Dossier créé avec succès!</h3>
            <p className="text-gray-600 mb-4">
              Votre dossier <strong>{successDossier}</strong> a été enregistré.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Votre bilan sera disponible dans 48 heures.
            </p>
            <Button
              onClick={() => {
                window.location.href = `/mon-espace?dossier=${successDossier}`;
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Voir mon dossier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Évaluation d'Éligibilité</DialogTitle>
          <DialogDescription>
            Remplissez le formulaire ci-dessous pour une pré-évaluation gratuite
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations personnelles */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Informations personnelles</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Nom complet *</Label>
                <Input
                  id="fullName"
                  {...register("fullName")}
                  placeholder="Jean Dupont"
                  className="mt-1"
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="jean@example.com"
                  className="mt-1"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="whatsappNumber">Numéro WhatsApp *</Label>
                <Input
                  id="whatsappNumber"
                  {...register("whatsappNumber")}
                  placeholder="+237 6 98 10 48 32"
                  className="mt-1"
                />
                {errors.whatsappNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.whatsappNumber.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="Yaoundé"
                  className="mt-1"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Projet d'immigration */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Projet d'immigration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destinationCountry">Destination *</Label>
                <Input
                  id="destinationCountry"
                  {...register("destinationCountry")}
                  placeholder="Canada"
                  className="mt-1"
                />
                {errors.destinationCountry && (
                  <p className="text-red-500 text-sm mt-1">{errors.destinationCountry.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="projectType">Type de projet *</Label>
                <select
                  id="projectType"
                  {...register("projectType")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                >
                  <option value="">Sélectionner...</option>
                  <option value="etude">Études</option>
                  <option value="travail">Travail</option>
                  <option value="tourisme">Tourisme</option>
                  <option value="residence">Résidence</option>
                </select>
                {errors.projectType && (
                  <p className="text-red-500 text-sm mt-1">{errors.projectType.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="academicLevel">Niveau d'études</Label>
                <Input
                  id="academicLevel"
                  {...register("academicLevel")}
                  placeholder="Licence, Master, etc."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="experienceYears">Années d'expérience</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  {...register("experienceYears")}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Upload CV */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Documents</h3>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="cvFile"
                onChange={handleCvFileChange}
                accept=".pdf,.doc,.docx"
                className="hidden"
              />
              <label htmlFor="cvFile" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">
                  {cvFile ? cvFile.name : "Cliquez pour uploader votre CV"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF ou Word (max 5 MB)
                </p>
              </label>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                "Soumettre l'évaluation"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
