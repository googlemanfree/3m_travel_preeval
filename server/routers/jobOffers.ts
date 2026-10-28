import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { z } from "zod";
import { adminNotifications, candidates, clientNotifications, evaluations, placementOrganizations } from "../../drizzle/schema";
import { jobApplicationEvents, jobApplications, jobOfferReports, jobOffers } from "../../drizzle/jobOffersSchema";
import {
  CONTRACT_TYPES,
  JOB_APPLICATION_STATUSES,
  JOB_CONSENT_VERSION,
  JOB_OFFER_STATUSES,
  JOB_STATUS_CLIENT_NEXT,
  JOB_STATUS_LABELS,
  MAX_ACTIVE_JOB_APPLICATIONS,
  REJECTION_CODES,
  REPORT_REASONS,
  SALARY_PERIODS,
  TERMINAL_JOB_STATUSES,
  VISA_SPONSORSHIPS,
  isJobStatusChangeAllowed,
  isOfferOpen,
  jobOfferPublishBlockers,
  precheckOffer,
  reportSuspendsOffer,
  type JobApplicationStatus,
} from "../../shared/jobOffers";
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
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Les offres d'emploi ne sont pas encore activées : la migration 0089 doit être appliquée." });
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment. Réessayez dans quelques instants." });
  }
}

const session = z.string().min(1).max(512);
const countryCode = z.string().trim().length(2).transform((value) => value.toUpperCase()).refine((value) => WORLD_CODES.has(value), "Pays inconnu.");
const text = (max: number) => z.string().trim().max(max).nullish().transform((value) => (value ? value : null));
const optionalDay = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().transform((value) => (value ? value : null));
const iso = (value: Date | string | null | undefined) => (value ? new Date(value).toISOString() : null);
const money = z.number().min(0).max(100_000_000).nullish().transform((value) => (value === null || value === undefined ? null : value.toFixed(2)));

async function audit(db: Db, admin: { id: number; email?: string | null }, action: string, resourceId: string | number, details: string) {
  await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action, resourceType: "job_offer", resourceId, details: details.slice(0, 300) });
}

/** Profil minimal pour l'employeur et pour le pré-contrôle : jamais de nom, de coordonnées ni de photo. */
async function loadMinimalProfile(db: Db, candidate: { id: number; email?: string | null }) {
  const [byId] = await db.select().from(evaluations).where(eq(evaluations.candidateId, candidate.id)).orderBy(desc(evaluations.createdAt)).limit(1);
  const row = byId ?? (candidate.email ? (await db.select().from(evaluations).where(eq(evaluations.email, candidate.email)).orderBy(desc(evaluations.createdAt)).limit(1))[0] : undefined);
  return {
    jobTitle: row?.currentJobTitle ?? null,
    yearsOfExperience: row?.yearsOfExperience ?? null,
    educationLevel: row?.educationLevel ?? null,
    industrySector: row?.industrySector ?? null,
    frenchLevel: row?.frenchLevel ?? null,
    englishLevel: row?.englishLevel ?? null,
  };
}

const offerView = (offer: typeof jobOffers.$inferSelect) => ({
  id: offer.id,
  reference: offer.reference,
  title: offer.title,
  employer: offer.hideEmployerName || !offer.employerName ? "Employeur vérifié par l'agence" : offer.employerName,
  countryCode: offer.countryCode,
  city: offer.city,
  contractType: offer.contractType,
  contractMonths: offer.contractMonths,
  visaSponsorship: offer.visaSponsorship,
  salary: offer.salaryVisible && offer.salaryMin ? { min: offer.salaryMin, max: offer.salaryMax, currency: offer.salaryCurrency, period: offer.salaryPeriod } : null,
  benefits: offer.benefits,
  languages: offer.languagesJson ?? [],
  diplomas: offer.diplomasJson ?? [],
  experienceMinYears: offer.experienceMinYears,
  startDate: offer.startDate,
  startFlexible: offer.startFlexible,
  positionsCount: offer.positionsCount,
  applicationDeadline: offer.applicationDeadline,
  description: offer.description,
  requirements: offer.requirements,
});

