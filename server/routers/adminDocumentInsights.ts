import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { z } from "zod";
import { candidateFiles, clientDocuments } from "../../drizzle/schema";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requireValidAdminSession } from "./adminAuth";
import { DOCUMENT_REJECTION_REASONS, countRejectionReasons } from "../../shared/documentRejectionReasons";
import { averageVerificationHours, findDuplicateGroups } from "../../shared/documentInsights";

const WINDOW_DAYS = 90;

/** Indicateurs sur les pièces (admin) : motifs de renvoi, délai de vérification, pièces en double. */
export const adminDocumentInsightsRouter = router({
  stats: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1).max(512) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });

      const since = new Date(Date.now() - WINDOW_DAYS * 24 * 3600 * 1000);
      const [rejectedCandidateFiles, decidedClientDocuments] = await Promise.all([
        db.select({ comment: candidateFiles.rejectionReason }).from(candidateFiles)
          .where(and(eq(candidateFiles.status, "rejected"), gte(candidateFiles.uploadedAt, since)))
          .orderBy(desc(candidateFiles.uploadedAt)).limit(5000),
        db.select({ comment: clientDocuments.verificationComment, status: clientDocuments.verificationStatus, uploadedAt: clientDocuments.uploadedAt, verifiedAt: clientDocuments.verifiedAt })
          .from(clientDocuments)
          .where(and(inArray(clientDocuments.verificationStatus, ["approved", "rejected"]), gte(clientDocuments.uploadedAt, since)))
          .orderBy(desc(clientDocuments.uploadedAt)).limit(5000),
      ]);

      const rejectionComments = [
        ...rejectedCandidateFiles.map((row) => row.comment),
        ...decidedClientDocuments.filter((row) => row.status === "rejected").map((row) => row.comment),
      ];
      const counts = countRejectionReasons(rejectionComments);
      const reasons = [
        ...DOCUMENT_REJECTION_REASONS.map((reason) => ({ code: reason.code as string, label: reason.label, count: counts[reason.code] })),
        { code: "libre", label: "Commentaire libre", count: counts.libre },
      ].filter((reason) => reason.count > 0).sort((a, b) => b.count - a.count);

      const verification = averageVerificationHours(decidedClientDocuments);
      return {
        windowDays: WINDOW_DAYS,
        totalRejected: rejectionComments.length,
        reasons,
        averageVerificationHours: verification.averageHours,
        verifiedSampleSize: verification.count,
      };
    }),

  duplicates: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1).max(512), candidateId: z.number().int().positive() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const files = await db
        .select({ id: candidateFiles.id, fileType: candidateFiles.fileType, fileName: candidateFiles.fileName, fileSizeBytes: candidateFiles.fileSizeBytes, status: candidateFiles.status, uploadedAt: candidateFiles.uploadedAt })
        .from(candidateFiles)
        .where(eq(candidateFiles.candidateId, input.candidateId))
        .orderBy(desc(candidateFiles.uploadedAt))
        .limit(500);
      return { groups: findDuplicateGroups(files) };
    }),
});
