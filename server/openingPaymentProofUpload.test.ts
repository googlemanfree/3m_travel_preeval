import { describe, expect, it } from "vitest";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  hasExpectedSignature,
  sanitizeFileName,
} from "./routers/openingPaymentProofUpload";

function fakeFile(mimetype: string, bytes: number[]): any {
  return { mimetype, buffer: Buffer.from(bytes) };
}

describe("openingPaymentProofUpload — preuve de paiement d'ouverture (photo/vidéo)", () => {
  it("accepte photo (JPEG, PNG) et vidéo (MP4, MOV, WebM) : c'est le périmètre demandé, « filmer ou photographier la facture »", () => {
    expect([...ALLOWED_MIME_TYPES].sort()).toEqual(
      ["image/jpeg", "image/png", "video/mp4", "video/quicktime", "video/webm"].sort()
    );
  });

  it("plafonne à 30 Mo : une courte vidéo de facture tient largement dedans, sans ouvrir la porte à un dépôt disproportionné", () => {
    expect(MAX_FILE_SIZE).toBe(30 * 1024 * 1024);
  });

  it("valide la signature JPEG réelle, refuse un contenu qui n'en est pas un malgré le type déclaré", () => {
    expect(hasExpectedSignature(fakeFile("image/jpeg", [0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(hasExpectedSignature(fakeFile("image/jpeg", [0x00, 0x00, 0x00, 0x00]))).toBe(false);
  });

  it("valide la signature PNG réelle, refuse un contenu qui n'en est pas un", () => {
    expect(hasExpectedSignature(fakeFile("image/png", [0x89, 0x50, 0x4e, 0x47]))).toBe(true);
    expect(hasExpectedSignature(fakeFile("image/png", [0xff, 0xd8, 0xff, 0xe0]))).toBe(false);
  });

  it("valide la signature WebM (EBML) réelle, refuse un contenu qui n'en est pas un", () => {
    expect(hasExpectedSignature(fakeFile("video/webm", [0x1a, 0x45, 0xdf, 0xa3]))).toBe(true);
    expect(hasExpectedSignature(fakeFile("video/webm", [0x00, 0x00, 0x00, 0x00]))).toBe(false);
  });

  it("valide la signature ISO-BMFF (ftyp) pour MP4 et MOV, aux octets 4-7 et non au début du fichier", () => {
    const ftypAtOffset4 = [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d];
    expect(hasExpectedSignature(fakeFile("video/mp4", ftypAtOffset4))).toBe(true);
    expect(hasExpectedSignature(fakeFile("video/quicktime", ftypAtOffset4))).toBe(true);
    expect(hasExpectedSignature(fakeFile("video/mp4", [0x66, 0x74, 0x79, 0x70, 0x00, 0x00, 0x00, 0x00]))).toBe(false);
  });

  it("refuse tout autre type MIME, même avec un contenu qui semblerait correct", () => {
    expect(hasExpectedSignature(fakeFile("application/pdf", [0x25, 0x50, 0x44, 0x46]))).toBe(false);
    expect(hasExpectedSignature(fakeFile("image/gif", [0x47, 0x49, 0x46, 0x38]))).toBe(false);
  });

  it("nettoie le nom de fichier (espaces, parenthèses) et retire tout chemin fourni", () => {
    expect(sanitizeFileName("Facture ouverture (1).jpg")).toBe("Facture_ouverture_1_.jpg");
    expect(sanitizeFileName("C:\\Users\\agent\\facture.jpg")).toBe("facture.jpg");
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
  });

  it("refuse un nom de fichier qui ne laisse rien d'exploitable après nettoyage", () => {
    expect(() => sanitizeFileName("")).toThrow(/invalide/);
    expect(() => sanitizeFileName("...")).not.toThrow(); // réduit à un nom non vide, accepté
    expect(() => sanitizeFileName("/")).toThrow(/invalide/);
  });
});
