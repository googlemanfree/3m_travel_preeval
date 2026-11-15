import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inArray, like, sql } from "drizzle-orm";

/**
 * Écrans d'administration : les versions « en lot » rendent exactement ce que rendaient les lectures une par une.
 * Exécuté seulement si BILAN_AUTO_TEST_DATABASE_URL pointe vers une base JETABLE ; lancer avec --no-file-parallelism.
 */
const URL = process.env.BILAN_AUTO_TEST_DATABASE_URL;

describe.skipIf(!URL)("écrans d'administration : lecture en lot = lecture une par une", () => {
  let ctx: any;
  const stamp = String(Date.now()).slice(-9);
  const mail = (name: string) => `zp${stamp}.${name}@example.org`;

  beforeAll(async () => {
    process.env.DATABASE_URL = URL;
    const { getDb } = await import("./db");
    const db = (await getDb())!;
    const s = await import("../drizzle/schema");
    const ids: number[] = [];
    for (let n = 0; n < 8; n += 1) {
      const [row] = await db.insert(s.evaluations).values({ fullName: `Zp ${n}`, email: mail(`e${n}`), phone: "+1", destinationCategory: "canada", visaType: n % 2 ? "canada_travail" : "canada_etude", projectType: n % 3 ? "travail" : null, cvFileUrl: n % 2 ? "https://f.test/cv.pdf" : null, cvFileName: n % 2 ? "cv.pdf" : null } as never).$returningId();
      ids.push(row.id);
      for (let d = 0; d < n % 4; d += 1) await db.insert(s.clientDocuments).values({ evaluationId: row.id, candidateEmail: mail(`e${n}`), documentType: d % 2 ? "passport" : "diploma", documentName: `d${d}.pdf`, documentUrl: "https://f.test/x.pdf" } as never);
    }
    const accounts: number[] = [];
    for (let n = 0; n < 5; n += 1) {
      const [row] = await db.insert(s.candidates).values({ fullName: `Zp Compte ${n}`, email: mail(`c${n}`), passwordHash: "x", dossierStatus: "nouveau" } as never).$returningId();
      accounts.push(row.id);
    }
    // enregistrements de paiement : valide, illisible, absent
    await db.insert(s.agencySettings).values({ settingKey: `opening_payment:${accounts[0]}`, settingValue: JSON.stringify({ candidateId: accounts[0], validatedAt: "2026-01-01", validatedBy: "x", reference: "REF123456" }) } as never);
    await db.insert(s.agencySettings).values({ settingKey: `opening_payment:${accounts[1]}`, settingValue: "{pas du json" } as never);
    ctx = { db, s, ids, accounts };
  });

  afterAll(async () => {
    if (!ctx) return;
    const { db, s, ids, accounts } = ctx;
    await db.delete(s.clientDocuments).where(inArray(s.clientDocuments.evaluationId, ids));
    await db.delete(s.evaluations).where(inArray(s.evaluations.id, ids));
    await db.delete(s.agencySettings).where(inArray(s.agencySettings.settingKey, accounts.map((id: number) => `opening_payment:${id}`)));
    await db.delete(s.candidates).where(like(s.candidates.email, `zp${stamp}.%`));
  });

  it("l'aperçu des documents donne, pour chaque évaluation, la même liste de pièces et de points que la lecture unitaire", async () => {
    const store = await import("./services/documentIntakeStore");
    const { overview, checklistFor_ } = store;
    const result = await overview(ctx.db, "tous", `zp${stamp}`);
    expect(result.rows.length).toBe(8);
    for (const row of result.rows) {
      const single = await checklistFor_(ctx.db, row.evaluationId);
      expect(row.projectKind).toBe(single!.projectKind);
      expect(row.uncontrolled).toBe(single!.documents.filter((doc: any) => !doc.intake).length);
      expect(row.summary).toEqual((await import("../shared/documentChecklist")).checklistSummary(single!.items));
    }
  });

  it("les compteurs de l'aperçu couvrent toutes les évaluations lues, même quand un filtre réduit les lignes", async () => {
    const { overview } = await import("./services/documentIntakeStore");
    const all = await overview(ctx.db, "tous", undefined);
    const filtered = await overview(ctx.db, "manquant", undefined);
    expect(filtered.counts).toEqual(all.counts);
    expect(filtered.rows.length).toBeLessThanOrEqual(all.rows.length);
  });

  it("la lecture des paiements d'ouverture en lot rend la même chose que la lecture d'un compte à la fois", async () => {
    const { getOpeningPaymentRecords } = await import("./routers/adminCandidateManagement");
    const map = await getOpeningPaymentRecords(ctx.db, ctx.accounts);
    expect(map.size).toBe(ctx.accounts.length);
    expect(map.get(ctx.accounts[0])).toMatchObject({ candidateId: ctx.accounts[0], validatedBy: "x" });
    expect(map.get(ctx.accounts[1])).toBeNull(); // illisible = aucun
    for (const id of ctx.accounts.slice(2)) expect(map.get(id)).toBeNull();
    expect((await getOpeningPaymentRecords(ctx.db, [])).size).toBe(0);
  });

  it("la liste des comptes sans évaluation est paginée et annonce s'il en reste", async () => {
    const { appRouter } = await import("./routers");
    const token = `zp-token-${stamp}-0123456789abcdef0123456789`;
    const { db, s } = ctx;
    await db.insert(s.adminAccounts).values({ email: `zp.${stamp}@example.test`, adminType: "evaluation", role: "admin", fullName: "Zp", status: "active", requiresPasswordChange: false, sessionToken: token, sessionExpiresAt: new Date(Date.now() + 3_600_000) } as never);
    try {
      const caller: any = appRouter.createCaller({ req: { headers: { cookie: `admin_session=${token}` } }, res: {} } as never);
      const page = await caller.adminCandidateManagement.listCandidatesWithoutEvaluation({ sessionToken: token, search: `zp${stamp}.c`, limit: 2 });
      expect(page.total).toBe(5);
      expect(page.candidates).toHaveLength(2);
      expect(page.hasMore).toBe(true);
      const all = await caller.adminCandidateManagement.listCandidatesWithoutEvaluation({ sessionToken: token, search: `zp${stamp}.c`, limit: 50 });
      expect(all.candidates).toHaveLength(5);
      expect(all.hasMore).toBe(false);
      expect(all.candidates[0].draft.subject).toBeTruthy();
    } finally {
      await db.delete(s.adminAccounts).where(sql`${s.adminAccounts.sessionToken} = ${token}`);
    }
  });
});
