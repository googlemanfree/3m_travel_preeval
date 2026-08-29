import { describe, expect, it } from "vitest";
import { normalizeProgressStatus } from "../client/src/components/DossierProgressBar";

describe("dossier progress status normalization", () => {
  it.each([
    ["documents_requis", "en_attente_documents"],
    ["soumis", "soumis_agences"],
    ["en_cours", "en_evaluation"],
    ["recherche_employeur", "en_cours_recrutement"],
    ["validation_adem", "en_cours_recrutement"],
    ["approuve", "visa_approuve"],
  ] as const)("maps %s to a supported progress step", (status, expected) => {
    expect(normalizeProgressStatus(status)).toBe(expected);
  });

  it("keeps supported statuses unchanged", () => {
    expect(normalizeProgressStatus("en_attente_documents")).toBe("en_attente_documents");
    expect(normalizeProgressStatus("paye")).toBe("paye");
  });

  it("falls back safely for a status added by the server", () => {
    expect(normalizeProgressStatus("statut_inconnu" as string)).toBe("nouveau");
  });
});
