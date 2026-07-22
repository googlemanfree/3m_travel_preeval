import React, { useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Step47Props {
  formData: any;
  onFormDataChange: (field: string, value: any) => void;
  onNext: () => void;
  onPrev: () => void;
  currentStep: number;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  url?: string;
}

export default function PremiumEvaluationFormSteps47({
  formData,
  onFormDataChange,
  onNext,
  onPrev,
  currentStep,
}: Step47Props) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // ─── Étape 4: Historique de Voyage & Admissibilité ───────────────────────────
  if (currentStep === 4) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Historique de Voyage & Admissibilité</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="md:col-span-2">
            <Label className="text-sm font-semibold mb-2 block">
              Pays déjà visités (séparés par virgule)
            </Label>
            <Input
              placeholder="Ex: France, Émirats, Sénégal, Belgique"
              value={formData.countriesVisited || ""}
              onChange={(e) => onFormDataChange("countriesVisited", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Label className="text-sm font-semibold mb-2 block">
              Avez-vous déjà eu un refus de visa ? <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.visaRefusals || ""} onValueChange={(v) => onFormDataChange("visaRefusals", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Non">Non, aucun</SelectItem>
                <SelectItem value="Canada">Oui - Canada</SelectItem>
                <SelectItem value="Schengen">Oui - Espace Schengen</SelectItem>
                <SelectItem value="USA/UK">Oui - USA / UK</SelectItem>
                <SelectItem value="Autre">Oui - Autre pays</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label className="text-sm font-semibold mb-2 block">
              Avez-vous un casier judiciaire ou antécédent médical grave ? <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.criminalRecord || ""} onValueChange={(v) => onFormDataChange("criminalRecord", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Non">Non, aucun problème</SelectItem>
                <SelectItem value="Oui">Oui (Sera précisé lors de l'entretien)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label className="text-sm font-semibold mb-2 block">
              Notes supplémentaires ou informations importantes
            </Label>
            <Textarea
              placeholder="Décrivez tout élément important pour votre dossier..."
              value={formData.submissionNotes || ""}
              onChange={(e) => onFormDataChange("submissionNotes", e.target.value)}
              className="min-h-32"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onPrev} className="flex items-center gap-2">
            ◀ Précédent
          </Button>
          <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            Suivant ➔
          </Button>
        </div>
      </motion.div>
    );
  }

  // ─── Étape 5: Sections Conditionnelles ────────────────────────────────────────
  if (currentStep === 5) {
    const projectType = formData.projectType;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Informations Spécifiques au Projet</h2>

        {/* Conditionnel: Étudiant */}
        {projectType === "student" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">📚 Informations pour Étudiant</h3>
              <p className="text-sm text-blue-800">Complétez les détails de votre projet d'études</p>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Niveau d'études visé <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Ex: Licence, Master, Doctorat"
                value={formData.desiredEducationLevel || ""}
                onChange={(e) => onFormDataChange("desiredEducationLevel", e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Lettre d'admission disponible ? <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.admissionLetterAvailable ? "Oui" : "Non"} onValueChange={(v) => onFormDataChange("admissionLetterAvailable", v === "Oui")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Non">Non, en cours de recherche</SelectItem>
                  <SelectItem value="Oui">Oui, admission reçue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label className="text-sm font-semibold mb-2 block">
                Institution / Université ciblée
              </Label>
              <Input
                placeholder="Ex: Université de Montréal, Sorbonne"
                value={formData.targetInstitution || ""}
                onChange={(e) => onFormDataChange("targetInstitution", e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Date de début d'études prévue
              </Label>
              <Input
                type="date"
                value={formData.intendedStartDate || ""}
                onChange={(e) => onFormDataChange("intendedStartDate", e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Budget d'études estimé (en FCFA)
              </Label>
              <Input
                type="number"
                placeholder="Ex: 5000000"
                value={formData.studyBudget || ""}
                onChange={(e) => onFormDataChange("studyBudget", parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-sm font-semibold mb-2 block">
                Projet académique / Domaine d'études
              </Label>
              <Textarea
                placeholder="Décrivez votre projet d'études, vos objectifs..."
                value={formData.academicProject || ""}
                onChange={(e) => onFormDataChange("academicProject", e.target.value)}
                className="min-h-24"
              />
            </div>
          </div>
        )}

        {/* Conditionnel: Visiteur */}
        {projectType === "visitor" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-900 mb-2">✈️ Informations pour Visiteur</h3>
              <p className="text-sm text-green-800">Décrivez votre visite et vos liens avec le pays d'accueil</p>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Raison de la visite <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.visitType || ""} onValueChange={(v) => onFormDataChange("visitType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tourism">Tourisme / Loisirs</SelectItem>
                  <SelectItem value="family">Visite familiale</SelectItem>
                  <SelectItem value="business">Affaires / Conférence</SelectItem>
                  <SelectItem value="event">Événement spécial</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Durée prévue du séjour <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Ex: 2 semaines, 1 mois"
                value={formData.plannedStayDuration || ""}
                onChange={(e) => onFormDataChange("plannedStayDuration", e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Date de voyage estimée
              </Label>
              <Input
                type="date"
                value={formData.estimatedTravelDate || ""}
                onChange={(e) => onFormDataChange("estimatedTravelDate", e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-sm font-semibold mb-2 block">
                Liens familiaux ou professionnels dans le pays cible
              </Label>
              <Textarea
                placeholder="Décrivez vos liens (famille, amis, collègues)..."
                value={formData.tiesInHomeCountry || ""}
                onChange={(e) => onFormDataChange("tiesInHomeCountry", e.target.value)}
                className="min-h-24"
              />
            </div>
          </div>
        )}

        {/* Conditionnel: Travailleur */}
        {projectType === "worker" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2 bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-purple-900 mb-2">💼 Informations pour Travailleur</h3>
              <p className="text-sm text-purple-800">Détails de votre projet professionnel</p>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Poste visé <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Ex: Ingénieur, Infirmier, Développeur"
                value={formData.desiredPosition || ""}
                onChange={(e) => onFormDataChange("desiredPosition", e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Ville / Région ciblée
              </Label>
              <Input
                placeholder="Ex: Toronto, Vancouver, Paris"
                value={formData.targetCity || ""}
                onChange={(e) => onFormDataChange("targetCity", e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Niveau de langue requis
              </Label>
              <Select value={formData.languageLevel || ""} onValueChange={(v) => onFormDataChange("languageLevel", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Débutant">Débutant</SelectItem>
                  <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                  <SelectItem value="Avancé">Avancé</SelectItem>
                  <SelectItem value="Bilingue">Bilingue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Offre d'emploi disponible ? <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.jobOfferAvailable ? "Oui" : "Non"} onValueChange={(v) => onFormDataChange("jobOfferAvailable", v === "Oui")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Non">Non, en cours de recherche</SelectItem>
                  <SelectItem value="Oui">Oui, offre reçue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label className="text-sm font-semibold mb-2 block">
                Expérience professionnelle pertinente
              </Label>
              <Textarea
                placeholder="Décrivez votre expérience dans le domaine visé..."
                value={formData.previousExperiences || ""}
                onChange={(e) => onFormDataChange("previousExperiences", e.target.value)}
                className="min-h-24"
              />
            </div>
          </div>
        )}

        {/* Conditionnel: Résidence Permanente */}
        {projectType === "permanent_residence" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2 bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-orange-900 mb-2">🏠 Informations pour Résidence Permanente</h3>
              <p className="text-sm text-orange-800">Détails de votre demande de résidence permanente</p>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Catégorie d'immigration <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.targetCategory || ""} onValueChange={(v) => onFormDataChange("targetCategory", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Express Entry">Express Entry</SelectItem>
                  <SelectItem value="Provincial Nominee">Provincial Nominee Program</SelectItem>
                  <SelectItem value="Skilled Worker">Skilled Worker</SelectItem>
                  <SelectItem value="Entrepreneur">Entrepreneur</SelectItem>
                  <SelectItem value="Family Sponsorship">Family Sponsorship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Âge <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="18"
                max="100"
                value={formData.age || ""}
                onChange={(e) => onFormDataChange("age", parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Années d'expérience professionnelle <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                value={formData.experienceYears || ""}
                onChange={(e) => onFormDataChange("experienceYears", parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Avez-vous une nomination provinciale ?
              </Label>
              <Select value={formData.provincialNomination ? "Oui" : "Non"} onValueChange={(v) => onFormDataChange("provincialNomination", v === "Oui")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Non">Non</SelectItem>
                  <SelectItem value="Oui">Oui</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Certificats de police disponibles ?
              </Label>
              <Select value={formData.policeCertificatesAvailable ? "Oui" : "Non"} onValueChange={(v) => onFormDataChange("policeCertificatesAvailable", v === "Oui")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Non">Non</SelectItem>
                  <SelectItem value="Oui">Oui</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label className="text-sm font-semibold mb-2 block">
                Fonds disponibles pour l'installation (en FCFA)
              </Label>
              <Input
                type="number"
                placeholder="Ex: 10000000"
                value={formData.availableFunds || ""}
                onChange={(e) => onFormDataChange("availableFunds", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onPrev} className="flex items-center gap-2">
            ◀ Précédent
          </Button>
          <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            Suivant ➔
          </Button>
        </div>
      </motion.div>
    );
  }

  // ─── Étape 6: Téléchargement de Documents ──────────────────────────────────────
  if (currentStep === 6) {
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      setIsUploading(true);
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          // Validation de taille (max 10MB)
          if (file.size > 10 * 1024 * 1024) {
            toast.error(`${file.name} dépasse 10MB`);
            continue;
          }

          // Validation de type
          const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ];
          if (!allowedTypes.includes(file.type)) {
            toast.error(`${file.name} : format non autorisé`);
            continue;
          }

          // Ajouter le fichier à la liste
          const newFile: UploadedFile = {
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date(),
          };

          setUploadedFiles((prev) => [...prev, newFile]);
          toast.success(`${file.name} ajouté`);
        }
      } catch (error) {
        toast.error("Erreur lors de l'upload");
      } finally {
        setIsUploading(false);
      }
    };

    const removeFile = (index: number) => {
      setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Documents Justificatifs</h2>

        <div className="mb-8">
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50 hover:bg-blue-100 transition">
            <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold mb-2">Téléchargez vos documents</p>
            <p className="text-gray-600 text-sm mb-4">
              PDF, JPG, PNG, Word (Max 10MB par fichier)
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isUploading}
              >
                {isUploading ? "Upload en cours..." : "Sélectionner des fichiers"}
              </Button>
            </label>
          </div>
        </div>

        {/* Liste des fichiers uploadés */}
        {uploadedFiles.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Documents uploadés ({uploadedFiles.length})
            </h3>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB • {file.uploadedAt.toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-2 hover:bg-red-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist de documents recommandés */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-yellow-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Documents recommandés
          </h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>✓ Copie du passeport (pages d'identité)</li>
            <li>✓ Relevés bancaires (3-6 derniers mois)</li>
            <li>✓ Diplômes et certificats académiques</li>
            <li>✓ CV / Lettre de motivation</li>
            <li>✓ Lettre d'admission (si étudiant)</li>
            <li>✓ Offre d'emploi (si travailleur)</li>
            <li>✓ Certificat de police (si demandé)</li>
          </ul>
        </div>

        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onPrev} className="flex items-center gap-2">
            ◀ Précédent
          </Button>
          <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            Suivant ➔
          </Button>
        </div>
      </motion.div>
    );
  }

  // ─── Étape 7: Finalisation & Confirmation ──────────────────────────────────────
  if (currentStep === 7) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Finalisation & Confirmation</h2>

        <div className="space-y-4 mb-8">
          <h3 className="font-semibold text-gray-900 text-lg">✓ Résumé de votre évaluation</h3>
          
          {/* Étape 1: Destination & Projet */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-blue-900 mb-2">1. Destination & Projet</p>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Destination :</strong> {formData.destination}</p>
                  <p><strong>Type de projet :</strong> {formData.projectType}</p>
                  <p><strong>Pays actuel :</strong> {formData.currentCountry}</p>
                  <p><strong>Langue :</strong> {formData.communicationLanguage === 'fr' ? 'Français' : 'Anglais'}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFormDataChange('_goToStep', 1)}
                className="ml-4 whitespace-nowrap"
              >
                ✏️ Modifier
              </Button>
            </div>
          </div>

          {/* Étape 2: Identité & Passeport */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-2">2. Identité & Passeport</p>
                <div className="text-sm text-green-800 space-y-1">
                  <p><strong>Nom :</strong> {formData.fullName}</p>
                  <p><strong>Genre :</strong> {formData.gender}</p>
                  <p><strong>Nationalité :</strong> {formData.nationality}</p>
                  <p><strong>Passeport :</strong> {formData.passportNumber}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFormDataChange('_goToStep', 2)}
                className="ml-4 whitespace-nowrap"
              >
                ✏️ Modifier
              </Button>
            </div>
          </div>

          {/* Étape 3: Études & Finances */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-purple-900 mb-2">3. Études & Finances</p>
                <div className="text-sm text-purple-800 space-y-1">
                  <p><strong>Niveau d'études :</strong> {formData.educationLevel}</p>
                  <p><strong>Domaine :</strong> {formData.fieldOfStudy}</p>
                  <p><strong>Profession :</strong> {formData.currentProfession}</p>
                  <p><strong>Revenu mensuel :</strong> {formData.monthlyIncome} FCFA</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFormDataChange('_goToStep', 3)}
                className="ml-4 whitespace-nowrap"
              >
                ✏️ Modifier
              </Button>
            </div>
          </div>

          {/* Étape 4: Voyage & Admissibilité */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-orange-900 mb-2">4. Voyage & Admissibilité</p>
                <div className="text-sm text-orange-800 space-y-1">
                  <p><strong>Pays visités :</strong> {formData.countriesVisited || 'Aucun'}</p>
                  <p><strong>Refus de visa :</strong> {formData.visaRefusals}</p>
                  <p><strong>Casier judiciaire :</strong> {formData.criminalRecord}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFormDataChange('_goToStep', 4)}
                className="ml-4 whitespace-nowrap"
              >
                ✏️ Modifier
              </Button>
            </div>
          </div>

          {/* Étape 5: Détails du Projet */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-indigo-900 mb-2">5. Détails du Projet</p>
                <div className="text-sm text-indigo-800 space-y-1">
                  {formData.projectType === 'student' && (
                    <>
                      <p><strong>Institution :</strong> {formData.targetInstitution || 'Non spécifiée'}</p>
                      <p><strong>Admission :</strong> {formData.admissionLetterAvailable ? 'Reçue' : 'En cours'}</p>
                    </>
                  )}
                  {formData.projectType === 'visitor' && (
                    <>
                      <p><strong>Type de visite :</strong> {formData.visitType}</p>
                      <p><strong>Durée :</strong> {formData.plannedStayDuration}</p>
                    </>
                  )}
                  {formData.projectType === 'worker' && (
                    <>
                      <p><strong>Poste :</strong> {formData.desiredPosition || 'Non spécifié'}</p>
                      <p><strong>Offre d'emploi :</strong> {formData.jobOfferAvailable ? 'Reçue' : 'En cours'}</p>
                    </>
                  )}
                  {formData.projectType === 'permanent_residence' && (
                    <>
                      <p><strong>Catégorie :</strong> {formData.targetCategory}</p>
                      <p><strong>Expérience :</strong> {formData.experienceYears} ans</p>
                    </>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFormDataChange('_goToStep', 5)}
                className="ml-4 whitespace-nowrap"
              >
                ✏️ Modifier
              </Button>
            </div>
          </div>

          {/* Étape 6: Documents */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-yellow-900 mb-2">6. Documents</p>
                <div className="text-sm text-yellow-800">
                  <p><strong>Documents uploadés :</strong> {uploadedFiles.length} fichier(s)</p>
                  {uploadedFiles.length > 0 && (
                    <ul className="mt-2 space-y-1 ml-4">
                      {uploadedFiles.slice(0, 3).map((file, idx) => (
                        <li key={idx} className="text-xs">• {file.name}</li>
                      ))}
                      {uploadedFiles.length > 3 && <li className="text-xs italic">... et {uploadedFiles.length - 3} autre(s)</li>}
                    </ul>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFormDataChange('_goToStep', 6)}
                className="ml-4 whitespace-nowrap"
              >
                ✏️ Modifier
              </Button>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-2">📞 Informations de Contact</p>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Email :</strong> {formData.email}</p>
                  <p><strong>Téléphone WhatsApp :</strong> {formData.whatsappPhone}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFormDataChange('_goToStep', 2)}
                className="ml-4 whitespace-nowrap"
              >
                ✏️ Modifier
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">📋 Conditions d'utilisation</h3>
          <div className="space-y-3 text-sm text-gray-700 max-h-48 overflow-y-auto">
            <p>
              ✓ Je confirme que les informations fournies sont exactes et complètes.
            </p>
            <p>
              ✓ J'autorise 3M Travel & Services à analyser mon profil et à me contacter pour discuter de mon projet.
            </p>
            <p>
              ✓ J'accepte que mes données soient traitées conformément à la politique de confidentialité.
            </p>
            <p>
              ✓ Je comprends que cette évaluation est gratuite et sans engagement.
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onPrev} className="flex items-center gap-2">
            ◀ Précédent
          </Button>
          <Button
            onClick={() => {
              onFormDataChange("uploadedFiles", uploadedFiles);
              onNext();
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            ✓ Soumettre l'évaluation
          </Button>
        </div>
      </motion.div>
    );
  }

  return null;
}
