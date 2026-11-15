/**
 * Mesure des écrans de l'administration sur une base JETABLE (jamais la production) : pour chaque requête, durée médiane,
 * volume de données envoyé par la base, nombre d'instructions SQL et taille de la réponse.
 *
 *   BILAN_AUTO_TEST_DATABASE_URL=mysql://bt:bt@localhost:3306/bilan_test JWT_SECRET=x npx tsx scripts/perf-admin-audit.mts
 */
import { sql } from "drizzle-orm";

const URL = process.env.BILAN_AUTO_TEST_DATABASE_URL;
if (!URL) { console.error("Définissez BILAN_AUTO_TEST_DATABASE_URL (base jetable)."); process.exit(1); }
process.env.DATABASE_URL = URL;
process.env.JWT_SECRET ??= "perf-audit-secret-0123456789abcdef-0123456789";

const { getDb } = await import("../server/db");
const schema = await import("../drizzle/schema");
const { appRouter } = await import("../server/routers");
const db: any = await getDb();

const stamp = Date.now();
const token = `audit-token-${stamp}-0123456789abcdef0123456789`;
await db.insert(schema.adminAccounts).values({ email: `audit.${stamp}@example.test`, adminType: "evaluation", role: "admin", fullName: "Audit", status: "active", requiresPasswordChange: false, sessionToken: token, sessionExpiresAt: new Date(Date.now() + 3_600_000) } as never);
const caller: any = appRouter.createCaller({ req: { headers: { cookie: `admin_session=${token}` } }, res: {}, user: { id: 1, openId: "audit", name: "Audit", role: "admin" } } as never);

const t = { sessionToken: token };
const cases: Array<[string, unknown]> = [
  ["adminDashboardStats.getGlobalStats", undefined], ["adminDashboardStats.getApplicationsStatusChart", undefined], ["adminDashboardStats.getRevenueChart", { days: 30 }],
  ["adminDashboardStats.getTransactionsStatusChart", undefined], ["adminDashboardStats.getCandidatesByDestinationChart", undefined], ["adminDashboardStats.getRecentApplications", { limit: 10 }],
  ["adminDashboardStats.getRecentTransactions", { limit: 10 }], ["adminDashboardStats.getKPIs", undefined],
  ["adminInsights.adminToday", t], ["adminInsights.adminProofQueue", t], ["adminInsights.adminFunnel", { ...t, days: 30 }], ["adminInsights.adminDataQuality", t], ["adminInsights.adminResponseTimes", t],
  ["adminInsights.adminSatisfaction", t], ["adminInsights.adminMatchableOffers", t],
  ["adminCandidateManagement.getPilotageQueue", t], ["adminCandidateManagement.listCockpitControlBoard", t], ["adminCandidateManagement.listCandidatesWithoutEvaluation", t],
  ["adminCandidateManagement.listPreDossierAccounts", t], ["adminCandidateManagement.listRedundantPreAccounts", t], ["adminCandidateManagement.contractsReceiptsDesk", t],
  ["adminCandidateManagement.list", { search: "", status: "all", paymentStatus: "all", scoreBand: "all", destination: "all", portraitStatus: "all", cvStatus: "all", sortBy: "createdAt", sortDirection: "desc", page: 1, pageSize: 25 }],
  ["admin.listCandidates", t], ["admin.getEvaluationsByDestination", t], ["admin.getEmailDeliveryLogs", t],
  ["adminDocuments.overview", t], ["adminDocumentInsights.stats", t], ["adminDocumentInsights.duplicates", t],
  ["adminBilanAuto.status", t], ["adminBilanAuto.list", { ...t, filter: "tous" }], ["adminDataCoherence.report", t],
  ["adminOps.adminSystemHealth", t], ["adminOps.adminOutcomes", t], ["adminOps.adminDocumentChecks", t], ["adminOps.adminScheduleList", t], ["adminOps.adminBilanTemplates", t],
  ["adminNotifications.list", t], ["adminSavedViews.list", t], ["adminAuth.listAdmins", t], ["adminAuth.getSessionHistory", t], ["adminAuth.listSecurityEvents", t], ["adminAuth.getGlobalStats", t],
  ["adminContent.adminUpdates", t], ["adminContent.adminDemand", t],
];

async function counters() {
  const rows: any = (await db.execute(sql`SHOW GLOBAL STATUS WHERE Variable_name IN ('Bytes_sent','Questions')`))[0];
  const map = Object.fromEntries(rows.map((r: any) => [r.Variable_name, Number(r.Value)]));
  return { bytes: map.Bytes_sent as number, questions: map.Questions as number };
}

const only = process.argv[2];
const results: Array<{ name: string; ms: number; dbKb: number; statements: number; kb: number; error?: string }> = [];
for (const [name, input] of cases) {
  if (only && !name.includes(only)) continue;
  const fn = name.split(".").reduce((node: any, key) => node?.[key], caller);
  const runs: number[] = []; let dbKb = 0, statements = 0, kb = 0, error: string | undefined;
  for (let i = 0; i < 3; i += 1) {
    const before = await counters();
    const start = performance.now();
    try { const out = await fn(input); kb = Math.round(JSON.stringify(out ?? null).length / 1024); } catch (e: any) { error = String(e?.message ?? e).replace(/\s+/g, " ").slice(0, 90); break; }
    runs.push(performance.now() - start);
    const after = await counters();
    dbKb = Math.round((after.bytes - before.bytes) / 1024); statements = after.questions - before.questions - 2;
  }
  runs.sort((a, b) => a - b);
  results.push({ name, ms: Math.round(runs[Math.floor(runs.length / 2)] ?? 0), dbKb, statements, kb, error });
}
results.sort((a, b) => b.ms - a.ms);
console.log("durée ms | base Ko | instr. | réponse Ko | requête");
for (const r of results) console.log(`${String(r.ms).padStart(8)} | ${String(r.dbKb).padStart(7)} | ${String(r.statements).padStart(6)} | ${String(r.kb).padStart(10)} | ${r.name}${r.error ? "  ✗ " + r.error : ""}`);
await db.delete(schema.adminAccounts).where(sql`${schema.adminAccounts.sessionToken} = ${token}`);
process.exit(0);
