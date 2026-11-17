import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inArray, like, sql } from "drizzle-orm";

/**
 * Corbeille des dossiers : archiver (un dossier, une évaluation sans compte), restaurer, et message d'erreur lisible.
 * Exécuté seulement si BILAN_AUTO_TEST_DATABASE_URL pointe vers une base JETABLE ; lancer avec --no-file-parallelism.
 */
const URL = process.env.BILAN_AUTO_TEST_DATABASE_URL;

describe.skipIf(!URL)("corbeille des dossiers", () => {
  let ctx: any;
  const stamp = String(Date.now()).slice(-9);
  const mail = (name: string) => `za${stamp}.${name}@example.org`;

  beforeAll(async () => {
    process.env.DATABASE_URL = URL;
    const { getDb } = await import("./db");
    const db = (await getDb())!;
    const s = await import("../drizzle/schema");
    const { SUPER_ADMIN_EMAIL } = await import("./routers/adminAuth");
    const token = `za-token-${stamp}-0123456789abcdef0123456789`;
    const otherToken = `za-other-${stamp}-0123456789abcdef0123456789`;
    await db.delete(s.adminAccounts).where(sql`${s.adminAccounts.email} = ${SUPER_ADMIN_EMAIL}`);
    await db.insert(s.adminAccounts).values({ email: SUPER_ADMIN_EMAIL, adminType: "evaluation", role: "admin", fullName: "Super", status: "active", requiresPasswordChange: false, sessionToken: token, sessionExpiresAt: new Date(Date.now() + 3_600_000) } as never);
    await db.insert(s.adminAccounts).values({ email: `za.${stamp}@example.test`, adminType: "evaluation", role: "admin", fullName: "Autre", status: "active", requiresPasswordChange: false, sessionToken: otherToken, sessionExpiresAt: new Date(Date.now() + 3_600_000) } as never);
    const [app] = await db.insert(s.applications).values({ dossierNumber: `ZA${stamp}-1`, fullName: "Za Dossier", email: mail("on1"), whatsappNumber: "+237", destination: "canada", visaType: "travail" } as never).$returningId();
    const [agency] = await db.insert(s.agencyDossiers).values({ fullName: "Za Agence", email: mail("ag1"), phone: "+33", destination: "Canada", visaType: "etude", createdByAdmin: "t@t.test" } as never).$returningId();
    const [account] = await db.insert(s.candidates).values({ fullName: "Za Compte", email: mail("co1"), passwordHash: "x", dossierStatus: "nouveau" } as never).$returningId();
    const [evaluation] = await db.insert(s.evaluations).values({ fullName: "Za Invité", email: mail("gu1"), phone: "+2", destinationCategory: "canada", visaType: "canada_travail", cvFileUrl: "/manus-storage/cv.pdf" } as never).$returningId();
    const { appRouter } = await import("./routers");
    const caller = (cookie: string) => appRouter.createCaller({ req: { headers: { cookie: `admin_session=${cookie}` }, socket: { remoteAddress: "127.0.0.1" } }, res: {} } as never) as any;
    ctx = { db, s, token, otherToken, appId: app.id, agencyId: agency.id, accountId: account.id, evaluationId: evaluation.id, admin: caller(token), other: caller(otherToken), SUPER_ADMIN_EMAIL };
  });

  afterAll(async () => {
    if (!ctx) return;
    const { db, s } = ctx;
    await db.delete(s.agencySettings).where(like(s.agencySettings.settingKey, "evaluation_archived:%"));
    await db.delete(s.evaluations).where(inArray(s.evaluations.id, [ctx.evaluationId]));
    await db.delete(s.candidates).where(like(s.candidates.email, `za${stamp}.%`));
    await db.delete(s.agencyDossiers).where(like(s.agencyDossiers.email, `za${stamp}.%`));
    await db.delete(s.applications).where(like(s.applications.email, `za${stamp}.%`));
    await db.delete(s.adminAccounts).where(sql`${s.adminAccounts.sessionToken} IN (${ctx.token}, ${ctx.otherToken})`);
  });

  const archive = (candidateId: string, over: Record<string, unknown> = {}) => ctx.admin.admin.archiveDuplicateRecord({ sessionToken: ctx.token, candidateId, reason: "Doublon à vérifier", confirmation: "CORBEILLE", ...over });
  const guestList = async () => {
    const { queryCandidateList } = await import("./services/candidateListQuery");
    const result = await queryCandidateList(ctx.db, { search: `za${stamp}.gu1`, status: "all", paymentStatus: "all", scoreBand: "all", destination: "all", portraitStatus: "all", cvStatus: "all", evaluationStatus: "all", sortBy: "createdAt", sortDirection: "desc", page: 1, pageSize: 50 } as any);
    return result.candidates.filter((row) => row.source === "evaluation");
  };

  it("un dossier en ligne, un dossier agence et un compte partent à la corbeille ; une seconde demande est un succès (déjà fait), pas un échec", async () => {
    for (const id of [`online_${ctx.appId}`, `agency_${ctx.agencyId}`, `account_${ctx.accountId}`]) {
      const first = await archive(id);
      expect(first.success).toBe(true);
      const second = await archive(id);
      expect(second.success).toBe(true);
      expect(second.message).toMatch(/déjà dans la corbeille/);
    }
  });

  it("un identifiant inconnu donne un message clair avec la référence reçue", async () => {
    await expect(archive("dossier_12")).rejects.toThrow(/non prise en charge : « dossier_12 »/);
    await expect(archive("online_99999999")).rejects.toThrow(/Dossier en ligne introuvable/);
  });

  it("un administrateur qui n'est pas le super administrateur reçoit la vraie raison", async () => {
    await expect(ctx.other.admin.archiveDuplicateRecord({ sessionToken: ctx.otherToken, candidateId: `online_${ctx.appId}`, reason: "Doublon à vérifier", confirmation: "CORBEILLE" })).rejects.toThrow(/réservée au super administrateur/);
  });

  it("une évaluation sans compte s'archive (corbeille réversible), disparaît des listes, se retrouve dans la corbeille et se restaure", async () => {
    expect(await guestList()).toHaveLength(1);
    const done = await archive(`evaluation_${ctx.evaluationId}`);
    expect(done.success).toBe(true);
    expect(done.message).toMatch(/reste consultable dans le tableau des évaluations/);
    expect(await guestList()).toHaveLength(0);
    // la ligne de l'évaluation elle-même n'est pas touchée
    const [row] = await ctx.db.select().from(ctx.s.evaluations).where(sql`${ctx.s.evaluations.id} = ${ctx.evaluationId}`);
    expect(row.cvFileUrl).toBe("/manus-storage/cv.pdf");
    // l'ancien calcul en mémoire est d'accord
    const { loadCandidateRecords, resetCandidateRecordsShareForTests } = await import("./routers/adminCandidateManagement");
    resetCandidateRecordsShareForTests();
    expect((await loadCandidateRecords()).some((record) => record.id === `evaluation_${ctx.evaluationId}`)).toBe(false);
    // visible dans la corbeille
    const archived = await ctx.admin.admin.listArchivedRecords({ sessionToken: ctx.token, search: mail("gu1") });
    expect(archived.map((item: any) => item.candidateId)).toContain(`evaluation_${ctx.evaluationId}`);
    // une seconde archive ne casse rien
    expect((await archive(`evaluation_${ctx.evaluationId}`)).success).toBe(true);
    // restauration
    await ctx.admin.admin.restoreArchivedRecord({ sessionToken: ctx.token, candidateId: `evaluation_${ctx.evaluationId}`, confirmation: "RESTAURER" });
    expect(await guestList()).toHaveLength(1);
  });

  it("une évaluation introuvable donne un message clair", async () => {
    await expect(archive("evaluation_99999999")).rejects.toThrow(/Évaluation introuvable/);
  });

  it("l'écran affiche la raison renvoyée par le serveur au lieu d'un simple « échec »", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const dashboard = readFileSync(resolve(__dirname, "../client/src/pages/AdminDashboard.tsx"), "utf8");
    expect(dashboard).toContain("failureReasons.set(message");
    expect(dashboard).toContain("Raison : ${reasons}");
  });
});
