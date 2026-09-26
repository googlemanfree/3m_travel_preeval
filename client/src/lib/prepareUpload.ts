/**
 * Préparation d'une pièce avant son envoi depuis l'espace client (téléphone surtout) :
 *  - photo HEIC/HEIF (iPhone) convertie en JPEG quand le navigateur sait la lire ;
 *  - photo trop lourde ou trop grande réduite (les scans de téléphone dépassent souvent 10 Mo) ;
 *  - plusieurs photos (recto/verso, pages) assemblées en un seul PDF ;
 *  - contrôle de lisibilité : photo floue ou trop sombre signalée avant l'envoi, sans jamais bloquer.
 * Les calculs sont purs (testés sans navigateur) ; le canvas n'est utilisé que si le navigateur en offre un.
 */

export const MAX_DIMENSION = 2200;
export const COMPRESS_ABOVE_BYTES = 1.5 * 1024 * 1024;
export const JPEG_QUALITY = 0.85;

export type PrepareResult = { file: File; notes: string[]; warnings: string[]; error?: string };

export const isHeic = (file: { name: string; type?: string }): boolean => /\.hei[cf]$/i.test(file.name) || /image\/hei[cf]/i.test(file.type ?? "");
export const isImage = (file: { name: string; type?: string }): boolean => /^image\/(jpeg|png|webp|hei[cf])/i.test(file.type ?? "") || /\.(jpe?g|png|webp|hei[cf])$/i.test(file.name);

/** Nouvelle taille (largeur, hauteur) : côté le plus long ramené à `max`, jamais agrandi. */
export function fitWithin(width: number, height: number, max = MAX_DIMENSION): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max || longest <= 0) return { width, height };
  const ratio = max / longest;
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

export const LIGHT_TOO_DARK = 45;
export const LIGHT_TOO_BRIGHT = 240;
export const BLUR_BELOW = 60;

/** Luminance moyenne (0-255) et netteté (variance du laplacien : basse = floue) à partir de pixels RGBA. */
export function analyzePixels(data: ArrayLike<number>, width: number, height: number): { meanLuma: number; sharpness: number } {
  const pixelCount = width * height;
  if (pixelCount <= 0 || data.length < pixelCount * 4) return { meanLuma: 128, sharpness: Number.POSITIVE_INFINITY };
  const luma = new Float32Array(pixelCount);
  let sum = 0;
  for (let index = 0; index < pixelCount; index += 1) {
    const value = 0.299 * data[index * 4] + 0.587 * data[index * 4 + 1] + 0.114 * data[index * 4 + 2];
    luma[index] = value;
    sum += value;
  }
  if (width < 3 || height < 3) return { meanLuma: sum / pixelCount, sharpness: Number.POSITIVE_INFINITY };
  let laplacianSum = 0;
  let laplacianSquares = 0;
  let samples = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const laplacian = luma[i - width] + luma[i + width] + luma[i - 1] + luma[i + 1] - 4 * luma[i];
      laplacianSum += laplacian;
      laplacianSquares += laplacian * laplacian;
      samples += 1;
    }
  }
  const mean = laplacianSum / samples;
  return { meanLuma: sum / pixelCount, sharpness: laplacianSquares / samples - mean * mean };
}

/** Avertissements lisibles (jamais bloquants) pour une image analysée. */
export function readabilityWarnings(analysis: { meanLuma: number; sharpness: number }): string[] {
  const warnings: string[] = [];
  if (analysis.meanLuma < LIGHT_TOO_DARK) warnings.push("La photo est très sombre : reprenez-la dans un endroit plus éclairé.");
  else if (analysis.meanLuma > LIGHT_TOO_BRIGHT) warnings.push("La photo est très claire, presque blanche : évitez le reflet ou le flash.");
  if (analysis.sharpness < BLUR_BELOW) warnings.push("La photo semble floue : posez le document à plat et reprenez-la, sans bouger.");
  return warnings;
}

type Decoded = { source: CanvasImageSource; width: number; height: number; release: () => void };

async function decode(file: File): Promise<Decoded | null> {
  if (typeof createImageBitmap !== "function") return null;
  try {
    const bitmap = await createImageBitmap(file);
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close?.() };
  } catch {
    return null;
  }
}

function canvasOf(width: number, height: number): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext && canvas.getContext("2d") ? canvas : null;
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

const jpegName = (name: string): string => `${name.replace(/\.[^.]+$/, "") || "photo"}.jpg`;

