import { isActivatedStatus } from "../../shared/candidateStatus";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, like, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { adminNotifications, agencySettings, applications, candidateFiles, candidateMessages, candidates, evaluations, paymentAuditLogs } from "../../drizzle/schema";
import { unifiedClientRequests } from "../../drizzle/caseTrackingSchema";
import { jobOffers } from "../../drizzle/jobOffersSchema";
import { candidatePlacementConsents, placementCandidateProfiles } from "../../drizzle/placementPortalSchema";
import { caseNextActions, remoteAcknowledgements, remoteSlots, satisfactionResponses, sensitiveActionRequests } from "../../drizzle/remoteSupportSchema";
import {
  QUALITY_LABELS,
  SATISFACTION_MILESTONES,
  buildWeeklyReportText,
  computeNps,
  findQualityIssues,
  scoreOfferMatch,
  type FunnelStats,
  type QualityIssueCode,
} from "../../shared/adminInsights";
import { proposedOpeningFee } from "../../shared/openingFee";
import { PROOF_NAME_PREFIX } from "../../shared/paymentProof";
import { WAITING_URGENT_DAYS, BLOCKED_AFTER_DAYS } from "../../shared/remoteSupport";
import { WORLD_COUNTRY_ROWS } from "../../shared/worldCountries";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sendClientNotificationEmail } from "../emailService";
import { scanActivationsWithoutProof } from "../services/deactivateDossier";
import { OPENING_PAYMENT_KEY_PREFIX, getOpeningPaymentEvidence } from "../services/openingPaymentEvidence";
import { adminLabel } from "../services/partnerProfiles";
import { recordPrivacyEvent } from "../services/privacyAudit";
import { storageGetSignedUrl } from "../storage";
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
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cette fonction n'est pas encore activée : les migrations 0091 et 0092 doivent être appliquées." });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment. Réessayez dans quelques instants." });
  }
}

const session = z.string().min(1).max(512);
const DAY = 24 * 60 * 60 * 1000;
const iso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : null);
const COUNTRY_NAMES = new Map(WORLD_COUNTRY_ROWS.map((row) => [row[0], row[1]] as const));

async function expectedFeeFor(db: Db, candidate: { id: number; visaType: string | null }): Promise<number> {
  const [application] = await db.select({ paymentAmount: applications.paymentAmount }).from(applications).where(and(eq(applications.candidateId, candidate.id), isNull(applications.deletedAt))).orderBy(desc(applications.createdAt)).limit(1);
  return application?.paymentAmount ?? proposedOpeningFee(candidate.visaType);
}

type ProofRow = { fileId: number; candidateId: number; fullName: string; email: string; dossierStatus: string; fileName: string; mimeType: string | null; uploadedAt: string; ageDays: number; expectedAmount: number; alreadyActive: boolean; duplicateOf: number[]; fileKey: string };

/** Preuves envoyées par les clients pour des candidats dont le paiement n'est pas encore justifié. */
async function loadProofQueue(db: Db): Promise<ProofRow[]> {
  const rows = await db.select({ id: candidateFiles.id, candidateId: candidateFiles.candidateId, fileName: candidateFiles.fileName, fileKey: candidateFiles.fileKey, mimeType: candidateFiles.mimeType, size: candidateFiles.fileSizeBytes, uploadedAt: candidateFiles.uploadedAt, fullName: candidates.fullName, email: candidates.email, dossierStatus: candidates.dossierStatus, visaType: candidates.visaType })
    .from(candidateFiles).innerJoin(candidates, eq(candidates.id, candidateFiles.candidateId))
    .where(and(like(candidateFiles.fileName, `${PROOF_NAME_PREFIX}%`), isNull(candidates.deletedAt))).orderBy(desc(candidateFiles.uploadedAt)).limit(400);
  const bySignature = new Map<string, number[]>();
  for (const row of rows) bySignature.set(`${row.fileName}|${row.size}`, [...(bySignature.get(`${row.fileName}|${row.size}`) ?? []), row.candidateId]);
  const seen = new Set<number>();
  const queue: ProofRow[] = [];
  for (const row of rows) {
    if (seen.has(row.candidateId)) continue;
    seen.add(row.candidateId);
    const evidence = await getOpeningPaymentEvidence(db, { id: row.candidateId, email: row.email });
    if (evidence.ok) continue;
    queue.push({
      fileId: row.id, candidateId: row.candidateId, fullName: row.fullName, email: row.email, dossierStatus: row.dossierStatus, fileName: row.fileName, mimeType: row.mimeType,
      uploadedAt: iso(row.uploadedAt)!, ageDays: Math.floor((Date.now() - new Date(row.uploadedAt).getTime()) / DAY), expectedAmount: await expectedFeeFor(db, row),
      alreadyActive: isActivatedStatus(row.dossierStatus), duplicateOf: Array.from(new Set((bySignature.get(`${row.fileName}|${row.size}`) ?? []).filter((id) => id !== row.candidateId))), fileKey: row.fileKey,
    });
  }
  return queue;
}

