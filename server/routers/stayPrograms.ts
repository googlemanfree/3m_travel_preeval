import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import { adminNotifications, candidates, clientNotifications } from "../../drizzle/schema";
import { stayPrograms, stayRequestEvents, stayRequests } from "../../drizzle/stayProgramsSchema";
import {
  MAX_ACTIVE_STAY_REQUESTS,
  MAX_TRAVELERS,
  STAY_CATEGORIES,
  STAY_CONSENT_VERSION,
  STAY_REQUEST_CLIENT_NEXT,
  STAY_REQUEST_LABELS,
  STAY_REQUEST_STATUSES,
  STAY_STATUSES,
  TERMINAL_STAY_STATUSES,
  isStayStatusChangeAllowed,
  stayPriceLabel,
  stayPublishBlockers,
  type StayRequestStatus,
} from "../../shared/stayPrograms";
import { WORLD_COUNTRY_ROWS } from "../../shared/worldCountries";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { adminLabel } from "../services/partnerProfiles";
import { recordPrivacyEvent } from "../services/privacyAudit";
import { requireValidAdminSession } from "./adminAuth";
import { candidateProcedure } from "./candidate";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
const WORLD_CODES = new Set(WORLD_COUNTRY_ROWS.map((row) => row[0]));

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
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Les séjours ne sont pas encore activés : la migration 0090 doit être appliquée." });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment. Réessayez dans quelques instants." });
  }
}

const session = z.string().min(1).max(512);
const countryCode = z.string().trim().length(2).transform((value) => value.toUpperCase()).refine((value) => WORLD_CODES.has(value), "Pays inconnu.");
const text = (max: number) => z.string().trim().max(max).nullish().transform((value) => (value ? value : null));
const optionalDay = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format AAAA-MM-JJ.").nullish().transform((value) => (value ? value : null));
const optionalInt = (max: number) => z.number().int().min(1).max(max).nullish().transform((value) => value ?? null);
const iso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : null);

async function audit(db: Db, admin: { id: number; email?: string | null }, action: string, resourceId: string | number, details: string) {
  await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action, resourceType: "stay_programs", resourceId, details: details.slice(0, 300) });
}

