import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r/g, "");

describe("anciennes routes /api/documents/* sans authentification", () => {
  it("ne sont plus montées sur le serveur", () => {
    const index = read("server/_core/index.ts");
    expect(index).not.toMatch(/import\s*\{\s*setupDocumentsRoutes\s*\}/);
    expect(index).not.toMatch(/^\s*setupDocumentsRoutes\(app\);/m);
  });

  it("aucun écran du site n'appelle ces routes (envoi, lecture, liste, suppression par code de dossier)", () => {
    const { spawnSync } = require("node:child_process") as typeof import("node:child_process");
    const result = spawnSync("git", ["grep", "-n", "-E", "api/documents/(upload-multiple|download/|list/|delete/|upload[\"'`])", "--", "client/src"], { cwd: resolve(import.meta.dirname, ".."), encoding: "utf8" });
    // Code de sortie 1 = aucune occurrence.
    expect(result.status).toBe(1);
  });

  it("toute route montée qui dépose une pièce exige une authentification ou une session (garde-fou de lecture)", () => {
    const index = read("server/_core/index.ts");
    for (const name of ["registerCandidateUploadRoute", "registerAgencyDossierUploadRoute", "registerOpeningPaymentProofUploadRoute"]) {
      expect(index).toContain(`${name}(app);`);
    }
  });
});
