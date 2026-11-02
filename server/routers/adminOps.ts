import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, inArray, isNull, lte, max, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import { adminAccounts, candidateFiles, candidates, emailDeliveryIncidents } from "../../drizzle/schema";
import { clientNotifications, unifiedClientRequestHistory, unifiedClientRequests } from "../../drizzle/caseTrackingSchema";
import { jobOffers } from "../../drizzle/jobOffersSchema";
import { bilanTemplates, caseOutcomes, paymentScheduleItems } from "../../drizzle/remoteSupportSchema";
import { toBilanHtml } from "../../shared/bilanContent";
import {
  BILAN_TEMPLATE_PROFILES,
  EXPECTED_TABLES,
  OUTCOME_LABELS,
  computeOutcomeStats,
  planAssignments,
  scheduleSummary,
  type AgentLoad,
} from "../../shared/adminOps";
import { comparePassportWithCandidate, parsePassportIdentity, passportExpiryStatus } from "../../shared/passportIdentity";
import { formatXaf } from "../../shared/openingFee";
import { publicProcedure, router } from "../_core/trpc";
import { SCHEDULED_JOBS, resolveScheduledJobsMode } from "../cron/scheduledJobsCron";
import { getDb } from "../db";
import { sendClientNotificationEmail } from "../emailService";
import { adminLabel } from "../services/partnerProfiles";
import { emailAllowed } from "../services/candidateSecurity";
import { recordPrivacyEvent } from "../services/privacyAudit";
import { requireValidAdminSession } from "./adminAuth";
import { candidateProcedure } from "./candidate";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  return db;
}

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cette fonction n'est pas encore activée : la migration 0093 doit être appliquée." });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment. Réessayez dans quelques instants." });
  }
}

const session = z.string().min(1).max(512);
const text = (max_: number) => z.string().trim().max(max_).nullish().transform((value) => (value ? value : null));
const day = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format AAAA-MM-JJ.");
const iso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : null);
const DAY = 24 * 60 * 60 * 1000;

async function audit(db: Db, admin: { id: number; email?: string | null }, action: string, resourceId: string | number, details: string) {
  await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action, resourceType: "admin_ops", resourceId, details: details.slice(0, 300) });
}

async function notify(db: Db, candidate: { id: number; email: string; fullName: string }, input: { type: string; title: string; body: string }) {
  try { await db.insert(clientNotifications).values({ candidateId: candidate.id, type: input.type, title: input.title, body: input.body, actionUrl: "/mon-espace", isRead: false }); } catch { /* l'e-mail reste tenté */ }
  if (!(await emailAllowed(db, candidate.id))) return false;
  return sendClientNotificationEmail({ to: candidate.email, fullName: candidate.fullName, title: input.title, body: input.body, actionUrl: "/mon-espace", sourceLabel: "3M TRAVEL AGENCY" }).catch(() => false);
}

/**
 * Outils d'administration : modèles de bilan versionnés, résultats réels des dossiers, échéancier de paiement, alertes sur les pièces
 * (passeport, identité), affectation automatique des dossiers et santé du système.
 */
