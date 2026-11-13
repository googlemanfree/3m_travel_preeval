import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray, sql } from "drizzle-orm";

/**
 * Audit, correction en lot et annulation sur une base MySQL réelle (schéma complet). Exécuté seulement si BILAN_AUTO_TEST_DATABASE_URL pointe
 * vers une base JETABLE ; partage la base avec les tests du bilan automatisé : lancer avec --no-file-parallelism.
 */
const URL = process.env.BILAN_AUTO_TEST_DATABASE_URL;

describe.skipIf(!URL)("cohérence des données sur base réelle", () => {
  let ctx: any;
  const ids: number[] = [];
  beforeAll(async () => {
    process.env.DATABASE_URL = URL;
    const { getDb } = await import("./db");
    const db = (await getDb())!;
    const schema = await import("../drizzle/schema");
    const base = { fullName: "Test Cohérence", phone: "+237600000000", destinationCategory: "autre", visaType: "autre", projectType: "travail" } as const;
    const stamp = Date.now();
    const rows = [
      { ...base, email: `it.${stamp}@example.org`, destinationCountry: "italie", referenceCode: `COH-${stamp}-1` },
      { ...base, email: `lu.${stamp}@example.org`, destinationCountry: "Luxembourg", destinationCategory: "schengen", visaType: "schengen_travail", referenceCode: `COH-${stamp}-2` },
      { ...base, email: `xx.${stamp}@example.org`, destinationCountry: "Atlantide", referenceCode: `COH-${stamp}-3` },
    ];
    for (const row of rows) { const [r] = await db.insert(schema.evaluations).values(row as never).$returningId(); ids.push(r.id); }
    ctx = { db, schema, service: await import("./services/dataCoherenceAudit") };
    await ctx.service.ensureCoherenceLogTable(db);
    await db.execute(sql.raw("DELETE FROM data_coherence_log"));
  });
  afterAll(async () => { if (ctx && ids.length) await ctx.db.delete(ctx.schema.evaluations).where(inArray(ctx.schema.evaluations.id, ids)); });

  it("le rapport signale les anomalies sans rien modifier", async () => {
    const report = await ctx.service.buildAuditReport(ctx.db);
    const codes = report.byCode.map((entry: any) => entry.code);
    expect(codes).toEqual(expect.arrayContaining(["ZONE_INCOHERENTE", "PAYS_ORTHOGRAPHE", "PAYS_NON_RECONNU"]));
    const [row] = await ctx.db.select().from(ctx.schema.evaluations).where(eq(ctx.schema.evaluations.id, ids[0]));
    expect(row.destinationCountry).toBe("italie"); // lecture seule
  });

  it("corrige en lot (pays, zone, visa), journalise, refuse un aperçu périmé, puis annule sans écraser une modification ultérieure", async () => {
    const preview = await ctx.service.previewFixes(ctx.db);
    const mine = preview.shown.filter((change: any) => ids.includes(change.rowId));
    expect(mine.map((c: any) => `${c.field}:${c.newValue}`).sort()).toEqual(["destinationCategory:schengen", "destinationCountry:Italie", "visaType:schengen_travail"]);
    expect(mine.some((c: any) => c.rowId === ids[2])).toBe(false); // pays inconnu : jamais touché
    await expect(ctx.service.applyFixes(ctx.db, "admin@3m.test", preview.total + 1)).rejects.toThrow(/ont changé/);

    const result = await ctx.service.applyFixes(ctx.db, "admin@3m.test", preview.total);
    expect(result.applied).toBe(preview.total);
    let [row] = await ctx.db.select().from(ctx.schema.evaluations).where(eq(ctx.schema.evaluations.id, ids[0]));
    expect(row).toMatchObject({ destinationCountry: "Italie", destinationCategory: "schengen", visaType: "schengen_travail" });
    expect((await ctx.service.previewFixes(ctx.db)).shown.filter((c: any) => ids.includes(c.rowId))).toHaveLength(0); // idempotent

    // modification manuelle ultérieure d'un champ : l'annulation la respecte
    await ctx.db.update(ctx.schema.evaluations).set({ destinationCountry: "Italie du Nord" }).where(eq(ctx.schema.evaluations.id, ids[0]));
    const reverted = await ctx.service.revertBatch(ctx.db, result.batchId);
    expect(reverted.skipped).toBeGreaterThanOrEqual(1);
    [row] = await ctx.db.select().from(ctx.schema.evaluations).where(eq(ctx.schema.evaluations.id, ids[0]));
    expect(row.destinationCountry).toBe("Italie du Nord");
    expect(row.destinationCategory).toBe("autre"); // restauré
    expect((await ctx.service.listBatches(ctx.db))[0].reverted).toBeGreaterThan(0);
  });
});
