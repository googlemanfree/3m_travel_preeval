import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { insuranceRequests } from "../../drizzle/schema";
import { caseActivityLogs, caseDocuments, cases, caseStatusHistory, clientNotifications, documentRequirements } from "../../drizzle/caseTrackingSchema";
import { getDb } from "../db";
import { storageGetSignedUrl } from "../storage";
import { router } from "../_core/trpc";
import { candidateProcedure } from "./candidate";

export const caseTrackingRouter = router({
  getMyCases: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const ownedCases = await db.select().from(cases).where(eq(cases.candidateId, ctx.candidate.id)).orderBy(desc(cases.updatedAt));
    if (!ownedCases.length) return { cases: [], notifications: [], unreadNotifications: 0 };
    const ids = ownedCases.map(item => item.id);
    const [requirements, documents, history, notifications] = await Promise.all([
      db.select().from(documentRequirements).where(inArray(documentRequirements.caseId, ids)),
      db.select().from(caseDocuments).where(inArray(caseDocuments.caseId, ids)),
      db.select().from(caseStatusHistory).where(inArray(caseStatusHistory.caseId, ids)).orderBy(desc(caseStatusHistory.createdAt)),
      db.select().from(clientNotifications).where(eq(clientNotifications.candidateId, ctx.candidate.id)).orderBy(desc(clientNotifications.createdAt)),
    ]);
    return {
      cases: ownedCases.map(item => ({ ...item, requirements: requirements.filter(x => x.caseId === item.id), documents: documents.filter(x => x.caseId === item.id), history: history.filter(x => x.caseId === item.id) })),
      notifications,
      unreadNotifications: notifications.filter(item => !item.isRead && !item.isArchived).length,
    };
  }),

  submitMyRequirementDocument: candidateProcedure.input(z.object({
    requirementId: z.number().int().positive(),
    fileName: z.string().trim().min(1).max(255),
    fileKey: z.string().trim().min(1).max(512),
    mimeType: z.string().trim().min(1).max(100),
    fileSizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
    correctionComment: z.string().trim().min(3).max(1000).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

    const [requirement] = await db
      .select({
        id: documentRequirements.id,
        caseId: documentRequirements.caseId,
        documentType: documentRequirements.documentType,
        status: documentRequirements.status,
      })
      .from(documentRequirements)
      .innerJoin(cases, and(eq(documentRequirements.caseId, cases.id), eq(cases.candidateId, ctx.candidate.id)))
      .where(eq(documentRequirements.id, input.requirementId))
      .limit(1);

    if (!requirement) throw new TRPCError({ code: "NOT_FOUND", message: "Pièce demandée introuvable ou non autorisée." });
    if (requirement.status === "approved" || requirement.status === "waived") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Cette pièce ne nécessite plus de dépôt." });
    }

    const result = await db.insert(caseDocuments).values({
      caseId: requirement.caseId,
      candidateId: ctx.candidate.id,
      documentType: requirement.documentType,
      fileName: input.fileName,
      fileKey: input.fileKey,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      uploadedByRole: "candidate",
      reviewStatus: "pending",
      reviewNote: input.correctionComment ?? null,
    });
    await db.update(documentRequirements).set({ status: "received" }).where(eq(documentRequirements.id, requirement.id));
    await db.insert(caseActivityLogs).values({
      caseId: requirement.caseId,
      actorRole: "candidate",
      actorId: ctx.candidate.id,
      actionType: "document_submitted",
      entityType: "document_requirement",
      entityId: String(requirement.id),
      description: input.correctionComment ? `Pièce déposée : ${requirement.documentType}. Commentaire candidat : ${input.correctionComment}` : `Pièce déposée : ${requirement.documentType}`,
    });

    return { success: true, documentId: Number((result as any)[0]?.insertId || 0), requirementId: requirement.id };
  }),

  downloadMyDocument: candidateProcedure.input(z.object({ documentId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const rows = await db.select({ fileKey: caseDocuments.fileKey, fileName: caseDocuments.fileName }).from(caseDocuments).innerJoin(cases, and(eq(caseDocuments.caseId, cases.id), eq(cases.candidateId, ctx.candidate.id))).where(eq(caseDocuments.id, input.documentId)).limit(1);
    if (!rows[0]?.fileKey) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable ou non autorisé." });
    return { url: await storageGetSignedUrl(rows[0].fileKey), fileName: rows[0].fileName };
  }),

  getMyInsuranceRequests: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    return db.select({ id: insuranceRequests.id, reference: insuranceRequests.reference, destinationCountry: insuranceRequests.destinationCountry, departureDate: insuranceRequests.departureDate, returnDate: insuranceRequests.returnDate, coveragePlan: insuranceRequests.coveragePlan, status: insuranceRequests.status, attestationFileName: insuranceRequests.attestationFileName, createdAt: insuranceRequests.createdAt }).from(insuranceRequests).where(eq(insuranceRequests.email, ctx.candidate.email)).orderBy(desc(insuranceRequests.createdAt));
  }),

  downloadMyInsuranceAttestation: candidateProcedure.input(z.object({ insuranceRequestId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const rows = await db.select({ fileKey: insuranceRequests.attestationFileKey, fileName: insuranceRequests.attestationFileName }).from(insuranceRequests).where(and(eq(insuranceRequests.id, input.insuranceRequestId), eq(insuranceRequests.email, ctx.candidate.email))).limit(1);
    if (!rows[0]?.fileKey) throw new TRPCError({ code: "NOT_FOUND", message: "Attestation introuvable ou non autorisée." });
    return { url: await storageGetSignedUrl(rows[0].fileKey), fileName: rows[0].fileName };
  }),

  markNotificationRead: candidateProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    await db.update(clientNotifications).set({ isRead: true }).where(and(eq(clientNotifications.id, input.notificationId), eq(clientNotifications.candidateId, ctx.candidate.id)));
    return { success: true };
  }),

  markNotificationUnread: candidateProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    await db.update(clientNotifications).set({ isRead: false }).where(and(eq(clientNotifications.id, input.notificationId), eq(clientNotifications.candidateId, ctx.candidate.id)));
    return { success: true };
  }),

  setNotificationArchived: candidateProcedure.input(z.object({ notificationId: z.number().int().positive(), archived: z.boolean() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    await db.update(clientNotifications).set({ isArchived: input.archived }).where(and(eq(clientNotifications.id, input.notificationId), eq(clientNotifications.candidateId, ctx.candidate.id)));
    return { success: true, archived: input.archived };
  }),
});
