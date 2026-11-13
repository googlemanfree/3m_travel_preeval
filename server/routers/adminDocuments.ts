import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { backfill, checklistFor_, ensureDocumentIntakeTable, inspectNow, overview, setExpiry, setVerification } from "../services/documentIntakeStore";
import { requireValidAdminSession } from "./adminAuth";

/** Documents des dossiers (administrateur) : vue par problème, détail d'une évaluation, contrôle des pièces déjà reçues, vérification, validité. */
const token = z.object({ sessionToken: z.string().min(1).max(512) });

async function database() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  await ensureDocumentIntakeTable(db);
  return db;
}
const asBadRequest = (error: unknown): never => { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Action impossible." }); };

export const adminDocumentsRouter = router({
  overview: publicProcedure.input(token.extend({ filter: z.enum(["a_mettre_a_jour", "manquant", "doublon", "non_controle", "tous"]).default("a_mettre_a_jour"), search: z.string().trim().max(120).optional() })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    return overview(await database(), input.filter, input.search);
  }),
  detail: publicProcedure.input(token.extend({ evaluationId: z.number().int().positive() })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const checklist = await checklistFor_(await database(), input.evaluationId);
    if (!checklist) throw new TRPCError({ code: "NOT_FOUND", message: "Évaluation introuvable." });
    return { projectKind: checklist.projectKind, items: checklist.items, documents: checklist.documents.map((doc) => ({ ...doc, uploadedAt: doc.uploadedAt.toISOString() })) };
  }),
  /** Contrôle les documents reçus avant cette fonction, par lots de 40 au plus. */
  backfill: publicProcedure.input(token.extend({ limit: z.number().int().min(1).max(40).default(40) })).mutation(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    return backfill(await database(), input.limit);
  }),
  inspectNow: publicProcedure.input(token.extend({ source: z.enum(["evaluation_cv", "client_document"]), refId: z.number().int().positive() })).mutation(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const result = await inspectNow(await database(), input.source, input.refId);
    if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Fichier introuvable ou inaccessible dans le stockage." });
    return result;
  }),
  setVerification: publicProcedure.input(token.extend({ intakeId: z.number().int().positive(), verification: z.enum(["non_verifie", "verifie", "a_remplacer"]), note: z.string().trim().max(500).nullable().optional() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    try { return { ok: await setVerification(await database(), input.intakeId, input.verification, input.note ?? null, admin.email) }; } catch (error) { return asBadRequest(error); }
  }),
  setExpiry: publicProcedure.input(token.extend({ intakeId: z.number().int().positive(), expiresOn: z.string().max(10).nullable() })).mutation(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    try { return { ok: await setExpiry(await database(), input.intakeId, input.expiresOn) }; } catch (error) { return asBadRequest(error); }
  }),
});
