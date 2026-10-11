import { TRPCError } from "@trpc/server";
import { createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  candidateSynthesisEvents,
  candidateSynthesisShareConsents,
  candidateSynthesisSheets,
  candidates,
  evaluations,
  placementEmployerAccounts,
  placementOrganizations,
} from "../../drizzle/schema";
import {
  findLeakedContactSignals,
  formatDisplayName,
  SYNTHESIS_STATUS_LABELS,
  SynthesisContentSchema,
  type SynthesisContent,
} from "../../shared/candidateSynthesisSheet";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { generateSynthesisBio, mergeBioIntoContent } from "../services/candidateSynthesisGenerator";
import {
  getValidatedSynthesisForOrg,
  loadDossierDocuments,
  restructureSynthesisAfterDocumentChange,
  buildDocumentRefs,
} from "../services/candidateSynthesisStructure";
import { requireValidAdminSession } from "./adminAuth";
import { verifyCandidateToken } from "./candidate";
import { createCvDraftLimiter } from "./cvDraft";

const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");

async function getPartnerSession(rawToken: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
  const account = (
    await db
      .select()
      .from(placementEmployerAccounts)
      .where(and(eq(placementEmployerAccounts.sessionTokenHash, hashToken(rawToken)), eq(placementEmployerAccounts.status, "active")))
      .limit(1)
  )[0];
  if (!account || !account.sessionExpiresAt || account.sessionExpiresAt <= new Date()) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Session partenaire expirée ou invalide." });
  }
  const organization = (
    await db
      .select()
      .from(placementOrganizations)
      .where(and(eq(placementOrganizations.id, account.organizationId), eq(placementOrganizations.verificationStatus, "verified")))
      .limit(1)
  )[0];
  if (!organization) throw new TRPCError({ code: "FORBIDDEN", message: "Organisation non vérifiée ou accès suspendu." });
  return { db, account, organization };
}

const adminInput = z.object({ sessionToken: z.string().min(1), candidateId: z.number().int().positive() });
const allowGenerate = createCvDraftLimiter(15);

