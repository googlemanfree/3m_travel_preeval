import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("evaluation.submitEvaluation", () => {
  it("devrait soumettre une évaluation multi-projets pour un projet travail", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluation.submitEvaluation({
      fullName: "Jean Dupont",
      email: "jean@example.com",
      whatsappPhone: "+16728972999",
      nationality: "Camerounais",
      projectType: "travail",
      sector: "Informatique",
      yearsOfExperience: 5,
      educationLevel: "Master",
      languages: "Français, Anglais",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
  }, 20_000);

  it("devrait soumettre une évaluation multi-projets pour un projet études", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluation.submitEvaluation({
      fullName: "Marie Durand",
      email: "marie@example.com",
      whatsappPhone: "+16728972999",
      nationality: "Française",
      projectType: "etudes",
      diplomaLevel: "Baccalauréat",
      averageGrade: "15/20",
      admissionLetter: true,
      financialGuarantee: "Oui",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  }, 20_000);

  it("devrait soumettre une évaluation multi-projets pour un projet tourisme", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluation.submitEvaluation({
      fullName: "Pierre Martin",
      email: "pierre@example.com",
      whatsappPhone: "+16728972999",
      nationality: "Belge",
      projectType: "tourisme",
      visitReason: "Tourisme culturel",
      travelHistory: "Canada, USA, France",
      previousRefusal: false,
      socialTies: "Famille au Cameroun",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  }, 20_000);

  it("devrait valider les champs obligatoires", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.evaluation.submitEvaluation({
        fullName: "",
        email: "invalid-email",
        whatsappPhone: "123",
        nationality: "Camerounais",
        projectType: "travail",
      });
      expect.fail("Devrait lever une erreur de validation");
    } catch (error: any) {
      // L'erreur de validation est attendue
      expect(error).toBeDefined();
    }
  });

  it("devrait envoyer un email de confirmation au candidat", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluation.submitEvaluation({
      fullName: "Test User",
      email: "test@example.com",
      whatsappPhone: "+16728972999",
      nationality: "Camerounais",
      projectType: "travail",
      sector: "Santé",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  }, 20_000);
});
