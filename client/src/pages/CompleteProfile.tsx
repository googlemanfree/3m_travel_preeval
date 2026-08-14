import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Loader, Mail, User, MapPin, Briefcase, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { AvatarCropperModal } from "@/components/AvatarCropperModal";
import { getCandidateToken } from "@/hooks/useCandidateAuth";
import { verifyHumanPortrait } from "@/lib/portraitVerification";

const DESTINATIONS = [
  { value: "canada", label: "🇨🇦 Canada" },
  { value: "luxembourg", label: "🇱🇺 Luxembourg" },
  { value: "pologne", label: "🇵🇱 Pologne" },
  { value: "europe", label: "🇪🇺 Europe" },
  { value: "golfe", label: "🇦🇪 Golfe & Moyen-Orient" },
  { value: "autre", label: "Autre" },
];

const VISA_TYPES = [
  { value: "travail", label: "Visa de travail" },
  { value: "etudes", label: "Visa d'études" },
  { value: "residence", label: "Résidence permanente" },
  { value: "visiteur", label: "Visa de visiteur" },
  { value: "autre", label: "Autre" },
];

export default function CompleteProfile() {
  const [location, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [formData, setFormData] = useState({
    destination: "",
    visaType: "",
    occupation: "",
    avatarUrl: "",
  });

  // Récupérer l'email depuis les paramètres d'URL
  const params = new URLSearchParams(location.split("?")[1] ?? "");
  const email = params.get("email") ?? "";

  useEffect(() => {
    // Vérifier que l'utilisateur vient de l'inscription et récupérer le portrait déjà validé.
    const candidateId = localStorage.getItem("candidateId");
    const storedAvatarUrl = sessionStorage.getItem("registrationAvatarUrl");
    if (!candidateId || !email) {
      navigate("/register");
      return;
    }
    if (storedAvatarUrl) {
      setFormData((previous) => ({ ...previous, avatarUrl: storedAvatarUrl }));
      setAvatarPreview(storedAvatarUrl);
    }
  }, [email, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const updateAvatarMutation = trpc.candidate.updateAvatar.useMutation();

  const updateProfileMutation = trpc.candidate.updateProfile.useMutation({
    onSuccess: () => {
      setIsLoading(false);
      toast.success("Profil complété et photo de profil enregistrée ! Veuillez vous connecter.");
      localStorage.removeItem("candidateId");
      navigate("/login");
    },
    onError: (err) => {
      setIsLoading(false);
      toast.error(err.message || "Erreur lors de la mise à jour du profil.");
    },
  });

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La taille de l'image ne doit pas dépasser 5 Mo.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Format non supporté. Veuillez choisir une image JPG, PNG ou WebP.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImageSrc(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedFile: File) => {
    const verification = await verifyHumanPortrait(croppedFile);
    if (!verification.accepted) {
      toast.error(verification.reason);
      return;
    }
    setAvatarFile(croppedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
      toast.success("Portrait humain vérifié et ajusté avec succès !");
    };
    reader.readAsDataURL(croppedFile);
  };

  const handleComplete = async () => {
    if (!avatarFile && !formData.avatarUrl) {
      toast.error("La photo de profil est obligatoire pour continuer.");
      return;
    }

    setIsLoading(true);
    let finalAvatarUrl = formData.avatarUrl;
    let portraitVerificationToken: string | null = null;

    if (avatarFile) {
      try {
        setIsUploadingAvatar(true);
        const uploadForm = new FormData();
        uploadForm.append("file", avatarFile);
        uploadForm.append("fileType", "photo_identite");
        uploadForm.append("email", email.trim().toLowerCase());
        uploadForm.append("captureMethod", "gallery");
        const response = await fetch("/api/candidate/upload-public", { method: "POST", body: uploadForm });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || typeof result.fileUrl !== "string" || typeof result.portraitVerificationToken !== "string") {
          throw new Error(result.error || "Échec de l’upload sécurisé de la photo de profil.");
        }
        finalAvatarUrl = result.fileUrl;
        portraitVerificationToken = result.portraitVerificationToken;
      } catch (err) {
        console.error("Avatar upload error:", err);
        toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi de la photo de profil.");
        setIsLoading(false);
        setIsUploadingAvatar(false);
        return;
      } finally {
        setIsUploadingAvatar(false);
      }
    }

    if (portraitVerificationToken && finalAvatarUrl) {
      try {
        await updateAvatarMutation.mutateAsync({
          avatarUrl: finalAvatarUrl,
          portraitVerificationToken,
        });
      } catch (error) {
        setIsLoading(false);
        toast.error(error instanceof Error ? error.message : "Le portrait n’a pas pu être enregistré.");
        return;
      }
    }

    updateProfileMutation.mutate({
      destination: formData.destination as any,
      visaType: formData.visaType,
      educationLevel: formData.occupation,
      ...(portraitVerificationToken && finalAvatarUrl ? { avatarUrl: finalAvatarUrl } : {}),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0f2460 0%, #1e3a8a 50%, #2563eb 100%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
      >
        {/* Indicateur de progression (4 étapes incluant l'avatar) */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${
                s <= step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Étape 1: Destination */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Destination</h2>
              <p className="text-gray-600 text-sm">Quel est votre pays de destination ?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="destination" className="text-gray-700 font-semibold mb-2 block">
                  Sélectionnez une destination
                </Label>
                <Select value={formData.destination} onValueChange={(value) => handleSelectChange("destination", value)}>
                  <SelectTrigger id="destination" className="w-full">
                    <SelectValue placeholder="Choisir une destination..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DESTINATIONS.map((dest) => (
                      <SelectItem key={dest.value} value={dest.value}>
                        {dest.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleContinue}
              disabled={!formData.destination}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        )}

        {/* Étape 2: Type de visa */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Type de visa</h2>
              <p className="text-gray-600 text-sm">Quel type de visa recherchez-vous ?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="visaType" className="text-gray-700 font-semibold mb-2 block">
                  Type de visa
                </Label>
                <Select value={formData.visaType} onValueChange={(value) => handleSelectChange("visaType", value)}>
                  <SelectTrigger id="visaType" className="w-full">
                    <SelectValue placeholder="Choisir un type de visa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {VISA_TYPES.map((visa) => (
                      <SelectItem key={visa.value} value={visa.value}>
                        {visa.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1 py-3 rounded-lg font-semibold"
              >
                Retour
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!formData.visaType}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Étape 3: Profession */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profession</h2>
              <p className="text-gray-600 text-sm">Quelle est votre profession actuelle ?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="occupation" className="text-gray-700 font-semibold mb-2 block">
                  Profession
                </Label>
                <Input
                  id="occupation"
                  name="occupation"
                  type="text"
                  placeholder="Ex: Ingénieur, Infirmier, etc."
                  value={formData.occupation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="flex-1 py-3 rounded-lg font-semibold"
              >
                Retour
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!formData.occupation}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Étape 4: Photo de profil obligatoire */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-6 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-blue-500 overflow-hidden shadow-inner">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Aperçu avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-blue-600" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Photo de profil obligatoire</h2>
              <p className="text-gray-600 text-sm">Ajoutez votre photo pour personnaliser votre espace 3M Travel Agency.</p>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-gray-50">
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
                <label htmlFor="avatar-upload" className="cursor-pointer block">
                  <span className="text-sm font-semibold text-blue-600 hover:text-blue-700 block mb-1">
                    📁 Choisir une photo de profil
                  </span>
                  <span className="text-xs text-gray-500">JPG, PNG ou WebP (max. 5 Mo)</span>
                </label>
                {avatarFile && (
                  <div className="mt-3 text-xs font-medium text-green-700 bg-green-100 py-1 px-3 rounded-md inline-block">
                    ✓ {avatarFile.name} prêt
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setStep(3)}
                variant="outline"
                className="flex-1 py-3 rounded-lg font-semibold"
              >
                Retour
              </Button>
              <Button
                onClick={handleComplete}
                disabled={(!avatarFile && !formData.avatarUrl) || isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <span>Valider et terminer</span>
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Résumé */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Vous pourrez modifier ces informations dans votre profil après la connexion.
          </p>
        </div>
      </motion.div>

      {rawImageSrc && (
        <AvatarCropperModal
          isOpen={isCropperOpen}
          imageSrc={rawImageSrc}
          onClose={() => setIsCropperOpen(false)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