async function countUrgentWaiting(db: Db, now: Date): Promise<number> {
  const recent = await db.select({ candidateId: candidateMessages.candidateId, senderRole: candidateMessages.senderRole, createdAt: candidateMessages.createdAt }).from(candidateMessages).where(gte(candidateMessages.createdAt, new Date(now.getTime() - 60 * DAY))).orderBy(desc(candidateMessages.createdAt)).limit(5000);
  const latest = new Map<number, (typeof recent)[number]>();
  for (const message of recent) if (!latest.has(message.candidateId)) latest.set(message.candidateId, message);
  return Array.from(latest.values()).filter((message) => message.senderRole === "candidate" && now.getTime() - new Date(message.createdAt).getTime() >= WAITING_URGENT_DAYS * DAY).length;
}

async function buildFunnel(db: Db, days: number): Promise<FunnelStats> {
  const since = new Date(Date.now() - days * DAY);
  const count = async (query: Promise<Array<{ total: number }>>) => Number((await query)[0]?.total ?? 0);
  const [accounts, evaluationCount, confirmed, activated, sources, destinations] = await Promise.all([
    count(db.select({ total: sql<number>`count(*)` }).from(candidates).where(and(isNull(candidates.deletedAt), gte(candidates.createdAt, since)))),
    count(db.select({ total: sql<number>`count(*)` }).from(evaluations).where(gte(evaluations.createdAt, since))),
    count(db.select({ total: sql<number>`count(distinct ${paymentAuditLogs.candidateEmail})` }).from(paymentAuditLogs).where(and(eq(paymentAuditLogs.action, "confirmed"), gte(paymentAuditLogs.createdAt, since)))),
    count(db.select({ total: sql<number>`count(*)` }).from(candidates).where(and(isNull(candidates.deletedAt), isNotNull(candidates.activeDossierSetAt), gte(candidates.activeDossierSetAt, since)))),
    db.select({ source: candidates.acquisitionSource, accounts: sql<number>`count(*)` }).from(candidates).where(and(isNull(candidates.deletedAt), gte(candidates.createdAt, since))).groupBy(candidates.acquisitionSource),
    db.select({ destination: candidates.destination, accounts: sql<number>`count(*)` }).from(candidates).where(and(isNull(candidates.deletedAt), gte(candidates.createdAt, since))).groupBy(candidates.destination),
  ]);
  return {
    days,
    stages: [
      { key: "accounts", label: "Nouveaux comptes", count: accounts },
      { key: "evaluations", label: "Évaluations demandées", count: evaluationCount },
      { key: "payments", label: "Paiements confirmés", count: confirmed },
      { key: "activations", label: "Dossiers activés", count: activated },
    ],
    sources: sources.map((row) => ({ source: String(row.source ?? "other"), accounts: Number(row.accounts) })).sort((a, b) => b.accounts - a.accounts),
    destinations: destinations.map((row) => ({ destination: String(row.destination ?? "autre"), accounts: Number(row.accounts) })).sort((a, b) => b.accounts - a.accounts),
  };
}

/**
 * Pilotage avancé : « ma journée », contrôle des preuves de paiement, entonnoir et rapport, qualité des données, délais de réponse,
 * satisfaction (privée) et rapprochement offres/profils consentis.
 */
