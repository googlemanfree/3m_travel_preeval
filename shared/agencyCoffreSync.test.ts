import { describe, expect, it } from "vitest";
import { agencyCoffrePublishToastTone, agencyCoffreSyncUploadMessage } from "./agencyCoffreSync";

describe("agencyCoffreSync messages", () => {
  it("ne célèbre plus un dépôt sans coffre (no_case)", () => {
    const feedback = agencyCoffreSyncUploadMessage({
      publishedToClient: 0,
      updated: 0,
      reason: "no_case",
    });
    expect(feedback.tone).toBe("warning");
    expect(feedback.message).toMatch(/aucun dossier opérationnel/i);
    expect(feedback.message).not.toMatch(/synchronisé avec l’espace candidat/i);
  });

  it("confirme la publication réelle", () => {
    const feedback = agencyCoffreSyncUploadMessage({
      publishedToClient: 1,
      caseNumber: "3M-AGN-0007",
      reason: "ok",
    });
    expect(feedback.tone).toBe("success");
    expect(feedback.message).toContain("3M-AGN-0007");
  });

  it("signale un échec silencieux (reason absent, 0 publié)", () => {
    const feedback = agencyCoffreSyncUploadMessage({ publishedToClient: 0 });
    expect(feedback.tone).toBe("warning");
    expect(feedback.message).toMatch(/Publier vers l’espace client/);
  });

  it("toast publication : warning sur no_case, success sinon", () => {
    expect(agencyCoffrePublishToastTone("no_case")).toBe("warning");
    expect(agencyCoffrePublishToastTone("ok")).toBe("success");
    expect(agencyCoffrePublishToastTone("no_files")).toBe("info");
  });
});
