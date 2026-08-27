import { describe, expect, it } from "vitest";
import { buildDocumentClarificationMessage } from "../client/src/components/DossierDocumentChecklist";

describe("buildDocumentClarificationMessage", () => {
  it("associe la demande à la pièce sans inclure de donnée interne", () => {
    expect(buildDocumentClarificationMessage("Passeport valide", "Quel format est accepté ?")).toBe(
      "Demande de clarification — pièce : Passeport valide\n\nQuel format est accepté ?",
    );
  });

  it("utilise une question neutre et borne le contenu lorsque le candidat ne précise rien", () => {
    const message = buildDocumentClarificationMessage("  Attestation   employeur ", "");
    expect(message).toContain("Attestation employeur");
    expect(message).toContain("Pouvez-vous préciser ce qui est attendu");
    expect(message.length).toBeLessThanOrEqual(2_000);
  });
});
