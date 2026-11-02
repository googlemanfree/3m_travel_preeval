import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, inArray, notInArray } from "drizzle-orm";
import { z } from "zod";
import { candidateFiles, candidateMessages, candidates } from "../../drizzle/schema";
import { clientNotifications, unifiedClientRequests } from "../../drizzle/caseTrackingSchema";
import { candidateNotificationPrefs, caseNextActions, paymentScheduleItems, remoteAcknowledgements, remoteSlots } from "../../drizzle/remoteSupportSchema";
import { dossierClientLabel, workflowClientLabel, type ClientLanguage } from "../../shared/clientCase";
import { router } from "../_core/trpc";
import { getDb } from "../db";
import { recentLogins, revokeAllSessions } from "../services/candidateSecurity";
import { candidateProcedure } from "./candidate";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  return db;
}

/** Une section qui échoue (table pas encore migrée, par exemple) ne fait jamais tomber tout l'espace client. */
async function safe<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch {
    return fallback;
  }
}

const iso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : null);
const DAY = 24 * 60 * 60 * 1000;
const languageOf = (value: string | null | undefined): ClientLanguage => (value === "en" ? "en" : "fr");

type Turn = { kind: "step" | "acknowledgement" | "payment" | "documents" | "messages"; text: string };

let replyCache: { at: number; median: number | null; answered: number } | null = null;

