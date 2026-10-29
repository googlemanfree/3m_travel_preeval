import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, inArray, isNull, like, lte, notInArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { adminAccounts, adminNotifications, agencyDossiers, candidateMessages, candidates, documentClarificationRequests } from "../../drizzle/schema";
import { clientNotifications, unifiedClientRequests } from "../../drizzle/caseTrackingSchema";
import { caseNextActions, remoteAcknowledgements, remoteSlots } from "../../drizzle/remoteSupportSchema";
import {
  BLOCKED_AFTER_DAYS,
  BOOKING_NOTICE_HOURS,
  MAX_ACTIVE_BOOKINGS,
  MAX_PROBLEMS_PER_HOUR,
  MAX_SLOTS_PER_BATCH,
  PROBLEM_PREFIX,
  PROBLEM_TOPICS,
  REMINDER_WINDOW_HOURS,
  SLOT_CHANNELS,
  SLOT_CHANNEL_LABELS,
  buildHandoverSummary,
  canBookSlot,
  canCancelBooking,
  needsReminder,
  normalizeJoinUrl,
  typedNameMatches,
  waitingDays,
  waitingLevel,
  whatsappLink,
  type SlotChannel,
} from "../../shared/remoteSupport";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sendClientNotificationEmail } from "../emailService";
import { getOpeningPaymentEvidence } from "../services/openingPaymentEvidence";
import { adminLabel } from "../services/partnerProfiles";
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
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L'accompagnement à distance n'est pas encore activé : la migration 0091 doit être appliquée." });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment. Réessayez dans quelques instants." });
  }
}

const session = z.string().min(1).max(512);
const text = (max: number) => z.string().trim().max(max).nullish().transform((value) => (value ? value : null));
const optionalDay = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format AAAA-MM-JJ.").nullish().transform((value) => (value ? value : null));
const iso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : null);
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

async function audit(db: Db, admin: { id: number; email?: string | null }, action: string, resourceId: string | number, details: string) {
  await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action, resourceType: "remote_support", resourceId, details: details.slice(0, 300) });
}

/** Prévient le candidat dans son espace puis par e-mail ; un échec de notification ne fait jamais échouer l'action. */
async function notifyCandidate(db: Db, candidate: { id: number; email: string; fullName: string }, input: { type: string; title: string; body: string }) {
  try {
    await db.insert(clientNotifications).values({ candidateId: candidate.id, type: input.type, title: input.title, body: input.body, actionUrl: "/mon-espace", isRead: false });
  } catch {
    // Notification interne manquée : l'e-mail ci-dessous reste tenté.
  }
  try {
    return await sendClientNotificationEmail({ to: candidate.email, fullName: candidate.fullName, title: input.title, body: input.body, actionUrl: "/mon-espace", sourceLabel: "3M TRAVEL AGENCY" });
  } catch {
    return false;
  }
}

const slotWhen = (value: Date | string) => new Date(value).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Douala" });

/** Rappels des rendez-vous dans les 26 heures : appelé à la main depuis l'administration, ou par le planificateur quand il sera activé. */
export async function sendDueSlotReminders(db: Db, now: Date = new Date()): Promise<{ sent: number }> {
  const horizon = new Date(now.getTime() + REMINDER_WINDOW_HOURS * HOUR);
  const slots = await db.select().from(remoteSlots).where(and(eq(remoteSlots.status, "booked"), isNull(remoteSlots.reminderSentAt), gte(remoteSlots.startsAt, now), lte(remoteSlots.startsAt, horizon)));
  let sent = 0;
  for (const slot of slots) {
    if (!needsReminder(slot, now) || !slot.candidateId) continue;
    const [candidate] = await db.select({ id: candidates.id, email: candidates.email, fullName: candidates.fullName }).from(candidates).where(eq(candidates.id, slot.candidateId)).limit(1);
    if (!candidate) continue;
    await notifyCandidate(db, candidate, { type: "remote_reminder", title: "Rappel : votre rendez-vous en ligne", body: `Votre rendez-vous (${SLOT_CHANNEL_LABELS[slot.channel]}) a lieu ${slotWhen(slot.startsAt)} (heure du Cameroun). Retrouvez le lien dans votre espace client, rubrique Accompagnement à distance.` });
    await db.update(remoteSlots).set({ reminderSentAt: new Date() }).where(eq(remoteSlots.id, slot.id));
    sent += 1;
  }
  return { sent };
}

