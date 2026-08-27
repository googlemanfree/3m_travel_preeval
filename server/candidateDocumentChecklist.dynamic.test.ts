import { describe, expect, it } from "vitest";
import { deriveChecklistStates } from "../client/src/components/DossierDocumentChecklist";

describe("checklist documentaire dynamique candidate", () => {
  it("adapte les pièces au projet de travail Canada et conserve les pièces absentes", () => {
    const states = deriveChecklistStates("Canada", "travail", [{ documentType: "cv", documentName: "cv.pdf", status: "uploaded" }]);
    expect(states.some(({ requirement }) => requirement.label === "CV à jour")).toBe(true);
    expect(states.find(({ requirement }) => requirement.label === "CV à jour")?.state.kind).toBe("received");
    expect(states.find(({ requirement }) => requirement.label.includes("Passeport"))?.state.kind).toBe("missing");
  });

  it("distingue les pièces rejetées des pièces validées sans révéler de note interne", () => {
    const states = deriveChecklistStates("France", "etudes", [
      { documentType: "passport", documentName: "passport.pdf", verificationStatus: "verified" },
      { documentType: "diploma", documentName: "diplome.pdf", verificationStatus: "rejected" },
    ]);
    expect(states.find(({ requirement }) => requirement.label.includes("Passeport"))?.state.kind).toBe("verified");
    expect(states.find(({ requirement }) => requirement.label.includes("Diplômes"))?.state.kind).toBe("replace");
  });
});
