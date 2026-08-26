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
import { CheckCircle2, MailCheck, MessageCircleMore } from "lucide-react";

type ProjectType = "travail" | "etudes" | "tourisme";

interface FormData {
  fullName: string;
  email: string;
  whatsappPhone: string;
  age?: number;
  currentCity?: string;
  nationality: string;
  destinationCountry: string;
  projectType: ProjectType;
  sector?: string;
  yearsOfExperience?: number;
  educationLevel?: string;
  languages?: string;
  financialGuarantee?: string;
  visitReason?: string;
  travelHistory?: string;
  previousRefusal?: boolean;
  socialTies?: string;
  cvLink?: string;
}

type CountryOption = { value: string; label: string; flag: string; hint: string };

const COUNTRIES_BY_PROJECT: Record<ProjectType, CountryOption[]> = {
  travail: [
    { value: "Canada", label: "Canada", flag: "🇨🇦", hint: "Permis de travail, mobilité qualifiée" },
    { value: "Luxembourg", label: "Luxembourg", flag: "🇱🇺", hint: "Emploi et autorisation de travail" },
    { value: "France", label: "France", flag: "🇫🇷", hint: "Mobilité professionnelle" },
    { value: "Belgique", label: "Belgique", flag: "🇧🇪", hint: "Travail et séjour professionnel" },
    { value: "Allemagne", label: "Allemagne", flag: "🇩🇪", hint: "Emploi qualifié et recherche d’employeur" },
    { value: "Autre pays", label: "Autre pays", flag: "🌍", hint: "Un conseiller précisera la procédure" },
  ],
  etudes: [
    { value: "Canada", label: "Canada", flag: "🇨🇦", hint: "Permis d’études et admission" },
    { value: "France", label: "France", flag: "🇫🇷", hint: "Études supérieures et visa long séjour" },
    { value: "Belgique", label: "Belgique", flag: "🇧🇪", hint: "Admission et séjour étudiant" },
    { value: "Allemagne", label: "Allemagne", flag: "🇩🇪", hint: "Études et ressources financières" },
    { value: "Luxembourg", label: "Luxembourg", flag: "🇱🇺", hint: "Admission et autorisation de séjour" },
    { value: "Autre pays", label: "Autre pays", flag: "🌍", hint: "Un conseiller précisera la procédure" },
  ],
  tourisme: [
    { value: "Canada", label: "Canada", flag: "🇨🇦", hint: "Visite, famille ou tourisme" },
    { value: "France", label: "France", flag: "🇫🇷", hint: "Court séjour Schengen" },
    { value: "Belgique", label: "Belgique", flag: "🇧🇪", hint: "Visite familiale ou séjour court" },
    { value: "Allemagne", label: "Allemagne", flag: "🇩🇪", hint: "Court séjour Schengen" },
    { value: "Royaume-Uni", label: "Royaume-Uni", flag: "🇬🇧", hint: "Visitor visa" },
    { value: "Autre pays", label: "Autre pays", flag: "🌍", hint: "Un conseiller précisera la procédure" },
  ],
};

export function categoryForCountry(country: string): "schengen" | "canada" | "autre" {
  if (country === "Canada") return "canada";
  if (["France", "Belgique", "Allemagne", "Luxembourg"].includes(country)) return "schengen";
  return "autre";
}

export function visaTypeFor(project: ProjectType, country: string): string {
  if (country === "Canada") return project === "travail" ? "canada_travail" : project === "etudes" ? "canada_etude" : "canada_tourisme";
  if (categoryForCountry(country) === "schengen") return `schengen_${project === "etudes" ? "etude" : project}`;
  return "autre";
}

const COUNTRY_GUIDANCE: Record<string, string> = {
  Canada: "Préparez votre niveau de langue, vos études, votre expérience et, selon le projet, les éléments d’admission ou de permis.",
  Luxembourg: "Pour un projet de travail, l’existence d’un employeur et les autorisations applicables doivent être vérifiées par un conseiller.",
  France: "Le type de séjour, l’admission ou l’employeur et les ressources à justifier dépendent de votre situation.",
  Belgique: "La région, l’établissement ou l’employeur et les justificatifs financiers peuvent modifier la procédure.",
  Allemagne: "Le métier, le niveau de qualification, la langue et l’existence d’un employeur sont à examiner séparément.",
  "Royaume-Uni": "Les exigences du Royaume-Uni sont distinctes de Schengen et doivent être confirmées sur la source officielle.",
  "Autre pays": "Un conseiller qualifiera la procédure et vous orientera vers les sources officielles du pays choisi.",
};