/**
 * Accompagnement à distance : rendez-vous en ligne, étape simple et bouton « j'ai un problème » côté candidat ; file « sans réponse »,
 * prochaine action, charge de travail, passation et accusés de réception côté administration.
 */
export const remoteSupportRouter = router({
  // ───────────── Candidat ─────────────
  myOverview: candidateProcedure.query(({ ctx }) => guarded(async () => {
    const db = await requireDb();
    const now = new Date();
    const mine = await db.select().from(remoteSlots).where(and(eq(remoteSlots.candidateId, ctx.candidate.id), inArray(remoteSlots.status, ["booked", "done"]), gte(remoteSlots.startsAt, new Date(now.getTime() - 30 * DAY)))).orderBy(asc(remoteSlots.startsAt)).limit(20);
    const open = await db.select({ id: remoteSlots.id, startsAt: remoteSlots.startsAt, durationMin: remoteSlots.durationMin, channel: remoteSlots.channel, topic: remoteSlots.topic })
      .from(remoteSlots).where(and(eq(remoteSlots.status, "open"), gte(remoteSlots.startsAt, new Date(now.getTime() + BOOKING_NOTICE_HOURS * HOUR)))).orderBy(asc(remoteSlots.startsAt)).limit(40);
    const acks = await db.select({ id: remoteAcknowledgements.id, title: remoteAcknowledgements.title, bodyText: remoteAcknowledgements.bodyText, status: remoteAcknowledgements.status, answeredAt: remoteAcknowledgements.answeredAt, createdAt: remoteAcknowledgements.createdAt })
      .from(remoteAcknowledgements).where(and(eq(remoteAcknowledgements.candidateId, ctx.candidate.id), inArray(remoteAcknowledgements.status, ["pending", "accepted", "declined"]))).orderBy(desc(remoteAcknowledgements.createdAt)).limit(12);
    const [step] = await db.select({ text: caseNextActions.candidateText, dueOn: caseNextActions.dueOn }).from(caseNextActions)
      .where(and(eq(caseNextActions.candidateId, ctx.candidate.id), eq(caseNextActions.status, "open"), eq(caseNextActions.candidateVisible, 1))).orderBy(desc(caseNextActions.updatedAt)).limit(1);
    return {
      nextStep: step?.text ? { text: step.text, dueOn: step.dueOn } : null,
      myBookings: mine.map((slot) => ({
        id: slot.id, startsAt: iso(slot.startsAt)!, durationMin: slot.durationMin, channel: slot.channel, topic: slot.topic, status: slot.status,
        joinUrl: slot.status === "booked" ? slot.joinUrl : null,
        canCancel: canCancelBooking(slot, now),
      })),
      openSlots: open.map((slot) => ({ id: slot.id, startsAt: iso(slot.startsAt)!, durationMin: slot.durationMin, channel: slot.channel, topic: slot.topic })),
      acknowledgements: acks.map((ack) => ({ id: ack.id, title: ack.title, body: ack.bodyText, status: ack.status, answeredAt: iso(ack.answeredAt) })),
    };
  })),

  bookSlot: candidateProcedure.input(z.object({ slotId: z.number().int().positive(), note: text(500) })).mutation(({ ctx, input }) => guarded(async () => {
    const db = await requireDb();
    const now = new Date();
    const [{ active = 0 } = { active: 0 }] = await db.select({ active: sql<number>`count(*)` }).from(remoteSlots).where(and(eq(remoteSlots.candidateId, ctx.candidate.id), eq(remoteSlots.status, "booked"), gte(remoteSlots.startsAt, now)));
    if (Number(active) >= MAX_ACTIVE_BOOKINGS) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Vous avez déjà ${MAX_ACTIVE_BOOKINGS} rendez-vous à venir. Annulez-en un ou attendez qu'il ait eu lieu.` });
    const [slot] = await db.select().from(remoteSlots).where(eq(remoteSlots.id, input.slotId)).limit(1);
    if (!slot || !canBookSlot(slot, now)) throw new TRPCError({ code: "CONFLICT", message: "Ce créneau n'est plus disponible. Choisissez-en un autre." });
    // La réservation n'aboutit que si le créneau est encore libre à l'instant de l'écriture : deux candidats ne peuvent pas le prendre ensemble.
    await db.update(remoteSlots).set({ status: "booked", candidateId: ctx.candidate.id, candidateNote: input.note, bookedAt: now }).where(and(eq(remoteSlots.id, slot.id), eq(remoteSlots.status, "open")));
    const [after] = await db.select({ status: remoteSlots.status, candidateId: remoteSlots.candidateId }).from(remoteSlots).where(eq(remoteSlots.id, slot.id)).limit(1);
    if (after?.status !== "booked" || after.candidateId !== ctx.candidate.id) throw new TRPCError({ code: "CONFLICT", message: "Ce créneau vient d'être pris. Choisissez-en un autre." });
    await notifyCandidate(db, ctx.candidate, { type: "remote_booking", title: "Rendez-vous en ligne confirmé", body: `Votre rendez-vous (${SLOT_CHANNEL_LABELS[slot.channel]}) est confirmé : ${slotWhen(slot.startsAt)} (heure du Cameroun). Le lien de connexion est dans votre espace client, rubrique Accompagnement à distance.` });
    try {
      await db.insert(adminNotifications).values({ type: "new_contact_message", title: "Rendez-vous en ligne réservé", message: `${ctx.candidate.fullName} — ${slotWhen(slot.startsAt)}`.slice(0, 1000), relatedId: `remote_slot:${slot.id}`, targetAdminType: "accompagnement" });
    } catch {
      // Notification admin manquée : la réservation reste valable.
    }
    return { ok: true as const };
  })),

  cancelBooking: candidateProcedure.input(z.object({ slotId: z.number().int().positive() })).mutation(({ ctx, input }) => guarded(async () => {
    const db = await requireDb();
    const [slot] = await db.select().from(remoteSlots).where(and(eq(remoteSlots.id, input.slotId), eq(remoteSlots.candidateId, ctx.candidate.id))).limit(1);
    if (!slot) throw new TRPCError({ code: "NOT_FOUND", message: "Rendez-vous introuvable." });
    if (!canCancelBooking(slot)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Un rendez-vous ne s'annule pas à moins de ${BOOKING_NOTICE_HOURS} heures de son début : contactez votre conseiller.` });
    await db.update(remoteSlots).set({ status: "open", candidateId: null, candidateNote: null, bookedAt: null, reminderSentAt: null }).where(eq(remoteSlots.id, slot.id));
    return { ok: true as const };
  })),

  acceptAcknowledgement: candidateProcedure.input(z.object({ id: z.number().int().positive(), typedName: z.string().trim().min(3).max(255), confirm: z.literal(true) })).mutation(({ ctx, input }) => guarded(async () => {
    const db = await requireDb();
    const [ack] = await db.select().from(remoteAcknowledgements).where(and(eq(remoteAcknowledgements.id, input.id), eq(remoteAcknowledgements.candidateId, ctx.candidate.id))).limit(1);
    if (!ack) throw new TRPCError({ code: "NOT_FOUND", message: "Accusé introuvable." });
    if (ack.status !== "pending") throw new TRPCError({ code: "CONFLICT", message: "Cet accusé a déjà reçu une réponse." });
    if (!typedNameMatches(input.typedName, ctx.candidate.fullName)) throw new TRPCError({ code: "BAD_REQUEST", message: "Saisissez votre nom complet tel qu'il figure sur votre compte pour confirmer." });
    const ip = String((ctx.req as { ip?: string } | undefined)?.ip ?? "");
    await db.update(remoteAcknowledgements).set({ status: "accepted", typedName: input.typedName, answeredAt: new Date(), ipHash: ip ? createHash("sha256").update(ip).digest("hex") : null }).where(and(eq(remoteAcknowledgements.id, ack.id), eq(remoteAcknowledgements.status, "pending")));
    try {
      await db.insert(adminNotifications).values({ type: "new_contact_message", title: "Accusé de réception confirmé", message: `${ctx.candidate.fullName} — ${ack.title}`.slice(0, 1000), relatedId: `remote_ack:${ack.id}`, targetAdminType: "accompagnement" });
    } catch {
      // Notification admin manquée : l'accusé est enregistré.
    }
    return { ok: true as const };
  })),

  declineAcknowledgement: candidateProcedure.input(z.object({ id: z.number().int().positive(), reason: z.string().trim().min(3).max(500) })).mutation(({ ctx, input }) => guarded(async () => {
    const db = await requireDb();
    const [ack] = await db.select().from(remoteAcknowledgements).where(and(eq(remoteAcknowledgements.id, input.id), eq(remoteAcknowledgements.candidateId, ctx.candidate.id))).limit(1);
    if (!ack) throw new TRPCError({ code: "NOT_FOUND", message: "Accusé introuvable." });
    if (ack.status !== "pending") throw new TRPCError({ code: "CONFLICT", message: "Cet accusé a déjà reçu une réponse." });
    await db.update(remoteAcknowledgements).set({ status: "declined", declineReason: input.reason, answeredAt: new Date() }).where(and(eq(remoteAcknowledgements.id, ack.id), eq(remoteAcknowledgements.status, "pending")));
    try {
      await db.insert(adminNotifications).values({ type: "new_contact_message", title: "Accusé de réception refusé", message: `${ctx.candidate.fullName} — ${ack.title} : ${input.reason}`.slice(0, 1000), relatedId: `remote_ack:${ack.id}`, targetAdminType: "accompagnement" });
    } catch {
      // Notification admin manquée : le refus est enregistré.
    }
    return { ok: true as const };
  })),

  reportProblem: candidateProcedure.input(z.object({ topic: z.enum(PROBLEM_TOPICS.map((item) => item.id) as [string, ...string[]]), details: text(1000) })).mutation(({ ctx, input }) => guarded(async () => {
    const db = await requireDb();
    const since = new Date(Date.now() - HOUR);
    const [{ recent = 0 } = { recent: 0 }] = await db.select({ recent: sql<number>`count(*)` }).from(candidateMessages).where(and(eq(candidateMessages.candidateId, ctx.candidate.id), eq(candidateMessages.senderRole, "candidate"), like(candidateMessages.content, `${PROBLEM_PREFIX}%`), gte(candidateMessages.createdAt, since)));
    if (Number(recent) >= MAX_PROBLEMS_PER_HOUR) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Votre demande d'aide a déjà été transmise : votre conseiller vous répond dès que possible." });
    const label = PROBLEM_TOPICS.find((item) => item.id === input.topic)?.label ?? "Autre difficulté";
    await db.insert(candidateMessages).values({ candidateId: ctx.candidate.id, senderRole: "candidate", content: `${PROBLEM_PREFIX} — ${label}${input.details ? `\n\n${input.details}` : ""}`, isRead: false });
    try {
      await db.insert(adminNotifications).values({ type: "new_contact_message", title: "Un candidat demande de l'aide", message: `${ctx.candidate.fullName} — ${label}`.slice(0, 1000), relatedId: `candidate_help:${ctx.candidate.id}`, targetAdminType: "accompagnement" });
    } catch {
      // Notification admin manquée : le message est dans le fil du dossier.
    }
    return { ok: true as const };
  })),

  // ───────────── Administration ─────────────
  adminFindCandidate: publicProcedure.input(z.object({ sessionToken: session, search: z.string().trim().min(2).max(120) })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const needle = `%${input.search.replace(/[%_]/g, "")}%`;
    return db.select({ id: candidates.id, fullName: candidates.fullName, email: candidates.email, phone: candidates.phone }).from(candidates)
      .where(and(isNull(candidates.deletedAt), or(like(candidates.fullName, needle), like(candidates.email, needle)))).orderBy(desc(candidates.id)).limit(10);
  })),

  adminSlots: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const now = Date.now();
    const rows = await db.select().from(remoteSlots).where(and(gte(remoteSlots.startsAt, new Date(now - 7 * DAY)), lte(remoteSlots.startsAt, new Date(now + 60 * DAY)))).orderBy(asc(remoteSlots.startsAt)).limit(300);
    const ids = Array.from(new Set(rows.map((row) => row.candidateId).filter((id): id is number => Boolean(id))));
    const people = ids.length ? await db.select({ id: candidates.id, fullName: candidates.fullName, phone: candidates.phone }).from(candidates).where(inArray(candidates.id, ids)) : [];
    return rows.map((row) => {
      const person = people.find((item) => item.id === row.candidateId);
      return {
        id: row.id, startsAt: iso(row.startsAt)!, durationMin: row.durationMin, channel: row.channel, joinUrl: row.joinUrl, topic: row.topic, status: row.status,
        candidateId: row.candidateId, candidateName: person?.fullName ?? null, candidatePhone: person?.phone ?? null, candidateNote: row.candidateNote, minutesText: row.minutesText,
        reminderSentAt: iso(row.reminderSentAt),
      };
    });
  })),

  adminCreateSlots: publicProcedure.input(z.object({
    sessionToken: session,
    startsAt: z.array(z.string().datetime()).min(1).max(MAX_SLOTS_PER_BATCH),
    durationMin: z.number().int().min(10).max(120).default(30),
    channel: z.enum(SLOT_CHANNELS),
    joinUrl: text(500),
    topic: text(200),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    let joinUrl: string | null = null;
    if (input.channel === "video") {
      const checked = normalizeJoinUrl(input.joinUrl ?? "");
      if (checked.ok === false) throw new TRPCError({ code: "BAD_REQUEST", message: checked.error });
      joinUrl = checked.url;
    } else if (input.joinUrl) {
      const checked = normalizeJoinUrl(input.joinUrl);
      if (checked.ok === false) throw new TRPCError({ code: "BAD_REQUEST", message: checked.error });
      joinUrl = checked.url;
    }
    const now = Date.now();
    const times = Array.from(new Set(input.startsAt.map((value) => new Date(value).getTime()))).filter((time) => time > now + BOOKING_NOTICE_HOURS * HOUR);
    if (times.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Choisissez des horaires à venir (au moins 2 heures à l'avance)." });
    await db.insert(remoteSlots).values(times.map((time) => ({ startsAt: new Date(time), durationMin: input.durationMin, channel: input.channel as SlotChannel, joinUrl, topic: input.topic, createdBy: adminLabel(admin) })));
    await audit(db, admin, "remote_slots.created", "batch", `${times.length} créneau(x) ${input.channel}`);
    return { created: times.length };
  })),

  adminCancelSlot: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive(), reason: text(300) })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [slot] = await db.select().from(remoteSlots).where(eq(remoteSlots.id, input.id)).limit(1);
    if (!slot) throw new TRPCError({ code: "NOT_FOUND", message: "Créneau introuvable." });
    if (slot.status === "done" || slot.status === "cancelled") throw new TRPCError({ code: "CONFLICT", message: "Ce créneau est déjà clos." });
    await db.update(remoteSlots).set({ status: "cancelled" }).where(eq(remoteSlots.id, slot.id));
    if (slot.status === "booked" && slot.candidateId) {
      const [candidate] = await db.select({ id: candidates.id, email: candidates.email, fullName: candidates.fullName }).from(candidates).where(eq(candidates.id, slot.candidateId)).limit(1);
      if (candidate) await notifyCandidate(db, candidate, { type: "remote_cancelled", title: "Rendez-vous en ligne annulé", body: `Votre rendez-vous du ${slotWhen(slot.startsAt)} a été annulé par votre conseiller${input.reason ? ` (${input.reason})` : ""}. Vous pouvez en réserver un autre depuis votre espace client.` });
    }
    await audit(db, admin, "remote_slots.cancelled", slot.id, input.reason ?? "annulation");
    return { ok: true as const };
  })),

  adminCloseSlot: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive(), outcome: z.enum(["done", "no_show"]), minutes: text(4000) })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [slot] = await db.select().from(remoteSlots).where(eq(remoteSlots.id, input.id)).limit(1);
    if (!slot || slot.status !== "booked") throw new TRPCError({ code: "CONFLICT", message: "Seul un rendez-vous réservé peut être clos." });
    await db.update(remoteSlots).set({ status: input.outcome, minutesText: input.minutes }).where(eq(remoteSlots.id, slot.id));
    await audit(db, admin, "remote_slots.closed", slot.id, input.outcome);
    return { ok: true as const };
  })),

  adminSendDueReminders: publicProcedure.input(z.object({ sessionToken: session })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const result = await sendDueSlotReminders(db);
    await audit(db, admin, "remote_slots.reminders_sent", "batch", `${result.sent} rappel(s)`);
    return result;
  })),

  /** Candidats dont le dernier message attend une réponse du conseiller. */
  adminWaiting: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const now = new Date();
    const recent = await db.select({ candidateId: candidateMessages.candidateId, senderRole: candidateMessages.senderRole, content: candidateMessages.content, createdAt: candidateMessages.createdAt })
      .from(candidateMessages).where(gte(candidateMessages.createdAt, new Date(now.getTime() - 90 * DAY))).orderBy(desc(candidateMessages.createdAt)).limit(5000);
    const latest = new Map<number, (typeof recent)[number]>();
    for (const message of recent) if (!latest.has(message.candidateId)) latest.set(message.candidateId, message);
    const waiting = Array.from(latest.values()).filter((message) => message.senderRole === "candidate");
    const ids = waiting.map((message) => message.candidateId);
    const people = ids.length ? await db.select({ id: candidates.id, fullName: candidates.fullName, phone: candidates.phone, email: candidates.email }).from(candidates).where(and(inArray(candidates.id, ids), isNull(candidates.deletedAt))) : [];
    return waiting.flatMap((message) => {
      const person = people.find((item) => item.id === message.candidateId);
      if (!person) return [];
      const days = waitingDays(message.createdAt, now);
      return [{ candidateId: person.id, fullName: person.fullName, phone: person.phone, lastMessage: message.content.slice(0, 220), lastAt: iso(message.createdAt)!, days, level: waitingLevel(days), isHelpRequest: message.content.startsWith(PROBLEM_PREFIX) }];
    }).sort((a, b) => b.days - a.days).slice(0, 120);
  })),

  adminReply: publicProcedure.input(z.object({ sessionToken: session, candidateId: z.number().int().positive(), content: z.string().trim().min(1).max(2000) })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [candidate] = await db.select({ id: candidates.id, email: candidates.email, fullName: candidates.fullName }).from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
    if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
    const notification = await db.insert(clientNotifications).values({ candidateId: candidate.id, type: "admin_message", title: "Nouveau message de 3M TRAVEL AGENCY", body: input.content, actionUrl: "/mon-espace", isRead: false });
    const notificationId = Number((notification as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    const emailSent = await sendClientNotificationEmail({ to: candidate.email, fullName: candidate.fullName, title: "Nouveau message de 3M TRAVEL AGENCY", body: input.content, actionUrl: "/mon-espace", sourceLabel: "3M TRAVEL AGENCY" }).catch(() => false);
    await db.insert(candidateMessages).values({ candidateId: candidate.id, notificationId: notificationId || null, senderRole: "advisor", content: input.content, isRead: false });
    if (emailSent && notificationId > 0) await db.update(clientNotifications).set({ emailSentAt: new Date() }).where(eq(clientNotifications.id, notificationId));
    await audit(db, admin, "remote_support.reply", candidate.id, "réponse depuis la file « sans réponse »");
    return { ok: true as const, emailSent: Boolean(emailSent), whatsapp: null as string | null };
  })),

  adminActions: publicProcedure.input(z.object({ sessionToken: session, scope: z.enum(["mine", "all"]) })).query(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(caseNextActions)
      .where(and(eq(caseNextActions.status, "open"), input.scope === "mine" ? eq(caseNextActions.ownerAdminId, admin.id) : sql`1=1`))
      .orderBy(asc(sql`COALESCE(${caseNextActions.dueOn}, '9999-12-31')`), asc(caseNextActions.id)).limit(300);
    const ids = Array.from(new Set(rows.map((row) => row.candidateId)));
    const people = ids.length ? await db.select({ id: candidates.id, fullName: candidates.fullName }).from(candidates).where(inArray(candidates.id, ids)) : [];
    const today = new Date().toISOString().slice(0, 10);
    return rows.map((row) => ({
      id: row.id, candidateId: row.candidateId, candidateName: people.find((item) => item.id === row.candidateId)?.fullName ?? "Candidat",
      action: row.action, ownerAdminId: row.ownerAdminId, ownerLabel: row.ownerLabel, dueOn: row.dueOn, overdue: Boolean(row.dueOn && row.dueOn < today),
      dueToday: row.dueOn === today, candidateVisible: row.candidateVisible === 1, candidateText: row.candidateText,
    }));
  })),

  adminSaveAction: publicProcedure.input(z.object({
    sessionToken: session,
    candidateId: z.number().int().positive(),
    action: z.string().trim().min(3).max(300),
    dueOn: optionalDay,
    ownerAdminId: z.number().int().positive().nullish().transform((value) => value ?? null),
    candidateText: text(300),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [candidate] = await db.select({ id: candidates.id }).from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
    if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
    const ownerId = input.ownerAdminId ?? admin.id;
    const [owner] = await db.select({ id: adminAccounts.id, fullName: adminAccounts.fullName }).from(adminAccounts).where(eq(adminAccounts.id, ownerId)).limit(1);
    if (!owner) throw new TRPCError({ code: "NOT_FOUND", message: "Responsable introuvable." });
    // Une seule prochaine action ouverte par dossier : la nouvelle remplace la précédente (l'ancienne est annulée, pas effacée).
    await db.update(caseNextActions).set({ status: "cancelled", doneAt: new Date() }).where(and(eq(caseNextActions.candidateId, candidate.id), eq(caseNextActions.status, "open")));
    await db.insert(caseNextActions).values({
      candidateId: candidate.id, action: input.action, ownerAdminId: owner.id, ownerLabel: owner.fullName, dueOn: input.dueOn,
      candidateVisible: input.candidateText ? 1 : 0, candidateText: input.candidateText, createdBy: adminLabel(admin),
    });
    await audit(db, admin, "next_action.saved", candidate.id, input.action);
    return { ok: true as const };
  })),

  adminResolveAction: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive(), outcome: z.enum(["done", "cancelled"]) })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await db.update(caseNextActions).set({ status: input.outcome, doneAt: new Date() }).where(and(eq(caseNextActions.id, input.id), eq(caseNextActions.status, "open")));
    await audit(db, admin, `next_action.${input.outcome}`, input.id, input.outcome);
    return { ok: true as const };
  })),

  /** Charge par agent, dossiers bloqués et étape où ils s'arrêtent. */
  adminWorkload: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const now = Date.now();
    const open = await db.select({ id: unifiedClientRequests.id, status: unifiedClientRequests.workflowStatus, assigned: unifiedClientRequests.assignedAdminAccountId, last: unifiedClientRequests.lastActivityAt, due: unifiedClientRequests.dueAt })
      .from(unifiedClientRequests).where(notInArray(unifiedClientRequests.workflowStatus, ["completed", "closed", "rejected"])).limit(6000);
    const admins = await db.select({ id: adminAccounts.id, fullName: adminAccounts.fullName }).from(adminAccounts);
    const today = new Date().toISOString().slice(0, 10);
    const actions = await db.select({ owner: caseNextActions.ownerAdminId, dueOn: caseNextActions.dueOn }).from(caseNextActions).where(eq(caseNextActions.status, "open")).limit(3000);
    const isBlocked = (last: Date | string) => now - new Date(last).getTime() > BLOCKED_AFTER_DAYS * DAY;
    const byOwner = new Map<number | null, { open: number; blocked: number; overdue: number; actionsOverdue: number; actionsOpen: number }>();
    const slot = (key: number | null) => { if (!byOwner.has(key)) byOwner.set(key, { open: 0, blocked: 0, overdue: 0, actionsOverdue: 0, actionsOpen: 0 }); return byOwner.get(key)!; };
    const byStatus = new Map<string, { open: number; blocked: number }>();
    for (const row of open) {
      const entry = slot(row.assigned ?? null);
      entry.open += 1;
      const blocked = isBlocked(row.last);
      if (blocked) entry.blocked += 1;
      if (row.due && new Date(row.due).getTime() < now) entry.overdue += 1;
      const stage = byStatus.get(row.status) ?? { open: 0, blocked: 0 };
      stage.open += 1;
      if (blocked) stage.blocked += 1;
      byStatus.set(row.status, stage);
    }
    for (const action of actions) {
      const entry = slot(action.owner ?? null);
      entry.actionsOpen += 1;
      if (action.dueOn && action.dueOn < today) entry.actionsOverdue += 1;
    }
    return {
      blockedAfterDays: BLOCKED_AFTER_DAYS,
      totalOpen: open.length,
      totalBlocked: open.filter((row) => isBlocked(row.last)).length,
      agents: Array.from(byOwner.entries()).map(([id, value]) => ({ adminId: id, label: id === null ? "Non assigné" : admins.find((item) => item.id === id)?.fullName ?? `Agent #${id}`, ...value })).sort((a, b) => b.open - a.open),
      stages: Array.from(byStatus.entries()).map(([status, value]) => ({ status, ...value })).sort((a, b) => b.blocked - a.blocked || b.open - a.open),
    };
  })),

  adminHandover: publicProcedure.input(z.object({ sessionToken: session, candidateId: z.number().int().positive() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
    if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
    const [evidence, requests, messages, [clarifications], actions, slots, acks, dossiers, admins] = await Promise.all([
      getOpeningPaymentEvidence(db, { id: candidate.id, email: candidate.email }),
      db.select({ label: unifiedClientRequests.requestTypeLabel, destination: unifiedClientRequests.destination, status: unifiedClientRequests.workflowStatus, last: unifiedClientRequests.lastActivityAt, assigned: unifiedClientRequests.assignedAdminAccountId })
        .from(unifiedClientRequests).where(and(eq(unifiedClientRequests.candidateId, candidate.id), notInArray(unifiedClientRequests.workflowStatus, ["completed", "closed", "rejected"]))).orderBy(desc(unifiedClientRequests.lastActivityAt)).limit(8),
      db.select({ from: candidateMessages.senderRole, at: candidateMessages.createdAt, content: candidateMessages.content }).from(candidateMessages).where(eq(candidateMessages.candidateId, candidate.id)).orderBy(desc(candidateMessages.createdAt)).limit(5),
      db.select({ total: sql<number>`count(*)` }).from(documentClarificationRequests).where(and(eq(documentClarificationRequests.candidateId, candidate.id), eq(documentClarificationRequests.status, "pending"))),
      db.select().from(caseNextActions).where(and(eq(caseNextActions.candidateId, candidate.id), eq(caseNextActions.status, "open"))).limit(6),
      db.select().from(remoteSlots).where(and(eq(remoteSlots.candidateId, candidate.id), eq(remoteSlots.status, "booked"), gte(remoteSlots.startsAt, new Date()))).orderBy(asc(remoteSlots.startsAt)).limit(4),
      db.select({ title: remoteAcknowledgements.title }).from(remoteAcknowledgements).where(and(eq(remoteAcknowledgements.candidateId, candidate.id), eq(remoteAcknowledgements.status, "pending"))).limit(6),
      db.select({ id: agencyDossiers.id }).from(agencyDossiers).where(and(isNull(agencyDossiers.deletedAt), sql`LOWER(${agencyDossiers.email}) = LOWER(${candidate.email})`)).limit(1),
      db.select({ id: adminAccounts.id, fullName: adminAccounts.fullName }).from(adminAccounts),
    ]);
    void dossiers;
    const summary = buildHandoverSummary({
      generatedOn: new Date(),
      candidate: { fullName: candidate.fullName, email: candidate.email, phone: candidate.phone, nationality: candidate.nationality, destination: candidate.destination, visaType: candidate.visaType, dossierStatus: candidate.dossierStatus, activeDossierNumber: candidate.activeDossierNumber },
      payment: { ok: evidence.ok, source: evidence.source },
      requests: requests.map((row) => ({ label: row.label, destination: row.destination, status: row.status, lastActivityAt: row.last, assignedTo: row.assigned ? admins.find((item) => item.id === row.assigned)?.fullName ?? null : null })),
      lastMessages: messages.map((row) => ({ from: row.from === "candidate" ? "candidat" as const : "conseiller" as const, at: row.at, text: row.content })),
      pendingClarifications: Number(clarifications?.total ?? 0),
      nextActions: actions.map((row) => ({ action: row.action, owner: row.ownerLabel, dueOn: row.dueOn })),
      upcomingSlots: slots.map((row) => ({ startsAt: row.startsAt, channel: row.channel, topic: row.topic })),
      pendingAcknowledgements: acks.map((row) => row.title),
    });
    return { summary, whatsapp: whatsappLink(candidate.phone, "") };
  })),

  adminAcknowledgements: publicProcedure.input(z.object({ sessionToken: session })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(remoteAcknowledgements).orderBy(desc(remoteAcknowledgements.createdAt)).limit(150);
    const ids = Array.from(new Set(rows.map((row) => row.candidateId)));
    const people = ids.length ? await db.select({ id: candidates.id, fullName: candidates.fullName }).from(candidates).where(inArray(candidates.id, ids)) : [];
    return rows.map((row) => ({ id: row.id, candidateId: row.candidateId, candidateName: people.find((item) => item.id === row.candidateId)?.fullName ?? "Candidat", title: row.title, status: row.status, typedName: row.typedName, declineReason: row.declineReason, answeredAt: iso(row.answeredAt), createdAt: iso(row.createdAt)!, bodyHash: row.bodyHash }));
  })),

  adminCreateAcknowledgement: publicProcedure.input(z.object({ sessionToken: session, candidateId: z.number().int().positive(), title: z.string().trim().min(5).max(200), body: z.string().trim().min(20).max(4000) })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [candidate] = await db.select({ id: candidates.id, email: candidates.email, fullName: candidates.fullName }).from(candidates).where(eq(candidates.id, input.candidateId)).limit(1);
    if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Compte candidat introuvable." });
    const hash = createHash("sha256").update(`${input.title}\n${input.body}`).digest("hex");
    const created = await db.insert(remoteAcknowledgements).values({ candidateId: candidate.id, title: input.title, bodyText: input.body, bodyHash: hash, createdBy: adminLabel(admin) });
    const id = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    await notifyCandidate(db, candidate, { type: "remote_ack", title: "Un document attend votre confirmation", body: `Votre conseiller vous demande de confirmer : « ${input.title} ». Lisez-le puis confirmez depuis votre espace client, rubrique Accompagnement à distance.` });
    await audit(db, admin, "acknowledgement.created", id, input.title);
    return { id };
  })),

  adminCancelAcknowledgement: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await db.update(remoteAcknowledgements).set({ status: "cancelled" }).where(and(eq(remoteAcknowledgements.id, input.id), eq(remoteAcknowledgements.status, "pending")));
    await audit(db, admin, "acknowledgement.cancelled", input.id, "annulé avant réponse");
    return { ok: true as const };
  })),
});
