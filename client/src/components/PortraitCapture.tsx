import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle, ImagePlus, Loader, RotateCcw, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AvatarCropperModal } from "@/components/AvatarCropperModal";
import { verifyHumanPortrait } from "@/lib/portraitVerification";

export type PortraitCaptureResult = {
  file: File;
  preview: string;
  method: "camera" | "gallery";
  faceCount: number;
  confidence: number;
};

type PortraitCaptureProps = {
  disabled?: boolean;
  onVerified: (result: PortraitCaptureResult) => void;
};

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Impossible de prévisualiser la photo."));
    reader.readAsDataURL(file);
  });
}

export function PortraitCapture({ disabled = false, onVerified }: PortraitCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [message, setMessage] = useState("Aucun portrait vérifié pour le moment.");
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<"camera" | "gallery">("gallery");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [cameraOpen]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  async function startCamera() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("La caméra n’est pas disponible sur cet appareil. Utilisez la galerie.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError("Autorisez l’accès à la caméra ou choisissez une photo dans votre galerie.");
    }
  }

  async function verifyAndPublish(file: File, method: "camera" | "gallery") {
    setIsChecking(true);
    setMessage("Vérification du portrait en cours…");
    try {
      const result = await verifyHumanPortrait(file);
      if (!result.accepted) {
        setMessage(result.reason);
        toast.error(result.reason);
        return;
      }
      const preview = await fileToDataUrl(file);
      setMessage("Portrait humain vérifié. Vous pouvez finaliser votre inscription.");
      toast.success("Portrait humain vérifié.");
      onVerified({ ...result, file, preview, method });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "La vérification du portrait a échoué.";
      setMessage(reason);
      toast.error(reason);
    } finally {
      setIsChecking(false);
    }
  }

  function openCropper(file: File, method: "camera" | "gallery") {
    if (!file.type.startsWith("image/")) {
      setMessage("Sélectionnez une image JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("La photo doit faire moins de 5 Mo.");
      return;
    }
    setPendingMethod(method);
    void fileToDataUrl(file).then((dataUrl) => {
      setRawImageSrc(dataUrl);
      setCropperOpen(true);
    }).catch(() => setMessage("Impossible de lire cette image."));
  }

  function captureFromCamera() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("La caméra n’est pas encore prête. Patientez une seconde puis réessayez.");
      return;
    }
    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.translate(size, 0);
    context.scale(-1, 1);
    context.drawImage(video, (video.videoWidth - size) / 2, (video.videoHeight - size) / 2, size, size, 0, 0, size, size);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("La capture a échoué. Réessayez.");
        return;
      }
      stopCamera();
      openCropper(new File([blob], "portrait-camera.jpg", { type: "image/jpeg" }), "camera");
    }, "image/jpeg", 0.92);
  }

  return (
    <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-blue-100 p-2 text-blue-700"><ShieldCheck className="h-5 w-5" /></div>
        <div>
          <p className="text-sm font-bold text-gray-900">Portrait humain obligatoire</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">Une seule personne doit être visible. Le contrôle est effectué sur votre appareil avant l’envoi sécurisé.</p>
        </div>
      </div>

      {cameraOpen ? (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl bg-gray-950 aspect-square">
            <video ref={videoRef} muted playsInline autoPlay className="h-full w-full object-cover scale-x-[-1]" aria-label="Aperçu de la caméra" />
            <div className="pointer-events-none absolute inset-8 rounded-full border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.28)]" />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={captureFromCamera} disabled={disabled || isChecking} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
              <Camera className="mr-2 h-4 w-4" /> Prendre la photo
            </Button>
            <Button type="button" variant="outline" onClick={stopCamera} disabled={isChecking}>Annuler</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" onClick={() => void startCamera()} disabled={disabled || isChecking} variant="outline" className="h-11 border-blue-200 bg-white text-blue-800 hover:bg-blue-50">
            <Camera className="mr-2 h-4 w-4" /> Utiliser la caméra
          </Button>
          <Button type="button" onClick={() => inputRef.current?.click()} disabled={disabled || isChecking} variant="outline" className="h-11 border-blue-200 bg-white text-blue-800 hover:bg-blue-50">
            <ImagePlus className="mr-2 h-4 w-4" /> Choisir dans la galerie
          </Button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="hidden" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) openCropper(file, "gallery");
            event.currentTarget.value = "";
          }} />
        </div>
      )}

      {cameraError && <p className="text-xs font-medium text-red-700" role="alert">{cameraError}</p>}
      <p className={`flex items-center gap-2 text-xs ${message.includes("vérifié") ? "font-semibold text-green-700" : "text-gray-600"}`} role="status" aria-live="polite">
        {isChecking ? <Loader className="h-3.5 w-3.5 animate-spin" /> : message.includes("vérifié") ? <CheckCircle className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
        {message}
      </p>
      {message.includes("Aucun portrait") === false && !isChecking && !message.includes("vérifié") && (
        <button type="button" className="inline-flex items-center text-xs font-semibold text-blue-700 hover:underline" onClick={() => setMessage("Aucun portrait vérifié pour le moment.")}>
          <RotateCcw className="mr-1 h-3 w-3" /> Recommencer
        </button>
      )}

      {rawImageSrc && (
        <AvatarCropperModal
          isOpen={cropperOpen}
          imageSrc={rawImageSrc}
          onClose={() => setCropperOpen(false)}
          onCropComplete={(croppedFile) => {
            setCropperOpen(false);
            void verifyAndPublish(croppedFile, pendingMethod);
          }}
        />
      )}
    </div>
  );
}
