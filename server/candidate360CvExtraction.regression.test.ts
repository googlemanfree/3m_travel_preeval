import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspace = readFileSync(resolve(process.cwd(), "client/src/components/Candidate360Workspace.tsx"), "utf8");

describe("« Extraire les informations » du CV (fiche 360°)", () => {
  it("le serveur lit le CV : le navigateur ne le télécharge plus (« Failed to fetch »)", () => {
    // Avant : fetch(documentUrl, { credentials: "include" }) sur /manus-storage/…, qui redirige vers un lien signé d'un autre domaine,
    // refusé par le navigateur quand des cookies sont envoyés.
    expect(workspace).toContain("trpc.evaluation.extractFromStoredCV.useMutation");
    expect(workspace).toContain("cvExtractionMutation.mutate({ sessionToken, documentUrl: String(candidateCv.documentUrl) })");
    expect(workspace).not.toContain("credentials: \"include\", headers: { Accept: \"application/pdf");
    expect(workspace).not.toContain("btoa(binary)");
  });

  it("les champs proposés s'affichent avec des libellés français, pas des clés techniques", () => {
    expect(workspace).toContain("CV_FIELD_LABELS[key] ?? key");
    for (const key of ["educationLevel", "currentJobTitle", "yearsOfExperience", "frenchLevel", "languageTestsTaken"]) {
      expect(workspace).toContain(`${key}: "`);
    }
  });
});
