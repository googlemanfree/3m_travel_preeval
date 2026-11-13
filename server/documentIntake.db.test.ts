import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { jsPDF } from "jspdf";

/**
 * Contrôle des documents sur une base MySQL réelle : enregistrement, doublon, liste de pièces, vue par problème, vérification, validité, lot.
 * Exécuté seulement si BILAN_AUTO_TEST_DATABASE_URL pointe vers une base JETABLE ; lancer avec --no-file-parallelism.
 */
const URL = process.env.BILAN_AUTO_TEST_DATABASE_URL;
const pdf = (lines: number) => { const d = new jsPDF(); for (let i = 0; i < lines; i += 1) d.text(`Ligne ${i}: technicienne electricienne, six ans d'experience en maintenance industrielle.`, 10, 20 + i * 8); return Buffer.from(d.output("arraybuffer")); };

describe.skipIf(!URL)("documents sur base réelle", () => {
  let ctx: any;
  const evalIds: number[] = [];
  beforeAll(async () => {
    process.env.DATABASE_URL = URL;
    const { getDb } = await import("./db");
    const db = (await getDb())!;
    const schema = await import("../drizzle/schema");
    const store = await import("./services/documentIntakeStore");
    const intake = await import("./services/documentIntake");
    store.resetDocumentIntakeGuardForTests();
    await store.ensureDocumentIntakeTable(db);
    const stamp = Date.now();
    const [ev] = await db.insert(schema.evaluations).values({ fullName: "Doc Test", email: `doc.${stamp}@example.org`, phone: "+237600000000", destinationCategory: "schengen", destinationCountry: "Luxembourg", visaType: "schengen_travail", projectType: "travail", cvFileUrl: "https://files.test/cv.pdf", cvFileName: "cv.pdf", referenceCode: `DOC-${stamp}` } as never).$returningId();
    evalIds.push(ev.id);
    ctx = { db, schema, store, intake, evaluationId: ev.id, stamp };
  });
  afterAll(async () => {
    if (!ctx) return;
    await ctx.db.delete(ctx.schema.documentIntake).where(inArray(ctx.schema.documentIntake.evaluationId, evalIds));
    await ctx.db.delete(ctx.schema.clientDocuments).where(inArray(ctx.schema.clientDocuments.evaluationId, evalIds));
    await ctx.db.delete(ctx.schema.evaluations).where(inArray(ctx.schema.evaluations.id, evalIds));
  });

  const addDoc = async (type: string, name: string, buffer: Buffer) => {
    const [row] = await ctx.db.insert(ctx.schema.clientDocuments).values({ evaluationId: ctx.evaluationId, candidateEmail: "doc@example.org", documentType: type, documentName: name, documentUrl: `https://files.test/${name}`, fileSize: buffer.length } as never).$returningId();
    const result = await ctx.intake.inspectDocument(buffer);
    const recorded = await ctx.store.recordIntake(ctx.db, { source: "client_document", refId: row.id, evaluationId: ctx.evaluationId, documentType: type, fileName: name, fileKey: `k/${name}`, result });
    return { docId: row.id, ...recorded };
  };

  it("enregistre le contrôle, repère le doublon, et construit la liste de pièces du projet", async () => {
    const diploma = pdf(6); // jsPDF horodate sa sortie : un même fichier = le même tampon
    const first = await addDoc("diploma", "diplome.pdf", diploma);
    expect(first.duplicateOf).toBeNull();
    const again = await addDoc("diploma", "diplome-bis.pdf", Buffer.from(diploma));
    expect(again.duplicateOf).toBe(first.id);
    await addDoc("passport", "passeport.pdf", pdf(2));
    const scan = await ctx.intake.inspectDocument((() => { const d = new jsPDF(); d.rect(5, 5, 20, 20); return Buffer.from(d.output("arraybuffer")); })());
    await ctx.store.recordIntake(ctx.db, { source: "evaluation_cv", refId: ctx.evaluationId, evaluationId: ctx.evaluationId, documentType: "cv", fileName: "cv.pdf", fileKey: "k/cv.pdf", result: scan });

    const checklist = await ctx.store.checklistFor_(ctx.db, ctx.evaluationId);
    const byId = Object.fromEntries(checklist.items.map((item: any) => [item.id, item]));
    expect(checklist.projectKind).toBe("travail");
    expect(byId.cv).toMatchObject({ status: "a_mettre_a_jour" });
    expect(byId.cv.reason).toMatch(/texte est sélectionnable/);
    expect(byId.diplome).toMatchObject({ status: "lisible", duplicate: true });
    expect(byId.experience.status).toBe("a_fournir");
    expect(byId.passeport.status).toBe("lisible"); // jamais « vérifié » sans action de l'agence
  });

  it("la vue par problème liste ce dossier, selon le filtre", async () => {
    for (const filter of ["a_mettre_a_jour", "manquant", "doublon"] as const) {
      const result = await ctx.store.overview(ctx.db, filter, `DOC-${ctx.stamp}`);
      expect(result.rows.map((row: any) => row.evaluationId)).toContain(ctx.evaluationId);
    }
    expect((await ctx.store.overview(ctx.db, "a_mettre_a_jour", "introuvable-xyz")).rows).toHaveLength(0);
  });

  it("vérification, remplacement demandé et date de validité (avec contrôles de saisie)", async () => {
    const docs = await ctx.store.loadDocuments(ctx.db, ctx.evaluationId);
    const passport = docs.find((doc: any) => doc.documentType === "passport");
    await expect(ctx.store.setVerification(ctx.db, passport.intakeId, "a_remplacer", "x", "admin")).rejects.toThrow(/motif/);
    expect(await ctx.store.setVerification(ctx.db, passport.intakeId, "verifie", null, "admin@3m.test")).toBe(true);
    let checklist = await ctx.store.checklistFor_(ctx.db, ctx.evaluationId);
    expect(checklist.items.find((i: any) => i.id === "passeport").status).toBe("verifie");
    await ctx.store.setVerification(ctx.db, passport.intakeId, "a_remplacer", "Photo floue sur la page d'identité", "admin@3m.test");
    checklist = await ctx.store.checklistFor_(ctx.db, ctx.evaluationId);
    expect(checklist.items.find((i: any) => i.id === "passeport")).toMatchObject({ status: "a_mettre_a_jour", reason: "Photo floue sur la page d'identité" });
    await ctx.store.setVerification(ctx.db, passport.intakeId, "non_verifie", null, "admin");
    await expect(ctx.store.setExpiry(ctx.db, passport.intakeId, "pas une date")).rejects.toThrow(/invalide/);
    await ctx.store.setExpiry(ctx.db, passport.intakeId, "2020-01-01");
    checklist = await ctx.store.checklistFor_(ctx.db, ctx.evaluationId);
    expect(checklist.items.find((i: any) => i.id === "passeport").reason).toMatch(/Expiré depuis le 2020-01-01/);
  });

  it("le contrôle par lot compte les fichiers inaccessibles sans planter", async () => {
    await ctx.db.insert(ctx.schema.clientDocuments).values({ evaluationId: ctx.evaluationId, candidateEmail: "doc@example.org", documentType: "bank_statement", documentName: "releve.pdf", documentUrl: "http://127.0.0.1/inaccessible.pdf" } as never);
    const result = await ctx.store.backfill(ctx.db, 40);
    expect(result.unreachable).toBeGreaterThanOrEqual(1);
    expect(result.inspected).toBeGreaterThanOrEqual(0);
  });
});
