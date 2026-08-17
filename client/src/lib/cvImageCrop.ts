export interface CropPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossible de charger l’image du CV."));
    image.src = source;
  });
}

/** Produit un PNG recadré uniquement en mémoire navigateur, sans téléversement intermédiaire. */
export async function createCroppedCvFile(source: string, crop: CropPixels, sourceName: string): Promise<File> {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(crop.width));
  canvas.height = Math.max(1, Math.round(crop.height));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Le recadrage image n’est pas disponible dans ce navigateur.");

  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Impossible de créer le recadrage.")), "image/png"));
  const baseName = sourceName.replace(/\.[^/.]+$/, "") || "cv";
  return new File([blob], `${baseName}-recadre.png`, { type: "image/png" });
}
