import { describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import { inspectDocument } from "./services/documentIntake";

const textPdf = (lines = 6) => { const doc = new jsPDF(); for (let i = 0; i < lines; i += 1) doc.text(`Ligne ${i + 1} : technicienne electricienne, six ans d'experience en maintenance industrielle.`, 10, 20 + i * 8); return Buffer.from(doc.output("arraybuffer")); };
const blankPdf = () => { const doc = new jsPDF(); doc.rect(10, 10, 50, 50); return Buffer.from(doc.output("arraybuffer")); };
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);

describe("contrôle d'un document à la réception (fichiers réels)", () => {
  it("PDF avec texte : lisible, pages et empreinte renseignées", async () => {
    const result = await inspectDocument(textPdf());
    expect(result).toMatchObject({ status: "lisible", kind: "pdf_texte", pages: 1, readableForAutomation: true });
    expect(result.textChars).toBeGreaterThan(120);
    expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(result.candidateMessage).toMatch(/lisible/);
  });
  it("le même fichier donne la même empreinte, un autre fichier une autre", async () => {
    const pdf = textPdf();
    expect((await inspectDocument(pdf)).sha256).toBe((await inspectDocument(Buffer.from(pdf))).sha256);
    expect((await inspectDocument(textPdf(7))).sha256).not.toBe((await inspectDocument(pdf)).sha256);
  });
  it("PDF sans texte (scan) : enregistré mais signalé, avec la consigne à suivre", async () => {
    const result = await inspectDocument(blankPdf());
    expect(result).toMatchObject({ status: "texte_absent", kind: "pdf_image", readableForAutomation: false });
    expect(result.candidateMessage).toMatch(/PDF dont le texte est sélectionnable/);
    expect(result.issues.join(" ")).toMatch(/scan ou photo/);
  });
  it("avec la lecture visuelle autorisée, un scan est exploitable", async () => {
    expect(await inspectDocument(blankPdf(), { visionEnabled: true })).toMatchObject({ status: "lisible", readableForAutomation: true });
    expect(await inspectDocument(PNG, { visionEnabled: true })).toMatchObject({ status: "lisible", kind: "image" });
  });
  it("image sans lecture visuelle : reçue, mais non lue automatiquement", async () => {
    for (const image of [PNG, JPG]) expect(await inspectDocument(image)).toMatchObject({ status: "texte_absent", kind: "image", readableForAutomation: false });
  });
  it("fichier vide, type inconnu, PDF corrompu : invalide, avec un message clair", async () => {
    expect(await inspectDocument(Buffer.alloc(0))).toMatchObject({ status: "invalide" });
    expect(await inspectDocument(Buffer.from("MZ exécutable"))).toMatchObject({ status: "invalide", kind: "inconnu" });
    const corrupted = await inspectDocument(Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.from("n'importe quoi")]));
    expect(corrupted.status).toBe("invalide");
    expect(corrupted.candidateMessage).toMatch(/protégé ou abîmé/);
  });
  it("signale un document très long sans le refuser", async () => {
    const deps = { pdfPageCount: async () => 45, pdfText: async () => "x".repeat(500) };
    const result = await inspectDocument(Buffer.from("%PDF-1.7 fake"), { deps });
    expect(result.status).toBe("lisible");
    expect(result.issues.join(" ")).toMatch(/très long \(45 pages\)/);
  });
  it("ne lit que les premières pages pour juger de la lisibilité", async () => {
    let requested: number[] = [];
    await inspectDocument(Buffer.from("%PDF-1.7 fake"), { deps: { pdfPageCount: async () => 12, pdfText: async (_b, pages) => { requested = pages; return "y".repeat(300); } } });
    expect(requested).toEqual([1, 2, 3, 4]);
  });
  it("les messages au candidat ne contiennent ni promesse ni jargon technique", async () => {
    for (const buffer of [textPdf(), blankPdf(), PNG, Buffer.alloc(0), Buffer.from("zzz")]) {
      const { candidateMessage } = await inspectDocument(buffer);
      expect(candidateMessage).not.toMatch(/garant|approuv|OCR|sha|erreur 5/i);
    }
  });
});
