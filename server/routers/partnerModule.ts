import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { and, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import {
  adminNotifications,
  partnerInteractions,
  partnerInvitations,
  partnerProfiles,
  partnerRegistrationExtras,
  partnerUserPermissions,
  placementAccessRequests,
  placementEmployerAccounts,
  placementOrganizations,
} from "../../drizzle/schema";
import {
  AUTHORIZATION_DOCUMENT_MAX_BYTES,
  INVITATION_DEFAULT_HOURS,
  INVITATION_MAX_PENDING_PER_ORGANIZATION,
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABELS,
  PARTNER_INTERACTION_KINDS,
  PARTNER_RELATIONSHIP_STATUSES,
  PARTNER_ROUTES,
  clampInvitationHours,
  defaultCategoryForOrganizationType,
  detectAuthorizationDocumentType,
  invitationState,
  partnerPasswordProblem,
  resolvePartnerPermissions,
  sanitizePartnerPermissions,
} from "../../shared/partnerModule";
import { sendEmail } from "../_core/email";
import { logger } from "../_core/logger";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { checkLoginAttempts, recordFailedAttempt, resetLoginAttempts } from "../loginAttemptsService";
import { adminLabel, logPartnerInteraction } from "../services/partnerProfiles";
import { storageGetSignedUrl, storagePut } from "../storage";
import { requireValidAdminSession } from "./adminAuth";
import { getEmployerSession, hashToken, requireEmployerManager } from "./placementPortal";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const SITE_URL = (process.env.SITE_URL || "https://www.3mtravelagency.com").replace(/\/$/, "");
const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Une migration non appliquée ne doit jamais casser le reste du site : message clair, pas d'erreur technique. */
async function guarded<T>(label: string, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    if (/ER_NO_SUCH_TABLE|doesn't exist/i.test(detail)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le module partenaires n’est pas encore activé : la migration 0081 doit être appliquée." });
    }
    logger.error(`partner_module.${label}`, {}, error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Opération impossible pour le moment. Réessayez dans quelques instants." });
  }
}

async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
  return db;
}

const invitationLink = (token: string) => `${SITE_URL}${PARTNER_ROUTES.activation}?token=${encodeURIComponent(token)}`;

