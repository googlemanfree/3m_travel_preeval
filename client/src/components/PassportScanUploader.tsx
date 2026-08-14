import { useRef, useState } from "react";
import { Camera, CheckCircle2, FileScan, Loader2, ShieldCheck, UploadCloud, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc";

type ExtractedPassportData = {
  surname?: string | null;
  givenNames?: string | null;
  passportNumber?: string | null;
  nationality?: string | null;
  dateOfBirth?: string | null;
  expiryDate?: string | null;
  sex?: string | null;
  validForPrefill: boolean;
};

type Props = {
  onExtractedData: (data: ExtractedPassportData, scanId: number) => void;
};

const MAX_FILE_SIZE = 6 * 1024 * 1024;

function readAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? "");
      const commaIndex = value.indexOf(",");
      if (commaIndex < 0) reject(new Error("Format de fichier illisible."));
      else resolve(value.slice(commaIndex + 1));
    };
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });
}

export default function PassportScanUploader({ onExtractedData }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [fileName, setFileName] = useState("");
  const scanMutation = trpc.flightBooking.scanPassport.useMutation({
    onSuccess: (result) => {
      if (result.success && result.extractedData) {
        onExtractedData(result.extractedData, result.scanId);
        toast({ title: "Lecture terminée", description: "Les champs proposés ont été préremplis. Vérifiez chaque champ avant de continuer." });
      } else {
        toast({ title: "Scan à reprendre", description: result.message, variant: "destructive" });
      }
    },
    onError: (error) => {
      toast({ title: "Scan impossible", description: error.message || "Vous pouvez saisir vos informations manuellement.", variant: "destructive" });
    },
  });

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Format non pris en charge", description: "Choisissez une image JPG, PNG ou WebP.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Fichier trop volumineux", description: "La photo du passeport doit faire 6 Mo maximum.", variant: "destructive" });
      return;
    }
    try {
      setFileName(file.name);
      const fileBase64 = await readAsBase64(file);
      scanMutation.mutate({ fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp", fileBase64 });
    } catch (error) {
      toast({ title: "Lecture impossible", description: error instanceof Error ? error.message : "Réessayez avec une autre image.", variant: "destructive" });
    }
  };

  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4" aria-labelledby="passport-scan-title">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-600 p-2 text-white" aria-hidden="true"><FileScan className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <h3 id="passport-scan-title" className="text-sm font-black text-blue-950">Préremplir avec un scan de passeport</h3>
          <p className="mt-1 text-xs leading-5 text-blue-800">Ajoutez la page d’identité bien éclairée. Les données restent un brouillon à vérifier : le scan ne remplace pas le contrôle de l’agence.</p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void handleFile(event.target.files?.[0])} />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={scanMutation.isPending} className="h-12 rounded-xl bg-blue-700 font-black text-white hover:bg-blue-800">
          {scanMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="mr-2 h-4 w-4" aria-hidden="true" />}
          {scanMutation.isPending ? "Lecture en cours…" : "Importer le passeport"}
        </Button>
        {fileName && !scanMutation.isPending && <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-blue-900"><Camera className="h-4 w-4 shrink-0" /> <span className="truncate">{fileName}</span></span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-blue-800">
        <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Traitement sécurisé côté serveur</span>
        <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Vérification manuelle obligatoire</span>
      </div>
      {scanMutation.isError && <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-700" role="alert"><XCircle className="h-4 w-4" /> Le formulaire reste disponible en saisie manuelle.</p>}
    </section>
  );
}