const offerInput = z.object({
  sessionToken: session,
  id: z.number().int().positive().optional(),
  organizationId: z.number().int().positive().nullish().transform((value) => value ?? null),
  employerName: text(255),
  hideEmployerName: z.boolean(),
  title: z.string().trim().min(3).max(255),
  countryCode,
  city: text(120),
  domainId: text(40),
  programRef: text(80),
  visaSponsorship: z.enum(VISA_SPONSORSHIPS),
  contractType: z.enum(CONTRACT_TYPES),
  contractMonths: z.number().int().min(1).max(120).nullish().transform((value) => value ?? null),
  salaryMin: money,
  salaryMax: money,
  salaryCurrency: z.string().trim().toUpperCase().length(3).nullish().transform((value) => value ?? null),
  salaryPeriod: z.enum(SALARY_PERIODS).nullish().transform((value) => value ?? null),
  salaryVisible: z.boolean(),
  benefits: text(2000),
  languages: z.array(z.object({ lang: z.string().trim().min(2).max(40), level: z.string().trim().min(1).max(20), required: z.boolean().optional() })).max(8).default([]),
  diplomas: z.array(z.object({ level: z.string().trim().min(2).max(80), field: z.string().trim().max(120).optional(), required: z.boolean().optional() })).max(5).default([]),
  experienceMinYears: z.number().int().min(0).max(40).nullish().transform((value) => value ?? null),
  startDate: optionalDay,
  startFlexible: z.boolean(),
  positionsCount: z.number().int().min(1).max(500),
  applicationDeadline: optionalDay,
  description: z.string().trim().min(10).max(8000),
  requirements: text(4000),
});

/**
 * Offres d'emploi. Les offres sont saisies et modérées par l'agence (portail employeur en phase suivante) ; le candidat voit les offres
 * publiées de son pays, un pré-contrôle qui informe sans écarter, et postule avec son accord (5 candidatures actives au plus).
 */
