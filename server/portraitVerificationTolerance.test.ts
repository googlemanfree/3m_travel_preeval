import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const clientVerifier = readFileSync(new URL("../client/src/lib/portraitVerification.ts", import.meta.url), "utf8");
const uploadValidator = readFileSync(new URL("./routers/candidateUpload.ts", import.meta.url), "utf8");
const cropper = readFileSync(new URL("../client/src/components/AvatarCropperModal.tsx", import.meta.url), "utf8");

 describe("Vérification portrait tolérante", () => {
  it("ne bloque plus les petites résolutions ni les portraits compressés", () => {
    expect(clientVerifier).not.toContain("96 × 96 pixels");
    expect(clientVerifier).toContain("faceCount === 0");
    expect(clientVerifier).toContain("accepted: true");
  });

  it("conserve la validation de contenu réel et de taille maximale côté serveur", () => {
    expect(uploadValidator).toContain("isExpectedFileContent(file)");
    expect(uploadValidator).toContain("file.size > 5 * 1024 * 1024");
    expect(uploadValidator).not.toContain("width < 96 || height < 96");
  });

  it("produit un JPEG plus compatible après recadrage", () => {
    expect(cropper).toContain('"avatar_cropped.jpg"');
    expect(cropper).toContain('"image/jpeg"');
  });
});