export const adminOpsRouter = router({
  // ───────────── Modèles de bilan ─────────────
  adminBilanTemplates: publicProcedure.input(z.object({ sessionToken: session, profile: z.enum(BILAN_TEMPLATE_PROFILES).optional() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select({ id: bilanTemplates.id, profile: bilanTemplates.profile, name: bilanTemplates.name, version: bilanTemplates.version, createdBy: bilanTemplates.createdBy, createdAt: bilanTemplates.createdAt })
      .from(bilanTemplates).where(and(isNull(bilanTemplates.archivedAt), input.profile ? eq(bilanTemplates.profile, input.profile) : sql`1=1`)).orderBy(asc(bilanTemplates.name), desc(bilanTemplates.version)).limit(150);
    return rows.map((row) => ({ ...row, createdAt: iso(row.createdAt)! }));
  })),

  adminLoadBilanTemplate: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [row] = await db.select().from(bilanTemplates).where(and(eq(bilanTemplates.id, input.id), isNull(bilanTemplates.archivedAt))).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Modèle introuvable." });
    return { id: row.id, name: row.name, version: row.version, html: row.bodyHtml };
  })),

  /** Enregistre le contenu comme nouvelle version du modèle (les anciennes versions restent chargeables). Les variables {{…}} sont conservées. */
  adminSaveBilanTemplate: publicProcedure.input(z.object({ sessionToken: session, profile: z.enum(BILAN_TEMPLATE_PROFILES), name: z.string().trim().min(3).max(120), html: z.string().min(20).max(300_000) })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const clean = toBilanHtml(input.html);
    if (clean.length < 20) throw new TRPCError({ code: "BAD_REQUEST", message: "Le contenu du modèle est vide." });
    const [latest] = await db.select({ version: max(bilanTemplates.version) }).from(bilanTemplates).where(and(eq(bilanTemplates.profile, input.profile), eq(bilanTemplates.name, input.name)));
    const version = Number(latest?.version ?? 0) + 1;
    await db.insert(bilanTemplates).values({ profile: input.profile, name: input.name, version, bodyHtml: clean, createdBy: adminLabel(admin) });
    await audit(db, admin, "bilan_template.saved", `${input.profile}:${input.name}`, `version ${version}`);
    return { version };
  })),

  adminArchiveBilanTemplate: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await db.update(bilanTemplates).set({ archivedAt: new Date() }).where(eq(bilanTemplates.id, input.id));
    await audit(db, admin, "bilan_template.archived", input.id, "archivé (récupérable en base)");
    return { ok: true as const };
  })),

  // ───────────── Résultats réels ─────────────
  adminRecordOutcome: publicProcedure.input(z.object({
    sessionToken: session, candidateId: z.number().int().positive(), destination: z.string().trim().min(2).max(100), visaType: z.string().trim().min(2).max(100),
    outcome: z.enum(["accepted", "refused", "withdrawn"]), decidedOn: day.nullish().transform((value) => value ?? null), refusalReason: text(300),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    if (input.outcome === "refused" && (input.refusalReason ?? "").length < 3) throw new TRPCError({ code: "BAD_REQUEST", message: "Indiquez le motif du refus : c'est ce qui permet d'améliorer les dossiers suivants." });
    const [candidate] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
    if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
    await db.insert(caseOutcomes).values({ candidateId: candidate.id, destination: input.destination, visaType: input.visaType, outcome: input.outcome, decidedOn: input.decidedOn, refusalReason: input.refusalReason, recordedBy: adminLabel(admin) });
    await audit(db, admin, "case_outcome.recorded", candidate.id, `${input.outcome} · ${input.destination}`);
    return { ok: true as const };
  })),

  adminVoidOutcome: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await db.update(caseOutcomes).set({ voidedAt: new Date() }).where(and(eq(caseOutcomes.id, input.id), isNull(caseOutcomes.voidedAt)));
    await audit(db, admin, "case_outcome.voided", input.id, "saisie annulée");
    return { ok: true as const };
  })),

  adminOutcomes: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(caseOutcomes).where(isNull(caseOutcomes.voidedAt)).orderBy(desc(caseOutcomes.createdAt)).limit(1000);
    const ids = Array.from(new Set(rows.slice(0, 40).map((row) => row.candidateId)));
    const people = ids.length ? await db.select({ id: candidates.id, fullName: candidates.fullName }).from(candidates).where(inArray(candidates.id, ids)) : [];
    return {
      stats: computeOutcomeStats(rows.map((row) => ({ destination: row.destination, visaType: row.visaType, outcome: row.outcome }))),
      reasons: Array.from(rows.reduce((acc, row) => { if (row.outcome === "refused" && row.refusalReason) acc.set(row.refusalReason.toLowerCase(), (acc.get(row.refusalReason.toLowerCase()) ?? 0) + 1); return acc; }, new Map<string, number>()).entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([reason, count]) => ({ reason, count })),
      recent: rows.slice(0, 40).map((row) => ({ id: row.id, candidateName: people.find((item) => item.id === row.candidateId)?.fullName ?? "Candidat", destination: row.destination, visaType: row.visaType, outcome: row.outcome, outcomeLabel: OUTCOME_LABELS[row.outcome], decidedOn: row.decidedOn, refusalReason: row.refusalReason })),
    };
  })),

  // ───────────── Échéancier de paiement ─────────────
  adminScheduleList: publicProcedure.input(z.object({ sessionToken: session, candidateId: z.number().int().positive().optional() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const today = new Date().toISOString().slice(0, 10);
    const rows = await db.select().from(paymentScheduleItems)
      .where(input.candidateId ? eq(paymentScheduleItems.candidateId, input.candidateId) : and(eq(paymentScheduleItems.status, "pending"), lte(paymentScheduleItems.dueOn, new Date(Date.now() + 14 * DAY).toISOString().slice(0, 10))))
      .orderBy(asc(paymentScheduleItems.dueOn)).limit(300);
    const ids = Array.from(new Set(rows.map((row) => row.candidateId)));
    const people = ids.length ? await db.select({ id: candidates.id, fullName: candidates.fullName }).from(candidates).where(inArray(candidates.id, ids)) : [];
    return {
      summary: input.candidateId ? scheduleSummary(rows, today) : null,
      items: rows.map((row) => ({ id: row.id, candidateId: row.candidateId, candidateName: people.find((item) => item.id === row.candidateId)?.fullName ?? "Candidat", label: row.label, amount: row.amount, currency: row.currency, dueOn: row.dueOn, status: row.status, paidOn: row.paidOn, note: row.note, overdue: row.status === "pending" && row.dueOn < today })),
    };
  })),

  adminScheduleCreate: publicProcedure.input(z.object({
    sessionToken: session, candidateId: z.number().int().positive(),
    items: z.array(z.object({ label: z.string().trim().min(2).max(160), amount: z.number().int().min(100).max(100_000_000), dueOn: day })).min(1).max(12),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [candidate] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
    if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
    await db.insert(paymentScheduleItems).values(input.items.map((item) => ({ candidateId: candidate.id, label: item.label, amount: item.amount, dueOn: item.dueOn, createdBy: adminLabel(admin) })));
    await audit(db, admin, "payment_schedule.created", candidate.id, `${input.items.length} échéance(s)`);
    return { created: input.items.length };
  })),

  /** Un paiement n'est « reçu » que si l'administrateur indique la date et la référence ou la preuve ; l'échéance annulée reste en base. */
  adminScheduleSetStatus: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive(), status: z.enum(["paid", "waived", "cancelled", "pending"]), paidOn: day.nullish().transform((value) => value ?? null), note: text(300) })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    if (input.status === "paid" && (!input.paidOn || (input.note ?? "").length < 3)) throw new TRPCError({ code: "BAD_REQUEST", message: "Indiquez la date de réception et la référence ou la preuve du paiement." });
    if (input.status === "waived" && (input.note ?? "").length < 3) throw new TRPCError({ code: "BAD_REQUEST", message: "Indiquez le motif de la dispense." });
    await db.update(paymentScheduleItems).set({ status: input.status, paidOn: input.status === "paid" ? input.paidOn : null, note: input.note, recordedBy: adminLabel(admin) }).where(eq(paymentScheduleItems.id, input.id));
    await audit(db, admin, `payment_schedule.${input.status}`, input.id, input.note ?? "");
    return { ok: true as const };
  })),

  adminScheduleRemind: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [item] = await db.select().from(paymentScheduleItems).where(eq(paymentScheduleItems.id, input.id)).limit(1);
    if (!item || item.status !== "pending") throw new TRPCError({ code: "CONFLICT", message: "Cette échéance n'est plus à régler." });
    const [candidate] = await db.select({ id: candidates.id, email: candidates.email, fullName: candidates.fullName }).from(candidates).where(eq(candidates.id, item.candidateId)).limit(1);
    if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
    const sent = await notify(db, candidate, { type: "payment_reminder", title: "Rappel d'échéance", body: `Votre échéance « ${item.label} » de ${formatXaf(item.amount, item.currency)} est prévue le ${new Date(item.dueOn).toLocaleDateString("fr-FR")}. Après règlement, envoyez la preuve de paiement depuis votre espace client.` });
    await audit(db, admin, "payment_schedule.reminded", item.id, sent ? "e-mail envoyé" : "notification interne seulement");
    return { emailSent: Boolean(sent) };
  })),

  myPaymentPlan: candidateProcedure.query(({ ctx }) => guarded(async () => {
    const db = await requireDb();
    const rows = await db.select().from(paymentScheduleItems).where(and(eq(paymentScheduleItems.candidateId, ctx.candidate.id), notInArray(paymentScheduleItems.status, ["cancelled"]))).orderBy(asc(paymentScheduleItems.dueOn)).limit(24);
    if (rows.length === 0) return null;
    const today = new Date().toISOString().slice(0, 10);
    return { summary: scheduleSummary(rows, today), items: rows.map((row) => ({ id: row.id, label: row.label, amount: row.amount, currency: row.currency, dueOn: row.dueOn, status: row.status, paidOn: row.paidOn, overdue: row.status === "pending" && row.dueOn < today })) };
  })),

  // ───────────── Alertes sur les pièces et échéances ─────────────
  adminDocumentChecks: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const files = await db.select({ candidateId: candidateFiles.candidateId, status: candidateFiles.status, extractedData: candidateFiles.extractedData, uploadedAt: candidateFiles.uploadedAt, fullName: candidates.fullName, dateOfBirth: candidates.dateOfBirth })
      .from(candidateFiles).innerJoin(candidates, eq(candidates.id, candidateFiles.candidateId))
      .where(and(eq(candidateFiles.fileType, "passeport"), isNull(candidates.deletedAt))).orderBy(desc(candidateFiles.uploadedAt)).limit(3000);
    const seen = new Set<number>();
    const passports: Array<{ candidateId: number; fullName: string; status: string; daysLeft: number | null; expiryDate: string; message: string }> = [];
    const discrepancies: Array<{ candidateId: number; fullName: string; items: string[] }> = [];
    for (const file of files) {
      if (file.status === "rejected" || seen.has(file.candidateId)) continue;
      const identity = parsePassportIdentity(file.extractedData);
      if (!identity) continue;
      seen.add(file.candidateId);
      const expiry = passportExpiryStatus(identity.expiryDate, new Date(), identity.plannedTravelDate);
      if (expiry.status === "expired" || expiry.status === "too_short") passports.push({ candidateId: file.candidateId, fullName: file.fullName, status: expiry.status, daysLeft: expiry.daysLeft, expiryDate: identity.expiryDate, message: expiry.message });
      const gaps = comparePassportWithCandidate({ fullName: file.fullName, dateOfBirth: file.dateOfBirth }, identity);
      if (gaps.length) discrepancies.push({ candidateId: file.candidateId, fullName: file.fullName, items: gaps.map((gap) => gap.message) });
    }
    const soon = new Date(Date.now() + 7 * DAY).toISOString().slice(0, 10);
    const offers = await db.select({ id: jobOffers.id, reference: jobOffers.reference, title: jobOffers.title, deadline: jobOffers.applicationDeadline }).from(jobOffers).where(and(eq(jobOffers.status, "published"), gte(jobOffers.applicationDeadline, new Date().toISOString().slice(0, 10)), lte(jobOffers.applicationDeadline, soon))).orderBy(asc(jobOffers.applicationDeadline)).limit(20);
    return { checked: seen.size, passports: passports.sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0)).slice(0, 100), discrepancies: discrepancies.slice(0, 100), offersClosingSoon: offers };
  })),

  adminNotifyPassport: publicProcedure.input(z.object({ sessionToken: session, candidateId: z.number().int().positive() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [candidate] = await db.select({ id: candidates.id, email: candidates.email, fullName: candidates.fullName }).from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
    if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
    const sent = await notify(db, candidate, { type: "passport_validity", title: "Vérifiez la validité de votre passeport", body: "Un passeport doit rester valide plusieurs mois après la date de voyage. Le vôtre arrive à échéance ou ne respecte pas ce délai : renouvelez-le si nécessaire, puis envoyez la nouvelle page d'identité depuis votre espace client, ou contactez votre conseiller." });
    await audit(db, admin, "passport.validity_notified", candidate.id, sent ? "e-mail envoyé" : "notification interne seulement");
    return { emailSent: Boolean(sent) };
  })),

  // ───────────── Affectation automatique ─────────────
  adminAssignmentPreview: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const state = await loadAssignmentState(db);
    return { unassigned: state.unassigned, agents: state.agents.map((agent) => ({ ...agent, willReceive: state.plan.filter((item) => item.agentId === agent.id).length })), plan: state.plan.length };
  })),

  adminAutoAssign: publicProcedure.input(z.object({ sessionToken: session })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const { plan, agents } = await loadAssignmentState(db);
    for (const item of plan) {
      await db.update(unifiedClientRequests).set({ assignedAdminAccountId: item.agentId }).where(and(eq(unifiedClientRequests.id, item.requestId), isNull(unifiedClientRequests.assignedAdminAccountId)));
      await db.insert(unifiedClientRequestHistory).values({ requestId: item.requestId, actionType: "auto_assigned", previousValue: null, newValue: String(item.agentId), comment: `Affectation automatique à l'agent le moins chargé (${agents.find((agent) => agent.id === item.agentId)?.label ?? item.agentId})`, actorAdminAccountId: admin.id });
    }
    await audit(db, admin, "requests.auto_assigned", "batch", `${plan.length} dossier(s)`);
    return { assigned: plan.length };
  })),

  /** Compte candidat d'une adresse e-mail (pour ouvrir l'éditeur du bilan depuis la liste des évaluations). */
  adminCandidateByEmail: publicProcedure.input(z.object({ sessionToken: session, email: z.string().trim().email().max(320) })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [candidate] = await db.select({ id: candidates.id, fullName: candidates.fullName }).from(candidates)
      .where(and(isNull(candidates.deletedAt), sql`LOWER(TRIM(${candidates.email})) = ${input.email.trim().toLowerCase()}`)).limit(1);
    return candidate ?? null;
  })),

  // ───────────── Santé du système ─────────────
  adminSystemHealth: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const missing: Array<{ migration: string; tables: string[] }> = [];
    for (const entry of EXPECTED_TABLES) {
      const absent: string[] = [];
      for (const table of entry.tables) {
        try { await db.execute(sql.raw(`SELECT 1 FROM \`${table}\` LIMIT 1`)); } catch { absent.push(table); }
      }
      if (absent.length) missing.push({ migration: entry.migration, tables: absent });
    }
    const [incidents] = await db.select({ total: sql<number>`count(*)` }).from(emailDeliveryIncidents).where(eq(emailDeliveryIncidents.status, "open")).catch(() => [{ total: 0 }]);
    const mode = resolveScheduledJobsMode(process.env.SCHEDULED_JOBS_MODE);
    return { database: true as const, missingMigrations: missing, openEmailIncidents: Number(incidents?.total ?? 0), scheduler: { mode, jobs: SCHEDULED_JOBS.length, automaticReminders: mode === "live" } };
  })),
});

