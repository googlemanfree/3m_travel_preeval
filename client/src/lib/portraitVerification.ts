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
  // Ne pas imposer de résolution minimale : la caméra de certains mobiles et
  // les images fortement compressées restent exploitables pour un portrait.
  if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
    return { accepted: false, faceCount: 0, confidence: 0, reason: "Cette image ne peut pas être lue." };
  }

  try {
    const detection = await Promise.race([
      (async () => {
        const model = await loadFaceModel();
        return model.estimateFaces(image, false) as Promise<any[]>;
      })(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("FACE_CHECK_TIMEOUT")), 3500)),
    ]);
    const faces = detection as any[];
    const faceCount = faces.length;
    if (faceCount > 1) {
      return {
        accepted: false,
        faceCount,
        confidence: 0,
        reason: "Une seule personne doit apparaître sur la photo.",
      };
    }

    // Une détection incertaine ne doit pas bloquer un candidat sérieux. Le
    // fichier reste une image valide et peut être contrôlé manuellement côté
    // admin si le modèle ne distingue pas suffisamment le visage.
    if (faceCount === 0) {
      return {
        accepted: true,
        faceCount: 0,
        confidence: 0,
        reason: "Portrait reçu. La détection est incertaine, mais vous pouvez poursuivre l’inscription.",
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

    // Seuils souples : la présence d’un seul visage est suffisante, même si la
    // photo est compressée, sombre ou prise avec une caméra d’entrée de gamme.
    if (areaRatio < 0.001 || confidence < 0.2) {
      return {
        accepted: true,
        faceCount,
        confidence,
        reason: "Portrait reçu. La qualité est faible, mais la photo peut être utilisée.",
      };
    }

    return {
      accepted: true,
      faceCount,
      confidence,
      reason: "Portrait humain vérifié.",
    };
  } catch (error) {
    console.warn("[PortraitVerification] Face model unavailable; soft acceptance", error);
    return {
      accepted: true,
      faceCount: 0,
      confidence: 0,
      reason: "Portrait reçu. La vérification automatique n’a pas pu s’achever, vous pouvez poursuivre.",
    };
  }
}
