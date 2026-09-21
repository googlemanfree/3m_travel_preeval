import { describe, expect, it } from "vitest";
import { CV_ACCEPTED_MIME_TYPES, CV_MAX_BYTES, checkCvUpload, cvMimeFromName, cvProblemForFile, detectCvMime, safeCvFileName } from "../shared/evaluationCv";

const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31];
const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const b64 = (bytes: number[], padding = 0) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(padding)]).toString("base64");

describe("CV : contrôles côté navigateur", () => {
  it("accepte PDF, JPG et PNG (type annoncé ou, à défaut, extension du nom)", () => {
    for (const type of CV_ACCEPTED_MIME_TYPES) expect(cvProblemForFile({ name: "cv", type, size: 1200 })).toBeNull();
    expect(cvProblemForFile({ name: "CV.PDF", type: "", size: 1200 })).toBeNull(); // le navigateur ne renseigne pas toujours le type
    expect(cvProblemForFile({ name: "photo.jpeg", type: "", size: 1200 })).toBeNull();
  });

  it("refuse un autre format, un fichier vide et un fichier de plus de 5 Mo", () => {
    expect(cvProblemForFile({ name: "cv.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 1200 })).toBe("Le CV doit être au format PDF, JPG ou PNG.");
    expect(cvProblemForFile({ name: "cv", type: "text/plain", size: 10 })).toBe("Le CV doit être au format PDF, JPG ou PNG.");
    expect(cvProblemForFile({ name: "cv.pdf", type: "application/pdf", size: 0 })).toBe("Le fichier du CV est vide.");
    expect(cvProblemForFile({ name: "cv.pdf", type: "application/pdf", size: CV_MAX_BYTES + 1 })).toBe("Le CV ne doit pas dépasser 5 Mo.");
    expect(cvProblemForFile({ name: "cv.pdf", type: "application/pdf", size: CV_MAX_BYTES })).toBeNull(); // la limite elle-même est acceptée
  });

  it("déduit le type d'après l'extension, sans tenir compte de la casse", () => {
    expect(cvMimeFromName("mon.cv.JPG")).toBe("image/jpeg");
    expect(cvMimeFromName("cv.exe")).toBeNull();
    expect(cvMimeFromName("cv")).toBeNull();
  });
});

describe("CV : contrôles serveur sur le contenu", () => {
  it("reconnaît le type d'après les premiers octets", () => {
    expect(detectCvMime(new Uint8Array(PDF))).toBe("application/pdf");
    expect(detectCvMime(new Uint8Array(JPEG))).toBe("image/jpeg");
    expect(detectCvMime(new Uint8Array(PNG))).toBe("image/png");
    expect(detectCvMime(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBeNull(); // archive ZIP (dont les .docx)
    expect(detectCvMime(new Uint8Array([0x25, 0x50]))).toBeNull(); // trop court
    expect(detectCvMime(new Uint8Array())).toBeNull();
  });

  it("décode un CV avec ou sans préfixe « data: » et renvoie son vrai type", () => {
    const withPrefix = checkCvUpload(`data:application/pdf;base64,${b64(PDF, 20)}`);
    expect(withPrefix).toMatchObject({ ok: true, mime: "application/pdf" });
    expect(checkCvUpload(b64(PNG, 5))).toMatchObject({ ok: true, mime: "image/png" });
    const jpeg = checkCvUpload(b64(JPEG));
    expect(jpeg.ok && Array.from(jpeg.bytes)).toEqual(JPEG);
  });

  it("ignore le type annoncé : un exécutable ou un script renommé en .pdf est refusé", () => {
    for (const content of ["MZ\u0090\u0000\u0003", "<script>alert(1)</script>", "<?php system($_GET[0]); ?>"]) {
      expect(checkCvUpload(Buffer.from(content, "latin1").toString("base64")), content).toEqual({ ok: false, message: "Le CV doit être au format PDF, JPG ou PNG." });
    }
  });

  it("refuse un contenu qui n'est pas du base64, un fichier vide et un fichier trop lourd", () => {
    expect(checkCvUpload("%%% pas du base64 %%%")).toEqual({ ok: false, message: "Le CV doit être au format PDF, JPG ou PNG." });
    expect(checkCvUpload("data:application/pdf;base64,")).toEqual({ ok: false, message: "Le fichier du CV est vide." });
    expect(checkCvUpload(b64(PDF, CV_MAX_BYTES))).toEqual({ ok: false, message: "Le CV ne doit pas dépasser 5 Mo." });
    expect(checkCvUpload(b64(PDF, CV_MAX_BYTES - PDF.length)).ok).toBe(true); // exactement 5 Mo
  });
});

describe("CV : nom de fichier pour le stockage", () => {
  it("retire tout chemin et tout caractère spécial, et borne la longueur", () => {
    expect(safeCvFileName("../../etc/passwd")).toBe("passwd");
    expect(safeCvFileName("C:\\Users\\moi\\CV Final (v2).pdf")).toBe("CV_Final__v2_.pdf");
    expect(safeCvFileName("é à ü.pdf")).toMatch(/^[A-Za-z0-9._-]+$/); // un nom accentué ne casse rien
    expect(safeCvFileName("...cache.pdf")).toBe("cache.pdf");
    expect(safeCvFileName("")).toBe("cv");
    expect(safeCvFileName("a".repeat(300) + ".pdf").length).toBeLessThanOrEqual(80);
    expect(safeCvFileName("a".repeat(300) + ".pdf").endsWith(".pdf")).toBe(true); // l'extension est conservée
  });
});
