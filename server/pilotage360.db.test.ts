import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";

/**
 * Poste de pilotage 360 sur une base réelle : charge utile, résilience à une table absente, comptage des documents de la liste.
 * Exécuté seulement si BILAN_AUTO_TEST_DATABASE_URL pointe vers une base JETABLE ; lancer avec --no-file-parallelism.
 */
const URL = process.env.BILAN_AUTO_TEST_DATABASE_URL;

describe.skipIf(!URL)("pilotage 360 sur base réelle", () => {
  let ctx: any;
  const stamp = Date.now();
  beforeAll(async () => {
    process.env.DATABASE_URL = URL;
    const { getDb } = await import("./db");
    const db = (await getDb())!;
    const schema = await import("../drizzle/schema");
    const token = `perf-token-${stamp}-0123456789abcdef`;
    await db.insert(schema.adminAccounts).values({ email: `perf.${stamp}@example.test`, adminType: "evaluation", role: "admin", fullName: "Perf", status: "active", requiresPasswordChange: false, sessionToken: token, sessionExpiresAt: new Date(Date.now() + 3600_000) } as never);
    const [app] = await db.insert(schema.applications).values({ dossierNumber: `3M-P-${stamp}`, fullName: "Perf Test", email: `perf.cand.${stamp}@example.org`, whatsappNumber: "+237600000000", destination: "luxembourg", dossierStatus: "en_evaluation", visaType: "travail" } as never).$returningId();
    for (let n = 1; n <= 30; n += 1) await db.insert(schema.evaluationBilanVersions).values({ applicationId: app.id, versionNumber: n, contentJson: "x".repeat(30_000), reportHtml: "<p>long</p>".repeat(4000), createdByAdminAccountId: 1 } as never);
    for (let n = 0; n < 3; n += 1) await db.insert(schema.clientDocuments).values({ evaluationId: app.id, candidateEmail: `perf.cand.${stamp}@example.org`, documentType: "cv", documentName: `d${n}.pdf`, documentUrl: "https://f.test/x.pdf" } as never);
    const { appRouter } = await import("./routers");
    ctx = { db, schema, token, appId: app.id, caller: appRouter.createCaller({ req: { headers: {} }, res: {} } as never) };
  });
  afterAll(async () => {
    if (!ctx) return;
    await ctx.db.execute(sql.raw("RENAME TABLE evaluation_bilan_versions_hidden TO evaluation_bilan_versions")).catch(() => undefined);
    await ctx.db.delete(ctx.schema.evaluationBilanVersions).where(eq(ctx.schema.evaluationBilanVersions.applicationId, ctx.appId));
    await ctx.db.delete(ctx.schema.clientDocuments).where(eq(ctx.schema.clientDocuments.evaluationId, ctx.appId));
    await ctx.db.delete(ctx.schema.applications).where(eq(ctx.schema.applications.id, ctx.appId));
    await ctx.db.delete(ctx.schema.adminAccounts).where(eq(ctx.schema.adminAccounts.sessionToken, ctx.token));
  });

  it("la fiche 360 d'un dossier à 30 versions de bilan reste légère (avant : plusieurs Mo)", async () => {
    const result: any = await ctx.caller.admin.getCandidate360({ sessionToken: ctx.token, candidateId: `online_${ctx.appId}` });
    expect(result.evaluationVersions).toHaveLength(30);
    expect(Object.keys(result.evaluationVersions[0]).sort()).not.toEqual(expect.arrayContaining(["reportHtml"]));
    expect(result.evaluationVersions[0]).not.toHaveProperty("reportHtml");
    expect(result.evaluationVersions[0]).not.toHaveProperty("contentJson");
    expect(result.evaluationVersions[0]).toMatchObject({ versionNumber: 30, approvalStatus: expect.any(String) });
    expect(JSON.stringify(result).length).toBeLessThan(500_000);
  });

  it("une table facultative absente n'empêche plus d'ouvrir la fiche 360 (avant : erreur et fiche vide)", async () => {
    await ctx.db.execute(sql.raw("RENAME TABLE evaluation_bilan_versions TO evaluation_bilan_versions_hidden"));
    try {
      const result: any = await ctx.caller.admin.getCandidate360({ sessionToken: ctx.token, candidateId: `online_${ctx.appId}` });
      expect(result.evaluationVersions).toEqual([]);
      expect(result.operationalCase).toBeTruthy();
    } finally {
      await ctx.db.execute(sql.raw("RENAME TABLE evaluation_bilan_versions_hidden TO evaluation_bilan_versions"));
    }
  });

  it("la liste compte les documents dans la base et reste correcte avec la sélection de colonnes", async () => {
    const mod = await import("./routers/adminCandidateManagement");
    mod.resetCandidateRecordsShareForTests();
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({ req: { headers: { cookie: `admin_session=${ctx.token}` } }, res: {} } as never);
    const list: any = await caller.adminCandidateManagement.list({ search: `3M-P-${stamp}`, status: "all", paymentStatus: "all", scoreBand: "all", destination: "all", portraitStatus: "all", cvStatus: "all", sortBy: "createdAt", sortDirection: "desc", page: 1, pageSize: 25 });
    const row = list.candidates.find((candidate: any) => candidate.applicationNumber === `3M-P-${stamp}`);
    expect(row).toMatchObject({ fullName: "Perf Test", documentsCount: 3, destination: "luxembourg", cvReceived: false });
  });
});
