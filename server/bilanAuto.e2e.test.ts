import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import { eq, sql } from "drizzle-orm";
import { GRID_V1 } from "../shared/bilanAuto/grid";

/**
 * Parcours complet sur une base MySQL réelle (schéma complet du site) avec un faux modèle d'IA et un faux serveur d'e-mail :
 * soumission → file → extraction → notation → bilan prêt → validation administrateur → publication dans le parcours existant →
 * vue candidat → e-mail unique. Exécuté seulement si BILAN_AUTO_TEST_DATABASE_URL pointe vers une base JETABLE.
 */
const URL = process.env.BILAN_AUTO_TEST_DATABASE_URL;

function cvPdf(): Buffer {
  const doc = new jsPDF();
  const lines = ["CURRICULUM VITAE - Awa Ndiaye", "Technicienne electricienne, 6 ans d'experience en maintenance industrielle.", "Licence en genie electrique (2019). Habilitation electrique B2V.", "Francais courant, anglais intermediaire.", "Projet : travailler comme technicienne de maintenance au Luxembourg."];
  lines.forEach((line, index) => doc.text(line, 15, 20 + index * 8));
  return Buffer.from(doc.output("arraybuffer"));
}

const cvJson = JSON.stringify({
  cv: { readable: true, fullName: "Awa Ndiaye", birthDate: "1995-04-02", niveau: { value: "bac_plus_3_4", evidence: "Licence" }, pertinence: { value: "alignee", evidence: null },
    dureeAnnees: { value: 6, evidence: null }, responsabilite: { value: "autonomie", evidence: null }, chronologie: { value: "coherente", evidence: null }, techniques: { value: "fort", evidence: null },
    certifications: { value: 1, evidence: null }, transferables: { value: 3, evidence: null }, langueTravail: { value: "B2", evidence: null }, autreLangue: { value: "B1", evidence: null },
    metierVise: "Technicienne de maintenance", secteurs: ["Industrie"], missionsVisees: ["Maintenance préventive"], coherenceProjet: { value: "coherent", evidence: null }, plan: { value: "plan_seul", evidence: null } },
  documents: [],
});

