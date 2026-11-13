import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { applyFixes, buildAuditReport, listBatches, previewFixes, revertBatch } from "../services/dataCoherenceAudit";
import { requireValidAdminSession } from "./adminAuth";

/** Cohérence des données (administrateur) : rapport en lecture seule, aperçu des corrections, application en lot confirmée, annulation. */
const token = z.object({ sessionToken: z.string().min(1).max(512) });

async function database() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  return db;
}

export const adminDataCoherenceRouter = router({
  report: publicProcedure.input(token).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    return buildAuditReport(await database());
  }),
  preview: publicProcedure.input(token).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    return previewFixes(await database());
  }),
  applyBatch: publicProcedure.input(token.extend({ expectedChanges: z.number().int().min(1).max(5000), confirm: z.literal("APPLIQUER") })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    try {
      return await applyFixes(await database(), admin.email, input.expectedChanges);
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Application impossible." });
    }
  }),
  batches: publicProcedure.input(token).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    return listBatches(await database());
  }),
  revert: publicProcedure.input(token.extend({ batchId: z.string().min(8).max(40), confirm: z.literal("ANNULER") })).mutation(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    return revertBatch(await database(), input.batchId);
  }),
});