/** Délai médian de réponse de l'équipe sur 60 jours (tous dossiers), gardé 10 minutes en mémoire. */
async function replyStats(db: Db): Promise<{ median: number | null; answered: number }> {
  if (replyCache && Date.now() - replyCache.at < 10 * 60 * 1000) return replyCache;
  const rows = await db.select({ candidateId: candidateMessages.candidateId, senderRole: candidateMessages.senderRole, createdAt: candidateMessages.createdAt }).from(candidateMessages)
    .where(gte(candidateMessages.createdAt, new Date(Date.now() - 60 * DAY))).orderBy(asc(candidateMessages.candidateId), asc(candidateMessages.createdAt)).limit(20000);
  const delays: number[] = [];
  let waitingSince: number | null = null;
  let current = -1;
  for (const row of rows) {
    if (row.candidateId !== current) { waitingSince = null; current = row.candidateId; }
    const time = new Date(row.createdAt).getTime();
    if (row.senderRole === "candidate") { if (waitingSince === null) waitingSince = time; }
    else if (waitingSince !== null) { delays.push((time - waitingSince) / 3_600_000); waitingSince = null; }
  }
  const sorted = [...delays].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length ? Math.round((sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10 : null;
  replyCache = { at: Date.now(), median, answered: delays.length };
  return replyCache;
}

/** Espace client : où en est le dossier, journal, délai de réponse, préférences et sécurité du compte. */
export const clientSpaceRouter = router({
  myCaseOverview: candidateProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const language = languageOf(ctx.candidate.preferredLanguage);
    const now = new Date();
    const requests = await safe(() => db.select({ status: unifiedClientRequests.workflowStatus, last: unifiedClientRequests.lastActivityAt })
      .from(unifiedClientRequests).where(and(eq(unifiedClientRequests.candidateId, ctx.candidate.id), notInArray(unifiedClientRequests.workflowStatus, ["completed", "closed", "rejected"]))).orderBy(desc(unifiedClientRequests.lastActivityAt)).limit(3), []);
    const lastAdvisor = await safe(async () => (await db.select({ at: candidateMessages.createdAt }).from(candidateMessages).where(and(eq(candidateMessages.candidateId, ctx.candidate.id), eq(candidateMessages.senderRole, "advisor"))).orderBy(desc(candidateMessages.createdAt)).limit(1))[0]?.at ?? null, null as Date | null);
    const turns: Turn[] = [];
    const step = await safe(async () => (await db.select({ text: caseNextActions.candidateText }).from(caseNextActions).where(and(eq(caseNextActions.candidateId, ctx.candidate.id), eq(caseNextActions.status, "open"), eq(caseNextActions.candidateVisible, 1))).orderBy(desc(caseNextActions.updatedAt)).limit(1))[0]?.text ?? null, null as string | null);
    if (step) turns.push({ kind: "step", text: step });
    const rejected = await safe(() => db.select({ id: candidateFiles.id }).from(candidateFiles).where(and(eq(candidateFiles.candidateId, ctx.candidate.id), eq(candidateFiles.status, "rejected"))).limit(20), []);
    if (rejected.length) turns.push({ kind: "documents", text: language === "en" ? `Resend ${rejected.length} document(s) that need to be replaced.` : `Renvoyer ${rejected.length} pièce(s) à remplacer.` });
    const acks = await safe(() => db.select({ id: remoteAcknowledgements.id }).from(remoteAcknowledgements).where(and(eq(remoteAcknowledgements.candidateId, ctx.candidate.id), eq(remoteAcknowledgements.status, "pending"))).limit(20), []);
    if (acks.length) turns.push({ kind: "acknowledgement", text: language === "en" ? `Confirm ${acks.length} document(s) in “Remote support”.` : `Confirmer ${acks.length} document(s) dans « Accompagnement à distance ».` });
    const due = await safe(() => db.select({ label: paymentScheduleItems.label, dueOn: paymentScheduleItems.dueOn }).from(paymentScheduleItems).where(and(eq(paymentScheduleItems.candidateId, ctx.candidate.id), eq(paymentScheduleItems.status, "pending"))).orderBy(asc(paymentScheduleItems.dueOn)).limit(1), []);
    if (due[0]) turns.push({ kind: "payment", text: language === "en" ? `Pay “${due[0].label}” before ${due[0].dueOn}.` : `Régler « ${due[0].label} » avant le ${new Date(due[0].dueOn).toLocaleDateString("fr-FR")}.` });
    const unread = await safe(() => db.select({ id: candidateMessages.id }).from(candidateMessages).where(and(eq(candidateMessages.candidateId, ctx.candidate.id), eq(candidateMessages.senderRole, "advisor"), eq(candidateMessages.isRead, false))).limit(20), []);
    if (unread.length) turns.push({ kind: "messages", text: language === "en" ? `Read ${unread.length} new message(s) from your advisor.` : `Lire ${unread.length} nouveau(x) message(s) de votre conseiller.` });
    const nextSlot = await safe(async () => (await db.select({ startsAt: remoteSlots.startsAt, channel: remoteSlots.channel }).from(remoteSlots).where(and(eq(remoteSlots.candidateId, ctx.candidate.id), eq(remoteSlots.status, "booked"), gte(remoteSlots.startsAt, now))).orderBy(asc(remoteSlots.startsAt)).limit(1))[0] ?? null, null as { startsAt: Date; channel: string } | null);
    const times = [requests[0]?.last, lastAdvisor].filter((value): value is Date => Boolean(value)).map((value) => new Date(value).getTime());
    return {
      language,
      dossierLabel: dossierClientLabel(ctx.candidate.dossierStatus, language),
      teamDoing: workflowClientLabel(requests[0]?.status, language),
      lastTeamActivityAt: times.length ? new Date(Math.max(...times)).toISOString() : null,
      myTurn: turns,
      nextAppointmentAt: iso(nextSlot?.startsAt),
    };
  }),

  myTimeline: candidateProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const language = languageOf(ctx.candidate.preferredLanguage);
    const en = language === "en";
    const events: Array<{ at: string; kind: string; title: string; detail: string | null }> = [];
    for (const row of await safe(() => db.select({ title: clientNotifications.title, body: clientNotifications.body, at: clientNotifications.createdAt }).from(clientNotifications).where(eq(clientNotifications.candidateId, ctx.candidate.id)).orderBy(desc(clientNotifications.createdAt)).limit(50), [])) {
      events.push({ at: iso(row.at)!, kind: "notice", title: row.title, detail: row.body.slice(0, 240) });
    }
    for (const row of await safe(() => db.select({ name: candidateFiles.fileName, status: candidateFiles.status, reason: candidateFiles.rejectionReason, at: candidateFiles.uploadedAt }).from(candidateFiles).where(eq(candidateFiles.candidateId, ctx.candidate.id)).orderBy(desc(candidateFiles.uploadedAt)).limit(40), [])) {
      const label = row.status === "rejected" ? (en ? "Document to resend" : "Pièce à renvoyer") : row.status === "verified" ? (en ? "Document validated" : "Pièce validée") : (en ? "Document received" : "Pièce reçue");
      events.push({ at: iso(row.at)!, kind: "document", title: `${label} : ${row.name.slice(0, 80)}`, detail: row.status === "rejected" ? (row.reason ?? null) : null });
    }
    for (const row of await safe(() => db.select({ at: remoteSlots.startsAt, status: remoteSlots.status }).from(remoteSlots).where(and(eq(remoteSlots.candidateId, ctx.candidate.id), inArray(remoteSlots.status, ["booked", "done"]))).orderBy(desc(remoteSlots.startsAt)).limit(15), [])) {
      events.push({ at: iso(row.at)!, kind: "appointment", title: row.status === "done" ? (en ? "Online appointment held" : "Rendez-vous en ligne effectué") : (en ? "Online appointment booked" : "Rendez-vous en ligne réservé"), detail: null });
    }
    for (const row of await safe(() => db.select({ label: paymentScheduleItems.label, paidOn: paymentScheduleItems.paidOn }).from(paymentScheduleItems).where(and(eq(paymentScheduleItems.candidateId, ctx.candidate.id), eq(paymentScheduleItems.status, "paid"))).limit(20), [])) {
      if (row.paidOn) events.push({ at: new Date(row.paidOn).toISOString(), kind: "payment", title: `${en ? "Payment received" : "Paiement reçu"} : ${row.label}`, detail: null });
    }
    for (const row of await safe(() => db.select({ title: remoteAcknowledgements.title, at: remoteAcknowledgements.answeredAt }).from(remoteAcknowledgements).where(and(eq(remoteAcknowledgements.candidateId, ctx.candidate.id), eq(remoteAcknowledgements.status, "accepted"))).limit(20), [])) {
      if (row.at) events.push({ at: iso(row.at)!, kind: "acknowledgement", title: `${en ? "Confirmed" : "Confirmé"} : ${row.title}`, detail: null });
    }
    if (ctx.candidate.activeDossierSetAt) events.push({ at: iso(ctx.candidate.activeDossierSetAt)!, kind: "dossier", title: en ? "File opened" : "Dossier ouvert", detail: ctx.candidate.activeDossierNumber ?? null });
    events.sort((a, b) => b.at.localeCompare(a.at));
    return { language, fullName: ctx.candidate.fullName, reference: ctx.candidate.activeDossierNumber ?? `COMPTE-${String(ctx.candidate.id).padStart(5, "0")}`, events: events.slice(0, 100) };
  }),

  replyTime: candidateProcedure.query(async () => {
    const db = await requireDb();
    return safe(() => replyStats(db), { median: null, answered: 0 });
  }),

  myPreferences: candidateProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const prefs = await safe(async () => (await db.select().from(candidateNotificationPrefs).where(eq(candidateNotificationPrefs.candidateId, ctx.candidate.id)).limit(1))[0] ?? null, null);
    return {
      language: languageOf(ctx.candidate.preferredLanguage),
      emailEnabled: prefs ? prefs.emailEnabled === 1 : true,
      whatsappOptIn: prefs?.whatsappOptIn === null || prefs === null ? null : prefs.whatsappOptIn === 1,
      quietFrom: prefs?.quietFrom ?? null,
      quietTo: prefs?.quietTo ?? null,
    };
  }),

  savePreferences: candidateProcedure.input(z.object({
    language: z.enum(["fr", "en"]),
    emailEnabled: z.boolean(),
    whatsappOptIn: z.boolean().nullable(),
    quietFrom: z.number().int().min(0).max(23).nullable(),
    quietTo: z.number().int().min(0).max(23).nullable(),
  })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.update(candidates).set({ preferredLanguage: input.language }).where(eq(candidates.id, ctx.candidate.id));
    const values = {
      emailEnabled: input.emailEnabled ? 1 : 0,
      whatsappOptIn: input.whatsappOptIn === null ? null : input.whatsappOptIn ? 1 : 0,
      whatsappConsentedAt: input.whatsappOptIn ? new Date() : null,
      quietFrom: input.quietFrom, quietTo: input.quietTo,
    };
    const [existing] = await db.select({ id: candidateNotificationPrefs.id, whatsappOptIn: candidateNotificationPrefs.whatsappOptIn, consentedAt: candidateNotificationPrefs.whatsappConsentedAt }).from(candidateNotificationPrefs).where(eq(candidateNotificationPrefs.candidateId, ctx.candidate.id)).limit(1);
    // La date de consentement WhatsApp ne bouge que lorsque le choix change.
    if (existing) await db.update(candidateNotificationPrefs).set({ ...values, whatsappConsentedAt: input.whatsappOptIn ? (existing.whatsappOptIn === 1 && existing.consentedAt ? existing.consentedAt : new Date()) : null }).where(eq(candidateNotificationPrefs.id, existing.id));
    else await db.insert(candidateNotificationPrefs).values({ candidateId: ctx.candidate.id, ...values });
    return { ok: true as const };
  }),

  securityOverview: candidateProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const logins = await safe(() => recentLogins(db, ctx.candidate.id), []);
    return { lastLoginAt: iso(ctx.candidate.lastLoginAt), logins: logins.map((row) => ({ label: row.label ?? "Appareil inconnu", at: iso(row.at)! })) };
  }),

  /** Déconnecte tous les appareils, celui-ci compris : il faudra se reconnecter partout avec le mot de passe. */
  logoutEverywhere: candidateProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    await revokeAllSessions(db, ctx.candidate.id);
    return { ok: true as const };
  }),
});
