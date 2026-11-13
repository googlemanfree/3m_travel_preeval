import { describe, expect, it } from "vitest";
import { cvAnalysisConsented, withCvAnalysisConsent } from "./services/cvTextLoader";

const NOW = new Date("2026-11-13T10:00:00Z");

describe("accord donné depuis l'espace candidat", () => {
  it("enregistre l'accord avec date et origine, et il est reconnu par la lecture du CV", () => {
    const json = withCvAnalysisConsent(null, NOW);
    expect(cvAnalysisConsented({ projectDetailsJson: json })).toBe(true);
    expect(JSON.parse(json)).toMatchObject({ preparatoryCvAnalysisConsent: true, preparatoryCvAnalysisConsentSource: "espace_candidat", preparatoryCvAnalysisConsentRecordedAt: NOW.toISOString() });
  });
  it("conserve les autres informations du projet et la date du consentement général déjà donné", () => {
    const before = JSON.stringify({ programId: "work_qualified", sector: "Santé", preparatoryAnalysisConsentRecordedAt: "2026-10-01T00:00:00.000Z" });
    const after = JSON.parse(withCvAnalysisConsent(before, NOW));
    expect(after).toMatchObject({ programId: "work_qualified", sector: "Santé", preparatoryAnalysisConsentRecordedAt: "2026-10-01T00:00:00.000Z" });
  });
  it("tolère un JSON illisible sans perdre l'accord", () => {
    expect(cvAnalysisConsented({ projectDetailsJson: withCvAnalysisConsent("{pas du json", NOW) })).toBe(true);
  });
  it("sans accord enregistré, le CV n'est pas lu", () => {
    expect(cvAnalysisConsented({ projectDetailsJson: JSON.stringify({ preparatoryAnalysisConsent: true }) })).toBe(false);
    expect(cvAnalysisConsented({ projectDetailsJson: null })).toBe(false);
  });
});
