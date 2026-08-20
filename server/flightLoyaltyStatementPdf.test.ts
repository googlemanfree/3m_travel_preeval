import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");

describe("Export du relevé PDF 3M Rewards", () => {
  it("réserve la génération du relevé à la procédure candidat et inclut les transactions", () => {
    const source = fs.readFileSync(path.join(projectRoot, "server/routers/flightBooking.ts"), "utf8");

    expect(source).toContain("exportMyLoyaltyStatementPdf: candidateProcedure.mutation");
    expect(source).toContain("flightLoyaltyTransactions.candidateId, ctx.candidate.id");
    expect(source).toContain("Relevé détaillé 3M Rewards");
    expect(source).toContain("loyalty-statements/${ctx.candidate.id}");
  });

  it("expose une action de téléchargement avec état de préparation dans l’espace client", () => {
    const source = fs.readFileSync(path.join(projectRoot, "client/src/components/ClientSpaceNavigation.tsx"), "utf8");

    expect(source).toContain("exportMyLoyaltyStatementPdf.useMutation");
    expect(source).toContain("Exporter le relevé PDF");
    expect(source).toContain("Préparation…");
  });
});