describe.skipIf(!URL)("parcours complet sur base réelle", () => {
  let ctx: any;
  const mails: Array<{ to: string; subject: string; text: string }> = [];
  const extractCalls: string[] = [];

  beforeAll(async () => {
    process.env.DATABASE_URL = URL;
    const { getDb } = await import("./db");
    const db = (await getDb())!;
    const schema = await import("../drizzle/schema");
    const { ensureBilanAutoTables } = await import("./services/bilanAuto/schemaGuard");
    await ensureBilanAutoTables();
    for (const table of ["bilan_auto_outbox", "bilan_auto_events", "bilan_auto_runs"]) await db.execute(sql.raw(`DELETE FROM ${table}`));
    await db.execute(sql.raw("DELETE FROM evaluation_validation_cases"));
    const email = `awa.e2e.${Date.now()}@example.org`;
    const [cand] = await db.insert(schema.candidates).values({ fullName: "Awa Ndiaye", email, phone: "+237600000000", passwordHash: "x" } as never).$returningId();
    const [ev] = await db.insert(schema.evaluations).values({
      candidateId: cand.id, fullName: "Awa Ndiaye", email, phone: "+237600000000", dateOfBirth: "1995-04-02", nationality: "Camerounaise", educationLevel: "Licence", yearsOfExperience: "5-10 ans",
      frenchLevel: "B2", englishLevel: "B1", destinationCategory: "schengen", destinationCountry: "Luxembourg", visaType: "schengen_travail", projectType: "travail",
      projectDetailsJson: JSON.stringify({ preparatoryCvAnalysisConsent: true }), cvFileUrl: "https://files.test/cv-awa.pdf", cvFileName: "cv-awa.pdf", referenceCode: `E2E-${Date.now()}`,
    } as never).$returningId();
    const { DrizzleBilanAutoStore } = await import("./services/bilanAuto/drizzleStore");
    const { makeLoadInputs, makePublisher } = await import("./services/bilanAuto/dbAdapters");
    const { DrizzleValidationStore } = await import("./services/evaluationValidationStore");
    const { renderPdf } = await import("./services/bilanAuto/reportPdf");
    const { DEFAULT_CONFIG } = await import("./services/bilanAuto/pipeline");
    const validation = { store: new DrizzleValidationStore(db), mailer: { send: async () => undefined }, now: () => new Date(), portalUrl: "https://x.test/mon-espace" } as any;
    const publisher = makePublisher(validation, () => new Date());
    const pdf = cvPdf();
    const deps = {
      store: new DrizzleBilanAutoStore(db), workerId: "e2e", now: () => new Date(), config: { ...DEFAULT_CONFIG, enabled: true, grid: { ...GRID_V1, approvedAt: "2026-11-20", approvedBy: "owner" } },
      loadInputs: makeLoadInputs(db, { fetchBuffer: async () => pdf }),
      runExtraction: async ({ user }: { user: string }) => { extractCalls.push(user); return cvJson; },
      search: null, renderPdf, storePdf: async (key: string) => ({ key, url: `https://files.test/${key}` }),
      publisher, mailer: { send: async (m: any) => { mails.push(m); return { messageId: `m${mails.length}` }; } }, portalUrl: "https://x.test/mon-espace",
      onPublicationEmailAccepted: publisher.markNotified,
    };
    ctx = { db, schema, deps, evaluationId: ev.id, candidateId: cand.id, email, validation };
  });
  afterAll(async () => { await ctx?.db.execute(sql.raw("DELETE FROM bilan_auto_outbox")); });

  it("de la soumission à la publication, avec lecture réelle du PDF et une seule notification", async () => {
    const pipeline = await import("./services/bilanAuto/pipeline");
    const queued = await pipeline.submitForAnalysis(ctx.deps, ctx.evaluationId);
    expect(queued.status).toBe("queued");
    expect(extractCalls).toHaveLength(0); // aucune analyse à la soumission

    const run = (await pipeline.processNext(ctx.deps))!;
    expect(run.state).toBe("ready_for_review");
    expect(extractCalls).toHaveLength(1);
    expect(extractCalls[0]).toMatch(/Technicienne electricienne/); // le texte du vrai PDF a été lu
    expect(extractCalls[0]).not.toMatch(/awa\.e2e/); // l'e-mail n'est pas transmis au modèle
    expect(run.score).toBeGreaterThan(0);
    expect(ctx.deps.store).toBeDefined();

    // rien de visible côté candidat avant validation
    const { buildCandidateView } = await import("./services/evaluationValidationCore");
    let latest = await ctx.validation.store.getLatestCase(ctx.evaluationId);
    expect(latest?.publishedReport ?? null).toBeNull();

    const published = await pipeline.publishRun(ctx.deps, run.id, "admin@3m.test");
    expect(published.ok).toBe(true);
    await pipeline.processOutbox(ctx.deps);
    await pipeline.processOutbox(ctx.deps);
    expect(mails).toHaveLength(1);
    expect(mails[0].to).toBe(ctx.email);

    latest = await ctx.validation.store.getLatestCase(ctx.evaluationId);
    expect(latest?.workflowStatus).toBe("validee_publiee_notifiee");
    const latestPublished = await ctx.validation.store.getLatestPublishedCase(ctx.evaluationId);
    const view = buildCandidateView({ latest, latestPublished, cv: { onFile: true, fileName: "cv-awa.pdf" } });
    expect(view.stage).toBe("published");
    expect(view.report?.automated?.sections.length).toBeGreaterThanOrEqual(13);
    expect(view.report?.automated?.reviewedByAgency).toBe(true);
    expect(view.report?.score).toBe(run.score);
    // le candidat ne voit ni faits extraits ni consignes internes
    expect(JSON.stringify(view)).not.toMatch(/inputSnapshot|facts|evidence/);
  });

  it("un projet études du même site n'est pas traité", async () => {
    const pipeline = await import("./services/bilanAuto/pipeline");
    const [ev] = await ctx.db.insert(ctx.schema.evaluations).values({
      candidateId: ctx.candidateId, fullName: "Awa Ndiaye", email: ctx.email, phone: "+237600000000", destinationCategory: "schengen", destinationCountry: "France", visaType: "schengen_etude", projectType: "etudes", cvFileUrl: "https://files.test/cv-awa.pdf", referenceCode: `E2E-ETU-${Date.now()}`,
    } as never).$returningId();
    expect((await pipeline.submitForAnalysis(ctx.deps, ev.id)).status).toBe("not_allowed");
  });

  it("une réponse du candidat après publication ouvre un nouveau traitement (nouvelle version) et ne republie pas l'ancien", async () => {
    const pipeline = await import("./services/bilanAuto/pipeline");
    await ctx.db.update(ctx.schema.evaluations).set({ yearsOfExperience: "10 ans et plus" }).where(eq(ctx.schema.evaluations.id, ctx.evaluationId));
    const second = await pipeline.submitForAnalysis(ctx.deps, ctx.evaluationId);
    expect(second.status).toBe("queued");
    const run = (await pipeline.processNext(ctx.deps))!;
    expect(run.previous?.updateNature).toMatch(/même CV/);
    expect(run.report!.sections[0].paragraphs.join(" ")).toMatch(/Évaluation du/);
  });
});
