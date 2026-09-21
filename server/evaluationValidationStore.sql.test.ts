import { getTableColumns } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { describe, expect, it } from "vitest";
import { evaluationValidationCases } from "../drizzle/schema";
import { DrizzleValidationStore } from "./services/evaluationValidationStore";

/**
 * Rejoue le VRAI code du store contre un faux client mysql2 qui enregistre les requêtes : il ne prouve
 * pas le comportement du verrou MySQL, mais fige l'ordre des instructions, le refus quand le statut a
 * changé, et l'écriture des effets (historique, audit, miroir hérité) dans la même transaction.
 */

const CASE_COLUMNS = Object.keys(getTableColumns(evaluationValidationCases));
const TS = "2026-09-21 09:00:00";

function caseRow(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = { id: 5, evaluationId: 1, versionNumber: 1, workflowStatus: "en_revue_admin", createdAt: TS, updatedAt: TS, ...overrides };
  return CASE_COLUMNS.map((name) => (name in values ? values[name] : null));
}

type Call = { sql: string; params: unknown[] };

function fakeClient(options: { locked?: unknown[] | null; fresh?: unknown[] | null; failOn?: RegExp; error?: unknown } = {}) {
  const calls: Call[] = [];
  let selectsOnCases = 0;
  const client = {
    async query(query: { sql: string }, params: unknown[]) {
      const sql = query.sql;
      calls.push({ sql, params });
      if (options.failOn?.test(sql)) throw options.error;
      if (/^select .* from `evaluation_validation_cases`/i.test(sql)) {
        selectsOnCases += 1;
        const row = /for update/i.test(sql) ? options.locked : (options.fresh ?? options.locked);
        return [row ? [row] : [], []];
      }
      return [{ affectedRows: 1, insertId: 42 }, []];
    },
  };
  return { client, calls, selectsOnCases: () => selectsOnCases };
}

const storeFor = (client: unknown) => new DrizzleValidationStore(drizzle(client as never));
const statements = (calls: Call[]) => calls.map((call) => call.sql.replace(/\s+/g, " ").trim().toLowerCase());

