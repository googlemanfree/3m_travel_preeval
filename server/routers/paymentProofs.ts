import { desc, eq, like } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { candidateFiles, candidates } from "../../drizzle/schema";
import { PROOF_NAME_PREFIX } from "../../shared/paymentProof";
import { getDb } from "../db";
import { storageGetSignedUrl } from "../storage";
import { publicProcedure, router } from "../_core/trpc";
import { requireValidAdminSession } from "./adminAuth";

export const paymentProofsRouter = router({
  /**
   * Preuves de paiement envoyées par les clients (captures, reçus), les plus récentes d'abord, avec un lien de consultation.
   * Lecture seule : une preuve ne valide jamais un paiement ; le comptoir vérifie la réception puis valide lui-même.
   */
  listForAdmin: publicProcedure.input(z.object({ sessionToken: z.string().min(1).max(512) })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const rows = await db
      .select({ id: candidateFiles.id, candidateId: candidateFiles.candidateId, fileName: candidateFiles.fileName, fileKey: candidateFiles.fileKey, uploadedAt: candidateFiles.uploadedAt, mimeType: candidateFiles.mimeType, email: candidates.email, fullName: candidates.fullName })
      .from(candidateFiles)
      .leftJoin(candidates, eq(candidates.id, candidateFiles.candidateId))
      .where(like(candidateFiles.fileName, `${PROOF_NAME_PREFIX}%`))
      .orderBy(desc(candidateFiles.uploadedAt))
      .limit(500);
    const items = await Promise.all(rows.map(async (row) => {
      let url: string | null = null;
      try {
        url = await storageGetSignedUrl(row.fileKey.replace(/^\/manus-storage\//, ""));
      } catch {
        url = null;
      }
      return { id: row.id, candidateId: row.candidateId, candidateEmail: row.email ?? "", fullName: row.fullName ?? "", fileName: row.fileName, mimeType: row.mimeType, uploadedAt: row.uploadedAt.toISOString(), url };
    }));
    return { count: items.length, items };
  }),
});