/** Agents actifs de l'accompagnement et des procédures + dossiers ouverts non assignés (200 au plus). */
async function loadAssignmentState(db: Db) {
  const admins = await db.select({ id: adminAccounts.id, fullName: adminAccounts.fullName, adminType: adminAccounts.adminType }).from(adminAccounts).where(and(eq(adminAccounts.status, "active"), inArray(adminAccounts.adminType, ["accompagnement", "procedures"])));
  const loads = await db.select({ agent: unifiedClientRequests.assignedAdminAccountId, total: sql<number>`count(*)` }).from(unifiedClientRequests).where(notInArray(unifiedClientRequests.workflowStatus, ["completed", "closed", "rejected"])).groupBy(unifiedClientRequests.assignedAdminAccountId);
  const agents: AgentLoad[] = admins.map((agent) => ({ id: agent.id, label: agent.fullName, open: Number(loads.find((row) => row.agent === agent.id)?.total ?? 0) }));
  const unassigned = await db.select({ id: unifiedClientRequests.id }).from(unifiedClientRequests).where(and(isNull(unifiedClientRequests.assignedAdminAccountId), notInArray(unifiedClientRequests.workflowStatus, ["completed", "closed", "rejected"]))).orderBy(asc(unifiedClientRequests.createdAt)).limit(200);
  const plan = planAssignments(agents, unassigned.map((row) => row.id));
  return { unassigned: unassigned.length, agents, plan };
}
