import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, CheckCircle2, RotateCw } from "lucide-react";

type PassportCropDialogProps = {
  file: File | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (file: File) => void;
};

const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 800;

export function PassportCropDialog({ file, open, onOpenChange, onConfirm }: PassportCropDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);

  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [file]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const createCroppedFile = async () => {
    if (!file || !previewUrl) return;
    const image = new Image();
    image.src = previewUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image illisible"));
    });

    const sourceRatio = image.width / image.height;
    const targetRatio = OUTPUT_WIDTH / OUTPUT_HEIGHT;
    let cropWidth = image.width / zoom;
    let cropHeight = image.height / zoom;
    if (cropWidth / cropHeight > targetRatio) cropWidth = cropHeight * targetRatio;
    else cropHeight = cropWidth / targetRatio;
    const cropX = (image.width - cropWidth) / 2;
    const cropY = (image.height - cropHeight) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    context.save();
    context.translate(OUTPUT_WIDTH / 2, OUTPUT_HEIGHT / 2);
    context.rotate((rotation * Math.PI) / 180);
    context.drawImage(image, cropX, cropY, cropWidth, cropHeight, -OUTPUT_WIDTH / 2, -OUTPUT_HEIGHT / 2, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    context.restore();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) return;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    onConfirm(new File([blob], `${baseName}-recadre.jpg`, { type: "image/jpeg", lastModified: Date.now() }));
    onOpenChange(false);
  };

  const isImage = !!file && file.type.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Recadrer votre passeport</DialogTitle>
          <DialogDescription>
            Centrez la page biographique et gardez la photographie ainsi que les deux lignes MRZ visibles dans le cadre.
          </DialogDescription>
        </DialogHeader>

        {!isImage ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            Le recadrage guidé est disponible pour les fichiers JPG, PNG ou WEBP. Pour un PDF, téléversez une nouvelle version bien cadrée.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative mx-auto aspect-[3/2] max-h-[45vh] overflow-hidden rounded-xl bg-slate-900 border border-slate-700">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Aperçu de recadrage du passeport"
                  className="absolute inset-0 h-full w-full object-contain transition-transform duration-150"
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                />
              )}
              <div className="pointer-events-none absolute inset-[8%] border-2 border-white rounded-lg shadow-[0_0_0_999px_rgba(2,6,23,.45)]">
                <span className="absolute -top-7 left-0 rounded bg-white px-2 py-1 text-[11px] font-bold text-slate-900">Cadre recommandé</span>
                <div className="absolute left-[6%] top-[14%] h-[48%] w-[30%] rounded border border-dashed border-emerald-300 bg-emerald-400/10" />
                <div className="absolute bottom-[5%] left-[4%] h-[20%] w-[92%] rounded border border-dashed border-sky-300 bg-sky-400/10" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Zoom
                <Slider min={1} max={2.2} step={0.05} value={[zoom]} onValueChange={([value]) => setZoom(value)} />
              </label>
              <Button type="button" variant="outline" onClick={() => setRotation((current) => (current + 90) % 360)}>
                <RotateCw className="mr-2 h-4 w-4" /> Tourner
              </Button>
            </div>
            <p className="flex gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Le recadrage est réalisé dans votre navigateur. Le fichier original n’est remplacé qu’après votre confirmation.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button type="button" onClick={createCroppedFile} disabled={!isImage}>Utiliser le recadrage</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
