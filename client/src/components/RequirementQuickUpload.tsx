import { useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCEPT_ATTRIBUTE, categoryForRequirement, uploadCandidateDocument } from "@/lib/candidateUpload";

type Props = {
  /** Intitulé de la pièce demandée : la catégorie d'envoi en est déduite, le candidat n'a rien à choisir. */
  label: string;
  /** « À remplacer » après un rejet : le libellé du bouton change. */
  replace?: boolean;
  onUploaded?: () => void;
};

/**
 * Envoi en un geste d'une pièce demandée : choisir un fichier (ou prendre une photo sur téléphone) l'envoie tout de suite,
 * sans choisir de catégorie ni valider une seconde fois. L'état (envoi, reçu, erreur avec le motif) reste sur la ligne.
 */
export default function RequirementQuickUpload({ label, replace = false, onUploaded }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [lastFile, setLastFile] = useState<File | null>(null);

  const send = async (file: File) => {
    setLastFile(file);
    setState("uploading");
    setMessage("");
    const result = await uploadCandidateDocument({ file, category: categoryForRequirement(label) });
    if (result.ok) {
      setState("done");
      setMessage(`${file.name} envoyé. L’agence le vérifie.`);
      onUploaded?.();
    } else {
      setState("error");
      setMessage(result.message ?? "Le dépôt a échoué. Réessayez.");
    }
  };

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void send(file);
  };

  const busy = state === "uploading";
  return (
    <div className="mt-2" data-testid="requirement-quick-upload" data-state={state}>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" disabled={busy} onClick={() => fileRef.current?.click()} className="h-10 gap-1.5 bg-blue-700 text-xs font-bold hover:bg-blue-800" aria-label={`${replace ? "Remplacer" : "Envoyer"} : ${label}`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
          {busy ? "Envoi…" : replace ? "Envoyer une nouvelle version" : "Envoyer ce document"}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => cameraRef.current?.click()} className="h-10 gap-1.5 text-xs font-bold" aria-label={`Photographier : ${label}`}>
          <Camera className="h-4 w-4" aria-hidden="true" />Photographier
        </Button>
      </div>
      <input ref={fileRef} type="file" accept={ACCEPT_ATTRIBUTE} onChange={onPick} className="sr-only" tabIndex={-1} aria-hidden="true" data-testid="quick-upload-file" />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPick} className="sr-only" tabIndex={-1} aria-hidden="true" data-testid="quick-upload-camera" />
      <div role="status" aria-live="polite" className="mt-1.5 text-xs">
        {state === "done" && <p className="flex items-center gap-1 font-semibold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{message}</p>}
        {state === "error" && (
          <p className="font-semibold text-rose-700" role="alert">
            {message}{" "}
            {lastFile && <button type="button" className="underline" onClick={() => void send(lastFile)}>Réessayer</button>}
          </p>
        )}
      </div>
    </div>
  );
}
