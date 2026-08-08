/**
import { generateDossierNumber } from "../services/dossierNumberService";
 * Routeur tRPC — Gestion des Applications (Dossiers d'Immigration)
 * Création, suivi et gestion des dossiers d'immigration
 */

import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import { applications } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
 * Générer un numéro de dossier unique : 3M-YYYY-NNNN
export const applicationRouter = router({
  /**
   * Créer une nouvelle application
   */
  create: publicProcedure
    .input(z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      whatsappNumber: z.string().min(5),
      destination: z.enum(["canada", "luxembourg", "pologne", "europe", "golfe", "oceanie", "caucase", "autre"]),
      formulaChosen: z.enum(["integral", "echelonne", "garanti"]).default("integral"),
      nationality: z.string().optional(),
      age: z.number().optional(),
      academicLevel: z.string().optional(),
      experienceYears: z.number().optional(),
      jobSector: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });
      try {
        const dossierNumber = generateDossierNumber();
        const result = await db.insert(applications).values({
          dossierNumber,
          fullName: input.fullName,
          email: input.email,
          whatsappNumber: input.whatsappNumber,
          destination: input.destination,
          formulaChosen: input.formulaChosen,
          nationality: input.nationality,
          age: input.age,
          academicLevel: input.academicLevel,
          experienceYears: input.experienceYears,
          jobSector: input.jobSector,
          dossierStatus: "nouveau",
          paymentStatus: "PENDING",
          emailVerified: false,
          agreementSigned: false,
        });
        return {
          success: true,
          message: "Application créée avec succès",
        };
      } catch (err) {
        console.error("[Application] Create error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création de l'application",
      }
    }),
   * Récupérer une application par numéro de dossier
  getByDossierNumber: publicProcedure
      dossierNumber: z.string(),
    .query(async ({ input }) => {
        const app = await db
          .select()
          .from(applications)
          .where(eq(applications.dossierNumber, input.dossierNumber))
          .limit(1);
        if (app.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Application non trouvée",
          });
        }
        return app[0];
        console.error("[Application] Get by dossier number error:", err);
        if (err instanceof TRPCError) throw err;
          message: "Erreur lors de la récupération de l'application",
   * Récupérer les applications d'un candidat
  getByEmail: publicProcedure
        const apps = await db
          .where(eq(applications.email, input.email))
          .orderBy(desc(applications.createdAt));
        return apps;
        console.error("[Application] Get by email error:", err);
          message: "Erreur lors de la récupération des applications",
   * Mettre à jour le statut d'une application
  updateStatus: protectedProcedure
      dossierStatus: z.enum([
        "nouveau",
        "en_evaluation",
        "bilan_envoye",
        "en_attente_paiement",
        "paye",
        "en_attente_documents",
        "documents_recus",
        "soumis_agences",
        "en_cours_recrutement",
        "contrat_obtenu",
        "visa_approuve",
        "refuse",
      ]),
    .mutation(async ({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent mettre à jour le statut",
        await db
          .update(applications)
          .set({ dossierStatus: input.dossierStatus })
          .where(eq(applications.dossierNumber, input.dossierNumber));
          message: "Statut mis à jour avec succès",
        console.error("[Application] Update status error:", err);
          message: "Erreur lors de la mise à jour du statut",
   * Mettre à jour le statut de paiement
  updatePaymentStatus: protectedProcedure
      paymentStatus: z.enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED"]),
      paymentTransactionId: z.string().optional(),
          message: "Seuls les administrateurs peuvent mettre à jour le paiement",
        const updates: Record<string, any> = {
          paymentStatus: input.paymentStatus,
        if (input.paymentTransactionId) {
          updates.paymentTransactionId = input.paymentTransactionId;
          updates.paymentDate = new Date();
          .set(updates)
          message: "Statut de paiement mis à jour avec succès",
        console.error("[Application] Update payment status error:", err);
          message: "Erreur lors de la mise à jour du paiement",
   * Récupérer toutes les applications (admin)
  getAll: protectedProcedure
      limit: z.number().default(50),
      offset: z.number().default(0),
      status: z.string().optional(),
    .query(async ({ ctx, input }) => {
          message: "Seuls les administrateurs peuvent voir toutes les applications",
        const apps = input.status
          ? await db.select().from(applications)
              .where(eq(applications.dossierStatus, input.status as any))
              .orderBy(desc(applications.createdAt))
              .limit(input.limit)
              .offset(input.offset)
          : await db.select().from(applications)
              .offset(input.offset);
        console.error("[Application] Get all error:", err);
   * Ajouter une note admin
  addAdminNote: protectedProcedure
      note: z.string(),
          message: "Seuls les administrateurs peuvent ajouter des notes",
          .set({ adminNote: input.note })
          message: "Note ajoutée avec succès",
        console.error("[Application] Add admin note error:", err);
          message: "Erreur lors de l'ajout de la note",
});
export default applicationRouter;
