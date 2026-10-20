import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  candidates,
  cvthequeProfiles,
  interviewRequests,
  needCandidates,
  partnerNotifications,
  placementCandidateProfiles,
  placementOrganizations,
  recruitmentEvents,
  recruitmentNeeds,
} from "../../drizzle/schema";
import { containsForbiddenPromise } from "../../shared/cvtheque";
import {
  ADMIN_SETTABLE_NEED_CANDIDATE,
  CANDIDATE_STATUS_LABELS,
  EMPLOYER_STATUS_LABELS,
  INTERVIEW_MODES,
  INTERVIEW_STATUSES,
  NEED_STATUSES,
  NEED_CANDIDATE_STATUSES,
  SALARY_PERIODS,
  SUPPORT_VALUES,
  TRI_STATE_VALUES,
  candidateNeedView,
  canAdvanceInterview,
  canAdvanceNeedCandidate,
  cleanOptionalList,
  type InterviewStatus,
  type NeedCandidateStatus,
} from "../../shared/recruitment";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requirePartnerPermission } from "../services/partnerPermissions";
import { adminLabel } from "../services/partnerProfiles";
import { countRecentEvents, recordPrivacyEvent } from "../services/privacyAudit";
import { requireValidAdminSession } from "./adminAuth";
import { verifyCandidateToken } from "./candidate";
import { visibleSelect, visibleWhere } from "./cvtheque";
import { getEmployerSession } from "./placementPortal";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
  return db;
}

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le suivi des besoins n’est pas encore activé : la migration 0083 doit être appliquée." });
    }
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment. Réessayez dans quelques instants." });
  }
}

const INTERVIEW_REQUESTS_PER_DAY = 20;
const NEEDS_PER_DAY = 15;

const employerToken = z.string().min(32);
const adminToken = z.string().min(20);
const candidateTokenSchema = z.string().min(20);

/** Notification sans donnée sensible : le fait et un renvoi vers l'espace, jamais de nom de candidat ni de pièce. */
async function notify(db: Db, data: { recipientKind: "admin" | "organization" | "candidate"; organizationId?: number | null; candidateId?: number | null; kind: string; title: string; message: string; relatedType?: string; relatedId?: number }) {
  try {
    await db.insert(partnerNotifications).values({
      recipientKind: data.recipientKind,
      organizationId: data.organizationId ?? null,
      candidateId: data.candidateId ?? null,
      kind: data.kind,
      title: data.title.slice(0, 200),
      message: data.message.slice(0, 500),
      relatedType: data.relatedType ?? null,
      relatedId: data.relatedId ?? null,
    });
  } catch {
    // une notification manquée ne doit jamais bloquer l'action elle-même
  }
}

async function logEvent(db: Db, data: { subjectType: "need" | "need_candidate" | "interview"; subjectId: number; organizationId?: number | null; actorType: "admin" | "employer" | "candidate" | "system"; actorLabel?: string | null; action: string; note?: string | null }) {
  await db.insert(recruitmentEvents).values({
    subjectType: data.subjectType,
    subjectId: data.subjectId,
    organizationId: data.organizationId ?? null,
    actorType: data.actorType,
    actorLabel: data.actorLabel?.slice(0, 160) ?? null,
    action: data.action.slice(0, 80),
    note: data.note?.slice(0, 500) ?? null,
  });
}

const insertId = (result: unknown): number => Number((result as any)?.[0]?.insertId ?? 0);

const needInput = z.object({
  title: z.string().trim().min(3).max(200),
  companyName: z.string().trim().max(255).optional(),
  beneficiaryConfidential: z.boolean().default(false),
  missions: z.string().trim().min(10).max(4000),
  country: z.string().trim().min(2).max(120),
  workLocation: z.string().trim().max(200).optional(),
  salaryGross: z.number().int().min(0).max(100_000_000).optional(),
  salaryCurrency: z.string().trim().max(8).optional(),
  salaryPeriod: z.enum(SALARY_PERIODS).optional(),
  contractDuration: z.string().trim().max(120).optional(),
  requiredSkills: z.string().trim().max(1500).optional(),
  requiredQualifications: z.string().trim().max(1500).optional(),
  requiredExperience: z.string().trim().max(300).optional(),
  requiredLanguages: z.string().trim().max(300).optional(),
  recognitionsRequired: z.string().trim().max(1500).optional(),
  foreignApplications: z.enum(TRI_STATE_VALUES).default("tbc"),
  noLocalWorkAuth: z.enum(TRI_STATE_VALUES).default("tbc"),
  reviewResidenceCountries: z.string().trim().max(1500).optional(),
  intlSupport: z.enum(SUPPORT_VALUES).default("to_specify"),
  intlSupportDetail: z.string().trim().max(1500).optional(),
});

async function requireVisibleProfile(db: Db, profileCode: string) {
  const row = (await visibleSelect(db).where(and(visibleWhere(), eq(placementCandidateProfiles.profileCode, profileCode))).limit(1))[0];
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Cette fiche n’est pas (ou plus) disponible." });
  return row;
}

