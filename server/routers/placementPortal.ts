import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import {
  candidatePlacementConsents,
  candidates,
  placementCandidateProfiles,
  placementEmployerAccounts,
  placementOrganizations,
  placementProfileSubmissions,
  placementSubmissionEvents,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";
import { verifyCandidateToken } from "./candidate";

const employerSessionHours = 24;
const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");
const makeProfileCode = () => `PRF-${randomBytes(4).toString("hex").toUpperCase()}`;

async function getEmployerSession(rawToken: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
  const account = (await db.select().from(placementEmployerAccounts)
    .where(and(eq(placementEmployerAccounts.sessionTokenHash, hashToken(rawToken)), eq(placementEmployerAccounts.status, "active")))
    .limit(1))[0];
  if (!account || !account.sessionExpiresAt || account.sessionExpiresAt <= new Date()) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Session employeur expirée ou invalide." });
  }
  const organization = (await db.select().from(placementOrganizations)
    .where(and(eq(placementOrganizations.id, account.organizationId), eq(placementOrganizations.verificationStatus, "verified"))).limit(1))[0];
  if (!organization) throw new TRPCError({ code: "FORBIDDEN", message: "Organisation non vérifiée ou accès suspendu." });
  return { db, account, organization };
}

export const placementPortalRouter = router({
  getMyConsent: publicProcedure.input(z.object({ candidateToken: z.string().min(20) })).query(async ({ input }) => {
    const candidateId = verifyCandidateToken(input.candidateToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
    const consent = (await db.select().from(candidatePlacementConsents).where(eq(candidatePlacementConsents.candidateId, candidateId)).limit(1))[0];
    return { status: consent?.status ?? "withdrawn", consentedAt: consent?.consentedAt ?? null };
  }),

  setMyConsent: publicProcedure.input(z.object({ candidateToken: z.string().min(20), consented: z.boolean() })).mutation(async ({ input }) => {
    const candidateId = verifyCandidateToken(input.candidateToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
    const now = new Date();
    const existing = (await db.select().from(candidatePlacementConsents).where(eq(candidatePlacementConsents.candidateId, candidateId)).limit(1))[0];
    const values = input.consented ? { status: "granted" as const, consentedAt: now, withdrawnAt: null } : { status: "withdrawn" as const, consentedAt: null, withdrawnAt: now };
    if (existing) await db.update(candidatePlacementConsents).set(values).where(eq(candidatePlacementConsents.id, existing.id));
    else await db.insert(candidatePlacementConsents).values({ candidateId, ...values });
    return { status: values.status };
  }),

  adminList: publicProcedure.input(z.object({ sessionToken: z.string().min(20) })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
    const [organizations, profiles, submissions] = await Promise.all([
      db.select().from(placementOrganizations),
      db.select().from(placementCandidateProfiles).where(isNull(placementCandidateProfiles.archivedAt)),
      db.select().from(placementProfileSubmissions),
    ]);
    return { organizations, profiles, submissions };
  }),

  adminCreateOrganization: publicProcedure.input(z.object({ sessionToken: z.string().min(20), organizationType: z.enum(["placement_partner", "employer"]), legalName: z.string().trim().min(2).max(255), country: z.string().trim().min(2).max(120), contactEmail: z.string().email(), verified: z.boolean() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
    const now = new Date();
    const result = await db.insert(placementOrganizations).values({ organizationType: input.organizationType, legalName: input.legalName, country: input.country, contactEmail: input.contactEmail.toLowerCase(), verificationStatus: input.verified ? "verified" : "pending", verifiedAt: input.verified ? now : null, verifiedByAdminId: input.verified ? admin.id : null });
    return { organizationId: Number((result as any)[0]?.insertId ?? 0) };
  }),

  adminCreateEmployerAccess: publicProcedure.input(z.object({ sessionToken: z.string().min(20), organizationId: z.number().int().positive(), fullName: z.string().trim().min(2).max(255), email: z.string().email() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
    const organization = (await db.select().from(placementOrganizations).where(and(eq(placementOrganizations.id, input.organizationId), eq(placementOrganizations.verificationStatus, "verified"))).limit(1))[0];
    if (!organization) throw new TRPCError({ code: "BAD_REQUEST", message: "Vérifiez l’organisation avant de créer son accès." });
    const temporaryPassword = randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    await db.insert(placementEmployerAccounts).values({ organizationId: organization.id, fullName: input.fullName, email: input.email.toLowerCase(), passwordHash, status: "active", createdByAdminId: admin.id });
    return { temporaryPassword, message: "Accès créé. Remettez les identifiants par un canal approuvé après vérification humaine." };
  }),

  adminCreateProfile: publicProcedure.input(z.object({ sessionToken: z.string().min(20), candidateId: z.number().int().positive(), summary: z.string().trim().min(30).max(4000), targetDestination: z.string().trim().min(2).max(120), targetProcedure: z.string().trim().min(2).max(160), sector: z.string().trim().max(160).optional(), yearsExperience: z.string().trim().max(32).optional(), languagesSummary: z.string().trim().max(255).optional() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
    const [candidate, consent] = await Promise.all([
      db.select().from(candidates).where(eq(candidates.id, input.candidateId)).limit(1),
      db.select().from(candidatePlacementConsents).where(eq(candidatePlacementConsents.candidateId, input.candidateId)).limit(1),
    ]);
    if (!candidate[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Candidat introuvable." });
    if (consent[0]?.status !== "granted") throw new TRPCError({ code: "FORBIDDEN", message: "Le candidat doit d’abord consentir au partage d’un profil anonymisé." });
    const result = await db.insert(placementCandidateProfiles).values({ candidateId: input.candidateId, profileCode: makeProfileCode(), summary: input.summary, targetDestination: input.targetDestination, targetProcedure: input.targetProcedure, sector: input.sector ?? null, yearsExperience: input.yearsExperience ?? null, languagesSummary: input.languagesSummary ?? null, createdByAdminId: admin.id });
    return { profileId: Number((result as any)[0]?.insertId ?? 0) };
  }),

  adminSubmitProfile: publicProcedure.input(z.object({ sessionToken: z.string().min(20), profileId: z.number().int().positive(), organizationId: z.number().int().positive(), adminNote: z.string().trim().max(1000).optional() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
    const [profile, organization] = await Promise.all([
      db.select().from(placementCandidateProfiles).where(and(eq(placementCandidateProfiles.id, input.profileId), isNull(placementCandidateProfiles.archivedAt))).limit(1),
      db.select().from(placementOrganizations).where(and(eq(placementOrganizations.id, input.organizationId), eq(placementOrganizations.verificationStatus, "verified"))).limit(1),
    ]);
    if (!profile[0] || !organization[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Profil ou organisation vérifiée introuvable." });
    const consent = (await db.select().from(candidatePlacementConsents).where(eq(candidatePlacementConsents.candidateId, profile[0].candidateId)).limit(1))[0];
    if (consent?.status !== "granted") throw new TRPCError({ code: "FORBIDDEN", message: "Le consentement du candidat n’est plus actif." });
    const result = await db.insert(placementProfileSubmissions).values({ profileId: profile[0].id, organizationId: organization[0].id, submittedByAdminId: admin.id, adminNote: input.adminNote ?? null });
    const submissionId = Number((result as any)[0]?.insertId ?? 0);
    await db.insert(placementSubmissionEvents).values({ submissionId, actorType: "admin", actorId: admin.id, action: "profile_submitted", note: "Profil anonymisé transmis à une organisation vérifiée." });
    return { submissionId };
  }),

  employerLogin: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(1) })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
    const account = (await db.select().from(placementEmployerAccounts).where(eq(placementEmployerAccounts.email, input.email.toLowerCase())).limit(1))[0];
    if (!account || account.status !== "active" || !(await bcrypt.compare(input.password, account.passwordHash))) throw new TRPCError({ code: "UNAUTHORIZED", message: "Identifiants employeur invalides." });
    const organization = (await db.select().from(placementOrganizations).where(and(eq(placementOrganizations.id, account.organizationId), eq(placementOrganizations.verificationStatus, "verified"))).limit(1))[0];
    if (!organization) throw new TRPCError({ code: "FORBIDDEN", message: "Accès organisation non vérifié." });
    const rawToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + employerSessionHours * 60 * 60 * 1000);
    await db.update(placementEmployerAccounts).set({ sessionTokenHash: hashToken(rawToken), sessionExpiresAt: expiresAt, lastLoginAt: new Date() }).where(eq(placementEmployerAccounts.id, account.id));
    return { sessionToken: rawToken, expiresAt, organization: { name: organization.legalName, country: organization.country } };
  }),

  employerProfiles: publicProcedure.input(z.object({ sessionToken: z.string().min(32) })).query(async ({ input }) => {
    const { db, organization } = await getEmployerSession(input.sessionToken);
    const submissions = await db.select({ submission: placementProfileSubmissions, profile: placementCandidateProfiles }).from(placementProfileSubmissions).innerJoin(placementCandidateProfiles, eq(placementProfileSubmissions.profileId, placementCandidateProfiles.id)).where(and(eq(placementProfileSubmissions.organizationId, organization.id), isNull(placementCandidateProfiles.archivedAt)));
    return submissions.map(({ submission, profile }) => ({ submissionId: submission.id, status: submission.status, submittedAt: submission.submittedAt, lastResponseAt: submission.lastResponseAt, profile: { code: profile.profileCode, summary: profile.summary, targetDestination: profile.targetDestination, targetProcedure: profile.targetProcedure, sector: profile.sector, yearsExperience: profile.yearsExperience, languagesSummary: profile.languagesSummary } }));
  }),

  employerRecordDecision: publicProcedure.input(z.object({ sessionToken: z.string().min(32), submissionId: z.number().int().positive(), decision: z.enum(["under_review", "shortlisted", "selected", "not_selected", "documents_requested"]), note: z.string().trim().max(1000).optional() })).mutation(async ({ input }) => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    const submission = (await db.select().from(placementProfileSubmissions).where(and(eq(placementProfileSubmissions.id, input.submissionId), eq(placementProfileSubmissions.organizationId, organization.id))).limit(1))[0];
    if (!submission) throw new TRPCError({ code: "NOT_FOUND", message: "Profil non accessible." });
    const now = new Date();
    await db.update(placementProfileSubmissions).set({ status: input.decision, lastResponseAt: now }).where(eq(placementProfileSubmissions.id, submission.id));
    await db.insert(placementSubmissionEvents).values({ submissionId: submission.id, actorType: "employer", actorId: account.id, action: input.decision, note: input.note ?? null });
    return { message: "Retour enregistré. L’équipe 3M le vérifiera avant toute communication au candidat." };
  }),
});