export const jobOffersRouter = router({
  list: candidateProcedure.input(z.object({ countryCode })).query(({ ctx, input }) => guarded(async () => {
    const db = await requireDb();
    const now = new Date();
    const rows = await db.select().from(jobOffers).where(and(eq(jobOffers.countryCode, input.countryCode), eq(jobOffers.status, "published"))).orderBy(desc(jobOffers.publishedAt)).limit(100);
    const open = rows.filter((offer) => isOfferOpen(offer, now));
    if (open.length === 0) return [];
    const profile = await loadMinimalProfile(db, ctx.candidate);
    const mine = await db.select({ offerId: jobApplications.offerId, status: jobApplications.status }).from(jobApplications).where(and(eq(jobApplications.candidateId, ctx.candidate.id), inArray(jobApplications.offerId, open.map((offer) => offer.id))));
    return open.map((offer) => ({
      ...offerView(offer),
      precheck: precheckOffer({ experienceMinYears: offer.experienceMinYears, languages: offer.languagesJson ?? [], diplomas: offer.diplomasJson ?? [] }, profile),
      applied: mine.some((item) => item.offerId === offer.id && item.status !== "withdrawn"),
    }));
  })),

  myApplications: candidateProcedure.query(({ ctx }) => guarded(async () => {
    const db = await requireDb();
    const rows = await db.select().from(jobApplications).where(eq(jobApplications.candidateId, ctx.candidate.id)).orderBy(desc(jobApplications.submittedAt));
    if (rows.length === 0) return [];
    const offers = await db.select().from(jobOffers).where(inArray(jobOffers.id, rows.map((row) => row.offerId)));
    return rows.map((row) => {
      const offer = offers.find((item) => item.id === row.offerId);
      return {
        id: row.id,
        status: row.status,
        statusLabel: JOB_STATUS_LABELS[row.status],
        next: JOB_STATUS_CLIENT_NEXT[row.status],
        reference: offer?.reference ?? "",
        title: offer?.title ?? "Offre",
        employer: offer ? offerView(offer).employer : "Employeur",
        submittedAt: iso(row.submittedAt),
        lastStatusAt: iso(row.lastStatusAt),
        canWithdraw: !TERMINAL_JOB_STATUSES.includes(row.status) && !["offer_sent", "accepted"].includes(row.status),
      };
    });
  })),

  applyToOffer: candidateProcedure.input(z.object({
    offerId: z.number().int().positive(),
    consent: z.boolean().refine((value) => value === true, "Votre accord est nécessaire pour présenter votre profil à l'employeur."),
    note: text(1000),
  })).mutation(({ ctx, input }) => guarded(async () => {
    const db = await requireDb();
    const [offer] = await db.select().from(jobOffers).where(and(eq(jobOffers.id, input.offerId), eq(jobOffers.status, "published"))).limit(1);
    if (!offer || !isOfferOpen(offer)) throw new TRPCError({ code: "NOT_FOUND", message: "Cette offre n'est plus ouverte aux candidatures." });
    const [existing] = await db.select({ id: jobApplications.id }).from(jobApplications).where(and(eq(jobApplications.offerId, offer.id), eq(jobApplications.candidateId, ctx.candidate.id))).limit(1);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Vous avez déjà postulé à cette offre." });
    const [{ active = 0 } = { active: 0 }] = await db.select({ active: sql<number>`count(*)` }).from(jobApplications).where(and(eq(jobApplications.candidateId, ctx.candidate.id), notInArray(jobApplications.status, [...TERMINAL_JOB_STATUSES])));
    if (Number(active) >= MAX_ACTIVE_JOB_APPLICATIONS) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Vous avez déjà ${MAX_ACTIVE_JOB_APPLICATIONS} candidatures en cours. Retirez-en une ou parlez-en à votre conseiller.` });

    const profile = await loadMinimalProfile(db, ctx.candidate);
    const precheck = precheckOffer({ experienceMinYears: offer.experienceMinYears, languages: offer.languagesJson ?? [], diplomas: offer.diplomasJson ?? [] }, profile);
    const created = await db.insert(jobApplications).values({
      offerId: offer.id,
      candidateId: ctx.candidate.id,
      disclosureLevel: 1,
      precheckJson: precheck,
      profileSnapshotJson: profile,
      coverNote: input.note,
      consentTextVersion: JOB_CONSENT_VERSION,
    });
    const applicationId = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    await db.insert(jobApplicationEvents).values({ applicationId, actorType: "candidate", actorId: ctx.candidate.id, action: "submitted", note: `${offer.reference} · ${offer.title}`.slice(0, 1000) });
    try {
      await db.insert(adminNotifications).values({ type: "new_contact_message", title: "Nouvelle candidature emploi", message: `${ctx.candidate.fullName} — ${offer.reference} — ${offer.title}`.slice(0, 1000), relatedId: `job_application:${applicationId}`, targetAdminType: "accompagnement" });
      await db.insert(clientNotifications).values({ candidateId: ctx.candidate.id, type: "job_application", title: "Candidature emploi reçue", body: `Votre candidature à « ${offer.title} » est reçue. Votre conseiller l'examine avant toute présentation à l'employeur.`, actionUrl: "/mon-espace", isRead: false });
    } catch {
      // Les notifications ne doivent jamais faire échouer la candidature.
    }
    return { id: applicationId };
  })),

  withdrawApplication: candidateProcedure.input(z.object({ applicationId: z.number().int().positive() })).mutation(({ ctx, input }) => guarded(async () => {
    const db = await requireDb();
    const [row] = await db.select().from(jobApplications).where(and(eq(jobApplications.id, input.applicationId), eq(jobApplications.candidateId, ctx.candidate.id))).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Candidature introuvable." });
    if (!isJobStatusChangeAllowed(row.status as JobApplicationStatus, "withdrawn") || ["offer_sent", "accepted"].includes(row.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cette candidature est trop avancée pour être retirée ici : contactez votre conseiller." });
    await db.update(jobApplications).set({ status: "withdrawn", lastStatusAt: new Date() }).where(eq(jobApplications.id, row.id));
    await db.insert(jobApplicationEvents).values({ applicationId: row.id, actorType: "candidate", actorId: ctx.candidate.id, action: "withdrawn" });
    return { ok: true as const };
  })),

  reportOffer: candidateProcedure.input(z.object({ offerId: z.number().int().positive(), reason: z.enum(REPORT_REASONS), details: text(1000) })).mutation(({ ctx, input }) => guarded(async () => {
    const db = await requireDb();
    const [offer] = await db.select({ id: jobOffers.id, reference: jobOffers.reference, title: jobOffers.title, status: jobOffers.status }).from(jobOffers).where(eq(jobOffers.id, input.offerId)).limit(1);
    if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Offre introuvable." });
    const [already] = await db.select({ id: jobOfferReports.id }).from(jobOfferReports).where(and(eq(jobOfferReports.offerId, offer.id), eq(jobOfferReports.reporterCandidateId, ctx.candidate.id))).limit(1);
    if (already) return { ok: true as const, duplicate: true as const };
    await db.insert(jobOfferReports).values({ offerId: offer.id, reporterCandidateId: ctx.candidate.id, reason: input.reason, details: input.details });
    // Une demande d'argent ou une fausse offre retire l'offre de la liste en attendant l'instruction.
    if (reportSuspendsOffer(input.reason) && offer.status === "published") await db.update(jobOffers).set({ status: "in_moderation", moderationNote: "Offre retirée de la liste après un signalement : instruction en cours." }).where(eq(jobOffers.id, offer.id));
    try {
      await db.insert(adminNotifications).values({ type: "new_contact_message", title: "Offre signalée", message: `${offer.reference} — ${offer.title} (${input.reason})`.slice(0, 1000), relatedId: `job_report:${offer.id}`, targetAdminType: "accompagnement" });
    } catch {
      // Le signalement est déjà enregistré.
    }
    return { ok: true as const, duplicate: false as const };
  })),

  // ─── Administration ────────────────────────────────────────────────────────────────────────────

  adminOffers: publicProcedure.input(z.object({ sessionToken: session, status: z.enum(JOB_OFFER_STATUSES).optional(), countryCode: countryCode.optional() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const conditions = [input.status ? eq(jobOffers.status, input.status) : undefined, input.countryCode ? eq(jobOffers.countryCode, input.countryCode) : undefined].filter(Boolean) as ReturnType<typeof eq>[];
    const rows = await db.select().from(jobOffers).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(jobOffers.updatedAt)).limit(200);
    const counts = rows.length ? await db.select({ offerId: jobApplications.offerId, total: sql<number>`count(*)` }).from(jobApplications).where(inArray(jobApplications.offerId, rows.map((row) => row.id))).groupBy(jobApplications.offerId) : [];
    return rows.map((row) => ({ ...row, applicationsCount: Number(counts.find((item) => item.offerId === row.id)?.total ?? 0) }));
  })),

  adminSaveOffer: publicProcedure.input(offerInput).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const { sessionToken: _token, id, languages, diplomas, ...rest } = input;
    if (rest.organizationId) {
      const [organization] = await db.select({ id: placementOrganizations.id }).from(placementOrganizations).where(eq(placementOrganizations.id, rest.organizationId)).limit(1);
      if (!organization) throw new TRPCError({ code: "NOT_FOUND", message: "Employeur introuvable." });
    }
    if (rest.salaryMin && rest.salaryMax && Number(rest.salaryMin) > Number(rest.salaryMax)) throw new TRPCError({ code: "BAD_REQUEST", message: "Le salaire minimal dépasse le salaire maximal." });
    if ((rest.salaryMin || rest.salaryMax) && (!rest.salaryCurrency || !rest.salaryPeriod)) throw new TRPCError({ code: "BAD_REQUEST", message: "Un salaire exige une devise et une période." });
    const values = { ...rest, languagesJson: languages, diplomasJson: diplomas };
    let savedId = id ?? 0;
    if (id) {
      // Une offre modifiée repasse en brouillon si elle était publiée : elle doit être relue avant de redevenir visible.
      const [current] = await db.select({ status: jobOffers.status, version: jobOffers.version }).from(jobOffers).where(eq(jobOffers.id, id)).limit(1);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Offre introuvable." });
      await db.update(jobOffers).set({ ...values, version: current.version + 1, ...(current.status === "published" ? { status: "in_moderation" as const, moderationNote: "Offre modifiée : à relire avant de la republier." } : {}) }).where(eq(jobOffers.id, id));
    } else {
      const created = await db.insert(jobOffers).values({ ...values, countryCode: rest.countryCode, title: rest.title, description: rest.description, reference: `TMP-${randomBytes(6).toString("hex")}`, status: "draft", createdByAdminId: admin.id });
      savedId = Number((created as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
      await db.update(jobOffers).set({ reference: `OFF-${new Date().getUTCFullYear()}-${String(savedId).padStart(4, "0")}` }).where(eq(jobOffers.id, savedId));
    }
    await audit(db, admin, "job_offer.saved", savedId, `${rest.countryCode} ${rest.title}`);
    return { id: savedId };
  })),

  adminSetOfferStatus: publicProcedure.input(z.object({
    sessionToken: session,
    id: z.number().int().positive(),
    status: z.enum(JOB_OFFER_STATUSES),
    moderationNote: text(2000),
    closeReason: z.enum(["filled", "cancelled", "expired", "withdrawn_by_admin"]).nullish().transform((value) => value ?? null),
    checks: z.object({ noFees: z.boolean(), noDiscrimination: z.boolean(), noContact: z.boolean(), visaCoherent: z.boolean() }).default({ noFees: false, noDiscrimination: false, noContact: false, visaCoherent: false }),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [offer] = await db.select().from(jobOffers).where(eq(jobOffers.id, input.id)).limit(1);
    if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Offre introuvable." });
    if (input.status === "published") {
      let organizationVerified: boolean | null = null;
      if (offer.organizationId) {
        const [organization] = await db.select({ status: placementOrganizations.verificationStatus }).from(placementOrganizations).where(eq(placementOrganizations.id, offer.organizationId)).limit(1);
        organizationVerified = organization?.status === "verified";
      }
      const blockers = jobOfferPublishBlockers({ title: offer.title, description: offer.description, requirements: offer.requirements, contractType: offer.contractType, organizationVerified, checks: input.checks });
      if (blockers.length > 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Publication impossible : ${blockers.join(" ")}` });
    }
    if (input.status === "rejected" && !input.moderationNote) throw new TRPCError({ code: "BAD_REQUEST", message: "Indiquez le motif du refus." });
    const now = new Date();
    await db.update(jobOffers).set({
      status: input.status,
      moderationNote: input.moderationNote,
      moderatedByAdminId: admin.id,
      moderatedAt: now,
      ...(input.status === "published" ? { publishedAt: now, closedAt: null, closeReason: null } : {}),
      ...(input.status === "closed" ? { closedAt: now, closeReason: input.closeReason ?? "cancelled" } : {}),
    }).where(eq(jobOffers.id, offer.id));
    await audit(db, admin, "job_offer.status", offer.id, `${offer.status} -> ${input.status}`);
    return { ok: true as const };
  })),

  adminApplications: publicProcedure.input(z.object({ sessionToken: session, status: z.enum(JOB_APPLICATION_STATUSES).optional(), offerId: z.number().int().positive().optional() })).query(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const conditions = [input.status ? eq(jobApplications.status, input.status) : undefined, input.offerId ? eq(jobApplications.offerId, input.offerId) : undefined].filter(Boolean) as ReturnType<typeof eq>[];
    const rows = await db.select().from(jobApplications).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(jobApplications.lastStatusAt)).limit(200);
    if (rows.length === 0) return [];
    const offers = await db.select().from(jobOffers).where(inArray(jobOffers.id, rows.map((row) => row.offerId)));
    const people = await db.select({ id: candidates.id, fullName: candidates.fullName, email: candidates.email, phone: candidates.phone }).from(candidates).where(inArray(candidates.id, rows.map((row) => row.candidateId)));
    // Chaque consultation de candidatures (donc de données de candidats) est journalisée.
    await audit(db, admin, "job_applications.viewed", input.offerId ?? "all", `${rows.length} candidature(s) consultée(s)`);
    return rows.map((row) => {
      const offer = offers.find((item) => item.id === row.offerId);
      const person = people.find((item) => item.id === row.candidateId);
      return {
        id: row.id,
        candidateId: row.candidateId,
        candidateName: person?.fullName ?? "Candidat",
        candidateEmail: person?.email ?? null,
        candidatePhone: person?.phone ?? null,
        offerId: row.offerId,
        offerReference: offer?.reference ?? "",
        offerTitle: offer?.title ?? "Offre",
        status: row.status,
        disclosureLevel: row.disclosureLevel,
        precheck: (row.precheckJson as Array<{ label: string; state: string }> | null) ?? [],
        profile: row.profileSnapshotJson ?? {},
        coverNote: row.coverNote,
        rejectionCode: row.rejectionCode,
        adminNote: row.adminNote,
        submittedAt: iso(row.submittedAt),
        lastStatusAt: iso(row.lastStatusAt),
      };
    });
  })),

  adminSetApplicationStatus: publicProcedure.input(z.object({
    sessionToken: session,
    applicationId: z.number().int().positive(),
    status: z.enum(JOB_APPLICATION_STATUSES),
    rejectionCode: z.enum(REJECTION_CODES).nullish().transform((value) => value ?? null),
    adminNote: text(2000),
    disclosureLevel: z.number().int().min(1).max(4).optional(),
    notifyCandidate: z.boolean().default(true),
  })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [row] = await db.select().from(jobApplications).where(eq(jobApplications.id, input.applicationId)).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Candidature introuvable." });
    const changed = row.status !== input.status;
    if (changed && !isJobStatusChangeAllowed(row.status as JobApplicationStatus, input.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Une candidature terminée ne se rouvre pas : le candidat peut postuler à nouveau." });
    if (input.status === "rejected" && !input.rejectionCode) throw new TRPCError({ code: "BAD_REQUEST", message: "Choisissez le motif du refus dans la liste." });
    await db.update(jobApplications).set({
      status: input.status,
      adminNote: input.adminNote,
      rejectionCode: input.status === "rejected" ? input.rejectionCode : row.rejectionCode,
      ...(input.disclosureLevel ? { disclosureLevel: input.disclosureLevel } : {}),
      ...(changed ? { lastStatusAt: new Date() } : {}),
    }).where(eq(jobApplications.id, row.id));
    await db.insert(jobApplicationEvents).values({ applicationId: row.id, actorType: "admin", actorId: admin.id, action: changed ? `status:${input.status}` : "note", note: input.adminNote?.slice(0, 1000) ?? null });
    if (changed && input.notifyCandidate) {
      try {
        await db.insert(clientNotifications).values({ candidateId: row.candidateId, type: "job_application", title: `Candidature emploi : ${JOB_STATUS_LABELS[input.status]}`, body: JOB_STATUS_CLIENT_NEXT[input.status], actionUrl: "/mon-espace", isRead: false });
      } catch {
        // La notification ne bloque pas le changement d'étape.
      }
    }
    await audit(db, admin, "job_application.status", row.id, `${row.status} -> ${input.status}`);
    return { ok: true as const, changed };
  })),

  adminReports: publicProcedure.input(z.object({ sessionToken: session, status: z.enum(["open", "reviewing", "upheld", "dismissed"]).optional() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(jobOfferReports).where(input.status ? eq(jobOfferReports.status, input.status) : undefined).orderBy(desc(jobOfferReports.createdAt)).limit(200);
    if (rows.length === 0) return [];
    const offers = await db.select({ id: jobOffers.id, reference: jobOffers.reference, title: jobOffers.title, status: jobOffers.status }).from(jobOffers).where(inArray(jobOffers.id, rows.map((row) => row.offerId)));
    return rows.map((row) => ({ id: row.id, offerId: row.offerId, offerReference: offers.find((item) => item.id === row.offerId)?.reference ?? "", offerTitle: offers.find((item) => item.id === row.offerId)?.title ?? "Offre", offerStatus: offers.find((item) => item.id === row.offerId)?.status ?? "closed", reason: row.reason, details: row.details, status: row.status, decisionNote: row.decisionNote, createdAt: iso(row.createdAt) }));
  })),

  adminHandleReport: publicProcedure.input(z.object({ sessionToken: session, id: z.number().int().positive(), status: z.enum(["reviewing", "upheld", "dismissed"]), decisionNote: text(1000) })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [report] = await db.select().from(jobOfferReports).where(eq(jobOfferReports.id, input.id)).limit(1);
    if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Signalement introuvable." });
    if (input.status !== "reviewing" && !input.decisionNote) throw new TRPCError({ code: "BAD_REQUEST", message: "Indiquez la décision prise." });
    await db.update(jobOfferReports).set({ status: input.status, decisionNote: input.decisionNote, handledByAdminId: admin.id }).where(eq(jobOfferReports.id, report.id));
    if (input.status === "upheld") {
      // Signalement fondé : l'offre est retirée et les candidats concernés en sont informés.
      await db.update(jobOffers).set({ status: "closed", closedAt: new Date(), closeReason: "withdrawn_by_admin", moderationNote: input.decisionNote }).where(eq(jobOffers.id, report.offerId));
      const affected = await db.select({ candidateId: jobApplications.candidateId }).from(jobApplications).where(and(eq(jobApplications.offerId, report.offerId), notInArray(jobApplications.status, [...TERMINAL_JOB_STATUSES])));
      for (const item of affected) {
        try {
          await db.insert(clientNotifications).values({ candidateId: item.candidateId, type: "job_application", title: "Une offre a été retirée", body: "Une offre à laquelle vous avez postulé a été retirée après un contrôle. Votre conseiller vous contacte pour la suite.", actionUrl: "/mon-espace", isRead: false });
        } catch {
          // La notification ne bloque pas la décision.
        }
      }
    }
    await audit(db, admin, "job_offer.report_handled", report.id, `${report.reason} -> ${input.status}`);
    return { ok: true as const };
  })),
});
