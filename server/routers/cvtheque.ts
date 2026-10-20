import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, isNull, like, sql } from "drizzle-orm";
import { z } from "zod";
import {
  candidatePlacementConsents,
  candidates,
  cvthequeProfiles,
  consentRecords,
  partnerSelections,
  placementCandidateProfiles,
} from "../../drizzle/schema";
import {
  AVAILABILITY_VALUES,
  CVTHEQUE_CONSENT_KIND,
  CVTHEQUE_CONSENT_VERSION,
  CVTHEQUE_REVIEW_MONTHS,
  EDUCATION_LEVELS,
  PROFILE_VIEW_LIMIT_PER_DAY,
  SEARCH_LIMIT_PER_HOUR,
  SEARCH_PAGE_SIZE,
  VERIFICATION_LEVELS,
  WORK_AUTHORIZATION_VALUES,
  buildSearchText,
  canTransitionCvtheque,
  containsForbiddenPromise,
  parseList,
  parseVerificationLevels,
  searchTerms,
  toCleanList,
  type CvthequeState,
} from "../../shared/cvtheque";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requireStrongAdmin } from "../services/adminStrongAuth";
import { requirePartnerPermission } from "../services/partnerPermissions";
import { countRecentEvents, recordPrivacyEvent } from "../services/privacyAudit";
import { adminLabel } from "../services/partnerProfiles";
import { requireValidAdminSession } from "./adminAuth";
import { verifyCandidateToken } from "./candidate";
import { getEmployerSession } from "./placementPortal";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
  return db;
}

/** Une migration non appliquée ne doit jamais casser le reste du site. */
async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La CVthèque n’est pas encore activée : la migration 0082 doit être appliquée." });
    }
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment. Réessayez dans quelques instants." });
  }
}

