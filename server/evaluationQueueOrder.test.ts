import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { sortBySubmission } from "../client/src/lib/evaluationQueue";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("page Évaluations : file des bilans par ordre de soumission", () => {
  it("classe du plus ancien au plus récent, puis par numéro, sans modifier la liste d'origine", () => {
    const input = [
      { id: 3, generatedAt: "2026-11-20T10:00:00Z" },
      { id: 1, generatedAt: "2026-11-22T08:00:00Z" },
      { id: 2, generatedAt: "2026-11-20T10:00:00Z" },
      { id: 4, generatedAt: new Date("2026-11-18T09:00:00Z") },
    ];
    expect(sortBySubmission(input).map((bilan) => bilan.id)).toEqual([4, 2, 3, 1]);
    expect(input.map((bilan) => bilan.id)).toEqual([3, 1, 2, 4]);
  });

  it("une date absente ou illisible passe en fin de file sans fausser l'ordre des autres", () => {
    const sorted = sortBySubmission([{ id: 9, generatedAt: null }, { id: 5, generatedAt: "pas une date" }, { id: 7, generatedAt: "2026-11-01T00:00:00Z" }, { id: 6, createdAt: "2026-11-05T00:00:00Z" }]);
    expect(sorted.map((bilan) => bilan.id)).toEqual([7, 6, 5, 9]);
  });

  it("la page affiche le rang et la date, et le serveur renvoie les bilans du plus ancien au plus récent", () => {
    const page = read("client/src/pages/AdminEvaluations.tsx");
    expect(page).toContain("sortBySubmission(bilans as any[])");
    expect(page).toContain('data-testid="queue-rank"');
    expect(page).toContain("N° · soumis le");
    const router = read("server/routers/admin.ts");
    expect(router).toContain("asc(bilans.generatedAt), asc(bilans.id)");
    expect(router).not.toMatch(/\.where\(eq\(bilans\.status, "draft"\)\)\s*\.orderBy\(desc\(bilans\.generatedAt\)\)/);
  });
});