export async function prepareFileForUpload(file: File): Promise<PrepareResult> {
  const notes: string[] = [];
  const warnings: string[] = [];
  if (!isImage(file)) return { file, notes, warnings };

  const heic = isHeic(file);
  const decoded = await decode(file);
  if (!decoded) {
    if (heic) return { file, notes, warnings, error: "Cette photo HEIC ne peut pas être lue par votre navigateur. Envoyez-la en JPEG (réglage de l’appareil photo « le plus compatible ») ou en PDF." };
    return { file, notes, warnings };
  }
  try {
    const target = fitWithin(decoded.width, decoded.height);
    const resized = target.width !== decoded.width || target.height !== decoded.height;
    const canvas = canvasOf(target.width, target.height);
    if (!canvas) return { file, notes, warnings };
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, target.width, target.height);
    context.drawImage(decoded.source, 0, 0, target.width, target.height);

    // Lisibilité : analyse sur une version réduite (256 px), pour rester rapide sur téléphone.
    const probe = fitWithin(target.width, target.height, 256);
    const probeCanvas = canvasOf(probe.width, probe.height);
    if (probeCanvas) {
      const probeContext = probeCanvas.getContext("2d")!;
      probeContext.drawImage(canvas, 0, 0, probe.width, probe.height);
      warnings.push(...readabilityWarnings(analyzePixels(probeContext.getImageData(0, 0, probe.width, probe.height).data, probe.width, probe.height)));
    }

    const mustConvert = heic;
    const mustShrink = resized || file.size > COMPRESS_ABOVE_BYTES;
    if (!mustConvert && !mustShrink) return { file, notes, warnings };
    const blob = await toBlob(canvas, "image/jpeg", JPEG_QUALITY);
    if (!blob) return { file, notes, warnings, ...(heic ? { error: "La conversion de la photo a échoué. Envoyez-la en JPEG ou en PDF." } : {}) };
    if (!mustConvert && blob.size >= file.size) return { file, notes, warnings };
    const prepared = new File([blob], mustConvert || !/\.jpe?g$/i.test(file.name) ? jpegName(file.name) : file.name, { type: "image/jpeg", lastModified: Date.now() });
    if (heic) notes.push("Photo HEIC convertie en JPEG.");
    if (mustShrink) notes.push(`Photo allégée : ${(file.size / 1024 / 1024).toFixed(1)} Mo → ${(prepared.size / 1024 / 1024).toFixed(1)} Mo.`);
    return { file: prepared, notes, warnings };
  } finally {
    decoded.release();
  }
}

/** Page A4 (595 × 842 pt) : image centrée, proportions conservées, marge de 24 pt. */
export function fitOnPage(imageWidth: number, imageHeight: number, page = { width: 595.28, height: 841.89 }, margin = 24) {
  const maxWidth = page.width - margin * 2;
  const maxHeight = page.height - margin * 2;
  const ratio = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
  const width = imageWidth * ratio;
  const height = imageHeight * ratio;
  return { x: (page.width - width) / 2, y: (page.height - height) / 2, width, height };
}

/** Assemble plusieurs photos en un seul PDF (recto/verso d'une carte, pages d'un acte). Chargé à la demande : jsPDF est lourd. */
export async function imagesToPdf(files: File[], name: string): Promise<{ file?: File; error?: string }> {
  if (files.length === 0) return { error: "Aucune photo à assembler." };
  try {
    const prepared: Array<{ dataUrl: string; width: number; height: number }> = [];
    for (const original of files) {
      const result = await prepareFileForUpload(original);
      if (result.error) return { error: result.error };
      const decoded = await decode(result.file);
      if (!decoded) return { error: `Impossible de lire « ${original.name} ». Envoyez-la séparément.` };
      const canvas = canvasOf(decoded.width, decoded.height);
      if (!canvas) return { error: "L’assemblage en PDF n’est pas disponible sur cet appareil." };
      const context = canvas.getContext("2d")!;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, decoded.width, decoded.height);
      context.drawImage(decoded.source, 0, 0);
      prepared.push({ dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY), width: decoded.width, height: decoded.height });
      decoded.release();
    }
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
    prepared.forEach((image, index) => {
      if (index > 0) pdf.addPage();
      const box = fitOnPage(image.width, image.height);
      pdf.addImage(image.dataUrl, "JPEG", box.x, box.y, box.width, box.height);
    });
    const blob = pdf.output("blob");
    const safe = name.replace(/[^a-zA-Z0-9À-ÿ _-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "document";
    return { file: new File([blob], `${safe}.pdf`, { type: "application/pdf", lastModified: Date.now() }) };
  } catch {
    return { error: "L’assemblage en PDF a échoué. Envoyez les photos une par une." };
  }
}