async function linkCandidateToNeed(db: Db, data: { needId: number; cvthequeProfileId: number; origin: "employer" | "admin"; organizationId: number | null; actorType: "employer" | "admin"; actorLabel: string }) {
  const existing = (await db.select({ id: needCandidates.id }).from(needCandidates).where(and(eq(needCandidates.needId, data.needId), eq(needCandidates.cvthequeProfileId, data.cvthequeProfileId))).limit(1))[0];
  if (existing) return { id: existing.id, created: false as const };
  const created = await db.insert(needCandidates).values({ needId: data.needId, cvthequeProfileId: data.cvthequeProfileId, origin: data.origin });
  const id = insertId(created);
  await logEvent(db, { subjectType: "need_candidate", subjectId: id, organizationId: data.organizationId, actorType: data.actorType, actorLabel: data.actorLabel, action: data.origin === "employer" ? "candidate_proposed_by_employer" : "candidate_added_by_admin" });
  return { id, created: true as const };
}

export const recruitmentRouter = router({
  // ───────────────────────── Employeur ─────────────────────────

  needCreate: publicProcedure.input(needInput.extend({ sessionToken: employerToken, profileCode: z.string().trim().min(4).max(48).optional() })).mutation(({ input }) => guarded(async () => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    await requirePartnerPermission(db, account, "submitNeeds");
    if (await countRecentEvents(db, "employer", account.id, "recruitment.need_created", 86_400_000) >= NEEDS_PER_DAY) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Limite quotidienne de besoins déposés atteinte." });
    }
    if (containsForbiddenPromise([input.title, input.missions, input.requiredSkills, input.intlSupportDetail].filter(Boolean).join(" "))) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Décrivez le poste sans promesse (« visa garanti », « emploi garanti », « admissible »…) : 3M ne peut pas relayer ce type de formule." });
    }
    if (input.salaryGross && !input.salaryCurrency) throw new TRPCError({ code: "BAD_REQUEST", message: "Indiquez la devise de la rémunération." });
    const profile = input.profileCode ? await requireVisibleProfile(db, input.profileCode) : null;
    const created = await db.insert(recruitmentNeeds).values({
      organizationId: organization.id,
      createdByAccountId: account.id,
      title: input.title,
      companyName: input.companyName || null,
      beneficiaryConfidential: input.beneficiaryConfidential,
      missions: input.missions,
      country: input.country,
      workLocation: input.workLocation || null,
      salaryGross: input.salaryGross ?? null,
      salaryCurrency: input.salaryCurrency?.toUpperCase() || null,
      salaryPeriod: input.salaryPeriod ?? null,
      contractDuration: input.contractDuration || null,
      requiredSkills: cleanOptionalList(input.requiredSkills),
      requiredQualifications: cleanOptionalList(input.requiredQualifications),
      requiredExperience: cleanOptionalList(input.requiredExperience, 300),
      requiredLanguages: cleanOptionalList(input.requiredLanguages, 300),
      recognitionsRequired: cleanOptionalList(input.recognitionsRequired),
      foreignApplications: input.foreignApplications,
      noLocalWorkAuth: input.noLocalWorkAuth,
      reviewResidenceCountries: cleanOptionalList(input.reviewResidenceCountries),
      intlSupport: input.intlSupport,
      intlSupportDetail: cleanOptionalList(input.intlSupportDetail),
      relatedCvthequeProfileId: profile?.cp.id ?? null,
    });
    const needId = insertId(created);
    await logEvent(db, { subjectType: "need", subjectId: needId, organizationId: organization.id, actorType: "employer", actorLabel: account.fullName, action: "need_created" });
    if (profile) await linkCandidateToNeed(db, { needId, cvthequeProfileId: profile.cp.id, origin: "employer", organizationId: organization.id, actorType: "employer", actorLabel: account.fullName });
    await recordPrivacyEvent(db, { actorType: "employer", actorId: account.id, actorLabel: account.fullName, organizationId: organization.id, action: "recruitment.need_created", resourceType: "recruitment_need", resourceId: needId });
    await notify(db, { recipientKind: "admin", kind: "need_received", title: "Nouveau besoin de recrutement", message: `${organization.legalName} a déposé un besoin. À examiner dans le suivi des besoins.`, relatedType: "need", relatedId: needId });
    await notify(db, { recipientKind: "organization", organizationId: organization.id, kind: "need_received", title: "Besoin reçu par 3M", message: "Votre besoin a bien été reçu. 3M l’examine avant toute présentation de candidat.", relatedType: "need", relatedId: needId });
    return { id: needId };
  })),

  needList: publicProcedure.input(z.object({ sessionToken: employerToken })).query(({ input }) => guarded(async () => {
    const { db, organization } = await getEmployerSession(input.sessionToken);
    const needs = await db.select().from(recruitmentNeeds).where(eq(recruitmentNeeds.organizationId, organization.id)).orderBy(desc(recruitmentNeeds.createdAt)).limit(200);
    const ids = needs.map((need) => need.id);
    const counts = ids.length ? await db.select({ needId: needCandidates.needId, n: sql<number>`count(*)` }).from(needCandidates).where(inArray(needCandidates.needId, ids)).groupBy(needCandidates.needId) : [];
    const countByNeed = new Map(counts.map((row) => [row.needId, Number(row.n)]));
    return needs.map((need) => ({
      id: need.id,
      title: need.title,
      country: need.country,
      status: need.status,
      candidatesCount: countByNeed.get(need.id) ?? 0,
      foreignApplications: need.foreignApplications,
      noLocalWorkAuth: need.noLocalWorkAuth,
      intlSupport: need.intlSupport,
      createdAt: need.createdAt,
    }));
  })),

  /** Détail d'un besoin de l'organisation : candidats suivis avec le statut que l'employeur a le droit de voir. */
  needGet: publicProcedure.input(z.object({ sessionToken: employerToken, id: z.number().int().positive() })).query(({ input }) => guarded(async () => {
    const { db, organization } = await getEmployerSession(input.sessionToken);
    const need = (await db.select().from(recruitmentNeeds).where(and(eq(recruitmentNeeds.id, input.id), eq(recruitmentNeeds.organizationId, organization.id))).limit(1))[0];
    if (!need) throw new TRPCError({ code: "NOT_FOUND", message: "Besoin introuvable." });
    const links = await db.select().from(needCandidates).where(eq(needCandidates.needId, need.id)).orderBy(desc(needCandidates.createdAt));
    const profileIds = links.map((link) => link.cvthequeProfileId);
    const profiles = profileIds.length
      ? await db.select({ id: cvthequeProfiles.id, jobTitle: cvthequeProfiles.jobTitle, state: cvthequeProfiles.visibilityState, profileCode: placementCandidateProfiles.profileCode })
        .from(cvthequeProfiles).innerJoin(placementCandidateProfiles, eq(placementCandidateProfiles.id, cvthequeProfiles.profileId)).where(inArray(cvthequeProfiles.id, profileIds))
      : [];
    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const events = await db.select().from(recruitmentEvents).where(and(eq(recruitmentEvents.subjectType, "need"), eq(recruitmentEvents.subjectId, need.id))).orderBy(desc(recruitmentEvents.createdAt)).limit(30);
    return {
      need: { ...need, adminNote: undefined, beneficiaryConfidential: Boolean(need.beneficiaryConfidential) },
      adminMessage: need.status === "needs_info" ? need.adminNote : null,
      candidates: links.map((link) => {
        const profile = profileById.get(link.cvthequeProfileId);
        const stillAvailable = profile?.state === "published";
        return {
          id: link.id,
          profileCode: stillAvailable ? profile?.profileCode ?? null : null,
          jobTitle: stillAvailable ? profile?.jobTitle ?? null : null,
          available: Boolean(stillAvailable),
          // Le détail de l'échange avec le candidat reste interne : l'employeur voit un statut neutre.
          status: link.status as NeedCandidateStatus,
          statusLabel: EMPLOYER_STATUS_LABELS[link.status as NeedCandidateStatus],
          employerDecision: link.employerDecision,
          canDecide: ["presented", "interview_done", "interview_scheduled"].includes(link.status),
          updatedAt: link.updatedAt,
        };
      }),
      history: events.filter((event) => event.actorType !== "candidate").map((event) => ({ action: event.action, actorType: event.actorType, at: event.createdAt })),
    };
  })),

  needAddCandidate: publicProcedure.input(z.object({ sessionToken: employerToken, needId: z.number().int().positive(), profileCode: z.string().trim().min(4).max(48) })).mutation(({ input }) => guarded(async () => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    await requirePartnerPermission(db, account, "submitNeeds");
    const need = (await db.select().from(recruitmentNeeds).where(and(eq(recruitmentNeeds.id, input.needId), eq(recruitmentNeeds.organizationId, organization.id))).limit(1))[0];
    if (!need) throw new TRPCError({ code: "NOT_FOUND", message: "Besoin introuvable." });
    if (["closed", "rejected"].includes(need.status)) throw new TRPCError({ code: "CONFLICT", message: "Ce besoin est clos." });
    const profile = await requireVisibleProfile(db, input.profileCode);
    const link = await linkCandidateToNeed(db, { needId: need.id, cvthequeProfileId: profile.cp.id, origin: "employer", organizationId: organization.id, actorType: "employer", actorLabel: account.fullName });
    if (link.created) await notify(db, { recipientKind: "admin", kind: "candidate_proposed", title: "Profil proposé pour un besoin", message: `${organization.legalName} propose un profil de la CVthèque pour un besoin.`, relatedType: "need", relatedId: need.id });
    return { id: link.id, created: link.created };
  })),

  /** Décision de l'employeur après présentation : sélectionné, non retenu ou en attente. Aucune coordonnée n'est échangée par ce biais. */
  employerDecision: publicProcedure.input(z.object({ sessionToken: employerToken, needCandidateId: z.number().int().positive(), decision: z.enum(["selected", "not_selected", "on_hold"]), comment: z.string().trim().max(1000).optional() })).mutation(({ input }) => guarded(async () => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    await requirePartnerPermission(db, account, "submitNeeds");
    const row = (await db.select({ link: needCandidates, orgId: recruitmentNeeds.organizationId }).from(needCandidates).innerJoin(recruitmentNeeds, eq(recruitmentNeeds.id, needCandidates.needId)).where(eq(needCandidates.id, input.needCandidateId)).limit(1))[0];
    if (!row || row.orgId !== organization.id) throw new TRPCError({ code: "NOT_FOUND", message: "Suivi introuvable." });
    const from = row.link.status as NeedCandidateStatus;
    if (!["presented", "interview_scheduled", "interview_done"].includes(from)) throw new TRPCError({ code: "CONFLICT", message: "Vous pourrez décider une fois le candidat présenté par 3M." });
    const target: NeedCandidateStatus | null = input.decision === "selected" ? (from === "interview_scheduled" ? null : "employer_selected") : input.decision === "not_selected" ? (from === "interview_scheduled" ? null : "employer_not_selected") : null;
    if (input.decision !== "on_hold" && !target) throw new TRPCError({ code: "CONFLICT", message: "Décidez une fois l’entretien réalisé." });
    if (target && !canAdvanceNeedCandidate(from, target)) throw new TRPCError({ code: "CONFLICT", message: "Décision impossible depuis l’état actuel." });
    await db.update(needCandidates).set({ employerDecision: input.decision, employerComment: input.comment ?? null, ...(target ? { status: target } : {}) }).where(eq(needCandidates.id, row.link.id));
    await logEvent(db, { subjectType: "need_candidate", subjectId: row.link.id, organizationId: organization.id, actorType: "employer", actorLabel: account.fullName, action: `employer_${input.decision}`, note: input.comment });
    await notify(db, { recipientKind: "admin", kind: "candidate_response", title: "Décision d’un employeur", message: `${organization.legalName} a pris une décision sur un candidat présenté.`, relatedType: "need", relatedId: row.link.needId });
    return { ok: true as const };
  })),

  interviewRequest: publicProcedure.input(z.object({
    sessionToken: employerToken,
    profileCode: z.string().trim().min(4).max(48),
    needId: z.number().int().positive().optional(),
    proposedSlots: z.string().trim().max(500).optional(),
    mode: z.enum(INTERVIEW_MODES).default("undecided"),
    message: z.string().trim().max(1000).optional(),
  })).mutation(({ input }) => guarded(async () => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    await requirePartnerPermission(db, account, "requestInterviews");
    if (await countRecentEvents(db, "employer", account.id, "recruitment.interview_requested", 86_400_000) >= INTERVIEW_REQUESTS_PER_DAY) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Limite quotidienne de demandes d’entretien atteinte." });
    }
    if (input.message && containsForbiddenPromise(input.message)) throw new TRPCError({ code: "BAD_REQUEST", message: "Reformulez votre message sans promesse de visa ou d’emploi." });
    const profile = await requireVisibleProfile(db, input.profileCode);
    let need: typeof recruitmentNeeds.$inferSelect | undefined;
    if (input.needId) {
      need = (await db.select().from(recruitmentNeeds).where(and(eq(recruitmentNeeds.id, input.needId), eq(recruitmentNeeds.organizationId, organization.id))).limit(1))[0];
      if (!need) throw new TRPCError({ code: "NOT_FOUND", message: "Besoin introuvable." });
    }
    const duplicate = (await db.select({ id: interviewRequests.id }).from(interviewRequests).where(and(eq(interviewRequests.organizationId, organization.id), eq(interviewRequests.cvthequeProfileId, profile.cp.id), inArray(interviewRequests.status, ["received", "accepted", "candidate_confirmed", "scheduled"]))).limit(1))[0];
    if (duplicate) throw new TRPCError({ code: "CONFLICT", message: "Une demande d’entretien est déjà en cours pour ce profil." });
    const created = await db.insert(interviewRequests).values({
      organizationId: organization.id,
      requestedByAccountId: account.id,
      cvthequeProfileId: profile.cp.id,
      needId: need?.id ?? null,
      proposedSlots: input.proposedSlots || null,
      mode: input.mode,
      message: input.message || null,
    });
    const id = insertId(created);
    if (need) {
      const link = await linkCandidateToNeed(db, { needId: need.id, cvthequeProfileId: profile.cp.id, origin: "employer", organizationId: organization.id, actorType: "employer", actorLabel: account.fullName });
      const current = (await db.select().from(needCandidates).where(eq(needCandidates.id, link.id)).limit(1))[0];
      if (current && canAdvanceNeedCandidate(current.status as NeedCandidateStatus, "interview_requested")) await db.update(needCandidates).set({ status: "interview_requested" }).where(eq(needCandidates.id, link.id));
    }
    await logEvent(db, { subjectType: "interview", subjectId: id, organizationId: organization.id, actorType: "employer", actorLabel: account.fullName, action: "interview_requested" });
    await recordPrivacyEvent(db, { actorType: "employer", actorId: account.id, actorLabel: account.fullName, organizationId: organization.id, action: "recruitment.interview_requested", resourceType: "interview_request", resourceId: id });
    await notify(db, { recipientKind: "admin", kind: "interview_requested", title: "Demande d’entretien", message: `${organization.legalName} demande un entretien. L’offre doit être vérifiée avant toute mise en relation.`, relatedType: "interview", relatedId: id });
    await notify(db, { recipientKind: "organization", organizationId: organization.id, kind: "interview_requested", title: "Demande d’entretien transmise", message: "3M vérifie l’offre et l’intérêt du candidat avant de programmer l’entretien.", relatedType: "interview", relatedId: id });
    return { id };
  })),

  interviewList: publicProcedure.input(z.object({ sessionToken: employerToken })).query(({ input }) => guarded(async () => {
    const { db, organization } = await getEmployerSession(input.sessionToken);
    const rows = await db.select({ iv: interviewRequests, profileCode: placementCandidateProfiles.profileCode, jobTitle: cvthequeProfiles.jobTitle })
      .from(interviewRequests)
      .innerJoin(cvthequeProfiles, eq(cvthequeProfiles.id, interviewRequests.cvthequeProfileId))
      .innerJoin(placementCandidateProfiles, eq(placementCandidateProfiles.id, cvthequeProfiles.profileId))
      .where(eq(interviewRequests.organizationId, organization.id)).orderBy(desc(interviewRequests.createdAt)).limit(100);
    return rows.map(({ iv, profileCode, jobTitle }) => ({
      id: iv.id, profileCode, jobTitle, needId: iv.needId, mode: iv.mode, proposedSlots: iv.proposedSlots, message: iv.message, status: iv.status as InterviewStatus,
      scheduledAt: iv.status === "scheduled" || iv.status === "done" ? iv.scheduledAt : null,
      createdAt: iv.createdAt,
    }));
  })),

  notificationList: publicProcedure.input(z.object({ sessionToken: employerToken })).query(({ input }) => guarded(async () => {
    const { db, organization } = await getEmployerSession(input.sessionToken);
    const rows = await db.select().from(partnerNotifications).where(and(eq(partnerNotifications.recipientKind, "organization"), eq(partnerNotifications.organizationId, organization.id))).orderBy(desc(partnerNotifications.createdAt)).limit(50);
    return rows.map((row) => ({ id: row.id, kind: row.kind, title: row.title, message: row.message, read: Boolean(row.readAt), createdAt: row.createdAt }));
  })),

  notificationsMarkRead: publicProcedure.input(z.object({ sessionToken: employerToken })).mutation(({ input }) => guarded(async () => {
    const { db, organization } = await getEmployerSession(input.sessionToken);
    await db.update(partnerNotifications).set({ readAt: new Date() }).where(and(eq(partnerNotifications.recipientKind, "organization"), eq(partnerNotifications.organizationId, organization.id), sql`${partnerNotifications.readAt} is null`));
    return { ok: true as const };
  })),

  // ───────────────────────── Administration ─────────────────────────

  adminInbox: publicProcedure.input(z.object({ sessionToken: adminToken, status: z.enum(NEED_STATUSES).optional() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const needs = await db.select({ need: recruitmentNeeds, organization: placementOrganizations.legalName }).from(recruitmentNeeds)
      .innerJoin(placementOrganizations, eq(placementOrganizations.id, recruitmentNeeds.organizationId))
      .where(input.status ? eq(recruitmentNeeds.status, input.status) : sql`1=1`).orderBy(desc(recruitmentNeeds.createdAt)).limit(300);
    const interviews = await db.select({ iv: interviewRequests, organization: placementOrganizations.legalName, candidateName: candidates.fullName, profileCode: placementCandidateProfiles.profileCode })
      .from(interviewRequests)
      .innerJoin(placementOrganizations, eq(placementOrganizations.id, interviewRequests.organizationId))
      .innerJoin(cvthequeProfiles, eq(cvthequeProfiles.id, interviewRequests.cvthequeProfileId))
      .innerJoin(placementCandidateProfiles, eq(placementCandidateProfiles.id, cvthequeProfiles.profileId))
      .innerJoin(candidates, eq(candidates.id, cvthequeProfiles.candidateId))
      .orderBy(desc(interviewRequests.createdAt)).limit(200);
    const needIds = needs.map((row) => row.need.id);
    const counts = needIds.length ? await db.select({ needId: needCandidates.needId, n: sql<number>`count(*)` }).from(needCandidates).where(inArray(needCandidates.needId, needIds)).groupBy(needCandidates.needId) : [];
    const countByNeed = new Map(counts.map((row) => [row.needId, Number(row.n)]));
    return {
      needs: needs.map(({ need, organization }) => ({
        id: need.id, title: need.title, organization, country: need.country, status: need.status, createdAt: need.createdAt,
        candidatesCount: countByNeed.get(need.id) ?? 0,
        foreignApplications: need.foreignApplications, noLocalWorkAuth: need.noLocalWorkAuth, intlSupport: need.intlSupport,
      })),
      interviews: interviews.map(({ iv, organization, candidateName, profileCode }) => ({
        id: iv.id, organization, candidateName, profileCode, mode: iv.mode, proposedSlots: iv.proposedSlots, message: iv.message,
        status: iv.status as InterviewStatus, scheduledAt: iv.scheduledAt, adminNote: iv.adminNote, needId: iv.needId, createdAt: iv.createdAt,
      })),
    };
  })),

  adminNeedGet: publicProcedure.input(z.object({ sessionToken: adminToken, id: z.number().int().positive() })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const row = (await db.select({ need: recruitmentNeeds, organization: placementOrganizations.legalName }).from(recruitmentNeeds).innerJoin(placementOrganizations, eq(placementOrganizations.id, recruitmentNeeds.organizationId)).where(eq(recruitmentNeeds.id, input.id)).limit(1))[0];
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Besoin introuvable." });
    const links = await db.select({ link: needCandidates, candidateId: cvthequeProfiles.candidateId, jobTitle: cvthequeProfiles.jobTitle, profileCode: placementCandidateProfiles.profileCode, candidateName: candidates.fullName, state: cvthequeProfiles.visibilityState })
      .from(needCandidates)
      .innerJoin(cvthequeProfiles, eq(cvthequeProfiles.id, needCandidates.cvthequeProfileId))
      .innerJoin(placementCandidateProfiles, eq(placementCandidateProfiles.id, cvthequeProfiles.profileId))
      .innerJoin(candidates, eq(candidates.id, cvthequeProfiles.candidateId))
      .where(eq(needCandidates.needId, input.id)).orderBy(desc(needCandidates.createdAt));
    const events = await db.select().from(recruitmentEvents).where(and(eq(recruitmentEvents.subjectType, "need"), eq(recruitmentEvents.subjectId, input.id))).orderBy(desc(recruitmentEvents.createdAt)).limit(50);
    return {
      need: { ...row.need, beneficiaryConfidential: Boolean(row.need.beneficiaryConfidential) },
      organization: row.organization,
      candidates: links.map(({ link, candidateName, jobTitle, profileCode, state }) => ({
        id: link.id, candidateName, jobTitle, profileCode, origin: link.origin, status: link.status as NeedCandidateStatus, employerDecision: link.employerDecision, employerComment: link.employerComment, adminNote: link.adminNote, cvthequeState: state, candidateRespondedAt: link.candidateRespondedAt,
      })),
      history: events.map((event) => ({ action: event.action, actorType: event.actorType, actorLabel: event.actorLabel, note: event.note, at: event.createdAt })),
    };
  })),

  adminNeedReview: publicProcedure.input(z.object({ sessionToken: adminToken, id: z.number().int().positive(), status: z.enum(NEED_STATUSES), note: z.string().trim().max(1500).optional() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const need = (await db.select().from(recruitmentNeeds).where(eq(recruitmentNeeds.id, input.id)).limit(1))[0];
    if (!need) throw new TRPCError({ code: "NOT_FOUND", message: "Besoin introuvable." });
    if (["needs_info", "rejected", "closed"].includes(input.status) && !input.note) throw new TRPCError({ code: "BAD_REQUEST", message: "Indiquez un message : il est conservé dans l’historique." });
    const changes: Partial<typeof recruitmentNeeds.$inferInsert> = { status: input.status, adminNote: input.note ?? need.adminNote };
    if (input.status === "verified") { changes.verifiedAt = new Date(); changes.verifiedByAdminId = admin.id; }
    await db.update(recruitmentNeeds).set(changes).where(eq(recruitmentNeeds.id, need.id));
    await logEvent(db, { subjectType: "need", subjectId: need.id, organizationId: need.organizationId, actorType: "admin", actorLabel: adminLabel(admin), action: `need_${input.status}`, note: input.note });
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), organizationId: need.organizationId, action: `recruitment.need_${input.status}`, resourceType: "recruitment_need", resourceId: need.id });
    if (input.status !== need.status) await notify(db, { recipientKind: "organization", organizationId: need.organizationId, kind: "need_reviewed", title: "Votre besoin a évolué", message: `Statut : ${input.status === "verified" ? "offre et employeur examinés par 3M" : input.status === "needs_info" ? "informations complémentaires demandées" : input.status === "rejected" ? "non retenu par 3M" : input.status === "closed" ? "clos" : "en cours d’examen"}.`, relatedType: "need", relatedId: need.id });
    return { ok: true as const };
  })),

  adminAddCandidateToNeed: publicProcedure.input(z.object({ sessionToken: adminToken, needId: z.number().int().positive(), cvthequeProfileId: z.number().int().positive() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const need = (await db.select().from(recruitmentNeeds).where(eq(recruitmentNeeds.id, input.needId)).limit(1))[0];
    if (!need) throw new TRPCError({ code: "NOT_FOUND", message: "Besoin introuvable." });
    const profile = (await visibleSelect(db).where(and(visibleWhere(), eq(cvthequeProfiles.id, input.cvthequeProfileId))).limit(1))[0];
    if (!profile) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Ce profil n’est pas publié en CVthèque (consentement, résumé approuvé et publication requis)." });
    const link = await linkCandidateToNeed(db, { needId: need.id, cvthequeProfileId: profile.cp.id, origin: "admin", organizationId: need.organizationId, actorType: "admin", actorLabel: adminLabel(admin) });
    return { id: link.id, created: link.created };
  })),

  adminNeedCandidateUpdate: publicProcedure.input(z.object({ sessionToken: adminToken, id: z.number().int().positive(), status: z.enum(NEED_CANDIDATE_STATUSES), note: z.string().trim().max(1000).optional() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const row = (await db.select({ link: needCandidates, need: recruitmentNeeds, candidateId: cvthequeProfiles.candidateId }).from(needCandidates)
      .innerJoin(recruitmentNeeds, eq(recruitmentNeeds.id, needCandidates.needId))
      .innerJoin(cvthequeProfiles, eq(cvthequeProfiles.id, needCandidates.cvthequeProfileId)).where(eq(needCandidates.id, input.id)).limit(1))[0];
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Suivi introuvable." });
    if (!ADMIN_SETTABLE_NEED_CANDIDATE.includes(input.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "Ce statut est posé par le candidat ou par l’employeur, pas par l’administration." });
    const from = row.link.status as NeedCandidateStatus;
    if (!canAdvanceNeedCandidate(from, input.status)) throw new TRPCError({ code: "CONFLICT", message: "Cette étape n’est pas possible depuis l’état actuel." });
    // Le candidat ne peut être contacté, ni présenté, qu'une fois l'offre et l'employeur examinés.
    if (["candidate_contacted", "presented", "interview_scheduled"].includes(input.status) && row.need.status !== "verified") {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L’offre et l’employeur doivent d’abord être examinés (statut du besoin « examiné »)." });
    }
    await db.update(needCandidates).set({ status: input.status, adminNote: input.note ?? row.link.adminNote }).where(eq(needCandidates.id, row.link.id));
    await logEvent(db, { subjectType: "need_candidate", subjectId: row.link.id, organizationId: row.need.organizationId, actorType: "admin", actorLabel: adminLabel(admin), action: `status_${input.status}`, note: input.note });
    if (input.status === "candidate_contacted") {
      await notify(db, { recipientKind: "candidate", candidateId: row.candidateId, kind: "candidate_opportunity", title: "Une opportunité vous est proposée", message: "3M a examiné une offre qui pourrait correspondre à votre profil. Consultez-la dans votre espace pour dire si elle vous intéresse.", relatedType: "need_candidate", relatedId: row.link.id });
    }
    if (input.status === "presented") {
      await notify(db, { recipientKind: "organization", organizationId: row.need.organizationId, kind: "candidate_presented", title: "Un candidat vous est présenté", message: "3M a confirmé l’intérêt d’un candidat pour votre besoin. Consultez le suivi du besoin.", relatedType: "need", relatedId: row.need.id });
    }
    return { ok: true as const };
  })),

  adminInterviewUpdate: publicProcedure.input(z.object({ sessionToken: adminToken, id: z.number().int().positive(), status: z.enum(INTERVIEW_STATUSES), scheduledAt: z.string().datetime().optional(), note: z.string().trim().max(1000).optional() })).mutation(({ input }) => guarded(async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const row = (await db.select({ iv: interviewRequests, candidateId: cvthequeProfiles.candidateId }).from(interviewRequests).innerJoin(cvthequeProfiles, eq(cvthequeProfiles.id, interviewRequests.cvthequeProfileId)).where(eq(interviewRequests.id, input.id)).limit(1))[0];
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Demande introuvable." });
    const from = row.iv.status as InterviewStatus;
    if (!canAdvanceInterview(from, input.status)) throw new TRPCError({ code: "CONFLICT", message: "Cette étape n’est pas possible depuis l’état actuel." });
    // Seule la confirmation du candidat (ou l'administration en son nom, avec trace) fait passer à « confirmé ».
    if (input.status === "candidate_confirmed" && !input.note) throw new TRPCError({ code: "BAD_REQUEST", message: "Indiquez comment la disponibilité du candidat a été confirmée." });
    if (["declined", "cancelled"].includes(input.status) && !input.note) throw new TRPCError({ code: "BAD_REQUEST", message: "Indiquez le motif : il est conservé dans l’historique." });
    if (input.status === "scheduled" && !input.scheduledAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Indiquez la date et l’heure de l’entretien." });
    if (input.status === "accepted" && row.iv.needId) {
      const need = (await db.select({ status: recruitmentNeeds.status }).from(recruitmentNeeds).where(eq(recruitmentNeeds.id, row.iv.needId)).limit(1))[0];
      if (need && need.status !== "verified") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L’offre doit d’abord être examinée avant d’accepter l’entretien." });
    }
    await db.update(interviewRequests).set({ status: input.status, adminNote: input.note ?? row.iv.adminNote, ...(input.scheduledAt ? { scheduledAt: new Date(input.scheduledAt) } : {}) }).where(eq(interviewRequests.id, row.iv.id));
    await logEvent(db, { subjectType: "interview", subjectId: row.iv.id, organizationId: row.iv.organizationId, actorType: "admin", actorLabel: adminLabel(admin), action: `interview_${input.status}`, note: input.note });
    if (input.status === "accepted") await notify(db, { recipientKind: "candidate", candidateId: row.candidateId, kind: "candidate_interview", title: "Demande d’entretien", message: "Un employeur examiné par 3M souhaite vous rencontrer. Indiquez votre disponibilité dans votre espace.", relatedType: "interview", relatedId: row.iv.id });
    if (["scheduled", "declined", "done"].includes(input.status)) {
      await notify(db, { recipientKind: "organization", organizationId: row.iv.organizationId, kind: "interview_update", title: "Mise à jour de votre demande d’entretien", message: input.status === "scheduled" ? "L’entretien est programmé : consultez le suivi pour la date." : input.status === "done" ? "L’entretien est marqué comme réalisé." : "La demande d’entretien n’a pas pu aboutir.", relatedType: "interview", relatedId: row.iv.id });
    }
    if (input.status === "scheduled" || input.status === "done") {
      if (row.iv.needId) {
        const target: NeedCandidateStatus = input.status === "scheduled" ? "interview_scheduled" : "interview_done";
        const link = (await db.select().from(needCandidates).where(and(eq(needCandidates.needId, row.iv.needId), eq(needCandidates.cvthequeProfileId, row.iv.cvthequeProfileId))).limit(1))[0];
        if (link && canAdvanceNeedCandidate(link.status as NeedCandidateStatus, target)) await db.update(needCandidates).set({ status: target }).where(eq(needCandidates.id, link.id));
      }
    }
    return { ok: true as const };
  })),

  adminNotifications: publicProcedure.input(z.object({ sessionToken: adminToken })).query(({ input }) => guarded(async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(partnerNotifications).where(eq(partnerNotifications.recipientKind, "admin")).orderBy(desc(partnerNotifications.createdAt)).limit(50);
    return rows.map((row) => ({ id: row.id, kind: row.kind, title: row.title, message: row.message, relatedType: row.relatedType, relatedId: row.relatedId, read: Boolean(row.readAt), createdAt: row.createdAt }));
  })),

  // ───────────────────────── Candidat ─────────────────────────

  candidateOpportunities: publicProcedure.input(z.object({ candidateToken: candidateTokenSchema })).query(({ input }) => guarded(async () => {
    const candidateId = verifyCandidateToken(input.candidateToken);
    const db = await requireDb();
    const entry = (await db.select({ id: cvthequeProfiles.id }).from(cvthequeProfiles).where(eq(cvthequeProfiles.candidateId, candidateId)).limit(1))[0];
    if (!entry) return { opportunities: [], interviews: [], notifications: [] };
    const rows = await db.select({ link: needCandidates, need: recruitmentNeeds }).from(needCandidates).innerJoin(recruitmentNeeds, eq(recruitmentNeeds.id, needCandidates.needId))
      .where(and(eq(needCandidates.cvthequeProfileId, entry.id), inArray(needCandidates.status, ["candidate_contacted", "candidate_interested", "candidate_declined", "presented", "interview_requested", "interview_scheduled", "interview_done", "employer_selected", "employer_not_selected"]))).orderBy(desc(needCandidates.updatedAt)).limit(50);
    const interviews = await db.select().from(interviewRequests).where(and(eq(interviewRequests.cvthequeProfileId, entry.id), inArray(interviewRequests.status, ["accepted", "candidate_confirmed", "scheduled"]))).orderBy(desc(interviewRequests.updatedAt)).limit(20);
    const notifications = await db.select().from(partnerNotifications).where(and(eq(partnerNotifications.recipientKind, "candidate"), eq(partnerNotifications.candidateId, candidateId))).orderBy(desc(partnerNotifications.createdAt)).limit(20);
    return {
      opportunities: rows.map(({ link, need }) => ({
        id: link.id,
        status: link.status as NeedCandidateStatus,
        statusLabel: CANDIDATE_STATUS_LABELS[link.status as NeedCandidateStatus],
        canRespond: link.status === "candidate_contacted",
        view: candidateNeedView({ ...need, beneficiaryConfidential: Boolean(need.beneficiaryConfidential) }),
        missions: need.missions.slice(0, 600),
      })),
      interviews: interviews.map((iv) => ({ id: iv.id, status: iv.status as InterviewStatus, mode: iv.mode, scheduledAt: iv.status === "scheduled" ? iv.scheduledAt : null, canRespond: iv.status === "accepted" })),
      notifications: notifications.map((row) => ({ id: row.id, title: row.title, message: row.message, createdAt: row.createdAt })),
    };
  })),

  candidateRespond: publicProcedure.input(z.object({ candidateToken: candidateTokenSchema, needCandidateId: z.number().int().positive(), interested: z.boolean() })).mutation(({ input }) => guarded(async () => {
    const candidateId = verifyCandidateToken(input.candidateToken);
    const db = await requireDb();
    const row = (await db.select({ link: needCandidates, need: recruitmentNeeds, owner: cvthequeProfiles.candidateId }).from(needCandidates)
      .innerJoin(recruitmentNeeds, eq(recruitmentNeeds.id, needCandidates.needId))
      .innerJoin(cvthequeProfiles, eq(cvthequeProfiles.id, needCandidates.cvthequeProfileId)).where(eq(needCandidates.id, input.needCandidateId)).limit(1))[0];
    if (!row || row.owner !== candidateId) throw new TRPCError({ code: "NOT_FOUND", message: "Opportunité introuvable." });
    if (row.link.status !== "candidate_contacted") throw new TRPCError({ code: "CONFLICT", message: "Vous avez déjà répondu à cette proposition." });
    const target: NeedCandidateStatus = input.interested ? "candidate_interested" : "candidate_declined";
    await db.update(needCandidates).set({ status: target, candidateRespondedAt: new Date() }).where(eq(needCandidates.id, row.link.id));
    await logEvent(db, { subjectType: "need_candidate", subjectId: row.link.id, organizationId: row.need.organizationId, actorType: "candidate", action: input.interested ? "candidate_interested" : "candidate_declined" });
    await recordPrivacyEvent(db, { actorType: "candidate", actorId: candidateId, action: input.interested ? "recruitment.candidate_interested" : "recruitment.candidate_declined", resourceType: "need_candidate", resourceId: row.link.id });
    await notify(db, { recipientKind: "admin", kind: "candidate_response", title: "Réponse d’un candidat", message: input.interested ? "Un candidat est intéressé par une offre. Vous pouvez le présenter à l’employeur." : "Un candidat a décliné une offre.", relatedType: "need", relatedId: row.need.id });
    return { status: target };
  })),

  candidateInterviewRespond: publicProcedure.input(z.object({ candidateToken: candidateTokenSchema, interviewId: z.number().int().positive(), available: z.boolean() })).mutation(({ input }) => guarded(async () => {
    const candidateId = verifyCandidateToken(input.candidateToken);
    const db = await requireDb();
    const row = (await db.select({ iv: interviewRequests, owner: cvthequeProfiles.candidateId }).from(interviewRequests).innerJoin(cvthequeProfiles, eq(cvthequeProfiles.id, interviewRequests.cvthequeProfileId)).where(eq(interviewRequests.id, input.interviewId)).limit(1))[0];
    if (!row || row.owner !== candidateId) throw new TRPCError({ code: "NOT_FOUND", message: "Demande introuvable." });
    if (row.iv.status !== "accepted") throw new TRPCError({ code: "CONFLICT", message: "Cette demande n’attend plus votre réponse." });
    const target: InterviewStatus = input.available ? "candidate_confirmed" : "declined";
    await db.update(interviewRequests).set({ status: target, adminNote: input.available ? row.iv.adminNote : "Candidat non disponible." }).where(eq(interviewRequests.id, row.iv.id));
    await logEvent(db, { subjectType: "interview", subjectId: row.iv.id, organizationId: row.iv.organizationId, actorType: "candidate", action: input.available ? "candidate_available" : "candidate_unavailable" });
    await recordPrivacyEvent(db, { actorType: "candidate", actorId: candidateId, action: input.available ? "recruitment.interview_confirmed" : "recruitment.interview_declined", resourceType: "interview_request", resourceId: row.iv.id });
    await notify(db, { recipientKind: "admin", kind: "candidate_response", title: "Réponse à une demande d’entretien", message: input.available ? "Un candidat est disponible pour l’entretien : à programmer." : "Un candidat n’est pas disponible pour l’entretien.", relatedType: "interview", relatedId: row.iv.id });
    return { status: target };
  })),
});
