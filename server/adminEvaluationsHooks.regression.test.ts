import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AdminEvaluations : règles des hooks", () => {
  it("appelle tous ses hooks avant les retours anticipés (sinon la page plante à la fin du chargement)", () => {
    const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/AdminEvaluations.tsx"), "utf8");
    const firstEarlyReturn = source.indexOf("if (isLoading) {");
    expect(firstEarlyReturn).toBeGreaterThan(0);
    const afterEarlyReturns = source.slice(firstEarlyReturn);
    expect(afterEarlyReturns).not.toMatch(/\buse(State|Effect|Memo|Callback|Ref)\(|\.use(Query|Mutation)\(/);
    expect(source.indexOf("sendEvaluationReminder.useMutation")).toBeLessThan(firstEarlyReturn);
  });
});
