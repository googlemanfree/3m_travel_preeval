import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { applications } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const documentSubmissionRouter = router({
  submitDocuments: publicProcedure
    .input(z.object({
      dossierNumber: z.string(),
      submissionMethod: z.enum(["en_ligne", "agence_physique"]),
      documentsUrls: z.array(z.object({
        type: z.string(),
        url: z.string().url(),
        name: z.string(),
      })).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.dossierNumber, input.dossierNumber))
        .limit(1);

      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });

      if (app.dossierStatus !== "en_attente_documents" && app.dossierStatus !== "en_attente_paiement") {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Ce dossier n'est pas en attente de documents" 
        });
      }

      await db.update(applications)
        .set({
          documentsSubmissionMethod: input.submissionMethod,
          documentsReceivedAt: new Date(),
          dossierStatus: "documents_recus",
          adminNote: input.notes ? `[Documents reçus] ${input.notes}` : "[Documents reçus]",
        })
        .where(eq(applications.id, app.id));

      return {
        success: true,
        message: "Documents reçus avec succès. Nous procédons à la vérification.",
        dossierNumber: input.dossierNumber,
      };
    }),

  getDocumentSubmissionStatus: publicProcedure
    .input(z.object({ dossierNumber: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.dossierNumber, input.dossierNumber))
        .limit(1);

      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable" });

      return {
        dossierNumber: app.dossierNumber,
        status: app.dossierStatus,
        submissionMethod: app.documentsSubmissionMethod,
        documentsReceivedAt: app.documentsReceivedAt,
        documentsVerifiedAt: app.documentsVerifiedAt,
      };
    }),

  verifyDocuments: protectedProcedure
    .input(z.object({
      applicationId: z.number().int(),
      verified: z.boolean(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);

      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });

      const newStatus = input.verified ? "soumis_agences" : "en_attente_documents";

      await db.update(applications)
        .set({
          documentsVerifiedAt: new Date(),
          documentsVerifiedBy: ctx.user.name || "Admin",
          dossierStatus: newStatus,
          adminNote: input.notes || (input.verified ? "Documents verifies et acceptes" : "Documents rejetes"),
        })
        .where(eq(applications.id, input.applicationId));

      return {
        success: true,
        message: input.verified ? "Documents verified and application submitted to partners" : "Documents rejected",
      };
    }),
});
