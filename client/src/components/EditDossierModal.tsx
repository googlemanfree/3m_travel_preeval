import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, Loader2, Edit2 } from "lucide-react";

interface DossierData {
  id: number;
  dossierNumber: string;
  fullName: string;
  email: string;
  destination: string;
  visaType: string | null;
  formulaChosen: string;
  dossierStatus: string;
  paymentStatus: string;
  paymentDate: Date | null;
  emailVerified: boolean;
  agreementSigned: boolean;
  agreementSignedAt: number | null;
  adminNote: string | null;
  passportUrl: string | null;
  cvUrl: string | null;
  diplomaUrl: string | null;
  documentsUrls: string | null;
  scoringTotal: number | null;
  scoringBadge: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EditDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierData: DossierData | undefined;
  onSuccess?: () => void;
}

export function EditDossierModal({ isOpen, onClose, dossierData, onSuccess }: EditDossierModalProps) {
  const [formData, setFormData] = useState({
    fullName: dossierData?.fullName || "",
    whatsappNumber: "",
    age: "",
    nationality: "",
    academicLevel: "",
    experienceYears: "",
    languageSkills: "",
    jobSector: "",
    dateOfBirth: "",
    placeOfBirth: "",
    gender: "",
    maritalStatus: "",
    currentAddress: "",
    currentCity: "",
    currentCountry: "",
    diplomaTitle: "",
    diplomaInstitution: "",
    diplomaYear: "",
    fieldOfStudy: "",
    currentEmployer: "",
    currentJobTitle: "",
    monthlyIncome: "",
    incomeCurrency: "XAF",
    bankBalance: "",
    bankBalanceCurrency: "XAF",
    hasSponsorship: false,
    sponsorName: "",
    sponsorRelation: "",
    numberOfChildren: "0",
    spouseFullName: "",
    spouseNationality: "",
    familyMemberInDestination: false,
    familyMemberRelation: "",
    familyMemberStatus: "",
  });

  const updateMutation = trpc.application.updateMyDossierData.useMutation({
    onSuccess: () => {
      toast.success("Vos informations ont été mises à jour avec succès !");
      onClose();
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la mise à jour");
    },
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Construire l'objet de mise à jour avec les champs non vides
    const updateData: any = {};
    if (formData.fullName && formData.fullName !== dossierData?.fullName) {
      updateData.fullName = formData.fullName;
    }
    if (formData.whatsappNumber) updateData.whatsappNumber = formData.whatsappNumber;
    if (formData.age) updateData.age = parseInt(formData.age);
    if (formData.nationality) updateData.nationality = formData.nationality;
    if (formData.academicLevel) updateData.academicLevel = formData.academicLevel;
    if (formData.experienceYears) updateData.experienceYears = parseInt(formData.experienceYears);
    if (formData.languageSkills) updateData.languageSkills = formData.languageSkills;
    if (formData.jobSector) updateData.jobSector = formData.jobSector;
    if (formData.dateOfBirth) updateData.dateOfBirth = formData.dateOfBirth;
    if (formData.placeOfBirth) updateData.placeOfBirth = formData.placeOfBirth;
    if (formData.gender) updateData.gender = formData.gender;
    if (formData.maritalStatus) updateData.maritalStatus = formData.maritalStatus;
    if (formData.currentAddress) updateData.currentAddress = formData.currentAddress;
    if (formData.currentCity) updateData.currentCity = formData.currentCity;
    if (formData.currentCountry) updateData.currentCountry = formData.currentCountry;
    if (formData.diplomaTitle) updateData.diplomaTitle = formData.diplomaTitle;
    if (formData.diplomaInstitution) updateData.diplomaInstitution = formData.diplomaInstitution;
    if (formData.diplomaYear) updateData.diplomaYear = parseInt(formData.diplomaYear);
    if (formData.fieldOfStudy) updateData.fieldOfStudy = formData.fieldOfStudy;
    if (formData.currentEmployer) updateData.currentEmployer = formData.currentEmployer;
    if (formData.currentJobTitle) updateData.currentJobTitle = formData.currentJobTitle;
    if (formData.monthlyIncome) updateData.monthlyIncome = parseInt(formData.monthlyIncome);
    if (formData.incomeCurrency) updateData.incomeCurrency = formData.incomeCurrency;
    if (formData.bankBalance) updateData.bankBalance = parseInt(formData.bankBalance);
    if (formData.bankBalanceCurrency) updateData.bankBalanceCurrency = formData.bankBalanceCurrency;
    updateData.hasSponsorship = formData.hasSponsorship;
    if (formData.sponsorName) updateData.sponsorName = formData.sponsorName;
    if (formData.sponsorRelation) updateData.sponsorRelation = formData.sponsorRelation;
    updateData.numberOfChildren = parseInt(formData.numberOfChildren);
    if (formData.spouseFullName) updateData.spouseFullName = formData.spouseFullName;
    if (formData.spouseNationality) updateData.spouseNationality = formData.spouseNationality;
    updateData.familyMemberInDestination = formData.familyMemberInDestination;
    if (formData.familyMemberRelation) updateData.familyMemberRelation = formData.familyMemberRelation;
    if (formData.familyMemberStatus) updateData.familyMemberStatus = formData.familyMemberStatus;

    if (Object.keys(updateData).length === 0) {
      toast.error("Aucune modification détectée");
      return;
    }

    updateMutation.mutate(updateData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            Modifier mes informations
          </DialogTitle>
          <DialogDescription>
            Mettez à jour vos informations personnelles et professionnelles
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations Personnelles */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Informations Personnelles</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Nom Complet</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="Votre nom complet"
                />
              </div>
              <div>
                <Label htmlFor="whatsappNumber">Numéro WhatsApp</Label>
                <Input
                  id="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleChange("whatsappNumber", e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                />
              </div>
              <div>
                <Label htmlFor="age">Âge</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  placeholder="25"
                  min="18"
                  max="120"
                />
              </div>
              <div>
                <Label htmlFor="nationality">Nationalité</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => handleChange("nationality", e.target.value)}
                  placeholder="Camerounaise"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date de Naissance</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="placeOfBirth">Lieu de Naissance</Label>
                <Input
                  id="placeOfBirth"
                  value={formData.placeOfBirth}
                  onChange={(e) => handleChange("placeOfBirth", e.target.value)}
                  placeholder="Yaoundé"
                />
              </div>
              <div>
                <Label htmlFor="gender">Sexe</Label>
                <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homme">Homme</SelectItem>
                    <SelectItem value="femme">Femme</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maritalStatus">Situation Matrimoniale</Label>
                <Select value={formData.maritalStatus} onValueChange={(value) => handleChange("maritalStatus", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celibataire">Célibataire</SelectItem>
                    <SelectItem value="marie">Marié(e)</SelectItem>
                    <SelectItem value="divorce">Divorcé(e)</SelectItem>
                    <SelectItem value="veuf">Veuf(ve)</SelectItem>
                    <SelectItem value="union_libre">Union Libre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Adresse</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="currentAddress">Adresse</Label>
                <Input
                  id="currentAddress"
                  value={formData.currentAddress}
                  onChange={(e) => handleChange("currentAddress", e.target.value)}
                  placeholder="Votre adresse complète"
                />
              </div>
              <div>
                <Label htmlFor="currentCity">Ville</Label>
                <Input
                  id="currentCity"
                  value={formData.currentCity}
                  onChange={(e) => handleChange("currentCity", e.target.value)}
                  placeholder="Yaoundé"
                />
              </div>
              <div>
                <Label htmlFor="currentCountry">Pays</Label>
                <Input
                  id="currentCountry"
                  value={formData.currentCountry}
                  onChange={(e) => handleChange("currentCountry", e.target.value)}
                  placeholder="Cameroun"
                />
              </div>
            </div>
          </div>

          {/* Éducation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Éducation</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="academicLevel">Niveau d'Études</Label>
                <Input
                  id="academicLevel"
                  value={formData.academicLevel}
                  onChange={(e) => handleChange("academicLevel", e.target.value)}
                  placeholder="Licence, Master, etc."
                />
              </div>
              <div>
                <Label htmlFor="fieldOfStudy">Domaine d'Études</Label>
                <Input
                  id="fieldOfStudy"
                  value={formData.fieldOfStudy}
                  onChange={(e) => handleChange("fieldOfStudy", e.target.value)}
                  placeholder="Informatique, Droit, etc."
                />
              </div>
              <div>
                <Label htmlFor="diplomaTitle">Titre du Diplôme</Label>
                <Input
                  id="diplomaTitle"
                  value={formData.diplomaTitle}
                  onChange={(e) => handleChange("diplomaTitle", e.target.value)}
                  placeholder="Licence en Informatique"
                />
              </div>
              <div>
                <Label htmlFor="diplomaInstitution">Institution</Label>
                <Input
                  id="diplomaInstitution"
                  value={formData.diplomaInstitution}
                  onChange={(e) => handleChange("diplomaInstitution", e.target.value)}
                  placeholder="Université de Yaoundé"
                />
              </div>
              <div>
                <Label htmlFor="diplomaYear">Année du Diplôme</Label>
                <Input
                  id="diplomaYear"
                  type="number"
                  value={formData.diplomaYear}
                  onChange={(e) => handleChange("diplomaYear", e.target.value)}
                  placeholder="2023"
                />
              </div>
            </div>
          </div>

          {/* Emploi */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Situation Professionnelle</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentEmployer">Employeur Actuel</Label>
                <Input
                  id="currentEmployer"
                  value={formData.currentEmployer}
                  onChange={(e) => handleChange("currentEmployer", e.target.value)}
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div>
                <Label htmlFor="currentJobTitle">Titre du Poste</Label>
                <Input
                  id="currentJobTitle"
                  value={formData.currentJobTitle}
                  onChange={(e) => handleChange("currentJobTitle", e.target.value)}
                  placeholder="Développeur Senior"
                />
              </div>
              <div>
                <Label htmlFor="experienceYears">Années d'Expérience</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  value={formData.experienceYears}
                  onChange={(e) => handleChange("experienceYears", e.target.value)}
                  placeholder="5"
                  min="0"
                  max="70"
                />
              </div>
              <div>
                <Label htmlFor="jobSector">Secteur d'Activité</Label>
                <Input
                  id="jobSector"
                  value={formData.jobSector}
                  onChange={(e) => handleChange("jobSector", e.target.value)}
                  placeholder="Technologie"
                />
              </div>
              <div>
                <Label htmlFor="languageSkills">Compétences Linguistiques</Label>
                <Input
                  id="languageSkills"
                  value={formData.languageSkills}
                  onChange={(e) => handleChange("languageSkills", e.target.value)}
                  placeholder="Français, Anglais, Allemand"
                />
              </div>
            </div>
          </div>

          {/* Finances */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Situation Financière</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyIncome">Revenu Mensuel</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => handleChange("monthlyIncome", e.target.value)}
                  placeholder="500000"
                />
              </div>
              <div>
                <Label htmlFor="incomeCurrency">Devise</Label>
                <Input
                  id="incomeCurrency"
                  value={formData.incomeCurrency}
                  onChange={(e) => handleChange("incomeCurrency", e.target.value)}
                  placeholder="XAF"
                />
              </div>
              <div>
                <Label htmlFor="bankBalance">Solde Bancaire</Label>
                <Input
                  id="bankBalance"
                  type="number"
                  value={formData.bankBalance}
                  onChange={(e) => handleChange("bankBalance", e.target.value)}
                  placeholder="5000000"
                />
              </div>
              <div>
                <Label htmlFor="bankBalanceCurrency">Devise</Label>
                <Input
                  id="bankBalanceCurrency"
                  value={formData.bankBalanceCurrency}
                  onChange={(e) => handleChange("bankBalanceCurrency", e.target.value)}
                  placeholder="XAF"
                />
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
