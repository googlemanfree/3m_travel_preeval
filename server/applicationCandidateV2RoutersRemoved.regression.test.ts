import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

/**
 * `applicationV2` (server/routers/applicationRouter.ts) exposait `getByDossierNumber`/`getByEmail` en public,
 * sans authentification, renvoyant la ligne complète de `applications` (données personnelles, statut de
 * paiement, notes internes) à quiconque connaissait un numéro de dossier ou un e-mail. `candidateV2`
 * (server/routers/candidateRouter.ts) avait le même défaut sur `getProfile`/`getFiles`/`getMessages`, protégés
 * seulement par `ctx.user.role` — un système d'authentification OAuth différent de `requireValidAdminSession`
 * utilisé partout ailleurs. Rien côté client ni serveur ne les appelait : les deux routeurs entiers ont été
 * retirés, comme `evaluationV2` l'avait été précédemment pour la même raison.
 */
describe("applicationV2 / candidateV2 : routeurs morts et dangereux retirés", () => {
  it("les fichiers des routeurs n'existent plus", () => {
    expect(existsSync(resolve(root, "server/routers/applicationRouter.ts"))).toBe(false);
    expect(existsSync(resolve(root, "server/routers/candidateRouter.ts"))).toBe(false);
  });

  it("ne sont plus montés dans l'appRouter", () => {
    const source = readFileSync(resolve(root, "server/routers.ts"), "utf8");
    // Vérifie le montage réel (`applicationV2: …,` / `candidateV2: …,`) et l'import du fichier, pas une simple
    // mention en commentaire expliquant le retrait (qui, elle, doit rester).
    expect(source).not.toMatch(/applicationV2\s*:/);
    expect(source).not.toMatch(/candidateV2\s*:/);
    expect(source).not.toContain('from "./routers/applicationRouter"');
    expect(source).not.toContain('from "./routers/candidateRouter"');
  });
});