describe("store Drizzle : compare-and-set sous transaction", () => {
  it("verrouille la ligne, met à jour, écrit les effets dans la même transaction et valide", async () => {
    const fake = fakeClient({ locked: caseRow(), fresh: caseRow({ workflowStatus: "validee_publiee" }) });
    const publishedAt = new Date("2026-09-21T09:00:00.000Z");
    const updated = await storeFor(fake.client).updateCaseIf(
      5,
      "en_revue_admin",
      { workflowStatus: "validee_publiee", publishedBy: "admin@3m.test", publishedAt },
      {
        changes: { adminEmail: "admin@3m.test", rows: [{ field: "profileSummary", oldValue: "avant", newValue: "après" }] },
        audit: { adminEmail: "admin@3m.test", action: "structured_publish", note: "Score 74/100" },
        legacyPublication: { publishedBy: "admin@3m.test", publishedAt, reportText: "Rapport texte", secondValidatedBy: null },
      },
    );
    expect(updated?.workflowStatus).toBe("validee_publiee");

    const sql = statements(fake.calls);
    expect(sql[0]).toBe("begin");
    expect(sql[1]).toMatch(/^select .* from `evaluation_validation_cases` where .*`id` = \? limit \? for update$/);
    const order = ["update `evaluation_validation_cases` set", "insert into `evaluation_validation_changes`", "insert into `evaluation_review_events`", "update `evaluations` set"].map((prefix) => sql.findIndex((statement) => statement.startsWith(prefix)));
    expect(order.every((index) => index > 1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(sql.at(-1)).toBe("commit");
    expect(sql).not.toContain("rollback");

    const update = fake.calls.find((call) => call.sql.startsWith("update `evaluation_validation_cases`"))!;
    expect(update.sql).toContain("`workflowStatus` = ?");
    expect(update.params).toEqual(expect.arrayContaining(["validee_publiee", "admin@3m.test"]));
    const legacy = fake.calls.find((call) => call.sql.startsWith("update `evaluations`"))!;
    expect(legacy.sql).toMatch(/`status` = \?.*`reviewDraft` = \?.*`finalResponseSentAt` = \?/);
    expect(legacy.params).toEqual(expect.arrayContaining(["reviewed", "Rapport texte"]));
    const audit = fake.calls.find((call) => call.sql.startsWith("insert into `evaluation_review_events`"))!;
    expect(audit.params).toEqual(expect.arrayContaining(["structured_publish", "Score 74/100"]));
    const changes = fake.calls.find((call) => call.sql.startsWith("insert into `evaluation_validation_changes`"))!;
    expect(changes.params).toEqual(expect.arrayContaining(["profileSummary", '"avant"', '"après"']));
  });

  it("refuse (null) sans rien écrire quand le statut n'est plus celui attendu", async () => {
    const fake = fakeClient({ locked: caseRow({ workflowStatus: "validee_publiee" }) });
    const result = await storeFor(fake.client).updateCaseIf(5, "en_revue_admin", { workflowStatus: "validee_publiee" }, { audit: { adminEmail: "a@3m.test", action: "structured_publish" }, legacyPublication: { publishedBy: "a@3m.test", publishedAt: new Date(), reportText: "x", secondValidatedBy: null } });
    expect(result).toBeNull();
    const sql = statements(fake.calls);
    expect(sql.some((statement) => statement.startsWith("update "))).toBe(false);
    expect(sql.some((statement) => statement.startsWith("insert "))).toBe(false);
  });

  it("renvoie null quand la ligne n'existe plus", async () => {
    const fake = fakeClient({ locked: null });
    expect(await storeFor(fake.client).updateCaseIf(5, "en_revue_admin", { emailError: "x" })).toBeNull();
    expect(statements(fake.calls).some((statement) => statement.startsWith("update "))).toBe(false);
  });

  it("annule la transaction et propage l'erreur si un effet échoue (pas d'état à moitié écrit)", async () => {
    const fake = fakeClient({ locked: caseRow(), failOn: /^update `evaluations`/, error: new Error("connexion perdue") });
    const publishedAt = new Date();
    await expect(
      storeFor(fake.client).updateCaseIf(5, "en_revue_admin", { workflowStatus: "validee_publiee" }, { legacyPublication: { publishedBy: "a@3m.test", publishedAt, reportText: "x", secondValidatedBy: null } }),
    ).rejects.toMatchObject({ cause: { message: "connexion perdue" } }); // Drizzle enveloppe l'erreur d'origine dans `cause`
    const sql = statements(fake.calls);
    expect(sql.at(-1)).toBe("rollback");
    expect(sql).not.toContain("commit");
  });

  it("écrit le miroir hérité avec la seconde validation quand il y en a une", async () => {
    const fake = fakeClient({ locked: caseRow() });
    const publishedAt = new Date("2026-09-21T09:00:00.000Z");
    await storeFor(fake.client).updateCaseIf(5, "en_revue_admin", { workflowStatus: "validee_publiee" }, { legacyPublication: { publishedBy: "b@3m.test", publishedAt, reportText: "x", secondValidatedBy: "b@3m.test" } });
    const legacy = fake.calls.find((call) => call.sql.startsWith("update `evaluations`"))!;
    expect(legacy.params).toEqual(expect.arrayContaining([true, "b@3m.test"]));
  });
});

describe("store Drizzle : insertion d'une version", () => {
  it("insère la version et ses effets, puis valide", async () => {
    const fake = fakeClient({ locked: caseRow({ id: 42, versionNumber: 2, workflowStatus: "en_revue_admin" }) });
    const created = await storeFor(fake.client).insertCase({ evaluationId: 1, versionNumber: 2, workflowStatus: "en_revue_admin" }, { audit: { adminEmail: "a@3m.test", action: "structured_reevaluation", note: "motif" } });
    expect(created).toMatchObject({ id: 42, versionNumber: 2 });
    const sql = statements(fake.calls);
    expect(sql[0]).toBe("begin");
    expect(sql[1]).toMatch(/^insert into `evaluation_validation_cases`/);
    expect(sql.some((statement) => statement.startsWith("insert into `evaluation_review_events`"))).toBe(true);
    expect(sql.at(-1)).toBe("commit");
  });

  it("renvoie null (au lieu de lever) quand la version existe déjà : la requête concurrente a gagné", async () => {
    const fake = fakeClient({ failOn: /^insert into `evaluation_validation_cases`/, error: Object.assign(new Error("Duplicate entry"), { code: "ER_DUP_ENTRY", errno: 1062 }) });
    expect(await storeFor(fake.client).insertCase({ evaluationId: 1, versionNumber: 1, workflowStatus: "dossier_recu" })).toBeNull();
    expect(statements(fake.calls).at(-1)).toBe("rollback");
  });

  it("propage toute autre erreur d'insertion", async () => {
    const fake = fakeClient({ failOn: /^insert into `evaluation_validation_cases`/, error: new Error("disque plein") });
    await expect(storeFor(fake.client).insertCase({ evaluationId: 1, versionNumber: 1, workflowStatus: "dossier_recu" })).rejects.toMatchObject({ cause: { message: "disque plein" } });
  });
});
