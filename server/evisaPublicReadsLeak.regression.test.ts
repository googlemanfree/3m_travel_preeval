import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "server/routers/evisaRouter.ts"), "utf8");

const procedureBody = (name: string, procedureKind: string) => {
  const start = source.indexOf(`${name}: ${procedureKind}`);
  expect(start, `${name} : ${procedureKind} introuvable`).toBeGreaterThan(-1);
  return source.slice(start, source.indexOf("\n    }),", start));
};

/**
 * Une adresse e-mail n'est pas une preuve d'identité : les lectures e-Visa publiques par e-mail livraient
 * passeport, date de naissance, téléphone et brouillons complets à quiconque connaissait l'adresse.
 */
describe("evisa : lectures par e-mail", () => {
  it("getMyEvisaRequests exige un candidat connecté, lit son propre e-mail et liste ses colonnes", () => {
    const body = procedureBody("getMyEvisaRequests", "candidateProcedure");
    expect(body).toContain("ctx.candidate.email");
    expect(body).not.toContain("input.email");
    expect(body).not.toMatch(/SELECT\s+\*/i);
    for (const sensitive of ["passportFile", "dateOfBirth", "phone", "adminNotes", "notes"]) {
      expect(body, sensitive).not.toMatch(new RegExp(`\\b${sensitive}\\b`));
    }
  });

  it("l'espace client n'envoie plus d'e-mail à getMyEvisaRequests", () => {
    const page = readFileSync(resolve(root, "client/src/pages/EvaluationSpace.tsx"), "utf8");
    expect(page).not.toMatch(/getMyEvisaRequests\.useQuery\(\s*\{\s*email/);
  });

  it("getCloudDraft ne renvoie jamais le contenu du brouillon", () => {
    const body = procedureBody("getCloudDraft", "publicProcedure");
    expect(body).not.toMatch(/SELECT[^`]*draftData/i);
    expect(body).not.toContain("JSON.parse");
    expect(body).toContain("synced: true");
  });

  it("saveCloudDraft borne la taille du brouillon", () => {
    const body = procedureBody("saveCloudDraft", "publicProcedure");
    expect(body).toContain("JSON.stringify(value ?? null).length <= 50_000");
  });
});