export const stayProgramsRouter = router({
  // ─── Candidat ──────────────────────────────────────────────────────────────────────────────────

  /** Séjours publiés d'un pays : sans prestataire ni provenance du prix ; le prix n'apparaît que complet et relu récemment. */
  programs: publicProcedure.input(z.object({ countryCode })).query(({ input }) => guarded(async () => {
    const db = await requireDb();
    const rows = await db.select().from(stayPrograms).where(and(eq(stayPrograms.countryCode, input.countryCode), eq(stayPrograms.status, "published"))).orderBy(asc(stayPrograms.title));
    return rows.map((row) => ({
      id: row.id,
      city: row.city,
      title: row.title,
      category: row.category,
      summary: row.summary,
      description: row.description,
      durationDaysMin: row.durationDaysMin,
      durationDaysMax: row.durationDaysMax,
      seasonNote: row.seasonNote,
      includedNote: row.includedNote,
      visaNote: row.visaNote,
      priceLabel: stayPriceLabel(row),
    }));
  })),

  myRequests: candidateProcedure.query(({ ctx }) => guarded(async () => {
    const db = await requireDb();
    const rows = await db.select().from(stayRequests).where(eq(stayRequests.candidateId, ctx.candidate.id)).orderBy(desc(stayRequests.submittedAt));
    if (rows.length === 0) return [];
    const programs = await db.select({ id: stayPrograms.id, title: stayPrograms.title, countryCode: stayPrograms.countryCode }).from(stayPrograms).where(inArray(stayPrograms.id, rows.map((row) => row.programId)));
    return rows.map((row) => ({
      id: row.id,
      programId: row.programId,
      title: programs.find((item) => item.id === row.programId)?.title ?? "Séjour",
      status: row.status,
      statusLabel: STAY_REQUEST_LABELS[row.status],
      next: STAY_REQUEST_CLIENT_NEXT[row.status],
      preferredStart: row.preferredStart,
      travelers: row.travelers,
      submittedAt: iso(row.submittedAt),
      lastStatusAt: iso(row.lastStatusAt),
      canCancel: row.status === "requested" || row.status === "quote_prepared",
    }));
  })),

  requestStay: candidateProcedure.input(z.object({
    programId: z.number().int().positive(),
    consent: z.boolean().refine((value) => value === true, "Votre accord est nécessaire pour que l'agence prépare un devis."),
    preferredStart: optionalDay,
    travelers: z.number().int().min(1).max(MAX_TRAVELERS).default(1),
    note: text(1000),
  })).mutation(({ ctx, input }) => guarded(async () => {
    const db = await requireDb();
    const [program] = await db.select().from(stayPrograms).where(and(eq(stayPrograms.id, input.programId), eq(stayPrograms.status, "published"))).limit(1);
    if (!program) throw new TRPCError({ code: "NOT_FOUND", message: "Ce séjour n'est plus proposé." });
    const [existing] = await db.select({ id: stayRequests.id, status: stayRequests.status }).from(stayRequests).where(and(eq(stayRequests.candidateId, ctx.candidate.id), eq(stayRequests.programId, program.id))).limit(1);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Vous avez déjà demandé ce séjour : votre conseiller vous répond dans votre espace." });
    const [{ active = 0 } = { active: 0 }] = await db.select({ active: sql<number>`count(*)` }).from(stayRequests).where(and(eq(stayRequests.candidateId, ctx.candidate.id), notInArray(stayRequests.status, [...TERMINAL_STAY_STATUSES])));
    if (Number(active) >= MAX_ACTIVE_STAY_REQUESTS) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Vous avez déjà ${MAX_ACTIVE_STAY_REQUESTS} demandes en cours. Annulez-en une ou parlez-en à votre conseiller.` });

    const created = await db.insert(stayRequests).values({
      candidateId: ctx.candidate.id,
      programId: program.id,
      preferredStart: input.preferredStart,
      travelers: input.travelers,
      consentTextVersion: STAY_CONSENT_VERSION,
      candidateNote: input.note,
    });
    const requestId = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    await db.insert(stayRequestEvents).values({ requestId, actorType: "candidate", actorId: ctx.candidate.id, action: "requested", note: program.title.slice(0, 1000) });
    try {
      await db.insert(adminNotifications).values({
        type: "new_contact_message",
        title: "Nouvelle demande de séjour",
        message: `${ctx.candidate.fullName} — ${program.title} (${input.travelers} voyageur${input.travelers > 1 ? "s" : ""})`.slice(0, 1000),
        relatedId: `stay_request:${requestId}`,
        targetAdminType: "accompagnement",
      });
      await db.insert(clientNotifications).values({
        candidateId: ctx.candidate.id,
        type: "stay_request",
        title: "Demande de séjour reçue",
        body: `Votre demande pour « ${program.title} » est reçue. Votre conseiller prépare un devis.`,
        actionUrl: "/mon-espace",
        isRead: false,
      });
    } catch {
      // Les notifications ne doivent jamais faire échouer la demande elle-même.
    }
    return { id: requestId };
  })),

  cancelRequest: candidateProcedure.input(z.object({ requestId: z.number().int().positive() })).mutation(({ ctx, input }) => guarded(async () => {
    const db = await requireDb();
    const [row] = await db.select().from(stayRequests).where(and(eq(stayRequests.id, input.requestId), eq(stayRequests.candidateId, ctx.candidate.id))).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Demande introuvable." });
    if (row.status !== "requested" && row.status !== "quote_prepared") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cette demande ne peut plus être annulée ici : contactez votre conseiller." });
    await db.update(stayRequests).set({ status: "cancelled", lastStatusAt: new Date() }).where(eq(stayRequests.id, row.id));
    await db.insert(stayRequestEvents).values({ requestId: row.id, actorType: "candidate", actorId: ctx.candidate.id, action: "cancelled" });
    return { ok: true as const };
  })),

  // ─── Administration ────────────────────────────────────────────────────────────────────────────

  adminPrograms: publicProcedure.input(z.object({ sessionToken: session, countryCode: countryCode.optional() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(stayPrograms).where(input.countryCode ? eq(stayPrograms.countryCode, input.countryCode) : undefined).orderBy(asc(stayPrograms.countryCode), asc(stayPrograms.title)).limit(500);
    const counts = rows.length ? await db.select({ programId: stayRequests.programId, total: sql<number>`count(*)` }).from(stayRequests).where(inArray(stayRequests.programId, rows.map((row) => row.id))).groupBy(stayRequests.programId) : [];
    return rows.map((row) => ({
      ...row,
      priceFrom: row.priceFrom,
      checkedAt: iso(row.checkedAt),
      priceCheckedAt: iso(row.priceCheckedAt),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
      requestsCount: Number(counts.find((item) => item.programId === row.id)?.total ?? 0),
    }));
  })),

  adminSaveProgram: publicProcedure.input(z.object({
    sessionToken: session,
    id: z.number().int().positive().optional(),
    countryCode,
    city: text(120),
    title: z.string().trim().min(3).max(255),
    category: z.enum(STAY_CATEGORIES),
    summary: z.string().trim().min(1).max(500),
    description: z.string().trim().min(1).max(8000),
    durationDaysMin: optionalInt(365),
    durationDaysMax: optionalInt(365),
    seasonNote: text(300),
    includedNote: text(1000),
    visaNote: text(1000),
    priceFrom: z.union([z.string().trim(), z.number()]).nullish().transform((value) => (value === null || value === undefined || value === "" ? null : String(value))),
    priceCurrency: z.string().trim().toUpperCase().max(3).nullish().transform((value) => (value ? value : null)),
    priceBasis: text(80),
    priceSourceNote: text(500),
    providerNote: text(500),
    status: z.enum(STAY_STATUSES),
    reviewedToday: z.boolean().default(false),
    priceReviewedToday: z.boolean().default(false),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [previous] = input.id ? await db.select().from(stayPrograms).where(eq(stayPrograms.id, input.id)).limit(1) : [];
    if (input.id && !previous) throw new TRPCError({ code: "NOT_FOUND", message: "Séjour introuvable." });
    const now = new Date();
    const checkedAt = input.reviewedToday ? now : previous?.checkedAt ?? null;
    const priceChanged = Boolean(previous) && (String(previous!.priceFrom ?? "") !== String(input.priceFrom ?? "") || (previous!.priceCurrency ?? null) !== input.priceCurrency);
    const priceCheckedAt = input.priceReviewedToday ? now : priceChanged ? null : previous?.priceCheckedAt ?? null;
    if (input.status === "published") {
      const blockers = stayPublishBlockers({
        title: input.title, summary: input.summary, description: input.description, visaNote: input.visaNote, includedNote: input.includedNote, seasonNote: input.seasonNote,
        durationDaysMin: input.durationDaysMin, durationDaysMax: input.durationDaysMax, checkedAt,
        price: { priceFrom: input.priceFrom, priceCurrency: input.priceCurrency, priceBasis: input.priceBasis, priceSourceNote: input.priceSourceNote, priceCheckedAt },
      });
      if (blockers.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Publication impossible : ${blockers.join(" ")}` });
    }
    const { id } = input;
    const values = {
      countryCode: input.countryCode, city: input.city, title: input.title, category: input.category, summary: input.summary, description: input.description,
      durationDaysMin: input.durationDaysMin, durationDaysMax: input.durationDaysMax, seasonNote: input.seasonNote, includedNote: input.includedNote, visaNote: input.visaNote,
      priceFrom: input.priceFrom, priceCurrency: input.priceCurrency, priceBasis: input.priceBasis, priceSourceNote: input.priceSourceNote, providerNote: input.providerNote,
      status: input.status, checkedAt, priceCheckedAt,
    };
    let savedId = id ?? 0;
    if (id) await db.update(stayPrograms).set(values).where(eq(stayPrograms.id, id));
    else {
      const created = await db.insert(stayPrograms).values(values);
      savedId = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    }
    await audit(db, admin, "stay_programs.saved", savedId, `${input.countryCode} ${input.title} -> ${input.status}`);
    return { id: savedId };
  })),

  /** Un séjour qui a reçu des demandes est retiré (réversible) ; sinon il est supprimé. */
  adminDeleteProgram: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [{ total = 0 } = { total: 0 }] = await db.select({ total: sql<number>`count(*)` }).from(stayRequests).where(eq(stayRequests.programId, input.id));
    if (Number(total) > 0) {
      await db.update(stayPrograms).set({ status: "retired" }).where(eq(stayPrograms.id, input.id));
      await audit(db, admin, "stay_programs.retired", input.id, `${total} demande(s) conservée(s)`);
      return { ok: true as const, retired: true };
    }
    await db.delete(stayPrograms).where(eq(stayPrograms.id, input.id));
    await audit(db, admin, "stay_programs.deleted", input.id, "séjour sans demande supprimé");
    return { ok: true as const, retired: false };
  })),

  adminRequests: publicProcedure.input(z.object({ sessionToken: session, status: z.enum(STAY_REQUEST_STATUSES).optional() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(stayRequests).where(input.status ? eq(stayRequests.status, input.status) : undefined).orderBy(desc(stayRequests.lastStatusAt)).limit(200);
    if (rows.length === 0) return [];
    const programs = await db.select({ id: stayPrograms.id, title: stayPrograms.title, countryCode: stayPrograms.countryCode }).from(stayPrograms).where(inArray(stayPrograms.id, rows.map((row) => row.programId)));
    const people = await db.select({ id: candidates.id, fullName: candidates.fullName, email: candidates.email, phone: candidates.phone }).from(candidates).where(inArray(candidates.id, rows.map((row) => row.candidateId)));
    return rows.map((row) => {
      const program = programs.find((item) => item.id === row.programId);
      const person = people.find((item) => item.id === row.candidateId);
      return {
        id: row.id,
        candidateId: row.candidateId,
        candidateName: person?.fullName ?? "Candidat",
        candidateEmail: person?.email ?? null,
        candidatePhone: person?.phone ?? null,
        programTitle: program?.title ?? "Séjour",
        countryCode: program?.countryCode ?? null,
        status: row.status,
        preferredStart: row.preferredStart,
        travelers: row.travelers,
        candidateNote: row.candidateNote,
        adminNote: row.adminNote,
        submittedAt: iso(row.submittedAt),
        lastStatusAt: iso(row.lastStatusAt),
      };
    });
  })),

  adminSetRequestStatus: publicProcedure.input(z.object({
    sessionToken: session,
    requestId: z.number().int().positive(),
    status: z.enum(STAY_REQUEST_STATUSES),
    adminNote: text(2000),
    notifyCandidate: z.boolean().default(true),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [row] = await db.select().from(stayRequests).where(eq(stayRequests.id, input.requestId)).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Demande introuvable." });
    const changed = row.status !== input.status;
    if (changed && !isStayStatusChangeAllowed(row.status as StayRequestStatus, input.status)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Une demande annulée ou non réalisable ne se rouvre pas : le candidat peut en faire une nouvelle." });
    }
    await db.update(stayRequests).set({ status: input.status, adminNote: input.adminNote, ...(changed ? { lastStatusAt: new Date() } : {}) }).where(eq(stayRequests.id, row.id));
    await db.insert(stayRequestEvents).values({ requestId: row.id, actorType: "admin", actorId: admin.id, action: changed ? `status:${input.status}` : "note", note: input.adminNote?.slice(0, 1000) ?? null });
    if (changed && input.notifyCandidate) {
      try {
        await db.insert(clientNotifications).values({
          candidateId: row.candidateId,
          type: "stay_request",
          title: `Séjour : ${STAY_REQUEST_LABELS[input.status]}`,
          body: STAY_REQUEST_CLIENT_NEXT[input.status],
          actionUrl: "/mon-espace",
          isRead: false,
        });
      } catch {
        // La notification ne bloque pas le changement d'étape.
      }
    }
    await audit(db, admin, "stay_programs.request_status", row.id, `${row.status} -> ${input.status}`);
    return { ok: true as const, changed };
  })),
});
