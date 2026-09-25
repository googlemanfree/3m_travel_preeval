import { TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { caseActivityLogs, caseDocuments, clientNotifications, documentRequirements } from "../../drizzle/caseTrackingSchema";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { publicProcedure, router } from "../_core/trpc";
import { ensureOperationalCase, parseAdminCandidateReference } from "./admin";
import { requireValidAdminSession } from "./adminAuth";
import {
  DEPOSIT_MAX_BASE64_LENGTH,
  assertDecisionComment,
  checkDepositUpload,
  depositStorageKey,
  requirementNotification,
  resolveReceivedAt,
  statusAfterDeposit,
  type ClientNotificationDraft,
} from "../services/caseDesk";

/**
 * Traitement des pièces d'un dossier par l'équipe (vue « Pièces du dossier ») : dépôt d'un document remis en agence,
 * décision sur une pièce, ajout d'une pièce. Chaque action est tracée et prévient le candidat dans son espace.
 * Accès : session administrateur valide, comme les autres procédures d'administration.
 */

const adminInput = z.object({ sessionToken: z.string().min(1).max(512), candidateId: z.string().min(1) });

async function loadContext(input: { sessionToken: string; candidateId: string }) {
  const admin = await requireValidAdminSession(input.sessionToken);
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  const reference = parseAdminCandidateReference(input.candidateId);
  if (!reference) throw new TRPCError({ code: "BAD_REQUEST", message: "Référence candidat invalide." });
  const operationalCase = await ensureOperationalCase(db, reference);
  return { admin, db, operationalCase };
}

async function loadRequirement(db: any, caseId: number, requirementId: number) {
  const [requirement] = await db
    .select()
    .from(documentRequirements)
    .where(and(eq(documentRequirements.id, requirementId), eq(documentRequirements.caseId, caseId)))
    .limit(1);
  if (!requirement) throw new TRPCError({ code: "NOT_FOUND", message: "Pièce introuvable dans ce dossier." });
  return requirement;
}

/** Notification de l'espace candidat : au mieux, sans jamais faire échouer l'action de l'équipe. */
async function notifyCandidate(db: any, operationalCase: { id: number; candidateId: number | null }, draft: ClientNotificationDraft) {
  if (!operationalCase.candidateId) return;
  try {
    await db.insert(clientNotifications).values({
      candidateId: operationalCase.candidateId,
      caseId: operationalCase.id,
      type: draft.type,
      title: draft.title.slice(0, 255),
      body: draft.body,
      actionUrl: "/mon-espace?section=documents",
      isRead: false,
    });
  } catch (error) {
    console.warn("[adminCaseDesk] notification candidat non enregistrée", error instanceof Error ? error.message : error);
  }
}

const decisionInput = adminInput.extend({
  requirementId: z.number().int().positive(),
  status: z.enum(["pending", "approved", "rejected", "waived"]),
  comment: z.string().max(1000).optional(),
});

export const adminCaseDeskRouter = router({
  /** Dépôt, par l'équipe, d'un document remis en agence par le client : visible dans son espace. */
  depositDocument: publicProcedure
    .input(
      adminInput.extend({
        requirementId: z.number().int().positive().optional(),
        documentType: z.string().trim().min(2).max(100).optional(),
        fileName: z.string().min(1).max(255),
        base64: z.string().min(4).max(DEPOSIT_MAX_BASE64_LENGTH),
        receivedAt: z.string().max(10).optional(),
        note: z.string().max(500).optional(),
        validate: z.boolean().default(false),
      }).refine((value) => Boolean(value.requirementId || value.documentType), { message: "Indiquez la pièce concernée." }),
    )
    .mutation(async ({ input }) => {
      const { admin, db, operationalCase } = await loadContext(input);
      const requirement = input.requirementId ? await loadRequirement(db, operationalCase.id, input.requirementId) : null;
      const documentType = (requirement?.documentType ?? input.documentType ?? "").trim();

      const checked = checkDepositUpload({ fileName: input.fileName, base64: input.base64 });
      if (!checked.ok) throw new TRPCError({ code: "BAD_REQUEST", message: (checked as { message: string }).message });
      let note: string | null;
      try {
        note = assertDecisionComment("approved", input.note);
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Note invalide." });
      }

      const receivedAt = resolveReceivedAt(input.receivedAt);
      const key = depositStorageKey({ caseId: operationalCase.id, requirementId: requirement?.id ?? null, fileName: checked.fileName });
      const stored = await storagePut(key, checked.bytes, checked.mime);

      const [{ total }] = await db.select({ total: count() }).from(caseDocuments).where(and(eq(caseDocuments.caseId, operationalCase.id), eq(caseDocuments.documentType, documentType)));
      const inserted = await db.insert(caseDocuments).values({
        caseId: operationalCase.id,
        candidateId: operationalCase.candidateId,
        documentType,
        fileName: checked.fileName,
        fileKey: stored.key,
        mimeType: checked.mime,
        fileSizeBytes: checked.bytes.length,
        uploadedByRole: "agency",
        reviewStatus: input.validate ? "approved" : "received",
        reviewNote: note,
        versionNo: Number(total) + 1,
        uploadedAt: receivedAt,
        reviewedAt: input.validate ? new Date() : null,
      });
      const documentId = Number((inserted as any)?.[0]?.insertId ?? 0);

      const status = statusAfterDeposit(input.validate);
      if (requirement) {
        await db.update(documentRequirements).set({ status, validatedAt: input.validate ? new Date() : null, rejectedAt: null }).where(eq(documentRequirements.id, requirement.id));
      } else {
        // pièce hors checklist : elle y est ajoutée, pour que le candidat la voie dans son suivi
        await db.insert(documentRequirements).values({ caseId: operationalCase.id, documentType, isRequired: true, status, adminComment: note, validatedAt: input.validate ? new Date() : null });
      }

      await db.insert(caseActivityLogs).values({
        caseId: operationalCase.id,
        actorRole: "admin",
        actorId: admin.id,
        actionType: "document_deposited_by_agency",
        entityType: "document_requirement",
        entityId: String(requirement?.id ?? ""),
        description: `Document remis en agence et déposé par l’équipe : ${documentType}${input.validate ? " (validé sur place)" : " (à vérifier)"}.`,
      });
      await notifyCandidate(db, operationalCase, requirementNotification({ kind: input.validate ? "deposited_validated" : "deposited", documentType }));
      return { success: true, documentId, status };
    }),

  /** Décision de l'équipe sur une pièce : validée, à corriger (commentaire obligatoire), non requise, ou de nouveau demandée. */
  setRequirementStatus: publicProcedure.input(decisionInput).mutation(async ({ input }) => {
    const { admin, db, operationalCase } = await loadContext(input);
    const requirement = await loadRequirement(db, operationalCase.id, input.requirementId);
    let comment: string | null;
    try {
      comment = assertDecisionComment(input.status, input.comment);
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Commentaire invalide." });
    }
    const now = new Date();
    await db
      .update(documentRequirements)
      .set({
        status: input.status,
        adminComment: comment ?? (input.status === "approved" ? null : requirement.adminComment),
        validatedAt: input.status === "approved" ? now : null,
        rejectedAt: input.status === "rejected" ? now : null,
      })
      .where(eq(documentRequirements.id, requirement.id));
    await db.insert(caseActivityLogs).values({
      caseId: operationalCase.id,
      actorRole: "admin",
      actorId: admin.id,
      actionType: `requirement_${input.status}`,
      entityType: "document_requirement",
      entityId: String(requirement.id),
      description: `Pièce « ${requirement.documentType} » : ${input.status}${comment ? ` — ${comment}` : ""}.`,
    });
    await notifyCandidate(db, operationalCase, requirementNotification({ kind: input.status, documentType: requirement.documentType, comment }));
    return { success: true, status: input.status };
  }),

  /** Ajoute une pièce à la checklist du dossier (une seule, sans passer par la création de checklist complète). */
  addRequirement: publicProcedure
    .input(adminInput.extend({ documentType: z.string().trim().min(2).max(100), comment: z.string().max(500).optional(), dueAt: z.string().max(10).optional() }))
    .mutation(async ({ input }) => {
      const { admin, db, operationalCase } = await loadContext(input);
      const existing = await db.select({ id: documentRequirements.id, documentType: documentRequirements.documentType }).from(documentRequirements).where(eq(documentRequirements.caseId, operationalCase.id));
      if (existing.some((item: { documentType: string }) => item.documentType.trim().toLowerCase() === input.documentType.trim().toLowerCase())) {
        throw new TRPCError({ code: "CONFLICT", message: "Cette pièce figure déjà dans la checklist." });
      }
      let comment: string | null;
      try {
        comment = assertDecisionComment("pending", input.comment);
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Commentaire invalide." });
      }
      const dueAt = input.dueAt && /^\d{4}-\d{2}-\d{2}$/.test(input.dueAt) ? new Date(`${input.dueAt}T12:00:00.000Z`) : null;
      await db.insert(documentRequirements).values({ caseId: operationalCase.id, documentType: input.documentType.trim(), isRequired: true, status: "pending", adminComment: comment, dueAt });
      await db.insert(caseActivityLogs).values({ caseId: operationalCase.id, actorRole: "admin", actorId: admin.id, actionType: "requirement_added", entityType: "document_requirement", description: `Pièce ajoutée à la checklist : ${input.documentType.trim()}.` });
      await notifyCandidate(db, operationalCase, requirementNotification({ kind: "pending", documentType: input.documentType, comment }));
      return { success: true };
    }),
});