export const adminInsightsRouter = router({
  adminToday: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const now = new Date();
    const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const slots = await db.select().from(remoteSlots).where(and(eq(remoteSlots.status, "booked"), gte(remoteSlots.startsAt, new Date(now.getTime() - 60 * 60 * 1000)), lte(remoteSlots.startsAt, horizon))).orderBy(asc(remoteSlots.startsAt)).limit(30);
    const ids = Array.from(new Set(slots.map((slot) => slot.candidateId).filter((id): id is number => Boolean(id))));
    const people = ids.length ? await db.select({ id: candidates.id, fullName: candidates.fullName }).from(candidates).where(inArray(candidates.id, ids)) : [];
    const today = now.toISOString().slice(0, 10);
    const actions = await db.select({ id: caseNextActions.id, candidateId: caseNextActions.candidateId, action: caseNextActions.action, dueOn: caseNextActions.dueOn }).from(caseNextActions).where(and(eq(caseNextActions.status, "open"), eq(caseNextActions.ownerAdminId, admin.id), lte(caseNextActions.dueOn, today))).orderBy(asc(caseNextActions.dueOn)).limit(30);
    const actionIds = Array.from(new Set(actions.map((action) => action.candidateId)));
    const actionPeople = actionIds.length ? await db.select({ id: candidates.id, fullName: candidates.fullName }).from(candidates).where(inArray(candidates.id, actionIds)) : [];
    const [urgent, proofs, declined, pendingRequests] = await Promise.all([
      countUrgentWaiting(db, now),
      loadProofQueue(db),
      db.select({ total: sql<number>`count(*)` }).from(remoteAcknowledgements).where(and(eq(remoteAcknowledgements.status, "declined"), gte(remoteAcknowledgements.answeredAt, new Date(now.getTime() - 14 * DAY)))),
      db.select({ total: sql<number>`count(*)` }).from(sensitiveActionRequests).where(eq(sensitiveActionRequests.status, "pending")),
    ]);
    return {
      appointments: slots.map((slot) => ({ id: slot.id, startsAt: iso(slot.startsAt)!, channel: slot.channel, candidateId: slot.candidateId, candidateName: people.find((item) => item.id === slot.candidateId)?.fullName ?? "Candidat" })),
      actions: actions.map((action) => ({ id: action.id, candidateId: action.candidateId, candidateName: actionPeople.find((item) => item.id === action.candidateId)?.fullName ?? "Candidat", action: action.action, dueOn: action.dueOn, overdue: Boolean(action.dueOn && action.dueOn < today) })),
      counters: { waitingUrgent: urgent, proofsToCheck: proofs.length, declinedAcknowledgements: Number(declined[0]?.total ?? 0), sensitiveRequests: Number(pendingRequests[0]?.total ?? 0) },
    };
  })),

  adminProofQueue: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const queue = await loadProofQueue(db);
    return Promise.all(queue.slice(0, 60).map(async ({ fileKey, ...row }) => {
      let url: string | null = null;
      try { url = await storageGetSignedUrl(fileKey.replace(/^\/manus-storage\//, "")); } catch { url = null; }
      return { ...row, url };
    }));
  })),

  /** Valide le paiement d'un pré-compte à partir de la preuve envoyée par le candidat. Un montant différent exige un motif. */
  adminValidateProof: publicProcedure.input(z.object({ sessionToken: session, fileId: z.number().int().positive(), confirmedAmount: z.number().int().min(100).max(100_000_000), reason: z.string().trim().max(300).nullish().transform((value) => value || null) })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [file] = await db.select({ id: candidateFiles.id, candidateId: candidateFiles.candidateId, fileName: candidateFiles.fileName, fileKey: candidateFiles.fileKey }).from(candidateFiles).where(eq(candidateFiles.id, input.fileId)).limit(1);
    if (!file || !file.fileName.startsWith(PROOF_NAME_PREFIX)) throw new TRPCError({ code: "NOT_FOUND", message: "Preuve introuvable." });
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, file.candidateId)).limit(1);
    if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
    if (isActivatedStatus(candidate.dossierStatus)) throw new TRPCError({ code: "CONFLICT", message: "Ce compte a déjà un dossier actif : contrôlez-le dans « Activations à contrôler »." });
    const [existing] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, `${OPENING_PAYMENT_KEY_PREFIX}${candidate.id}`)).limit(1);
    if (existing) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le paiement de ce compte est déjà confirmé." });
    const expected = await expectedFeeFor(db, candidate);
    if (input.confirmedAmount !== expected && (input.reason ?? "").length < 5) throw new TRPCError({ code: "BAD_REQUEST", message: `Le montant reçu (${input.confirmedAmount}) diffère du montant attendu (${expected}) : indiquez le motif.` });
    const label = adminLabel(admin);
    const record = { candidateId: candidate.id, validatedAt: new Date().toISOString(), validatedBy: label, reference: null, proofFileUrl: file.fileKey, confirmedAmount: input.confirmedAmount };
    await db.insert(agencySettings).values({ settingKey: `${OPENING_PAYMENT_KEY_PREFIX}${candidate.id}`, settingValue: JSON.stringify(record) });
    await db.insert(paymentAuditLogs).values({
      adminName: label, adminEmail: admin.email ?? "", action: "confirmed", paymentId: candidate.id, candidateEmail: candidate.email, amount: `${input.confirmedAmount} XAF`,
      details: `Paiement d'ouverture validé depuis la file des preuves · montant attendu ${expected} XAF${input.confirmedAmount !== expected ? ` · écart justifié : ${input.reason}` : ""}`,
    });
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: label, action: "payment.proof_validated", resourceType: "candidate", resourceId: candidate.id, details: `${input.confirmedAmount} XAF (attendu ${expected})` });
    return { ok: true as const, candidateId: candidate.id };
  })),

  adminFunnel: publicProcedure.input(z.object({ sessionToken: session, days: z.number().int().min(7).max(365).default(30) })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    return buildFunnel(await requireDb(), input.days);
  })),

  /** Envoie le rapport hebdomadaire à l'administrateur connecté (jamais à d'autres destinataires). */
  adminSendWeeklyReport: publicProcedure.input(z.object({ sessionToken: session })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const now = new Date();
    const [funnel, open, proofs, urgent, unproven, scores] = await Promise.all([
      buildFunnel(db, 7),
      db.select({ last: unifiedClientRequests.lastActivityAt }).from(unifiedClientRequests).where(sql`${unifiedClientRequests.workflowStatus} NOT IN ('completed','closed','rejected')`).limit(6000),
      loadProofQueue(db),
      countUrgentWaiting(db, now),
      scanActivationsWithoutProof(db, 200),
      db.select({ score: satisfactionResponses.score }).from(satisfactionResponses).where(gte(satisfactionResponses.createdAt, new Date(now.getTime() - 7 * DAY))),
    ]);
    const body = buildWeeklyReportText({
      generatedOn: now, funnel, openRequests: open.length, blocked: open.filter((row) => now.getTime() - new Date(row.last).getTime() > BLOCKED_AFTER_DAYS * DAY).length,
      waitingUrgent: urgent, proofsToCheck: proofs.length, activationsWithoutProof: unproven.rows.length, satisfaction: { responses: scores.length, nps: computeNps(scores.map((row) => row.score)) },
    });
    const sent = await sendClientNotificationEmail({ to: admin.email, fullName: admin.fullName ?? "Administrateur", title: "Rapport hebdomadaire de pilotage", body, actionUrl: "/admin", sourceLabel: "3M TRAVEL AGENCY" }).catch(() => false);
    return { sent: Boolean(sent), preview: body };
  })),

  adminDataQuality: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select({ id: candidates.id, fullName: candidates.fullName, email: candidates.email, phone: candidates.phone, dateOfBirth: candidates.dateOfBirth, destination: candidates.destination, preferredDestinations: candidates.preferredDestinations, dossierStatus: candidates.dossierStatus })
      .from(candidates).where(isNull(candidates.deletedAt)).orderBy(desc(candidates.id)).limit(4000);
    const issues = findQualityIssues(rows.map((row) => ({ ...row, destination: row.destination ?? null })));
    const groups = new Map<QualityIssueCode, typeof issues>();
    for (const issue of issues) groups.set(issue.code, [...(groups.get(issue.code) ?? []), issue]);
    return {
      scanned: rows.length,
      groups: Array.from(groups.entries()).map(([code, items]) => ({ code, ...QUALITY_LABELS[code], count: items.length, examples: items.slice(0, 25) })).sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]) || b.count - a.count),
    };
  })),

  /** Délai de réponse du conseiller aux messages des candidats (60 derniers jours). */
  adminResponseTimes: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const now = Date.now();
    const rows = await db.select({ candidateId: candidateMessages.candidateId, senderRole: candidateMessages.senderRole, createdAt: candidateMessages.createdAt }).from(candidateMessages).where(gte(candidateMessages.createdAt, new Date(now - 60 * DAY))).orderBy(asc(candidateMessages.candidateId), asc(candidateMessages.createdAt)).limit(20000);
    const delays: Array<{ hours: number; weekAgo: number }> = [];
    let pending = 0;
    let waitingSince: number | null = null;
    let current = -1;
    const closeThread = () => { if (waitingSince !== null) pending += 1; waitingSince = null; };
    for (const row of rows) {
      if (row.candidateId !== current) { closeThread(); current = row.candidateId; }
      const time = new Date(row.createdAt).getTime();
      if (row.senderRole === "candidate") { if (waitingSince === null) waitingSince = time; }
      else if (waitingSince !== null) { delays.push({ hours: (time - waitingSince) / 3_600_000, weekAgo: Math.floor((now - waitingSince) / (7 * DAY)) }); waitingSince = null; }
    }
    closeThread();
    const median = (values: number[]) => { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return Math.round((sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10; };
    const within = (values: number[]) => (values.length ? Math.round((values.filter((hours) => hours <= 24).length / values.length) * 100) : null);
    const all = delays.map((item) => item.hours);
    return {
      answered: delays.length, unanswered: pending, medianHours: median(all), within24hPercent: within(all), targetHours: 24,
      weeks: [0, 1, 2, 3].map((week) => { const values = delays.filter((item) => item.weekAgo === week).map((item) => item.hours); return { weeksAgo: week, answered: values.length, medianHours: median(values), within24hPercent: within(values) }; }),
    };
  })),

  // ───────────── Satisfaction ─────────────
  mySatisfactionPrompt: candidateProcedure.query(({ ctx }) => guarded(async () => {
    const db = await requireDb();
    const answered = await db.select({ milestone: satisfactionResponses.milestone }).from(satisfactionResponses).where(eq(satisfactionResponses.candidateId, ctx.candidate.id));
    const done = new Set(answered.map((row) => row.milestone));
    const [slot] = await db.select({ id: remoteSlots.id }).from(remoteSlots).where(and(eq(remoteSlots.candidateId, ctx.candidate.id), eq(remoteSlots.status, "done"))).orderBy(desc(remoteSlots.startsAt)).limit(1);
    if (slot && !done.has(`rdv:${slot.id}`)) return { milestone: `rdv:${slot.id}`, label: SATISFACTION_MILESTONES.rdv };
    const [self] = await db.select({ status: candidates.dossierStatus, since: candidates.activeDossierSetAt }).from(candidates).where(eq(candidates.id, ctx.candidate.id)).limit(1);
    if (self && self.status !== "nouveau" && self.status !== "evaluation" && self.since && Date.now() - new Date(self.since).getTime() > 3 * DAY && !done.has("dossier")) return { milestone: "dossier", label: SATISFACTION_MILESTONES.dossier };
    return null;
  })),

  answerSatisfaction: candidateProcedure.input(z.object({ milestone: z.string().trim().min(3).max(40), score: z.number().int().min(0).max(10), comment: z.string().trim().max(500).nullish().transform((value) => value || null) })).mutation(({ ctx, input }) => guarded(async () => {
    const db = await requireDb();
    const rdv = /^rdv:(\d+)$/.exec(input.milestone);
    if (rdv) {
      const [slot] = await db.select({ id: remoteSlots.id }).from(remoteSlots).where(and(eq(remoteSlots.id, Number(rdv[1])), eq(remoteSlots.candidateId, ctx.candidate.id), eq(remoteSlots.status, "done"))).limit(1);
      if (!slot) throw new TRPCError({ code: "FORBIDDEN", message: "Ce rendez-vous ne peut pas être évalué." });
    } else if (input.milestone !== "dossier") throw new TRPCError({ code: "BAD_REQUEST", message: "Étape inconnue." });
    try {
      await db.insert(satisfactionResponses).values({ candidateId: ctx.candidate.id, milestone: input.milestone, score: input.score, comment: input.comment });
    } catch (error) {
      if (/Duplicate entry|ER_DUP_ENTRY/i.test(error instanceof Error ? error.message : "")) return { ok: true as const };
      throw error;
    }
    if (input.score <= 6) {
      try { await db.insert(adminNotifications).values({ type: "new_contact_message", title: "Retour peu satisfait", message: `${ctx.candidate.fullName} — note ${input.score}/10${input.comment ? ` : ${input.comment}` : ""}`.slice(0, 1000), relatedId: `satisfaction:${ctx.candidate.id}`, targetAdminType: "accompagnement" }); } catch { /* alerte manquée : la réponse reste enregistrée */ }
    }
    return { ok: true as const };
  })),

  /** Réponses de satisfaction : usage interne uniquement, jamais publiées comme témoignage. */
  adminSatisfaction: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(satisfactionResponses).orderBy(desc(satisfactionResponses.createdAt)).limit(500);
    const ids = Array.from(new Set(rows.slice(0, 40).map((row) => row.candidateId)));
    const people = ids.length ? await db.select({ id: candidates.id, fullName: candidates.fullName }).from(candidates).where(inArray(candidates.id, ids)) : [];
    const scores = rows.map((row) => row.score);
    return {
      responses: rows.length, nps: computeNps(scores), average: rows.length ? Math.round((scores.reduce((sum, score) => sum + score, 0) / rows.length) * 10) / 10 : null,
      recent: rows.slice(0, 40).map((row) => ({ id: row.id, candidateName: people.find((item) => item.id === row.candidateId)?.fullName ?? "Candidat", milestone: row.milestone.startsWith("rdv:") ? "rdv" : row.milestone, score: row.score, comment: row.comment, createdAt: iso(row.createdAt)! })),
    };
  })),

  // ───────────── Rapprochement offres / profils ─────────────
  adminMatchableOffers: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select({ id: jobOffers.id, reference: jobOffers.reference, title: jobOffers.title, countryCode: jobOffers.countryCode, city: jobOffers.city }).from(jobOffers).where(eq(jobOffers.status, "published")).orderBy(desc(jobOffers.publishedAt)).limit(100);
    return rows.map((row) => ({ ...row, countryName: COUNTRY_NAMES.get(row.countryCode) ?? row.countryCode }));
  })),

  /** Profils anonymisés, approuvés et consentis, classés pour une offre. L'admin choisit ; aucun envoi automatique. */
  adminMatchOffer: publicProcedure.input(z.object({ sessionToken: session, offerId: z.number().int().positive() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [offer] = await db.select().from(jobOffers).where(eq(jobOffers.id, input.offerId)).limit(1);
    if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Offre introuvable." });
    const profiles = await db.select({ profileCode: placementCandidateProfiles.profileCode, summary: placementCandidateProfiles.summary, targetDestination: placementCandidateProfiles.targetDestination, targetProcedure: placementCandidateProfiles.targetProcedure, sector: placementCandidateProfiles.sector, yearsExperience: placementCandidateProfiles.yearsExperience, languagesSummary: placementCandidateProfiles.languagesSummary })
      .from(placementCandidateProfiles).innerJoin(candidatePlacementConsents, eq(candidatePlacementConsents.candidateId, placementCandidateProfiles.candidateId))
      .where(and(eq(placementCandidateProfiles.summaryStatus, "approved"), isNull(placementCandidateProfiles.archivedAt), eq(candidatePlacementConsents.status, "granted"))).limit(500);
    const countryName = COUNTRY_NAMES.get(offer.countryCode) ?? offer.countryCode;
    const ranked = profiles.map((profile) => ({ profile, ...scoreOfferMatch({ countryName, title: offer.title, description: offer.description, experienceMinYears: offer.experienceMinYears, languages: offer.languagesJson ?? [] }, profile) }))
      .filter((item) => item.score >= 30).sort((a, b) => b.score - a.score).slice(0, 15);
    return { offer: { id: offer.id, reference: offer.reference, title: offer.title, countryName }, candidates: ranked.map((item) => ({ profileCode: item.profile.profileCode, summary: item.profile.summary.slice(0, 220), destination: item.profile.targetDestination, procedure: item.profile.targetProcedure, sector: item.profile.sector, score: item.score, reasons: item.reasons, blockers: item.blockers })) };
  })),
});
