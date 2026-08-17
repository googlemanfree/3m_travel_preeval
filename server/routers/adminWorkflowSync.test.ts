import { describe, expect, it } from "vitest";
import { CANDIDATE360_LEGACY_STATUS_MAP, mapCandidate360Status } from "./admin";

describe("Candidate 360 workflow synchronisation", () => {
  it("maps the operational stages to online application statuses", () => {
    expect(mapCandidate360Status("qualifying", "online")).toBe("en_evaluation");
    expect(mapCandidate360Status("documents_review", "online")).toBe("en_attente_documents");
    expect(mapCandidate360Status("processing", "online")).toBe("en_cours_recrutement");
    expect(mapCandidate360Status("submitted", "online")).toBe("soumis_agences");
    expect(mapCandidate360Status("completed", "online")).toBe("visa_approuve");
  });

  it("maps the operational stages to agency dossier statuses", () => {
    expect(mapCandidate360Status("new", "agency")).toBe("nouveau");
    expect(mapCandidate360Status("documents_review", "agency")).toBe("documents_requis");
    expect(mapCandidate360Status("submitted", "agency")).toBe("soumis");
    expect(mapCandidate360Status("completed", "agency")).toBe("approuve");
    expect(mapCandidate360Status("rejected", "agency")).toBe("refuse");
  });

  it("keeps a client-facing label for every supported admin stage", () => {
    expect(Object.values(CANDIDATE360_LEGACY_STATUS_MAP).every((entry) => entry.label.length > 0)).toBe(true);
  });
});
