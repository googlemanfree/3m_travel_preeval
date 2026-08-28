import { describe, expect, it } from "vitest";
import { buildApiNotFoundPayload } from "./_core/apiJsonContract";

describe("contrat JSON des routes tRPC", () => {
  it("retourne une erreur JSON structurée pour un chemin inconnu", () => {
    const payload = buildApiNotFoundPayload("/unknownProcedure");
    expect(payload).toEqual({
      error: {
        message: "Procédure API introuvable",
        code: "NOT_FOUND",
        path: "/unknownProcedure",
      },
    });
    expect(JSON.stringify(payload)).not.toContain("<!doctype");
  });
});
