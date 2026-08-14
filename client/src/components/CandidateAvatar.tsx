import { useState, useRef } from "react";
import { Camera, Loader } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { verifyHumanPortrait } from "@/lib/portraitVerification";

interface Props {
  fullName: string;
  avatarUrl?: string | null;
  size?: "md" | "lg";
  editable?: boolean;
  onUpdated?: (url: string) => void;
  email?: string;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("") || "?";
}

export default function CandidateAvatar({ fullName, avatarUrl, size = "lg", editable = false, onUpdated, email }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateAvatarMutation = trpc.candidate.updateAvatar.useMutation();

  const dimension = size === "lg" ? "w-24 h-24 text-2xl" : "w-12 h-12 text-sm";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Merci de choisir une image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image doit faire moins de 5 Mo.");
      return;
    }
    setError("");
    if (!email) {
      setError("Votre e-mail de connexion est nécessaire pour sécuriser ce changement.");
      return;
    }
    setUploading(true);
    try {
      const verification = await verifyHumanPortrait(file);
      if (!verification.accepted) throw new Error(verification.reason);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", "photo_identite");
      formData.append("email", email.trim().toLowerCase());
      formData.append("captureMethod", "gallery");

      const res = await fetch("/api/candidate/upload-public", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.fileUrl !== "string" || typeof data.portraitVerificationToken !== "string") {
        throw new Error(data.error || "Échec de l'envoi sécurisé de la photo.");
      }

      const result = await updateAvatarMutation.mutateAsync({
        avatarUrl: data.fileUrl,
        portraitVerificationToken: data.portraitVerificationToken,
      });
      onUpdated?.(result.avatarUrl);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour de la photo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <div className={`${dimension} rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold ring-4 ring-white shadow-md`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials(fullName)}</span>
        )}
      </div>

      {editable && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Changer la photo de profil"
            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md transition-colors"
          >
            {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="user" onChange={handleFileSelect} className="hidden" />
        </>
      )}

      {error && <p className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-xs text-red-600 whitespace-nowrap">{error}</p>}
    </div>
  );
}
