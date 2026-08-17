import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

const cvService = vi.hoisted(() => ({
  extractTextFromPDF: vi.fn(),
  extractCVFieldsForForm: vi.fn(),
  generateAIEvaluationReport: vi.fn(),
}));

vi.mock("./aiEvaluationService", () => cvService);

import { evaluationRouter } from "./routers/evaluation";

const samplePdf = `data:application/pdf;base64,${Buffer.from("%PDF-1.4\nCV de démonstration\n%%EOF").toString("base64")}`;

describe("evaluation.extractFromCV", () => {
  it("retourne uniquement les champs extraits pour un CV PDF valide sans créer de dossier", async () => {
    cvService.extractTextFromPDF.mockResolvedValue("Master en informatique, développeur depuis 2018.");
    cvService.extractCVFieldsForForm.mockResolvedValue({
      educationLevel: "master",
      currentJobTitle: "Développeur logiciel",
      yearsOfExperience: "5-10",
    });

    const caller = evaluationRouter.createCaller({} as any);
    const result = await caller.extractFromCV({ cvBase64: samplePdf, cvMimeType: "application/pdf" });

    expect(result).toMatchObject({ success: true, prefilledCount: 3 });
    expect(result.fields).toEqual({ educationLevel: "master", currentJobTitle: "Développeur logiciel", yearsOfExperience: "5-10" });
    expect(cvService.extractTextFromPDF).toHaveBeenCalledOnce();
    expect(cvService.extractCVFieldsForForm).toHaveBeenCalledWith("Master en informatique, développeur depuis 2018.");
  });

  it("rejette un fichier non PDF avant toute tentative d’extraction", async () => {
    const caller = evaluationRouter.createCaller({} as any);

    await expect(caller.extractFromCV({
      cvBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB",
      cvMimeType: "image/png",
    })).rejects.toMatchObject<Partial<TRPCError>>({ code: "BAD_REQUEST" });
  });
});