export function SimpleMultiProjectForm() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const projectParam = searchParams.get("project") as ProjectType | null;
  const destinationParam = searchParams.get("destination") || "";

  const initialProject = projectParam && ["travail", "etudes", "tourisme"].includes(projectParam) ? projectParam : (destinationParam ? "etudes" : "travail");
  const [formData, setFormData] = React.useState<FormData>({
    fullName: "",
    email: "",
    whatsappPhone: "",
    nationality: "",
    destinationCountry: destinationParam || "",
    projectType: initialProject,
    sector: destinationParam ? `Destination souhaitée : ${destinationParam}` : undefined,
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [whatsappCopied, setWhatsappCopied] = React.useState(false);
  const [emailCopied, setEmailCopied] = React.useState(false);
  const [textCopied, setTextCopied] = React.useState(false);
  const [contactTouched, setContactTouched] = React.useState({ email: false, whatsappPhone: false });
  const [isSuccessVisible, setIsSuccessVisible] = React.useState(false);
  const [submittedProject, setSubmittedProject] = React.useState<ProjectType | null>(null);

  const isEmailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isWhatsappValid = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  };
  const emailError = contactTouched.email && formData.email.length > 0 && !isEmailValid(formData.email);
  const whatsappError = contactTouched.whatsappPhone && formData.whatsappPhone.length > 0 && !isWhatsappValid(formData.whatsappPhone);

  React.useEffect(() => {
    if (projectParam && ["travail", "etudes", "tourisme"].includes(projectParam)) {
      setFormData((prev) => ({ ...prev, projectType: projectParam }));
    }
    if (destinationParam) {
      setFormData((prev) => ({
        ...prev,
        destinationCountry: destinationParam,
        sector: prev.sector ? prev.sector : `Destination souhaitée : ${destinationParam}`,
      }));
    }
  }, [projectParam, destinationParam]);

  const submitEvaluation = trpc.evaluation.submitEvaluation.useMutation({
    onSuccess: () => {
      toast.success("Évaluation soumise avec succès ! Vérifiez votre email.");
      setSubmittedProject(formData.projectType);
      setIsSuccessVisible(true);
      setFormData({
        fullName: "",
        email: "",
        whatsappPhone: "",
        nationality: "",
        destinationCountry: "",
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

    setContactTouched({ email: true, whatsappPhone: true });

    if (!formData.fullName || !formData.email || !formData.whatsappPhone || !formData.nationality || !formData.destinationCountry) {
      toast.error("Veuillez remplir votre identité, votre nationalité et votre pays de destination.");
      return;
    }

    if (!isEmailValid(formData.email) || !isWhatsappValid(formData.whatsappPhone)) {
      toast.error("Vérifiez le format de votre email et de votre numéro WhatsApp avant l’envoi.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitEvaluation.mutateAsync({
        ...formData,
        destinationCategory: categoryForCountry(formData.destinationCountry),
      });
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

        {isSuccessVisible ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center" role="status" aria-live="polite">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
            <h3 className="mt-4 text-xl font-black text-emerald-950">Votre évaluation a bien été transmise</h3>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              Merci pour votre demande {submittedProject ? `de projet ${submittedProject}` : ""}. Un conseiller 3M Travel examinera les informations communiquées et vous répondra selon le délai annoncé.
            </p>
            <Button
              type="button"
              className="mt-5 bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={() => {
                setIsSuccessVisible(false);
                setSubmittedProject(null);
                setContactTouched({ email: false, whatsappPhone: false });
              }}
            >
              Envoyer une autre évaluation
            </Button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                onBlur={() => setContactTouched((previous) => ({ ...previous, email: true }))}
                placeholder="jean@example.com"
                aria-invalid={emailError}
                aria-describedby={emailError ? "email-help" : undefined}
                className={`mt-2 ${emailError ? "border-red-500 focus-visible:ring-red-500" : contactTouched.email && formData.email ? "border-emerald-500" : ""}`}
              />
              {emailError ? <p id="email-help" className="mt-1 text-xs font-medium text-red-600">Saisissez une adresse e-mail valide, par exemple nom@domaine.com.</p> : contactTouched.email && formData.email ? <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><MailCheck className="h-3.5 w-3.5" aria-hidden="true" /> Format d’e-mail valide</p> : null}
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
                onBlur={() => setContactTouched((previous) => ({ ...previous, whatsappPhone: true }))}
                placeholder="+237 6XX XXX XXX"
                aria-invalid={whatsappError}
                aria-describedby={whatsappError ? "whatsapp-help" : undefined}
                className={`mt-2 ${whatsappError ? "border-red-500 focus-visible:ring-red-500" : contactTouched.whatsappPhone && formData.whatsappPhone ? "border-emerald-500" : ""}`}
              />
              {whatsappError ? <p id="whatsapp-help" className="mt-1 text-xs font-medium text-red-600">Saisissez entre 8 et 15 chiffres, avec l’indicatif pays si possible.</p> : contactTouched.whatsappPhone && formData.whatsappPhone ? <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><MessageCircleMore className="h-3.5 w-3.5" aria-hidden="true" /> Numéro WhatsApp valide</p> : null}
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

            <div>
              <Label htmlFor="age" className="text-gray-700 font-semibold">Âge</Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={formData.age || ""}
                onChange={handleInputChange}
                placeholder="Ex: 28"
                className="mt-2"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="projectType" className="text-gray-700 font-semibold">
                Type de projet *
              </Label>
                <Select
                value={formData.projectType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, projectType: value as ProjectType, destinationCountry: "", sector: "" }))}
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

            <div className="md:col-span-2">
              <Label htmlFor="destinationCountry" className="text-gray-700 font-semibold">Pays de destination *</Label>
              <Select value={formData.destinationCountry} onValueChange={(value) => handleSelectChange("destinationCountry", value)}>
                <SelectTrigger id="destinationCountry" className="mt-2"><SelectValue placeholder="Sélectionner un pays" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES_BY_PROJECT[formData.projectType].map((country) => <SelectItem key={country.value} value={country.value}><span className="mr-2">{country.flag}</span>{country.label} — {country.hint}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">Les questions et la checklist seront adaptées à ce pays et à votre projet.</p>
              {formData.destinationCountry && <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900"><strong>À vérifier pour {formData.destinationCountry} :</strong> {COUNTRY_GUIDANCE[formData.destinationCountry]}</div>}
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
                  <Label htmlFor="languages" className="text-gray-700 font-semibold">Niveaux de langue</Label>
                  <Input id="languages" name="languages" value={formData.languages || ""} onChange={handleInputChange} placeholder="Français, anglais, IELTS/TEF si disponible" className="mt-2" />
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

            {formData.projectType === "etudes" && <div className="md:col-span-2"><Label htmlFor="financialGuarantee" className="text-gray-700 font-semibold">Comment prévoyez-vous de financer le projet ?</Label><Input id="financialGuarantee" name="financialGuarantee" value={formData.financialGuarantee || ""} onChange={handleInputChange} placeholder="Épargne, garant, bourse…" className="mt-2" /></div>}
            {formData.projectType === "tourisme" && <>
              <div><Label htmlFor="visitReason" className="text-gray-700 font-semibold">Motif du séjour</Label><Input id="visitReason" name="visitReason" value={formData.visitReason || ""} onChange={handleInputChange} placeholder="Visite familiale, tourisme, événement…" className="mt-2" /></div>
              <div><Label htmlFor="travelHistory" className="text-gray-700 font-semibold">Historique de voyages</Label><Input id="travelHistory" name="travelHistory" value={formData.travelHistory || ""} onChange={handleInputChange} placeholder="Pays visités et années" className="mt-2" /></div>
              <div className="md:col-span-2"><Label htmlFor="socialTies" className="text-gray-700 font-semibold">Attaches dans le pays de résidence</Label><Textarea id="socialTies" name="socialTies" value={formData.socialTies || ""} onChange={handleInputChange} placeholder="Emploi, famille, études ou obligations à préciser" className="mt-2" /></div>
            </>}

            <div className="md:col-span-2">
              <Label htmlFor="cvLink" className="text-gray-700 font-semibold">Lien vers votre CV (Google Drive, Dropbox, etc.)</Label>
              <Input
                id="cvLink"
                name="cvLink"
                value={formData.cvLink || ""}
                onChange={handleInputChange}
                placeholder="https://..."
                className="mt-2"
              />
              <p className="mt-1 text-xs text-gray-500">Optionnel mais fortement recommandé pour une évaluation précise.</p>
            </div>
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

            <button
              type="button"
              onClick={async () => {
                const text = `Récapitulatif de projet 3M Travel :\n- Nom : ${formData.fullName || "(Non renseigné)"}\n- Email : ${formData.email || "(Non renseigné)"}\n- WhatsApp : ${formData.whatsappPhone || "(Non renseigné)"}\n- Nationalité : ${formData.nationality || "(Non renseignée)"}\n- Type de projet : ${formData.projectType.toUpperCase()}\n- Précisions / Destination : ${formData.sector || "Non spécifié"}`;
                try {
                  await navigator.clipboard.writeText(text);
                  setTextCopied(true);
                  setTimeout(() => setTextCopied(false), 3500);
                } catch {
                  // Fallback textarea
                  const textarea = document.createElement("textarea");
                  textarea.value = text;
                  document.body.appendChild(textarea);
                  textarea.select();
                  document.execCommand("copy");
                  document.body.removeChild(textarea);
                  setTextCopied(true);
                  setTimeout(() => setTextCopied(false), 3500);
                }
              }}
              className={`w-full inline-flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg transition-all shadow-sm ${
                textCopied
                  ? "bg-amber-700 text-white scale-[1.01] ring-2 ring-amber-300"
                  : "bg-gray-700 hover:bg-gray-800 text-white"
              }`}
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              {textCopied ? "✓ Récapitulatif copié dans le presse-papier !" : "Copier le récapitulatif du projet"}
            </button>
          </div>
        </form>
        )}

        <p className="text-sm text-gray-600 mt-4 text-center">
          ✓ Évaluation gratuite • ✓ Réponse en 24h • ✓ Confidentiel
        </p>
      </Card>
    </motion.div>
  );
}