const ipOf = (ctx: unknown): string | null => {
  const req = (ctx as { req?: { ip?: string; headers?: Record<string, string | string[] | undefined> } } | undefined)?.req;
  const forwarded = req?.headers?.["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (first?.split(",")[0]?.trim() || req?.ip) ?? null;
};

const declaredSchema = z.object({
  jobTitle: z.string().trim().min(2).max(160),
  skills: z.string().trim().min(2).max(800),
  educationLevel: z.enum(EDUCATION_LEVELS).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  languages: z.string().trim().max(400).optional(),
  availability: z.enum(AVAILABILITY_VALUES).optional(),
  destinations: z.string().trim().max(400).optional(),
  residenceCountry: z.string().trim().max(120).optional(),
  workAuthorization: z.enum(WORK_AUTHORIZATION_VALUES).default("not_specified"),
});

async function loadOwnProfile(db: Db, candidateId: number) {
  return (await db.select().from(placementCandidateProfiles)
    .where(and(eq(placementCandidateProfiles.candidateId, candidateId), isNull(placementCandidateProfiles.archivedAt)))
    .orderBy(desc(placementCandidateProfiles.id)).limit(1))[0];
}

async function placementConsentGranted(db: Db, candidateId: number): Promise<boolean> {
  const consent = (await db.select().from(candidatePlacementConsents).where(eq(candidatePlacementConsents.candidateId, candidateId)).limit(1))[0];
  return consent?.status === "granted";
}

/** Fiche présentée à un employeur : uniquement des informations professionnelles. Jamais de nom, nationalité, contact ni pièce. */
function toEmployerCard(row: { cp: typeof cvthequeProfiles.$inferSelect; profileCode: string; summary: string; sector: string | null }, options: { full: boolean; inSelection: boolean }) {
  const levels = parseVerificationLevels(row.cp.verificationLevels);
  return {
    cvthequeProfileId: row.cp.id,
    profileCode: row.profileCode,
    jobTitle: row.cp.jobTitle,
    sector: row.cp.sector ?? row.sector,
    skills: parseList(row.cp.skills),
    educationLevel: row.cp.educationLevel,
    experienceYears: row.cp.experienceYears,
    languages: parseList(row.cp.languages),
    availability: row.cp.availability,
    destinations: parseList(row.cp.destinations),
    residenceCountry: row.cp.residenceCountry,
    workAuthorization: row.cp.workAuthorization,
    verification: levels,
    summary: options.full ? row.summary : row.summary.slice(0, 280),
    publishedAt: row.cp.publishedAt,
    inSelection: options.inSelection,
  };
}

const visibleWhere = () => and(
  eq(cvthequeProfiles.visibilityState, "published"),
  eq(placementCandidateProfiles.summaryStatus, "approved"),
  isNull(placementCandidateProfiles.archivedAt),
  eq(candidatePlacementConsents.status, "granted"),
);

const visibleSelect = (db: Db) => db
  .select({ cp: cvthequeProfiles, profileCode: placementCandidateProfiles.profileCode, summary: placementCandidateProfiles.summary, sector: placementCandidateProfiles.sector })
  .from(cvthequeProfiles)
  .innerJoin(placementCandidateProfiles, eq(placementCandidateProfiles.id, cvthequeProfiles.profileId))
  .innerJoin(candidatePlacementConsents, eq(candidatePlacementConsents.candidateId, cvthequeProfiles.candidateId));

const sessionSchema = z.string().min(20);
const employerSessionSchema = z.string().min(32);

export const cvthequeRouter = router({
  // ───────────────────────── Candidat : sa présence en CVthèque ─────────────────────────

  myState: publicProcedure.input(z.object({ candidateToken: z.string().min(20) })).query(({ input }) => guarded(async () => {
    const candidateId = verifyCandidateToken(input.candidateToken);
    const db = await requireDb();
    const profile = await loadOwnProfile(db, candidateId);
    const consentGranted = await placementConsentGranted(db, candidateId);
    const entry = profile ? (await db.select().from(cvthequeProfiles).where(eq(cvthequeProfiles.profileId, profile.id)).limit(1))[0] : undefined;
    return {
      consentVersion: CVTHEQUE_CONSENT_VERSION,
      eligibility: { hasProfile: Boolean(profile), placementConsentGranted: consentGranted, summaryApproved: profile?.summaryStatus === "approved" },
      entry: entry ? {
        visibilityState: entry.visibilityState as CvthequeState,
        jobTitle: entry.jobTitle ?? "",
        skills: parseList(entry.skills).join(", "),
        educationLevel: entry.educationLevel ?? "",
        experienceYears: entry.experienceYears,
        languages: parseList(entry.languages).join(", "),
        availability: entry.availability ?? "",
        destinations: parseList(entry.destinations).join(", "),
        residenceCountry: entry.residenceCountry ?? "",
        workAuthorization: entry.workAuthorization,
        reviewNote: entry.visibilityState === "rejected" || entry.visibilityState === "draft" ? entry.reviewNote : null,
        publishedAt: entry.publishedAt,
        nextReviewAt: entry.nextReviewAt,
      } : null,
    };
  })),

  saveDeclared: publicProcedure.input(declaredSchema.extend({ candidateToken: z.string().min(20) })).mutation(({ input }) => guarded(async () => {
    const candidateId = verifyCandidateToken(input.candidateToken);
    const db = await requireDb();
    const profile = await loadOwnProfile(db, candidateId);
    if (!profile) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Votre fiche professionnelle doit d’abord être préparée par 3M après la validation de votre évaluation." });
    const skills = toCleanList(input.skills);
    const languages = toCleanList(input.languages);
    const destinations = toCleanList(input.destinations);
    if (containsForbiddenPromise([input.jobTitle, ...skills].join(" "))) throw new TRPCError({ code: "BAD_REQUEST", message: "Décrivez vos compétences sans formule de promesse (« garanti », « admissible »…)." });
    const values = {
      jobTitle: input.jobTitle,
      sector: profile.sector,
      skills: JSON.stringify(skills),
      educationLevel: input.educationLevel ?? null,
      experienceYears: input.experienceYears ?? null,
      languages: JSON.stringify(languages),
      availability: input.availability ?? null,
      destinations: JSON.stringify(destinations),
      residenceCountry: input.residenceCountry || null,
      workAuthorization: input.workAuthorization,
      searchText: buildSearchText({ jobTitle: input.jobTitle, sector: profile.sector, skills, languages, destinations }),
    };
    const existing = (await db.select().from(cvthequeProfiles).where(eq(cvthequeProfiles.profileId, profile.id)).limit(1))[0];
    if (existing) {
      // Une modification d'une fiche publiée la remet en examen : ce que voient les employeurs a toujours été relu.
      const nextState: CvthequeState = existing.visibilityState === "published" ? "pending_review" : existing.visibilityState as CvthequeState;
      await db.update(cvthequeProfiles).set({ ...values, visibilityState: nextState, verificationLevels: existing.visibilityState === "published" ? null : existing.verificationLevels }).where(eq(cvthequeProfiles.id, existing.id));
      await recordPrivacyEvent(db, { actorType: "candidate", actorId: candidateId, action: "cvtheque.declared_updated", resourceType: "cvtheque_profile", resourceId: existing.id, details: existing.visibilityState === "published" ? "Fiche publiée remise en examen." : undefined, ip: ipOf(undefined) });
      return { state: nextState };
    }
    const created = await db.insert(cvthequeProfiles).values({ profileId: profile.id, candidateId, ...values });
    await recordPrivacyEvent(db, { actorType: "candidate", actorId: candidateId, action: "cvtheque.declared_created", resourceType: "cvtheque_profile", resourceId: Number((created as any)[0]?.insertId ?? 0) });
    return { state: "draft" as CvthequeState };
  })),

  requestPublication: publicProcedure.input(z.object({ candidateToken: z.string().min(20), consent: z.literal(true), consentVersion: z.string().min(3).max(32) })).mutation(({ input }) => guarded(async () => {
    const candidateId = verifyCandidateToken(input.candidateToken);
    const db = await requireDb();
    if (input.consentVersion !== CVTHEQUE_CONSENT_VERSION) throw new TRPCError({ code: "CONFLICT", message: "Le texte du consentement a changé : relisez-le avant de confirmer." });
    const profile = await loadOwnProfile(db, candidateId);
    if (!profile) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Votre fiche professionnelle n’est pas encore prête." });
    if (!(await placementConsentGranted(db, candidateId))) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Activez d’abord le partage anonymisé de votre profil." });
    const entry = (await db.select().from(cvthequeProfiles).where(eq(cvthequeProfiles.profileId, profile.id)).limit(1))[0];
    if (!entry || !entry.jobTitle || parseList(entry.skills).length === 0) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Renseignez au moins votre métier et vos compétences." });
    if (!canTransitionCvtheque(entry.visibilityState as CvthequeState, "pending_review")) throw new TRPCError({ code: "CONFLICT", message: "Votre fiche est déjà en cours d’examen ou publiée." });
    await db.update(cvthequeProfiles).set({ visibilityState: "pending_review", withdrawnAt: null }).where(eq(cvthequeProfiles.id, entry.id));
    await db.insert(consentRecords).values({ subjectType: "candidate", subjectId: candidateId, kind: CVTHEQUE_CONSENT_KIND, version: input.consentVersion, granted: true, source: "client_space" });
    await recordPrivacyEvent(db, { actorType: "candidate", actorId: candidateId, action: "cvtheque.publication_requested", resourceType: "cvtheque_profile", resourceId: entry.id });
    return { state: "pending_review" as CvthequeState };
  })),

  /** Retrait de la CVthèque : immédiat, distinct de la suppression du compte (qui suit la procédure de demande de droits). */
  withdraw: publicProcedure.input(z.object({ candidateToken: z.string().min(20) })).mutation(({ input }) => guarded(async () => {
    const candidateId = verifyCandidateToken(input.candidateToken);
    const db = await requireDb();
    const profile = await loadOwnProfile(db, candidateId);
    const entry = profile ? (await db.select().from(cvthequeProfiles).where(eq(cvthequeProfiles.profileId, profile.id)).limit(1))[0] : undefined;
    if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Aucune fiche en CVthèque." });
    await db.update(cvthequeProfiles).set({ visibilityState: "withdrawn", withdrawnAt: new Date() }).where(eq(cvthequeProfiles.id, entry.id));
    await db.insert(consentRecords).values({ subjectType: "candidate", subjectId: candidateId, kind: CVTHEQUE_CONSENT_KIND, version: CVTHEQUE_CONSENT_VERSION, granted: false, source: "client_space" });
    await recordPrivacyEvent(db, { actorType: "candidate", actorId: candidateId, action: "cvtheque.withdrawn", resourceType: "cvtheque_profile", resourceId: entry.id });
    return { state: "withdrawn" as CvthequeState };
  })),

  // ───────────────────────── Administration : examen avant publication ─────────────────────────

  adminQueue: publicProcedure.input(z.object({ sessionToken: sessionSchema, state: z.enum(["pending_review", "published", "withdrawn", "rejected", "draft"]).optional() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db
      .select({ cp: cvthequeProfiles, fullName: candidates.fullName, profileCode: placementCandidateProfiles.profileCode, summaryStatus: placementCandidateProfiles.summaryStatus })
      .from(cvthequeProfiles)
      .innerJoin(placementCandidateProfiles, eq(placementCandidateProfiles.id, cvthequeProfiles.profileId))
      .innerJoin(candidates, eq(candidates.id, cvthequeProfiles.candidateId))
      .where(input.state ? eq(cvthequeProfiles.visibilityState, input.state) : sql`1=1`)
      .orderBy(desc(cvthequeProfiles.updatedAt)).limit(300);
    const candidateIds = rows.map((row) => row.cp.candidateId);
    const consents = candidateIds.length ? await db.select().from(candidatePlacementConsents).where(inArray(candidatePlacementConsents.candidateId, candidateIds)) : [];
    const consentByCandidate = new Map(consents.map((consent) => [consent.candidateId, consent.status === "granted"]));
    return rows.map(({ cp, fullName, profileCode, summaryStatus }) => ({
      id: cp.id,
      candidateId: cp.candidateId,
      candidateName: fullName,
      profileCode,
      visibilityState: cp.visibilityState as CvthequeState,
      jobTitle: cp.jobTitle,
      skills: parseList(cp.skills),
      educationLevel: cp.educationLevel,
      experienceYears: cp.experienceYears,
      languages: parseList(cp.languages),
      availability: cp.availability,
      destinations: parseList(cp.destinations),
      residenceCountry: cp.residenceCountry,
      workAuthorization: cp.workAuthorization,
      verification: parseVerificationLevels(cp.verificationLevels),
      reviewNote: cp.reviewNote,
      publishedAt: cp.publishedAt,
      nextReviewAt: cp.nextReviewAt,
      placementConsentGranted: Boolean(consentByCandidate.get(cp.candidateId)),
      summaryApproved: summaryStatus === "approved",
      updatedAt: cp.updatedAt,
    }));
  })),

  adminReview: publicProcedure.input(z.object({
    sessionToken: sessionSchema,
    id: z.number().int().positive(),
    decision: z.enum(["publish", "reject", "request_changes", "unpublish"]),
    verification: z.object({ skills: z.enum(VERIFICATION_LEVELS), experience: z.enum(VERIFICATION_LEVELS), education: z.enum(VERIFICATION_LEVELS), languages: z.enum(VERIFICATION_LEVELS) }).optional(),
    note: z.string().trim().max(1500).optional(),
  })).mutation(({ input, ctx }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const entry = (await db.select().from(cvthequeProfiles).where(eq(cvthequeProfiles.id, input.id)).limit(1))[0];
    if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Fiche introuvable." });
    const from = entry.visibilityState as CvthequeState;
    const target: CvthequeState = input.decision === "publish" ? "published" : input.decision === "reject" ? "rejected" : input.decision === "request_changes" ? "draft" : "withdrawn";
    if (!canTransitionCvtheque(from, target)) throw new TRPCError({ code: "CONFLICT", message: "Cette décision n’est pas possible depuis l’état actuel de la fiche." });
    if ((input.decision === "reject" || input.decision === "request_changes" || input.decision === "unpublish") && !input.note) throw new TRPCError({ code: "BAD_REQUEST", message: "Indiquez le motif : il est conservé dans l’historique." });
    const now = new Date();
    const changes: Partial<typeof cvthequeProfiles.$inferInsert> = { visibilityState: target, reviewedAt: now, reviewedByAdminId: admin.id, reviewNote: input.note ?? entry.reviewNote };
    if (input.decision === "publish") {
      await requireStrongAdmin(admin);
      const profile = (await db.select().from(placementCandidateProfiles).where(eq(placementCandidateProfiles.id, entry.profileId)).limit(1))[0];
      if (!profile || profile.summaryStatus !== "approved" || profile.archivedAt) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le résumé de la fiche professionnelle doit d’abord être approuvé." });
      if (!(await placementConsentGranted(db, entry.candidateId))) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le candidat n’a pas autorisé le partage de son profil." });
      const consentRow = (await db.select().from(consentRecords).where(and(eq(consentRecords.subjectType, "candidate"), eq(consentRecords.subjectId, entry.candidateId), eq(consentRecords.kind, CVTHEQUE_CONSENT_KIND))).orderBy(desc(consentRecords.id)).limit(1))[0];
      if (!consentRow?.granted) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le candidat n’a pas donné son consentement à la diffusion en CVthèque." });
      changes.publishedAt = now;
      changes.withdrawnAt = null;
      changes.nextReviewAt = new Date(now.getFullYear(), now.getMonth() + CVTHEQUE_REVIEW_MONTHS, now.getDate());
      if (input.verification) changes.verificationLevels = JSON.stringify(input.verification);
    }
    if (input.decision === "unpublish") changes.withdrawnAt = now;
    await db.update(cvthequeProfiles).set(changes).where(eq(cvthequeProfiles.id, entry.id));
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: `cvtheque.review_${input.decision}`, resourceType: "cvtheque_profile", resourceId: entry.id, details: input.note?.slice(0, 200), ip: ipOf(ctx) });
    return { state: target };
  })),

  // ───────────────────────── Employeur : recherche et sélection ─────────────────────────

  search: publicProcedure.input(z.object({
    sessionToken: employerSessionSchema,
    q: z.string().trim().max(120).optional(),
    experienceMin: z.number().int().min(0).max(60).optional(),
    availability: z.enum(AVAILABILITY_VALUES).optional(),
    residenceCountry: z.string().trim().max(120).optional(),
    destination: z.string().trim().max(120).optional(),
    workAuthorization: z.enum(WORK_AUTHORIZATION_VALUES).optional(),
    educationLevels: z.array(z.enum(EDUCATION_LEVELS)).max(6).optional(),
    page: z.number().int().min(1).max(50).default(1),
  })).query(({ input, ctx }) => guarded(async () => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    await requirePartnerPermission(db, account, "viewCvtheque");
    if (await countRecentEvents(db, "employer", account.id, "cvtheque.search", 3_600_000) >= SEARCH_LIMIT_PER_HOUR) {
      await recordPrivacyEvent(db, { actorType: "employer", actorId: account.id, organizationId: organization.id, action: "cvtheque.search_throttled", outcome: "denied" });
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Trop de recherches en peu de temps. Réessayez dans une heure." });
    }
    const conditions = [visibleWhere()];
    for (const term of searchTerms(input.q)) conditions.push(like(cvthequeProfiles.searchText, `%${term}%`));
    if (input.experienceMin !== undefined) conditions.push(gte(cvthequeProfiles.experienceYears, input.experienceMin));
    if (input.availability) conditions.push(eq(cvthequeProfiles.availability, input.availability));
    if (input.residenceCountry) conditions.push(like(cvthequeProfiles.residenceCountry, `%${input.residenceCountry}%`));
    if (input.destination) conditions.push(like(cvthequeProfiles.destinations, `%${input.destination.replace(/["\\%_]/g, "")}%`));
    if (input.workAuthorization) conditions.push(eq(cvthequeProfiles.workAuthorization, input.workAuthorization));
    // Le diplôme n'est JAMAIS obligatoire : le filtre n'existe que si l'employeur le choisit explicitement.
    if (input.educationLevels?.length) conditions.push(inArray(cvthequeProfiles.educationLevel, input.educationLevels));
    const where = and(...conditions);
    const [{ total = 0 } = { total: 0 }] = await db.select({ total: sql<number>`count(*)` })
      .from(cvthequeProfiles)
      .innerJoin(placementCandidateProfiles, eq(placementCandidateProfiles.id, cvthequeProfiles.profileId))
      .innerJoin(candidatePlacementConsents, eq(candidatePlacementConsents.candidateId, cvthequeProfiles.candidateId))
      .where(where);
    const rows = await visibleSelect(db).where(where).orderBy(desc(cvthequeProfiles.publishedAt)).limit(SEARCH_PAGE_SIZE).offset((input.page - 1) * SEARCH_PAGE_SIZE);
    const ids = rows.map((row) => row.cp.id);
    const selected = ids.length ? await db.select({ id: partnerSelections.cvthequeProfileId }).from(partnerSelections).where(and(eq(partnerSelections.accountId, account.id), inArray(partnerSelections.cvthequeProfileId, ids))) : [];
    const selectedIds = new Set(selected.map((row) => row.id));
    // Seuls les critères utilisés sont journalisés (jamais le contenu des fiches).
    await recordPrivacyEvent(db, { actorType: "employer", actorId: account.id, actorLabel: account.fullName, organizationId: organization.id, action: "cvtheque.search", resourceType: "cvtheque", details: `filtres=${Object.keys(input).filter((key) => !["sessionToken", "page"].includes(key) && (input as Record<string, unknown>)[key] !== undefined).join(",") || "aucun"}; résultats=${Number(total)}`, ip: ipOf(ctx) });
    return { total: Number(total), page: input.page, pageSize: SEARCH_PAGE_SIZE, items: rows.map((row) => toEmployerCard(row, { full: false, inSelection: selectedIds.has(row.cp.id) })) };
  })),

  getProfile: publicProcedure.input(z.object({ sessionToken: employerSessionSchema, profileCode: z.string().trim().min(4).max(48) })).query(({ input, ctx }) => guarded(async () => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    await requirePartnerPermission(db, account, "viewCvtheque");
    if (await countRecentEvents(db, "employer", account.id, "cvtheque.profile_viewed", 86_400_000) >= PROFILE_VIEW_LIMIT_PER_DAY) {
      await recordPrivacyEvent(db, { actorType: "employer", actorId: account.id, organizationId: organization.id, action: "cvtheque.view_throttled", outcome: "denied" });
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Limite quotidienne de consultation de fiches atteinte." });
    }
    const row = (await visibleSelect(db).where(and(visibleWhere(), eq(placementCandidateProfiles.profileCode, input.profileCode))).limit(1))[0];
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Cette fiche n’est pas (ou plus) disponible." });
    const inSelection = Boolean((await db.select({ id: partnerSelections.id }).from(partnerSelections).where(and(eq(partnerSelections.accountId, account.id), eq(partnerSelections.cvthequeProfileId, row.cp.id))).limit(1))[0]);
    await recordPrivacyEvent(db, { actorType: "employer", actorId: account.id, actorLabel: account.fullName, organizationId: organization.id, action: "cvtheque.profile_viewed", resourceType: "cvtheque_profile", resourceId: row.cp.id, ip: ipOf(ctx) });
    return toEmployerCard(row, { full: true, inSelection });
  })),

  selectionList: publicProcedure.input(z.object({ sessionToken: employerSessionSchema })).query(({ input }) => guarded(async () => {
    const { db, account } = await getEmployerSession(input.sessionToken);
    await requirePartnerPermission(db, account, "viewCvtheque");
    const picks = await db.select().from(partnerSelections).where(eq(partnerSelections.accountId, account.id)).orderBy(desc(partnerSelections.createdAt)).limit(200);
    if (!picks.length) return [];
    const rows = await visibleSelect(db).where(and(visibleWhere(), inArray(cvthequeProfiles.id, picks.map((pick) => pick.cvthequeProfileId))));
    const noteById = new Map(picks.map((pick) => [pick.cvthequeProfileId, pick.note]));
    // Une fiche retirée de la CVthèque disparaît de la sélection (elle n'est plus visible), sans que l'employeur reçoive d'explication nominative.
    return rows.map((row) => ({ ...toEmployerCard(row, { full: false, inSelection: true }), note: noteById.get(row.cp.id) ?? null }));
  })),

  selectionAdd: publicProcedure.input(z.object({ sessionToken: employerSessionSchema, profileCode: z.string().trim().min(4).max(48), note: z.string().trim().max(1000).optional() })).mutation(({ input }) => guarded(async () => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    await requirePartnerPermission(db, account, "viewCvtheque");
    const row = (await visibleSelect(db).where(and(visibleWhere(), eq(placementCandidateProfiles.profileCode, input.profileCode))).limit(1))[0];
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Cette fiche n’est pas (ou plus) disponible." });
    const existing = (await db.select({ id: partnerSelections.id }).from(partnerSelections).where(and(eq(partnerSelections.accountId, account.id), eq(partnerSelections.cvthequeProfileId, row.cp.id))).limit(1))[0];
    if (existing) await db.update(partnerSelections).set({ note: input.note ?? null }).where(eq(partnerSelections.id, existing.id));
    else await db.insert(partnerSelections).values({ organizationId: organization.id, accountId: account.id, cvthequeProfileId: row.cp.id, note: input.note ?? null });
    await recordPrivacyEvent(db, { actorType: "employer", actorId: account.id, actorLabel: account.fullName, organizationId: organization.id, action: "cvtheque.selection_added", resourceType: "cvtheque_profile", resourceId: row.cp.id });
    return { ok: true as const };
  })),

  selectionRemove: publicProcedure.input(z.object({ sessionToken: employerSessionSchema, profileCode: z.string().trim().min(4).max(48) })).mutation(({ input }) => guarded(async () => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    const profile = (await db.select({ id: cvthequeProfiles.id }).from(cvthequeProfiles).innerJoin(placementCandidateProfiles, eq(placementCandidateProfiles.id, cvthequeProfiles.profileId)).where(eq(placementCandidateProfiles.profileCode, input.profileCode)).limit(1))[0];
    if (profile) {
      await db.delete(partnerSelections).where(and(eq(partnerSelections.accountId, account.id), eq(partnerSelections.cvthequeProfileId, profile.id)));
      await recordPrivacyEvent(db, { actorType: "employer", actorId: account.id, actorLabel: account.fullName, organizationId: organization.id, action: "cvtheque.selection_removed", resourceType: "cvtheque_profile", resourceId: profile.id });
    }
    return { ok: true as const };
  })),
});
