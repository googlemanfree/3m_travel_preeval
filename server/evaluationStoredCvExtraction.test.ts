import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cvService = vi.hoisted(() => ({
  extractTextFromPDF: vi.fn(),
  getPdfPageCount: vi.fn(),
  extractCVFieldsForForm: vi.fn(),
  extractCVFieldsFromImage: vi.fn(),
  generateAIEvaluationReport: vi.fn(),
}));
const loader = vi.hoisted(() => ({ loadStoredCvBuffer: vi.fn() }));
const auth = vi.hoisted(() => ({ requireValidAdminSession: vi.fn() }));

vi.mock("./aiEvaluationService", () => cvService);
vi.mock("./services/cvTextLoader", () => loader);
vi.mock("./routers/adminAuth", () => auth);

import { evaluationRouter } from "./routers/evaluation";

const pdf = Buffer.from("%PDF-1.4\nCV de démonstration\n%%EOF");
const input = { sessionToken: "session", documentUrl: "/manus-storage/cv/jean.pdf" };

beforeEach(() => {
  vi.clearAllMocks();
  auth.requireValidAdminSession.mockResolvedValue({ email: "admin@example.com" });
});

describe("evaluation.extractFromStoredCV (lecture du CV par le serveur)", () => {
  it("lit le CV enregistré côté serveur : le navigateur ne télécharge plus rien", async () => {
    loader.loadStoredCvBuffer.mockResolvedValue(pdf);
    cvService.getPdfPageCount.mockResolvedValue(2);
    cvService.extractTextFromPDF.mockResolvedValue("Licence en comptabilité, comptable depuis 2019.");
    cvService.extractCVFieldsForForm.mockResolvedValue({ diplomaTitle: "Licence", currentJobTitle: "Comptable" });

    const result = await evaluationRouter.createCaller({} as any).extractFromStoredCV(input);

    expect(loader.loadStoredCvBuffer).toHaveBeenCalledWith("/manus-storage/cv/jean.pdf");
    expect(result).toMatchObject({ success: true, source: "pdf", prefilledCount: 2 });
    expect(result.fields).toEqual({ diplomaTitle: "Licence", currentJobTitle: "Comptable" });
  });

  it("exige une session administrateur : sans elle, le CV n'est même pas téléchargé", async () => {
    auth.requireValidAdminSession.mockRejectedValue(new TRPCError({ code: "UNAUTHORIZED", message: "Session expirée" }));

    await expect(evaluationRouter.createCaller({} as any).extractFromStoredCV(input)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(loader.loadStoredCvBuffer).not.toHaveBeenCalled();
  });

  it("fichier introuvable : message clair, pas d'appel à l'IA", async () => {
    loader.loadStoredCvBuffer.mockResolvedValue(null);

    await expect(evaluationRouter.createCaller({} as any).extractFromStoredCV(input)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(cvService.extractCVFieldsForForm).not.toHaveBeenCalled();
  });

  it("un fichier qui n'est ni PDF ni image est refusé", async () => {
    loader.loadStoredCvBuffer.mockResolvedValue(Buffer.from("MZ\u0090 programme"));

    await expect(evaluationRouter.createCaller({} as any).extractFromStoredCV(input)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("PDF scanné sans texte : réponse explicite au lieu d'une erreur", async () => {
    loader.loadStoredCvBuffer.mockResolvedValue(pdf);
    cvService.getPdfPageCount.mockResolvedValue(1);
    cvService.extractTextFromPDF.mockResolvedValue("   ");

    const result = await evaluationRouter.createCaller({} as any).extractFromStoredCV(input);

    expect(result).toMatchObject({ success: false, prefilledCount: 0 });
    expect(cvService.extractCVFieldsForForm).not.toHaveBeenCalled();
  });

  it("CV en image PNG : lu par la reconnaissance d'image", async () => {
    loader.loadStoredCvBuffer.mockResolvedValue(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]));
    cvService.extractCVFieldsFromImage.mockResolvedValue({ currentJobTitle: "Infirmier" });

    const result = await evaluationRouter.createCaller({} as any).extractFromStoredCV(input);

    expect(result).toMatchObject({ success: true, source: "image", prefilledCount: 1 });
    expect(cvService.extractCVFieldsFromImage).toHaveBeenCalledWith(expect.stringMatching(/^data:image\/png;base64,/));
  });
});