function buildInvitationEmail(input: { fullName: string; organizationName: string; link: string; hours: number }) {
  return {
    subject: "Votre invitation à rejoindre l’espace partenaire de 3M TRAVEL AGENCY",
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#172554">
<h2 style="margin:0 0 12px;color:#1d4ed8">Activez votre accès partenaire</h2>
<p>Bonjour ${esc(input.fullName)},</p>
<p>${esc(input.organizationName)} vous invite à rejoindre son espace sur 3M TRAVEL AGENCY. Ce lien est personnel, à usage unique et valable ${input.hours} heures.</p>
<p style="margin:20px 0"><a href="${esc(input.link)}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Choisir mon mot de passe</a></p>
<p style="font-size:13px;color:#475569">Si vous n’attendiez pas ce message, ignorez-le : aucun accès ne sera créé. 3M TRAVEL AGENCY ne vous demandera jamais votre mot de passe par e-mail.</p>
</div>`,
  };
}

async function createInvitation(
  db: Db,
  organization: { id: number; legalName: string },
  input: { email: string; fullName: string; role: "reader" | "manager"; permissions?: Record<string, unknown>; hours?: number },
  by: { adminId?: number; accountId?: number },
) {
  const email = input.email.trim().toLowerCase();
  const existingAccount = (await db.select({ id: placementEmployerAccounts.id }).from(placementEmployerAccounts).where(eq(placementEmployerAccounts.email, email)).limit(1))[0];
  if (existingAccount) throw new TRPCError({ code: "CONFLICT", message: "Un accès existe déjà pour cet e-mail." });
  const now = new Date();
  const [{ pending = 0 } = { pending: 0 }] = await db
    .select({ pending: sql<number>`count(*)` })
    .from(partnerInvitations)
    .where(and(eq(partnerInvitations.organizationId, organization.id), isNull(partnerInvitations.usedAt), isNull(partnerInvitations.revokedAt), gt(partnerInvitations.expiresAt, now)));
  if (Number(pending) >= INVITATION_MAX_PENDING_PER_ORGANIZATION) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Trop d’invitations en attente pour cette organisation. Révoquez les invitations inutiles." });
  }
  // Une nouvelle invitation remplace les précédentes encore valables pour la même adresse.
  await db.update(partnerInvitations).set({ revokedAt: now })
    .where(and(eq(partnerInvitations.organizationId, organization.id), eq(partnerInvitations.email, email), isNull(partnerInvitations.usedAt), isNull(partnerInvitations.revokedAt)));
  const token = randomBytes(32).toString("base64url");
  const hours = clampInvitationHours(input.hours ?? INVITATION_DEFAULT_HOURS);
  const expiresAt = new Date(now.getTime() + hours * 3_600_000);
  const overrides = sanitizePartnerPermissions(input.permissions);
  await db.insert(partnerInvitations).values({
    organizationId: organization.id,
    email,
    fullName: input.fullName.trim(),
    collaborationRole: input.role,
    permissions: Object.keys(overrides).length ? JSON.stringify(overrides) : null,
    tokenHash: hashToken(token),
    expiresAt,
    createdByAdminId: by.adminId ?? null,
    createdByAccountId: by.accountId ?? null,
  });
  const link = invitationLink(token);
  let emailSent = false;
  try {
    const mail = buildInvitationEmail({ fullName: input.fullName.trim(), organizationName: organization.legalName, link, hours });
    await sendEmail({ to: email, subject: mail.subject, html: mail.html });
    emailSent = true;
  } catch (mailError) {
    logger.error("partner_module.invitation_mail_failed", { organizationId: organization.id }, mailError);
  }
  return { link, expiresAt, emailSent };
}

const emailSchema = z.string().email().max(320);
const sessionSchema = z.string().min(20);
const roleSchema = z.enum(["reader", "manager"]);
const permissionsSchema = z.object({
  viewCvtheque: z.boolean().optional(),
  submitNeeds: z.boolean().optional(),
  requestInterviews: z.boolean().optional(),
  inviteUsers: z.boolean().optional(),
}).optional();

export const partnerModuleRouter = router({
  // ───────────────────────── Public : inscription (pièce d'autorisation) et activation d'invitation ─────────────────────────

  uploadAuthorizationDocument: publicProcedure.input(z.object({
    requestId: z.number().int().positive(),
    uploadToken: z.string().min(20).max(200),
    fileName: z.string().trim().min(1).max(200),
    fileBase64: z.string().min(40).max(Math.ceil(AUTHORIZATION_DOCUMENT_MAX_BYTES * 1.4)),
  })).mutation(({ input }) => guarded("upload_authorization", async () => {
    const limitKey = `partner-upload:${input.requestId}`;
    checkLoginAttempts(limitKey);
    const db = await requireDb();
    const extras = (await db.select().from(partnerRegistrationExtras).where(eq(partnerRegistrationExtras.requestId, input.requestId)).limit(1))[0];
    if (!extras || !extras.uploadTokenHash || extras.uploadTokenHash !== hashToken(input.uploadToken) || !extras.uploadTokenExpiresAt || extras.uploadTokenExpiresAt <= new Date()) {
      recordFailedAttempt(limitKey);
      throw new TRPCError({ code: "FORBIDDEN", message: "Le délai pour joindre le justificatif est dépassé. Envoyez-le par e-mail à 3M TRAVEL AGENCY." });
    }
    const bytes = Buffer.from(input.fileBase64, "base64");
    if (bytes.length === 0 || bytes.length > AUTHORIZATION_DOCUMENT_MAX_BYTES) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Le justificatif doit peser moins de 5 Mo." });
    }
    const mime = detectAuthorizationDocumentType(bytes);
    if (!mime) throw new TRPCError({ code: "BAD_REQUEST", message: "Format non accepté : joignez un PDF, un JPEG ou un PNG." });
    const extension = mime === "application/pdf" ? "pdf" : mime === "image/png" ? "png" : "jpg";
    const stored = await storagePut(`partner-authorizations/${input.requestId}/authorization.${extension}`, bytes, mime);
    await db.update(partnerRegistrationExtras).set({
      authorizationDocKey: stored.key,
      authorizationDocName: input.fileName.replace(/[\r\n\\/]/g, " ").slice(0, 200),
      authorizationDocMime: mime,
      uploadTokenHash: null,
      uploadTokenExpiresAt: null,
    }).where(eq(partnerRegistrationExtras.id, extras.id));
    resetLoginAttempts(limitKey);
    return { ok: true as const };
  })),

  getInvitation: publicProcedure.input(z.object({ token: z.string().min(20).max(200) })).query(({ input }) => guarded("get_invitation", async () => {
    const db = await requireDb();
    const invitation = (await db.select().from(partnerInvitations).where(eq(partnerInvitations.tokenHash, hashToken(input.token))).limit(1))[0];
    if (!invitation) return { state: "invalid" as const };
    const state = invitationState(invitation);
    if (state !== "valid") return { state };
    const organization = (await db.select({ legalName: placementOrganizations.legalName, verificationStatus: placementOrganizations.verificationStatus }).from(placementOrganizations).where(eq(placementOrganizations.id, invitation.organizationId)).limit(1))[0];
    if (!organization || organization.verificationStatus !== "verified") return { state: "invalid" as const };
    return { state: "valid" as const, organizationName: organization.legalName, fullName: invitation.fullName, email: invitation.email, expiresAt: invitation.expiresAt };
  })),

  activateInvitation: publicProcedure.input(z.object({
    token: z.string().min(20).max(200),
    password: z.string().min(1).max(128),
    fullName: z.string().trim().min(2).max(255).optional(),
  })).mutation(({ input }) => guarded("activate_invitation", async () => {
    const tokenHash = hashToken(input.token);
    const limitKey = `partner-invite:${tokenHash.slice(0, 24)}`;
    checkLoginAttempts(limitKey);
    const db = await requireDb();
    const invitation = (await db.select().from(partnerInvitations).where(eq(partnerInvitations.tokenHash, tokenHash)).limit(1))[0];
    if (!invitation || invitationState(invitation) !== "valid") {
      recordFailedAttempt(limitKey);
      throw new TRPCError({ code: "BAD_REQUEST", message: "Ce lien d’invitation n’est plus valable. Demandez-en un nouveau à 3M TRAVEL AGENCY ou au gestionnaire de votre organisation." });
    }
    const problem = partnerPasswordProblem(input.password);
    if (problem) throw new TRPCError({ code: "BAD_REQUEST", message: problem });
    const organization = (await db.select().from(placementOrganizations).where(and(eq(placementOrganizations.id, invitation.organizationId), eq(placementOrganizations.verificationStatus, "verified"))).limit(1))[0];
    if (!organization) throw new TRPCError({ code: "FORBIDDEN", message: "Organisation non vérifiée : l’activation est suspendue." });
    const existing = (await db.select({ id: placementEmployerAccounts.id }).from(placementEmployerAccounts).where(eq(placementEmployerAccounts.email, invitation.email)).limit(1))[0];
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Un accès existe déjà pour cet e-mail. Utilisez la connexion." });
    const passwordHash = await bcrypt.hash(input.password, 12);
    const created = await db.insert(placementEmployerAccounts).values({
      organizationId: organization.id,
      fullName: input.fullName?.trim() || invitation.fullName,
      email: invitation.email,
      passwordHash,
      status: "active",
      collaborationRole: invitation.collaborationRole,
      createdByAdminId: invitation.createdByAdminId ?? 0,
    });
    const accountId = Number((created as any)[0]?.insertId ?? 0);
    if (invitation.permissions && accountId) {
      await db.insert(partnerUserPermissions).values({ accountId, permissions: invitation.permissions, updatedByLabel: "Invitation" });
    }
    await db.update(partnerInvitations).set({ usedAt: new Date() }).where(eq(partnerInvitations.id, invitation.id));
    await logPartnerInteraction(db, { organizationId: organization.id, kind: "invitation", summary: `Invitation activée : ${invitation.fullName} (${invitation.collaborationRole === "manager" ? "gestionnaire" : "lecteur"}).` });
    resetLoginAttempts(limitKey);
    return { ok: true as const, organizationName: organization.legalName, loginUrl: PARTNER_ROUTES.login };
  })),

  // ───────────────────────── Employeur connecté : équipe et permissions ─────────────────────────

  employerMyPermissions: publicProcedure.input(z.object({ sessionToken: z.string().min(32) })).query(({ input }) => guarded("my_permissions", async () => {
    const { db, account } = await getEmployerSession(input.sessionToken);
    const stored = (await db.select().from(partnerUserPermissions).where(eq(partnerUserPermissions.accountId, account.id)).limit(1))[0];
    return { role: account.collaborationRole, permissions: resolvePartnerPermissions(account.collaborationRole, stored?.permissions) };
  })),

  employerTeam: publicProcedure.input(z.object({ sessionToken: z.string().min(32) })).query(({ input }) => guarded("team", async () => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    requireEmployerManager(account);
    const accounts = await db.select({ id: placementEmployerAccounts.id, fullName: placementEmployerAccounts.fullName, email: placementEmployerAccounts.email, role: placementEmployerAccounts.collaborationRole, status: placementEmployerAccounts.status, lastLoginAt: placementEmployerAccounts.lastLoginAt })
      .from(placementEmployerAccounts).where(eq(placementEmployerAccounts.organizationId, organization.id)).orderBy(placementEmployerAccounts.createdAt);
    const ids = accounts.map((item) => item.id);
    const stored = ids.length ? await db.select().from(partnerUserPermissions).where(inArray(partnerUserPermissions.accountId, ids)) : [];
    const byAccount = new Map(stored.map((row) => [row.accountId, row.permissions]));
    const invitations = await db.select().from(partnerInvitations).where(eq(partnerInvitations.organizationId, organization.id)).orderBy(desc(partnerInvitations.createdAt)).limit(50);
    return {
      members: accounts.map((item) => ({ ...item, permissions: resolvePartnerPermissions(item.role, byAccount.get(item.id)) })),
      invitations: invitations.map((item) => ({ id: item.id, email: item.email, fullName: item.fullName, role: item.collaborationRole, state: invitationState(item), expiresAt: item.expiresAt, createdAt: item.createdAt })),
    };
  })),

  employerInviteColleague: publicProcedure.input(z.object({
    sessionToken: z.string().min(32),
    email: emailSchema,
    fullName: z.string().trim().min(2).max(255),
    role: roleSchema.default("reader"),
    permissions: permissionsSchema,
    hours: z.number().int().min(1).max(24 * 14).optional(),
  })).mutation(({ input }) => guarded("invite_colleague", async () => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    requireEmployerManager(account);
    const result = await createInvitation(db, organization, { email: input.email, fullName: input.fullName, role: input.role, permissions: input.permissions, hours: input.hours }, { accountId: account.id });
    await logPartnerInteraction(db, { organizationId: organization.id, kind: "invitation", summary: `${account.fullName} a invité ${input.fullName} (${input.role === "manager" ? "gestionnaire" : "lecteur"}).` });
    try {
      await db.insert(adminNotifications).values({ type: "new_contact_message", title: "Nouvel utilisateur invité chez un partenaire", message: `${organization.legalName} : ${input.fullName} a été invité(e) par ${account.fullName}.`, relatedId: `org-${organization.id}`, targetAdminType: "accompagnement" });
    } catch (notifyError) {
      logger.error("partner_module.invite_admin_notification_failed", { organizationId: organization.id }, notifyError);
    }
    return { link: result.link, expiresAt: result.expiresAt, emailSent: result.emailSent };
  })),

  employerRevokeInvitation: publicProcedure.input(z.object({ sessionToken: z.string().min(32), invitationId: z.number().int().positive() })).mutation(({ input }) => guarded("revoke_invitation_employer", async () => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    requireEmployerManager(account);
    await db.update(partnerInvitations).set({ revokedAt: new Date() })
      .where(and(eq(partnerInvitations.id, input.invitationId), eq(partnerInvitations.organizationId, organization.id), isNull(partnerInvitations.usedAt)));
    return { ok: true as const };
  })),

  employerSetPermissions: publicProcedure.input(z.object({ sessionToken: z.string().min(32), accountId: z.number().int().positive(), permissions: permissionsSchema })).mutation(({ input }) => guarded("set_permissions", async () => {
    const { db, account, organization } = await getEmployerSession(input.sessionToken);
    requireEmployerManager(account);
    const target = (await db.select().from(placementEmployerAccounts).where(and(eq(placementEmployerAccounts.id, input.accountId), eq(placementEmployerAccounts.organizationId, organization.id))).limit(1))[0];
    if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur introuvable dans votre organisation." });
    if (target.collaborationRole === "manager") throw new TRPCError({ code: "BAD_REQUEST", message: "Un gestionnaire dispose de toutes les permissions. Passez-le en lecteur pour les limiter." });
    const overrides = sanitizePartnerPermissions(input.permissions);
    const payload = JSON.stringify(overrides);
    const existing = (await db.select({ id: partnerUserPermissions.id }).from(partnerUserPermissions).where(eq(partnerUserPermissions.accountId, target.id)).limit(1))[0];
    if (existing) await db.update(partnerUserPermissions).set({ permissions: payload, updatedByLabel: account.fullName.slice(0, 160) }).where(eq(partnerUserPermissions.id, existing.id));
    else await db.insert(partnerUserPermissions).values({ accountId: target.id, permissions: payload, updatedByLabel: account.fullName.slice(0, 160) });
    await logPartnerInteraction(db, { organizationId: organization.id, kind: "note", summary: `Permissions de ${target.fullName} modifiées par ${account.fullName}.` });
    return { permissions: resolvePartnerPermissions(target.collaborationRole, payload) };
  })),

  // ───────────────────────── Administration : suivi des partenaires ─────────────────────────

  adminPartnerOverview: publicProcedure.input(z.object({ sessionToken: sessionSchema })).query(({ input }) => guarded("admin_overview", async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const [organizations, profiles, accountCounts, invitationCounts, lastInteractions, requests] = await Promise.all([
      db.select().from(placementOrganizations).orderBy(desc(placementOrganizations.createdAt)).limit(1000),
      db.select().from(partnerProfiles).limit(2000),
      db.select({ organizationId: placementEmployerAccounts.organizationId, n: sql<number>`count(*)` }).from(placementEmployerAccounts).groupBy(placementEmployerAccounts.organizationId),
      db.select({ organizationId: partnerInvitations.organizationId, n: sql<number>`count(*)` }).from(partnerInvitations).where(and(isNull(partnerInvitations.usedAt), isNull(partnerInvitations.revokedAt), gt(partnerInvitations.expiresAt, new Date()))).groupBy(partnerInvitations.organizationId),
      db.select({ organizationId: partnerInteractions.organizationId, last: sql<Date>`max(${partnerInteractions.createdAt})` }).from(partnerInteractions).groupBy(partnerInteractions.organizationId),
      db.select({ id: placementAccessRequests.id, organizationId: placementAccessRequests.organizationId }).from(placementAccessRequests).where(sql`${placementAccessRequests.organizationId} is not null`).limit(2000),
    ]);
    const extras = requests.length ? await db.select().from(partnerRegistrationExtras).where(inArray(partnerRegistrationExtras.requestId, requests.map((request) => request.id))) : [];
    const profileByOrg = new Map(profiles.map((profile) => [profile.organizationId, profile]));
    const accountsByOrg = new Map(accountCounts.map((row) => [row.organizationId, Number(row.n)]));
    const invitesByOrg = new Map(invitationCounts.map((row) => [row.organizationId, Number(row.n)]));
    const lastByOrg = new Map(lastInteractions.map((row) => [row.organizationId, row.last]));
    const requestByOrg = new Map(requests.map((request) => [request.organizationId as number, request.id]));
    const extrasByRequest = new Map(extras.map((row) => [row.requestId, row]));
    return organizations.map((organization) => {
      const profile = profileByOrg.get(organization.id);
      const requestId = requestByOrg.get(organization.id);
      const extra = requestId ? extrasByRequest.get(requestId) : undefined;
      return {
        organizationId: organization.id,
        legalName: organization.legalName,
        country: organization.country,
        contactEmail: organization.contactEmail,
        organizationType: organization.organizationType,
        verificationStatus: organization.verificationStatus,
        category: profile?.category ?? extra?.category ?? defaultCategoryForOrganizationType(organization.organizationType),
        relationshipStatus: profile?.relationshipStatus ?? (organization.verificationStatus === "verified" ? "validated" : "in_verification"),
        hasProfile: Boolean(profile),
        primaryContactName: profile?.primaryContactName ?? null,
        primaryContactEmail: profile?.primaryContactEmail ?? organization.contactEmail,
        primaryContactPhone: profile?.primaryContactPhone ?? null,
        primaryContactRole: profile?.primaryContactRole ?? null,
        specialties: profile?.specialties ?? null,
        operatingCountries: profile?.operatingCountries ?? null,
        ownerAdminLabel: profile?.ownerAdminLabel ?? null,
        nextFollowUpAt: profile?.nextFollowUpAt ?? null,
        publicDisplayConsent: Boolean(profile?.publicDisplayConsent),
        mandateCompany: profile?.mandateCompany ?? extra?.mandateCompany ?? null,
        mandateConfidential: Boolean(profile?.mandateConfidential ?? extra?.mandateConfidential),
        internalNote: profile?.internalNote ?? null,
        hasAuthorizationDocument: Boolean(extra?.authorizationDocKey),
        authorizationDocumentName: extra?.authorizationDocName ?? null,
        accountsCount: accountsByOrg.get(organization.id) ?? 0,
        pendingInvitations: invitesByOrg.get(organization.id) ?? 0,
        lastInteractionAt: lastByOrg.get(organization.id) ?? null,
        createdAt: organization.createdAt,
      };
    });
  })),

  adminPartnerSaveProfile: publicProcedure.input(z.object({
    sessionToken: sessionSchema,
    organizationId: z.number().int().positive(),
    category: z.enum(PARTNER_CATEGORIES).optional(),
    relationshipStatus: z.enum(PARTNER_RELATIONSHIP_STATUSES).optional(),
    primaryContactName: z.string().trim().max(255).optional(),
    primaryContactEmail: z.string().trim().max(320).optional(),
    primaryContactPhone: z.string().trim().max(64).optional(),
    primaryContactRole: z.string().trim().max(160).optional(),
    specialties: z.string().trim().max(2000).optional(),
    operatingCountries: z.string().trim().max(2000).optional(),
    ownerAdminLabel: z.string().trim().max(160).optional(),
    nextFollowUpAt: z.string().datetime().nullable().optional(),
    publicDisplayConsent: z.boolean().optional(),
    mandateCompany: z.string().trim().max(255).optional(),
    mandateConfidential: z.boolean().optional(),
    internalNote: z.string().trim().max(4000).optional(),
  })).mutation(({ input }) => guarded("admin_save_profile", async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const organization = (await db.select().from(placementOrganizations).where(eq(placementOrganizations.id, input.organizationId)).limit(1))[0];
    if (!organization) throw new TRPCError({ code: "NOT_FOUND", message: "Organisation introuvable." });
    if (input.relationshipStatus === "active" && organization.verificationStatus !== "verified") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Vérifiez l’organisation avant de la passer en partenaire actif." });
    }
    const existing = (await db.select().from(partnerProfiles).where(eq(partnerProfiles.organizationId, organization.id)).limit(1))[0];
    const changes: Record<string, unknown> = {};
    const assign = (key: string, value: unknown) => { if (value !== undefined) changes[key] = value === "" ? null : value; };
    assign("category", input.category);
    assign("relationshipStatus", input.relationshipStatus);
    assign("primaryContactName", input.primaryContactName);
    assign("primaryContactEmail", input.primaryContactEmail);
    assign("primaryContactPhone", input.primaryContactPhone);
    assign("primaryContactRole", input.primaryContactRole);
    assign("specialties", input.specialties);
    assign("operatingCountries", input.operatingCountries);
    assign("ownerAdminLabel", input.ownerAdminLabel);
    assign("mandateCompany", input.mandateCompany);
    assign("mandateConfidential", input.mandateConfidential);
    assign("internalNote", input.internalNote);
    if (input.ownerAdminLabel !== undefined) changes.ownerAdminId = admin.id;
    if (input.nextFollowUpAt !== undefined) changes.nextFollowUpAt = input.nextFollowUpAt ? new Date(input.nextFollowUpAt) : null;
    if (input.publicDisplayConsent !== undefined) {
      changes.publicDisplayConsent = input.publicDisplayConsent;
      changes.publicDisplayConsentedAt = input.publicDisplayConsent ? new Date() : null;
    }
    if (existing) {
      if (Object.keys(changes).length) await db.update(partnerProfiles).set(changes).where(eq(partnerProfiles.id, existing.id));
    } else {
      await db.insert(partnerProfiles).values({
        organizationId: organization.id,
        category: input.category ?? defaultCategoryForOrganizationType(organization.organizationType),
        relationshipStatus: input.relationshipStatus ?? (organization.verificationStatus === "verified" ? "validated" : "in_verification"),
        ownerAdminId: admin.id,
        ownerAdminLabel: input.ownerAdminLabel ?? adminLabel(admin),
        ...changes,
      } as typeof partnerProfiles.$inferInsert);
    }
    const previousStatus = existing?.relationshipStatus;
    if (input.relationshipStatus && input.relationshipStatus !== previousStatus) {
      await logPartnerInteraction(db, { organizationId: organization.id, kind: "status_change", summary: `Statut : ${previousStatus ?? "—"} → ${input.relationshipStatus}.`, admin });
    }
    if (input.publicDisplayConsent !== undefined && Boolean(existing?.publicDisplayConsent) !== input.publicDisplayConsent) {
      await logPartnerInteraction(db, { organizationId: organization.id, kind: "document", summary: input.publicDisplayConsent ? "Autorisation d’afficher le nom du partenaire enregistrée." : "Autorisation d’affichage retirée.", admin });
    }
    return { ok: true as const };
  })),

  adminPartnerInteractions: publicProcedure.input(z.object({ sessionToken: sessionSchema, organizationId: z.number().int().positive() })).query(({ input }) => guarded("admin_interactions", async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    return db.select().from(partnerInteractions).where(eq(partnerInteractions.organizationId, input.organizationId)).orderBy(desc(partnerInteractions.createdAt)).limit(200);
  })),

  adminPartnerAddInteraction: publicProcedure.input(z.object({
    sessionToken: sessionSchema,
    organizationId: z.number().int().positive(),
    kind: z.enum(PARTNER_INTERACTION_KINDS).default("note"),
    summary: z.string().trim().min(3).max(4000),
    followUpAt: z.string().datetime().nullable().optional(),
  })).mutation(({ input }) => guarded("admin_add_interaction", async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const followUp = input.followUpAt ? new Date(input.followUpAt) : null;
    await logPartnerInteraction(db, { organizationId: input.organizationId, kind: input.kind, summary: input.summary, followUpAt: followUp, admin });
    if (followUp) {
      const existing = (await db.select({ id: partnerProfiles.id }).from(partnerProfiles).where(eq(partnerProfiles.organizationId, input.organizationId)).limit(1))[0];
      if (existing) await db.update(partnerProfiles).set({ nextFollowUpAt: followUp }).where(eq(partnerProfiles.id, existing.id));
    }
    return { ok: true as const };
  })),

  adminCreateInvitation: publicProcedure.input(z.object({
    sessionToken: sessionSchema,
    organizationId: z.number().int().positive(),
    email: emailSchema,
    fullName: z.string().trim().min(2).max(255),
    role: roleSchema.default("manager"),
    permissions: permissionsSchema,
    hours: z.number().int().min(1).max(24 * 14).optional(),
  })).mutation(({ input }) => guarded("admin_create_invitation", async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const organization = (await db.select().from(placementOrganizations).where(eq(placementOrganizations.id, input.organizationId)).limit(1))[0];
    if (!organization || organization.verificationStatus !== "verified") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Vérifiez l’organisation avant d’envoyer une invitation : l’accès n’est activé qu’après vérification." });
    }
    const result = await createInvitation(db, organization, { email: input.email, fullName: input.fullName, role: input.role, permissions: input.permissions, hours: input.hours }, { adminId: admin.id });
    await logPartnerInteraction(db, { organizationId: organization.id, kind: "invitation", summary: `Invitation envoyée à ${input.fullName} <${input.email.toLowerCase()}> (${input.role === "manager" ? "gestionnaire" : "lecteur"}), valable jusqu’au ${result.expiresAt.toLocaleString("fr-FR")}.`, admin });
    return { link: result.link, expiresAt: result.expiresAt, emailSent: result.emailSent };
  })),

  adminListInvitations: publicProcedure.input(z.object({ sessionToken: sessionSchema, organizationId: z.number().int().positive() })).query(({ input }) => guarded("admin_list_invitations", async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(partnerInvitations).where(eq(partnerInvitations.organizationId, input.organizationId)).orderBy(desc(partnerInvitations.createdAt)).limit(50);
    return rows.map((row) => ({ id: row.id, email: row.email, fullName: row.fullName, role: row.collaborationRole, state: invitationState(row), expiresAt: row.expiresAt, createdAt: row.createdAt }));
  })),

  adminRevokeInvitation: publicProcedure.input(z.object({ sessionToken: sessionSchema, invitationId: z.number().int().positive() })).mutation(({ input }) => guarded("admin_revoke_invitation", async () => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const invitation = (await db.select().from(partnerInvitations).where(eq(partnerInvitations.id, input.invitationId)).limit(1))[0];
    if (!invitation) throw new TRPCError({ code: "NOT_FOUND", message: "Invitation introuvable." });
    if (invitation.usedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Cette invitation a déjà été utilisée." });
    await db.update(partnerInvitations).set({ revokedAt: new Date() }).where(eq(partnerInvitations.id, invitation.id));
    await logPartnerInteraction(db, { organizationId: invitation.organizationId, kind: "invitation", summary: `Invitation de ${invitation.fullName} révoquée.`, admin });
    return { ok: true as const };
  })),

  adminAuthorizationDocumentUrl: publicProcedure.input(z.object({ sessionToken: sessionSchema, organizationId: z.number().int().positive() })).query(({ input }) => guarded("admin_authorization_url", async () => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const request = (await db.select({ id: placementAccessRequests.id }).from(placementAccessRequests).where(eq(placementAccessRequests.organizationId, input.organizationId)).orderBy(desc(placementAccessRequests.id)).limit(1))[0];
    const extras = request ? (await db.select().from(partnerRegistrationExtras).where(eq(partnerRegistrationExtras.requestId, request.id)).limit(1))[0] : undefined;
    if (!extras?.authorizationDocKey) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun justificatif d’autorisation n’a été joint." });
    return { url: await storageGetSignedUrl(extras.authorizationDocKey), fileName: extras.authorizationDocName ?? "justificatif-autorisation" };
  })),
});

export { PARTNER_CATEGORY_LABELS };
