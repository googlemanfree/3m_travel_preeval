import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock des modules externes
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        $returningId: vi.fn().mockResolvedValue([{ id: 1 }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./emailService", () => ({
  sendEvaluationReceptionEmail: vi.fn().mockResolvedValue(true),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("evaluation.submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("soumet une demande Schengen Étude avec succès", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluation.submit({
      fullName: "Jean Dupont",
      email: "jean@example.com",
      phone: "+237620996045",
      destinationCategory: "schengen",
      visaType: "schengen_etude",
      nationality: "Camerounaise",
      educationLevel: "bac5",
      employmentStatus: "etudiant",
      message: "Je souhaite faire un master en France",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("revue humaine");
  }, 15000);

  it("soumet une demande Canada RP avec CV", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluation.submit({
      fullName: "Marie Kamga",
      email: "marie@example.com",
      phone: "+237698104832",
      destinationCategory: "canada",
      visaType: "canada_rp",
      nationality: "Camerounaise",
      cvBase64: "data:application/pdf;base64,JVBERi0xLjQ=",
      cvFileName: "cv_marie.pdf",
      cvMimeType: "application/pdf",
    });

    expect(result.success).toBe(true);
  }, 15000);

  it("soumet une demande pour autre pays", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evaluation.submit({
      fullName: "Paul Nkomo",
      email: "paul@example.com",
      phone: "+237620000000",
      destinationCategory: "autre",
      destinationCountry: "États-Unis",
      visaType: "autre",
    });

    expect(result.success).toBe(true);
  }, 15000);

  it("rejette une demande avec email invalide", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.evaluation.submit({
        fullName: "Test User",
        email: "email-invalide",
        phone: "+237620996045",
        destinationCategory: "schengen",
        visaType: "schengen_tourisme",
      })
    ).rejects.toThrow();
  });

  it("rejette une demande sans nom", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.evaluation.submit({
        fullName: "",
        email: "test@example.com",
        phone: "+237620996045",
        destinationCategory: "canada",
        visaType: "canada_etude",
      })
    ).rejects.toThrow();
  });
});
