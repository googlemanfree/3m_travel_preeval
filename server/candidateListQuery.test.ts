import { describe, expect, it } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { queryCandidateList, resetCandidateListQueryForTests } from "./services/candidateListQuery";

/** Génération des requêtes de la liste (sans base) : ce qui part vers la base, et la résilience. */
const dialect = new MySqlDialect();
const base = { search: "", status: "all", paymentStatus: "all", scoreBand: "all", destination: "all", portraitStatus: "all", cvStatus: "all", sortBy: "createdAt", sortDirection: "desc", page: 1, pageSize: 25 } as const;

function fakeDb(handler?: (text: string) => Array<Record<string, unknown>> | Error) {
  const calls: Array<{ text: string; params: unknown[] }> = [];
  return {
    calls,
    execute: async (query: never) => {
      const built = dialect.sqlToQuery(query);
      const text = built.sql.replace(/\s+/g, " ");
      calls.push({ text, params: built.params });
      const out = handler?.(text) ?? [];
      if (out instanceof Error) throw out;
      return [out, []];
    },
  };
}

describe("liste des candidats : requêtes envoyées à la base", () => {
  it("n'envoie que des requêtes paramétrées (aucune saisie de l'utilisateur dans le texte SQL)", async () => {
    const db = fakeDb();
    await queryCandidateList(db, { ...base, search: "x'; DROP TABLE applications; --", destination: "canada' OR '1'='1" } as never);
    for (const call of db.calls) {
      expect(call.text).not.toMatch(/DROP TABLE/i);
      expect(call.text).not.toContain("OR '1'='1");
    }
    expect(db.calls.some((call) => call.params.some((param) => /drop table/i.test(String(param))))).toBe(true);
  });

  it("échappe les jokers de la recherche (% et _) pour qu'ils soient cherchés tels quels", async () => {
    const db = fakeDb();
    await queryCandidateList(db, { ...base, search: "100%_a\\b" } as never);
    const like = db.calls.flatMap((call) => call.params).find((param) => typeof param === "string" && param.startsWith("%100"));
    expect(like).toBe("%100\\%\\_a\\\\b%");
  });

  it("ne trie jamais sur une constante (« ORDER BY 0 » serait lu comme un numéro de colonne)", async () => {
    const db = fakeDb((text) => (text.includes("COUNT(*)") ? [{ st: "nouveau", pay: "non_paye", n: 1, cv: 0, todo: 0 }] : []));
    await queryCandidateList(db, { ...base, sortBy: "score" } as never);
    for (const call of db.calls) expect(call.text).not.toMatch(/ORDER BY 0\b/);
  });

  it("ne lit qu'une fenêtre de lignes (page × taille) par source, jamais toute la table", async () => {
    const db = fakeDb((text) => (text.includes("COUNT(*)") ? [{ st: "nouveau", pay: "non_paye", n: 500, cv: 0, todo: 0 }] : []));
    await queryCandidateList(db, { ...base, page: 3, pageSize: 25 } as never);
    const pageQueries = db.calls.filter((call) => / LIMIT \?$/.test(call.text) && !call.text.includes("COUNT(*)"));
    expect(pageQueries.length).toBeGreaterThan(0);
    for (const call of pageQueries) expect(call.params[call.params.length - 1]).toBe(75);
  });

  it("ramène une page trop lointaine à la dernière page existante", async () => {
    const db = fakeDb((text) => (text.includes("COUNT(*)") ? [{ st: "nouveau", pay: "non_paye", n: 30, cv: 0, todo: 0 }] : []));
    const result = await queryCandidateList(db, { ...base, page: 99, pageSize: 25 } as never);
    expect(result.page).toBe(result.totalPages);
    expect(result.totalPages).toBe(Math.ceil(90 / 25)); // 30 par source
  });

  it("compte par étape à partir des statuts bruts, les statuts vides ou inconnus allant dans « nouveau »", async () => {
    const db = fakeDb((text) => (text.includes("COUNT(*)") && text.includes("FROM applications s") ? [
      { st: "paye", pay: "paye", n: 4, cv: 1, todo: 1 }, { st: null, pay: "non_paye", n: 2, cv: 0, todo: 0 }, { st: "statut_inconnu", pay: "non_paye", n: 1, cv: 0, todo: 0 },
    ] : []));
    const { stats } = await queryCandidateList(db, base as never);
    expect(stats.stageCounts.documents).toBe(4);
    expect(stats.stageCounts.nouveau).toBe(3);
    expect(stats.paidCount).toBe(4);
    expect(stats.scopeTotal).toBe(7);
    expect(stats.cvReceivedCount).toBe(1);
    expect(stats.withoutDossierCount).toBe(0);
  });

  it("retente sans le « bilan publié » quand la table du parcours de validation n'existe pas, puis s'en souvient", async () => {
    resetCandidateListQueryForTests();
    const missing = new Error("Table 'x.evaluation_validation_cases' doesn't exist");
    const db = fakeDb((text) => (text.includes("evaluation_validation_cases") ? missing : []));
    await expect(queryCandidateList(db, base as never)).resolves.toMatchObject({ total: 0 });
    const withTable = db.calls.filter((call) => call.text.includes("evaluation_validation_cases")).length;
    expect(withTable).toBeGreaterThan(0);
    const before = db.calls.length;
    await queryCandidateList(db, base as never);
    expect(db.calls.slice(before).some((call) => call.text.includes("evaluation_validation_cases"))).toBe(false);
    resetCandidateListQueryForTests();
  });

  it("laisse remonter les autres erreurs de la base au lieu de les masquer", async () => {
    resetCandidateListQueryForTests();
    const db = fakeDb(() => new Error("Connection lost"));
    await expect(queryCandidateList(db, base as never)).rejects.toThrow("Connection lost");
  });
});