async function logEvent(input: {
  sheetId: number;
  candidateId: number;
  actorType: "admin" | "employer" | "agency" | "candidate" | "system";
  actorRef?: string | null;
  action: string;
  note?: string | null;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(candidateSynthesisEvents).values({
    sheetId: input.sheetId,
    candidateId: input.candidateId,
    actorType: input.actorType,
    actorRef: input.actorRef ?? null,
    action: input.action,
    note: input.note ?? null,
  });
}

async function loadShareConsent(candidateId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db
    .select()
    .from(candidateSynthesisShareConsents)
    .where(eq(candidateSynthesisShareConsents.candidateId, candidateId))
    .limit(1);
  return row?.status === "granted";
}

function parseContent(raw: string | null | undefined): SynthesisContent | null {
  if (!raw) return null;
  try {
    return SynthesisContentSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export const candidateSynthesisRouter = router({
  /** Consentement candidat : partage fiche + photo. */
  getShareConsent: publicProcedure
    .input(z.object({ candidateToken: z.string().min(20) }))
    .query(async ({ input }) => {
      const candidateId = verifyCandidateToken(input.candidateToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
      const [row] = await db
        .select()
        .from(candidateSynthesisShareConsents)
        .where(eq(candidateSynthesisShareConsents.candidateId, candidateId))
        .limit(1);
      return { status: row?.status ?? "withdrawn", consentedAt: row?.consentedAt ?? null };
    }),

  setShareConsent: publicProcedure
    .input(z.object({ candidateToken: z.string().min(20), consented: z.boolean() }))
    .mutation(async ({ input }) => {
      const candidateId = verifyCandidateToken(input.candidateToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
      const now = new Date();
      const [existing] = await db
        .select()
        .from(candidateSynthesisShareConsents)
        .where(eq(candidateSynthesisShareConsents.candidateId, candidateId))
        .limit(1);
      if (existing) {
        await db
          .update(candidateSynthesisShareConsents)
          .set({
            status: input.consented ? "granted" : "withdrawn",
            consentedAt: input.consented ? now : existing.consentedAt,
            withdrawnAt: input.consented ? null : now,
          })
          .where(eq(candidateSynthesisShareConsents.id, existing.id));
      } else {
        await db.insert(candidateSynthesisShareConsents).values({
          candidateId,
          status: input.consented ? "granted" : "withdrawn",
          consentedAt: input.consented ? now : null,
          withdrawnAt: input.consented ? null : now,
        });
      }
      if (!input.consented) {
        await db
          .update(candidateSynthesisSheets)
          .set({ status: "needs_revalidation", validatedAt: null, validatedByAdminEmail: null })
          .where(and(eq(candidateSynthesisSheets.candidateId, candidateId), eq(candidateSynthesisSheets.status, "validated")));
      }
      return { status: input.consented ? ("granted" as const) : ("withdrawn" as const) };
    }),

  /** État admin de la fiche (brouillon + pièces structurées). */
  adminGet: publicProcedure.input(adminInput).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
    await restructureSynthesisAfterDocumentChange(input.candidateId);
    const [sheet] = await db
      .select()
      .from(candidateSynthesisSheets)
      .where(eq(candidateSynthesisSheets.candidateId, input.candidateId))
      .orderBy(desc(candidateSynthesisSheets.version), desc(candidateSynthesisSheets.id))
      .limit(1);
    const [candidate] = await db
      .select({
        id: candidates.id,
        fullName: candidates.fullName,
        avatarUrl: candidates.avatarUrl,
        avatarVerificationStatus: candidates.avatarVerificationStatus,
      })
      .from(candidates)
      .where(eq(candidates.id, input.candidateId))
      .limit(1);
    if (!candidate) throw new TRPCError({ code: "NOT_FOUND", message: "Candidat introuvable." });
    const shareConsent = await loadShareConsent(input.candidateId);
    const draft = parseContent(sheet?.draftJson);
    const content = parseContent(sheet?.contentJson);
    return {
      sheet: sheet
        ? {
            id: sheet.id,
            version: sheet.version,
            status: sheet.status,
            statusLabel: SYNTHESIS_STATUS_LABELS[sheet.status],
            portraitUrl: sheet.portraitUrl,
            missing: sheet.missingJson ? JSON.parse(sheet.missingJson) : [],
            unverified: sheet.unverifiedJson ? JSON.parse(sheet.unverifiedJson) : [],
            generatedAt: sheet.generatedAt,
            validatedAt: sheet.validatedAt,
            rejectedAt: sheet.rejectedAt,
            rejectionReason: sheet.rejectionReason,
          }
        : null,
      draft,
      content,
      shareConsent,
      candidate: {
        id: candidate.id,
        fullName: candidate.fullName,
        avatarUrl: candidate.avatarUrl,
        avatarVerified: candidate.avatarVerificationStatus === "verified",
      },
    };
  }),

  /** Génère / régénère le brouillon biographique (IA) + structure des pièces. */
  adminGenerate: publicProcedure.input(adminInput).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    if (!allowGenerate(admin.email.toLowerCase(), Date.now())) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Limite de générations atteinte (15/h). Réessayez plus tard." });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
    const shareConsent = await loadShareConsent(input.candidateId);
    if (!shareConsent) throw new TRPCError({ code: "FORBIDDEN", message: "Le candidat n’a pas autorisé le partage de sa fiche et de sa photo." });

    const structured = await restructureSynthesisAfterDocumentChange(input.candidateId);
    if (structured.ok === false) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: structured.error });

    const [evaluation] = await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.candidateId, input.candidateId))
      .orderBy(desc(evaluations.createdAt))
      .limit(1);
    if (!evaluation) throw new TRPCError({ code: "NOT_FOUND", message: "Aucune évaluation liée à ce candidat." });

    const docs = await loadDossierDocuments(input.candidateId);
    const documentRefs = buildDocumentRefs(docs);
    const outcome = await generateSynthesisBio(evaluation, {
      shareConsentGranted: true,
      documentsSummary: documentRefs.map((doc) => `${doc.label} (${doc.status})`).join(", ") || "aucune",
    });
    if (outcome.ok === false) {
      throw new TRPCError({
        code: outcome.reason === "no_consent" || outcome.reason === "no_cv_consent" || outcome.reason === "no_share_consent" ? "FORBIDDEN" : "BAD_REQUEST",
        message: outcome.error,
      });
    }

    const [sheet] = await db
      .select()
      .from(candidateSynthesisSheets)
      .where(eq(candidateSynthesisSheets.candidateId, input.candidateId))
      .orderBy(desc(candidateSynthesisSheets.version))
      .limit(1);
    if (!sheet) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Fiche introuvable après structuration." });

    const base = parseContent(sheet.draftJson);
    if (!base) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Brouillon structurel invalide." });
    const merged = mergeBioIntoContent(base, outcome.bio);
    const nextVersion = sheet.status === "validated" || sheet.status === "needs_revalidation" ? sheet.version + 1 : sheet.version;

    if (nextVersion !== sheet.version) {
      const [inserted] = await db
        .insert(candidateSynthesisSheets)
        .values({
          candidateId: input.candidateId,
          version: nextVersion,
          status: "draft",
          draftJson: JSON.stringify(merged),
          contentJson: null,
          sourceFingerprint: sheet.sourceFingerprint,
          portraitUrl: sheet.portraitUrl,
          missingJson: JSON.stringify(merged.missing),
          unverifiedJson: JSON.stringify(outcome.unverified),
          generatedByAdminEmail: admin.email,
          generatedAt: new Date(),
        })
        .$returningId();
      const sheetId = Number(inserted?.id || 0);
      if (sheetId) await logEvent({ sheetId, candidateId: input.candidateId, actorType: "admin", actorRef: admin.email, action: "generated", note: `v${nextVersion}` });
      return { sheetId, version: nextVersion, draft: merged, unverified: outcome.unverified };
    }

    await db
      .update(candidateSynthesisSheets)
      .set({
        status: "draft",
        draftJson: JSON.stringify(merged),
        missingJson: JSON.stringify(merged.missing),
        unverifiedJson: JSON.stringify(outcome.unverified),
        generatedByAdminEmail: admin.email,
        generatedAt: new Date(),
        rejectionReason: null,
      })
      .where(eq(candidateSynthesisSheets.id, sheet.id));
    await logEvent({ sheetId: sheet.id, candidateId: input.candidateId, actorType: "admin", actorRef: admin.email, action: "generated", note: `v${sheet.version}` });
    return { sheetId: sheet.id, version: sheet.version, draft: merged, unverified: outcome.unverified };
  }),

  adminSaveDraft: publicProcedure
    .input(adminInput.extend({ draft: SynthesisContentSchema }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
      const leaks = findLeakedContactSignals(input.draft);
      if (leaks.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Coordonnées détectées dans le brouillon (${leaks.join(", ")}). Retirez-les avant enregistrement.` });
      }
      const [sheet] = await db
        .select()
        .from(candidateSynthesisSheets)
        .where(eq(candidateSynthesisSheets.candidateId, input.candidateId))
        .orderBy(desc(candidateSynthesisSheets.version))
        .limit(1);
      if (!sheet) throw new TRPCError({ code: "NOT_FOUND", message: "Fiche introuvable." });
      await db
        .update(candidateSynthesisSheets)
        .set({
          draftJson: JSON.stringify(input.draft),
          status: sheet.status === "validated" ? "needs_revalidation" : "draft",
          missingJson: JSON.stringify(input.draft.missing),
        })
        .where(eq(candidateSynthesisSheets.id, sheet.id));
      await logEvent({ sheetId: sheet.id, candidateId: input.candidateId, actorType: "admin", actorRef: admin.email, action: "draft_saved" });
      return { ok: true as const };
    }),

  adminValidate: publicProcedure.input(adminInput).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
    if (!(await loadShareConsent(input.candidateId))) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Consentement de partage fiche/photo manquant." });
    }
    const [sheet] = await db
      .select()
      .from(candidateSynthesisSheets)
      .where(eq(candidateSynthesisSheets.candidateId, input.candidateId))
      .orderBy(desc(candidateSynthesisSheets.version))
      .limit(1);
    if (!sheet?.draftJson) throw new TRPCError({ code: "BAD_REQUEST", message: "Aucun brouillon à valider." });
    const draft = parseContent(sheet.draftJson);
    if (!draft) throw new TRPCError({ code: "BAD_REQUEST", message: "Brouillon invalide." });
    const leaks = findLeakedContactSignals(draft);
    if (leaks.length) throw new TRPCError({ code: "BAD_REQUEST", message: `Impossible de valider : ${leaks.join(", ")}.` });
    await db
      .update(candidateSynthesisSheets)
      .set({
        status: "validated",
        contentJson: JSON.stringify(draft),
        validatedByAdminEmail: admin.email,
        validatedAt: new Date(),
        rejectedAt: null,
        rejectedByAdminEmail: null,
        rejectionReason: null,
      })
      .where(eq(candidateSynthesisSheets.id, sheet.id));
    await logEvent({ sheetId: sheet.id, candidateId: input.candidateId, actorType: "admin", actorRef: admin.email, action: "validated" });
    return { ok: true as const, status: "validated" as const };
  }),

  adminReject: publicProcedure
    .input(adminInput.extend({ reason: z.string().trim().min(3).max(500) }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base indisponible." });
      const [sheet] = await db
        .select()
        .from(candidateSynthesisSheets)
        .where(eq(candidateSynthesisSheets.candidateId, input.candidateId))
        .orderBy(desc(candidateSynthesisSheets.version))
        .limit(1);
      if (!sheet) throw new TRPCError({ code: "NOT_FOUND", message: "Fiche introuvable." });
      await db
        .update(candidateSynthesisSheets)
        .set({
          status: "rejected",
          contentJson: null,
          rejectedByAdminEmail: admin.email,
          rejectedAt: new Date(),
          rejectionReason: input.reason,
          validatedAt: null,
          validatedByAdminEmail: null,
        })
        .where(eq(candidateSynthesisSheets.id, sheet.id));
      await logEvent({ sheetId: sheet.id, candidateId: input.candidateId, actorType: "admin", actorRef: admin.email, action: "rejected", note: input.reason });
      return { ok: true as const, status: "rejected" as const };
    }),

  /** Métadonnées pour les portails employeur / agence (pas le contenu brut sans contrôle). */
  partnerAvailability: publicProcedure
    .input(z.object({ sessionToken: z.string().min(32), submissionId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const session = await getPartnerSession(input.sessionToken);
      const { placementProfileSubmissions, placementCandidateProfiles } = await import("../../drizzle/schema");
      const [row] = await session.db
        .select({
          candidateId: placementCandidateProfiles.candidateId,
          profileCode: placementCandidateProfiles.profileCode,
        })
        .from(placementProfileSubmissions)
        .innerJoin(placementCandidateProfiles, eq(placementProfileSubmissions.profileId, placementCandidateProfiles.id))
        .where(
          and(
            eq(placementProfileSubmissions.id, input.submissionId),
            eq(placementProfileSubmissions.organizationId, session.organization.id),
          ),
        )
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Soumission introuvable pour votre organisation." });
      const validated = await getValidatedSynthesisForOrg({ organizationId: session.organization.id, candidateId: row.candidateId });
      return {
        available: Boolean(validated),
        profileCode: row.profileCode,
        displayName: validated
          ? formatDisplayName(validated.content.displayFirstName, validated.content.displayLastInitial)
          : null,
        version: validated?.version ?? null,
      };
    }),

  /** Contenu validé pour rendu PDF côté portail (org vérifiée + soumission + consentement). */
  partnerGetValidated: publicProcedure
    .input(z.object({ sessionToken: z.string().min(32), submissionId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const session = await getPartnerSession(input.sessionToken);
      const { placementProfileSubmissions, placementCandidateProfiles } = await import("../../drizzle/schema");
      const [row] = await session.db
        .select({ candidateId: placementCandidateProfiles.candidateId, profileCode: placementCandidateProfiles.profileCode })
        .from(placementProfileSubmissions)
        .innerJoin(placementCandidateProfiles, eq(placementProfileSubmissions.profileId, placementCandidateProfiles.id))
        .where(
          and(
            eq(placementProfileSubmissions.id, input.submissionId),
            eq(placementProfileSubmissions.organizationId, session.organization.id),
          ),
        )
        .limit(1);
      if (!row) throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé à cette fiche." });
      const validated = await getValidatedSynthesisForOrg({ organizationId: session.organization.id, candidateId: row.candidateId });
      if (!validated) throw new TRPCError({ code: "NOT_FOUND", message: "Aucune fiche validée disponible pour ce profil." });
      await logEvent({
        sheetId: validated.sheetId,
        candidateId: row.candidateId,
        actorType: session.organization.organizationType === "employer" ? "employer" : "agency",
        actorRef: session.account.email,
        action: "downloaded",
        note: `submission:${input.submissionId}`,
      });
      return {
        profileCode: row.profileCode,
        version: validated.version,
        portraitUrl: validated.portraitUrl,
        content: validated.content,
        organizationType: session.organization.organizationType,
      };
    }),
});
