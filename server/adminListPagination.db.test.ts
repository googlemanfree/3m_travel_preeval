import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inArray, like, sql } from "drizzle-orm";

/**
 * Liste principale du tableau de bord (admin.listCandidates) paginée par le serveur, et écran « Comptes à ouvrir » :
 * CV et documents déposés à l'évaluation visibles. Exécuté seulement si BILAN_AUTO_TEST_DATABASE_URL pointe vers une base JETABLE ;
 * lancer avec --no-file-parallelism.
 */
const URL = process.env.BILAN_AUTO_TEST_DATABASE_URL;

describe.skipIf(!URL)("liste principale paginée et comptes à ouvrir", () => {
  let ctx: any;
  const stamp = String(Date.now()).slice(-9);
  const mail = (name: string) => `zq${stamp}.${name}@example.org`;

  beforeAll(async () => {
    process.env.DATABASE_URL = URL;
    const { getDb } = await import("./db");
    const db = (await getDb())!;
    const s = await import("../drizzle/schema");
    const token = `zq-token-${stamp}-0123456789abcdef0123456789`;
    await db.insert(s.adminAccounts).values({ email: `zq.${stamp}@example.test`, adminType: "evaluation", role: "admin", fullName: "Zq", status: "active", requiresPasswordChange: false, sessionToken: token, sessionExpiresAt: new Date(Date.now() + 3_600_000) } as never);
    const statuses = ["nouveau", "bilan_envoye", "paye", "documents_recus", "visa_approuve"] as const;
    for (let n = 0; n < 27; n += 1) {
      await db.insert(s.applications).values({ dossierNumber: `ZQ${stamp}-${n}`, fullName: `Zq Candidat ${n}`, email: mail(`on${n}`), whatsappNumber: "+237600", destination: "canada", visaType: "travail", dossierStatus: statuses[n % 5], createdAt: new Date(Date.UTC(2020, 0, 1 + n)) } as never);
    }
    for (let n = 0; n < 6; n += 1) await db.insert(s.agencyDossiers).values({ fullName: `Zq Agence ${n}`, email: mail(`ag${n}`), phone: "+33", destination: "Canada", visaType: "etude", createdByAdmin: "t@t.test", createdAt: new Date(Date.UTC(2020, 1, 1 + n)) } as never);
    const accountIds: number[] = [];
    for (let n = 0; n < 4; n += 1) {
      const [row] = await db.insert(s.candidates).values({ fullName: `Zq Compte ${n}`, email: mail(`co${n}`), passwordHash: "x", dossierStatus: "nouveau", evaluationDeclarationStatus: n % 2 ? "pending_validation" : "not_declared" } as never).$returningId();
      accountIds.push(row.id);
    }
    // compte « à ouvrir » avec documents déposés à l'évaluation (dont un CV), et un autre sans rien
    const [evaluation] = await db.insert(s.evaluations).values({ fullName: "Zq Eval", email: mail("co0"), phone: "+1", destinationCategory: "canada", visaType: "canada_travail" } as never).$returningId();
    await db.insert(s.clientDocuments).values({ evaluationId: evaluation.id, candidateEmail: mail("co0").toUpperCase(), documentType: "passport", documentName: "passeport.pdf", documentUrl: "/manus-storage/passeport.pdf" } as never);
    await db.insert(s.clientDocuments).values({ evaluationId: evaluation.id, candidateEmail: mail("co0"), documentType: "cv", documentName: "mon-cv.pdf", documentUrl: "/manus-storage/mon-cv.pdf" } as never);
    const { appRouter } = await import("./routers");
    ctx = { db, s, token, accountIds, evaluationId: evaluation.id, caller: appRouter.createCaller({ req: { headers: { cookie: `admin_session=${token}` } }, res: {} } as never) };
  });

  afterAll(async () => {
    if (!ctx) return;
    const { db, s, token, evaluationId } = ctx;
    await db.delete(s.clientDocuments).where(inArray(s.clientDocuments.evaluationId, [evaluationId]));
    await db.delete(s.evaluations).where(inArray(s.evaluations.id, [evaluationId]));
    await db.delete(s.candidates).where(like(s.candidates.email, `zq${stamp}.%`));
    await db.delete(s.agencyDossiers).where(like(s.agencyDossiers.email, `zq${stamp}.%`));
    await db.delete(s.applications).where(like(s.applications.email, `zq${stamp}.%`));
    await db.delete(s.adminAccounts).where(sql`${s.adminAccounts.sessionToken} = ${token}`);
  });

  const list = (input: Record<string, unknown>) => ctx.caller.admin.listCandidates({ sessionToken: ctx.token, search: `zq${stamp}`, sortBy: "recent", ...input });

  it("découpe en pages sans perdre ni répéter une ligne, et annonce le total", async () => {
    const full = await list({ pageSize: 200 });
    expect(full.total).toBe(27 + 6 + 4);
    expect(full.candidates).toHaveLength(37);
    const seen: string[] = [];
    const first = await list({ page: 1, pageSize: 10 });
    expect(first.totalPages).toBe(4);
    for (let page = 1; page <= first.totalPages; page += 1) {
      const result = await list({ page, pageSize: 10 });
      expect(result.page).toBe(page);
      expect(result.candidates.length).toBeLessThanOrEqual(10);
      seen.push(...result.candidates.map((candidate: any) => candidate.id));
    }
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.sort()).toEqual(full.candidates.map((candidate: any) => candidate.id).sort());
  });

  it("garde le même ordre d'une page à l'autre (tri demandé appliqué à toute la liste, pas à la page)", async () => {
    const full = await list({ pageSize: 200, sortBy: "oldest" });
    const paged: string[] = [];
    for (let page = 1; page <= 4; page += 1) paged.push(...(await list({ page, pageSize: 10, sortBy: "oldest" })).candidates.map((candidate: any) => candidate.id));
    expect(paged).toEqual(full.candidates.map((candidate: any) => candidate.id));
    const dates = full.candidates.map((candidate: any) => new Date(candidate.createdAt).getTime());
    expect([...dates].sort((a, b) => a - b)).toEqual(dates);
  });

  it("calcule les compteurs sur toute la liste filtrée, pas sur la page affichée", async () => {
    const full = await list({ pageSize: 200 });
    const onPage = await list({ page: 1, pageSize: 10 });
    expect(onPage.summary).toEqual(full.summary);
    const count = (predicate: (candidate: any) => boolean) => full.candidates.filter(predicate).length;
    expect(full.summary.stats.web).toBe(count((c) => c.source === "WEB"));
    expect(full.summary.stats.agency).toBe(count((c) => c.source === "AGENCY_PHYSICAL"));
    expect(full.summary.stats.pending).toBe(count((c) => c.status === "PENDING_48H"));
    expect(full.summary.externalEvaluation.count).toBe(count((c) => c.source === "ACCOUNT_ONLY" && c.evaluationDeclarationStatus === "pending_validation"));
    expect(full.summary.externalEvaluation.count).toBe(2);
    expect(full.summary.attentionRows.length).toBeLessThanOrEqual(8);
    expect(full.summary.agencyPhysicalCount).toBe(6);
  });

  it("une page trop lointaine est ramenée à la dernière ; sans pageSize, `limit` donne la taille de page", async () => {
    const far = await list({ page: 99, pageSize: 10 });
    expect(far.page).toBe(far.totalPages);
    expect(far.candidates.length).toBe(37 - 30);
    const legacy = await list({ limit: 25 });
    expect(legacy.pageSize).toBe(25);
    expect(legacy.candidates).toHaveLength(25);
  });

  it("tous les dossiers sont atteignables sans recherche (avant : seuls les 100 plus récents)", async () => {
    const all = await ctx.caller.admin.listCandidates({ sessionToken: ctx.token, sortBy: "oldest", pageSize: 10 });
    expect(all.total).toBeGreaterThan(100);
    expect(all.candidates).toHaveLength(10);
  });

  it("comptes à ouvrir : le CV et les documents déposés à l'évaluation sont visibles, avec leurs liens", async () => {
    const result: any = await ctx.caller.adminCandidateManagement.listPreDossierAccounts({ sessionToken: ctx.token, search: `zq${stamp}.co` });
    const account = result.accounts.find((row: any) => row.email === mail("co0"));
    expect(account).toBeTruthy();
    expect(account.documentsCount).toBe(2);
    expect(account.hasCv).toBe(true);
    expect(account.cvFileUrl).toBe("/manus-storage/mon-cv.pdf");
    expect(account.evaluationWithoutCv).toBe(false);
    expect(account.evaluationDocuments.map((document: any) => document.name).sort()).toEqual(["mon-cv.pdf", "passeport.pdf"]);
    const empty = result.accounts.find((row: any) => row.email === mail("co2"));
    expect(empty.documentsCount).toBe(0);
    expect(empty.hasCv).toBe(false);
    expect(empty.evaluationDocuments).toEqual([]);
  });
});
