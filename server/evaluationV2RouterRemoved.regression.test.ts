import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

/**
 * `evaluationV2` (server/routers/evaluationRouter.ts) exposait `create` en public, sans authentification ni
 * consentement, insérant dans la même table `evaluations` que le vrai parcours de validation administrateur —
 * sans CV, sans code dossier, sans limite de débit. Rien côté client ni serveur ne l'appelait : retiré.
 */
describe("evaluationV2 : routeur mort et dangereux retiré", () => {
  it("le fichier du routeur n'existe plus", () => {
    expect(existsSync(resolve(root, "server/routers/evaluationRouter.ts"))).toBe(false);
  });

  it("n'est plus monté dans l'appRouter", () => {
    const source = readFileSync(resolve(root, "server/routers.ts"), "utf8");
    // Vérifie le montage réel (`evaluationV2: …,`) et l'import du fichier, pas une simple mention en commentaire
    // expliquant le retrait (qui, elle, doit rester).
    expect(source).not.toMatch(/evaluationV2\s*:/);
    expect(source).not.toContain('from "./routers/evaluationRouter"');
  });
});
