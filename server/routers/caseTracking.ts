import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { insuranceRequests } from "../../drizzle/schema";
import { caseDocuments, cases, caseStatusHistory, clientNotifications, documentRequirements } from "../../drizzle/caseTrackingSchema";
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
      unreadNotifications: notifications.filter(item => !item.isRead).length,
    };
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
});
