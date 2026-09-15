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

  it("ajoute les pièces propres au pays même hors des 5 destinations détaillées du catalogue d'évaluation", () => {
    // Royaume-Uni n'a pas d'entrée dans COUNTRY_REQUIREMENTS (evaluationDocumentCatalogue.ts) : la checklist
    // doit tout de même remonter la pièce propre à ce pays depuis procedures107Complete.ts (Certificate of Sponsorship).
    const states = deriveChecklistStates("Royaume-Uni", "travail", []);
    expect(states.some(({ requirement }) => requirement.label === "Certificat parrainage")).toBe(true);
    // Le socle générique par type de visa reste présent en plus de la spécificité pays.
    expect(states.some(({ requirement }) => requirement.label === "CV à jour")).toBe(true);
  });

  it("ne duplique pas une pièce déjà couverte par le socle générique ou la spécificité pays", () => {
    const states = deriveChecklistStates("Royaume-Uni", "travail", []);
    const passportEntries = states.filter(({ requirement }) => requirement.label.toLowerCase().includes("passeport"));
    expect(passportEntries).toHaveLength(1);
  });
});
