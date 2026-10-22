import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { agencyDossiers, applications, candidateMessages, candidates, paymentReceiptApprovals } from "../drizzle/schema";
import { assessAccountPurge, purgeCandidateAccount } from "./services/purgeCandidateAccount";

type Rows = Map<unknown, unknown[]>;

function fakeDb(rows: Rows) {
  const deleted: unknown[] = [];
  const db = {
    select: () => ({ from: (table: unknown) => ({ where: () => ({ limit: async () => rows.get(table) ?? [] }) }) }),
    delete: (table: unknown) => ({ where: async () => { deleted.push(table); } }),
  };
  return { db: db as never, deleted };
}

const archived = { id: 7, email: "Candidat@Example.com", fullName: "Candidat Test", deletedAt: new Date() };

describe("suppression définitive d'un compte candidat", () => {
  it("refuse un compte qui n'est pas dans la corbeille", async () => {
    const { db } = fakeDb(new Map([[candidates, [{ ...archived, deletedAt: null }]]]));
    await expect(assessAccountPurge(db, 7, "candidat@example.com")).resolves.toMatchObject({ ok: false, code: "not_archived" });
  });

  it("refuse si l'adresse e-mail saisie ne correspond pas (casse ignorée sinon)", async () => {
    const { db } = fakeDb(new Map([[candidates, [archived]]]));
    await expect(assessAccountPurge(db, 7, "autre@example.com")).resolves.toMatchObject({ ok: false, code: "email_mismatch" });
    await expect(assessAccountPurge(db, 7, " candidat@EXAMPLE.com ")).resolves.toMatchObject({ ok: true, email: "Candidat@Example.com" });
  });

  it("refuse tout compte qui a un paiement validé (conservation comptable)", async () => {
    for (const table of [applications, agencyDossiers, paymentReceiptApprovals]) {
      const { db } = fakeDb(new Map<unknown, unknown[]>([[candidates, [archived]], [table, [{ id: 1 }]]]));
      await expect(assessAccountPurge(db, 7, "candidat@example.com")).resolves.toMatchObject({ ok: false, code: "paid_records" });
    }
  });

  it("signale un compte introuvable", async () => {
    const { db } = fakeDb(new Map());
    await expect(assessAccountPurge(db, 99, "x@example.com")).resolves.toMatchObject({ ok: false, code: "not_found" });
  });

  it("efface les données du compte puis le compte lui-même en dernier, sans toucher aux dossiers ni aux évaluations", async () => {
    const { db, deleted } = fakeDb(new Map());
    const { clearedTables } = await purgeCandidateAccount(db, 7);
    expect(clearedTables).toContain("candidate_messages");
    expect(deleted).toContain(candidateMessages);
    expect(deleted[deleted.length - 1]).toBe(candidates);
    expect(deleted).not.toContain(applications);
    expect(deleted).not.toContain(agencyDossiers);
  });

  it("la procédure est réservée au super administrateur, double confirmation, et tracée", () => {
    const source = readFileSync(resolve(import.meta.dirname, "routers/admin.ts"), "utf8");
    const block = source.slice(source.indexOf("purgeArchivedAccount: publicProcedure"), source.indexOf("listArchivedRecords: publicProcedure"));
    expect(block).toContain("requireSuperAdminSession");
    expect(block).toContain('z.literal("SUPPRIMER DEFINITIVEMENT")');
    expect(block).toContain("emailConfirmation");
    expect(block).toContain("candidate.account_purged");
  });
});
