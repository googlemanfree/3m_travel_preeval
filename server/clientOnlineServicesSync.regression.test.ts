import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("sync services en ligne → espace client", () => {
  it("expose consultations, traductions et digital dans EvaluationSpace", () => {
    const source = readFileSync(
      path.resolve(import.meta.dirname, "../client/src/pages/EvaluationSpace.tsx"),
      "utf8",
    );
    expect(source).toContain("consultationRequest.getMyConsultations");
    expect(source).toContain("translation.getMyRequests");
    expect(source).toContain("caseTracking.getMyDigitalRequests");
    expect(source).toContain("client-online-services-sync");
    expect(source).toContain("Mes consultations");
    expect(source).toContain("Mes traductions");
    expect(source).toContain("Mes demandes 3M Solutions");
  });

  it("définit getMyRequests côté traduction et getMyDigitalRequests côté caseTracking", () => {
    const translation = readFileSync(
      path.resolve(import.meta.dirname, "./routers/translation.ts"),
      "utf8",
    );
    const caseTracking = readFileSync(
      path.resolve(import.meta.dirname, "./routers/caseTracking.ts"),
      "utf8",
    );
    expect(translation).toContain("getMyRequests: candidateProcedure");
    expect(caseTracking).toContain("getMyDigitalRequests: candidateProcedure");
  });
});
