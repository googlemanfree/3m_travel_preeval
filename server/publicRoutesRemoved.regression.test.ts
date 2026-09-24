import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

/**
 * Le numéro de dossier `3M-AAAA-NNNN` est énumérable (10 000 valeurs par an) : aucune procédure publique ne
 * doit s'en servir comme seule preuve d'identité, ni exposer d'adresse e-mail d'administrateur.
 */
describe("routes publiques retirées ou verrouillées", () => {
  it("evaluationComments : routeur et composant orphelin retirés, non montés", () => {
    expect(existsSync(resolve(root, "server/routers/evaluationComments.ts"))).toBe(false);
    expect(existsSync(resolve(root, "client/src/components/CommentsSection.tsx"))).toBe(false);
    const source = read("server/routers.ts");
    expect(source).not.toMatch(/evaluationComments\s*:/);
    expect(source).not.toContain('from "./routers/evaluationComments"');
  });

  it("evaluationAI.getBilan (bilan livré par numéro de dossier seul) a été retirée", () => {
    expect(read("server/routers/evaluationAI.ts")).not.toMatch(/\bgetBilan\s*:/);
  });

  it("application.retryAIReportSend exige une session administrateur valide", () => {
    const source = read("server/routers/application.ts");
    const start = source.indexOf("retryAIReportSend: publicProcedure");
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, start + 600);
    expect(body).toContain("sessionToken: z.string()");
    expect(body).toContain("await requireValidAdminSession(input.sessionToken)");
    // La page d'administration doit fournir le jeton, sinon la mutation échoue toujours.
    const page = read("client/src/pages/AdminEvaluation.tsx");
    expect(page).not.toMatch(/retryReportMutation\.mutate\(\{\s*reportId/);
  });
});
