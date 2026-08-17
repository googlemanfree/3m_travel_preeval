import { describe, expect, it } from "vitest";
import { buildCandidateSpaceAccessUrl, buildEvaluationReportUrl } from "./candidateAccessLink";

describe("liens sécurisés de l’espace candidat", () => {
  it("dirige un dossier vers la connexion puis conserve la destination", () => {
    const url = buildCandidateSpaceAccessUrl("3M/2026 001");
    const parsed = new URL(url);

    expect(parsed.origin).toBe("https://www.3mtravelagency.com");
    expect(parsed.pathname).toBe("/login");
    expect(parsed.searchParams.get("redirect")).toBe("1");
    expect(parsed.searchParams.get("from")).toBe("/mon-espace?dossier=3M%2F2026%20001");
  });

  it("utilise l’origine canonique pour le rapport d’évaluation", () => {
    expect(buildEvaluationReportUrl("DOS-123")).toBe("https://www.3mtravelagency.com/api/dossier/DOS-123/report");
  });
});
