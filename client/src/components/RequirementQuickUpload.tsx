import { useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCEPT_ATTRIBUTE, categoryForRequirement, uploadCandidateDocument } from "@/lib/candidateUpload";
import { imagesToPdf, isImage, prepareFileForUpload } from "@/lib/prepareUpload";

type Props = {
  /** Intitulé de la pièce demandée : la catégorie d'envoi en est déduite, le candidat n'a rien à choisir. */
  label: string;
  /** « À remplacer » après un rejet : le libellé du bouton change. */
  replace?: boolean;
  onUploaded?: () => void;
};

type Phase = "idle" | "preparing" | "warn" | "uploading" | "done" | "error";

/**
 * Envoi en un geste d'une pièce demandée : choisir un fichier (ou prendre une photo sur téléphone) l'envoie tout de suite,
 * sans choisir de catégorie ni valider une seconde fois. Avant l'envoi, la photo est allégée (ou convertie si HEIC), plusieurs
 * photos sont assemblées en un seul PDF, et une photo floue ou sombre est signalée : le candidat peut la reprendre ou l'envoyer quand même.
 */
export default function RequirementQuickUpload({ label, replace = false, onUploaded }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pending, setPending] = useState<File | null>(null);

  const upload = async (file: File, notes: string[] = []) => {
    setPending(file);
    setPhase("uploading");
    setWarnings([]);
    const result = await uploadCandidateDocument({ file, category: categoryForRequirement(label), requirementLabel: label });
    if (result.ok) {
      setPhase("done");
      setMessage(`${file.name} envoyé. L’agence le vérifie.${notes.length ? ` ${notes.join(" ")}` : ""}`);
      onUploaded?.();
    } else {
      setPhase("error");
      setMessage(result.message ?? "Le dépôt a échoué. Réessayez.");
    }
  };

  const handle = async (files: File[]) => {
    if (files.length === 0) return;
    setPhase("preparing");
    setMessage("");
    setWarnings([]);
    let candidate = files[0];
    let notes: string[] = [];
    let found: string[] = [];
    if (files.length > 1) {
      if (!files.every(isImage)) {
        setPhase("error");
        setMessage("Choisissez un seul fichier, ou plusieurs photos que nous assemblons en un seul PDF.");
        return;
      }
      const merged = await imagesToPdf(files, label);
      if (!merged.file) {
        setPhase("error");
        setMessage(merged.error ?? "L’assemblage en PDF a échoué.");
        return;
      }
      candidate = merged.file;
      notes = [`${files.length} photos assemblées en un seul PDF.`];
    } else {
      const prepared = await prepareFileForUpload(files[0]);
      if (prepared.error) {
        setPhase("error");
        setMessage(prepared.error);
        return;
      }
      candidate = prepared.file;
      notes = prepared.notes;
      found = prepared.warnings;
    }
    if (found.length > 0) {
      // Une photo douteuse n'est jamais bloquée : le candidat choisit de la reprendre ou de l'envoyer telle quelle.
      setPending(candidate);
      setWarnings(found);
      setMessage(notes.join(" "));
      setPhase("warn");
      return;
    }
    await upload(candidate, notes);
  };

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void handle(files);
  };

  const busy = phase === "preparing" || phase === "uploading";
  return (
    <div className="mt-2" data-testid="requirement-quick-upload" data-state={phase}>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" disabled={busy} onClick={() => fileRef.current?.click()} className="h-10 gap-1.5 bg-blue-700 text-xs font-bold hover:bg-blue-800" aria-label={`${replace ? "Remplacer" : "Envoyer"} : ${label}`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
          {phase === "preparing" ? "Préparation…" : phase === "uploading" ? "Envoi…" : replace ? "Envoyer une nouvelle version" : "Envoyer ce document"}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => cameraRef.current?.click()} className="h-10 gap-1.5 text-xs font-bold" aria-label={`Photographier : ${label}`}>
          <Camera className="h-4 w-4" aria-hidden="true" />Photographier
        </Button>
      </div>
      <input ref={fileRef} type="file" multiple accept={ACCEPT_ATTRIBUTE} onChange={onPick} className="sr-only" tabIndex={-1} aria-hidden="true" data-testid="quick-upload-file" />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onPick} className="sr-only" tabIndex={-1} aria-hidden="true" data-testid="quick-upload-camera" />
      <div role="status" aria-live="polite" className="mt-1.5 text-xs">
        {phase === "done" && <p className="flex items-center gap-1 font-semibold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />{message}</p>}
        {phase === "warn" && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-amber-950" data-testid="quick-upload-warning">
            <p className="flex items-start gap-1 font-semibold"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{warnings.join(" ")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="h-8 text-xs font-bold" onClick={() => cameraRef.current?.click()}>Reprendre la photo</Button>
              <Button type="button" size="sm" className="h-8 bg-amber-700 text-xs font-bold hover:bg-amber-800" onClick={() => pending && void upload(pending, message ? [message] : [])}>Envoyer quand même</Button>
            </div>
          </div>
        )}
        {phase === "error" && (
          <p className="font-semibold text-rose-700" role="alert">
            {message}{" "}
            {pending && <button type="button" className="underline" onClick={() => void upload(pending)}>Réessayer</button>}
          </p>
        )}
      </div>
    </div>
  );
}
