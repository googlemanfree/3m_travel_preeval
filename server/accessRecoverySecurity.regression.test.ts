import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("assistance de récupération d’accès", () => {
  it("n’effectue aucune modification automatique de compte depuis le formulaire public", () => {
    const router = read("server/routers/accessRecovery.ts");
    expect(router).toContain("submit: publicProcedure");
    expect(router).toContain("if (input.website) return { accepted: true }");
    expect(router).toContain("return { accepted: true }");
    expect(router).not.toContain("db.update(candidates)");
  });

  it("réserve la revue à une session administrateur et enregistre une trace dédiée", () => {
    const router = read("server/routers/accessRecovery.ts");
    expect(router).toContain("await requireValidAdminSession(input.sessionToken)");
    expect(router).toContain("identityVerifiedInPerson");
    expect(router).toContain("candidateAccessRecoveryEvents");
    expect(router).toContain("await db.insert(candidateAccessRecoveryEvents).values");
  });

  it("expose un formulaire sans documents et une route administration protégée", () => {
    const form = read("client/src/pages/AccessRecoveryRequest.tsx");
    const app = read("client/src/App.tsx");
    const prerender = read("server/publicPrerender.ts");
    expect(form).toContain("Ne transmettez pas de pièce d’identité");
    expect(form).not.toContain('type="file"');
    expect(app).toContain('path={"/assistance-acces"}');
    expect(app).toContain('path={"/admin/recuperation-acces"}');
    expect(prerender).toContain('"/assistance-acces"');
    expect(prerender).toContain("noindex: true");
  });
});
