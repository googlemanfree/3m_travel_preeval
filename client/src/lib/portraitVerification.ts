export type PortraitVerificationResult = {
  accepted: boolean;
  faceCount: number;
  confidence: number;
  reason: string;
};

let modelPromise: Promise<any> | null = null;

async function loadFaceModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      const [tf, blazeface] = await Promise.all([
        import("@tensorflow/tfjs"),
        import("@tensorflow-models/blazeface"),
      ]);

      await tf.ready();
      if (tf.getBackend() !== "webgl") {
        try {
          await tf.setBackend("webgl");
          await tf.ready();
        } catch {
          // Le backend CPU reste utilisable sur les appareils sans WebGL.
        }
      }
      return blazeface.load();
    })().catch((error) => {
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

function readImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Cette image ne peut pas être lue."));
    };
    image.src = objectUrl;
  });
}

export async function verifyHumanPortrait(file: Blob): Promise<PortraitVerificationResult> {
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
    return { accepted: false, faceCount: 0, confidence: 0, reason: "La photo doit faire moins de 5 Mo." };
  }

  const image = await readImage(file);
  if (image.naturalWidth < 240 || image.naturalHeight < 240) {
    return {
      accepted: false,
      faceCount: 0,
      confidence: 0,
      reason: "La photo est trop petite. Utilisez un portrait d’au moins 240 × 240 pixels.",
    };
  }

  try {
    const model = await loadFaceModel();
    const faces = await model.estimateFaces(image, false);
    const faceCount = faces.length;
    if (faceCount !== 1) {
      return {
        accepted: false,
        faceCount,
        confidence: 0,
        reason: faceCount === 0
          ? "Aucun visage clairement détecté. Utilisez une photo de portrait nette."
          : "Une seule personne doit apparaître sur la photo.",
      };
    }

    const face = faces[0] as {
      topLeft?: [number, number];
      bottomRight?: [number, number];
      probability?: number | number[];
    };
    const topLeft = face.topLeft ?? [0, 0];
    const bottomRight = face.bottomRight ?? [0, 0];
    const faceWidth = Math.max(0, bottomRight[0] - topLeft[0]);
    const faceHeight = Math.max(0, bottomRight[1] - topLeft[1]);
    const areaRatio = (faceWidth * faceHeight) / (image.naturalWidth * image.naturalHeight);
    const rawConfidence = Array.isArray(face.probability) ? face.probability[0] ?? 0 : face.probability ?? 0;
    const confidence = Math.round(rawConfidence * 100) / 100;

    if (areaRatio < 0.025 || confidence < 0.65) {
      return {
        accepted: false,
        faceCount,
        confidence,
        reason: "Le visage est trop éloigné ou insuffisamment net. Rapprochez-vous et reprenez la photo.",
      };
    }

    return {
      accepted: true,
      faceCount,
      confidence,
      reason: "Portrait humain vérifié.",
    };
  } catch (error) {
    console.error("[PortraitVerification] Face model unavailable", error);
    return {
      accepted: false,
      faceCount: 0,
      confidence: 0,
      reason: "La vérification automatique est momentanément indisponible. Vérifiez votre connexion puis réessayez.",
    };
  }
}
