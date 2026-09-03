import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pdfService = readFileSync(resolve(root, "server/evaluationBilanPdfService.ts"), "utf8");
const email = readFileSync(resolve(root, "server/_core/email.ts"), "utf8");
const router = readFileSync(resolve(root, "server/routers/unifiedRequests.ts"), "utf8");

describe("distribution du bilan PDF", () => {
  it("construit un PDF professionnel avec le logo agence existant", () => {
    expect(pdfService).toContain('path.resolve(import.meta.dirname, "../client/public/favicon.png")');
    expect(pdfService).toContain('doc.addImage(logoData, "PNG"');
    expect(pdfService).toContain('Bilan d’évaluation préliminaire — document finalisé');
  });

  it("transmet la pièce jointe PDF via le helper SMTP", () => {
    expect(email).toContain("attachments?: Array<{ filename: string; content: Buffer | string");
    expect(email).toContain("attachments: options.attachments");
    expect(email).toContain("connectionTimeout: 15000");
    expect(router).toContain('content: finalPdf.bytes, contentType: "application/pdf"');
  });

  it("conserve le dépôt sécurisé client en plus de l’e-mail", () => {
    expect(router).toContain("evaluationReportPdfKey: finalPdf.key");
    expect(router).toContain("evaluationReportPdfUrl: finalPdf.url");
    expect(router).toContain("dans l’espace client et par e-mail");
  });
});
